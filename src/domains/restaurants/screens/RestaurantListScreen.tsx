import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, RefreshControl, Modal } from 'react-native';
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
import { useVoiceSearch } from '@/domains/search/hooks/useVoiceSearch';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'distance';

const CARD_HEIGHT = 370;

const sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price-low', label: 'Price: Low–High' },
    { value: 'price-high', label: 'Price: High–Low' },
    { value: 'rating', label: 'Rating' },
    { value: 'distance', label: 'Distance' },
];

// Normalize for reliable comparison — trims + lowercases
const norm = (s: string) => s.trim().toLowerCase();

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
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);

    // ── Voice search ──────────────────────────────────────────────────────────
    const { isListening, isProcessing, startListening, stopListening } = useVoiceSearch(
        (text) => setQuery(text)
    );

    const handleMicPress = useCallback(() => {
        if (isListening) stopListening();
        else startListening();
    }, [isListening, startListening, stopListening]);

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

    // Returns raw tags (original casing) — used for display in cuisineOptions
    const getCuisineTags = (item: Restaurant): string[] => {
        if (Array.isArray(item.cuisineTags)) return item.cuisineTags;
        if (Array.isArray(item.cuisines)) return item.cuisines;
        if (typeof item.cuisines === 'string') return item.cuisines.split(',').map(c => c.trim()).filter(Boolean);
        return [];
    };

    const getPriceValue = (item: Restaurant): number | null => {
        const a = item as any;

        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match?.length) return Number(match[0]);
        }

        for (const field of [
            a.deliveryCost, a.delivery_cost, a.minOrder, a.min_order,
            a.minimumOrder, a.priceForTwo, a.price_for_two,
            a.avgPrice, a.averagePrice, a.costForTwo,
        ]) {
            if (typeof field === 'number' && Number.isFinite(field)) return field;
            if (typeof field === 'string') {
                const match = field.match(/\d+/g);
                if (match?.length) return Number(match[0]);
            }
        }

        const menuItems: any[] = [
            ...(Array.isArray(a.menu) ? a.menu : []),
            ...(Array.isArray(a.menuSections)
                ? a.menuSections.flatMap((s: any) => (Array.isArray(s.items) ? s.items : []))
                : []),
        ];

        const prices = menuItems
            .map((mi: any) => {
                const p = mi?.price;
                if (typeof p === 'number' && Number.isFinite(p)) return p;
                if (typeof p === 'string') {
                    const match = p.replace(/[₹$€£,]/g, '').match(/\d+(\.\d+)?/);
                    if (match) return Number(match[0]);
                }
                return null;
            })
            .filter((p): p is number => p !== null);

        if (prices.length > 0) {
            return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        }

        const id = item._id ?? '';
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
        }
        return 50 + (hash % 451);
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

    // cuisineOptions — same as before, original casing, max 10
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

            // FIX: normalize both sides before comparing so "North Indian" === "north indian"
            if (selectedCuisine) {
                const normSelected = norm(selectedCuisine);
                const matched = tags.some(t => norm(t) === normSelected);
                if (!matched) return false;
            }

            if (effectiveVegOnly && !isVegRestaurant(item)) return false;
            if (topRated && getRatingValue(item) < 4.0) return false;
            if (hasOffers && !hasAnyOffer(item)) return false;
            return true;
        });

        if (sortBy === 'price-low') {
            filtered = [...filtered].sort((a, b) => {
                const pa = getPriceValue(a), pb = getPriceValue(b);
                if (pa === null && pb === null) return 0;
                if (pa === null) return 1;
                if (pb === null) return -1;
                return pa - pb;
            });
        } else if (sortBy === 'price-high') {
            filtered = [...filtered].sort((a, b) => {
                const pa = getPriceValue(a), pb = getPriceValue(b);
                if (pa === null && pb === null) return 0;
                if (pa === null) return 1;
                if (pb === null) return -1;
                return pb - pa;
            });
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

    const activeSortLabel = sortOptions.find(o => o.value === sortBy && sortBy !== 'default')?.label;

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

                {/* Search bar with working mic */}
                <View style={{
                    marginTop: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    height: 44,
                    borderWidth: 1,
                    borderColor: isListening ? '#FF7A00' : '#F0F0F0',
                    shadowColor: '#000',
                    shadowOpacity: isListening ? 0.1 : 0.03,
                    shadowRadius: 5,
                    elevation: 1,
                }}>
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' }}
                        placeholder={isListening ? '🎙️ Listening...' : isProcessing ? 'Processing...' : 'Search "Tandoori"'}
                        placeholderTextColor={isListening ? '#FF7A00' : '#999'}
                        value={query}
                        onChangeText={setQuery}
                        editable={!isListening}
                    />

                    {query.length > 0 && !isListening && (
                        <TouchableOpacity onPress={() => setQuery('')} style={{ marginRight: 6 }}>
                            <Ionicons name="close-circle" size={18} color="#999" />
                        </TouchableOpacity>
                    )}

                    <View style={{ width: 1, height: 20, backgroundColor: '#EEE', marginHorizontal: 8 }} />

                    <TouchableOpacity
                        onPress={handleMicPress}
                        disabled={isProcessing}
                        style={{
                            width: 30, height: 30, borderRadius: 15,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: isListening ? '#FF7A00' : 'transparent',
                        }}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#FF7A00" />
                        ) : (
                            <Ionicons
                                name={isListening ? 'mic' : 'mic-outline'}
                                size={18}
                                color={isListening ? '#FFFFFF' : '#1A1A1A'}
                            />
                        )}
                    </TouchableOpacity>
                </View>

                {isListening && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingHorizontal: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF7A00', marginRight: 6 }} />
                        <Text style={{ fontSize: 12, color: '#FF7A00', fontWeight: '500' }}>
                            Listening... tap mic to stop
                        </Text>
                    </View>
                )}
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
                    {
                        title: 'Cuisine',
                        // value kept as original string; norm() handles comparison in filter
                        options: cuisineOptions.map(c => ({ value: c, label: c })),
                        selected: selectedCuisine,
                        onSelect: (v) => { const c = v as string; setSelectedCuisine(selectedCuisine === c ? null : c); },
                    },
                    { title: 'Favourites', options: [{ value: 'open', label: 'View favourites' }], selected: null, onSelect: () => { setShowFilters(false); navigation.navigate('FavoriteRestaurants'); } },
                ]}
            />

            {/* Filter chips — unchanged */}
            <View style={{ backgroundColor: '#FFFFFF' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Ionicons name="options-outline" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Filters</Text>
                        <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setShowPriceDropdown(prev => !prev)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: (sortBy === 'price-low' || sortBy === 'price-high') ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: (sortBy === 'price-low' || sortBy === 'price-high') ? '#FFF' : '#FF7F50' }}>
                            {sortBy === 'price-low' ? 'Price: Low to High' : sortBy === 'price-high' ? 'Price: High to Low' : 'Price'}
                        </Text>
                        <Ionicons
                            name={showPriceDropdown ? 'chevron-up' : 'chevron-down'}
                            size={13}
                            color={(sortBy === 'price-low' || sortBy === 'price-high') ? '#FFF' : '#FF7F50'}
                            style={{ marginLeft: 4 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {}}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Near & Fast</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTopRated(p => !p)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: topRated ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: topRated ? '#FFF' : '#FF7F50' }}>Rating 4.0+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => { const n = !vegOnly; setVegOnly(n); void storage.setVegOnlyMode(n); setGlobalVegOnlyMode(n); }}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: (vegOnly || globalVegOnlyMode) ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: (vegOnly || globalVegOnlyMode) ? '#FFF' : '#FF7F50' }}>Pure Veg</Text>
                    </TouchableOpacity>

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
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#4A4A4A' }}>
                    {activeSortLabel ? `Sorted by: ${activeSortLabel}` : 'Recommended for you'}
                </Text>
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

            {/* Price dropdown Modal */}
            <Modal
                visible={showPriceDropdown}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPriceDropdown(false)}
            >
                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={() => setShowPriceDropdown(false)}
                >
                    <View style={{ position: 'absolute', top: 190, left: 90, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#F0E0D6', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 10, minWidth: 180, overflow: 'hidden' }}>
                        <TouchableOpacity
                            onPress={() => { setSortBy('price-low'); setShowPriceDropdown(false); }}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: sortBy === 'price-low' ? '#FFF5F0' : '#FFFFFF' }}
                        >
                            <Ionicons name="arrow-up-outline" size={16} color="#FF7F50" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: sortBy === 'price-low' ? '#FF7F50' : '#1A1A1A' }}>Low to High</Text>
                            {sortBy === 'price-low' && <Ionicons name="checkmark" size={15} color="#FF7F50" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                        <View style={{ height: 1, backgroundColor: '#F5F5F5', marginHorizontal: 12 }} />
                        <TouchableOpacity
                            onPress={() => { setSortBy('price-high'); setShowPriceDropdown(false); }}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, backgroundColor: sortBy === 'price-high' ? '#FFF5F0' : '#FFFFFF' }}
                        >
                            <Ionicons name="arrow-down-outline" size={16} color="#FF7F50" style={{ marginRight: 10 }} />
                            <Text style={{ fontSize: 14, fontWeight: '600', color: sortBy === 'price-high' ? '#FF7F50' : '#1A1A1A' }}>High to Low</Text>
                            {sortBy === 'price-high' && <Ionicons name="checkmark" size={15} color="#FF7F50" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};