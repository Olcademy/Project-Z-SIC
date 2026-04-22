import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'distance';

export const RestaurantListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useUser();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [vegOnly, setVegOnly] = useState(false);
    const [topRated, setTopRated] = useState(false);
    const [hasOffers, setHasOffers] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [showFilters, setShowFilters] = useState(false);

    const sortOptions = [
        { value: 'default', label: 'Default' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Rating' },
        { value: 'distance', label: 'Distance' },
    ];

    const activeSortLabel = sortOptions.find(o => o.value === sortBy)?.label ?? 'Sort';

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
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
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        saveFilters();
    }, [vegOnly, topRated, hasOffers, selectedCuisine, sortBy]);

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
        await storage.saveFilters('restaurants', {
            vegOnly,
            topRated,
            hasOffers,
            selectedCuisine,
            sortBy,
        });
    };

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const getCuisineTags = (item: Restaurant) => {
        if (Array.isArray(item.cuisineTags)) return item.cuisineTags;
        if (Array.isArray(item.cuisines)) return item.cuisines;
        if (typeof item.cuisines === 'string') {
            return item.cuisines.split(',').map((c) => c.trim()).filter(Boolean);
        }
        return [];
    };

    const getPriceValue = (item: Restaurant) => {
        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match && match.length > 0) return Number(match[0]);
        }
        return null;
    };

    const getRatingValue = (item: Restaurant) => {
        const raw = item.rating ?? item.restaurantInfo?.ratings?.overall;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
    };

    const hasAnyOffer = (item: Restaurant) => {
        if (item.hasOffer) return true;
        if (item.offer) return true;
        const anyItem = item as unknown as { badges?: unknown };
        if (Array.isArray(anyItem.badges)) {
            return anyItem.badges.some((b) => String(b).toLowerCase().includes('offer'));
        }
        return false;
    };

    const isVegRestaurant = (item: Restaurant) => {
        if (item.vegOnly || item.isVeg) return true;
        const tags = getCuisineTags(item).map((tag) => tag.toLowerCase());
        return tags.includes('veg') || tags.includes('vegetarian') || tags.includes('pure veg');
    };

    const cuisineOptions = useMemo(() => {
        const set = new Set<string>();
        allRestaurants.forEach((item) => {
            getCuisineTags(item).forEach((tag) => set.add(tag));
        });
        return Array.from(set).slice(0, 10);
    }, [allRestaurants]);

    const filteredAndSortedRestaurants = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allRestaurants.filter((item) => {
            const cuisines = getCuisineTags(item);
            const searchable = [item.name, item.description, ...cuisines].filter(Boolean).join(' ').toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (selectedCuisine && !cuisines.includes(selectedCuisine)) return false;
            if (vegOnly && !isVegRestaurant(item)) return false;
            if (topRated && Number(item.rating ?? 0) < 4.0) return false;
            if (hasOffers && !item.hasOffer && !item.offer) return false;
            return true;
        });

        if (sortBy === 'price-low') {
            filtered = filtered.sort((a, b) => {
                const priceA = getPriceValue(a) ?? Infinity;
                const priceB = getPriceValue(b) ?? Infinity;
                return priceA - priceB;
            });
        } else if (sortBy === 'price-high') {
            filtered = filtered.sort((a, b) => {
                const priceA = getPriceValue(a) ?? 0;
                const priceB = getPriceValue(b) ?? 0;
                return priceB - priceA;
            });
        }

        return filtered;
    }, [allRestaurants, debouncedQuery, selectedCuisine, vegOnly, topRated, hasOffers, sortBy]);

    const handleRestaurantPress = useCallback((item: Restaurant) => {
        navigation.navigate('RestaurantDetail', { item });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: Restaurant }) => (
        <RestaurantCard item={item} onPress={handleRestaurantPress} />
    ), [handleRestaurantPress]);

    const keyExtractor = useCallback((item: Restaurant, index: number) => item._id || index.toString(), []);

    const getItemLayout = useCallback((data: ArrayLike<Restaurant> | null | undefined, index: number) => ({
        length: 240,
        offset: 240 * index,
        index,
    }), []);

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#02757A" />
            </View>
        );
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
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
                        data-testid="search-input"
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' }}
                        placeholder={'Search "Tandoori"'}
                        placeholderTextColor="#999"
                        value={query}
                        onChangeText={setQuery}
                    />
                    <View style={{ width: 1, height: 20, backgroundColor: '#EEE', marginHorizontal: 10 }} />
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="mic" size={18} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
            </View>

            <FilterBottomSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onClear={() => { setVegOnly(false); setTopRated(false); setHasOffers(false); setSelectedCuisine(null); setSortBy('default'); }}
                accentColor="#02757A"
                sections={[
                    {
                        title: 'Sort by',
                        options: sortOptions,
                        selected: sortBy,
                        onSelect: (v) => setSortBy(v as SortOption),
                    },
                    {
                        title: 'Diet',
                        options: [{ value: 'veg', label: 'Veg Only' }],
                        selected: vegOnly ? 'veg' : null,
                        onSelect: () => setVegOnly(p => !p),
                    },
                    {
                        title: 'Cuisine',
                        options: cuisineOptions.map(c => ({ value: c, label: c })),
                        selected: selectedCuisine,
                        onSelect: (v) => setSelectedCuisine(selectedCuisine === v ? null : v),
                    },
                ]}
            />

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
                        onPress={() => { }}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Ionicons name="options-outline" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Near & Fast</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setTopRated(p => !p)}
                        style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Rating 4.0+</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setVegOnly(p => !p)}
                        style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Pure Veg</Text>
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
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews
                    getItemLayout={getItemLayout}
                    ListEmptyComponent={
                        <EmptyState
                            title="No restaurants found"
                            description="Try adjusting your filters or search terms."
                            actionLabel="Reset filters"
                            onAction={() => {
                                setSelectedCuisine(null);
                                setVegOnly(false);
                                setTopRated(false);
                                setHasOffers(false);
                                setQuery('');
                                setSortBy('default');
                            }}
                        />
                    }
                />
            )}
        </View>
    );
};
