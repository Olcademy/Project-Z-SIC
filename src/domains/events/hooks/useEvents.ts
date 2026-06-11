import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/domains/events/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';
import { mockEvents } from '@/domains/events/Mockdata/mockData';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;

type EventListParams = Record<string, string | number | boolean | string[] | undefined>;

const normalizeEvent = (item: Event): Event => {
    const id = item._id || item.id || '';
    const name = item.name || item.title || '';
    const date = item.startAt || item.date;

    const venue = item.venue;
    const venueLat = typeof venue === 'object' ? venue?.lat : undefined;
    const venueLng = typeof venue === 'object' ? venue?.lng : undefined;
    const venueAddress = typeof venue === 'object' ? venue?.address : undefined;

    const location = item.location ?? { lat: venueLat, lng: venueLng, address: venueAddress };

    return { ...item, _id: id, name, date, location } as Event;
};

const normalizedMockEvents: Event[] = (mockEvents as unknown as Event[]).map(normalizeEvent);
const mockEventIds = new Set(normalizedMockEvents.map((e) => e._id));

// ─── KEY FIX ──────────────────────────────────────────────────────────────────
// Merge API + ALL mock events, dedup by _id (API wins on clash)
// This runs on EVERY page flatten so no mock event is ever lost
const mergeWithMock = (apiItems: Event[]): Event[] => {
    const apiIds = new Set(apiItems.map((e) => e._id).filter(Boolean));
    const mockOnly = normalizedMockEvents.filter((e) => !apiIds.has(e._id));
    return [...apiItems, ...mockOnly];
};

// ─────────────────────────────────────────────
// useEvents — non-paginated
// ─────────────────────────────────────────────
export const useEvents = (params?: EventListParams) => {
    return useQuery({
        queryKey: ['events', params],
        queryFn: async (): Promise<Event[]> => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.list, { params });
                const payload = data?.data ?? data;
                const items = Array.isArray(payload) ? (payload as Event[]).map(normalizeEvent) : [];
                const merged = mergeWithMock(items);
                await storage.saveCache('events:list', merged);
                return merged;
            } catch {
                const cached = await storage.getCache<Event[]>('events:list', LIST_CACHE_TTL);
                return cached ?? normalizedMockEvents;
            }
        },
    });
};

// ─────────────────────────────────────────────
// useEventsInfinite — paginated
// FIX: mock events appended on page 1 only via mergeWithMock.
// Screen flattens all pages — so ALL mock + API events always present.
// ─────────────────────────────────────────────
export const useEventsInfinite = (params?: EventListParams) => {
    return useInfiniteQuery({
        queryKey: ['events-infinite', params],
        queryFn: async ({ pageParam = 1 }): Promise<{ items: Event[]; nextPage: number | undefined }> => {
            let apiItems: Event[] = [];
            let apiHasMore = false;

            try {
                const { data } = await apiClient.get(ENDPOINTS.events.list, {
                    params: { ...params, page: pageParam, limit: 10 },
                });
                const payload = data?.data ?? data;
                apiItems = Array.isArray(payload)
                    ? (payload as Event[]).map(normalizeEvent)
                    : [];
                apiHasMore = apiItems.length >= 10;
            } catch {
                if (pageParam === 1) {
                    const cached = await storage.getCache<Event[]>('events:list', LIST_CACHE_TTL);
                    if (cached) apiItems = cached;
                }
            }

            // Mock events are only appended on page 1 to avoid duplication across pages.
            // mergeWithMock deduplicates by _id so API events always win.
            const items = pageParam === 1 ? mergeWithMock(apiItems) : apiItems;

            if (pageParam === 1) {
                await storage.saveCache('events:list', items);
            }

            return {
                items,
                nextPage: apiHasMore ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
    });
};

// ─────────────────────────────────────────────
// useEventDetail
// ─────────────────────────────────────────────
export const useEventDetail = (id: string) => {
    const isMockId = mockEventIds.has(id);

    return useQuery({
        queryKey: ['event', id],
        queryFn: async (): Promise<Event | undefined> => {
            if (isMockId) {
                return normalizedMockEvents.find((e) => e._id === id);
            }
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.detail(id));
                const payload = (data?.data ?? data) as Event;
                return normalizeEvent(payload);
            } catch {
                return normalizedMockEvents.find((e) => e._id === id);
            }
        },
        enabled: !!id,
    });
};

// ─────────────────────────────────────────────
// useEventFeatured
// ─────────────────────────────────────────────
export const useEventFeatured = () => {
    return useQuery({
        queryKey: ['events-featured'],
        queryFn: async (): Promise<Event[]> => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.featured);
                const payload = data?.data ?? data;
                const apiItems = Array.isArray(payload) ? (payload as Event[]).map(normalizeEvent) : [];
                return apiItems.length > 0 ? apiItems : normalizedMockEvents.slice(0, 6);
            } catch {
                return normalizedMockEvents.slice(0, 6);
            }
        },
    });
};

// ─────────────────────────────────────────────
// useEventSearch
// ─────────────────────────────────────────────
export const useEventSearch = (query?: string) => {
    return useQuery({
        queryKey: ['events-search', query],
        queryFn: async (): Promise<Event[]> => {
            if (!query) return [];
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.search, { params: { q: query } });
                const payload = data?.data ?? data;
                const apiItems = Array.isArray(payload) ? (payload as Event[]).map(normalizeEvent) : [];
                if (apiItems.length > 0) return apiItems;
                throw new Error('empty');
            } catch {
                const lower = query.toLowerCase();
                return normalizedMockEvents.filter((e) =>
                    [e.name, e.title, e.description, e.category]
                        .filter(Boolean).join(' ').toLowerCase().includes(lower)
                );
            }
        },
        enabled: !!query,
    });
};

// ─────────────────────────────────────────────
// Shared favorites store
// ─────────────────────────────────────────────
type Listener = () => void;
const favoritesSet = new Set<string>();
const favListeners = new Set<Listener>();

const notifyFavListeners = () => favListeners.forEach((l) => l());

const toggleFavoriteStore = (id: string): boolean => {
    if (favoritesSet.has(id)) {
        favoritesSet.delete(id);
        notifyFavListeners();
        return false;
    } else {
        favoritesSet.add(id);
        notifyFavListeners();
        return true;
    }
};

const useFavIds = (): string[] => {
    const [ids, setIds] = useState<string[]>(() => Array.from(favoritesSet));
    useEffect(() => {
        const listener: Listener = () => setIds(Array.from(favoritesSet));
        favListeners.add(listener);
        return () => { favListeners.delete(listener); };
    }, []);
    return ids;
};

export const useLocalEventFavorites = (): { data: string[] } => {
    const ids = useFavIds();
    return { data: ids };
};

export const useLocalEventFavoriteItems = () => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ['local-event-favorite-items'],
        queryFn: async (): Promise<Event[]> => {
            try {
                const stored = await storage.getFavoriteEventItems?.();
                if (stored && stored.length > 0) return stored as Event[];
            } catch {}
            return Array.from(favoritesSet)
                .map((id) => normalizedMockEvents.find((e) => e._id === id))
                .filter(Boolean) as Event[];
        },
    });
};

export const useToggleLocalEventFavorite = () => {
    const [isPending, setIsPending] = useState(false);

    const mutateAsync = useCallback(async (id: string): Promise<{ isFavorited: boolean }> => {
        setIsPending(true);
        try {
            const isFavorited = toggleFavoriteStore(id);
            return { isFavorited };
        } finally {
            setIsPending(false);
        }
    }, []);

    return { mutateAsync, isPending };
};