import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Tiffin, TiffinDetail } from '@/domains/tiffins/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';
import { useUser } from '@/ui/context/UserContext';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;

type TiffinListParams = Record<string, string | number | boolean | string[] | undefined>;

type TiffinApiResponse = {
    success?: boolean;
    tiffins?: Tiffin[];
    data?: Tiffin[];
};

type TiffinDetailApiResponse = {
    success?: boolean;
    data?: TiffinDetail;
    tiffin?: TiffinDetail;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null;
};

const normalizeTiffin = (item: Tiffin): Tiffin => {
    const name = item.kitchenName || item.name;
    const imageCandidates = [
        ...(Array.isArray(item.images) ? item.images : []),
        item.imageUrl,
        (item as any).image,
        (item as any).image_url,
        (item as any).coverImage,
        (item as any).bannerImage,
    ];

    const images = imageCandidates
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value.length > 0);
    const serviceDays =
        item.menu && typeof item.menu === 'object' && !Array.isArray(item.menu)
            ? item.menu.serviceDays
            : undefined;

    return {
        ...item,
        _id: item._id || item.id || '',
        name,
        imageUrl: item.imageUrl || images[0],
        images,
        coverageAreas: item.deliveryCity || item.coverageAreas,
        scheduleDays: serviceDays || item.scheduleDays,
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
            const response = await apiClient.get<TiffinDetail | TiffinDetailApiResponse>(ENDPOINTS.tiffins.detail(id));
            const raw = response.data as unknown;

            if (typeof raw === 'string') {
                throw new Error('Unexpected non-JSON response from tiffin detail endpoint.');
            }

            const payload = isRecord(raw)
                ? ((raw as TiffinDetailApiResponse).data ?? (raw as TiffinDetailApiResponse).tiffin ?? raw)
                : raw;

            if (!isRecord(payload)) {
                throw new Error('Invalid tiffin detail payload.');
            }

            const normalized = normalizeTiffin(payload as unknown as Tiffin);
            if (!normalized._id) {
                throw new Error('Missing tiffin id in detail payload.');
            }

            return normalized;
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
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['tiffin-favorites'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.favorites);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: isAuthenticated,
    });
};

type PaginationParams = { page?: number; limit?: number };

export const useTiffinFavoriteOrders = (params?: PaginationParams) => {
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;
    const queryParams = { type: 'Tiffin', ...(params || {}) };
    return useQuery({
        queryKey: ['tiffin-favorite-orders', queryParams],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.favoriteOrders, { params: queryParams });
            return data?.data ?? data;
        },
        enabled: isAuthenticated,
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
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['tiffin-recently-viewed'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.tiffins.recentlyViewed);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: isAuthenticated,
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
