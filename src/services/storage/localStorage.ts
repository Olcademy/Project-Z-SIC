import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    FILTERS: '@sic:filters',
    PREFERENCES: '@sic:preferences',
    GUEST_MODE: '@sic:guestMode',
    RECENT_SEARCHES: '@sic:recentSearches',
    FEATURE_FLAGS: '@sic:featureFlags',
    CACHE: '@sic:cache',
    FAVORITE_RESTAURANTS: '@sic:favorites:restaurants',
    FAVORITE_TIFFINS: '@sic:favorites:tiffins',
    FAVORITE_EVENTS: '@sic:favorites:events',
    FAVORITE_RESTAURANTS_ITEMS: '@sic:favorites:restaurants:items',
    FAVORITE_TIFFINS_ITEMS: '@sic:favorites:tiffins:items',
    FAVORITE_EVENTS_ITEMS: '@sic:favorites:events:items',
};

type CachePayload<T> = {
    value: T;
    savedAt: number;
};

export const storage = {
    // Filters
    async saveFilters(category: string, filters: Record<string, any>) {
        try {
            const key = `${KEYS.FILTERS}:${category}`;
            await AsyncStorage.setItem(key, JSON.stringify(filters));
        } catch (error) {
            console.error('Error saving filters:', error);
        }
    },

    async getFilters(category: string): Promise<Record<string, any> | null> {
        try {
            const key = `${KEYS.FILTERS}:${category}`;
            const value = await AsyncStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error getting filters:', error);
            return null;
        }
    },

    async clearFilters(category: string) {
        try {
            const key = `${KEYS.FILTERS}:${category}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing filters:', error);
        }
    },

    // Preferences
    async savePreferences(preferences: Record<string, any>) {
        try {
            await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(preferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    },

    async getPreferences(): Promise<Record<string, any> | null> {
        try {
            const value = await AsyncStorage.getItem(KEYS.PREFERENCES);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error getting preferences:', error);
            return null;
        }
    },

    async getVegOnlyMode(): Promise<boolean> {
        try {
            const prefs = await this.getPreferences();
            return !!prefs?.vegOnlyMode;
        } catch (error) {
            console.error('Error getting veg-only mode:', error);
            return false;
        }
    },

    async setVegOnlyMode(enabled: boolean) {
        try {
            const prefs = (await this.getPreferences()) ?? {};
            await this.savePreferences({ ...prefs, vegOnlyMode: !!enabled });
        } catch (error) {
            console.error('Error saving veg-only mode:', error);
        }
    },

    // Guest Mode
    async setGuestMode(isGuest: boolean) {
        try {
            await AsyncStorage.setItem(KEYS.GUEST_MODE, JSON.stringify(isGuest));
        } catch (error) {
            console.error('Error setting guest mode:', error);
        }
    },

    async isGuestMode(): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(KEYS.GUEST_MODE);
            return value ? JSON.parse(value) : false;
        } catch (error) {
            console.error('Error getting guest mode:', error);
            return false;
        }
    },

    // Recent Searches
    async saveRecentSearch(query: string) {
        try {
            const existing = await this.getRecentSearches();
            const updated = [query, ...existing.filter(q => q !== query)].slice(0, 10);
            await AsyncStorage.setItem(KEYS.RECENT_SEARCHES, JSON.stringify(updated));
        } catch (error) {
            console.error('Error saving recent search:', error);
        }
    },

    async getRecentSearches(): Promise<string[]> {
        try {
            const value = await AsyncStorage.getItem(KEYS.RECENT_SEARCHES);
            return value ? JSON.parse(value) : [];
        } catch (error) {
            console.error('Error getting recent searches:', error);
            return [];
        }
    },

    async clearRecentSearches() {
        try {
            await AsyncStorage.removeItem(KEYS.RECENT_SEARCHES);
        } catch (error) {
            console.error('Error clearing recent searches:', error);
        }
    },

    // Feature flags
    async saveFeatureFlags(flags: Record<string, any>) {
        try {
            await AsyncStorage.setItem(KEYS.FEATURE_FLAGS, JSON.stringify(flags));
        } catch (error) {
            console.error('Error saving feature flags:', error);
        }
    },

    async getFeatureFlags(): Promise<Record<string, any> | null> {
        try {
            const value = await AsyncStorage.getItem(KEYS.FEATURE_FLAGS);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Error getting feature flags:', error);
            return null;
        }
    },

    // Cache helpers
    async saveCache<T>(key: string, value: T) {
        try {
            const payload: CachePayload<T> = { value, savedAt: Date.now() };
            await AsyncStorage.setItem(`${KEYS.CACHE}:${key}`, JSON.stringify(payload));
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    },

    async getCache<T>(key: string, maxAgeMs: number): Promise<T | null> {
        try {
            const raw = await AsyncStorage.getItem(`${KEYS.CACHE}:${key}`);
            if (!raw) return null;
            const payload = JSON.parse(raw) as CachePayload<T>;
            if (!payload?.savedAt || Date.now() - payload.savedAt > maxAgeMs) return null;
            return payload.value ?? null;
        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    },

    // Local favourites
    async getFavoriteRestaurantIds(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_RESTAURANTS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.map((v) => String(v)).filter(Boolean);
        } catch (error) {
            console.error('Error getting favorite restaurants:', error);
            return [];
        }
    },

    async setFavoriteRestaurantIds(ids: string[]) {
        try {
            const unique = Array.from(new Set(ids.map((v) => String(v)).filter(Boolean)));
            await AsyncStorage.setItem(KEYS.FAVORITE_RESTAURANTS, JSON.stringify(unique));
        } catch (error) {
            console.error('Error saving favorite restaurants:', error);
        }
    },

    async toggleFavoriteRestaurantId(id: string): Promise<{ ids: string[]; isFavorited: boolean }> {
        const safeId = String(id || '').trim();
        if (!safeId) return { ids: await this.getFavoriteRestaurantIds(), isFavorited: false };

        const current = await this.getFavoriteRestaurantIds();
        const set = new Set(current);
        if (set.has(safeId)) set.delete(safeId);
        else set.add(safeId);
        const next = Array.from(set);
        await this.setFavoriteRestaurantIds(next);
        return { ids: next, isFavorited: set.has(safeId) };
    },

    async getFavoriteRestaurantItems<T = any>(): Promise<T[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_RESTAURANTS_ITEMS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed as T[];
        } catch (error) {
            console.error('Error getting favorite restaurant items:', error);
            return [];
        }
    },

    async setFavoriteRestaurantItems(items: any[]) {
        try {
            const safe = Array.isArray(items) ? items : [];
            const map = new Map<string, any>();
            for (const it of safe) {
                const id = String(it?._id || it?.id || '').trim();
                if (!id) continue;
                map.set(id, { ...it, _id: id });
            }
            await AsyncStorage.setItem(KEYS.FAVORITE_RESTAURANTS_ITEMS, JSON.stringify(Array.from(map.values())));
        } catch (error) {
            console.error('Error saving favorite restaurant items:', error);
        }
    },

    async upsertFavoriteRestaurantItem(item: any) {
        const id = String(item?._id || item?.id || '').trim();
        if (!id) return;
        const current = await this.getFavoriteRestaurantItems<any>();
        const map = new Map<string, any>(current.map((it) => [String(it?._id || it?.id || '').trim(), it]));
        map.set(id, { ...item, _id: id });
        await this.setFavoriteRestaurantItems(Array.from(map.values()));
    },

    async removeFavoriteRestaurantItem(id: string) {
        const safeId = String(id || '').trim();
        if (!safeId) return;
        const current = await this.getFavoriteRestaurantItems<any>();
        const next = current.filter((it) => String(it?._id || it?.id || '').trim() !== safeId);
        await this.setFavoriteRestaurantItems(next);
    },

    async getFavoriteTiffinIds(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_TIFFINS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.map((v) => String(v)).filter(Boolean);
        } catch (error) {
            console.error('Error getting favorite tiffins:', error);
            return [];
        }
    },

    async setFavoriteTiffinIds(ids: string[]) {
        try {
            const unique = Array.from(new Set(ids.map((v) => String(v)).filter(Boolean)));
            await AsyncStorage.setItem(KEYS.FAVORITE_TIFFINS, JSON.stringify(unique));
        } catch (error) {
            console.error('Error saving favorite tiffins:', error);
        }
    },

    async toggleFavoriteTiffinId(id: string): Promise<{ ids: string[]; isFavorited: boolean }> {
        const safeId = String(id || '').trim();
        if (!safeId) return { ids: await this.getFavoriteTiffinIds(), isFavorited: false };

        const current = await this.getFavoriteTiffinIds();
        const set = new Set(current);
        if (set.has(safeId)) set.delete(safeId);
        else set.add(safeId);
        const next = Array.from(set);
        await this.setFavoriteTiffinIds(next);
        return { ids: next, isFavorited: set.has(safeId) };
    },

    async getFavoriteEventIds(): Promise<string[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_EVENTS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed.map((v) => String(v)).filter(Boolean);
        } catch (error) {
            console.error('Error getting favorite events:', error);
            return [];
        }
    },

    async setFavoriteEventIds(ids: string[]) {
        try {
            const unique = Array.from(new Set(ids.map((v) => String(v)).filter(Boolean)));
            await AsyncStorage.setItem(KEYS.FAVORITE_EVENTS, JSON.stringify(unique));
        } catch (error) {
            console.error('Error saving favorite events:', error);
        }
    },

    async toggleFavoriteEventId(id: string): Promise<{ ids: string[]; isFavorited: boolean }> {
        const safeId = String(id || '').trim();
        if (!safeId) return { ids: await this.getFavoriteEventIds(), isFavorited: false };

        const current = await this.getFavoriteEventIds();
        const set = new Set(current);
        if (set.has(safeId)) set.delete(safeId);
        else set.add(safeId);
        const next = Array.from(set);
        await this.setFavoriteEventIds(next);
        return { ids: next, isFavorited: set.has(safeId) };
    },

    async getFavoriteEventItems<T = any>(): Promise<T[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_EVENTS_ITEMS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed as T[];
        } catch (error) {
            console.error('Error getting favorite event items:', error);
            return [];
        }
    },

    async setFavoriteEventItems(items: any[]) {
        try {
            const safe = Array.isArray(items) ? items : [];
            const map = new Map<string, any>();
            for (const it of safe) {
                const id = String(it?._id || it?.id || '').trim();
                if (!id) continue;
                map.set(id, { ...it, _id: id });
            }
            await AsyncStorage.setItem(KEYS.FAVORITE_EVENTS_ITEMS, JSON.stringify(Array.from(map.values())));
        } catch (error) {
            console.error('Error saving favorite event items:', error);
        }
    },

    async upsertFavoriteEventItem(item: any) {
        const id = String(item?._id || item?.id || '').trim();
        if (!id) return;
        const current = await this.getFavoriteEventItems<any>();
        const map = new Map<string, any>(current.map((it) => [String(it?._id || it?.id || '').trim(), it]));
        map.set(id, { ...item, _id: id });
        await this.setFavoriteEventItems(Array.from(map.values()));
    },

    async removeFavoriteEventItem(id: string) {
        const safeId = String(id || '').trim();
        if (!safeId) return;
        const current = await this.getFavoriteEventItems<any>();
        const next = current.filter((it) => String(it?._id || it?.id || '').trim() !== safeId);
        await this.setFavoriteEventItems(next);
    },

    async getFavoriteTiffinItems<T = any>(): Promise<T[]> {
        try {
            const raw = await AsyncStorage.getItem(KEYS.FAVORITE_TIFFINS_ITEMS);
            const parsed = raw ? (JSON.parse(raw) as unknown) : [];
            if (!Array.isArray(parsed)) return [];
            return parsed as T[];
        } catch (error) {
            console.error('Error getting favorite tiffin items:', error);
            return [];
        }
    },

    async setFavoriteTiffinItems(items: any[]) {
        try {
            const safe = Array.isArray(items) ? items : [];
            const map = new Map<string, any>();
            for (const it of safe) {
                const id = String(it?._id || it?.id || '').trim();
                if (!id) continue;
                map.set(id, { ...it, _id: id });
            }
            await AsyncStorage.setItem(KEYS.FAVORITE_TIFFINS_ITEMS, JSON.stringify(Array.from(map.values())));
        } catch (error) {
            console.error('Error saving favorite tiffin items:', error);
        }
    },

    async upsertFavoriteTiffinItem(item: any) {
        const id = String(item?._id || item?.id || '').trim();
        if (!id) return;
        const current = await this.getFavoriteTiffinItems<any>();
        const map = new Map<string, any>(current.map((it) => [String(it?._id || it?.id || '').trim(), it]));
        map.set(id, { ...item, _id: id });
        await this.setFavoriteTiffinItems(Array.from(map.values()));
    },

    async removeFavoriteTiffinItem(id: string) {
        const safeId = String(id || '').trim();
        if (!safeId) return;
        const current = await this.getFavoriteTiffinItems<any>();
        const next = current.filter((it) => String(it?._id || it?.id || '').trim() !== safeId);
        await this.setFavoriteTiffinItems(next);
    },

    // General utility
    async clear() {
        try {
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    },
};
