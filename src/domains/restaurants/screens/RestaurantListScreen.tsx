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
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';
import { FilterBottomSheet } from '@/ui/components/FilterBottomSheet';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'distance';

export const RestaurantListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();

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
            if (topRated && (item.rating ?? 0) < 4.0) return false;
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

    const renderChip = (label: string, active: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={label}
            data-testid={`filter-chip-${label.toLowerCase()}`}
            style={{
                marginRight: 8, borderRadius: 20, borderWidth: 1,
                paddingHorizontal: 12, paddingVertical: 8,
                backgroundColor: active ? '#02757A' : theme.chipBg,
                borderColor: active ? '#02757A' : theme.chipBorder,
            }}
            onPress={onPress}
        >
            <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : theme.chipText }}>{label}</Text>
        </TouchableOpacity>
    );

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
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ backgroundColor: theme.headerBgRestaurant, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, overflow: 'visible' }}>
                <View style={{ position: 'absolute', right: 0, top: 0, height: 128, width: 128, borderRadius: 64, backgroundColor: theme.headerCircleRestaurant }} />
                <View style={{ position: 'absolute', left: 0, bottom: 0, height: 96, width: 96, borderRadius: 48, backgroundColor: theme.headerCircleRestaurant }} />
                <ScreenHeader title="Restaurants" subtitle="Takeaway and dining picks" />
                <View style={{ marginTop: 16 }}>
                    <TextInput
                        data-testid="search-input"
                        style={{ backgroundColor: theme.inputBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, fontSize: 14, color: theme.inputText }}
                        placeholder="Search by name, cuisine, or dish"
                        placeholderTextColor={theme.inputPlaceholder}
                        value={query}
                        onChangeText={setQuery}
                    />
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

            <View style={{ backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: (vegOnly || topRated || hasOffers || selectedCuisine) ? '#02757A' : theme.chipBg, borderColor: (vegOnly || topRated || hasOffers || selectedCuisine) ? '#02757A' : theme.chipBorder }}
                    >
                        <Ionicons name="options-outline" size={13} color={(vegOnly || topRated || hasOffers || selectedCuisine) ? '#fff' : theme.chipText} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: (vegOnly || topRated || hasOffers || selectedCuisine) ? '#fff' : theme.chipText }}>Filters{(vegOnly || topRated || hasOffers || selectedCuisine) ? ' •' : ''}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: sortBy !== 'default' ? '#02757A' : theme.chipBg, borderColor: sortBy !== 'default' ? '#02757A' : theme.chipBorder }}
                    >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: sortBy !== 'default' ? '#fff' : theme.chipText }}>⇅ {sortBy !== 'default' ? activeSortLabel : 'Sort'}</Text>
                    </TouchableOpacity>
                    <View style={{ width: 1, height: 20, backgroundColor: theme.border, marginRight: 8 }} />
                    {renderChip('Veg', vegOnly, () => setVegOnly(p => !p))}
                    {renderChip('Ratings 4.0+', topRated, () => setTopRated(p => !p))}
                    {renderChip('Offers', hasOffers, () => setHasOffers(p => !p))}
                    {cuisineOptions.map((cuisine) => renderChip(cuisine, selectedCuisine === cuisine, () => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)))}
                </ScrollView>
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
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 20 }}
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
