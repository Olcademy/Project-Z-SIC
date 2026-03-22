import { useMutation, useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Restaurant, RestaurantDetail } from '@/domains/restaurants/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;

type TakeawayListParams = Record<string, string | number | boolean | string[] | undefined>;

const normalizeRestaurant = (item: Restaurant): Restaurant => {
    const name = item.restaurantInfo?.name || item.name;
    const address = item.restaurantInfo?.address || item.address;
    const cuisines = item.restaurantInfo?.cuisines || item.cuisines || [];
    const images = item.image_urls || item.images || (item.imageUrl ? [item.imageUrl] : []);
    const latitude = item.latitude ?? item.location?.lat;
    const longitude = item.longitude ?? item.location?.lng;

    const lat = typeof latitude === 'string' ? Number(latitude) : latitude;
    const lng = typeof longitude === 'string' ? Number(longitude) : longitude;

    return {
        ...item,
        _id: item._id,
        name,
        address,
        cuisines: Array.isArray(cuisines) ? cuisines : cuisines ? [cuisines] : [],
        images,
        imageUrl: images[0],
        location: {
            lat: Number.isFinite(lat as number) ? (lat as number) : undefined,
            lng: Number.isFinite(lng as number) ? (lng as number) : undefined,
            address,
        },
        serviceTypes: item.features || item.serviceTypes,
        openingHours: item.opening_hours || item.openingHours,
    } as Restaurant;
};

export const useRestaurants = (params?: TakeawayListParams) => {
    const queryParams = { feature: 'Takeaway', ...(params || {}) };
    return useQuery({
        queryKey: ['restaurants', queryParams],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.list, { params: queryParams });
                const payload = data?.data ?? data;
                const items = Array.isArray(payload)
                    ? (payload as Restaurant[])
                    : Array.isArray(payload?.restaurants)
                    ? (payload.restaurants as Restaurant[])
                    : Array.isArray(payload?.items)
                    ? (payload.items as Restaurant[])
                    : Array.isArray(payload?.data)
                    ? (payload.data as Restaurant[])
                    : [];
                const normalized = items.map((item) => normalizeRestaurant(item as Restaurant & Record<string, unknown>));
                await storage.saveCache('restaurants:list', normalized);
                return normalized;
            } catch (error) {
                const cached = await storage.getCache<Restaurant[]>('restaurants:list', LIST_CACHE_TTL);
                return cached ?? [];
            }
        },
    });
};

export const useRestaurantsInfinite = (params?: TakeawayListParams) => {
    const queryParams = { feature: 'Takeaway', ...(params || {}) };
    return useInfiniteQuery({
        queryKey: ['restaurants-infinite', queryParams],
        queryFn: async ({ pageParam = 1 }) => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.list, {
                    params: { ...queryParams, page: pageParam, limit: 10 },
                });
                const payload = data?.data ?? data;
                let items: Restaurant[] = [];
                if (Array.isArray(payload)) items = payload;
                else if (Array.isArray(payload?.restaurants)) items = payload.restaurants;
                else if (Array.isArray(payload?.items)) items = payload.items;
                else if (Array.isArray(payload?.data)) items = payload.data;

                const normalized = items.map((item) => normalizeRestaurant(item as Restaurant & Record<string, unknown>));

                if (pageParam === 1) {
                    await storage.saveCache('restaurants:list', normalized);
                }

                return {
                    items: normalized,
                    nextPage: items.length >= 10 ? pageParam + 1 : undefined,
                };
            } catch (error) {
                if (pageParam === 1) {
                    const cached = await storage.getCache<Restaurant[]>('restaurants:list', LIST_CACHE_TTL);
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

export const useRestaurantDetail = (id: string) => {
    return useQuery({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.detail(id));
            const payload = (data.data || data) as RestaurantDetail;
            return normalizeRestaurant(payload as Restaurant & Record<string, unknown>) as RestaurantDetail;
        },
        enabled: !!id,
    });
};

export const useRestaurantMenuSections = (id: string) => {
    return useQuery({
        queryKey: ['restaurant-menu-sections', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.menuSections(id));
            return data?.data ?? data;
        },
        enabled: !!id,
    });
};

export const useTakeawayRecentlyViewed = () => {
    return useQuery({
        queryKey: ['takeaway-recently-viewed'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.recentlyViewed.list);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

export const useTrackTakeawayRecentlyViewed = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.recentlyViewed.track(id));
            return data?.data ?? data;
        },
    });
};

export const useTakeawayFavorites = () => {
    return useQuery({
        queryKey: ['takeaway-favorites'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.list);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
    });
};

export const useTakeawayFavoriteStatus = (id: string) => {
    return useQuery({
        queryKey: ['takeaway-favorite-status', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.check(id));
            return data?.data ?? data;
        },
        enabled: !!id,
    });
};

export const useTakeawayLikeStatus = (id: string) => {
    return useQuery({
        queryKey: ['takeaway-like-status', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.isLike(id));
            return data?.data ?? data;
        },
        enabled: !!id,
    });
};

export const useAddTakeawayFavorite = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.favorites.add(id));
            return data?.data ?? data;
        },
    });
};

export const useRemoveTakeawayFavorite = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.favorites.remove(id));
            return data?.data ?? data;
        },
    });
};

export const useLikeTakeaway = () => {
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.favorites.like(id));
            return data?.data ?? data;
        },
    });
};

type PaginationParams = { page?: number; limit?: number };

export const useTakeawayOrders = (params?: PaginationParams) => {
    return useQuery({
        queryKey: ['takeaway-orders', params],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.orders.list, { params });
            return data?.data ?? data;
        },
    });
};

export const useTakeawayFavoriteOrders = (params?: PaginationParams) => {
    const queryParams = { type: 'Firm', ...(params || {}) };
    return useQuery({
        queryKey: ['takeaway-favorite-orders', queryParams],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.orders.favoriteList, { params: queryParams });
            return data?.data ?? data;
        },
    });
};

export const useToggleTakeawayOrderFavorite = () => {
    return useMutation({
        mutationFn: async (orderId: string) => {
            const { data } = await apiClient.put(ENDPOINTS.takeaway.orders.toggleFavorite(orderId));
            return data?.data ?? data;
        },
    });
};

type ApplyOfferParams = {
    firmId: string;
    productIds?: string[];
    categoryId?: string;
    subcategoryIds?: string[];
};

export const useTakeawayOffers = (params: ApplyOfferParams) => {
    return useQuery({
        queryKey: ['takeaway-offers', params],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.offers.apply, { params });
            return data?.data ?? data;
        },
        enabled: !!params?.firmId,
    });
};

export const useTakeawayNotifications = () => {
    return useQuery({
        queryKey: ['takeaway-notifications'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.notifications.list);
            return data?.data ?? data;
        },
    });
};

export const useUpdateTakeawayNotifications = () => {
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.notifications.update, payload);
            return data?.data ?? data;
        },
    });
};

export const useCreateTakeawayOrder = () => {
    return useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const { data } = await apiClient.post(ENDPOINTS.takeaway.orders.create, payload);
            return data?.data ?? data;
        },
    });
};
