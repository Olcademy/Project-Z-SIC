import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Event } from '@/domains/events/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;
const LOCAL_EVENT_FAVORITES_KEY = ['local-event-favorites'] as const;
const LOCAL_EVENT_FAVORITE_ITEMS_KEY = ['local-event-favorite-items'] as const;

type EventListParams = Record<string, string | number | boolean | string[] | undefined>;

const normalizeEvent = (item: Event): Event => {
    const id = item._id || item.id || '';
    const name = item.title || item.name;
    const date = item.startAt || item.date;
    const venue = item.venue;

    const imageCandidates = [
        ...(Array.isArray(item.images) ? item.images : []),
        item.imageUrl,
        (item as any).image,
        (item as any).image_url,
        (item as any).bannerImage,
        (item as any).coverImage,
    ];

    const images = imageCandidates
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0);

    const lat = typeof venue === 'object' ? venue?.lat : undefined;
    const lng = typeof venue === 'object' ? venue?.lng : undefined;

    return {
        ...item,
        _id: id,
        name,
        date,
        images,
        imageUrl: item.imageUrl || images[0],
        location: {
            lat,
            lng,
            address: typeof venue === 'object' ? venue?.address : undefined,
        },
    } as Event;
};

export const useEvents = (params?: EventListParams) => {
    return useQuery({
        queryKey: ['events', params],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.list, { params });
                const payload = data?.data ?? data;
                const items = Array.isArray(payload) ? (payload as Event[]) : [];
                const normalized = items.map((item) => normalizeEvent(item as Event & Record<string, unknown>));
                await storage.saveCache('events:list', normalized);
                return normalized;
            } catch (error) {
                const cached = await storage.getCache<Event[]>('events:list', LIST_CACHE_TTL);
                return (cached ?? []).map((item) => normalizeEvent(item as Event & Record<string, unknown>));
            }
        },
    });
};

export const useEventsInfinite = (params?: EventListParams) => {
    return useInfiniteQuery({
        queryKey: ['events-infinite', params],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.events.list, {
                    params: { ...params, page: pageParam, limit: 10 },
                });
                const payload = data?.data ?? data;
                const items = Array.isArray(payload) ? (payload as Event[]) : [];
                const normalized = items.map((item) => normalizeEvent(item as Event & Record<string, unknown>));

                if (pageParam === 1) {
                    await storage.saveCache('events:list', normalized);
                }

                return {
                    items: normalized,
                    nextPage: items.length >= 10 ? pageParam + 1 : undefined,
                };
            } catch (error) {
                if (pageParam === 1) {
                    const cached = await storage.getCache<Event[]>('events:list', LIST_CACHE_TTL);
                    if (cached) {
                        return { items: cached.map((item) => normalizeEvent(item as Event & Record<string, unknown>)), nextPage: undefined };
                    }
                }
                return { items: [], nextPage: undefined };
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
    });
};

export const useLocalEventFavorites = () => {
    return useQuery({
        queryKey: LOCAL_EVENT_FAVORITES_KEY,
        queryFn: async () => storage.getFavoriteEventIds(),
        staleTime: Infinity,
    });
};

export const useLocalEventFavoriteItems = () => {
    return useQuery({
        queryKey: LOCAL_EVENT_FAVORITE_ITEMS_KEY,
        queryFn: async () => storage.getFavoriteEventItems<Event>(),
        staleTime: Infinity,
    });
};

export const useToggleLocalEventFavorite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => storage.toggleFavoriteEventId(id),
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: LOCAL_EVENT_FAVORITES_KEY });
            const prev = queryClient.getQueryData<string[]>(LOCAL_EVENT_FAVORITES_KEY) ?? [];
            const set = new Set(prev);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            const next = Array.from(set);
            queryClient.setQueryData<string[]>(LOCAL_EVENT_FAVORITES_KEY, next);
            return { prev };
        },
        onError: (_err, _id, ctx) => {
            if (ctx?.prev) queryClient.setQueryData<string[]>(LOCAL_EVENT_FAVORITES_KEY, ctx.prev);
        },
        onSuccess: (result) => {
            queryClient.setQueryData<string[]>(LOCAL_EVENT_FAVORITES_KEY, result.ids);
        },
    });
};

export const useEventDetail = (id: string) => {
    return useQuery({
        queryKey: ['event', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.events.detail(id));
            const payload = (data.data || data) as Event;
            return normalizeEvent(payload as Event & Record<string, unknown>);
        },
        enabled: !!id,
    });
};

export const useEventFeatured = () => {
    return useQuery({
        queryKey: ['events-featured'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.events.featured);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? (payload as Event[]) : [];
        },
    });
};

export const useEventSearch = (query?: string) => {
    return useQuery({
        queryKey: ['events-search', query],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.events.search, { params: { q: query } });
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? (payload as Event[]) : [];
        },
        enabled: !!query,
    });
};
