import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RestaurantsStackParamList } from '@/app/navigation/types';
import { useRestaurantsInfinite } from '../hooks/useRestaurants';
import { Restaurant } from '@/domains/restaurants/types';
import { RestaurantCard } from '../components/RestaurantCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';
import { FilterBottomSheet } from '@/ui/components/FilterBottomSheet';
import { useUser } from '@/ui/context/UserContext';
import { prefetchImages } from '@/ui/utils/imagePrefetch';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'distance';

// ─── Card height must match actual rendered height ────────────────────────────
// IMAGE_HEIGHT(200) + padding(16*2) + name row(~28) + address(~18) + 
// cuisine(~18) + chips row(~36) + margins(~20) ≈ 370
// Wrong getItemLayout causes FlatList to scroll-jump and re-layout every frame.
const CARD_HEIGHT = 370;

const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'distance', label: 'Distance' },
];

export const RestaurantListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useUser();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [vegOnly, setVegOnly] = useState(false);
    const [globalVegOnlyMode, setGlobalVegOnlyMode] = useState(false);
    const [topRated, setTopRated] = useState(false);
    const [hasOffers, setHasOffers] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [showFilters, setShowFilters] = useState(false);

    const prefetchedRef = useRef(false);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isRefetching,
        refetch,
    } = useRestaurantsInfinite();

    const allRestaurants = useMemo(() => {
        const items = data?.pages.flatMap((page) => page.items) ?? [];
        const seen = new Set<string>();
        return items.filter((item) => {
            const id = item._id;
            if (!id) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [data]);

    // Prefetch only once when the list first loads — not on every re-render
    useEffect(() => {
        if (prefetchedRef.current || allRestaurants.length === 0) return;
        prefetchedRef.current = true;
        const urls = allRestaurants.flatMap((item) => [
            ...(Array.isArray(item.images) ? item.images.slice(0, 2) : []),
            item.imageUrl,
        ]).filter(Boolean) as string[];
        if (urls.length > 0) void prefetchImages(urls, 40);
    }, [allRestaurants]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 400);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => { loadFilters(); }, []);

    useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        });
        void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        return unsub;
    }, [navigation]);

    useEffect(() => { saveFilters(); }, [vegOnly, topRated, hasOffers, selectedCuisine, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('restaurants');
        if (saved) {
            if (saved.vegOnly !== undefined) setVegOnly(saved.vegOnly);
            if (saved.topRated !== undefined) setTopRated(saved.topRated);
            if (saved.hasOffers !== undefined) setHasOffers(saved.hasOffers);
            if (saved.selectedCuisine) setSelectedCuisine(saved.selectedCuisine);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const saveFilters = async () => {
        await storage.saveFilters('restaurants', { vegOnly, topRated, hasOffers, selectedCuisine, sortBy });
    };

    // ── Helpers (stable, no deps on state) ───────────────────────────────────
    const getCuisineTags = (item: Restaurant) => {
        if (Array.isArray(item.cuisineTags)) return item.cuisineTags;
        if (Array.isArray(item.cuisines)) return item.cuisines;
        if (typeof item.cuisines === 'string') return item.cuisines.split(',').map(c => c.trim()).filter(Boolean);
        return [];
    };

    const getPriceValue = (item: Restaurant) => {
        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match?.length) return Number(match[0]);
        }
        return null;
    };

    const getRatingValue = (item: Restaurant) => {
        const raw = item.rating ?? item.restaurantInfo?.ratings?.overall;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') { const p = Number(raw); return Number.isFinite(p) ? p : 0; }
        return 0;
    };

    const getDistanceValueKm = (item: Restaurant) => {
        const a = item as any;
        for (const c of [a.distanceKm, a.distance_km, a.distance, a.restaurantInfo?.distance, a.location?.distance]) {
            if (typeof c === 'number' && Number.isFinite(c)) return c;
            if (typeof c === 'string') { const p = Number(c); if (Number.isFinite(p)) return p; }
        }
        return null;
    };

    const hasAnyOffer = (item: Restaurant) => {
        if (item.hasOffer || item.offer) return true;
        const b = (item as any).badges;
        return Array.isArray(b) && b.some((x: any) => String(x).toLowerCase().includes('offer'));
    };

    const isVegRestaurant = (item: Restaurant) => {
        const tags = getCuisineTags(item).map(t => t.toLowerCase());
        if (tags.some(t => t.includes('non-veg') || t.includes('non veg') || t.includes('nonveg'))) return false;
        if (item.vegOnly || item.isVeg) return true;
        return tags.some(t => ['veg', 'vegetarian', 'pure veg'].includes(t));
    };

    const cuisineOptions = useMemo(() => {
        const set = new Set<string>();
        allRestaurants.forEach(item => getCuisineTags(item).forEach(tag => set.add(tag)));
        return Array.from(set).slice(0, 10);
    }, [allRestaurants]);

    const filteredAndSortedRestaurants = useMemo(() => {
        const effectiveVegOnly = vegOnly || globalVegOnlyMode;
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allRestaurants.filter((item) => {
            const tags = getCuisineTags(item);
            const searchable = [item.name, item.description, ...tags].filter(Boolean).join(' ').toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (selectedCuisine && !tags.includes(selectedCuisine)) return false;
            if (effectiveVegOnly && !isVegRestaurant(item)) return false;
            if (topRated && getRatingValue(item) < 4.0) return false;
            if (hasOffers && !hasAnyOffer(item)) return false;
            return true;
        });

        if (sortBy === 'price-low') {
            filtered = [...filtered].sort((a, b) => (getPriceValue(a) ?? Infinity) - (getPriceValue(b) ?? Infinity));
        } else if (sortBy === 'price-high') {
            filtered = [...filtered].sort((a, b) => (getPriceValue(b) ?? 0) - (getPriceValue(a) ?? 0));
        } else if (sortBy === 'rating') {
            filtered = [...filtered].sort((a, b) => getRatingValue(b) - getRatingValue(a));
        } else if (sortBy === 'distance') {
            filtered = [...filtered].sort((a, b) => {
                const da = getDistanceValueKm(a), db = getDistanceValueKm(b);
                if (da === null && db === null) return 0;
                if (da === null) return 1;
                if (db === null) return -1;
                return da - db;
            });
        }
        return filtered;
    }, [allRestaurants, debouncedQuery, selectedCuisine, vegOnly, globalVegOnlyMode, topRated, hasOffers, sortBy]);

    const handleRestaurantPress = useCallback((item: Restaurant) => {
        navigation.navigate('RestaurantDetail', { item });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: Restaurant }) => (
        <RestaurantCard item={item} onPress={handleRestaurantPress} />
    ), [handleRestaurantPress]);

    const keyExtractor = useCallback((item: Restaurant, index: number) =>
        item._id || index.toString(), []);

    // ─── FIXED: height matches actual card layout ─────────────────────────────
    const getItemLayout = useCallback((_: any, index: number) => ({
        length: CARD_HEIGHT,
        offset: CARD_HEIGHT * index,
        index,
    }), []);

    const renderFooter = useCallback(() => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#FF7A00" />
            </View>
        );
    }, [isFetchingNextPage]);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <View style={{ backgroundColor: '#FFF9F1', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A' }}>Hey, {user?.name?.split(' ')[0] || 'Ganesh'}</Text>
                            <Text style={{ fontSize: 24, marginLeft: 8 }}>👋</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: '#4A4A4A', marginTop: 4, fontWeight: '500' }}>What are you craving today?</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SettingsStack' as any)}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#5D69BE', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{(user?.name || 'G')[0].toUpperCase()}</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' }}
                        placeholder='Search "Tandoori"'
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={setQuery}
                    />
                    <View style={{ width: 1, height: 20, backgroundColor: '#EEE', marginHorizontal: 10 }} />
                    <TouchableOpacity>
                        <Ionicons name="mic" size={18} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
            </View>

            <FilterBottomSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onClear={() => { setVegOnly(false); setTopRated(false); setHasOffers(false); setSelectedCuisine(null); setSortBy('default'); }}
                accentColor="#FF7A00"
                sections={[
                    { title: 'Sort by', options: sortOptions, selected: sortBy, onSelect: (v) => setSortBy(v as SortOption) },
                    {
                        title: 'Features',
                        options: [{ value: 'veg', label: 'Veg Only' }, { value: 'topRated', label: 'Rating 4.0+' }, { value: 'offers', label: 'Offers' }],
                        multi: true,
                        selected: [...((vegOnly || globalVegOnlyMode) ? ['veg'] : []), ...(topRated ? ['topRated'] : []), ...(hasOffers ? ['offers'] : [])],
                        onSelect: (v) => { const n = Array.isArray(v) ? v : []; setVegOnly(n.includes('veg')); setTopRated(n.includes('topRated')); setHasOffers(n.includes('offers')); },
                    },
                    { title: 'Diet', options: [{ value: 'veg', label: 'Veg Only' }], selected: (vegOnly || globalVegOnlyMode) ? 'veg' : null, onSelect: () => setVegOnly(p => !p) },
                    { title: 'Cuisine', options: cuisineOptions.map(c => ({ value: c, label: c })), selected: selectedCuisine, onSelect: (v) => { const c = v as string; setSelectedCuisine(selectedCuisine === c ? null : c); } },
                    { title: 'Favourites', options: [{ value: 'open', label: 'View favourites' }], selected: null, onSelect: () => { setShowFilters(false); navigation.navigate('FavoriteRestaurants'); } },
                ]}
            />

            {/* Filter chips */}
            <View style={{ backgroundColor: '#FFFFFF' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}>
                    {[
                        { label: 'Filters', icon: 'options-outline' as const, onPress: () => setShowFilters(true), active: false, showCaret: true },
                        { label: 'Near & Fast', icon: 'options-outline' as const, onPress: () => {}, active: false },
                        { label: 'Rating 4.0+', onPress: () => setTopRated(p => !p), active: topRated },
                        { label: 'Pure Veg', onPress: () => { const n = !vegOnly; setVegOnly(n); void storage.setVegOnlyMode(n); setGlobalVegOnlyMode(n); }, active: vegOnly || globalVegOnlyMode },
                    ].map((chip) => (
                        <TouchableOpacity
                            key={chip.label}
                            onPress={chip.onPress}
                            style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: chip.active ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                        >
                            {(chip as any).icon && <Ionicons name={(chip as any).icon} size={16} color={chip.active ? '#FFF' : '#FF7F50'} style={{ marginRight: 6 }} />}
                            <Text style={{ fontSize: 13, fontWeight: '600', color: chip.active ? '#FFF' : '#FF7F50' }}>{chip.label}</Text>
                            {(chip as any).showCaret && <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />}
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        onPress={() => navigation.navigate('FavoriteRestaurants')}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Ionicons name="heart" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Favourites</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A4A4A' }}>Recommended for you</Text>
            </View>

            {isLoading ? (
                <LoadingSkeletonList />
            ) : isError ? (
                <ErrorState message="Failed to load restaurants." onRetry={refetch} />
            ) : (
                <FlatList
                    data={filteredAndSortedRestaurants}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    updateCellsBatchingPeriod={80}
                    windowSize={7}
                    removeClippedSubviews
                    getItemLayout={getItemLayout}
                    refreshControl={
                        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF7A00" />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            title="No restaurants found"
                            description="Try adjusting your filters or search terms."
                            actionLabel="Reset filters"
                            onAction={() => { setSelectedCuisine(null); setVegOnly(false); setTopRated(false); setHasOffers(false); setQuery(''); setSortBy('default'); }}
                        />
                    }
                />
            )}
        </View>
    );
};