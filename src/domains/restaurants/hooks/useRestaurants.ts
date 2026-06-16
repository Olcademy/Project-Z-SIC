import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Restaurant, RestaurantDetail } from '@/domains/restaurants/types';
import { apiClient } from '@/platform/api/client';
import { ENDPOINTS } from '@/platform/api/endpoints';
import { storage } from '@/services/storage/localStorage';
import { useUser } from '@/ui/context/UserContext';
import { mockRestaurants, mockRestaurantDetails } from '@/domains/restaurants/MockData/mockdata';

const LIST_CACHE_TTL = 6 * 60 * 60 * 1000;
const LOCAL_FAVORITES_KEY = ['local-restaurant-favorites'] as const;
const LOCAL_FAVORITE_ITEMS_KEY = ['local-restaurant-favorite-items'] as const;

type TakeawayListParams = Record<string, string | number | boolean | string[] | undefined>;

// ─── Detect mock IDs — never hit the real API for these ───────────────────────
// Matches: fr1, fr2 ... fr99, r1, r2 ... r99
const isMockId = (id: string): boolean => /^(fr|r)\d+$/.test(id);

const normalizeRestaurant = (item: Restaurant): Restaurant => {
    const name = item.restaurantInfo?.name || item.name;
    const address = item.restaurantInfo?.address || item.address;
    const cuisines = item.restaurantInfo?.cuisines || item.cuisines || [];
    const imageCandidates = [
        ...(Array.isArray(item.image_urls) ? item.image_urls : []),
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

/**
 * Merges API results with mock data.
 * - API items come first (real data takes priority).
 * - Mock items whose _id doesn't clash with any API item are appended.
 */
const mergeWithMock = (apiItems: Restaurant[]): Restaurant[] => {
    const apiIds = new Set(apiItems.map((r) => r._id).filter(Boolean));
    const uniqueMock = mockRestaurants
        .filter((m) => !apiIds.has(m._id))
        .map((m) => normalizeRestaurant(m));
    return [...apiItems, ...uniqueMock];
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
                const merged = mergeWithMock(normalized);
                await storage.saveCache('restaurants:list', merged);
                return merged;
            } catch (error) {
                const cached = await storage.getCache<Restaurant[]>('restaurants:list', LIST_CACHE_TTL);
                return cached ?? mergeWithMock([]);
            }
        },
        retry: 0,
        staleTime: 5 * 60 * 1000,
    });
};

const PAGE_SIZE = 10;

export const useRestaurantsInfinite = (params?: TakeawayListParams) => {
    const queryParams = { feature: 'Takeaway', ...(params || {}) };
    return useInfiniteQuery({
        queryKey: ['restaurants-infinite', queryParams],
        queryFn: async ({ pageParam = 1 }) => {
            let apiItems: Restaurant[] = [];
            let apiHasMore = false;

            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.list, {
                    params: { ...queryParams, page: pageParam, limit: PAGE_SIZE },
                });
                const payload = data?.data ?? data;
                let raw: Restaurant[] = [];
                if (Array.isArray(payload)) raw = payload;
                else if (Array.isArray(payload?.restaurants)) raw = payload.restaurants;
                else if (Array.isArray(payload?.items)) raw = payload.items;
                else if (Array.isArray(payload?.data)) raw = payload.data;

                apiItems = raw.map((item) => normalizeRestaurant(item as Restaurant & Record<string, unknown>));
                apiHasMore = raw.length >= PAGE_SIZE;

                if (pageParam === 1) {
                    await storage.saveCache('restaurants:list', apiItems);
                }
            } catch {
                if (pageParam === 1) {
                    const cached = await storage.getCache<Restaurant[]>('restaurants:list', LIST_CACHE_TTL);
                    if (cached) apiItems = cached;
                }
            }

            // Merge mock only on first page to avoid duplication
            const items = pageParam === 1 ? mergeWithMock(apiItems) : apiItems;

            return {
                items,
                nextPage: apiHasMore ? pageParam + 1 : undefined,
            };
        },
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        retry: 0,
        staleTime: 5 * 60 * 1000,
    });
};

export const useRestaurantDetail = (id: string) => {
    return useQuery({
        queryKey: ['restaurant', id],
        queryFn: async () => {
            const mockDetail = mockRestaurantDetails[id];

            // ── KEY FIX: mock IDs (fr1, r3 etc.) must NEVER hit the real API.
            // The backend doesn't know these IDs and always returns 500,
            // which caused the red LogBox error and scroll lag.
            if (isMockId(id)) {
                if (mockDetail) return normalizeRestaurant(mockDetail as Restaurant) as RestaurantDetail;
                const listFallback = mockRestaurants.find((r) => r._id === id);
                if (listFallback) return normalizeRestaurant(listFallback) as RestaurantDetail;
                throw new Error(`Mock restaurant ${id} not found`);
            }

            // Real API IDs — try server first, fall back to mock
            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.detail(id));
                const payload = (data.data || data) as RestaurantDetail;
                return normalizeRestaurant(payload as Restaurant & Record<string, unknown>) as RestaurantDetail;
            } catch {
                if (mockDetail) return normalizeRestaurant(mockDetail as Restaurant) as RestaurantDetail;
                const listFallback = mockRestaurants.find((r) => r._id === id);
                if (listFallback) return normalizeRestaurant(listFallback) as RestaurantDetail;
                throw new Error(`Restaurant ${id} not found`);
            }
        },
        enabled: !!id,
        retry: 0,
        staleTime: 5 * 60 * 1000,
    });
};

export const useRestaurantMenuSections = (id: string) => {
    return useQuery({
        queryKey: ['restaurant-menu-sections', id],
        queryFn: async () => {
            // Skip API for mock IDs
            if (isMockId(id)) {
                const mockDetail = mockRestaurantDetails[id];
                return mockDetail?.menuSections ?? null;
            }
            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.menuSections(id));
                return data?.data ?? data;
            } catch {
                const mockDetail = mockRestaurantDetails[id];
                return mockDetail?.menuSections ?? null;
            }
        },
        enabled: !!id,
        retry: 0,
    });
};

export const useTakeawayRecentlyViewed = () => {
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-recently-viewed'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.recentlyViewed.list);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: isAuthenticated,
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
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-favorites'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.list);
            const payload = data?.data ?? data;
            return Array.isArray(payload) ? payload : [];
        },
        enabled: isAuthenticated,
    });
};

export const useTakeawayFavoriteStatus = (id: string, options?: { enabled?: boolean }) => {
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-favorite-status', id],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.check(id));
                return data?.data ?? data;
            } catch (error: any) {
                if (error?.response?.status === 404) {
                    return null;
                }
                throw error;
            }
        },
        enabled: (options?.enabled !== false) && !!id && isAuthenticated,
        retry: 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
    });
};

export const useLocalRestaurantFavorites = () => {
    return useQuery({
        queryKey: LOCAL_FAVORITES_KEY,
        queryFn: async () => {
            return storage.getFavoriteRestaurantIds();
        },
        staleTime: Infinity,
    });
};

export const useLocalRestaurantFavoriteItems = () => {
    return useQuery({
        queryKey: LOCAL_FAVORITE_ITEMS_KEY,
        queryFn: async () => storage.getFavoriteRestaurantItems<Restaurant>(),
        staleTime: Infinity,
    });
};

export const useToggleLocalRestaurantFavorite = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return storage.toggleFavoriteRestaurantId(id);
        },
        onMutate: async (id: string) => {
            await queryClient.cancelQueries({ queryKey: LOCAL_FAVORITES_KEY });
            const prev = queryClient.getQueryData<string[]>(LOCAL_FAVORITES_KEY) ?? [];
            const set = new Set(prev);
            if (set.has(id)) set.delete(id);
            else set.add(id);
            const next = Array.from(set);
            queryClient.setQueryData<string[]>(LOCAL_FAVORITES_KEY, next);
            return { prev };
        },
        onError: (_err, _id, ctx) => {
            if (ctx?.prev) {
                queryClient.setQueryData<string[]>(LOCAL_FAVORITES_KEY, ctx.prev);
            }
        },
        onSuccess: (result) => {
            queryClient.setQueryData<string[]>(LOCAL_FAVORITES_KEY, result.ids);
        },
    });
};

export const useTakeawayLikeStatus = (id: string) => {
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-like-status', id],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.favorites.isLike(id));
            return data?.data ?? data;
        },
        enabled: !!id && isAuthenticated,
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
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-orders', params],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.orders.list, { params });
            return data?.data ?? data;
        },
        enabled: isAuthenticated,
    });
};

export const useTakeawayFavoriteOrders = (params?: PaginationParams) => {
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;
    const queryParams = { type: 'Firm', ...(params || {}) };
    return useQuery({
        queryKey: ['takeaway-favorite-orders', queryParams],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.orders.favoriteList, { params: queryParams });
            return data?.data ?? data;
        },
        enabled: isAuthenticated,
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
    const { user } = useUser();
    const isAuthenticated = !!user && !user.isGuest;

    return useQuery({
        queryKey: ['takeaway-notifications'],
        queryFn: async () => {
            const { data } = await apiClient.get(ENDPOINTS.takeaway.notifications.list);
            return data?.data ?? data;
        },
        enabled: isAuthenticated,
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