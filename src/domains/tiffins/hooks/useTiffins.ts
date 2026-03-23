import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Tiffin, TiffinDetail } from '@/domains/tiffins/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;

type TiffinListParams = Record<string, string | number | boolean | string[] | undefined>;

type TiffinApiResponse = {
    success?: boolean;
    tiffins?: Tiffin[];
    data?: Tiffin[];
};

const normalizeTiffin = (item: Tiffin): Tiffin => {
    const name = item.kitchenName || item.name;
    const images = item.images || (item.imageUrl ? [item.imageUrl] : []);

    return {
        ...item,
        _id: item._id || item.id || '',
        name,
        imageUrl: item.imageUrl || images[0],
        images,
        coverageAreas: item.deliveryCity || item.coverageAreas,
        scheduleDays: item.menu?.serviceDays || item.scheduleDays,
    } as Tiffin;
};

export const useTiffins = (params?: TiffinListParams) => {
    return useQuery({
        queryKey: ['tiffins', params],
        queryFn: async () => {
            try {
                const response = await apiClient.get<TiffinApiResponse>(ENDPOINTS.tiffins.list, { params });
                const payload = response.data?.tiffins ?? response.data?.data ?? response.data;
                const items = Array.isArray(payload) ? payload : [];
                const normalized = items.map((item) => normalizeTiffin(item));
                await storage.saveCache('tiffins:list', normalized);
                return normalized;
            } catch (error) {
                const cached = await storage.getCache<Tiffin[]>('tiffins:list', LIST_CACHE_TTL);
                return cached ?? [];
            }
        },
    });
};

export const useTiffinsInfinite = (params?: TiffinListParams) => {
    return useInfiniteQuery({
        queryKey: ['tiffins-infinite', params],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                const response = await apiClient.get<TiffinApiResponse>(ENDPOINTS.tiffins.list, {
                    params: { ...params, page: pageParam, limit: 10 },
                });
                const payload = response.data?.tiffins ?? response.data?.data ?? response.data;
                const items = Array.isArray(payload) ? payload : [];
                const normalized = items.map((item) => normalizeTiffin(item));

                if (pageParam === 1) {
                    await storage.saveCache('tiffins:list', normalized);
                }

                return {
                    items: normalized,
                    nextPage: items.length >= 10 ? pageParam + 1 : undefined,
                };
            } catch (error) {
                if (pageParam === 1) {
                    const cached = await storage.getCache<Tiffin[]>('tiffins:list', LIST_CACHE_TTL);
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

export const useTiffinsOpenNow = () => {
    return useQuery({
        queryKey: ['tiffins-open-now'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.openNow);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

export const useTiffinsHighRated = () => {
    return useQuery({
        queryKey: ['tiffins-high-rated'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.highRated);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

export const useTiffinsByKitchenName = (kitchenName?: string) => {
    return useTiffins(kitchenName ? { kitchenName } : undefined);
};

export const useTiffinDetail = (id: string) => {
    return useQuery({
        queryKey: ['tiffin', id],
        queryFn: async () => {
            const response = await apiClient.get<TiffinDetail>(ENDPOINTS.tiffins.detail(id));
            return normalizeTiffin((response.data as TiffinDetail) ?? (response.data?.data as TiffinDetail));
        },
        enabled: !!id,
    });
};

export const useTiffinOffers = (id: string) => {
    return useQuery({
        queryKey: ['tiffin-offers', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.offers(id));
            return data?.data ?? data;
        },
        enabled: !!id,
    });
};

export const useTiffinFavorites = () => {
    return useQuery({
        queryKey: ['tiffin-favorites'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.favorites);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

type PaginationParams = { page?: number; limit?: number };

export const useTiffinFavoriteOrders = (params?: PaginationParams) => {
    const queryParams = { type: 'Tiffin', ...(params || {}) };
    return useQuery({
        queryKey: ['tiffin-favorite-orders', queryParams],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.favoriteOrders, { params: queryParams });
            return data?.data ?? data;
        },
    });
};

export const useToggleTiffinOrderFavorite = () => {
    return useMutation({
        mutationFn: async (orderId: string) => {
            const { data } = await apiClient.put(ENDPOINTS.tiffins.toggleOrderFavorite(orderId));
            return data?.data ?? data;
        },
    });
};

export const useTiffinRecentlyViewed = () => {
    return useQuery({
        queryKey: ['tiffin-recently-viewed'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.recentlyViewed);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

export const useTrackTiffinRecentlyViewed = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(ENDPOINTS.tiffins.trackRecentlyViewed(id));
            return data?.data ?? data;
        },
    });
};
