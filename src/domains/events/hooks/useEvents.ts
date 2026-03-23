import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Event } from '@/domains/events/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;

type EventListParams = Record<string, string | number | boolean | string[] | undefined>;

const normalizeEvent = (item: Event): Event => {
    const id = item._id || item.id || '';
    const name = item.title || item.name;
    const date = item.startAt || item.date;
    const venue = item.venue;

    const lat = typeof venue === 'object' ? venue?.lat : undefined;
    const lng = typeof venue === 'object' ? venue?.lng : undefined;

    return {
        ...item,
        _id: id,
        name,
        date,
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
                return cached ?? [];
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
                        return { items: cached, nextPage: undefined };
                    }
                }
                return { items: [], nextPage: undefined };
            }
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
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
