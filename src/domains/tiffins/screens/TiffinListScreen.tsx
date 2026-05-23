import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TiffinStackParamList } from '@/app/navigation/types';
import { useTiffinsInfinite } from '../hooks/useTiffins';
import { Tiffin } from '@/domains/tiffins/types';
import { TiffinCard } from '../components/TiffinCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';
import { FilterBottomSheet } from '@/ui/components/FilterBottomSheet';
import { useUser } from '@/ui/context/UserContext';
import { prefetchImages } from '@/ui/utils/imagePrefetch';

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'veg-first';

export const TiffinListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useUser();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [vegOnly, setVegOnly] = useState(false);
    const [globalVegOnlyMode, setGlobalVegOnlyMode] = useState(false);
    const [topRated, setTopRated] = useState(false);
    const [hasOffers, setHasOffers] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [showFilters, setShowFilters] = useState(false);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isRefetching,
        refetch,
    } = useTiffinsInfinite();

    const allTiffins = useMemo(() => {
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
        const urls = allTiffins.flatMap((item) => [
            ...(Array.isArray(item.images) ? item.images : []),
            item.imageUrl,
        ]);
        if (urls.length > 0) {
            void prefetchImages(urls, 80);
        }
    }, [allTiffins]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        });
        void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        return unsub;
    }, [navigation]);

    useEffect(() => {
        void storage.saveFilters('tiffins', {
            vegOnly,
            topRated,
            hasOffers,
            sortBy,
        });
    }, [vegOnly, topRated, hasOffers, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('tiffins');
        if (saved) {
            if (saved.vegOnly !== undefined) setVegOnly(saved.vegOnly);
            if (saved.topRated !== undefined) setTopRated(saved.topRated);
            if (saved.hasOffers !== undefined) setHasOffers(saved.hasOffers);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const getPriceValue = (item: Tiffin) => {
        if (typeof item.pricePerMeal === 'number') return item.pricePerMeal;
        if (typeof item.priceRange === 'number') return item.priceRange;
        return null;
    };

    const getRatingValue = (item: Tiffin) => {
        const raw = item.rating;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    };

    const hasAnyOffer = (item: Tiffin) => {
        if (item.hasOffer) return true;
        if (item.offer) return true;
        const anyItem = item as any;
        if (Array.isArray(anyItem.badges)) {
            return anyItem.badges.some((b: unknown) => String(b).toLowerCase().includes('offer'));
        }
        return false;
    };

    const isVegTiffin = (item: Tiffin) => {
        const text = [
            item.name, 
            item.shortDescription, 
            ...(Array.isArray(item.category) ? item.category : [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        const nonVegKeywords = ['chicken', 'mutton', 'beef', 'pork', 'fish', 'prawn', 'meat', 'egg', 'non-veg', 'non veg', 'nonveg'];
        if (nonVegKeywords.some(kw => text.includes(kw))) {
            return false;
        }

        const vegKeywords = ['veg', 'vegetarian', 'paneer', 'dal', 'roti', 'rice', 'sabzi', 'pure veg', 'chole', 'rajma', 'aloo', 'thali'];
        if (vegKeywords.some(kw => text.includes(kw))) {
            return true;
        }

        return item.vegOnly === true;
    };
    const effectiveVegOnly = vegOnly || globalVegOnlyMode;
    const filteredAndSortedTiffins = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allTiffins.filter((item) => {
            const searchable = [item.name, item.shortDescription].filter(Boolean).join(' ').toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (effectiveVegOnly && !isVegTiffin(item)) return false;
            if (topRated && getRatingValue(item) < 4.0) return false;
            if (hasOffers && !hasAnyOffer(item)) return false;
            console.log(item._id);
            return true;
        });

        if (sortBy === 'price-low') {
            filtered = filtered.sort((a, b) => (getPriceValue(a) ?? Infinity) - (getPriceValue(b) ?? Infinity));
        } else if (sortBy === 'price-high') {
            filtered = filtered.sort((a, b) => (getPriceValue(b) ?? 0) - (getPriceValue(a) ?? 0));
        } else if (sortBy === 'veg-first') {
            filtered = filtered.sort((a, b) => Number(!!isVegTiffin(b)) - Number(!!isVegTiffin(a)));
        }

        return filtered;
    }, [allTiffins, debouncedQuery, vegOnly, globalVegOnlyMode, topRated, hasOffers, sortBy]);

    const handleTiffinPress = useCallback((item: Tiffin) => {
        navigation.navigate('TiffinDetail', { item });
    }, [navigation]);

    const renderHeader = () => (
        <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
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
                    onPress={() => setShowFilters(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Sort</Text>
                    <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <View style={{ width: 1, height: 20, backgroundColor: '#EEE', marginRight: 10 }} />

                <TouchableOpacity
                    onPress={() => {
                        const next = !vegOnly;
                        setVegOnly(next);
                        void storage.setVegOnlyMode(next);
                        setGlobalVegOnlyMode(next);
                    }}
                    style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: (vegOnly || globalVegOnlyMode) ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: (vegOnly || globalVegOnlyMode) ? '#FFF' : '#FF7F50' }}>Veg</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setTopRated(p => !p)}
                    style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: topRated ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: topRated ? '#FFF' : '#FF7F50' }}>Ratings 4.0+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setHasOffers(p => !p)}
                    style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: hasOffers ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: hasOffers ? '#FFF' : '#FF7F50' }}>Offers</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('FavoriteTiffins')}
                    style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Ionicons name="heart" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Favourites</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Sticky Header with Search Bar */}
            <View style={{ backgroundColor: '#FFF9F1', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A' }}>Hey, {user?.name?.split(' ')[0] || 'Ganesh'}</Text>
                            <Text style={{ fontSize: 24, marginLeft: 8 }}>👋</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="location-outline" size={16} color="#4A4A4A" />
                            <Text style={{ fontSize: 16, color: '#4A4A4A', marginLeft: 4, fontWeight: '500' }}>Toronto, Canada..</Text>
                        </View>
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
                        placeholder={'Search "Tandoori"'}
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

            {isLoading ? (
                <LoadingSkeletonList />
            ) : isError ? (
                <ErrorState message="Failed to load tiffins." onRetry={refetch} />
            ) : (
                <FlatList
                    data={filteredAndSortedTiffins}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <TiffinCard item={item} vegOnly={effectiveVegOnly}  onPress={handleTiffinPress} />}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                    onEndReached={() => hasNextPage && fetchNextPage()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color="#FF7F50" /> : null}
                    initialNumToRender={8}
                    maxToRenderPerBatch={8}
                    windowSize={10}
                    removeClippedSubviews
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            tintColor="#FF7F50"
                        />
                    }
                    ListEmptyComponent={
                        <EmptyState
                            title="No tiffins found"
                            description="Try adjusting your filters or search query."
                        />
                    }
                />
            )}

            <FilterBottomSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onClear={() => { setVegOnly(false); setTopRated(false); setHasOffers(false); setSortBy('default'); }}
                accentColor="#FF7F50"
                sections={[
                    {
                        title: 'Sort by',
                        options: [
                            { value: 'default', label: 'Default' },
                            { value: 'price-low', label: 'Price: Low to High' },
                            { value: 'price-high', label: 'Price: High to Low' },
                            { value: 'veg-first', label: 'Veg first' },
                        ],
                        selected: sortBy,
                        onSelect: (v) => setSortBy(v as SortOption),
                    },
                    {
                        title: 'Features',
                        options: [
                            { value: 'veg', label: 'Veg Only' },
                            { value: 'topRated', label: 'Rating 4.0+' },
                            { value: 'offers', label: 'Offers' },
                        ],
                        multi: true,
                        selected: [
                            ...((vegOnly || globalVegOnlyMode) ? ['veg'] : []),
                            ...(topRated ? ['topRated'] : []),
                            ...(hasOffers ? ['offers'] : []),
                        ],
                        onSelect: (v) => {
                            const next = Array.isArray(v) ? v : [];
                            setVegOnly(next.includes('veg'));
                            setTopRated(next.includes('topRated'));
                            setHasOffers(next.includes('offers'));
                        },
                    },
                    {
                        title: 'Favourites',
                        options: [{ value: 'open', label: 'View favourites' }],
                        selected: null,
                        onSelect: () => {
                            setShowFilters(false);
                            navigation.navigate('FavoriteTiffins');
                        },
                    },
                ]}
            />
        </View>
    );
};
