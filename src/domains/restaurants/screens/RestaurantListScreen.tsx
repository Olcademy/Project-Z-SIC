import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
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
import { FilterChip } from '@/ui/components/FilterChip';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'rating' | 'distance';

export const RestaurantListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [vegOnly, setVegOnly] = useState(false);
    const [priceFilter, setPriceFilter] = useState<'budget' | 'mid' | 'premium' | null>(null);
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [showSortMenu, setShowSortMenu] = useState(false);

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
    }, [vegOnly, priceFilter, selectedCuisine, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('restaurants');
        if (saved) {
            if (saved.vegOnly !== undefined) setVegOnly(saved.vegOnly);
            if (saved.priceFilter) setPriceFilter(saved.priceFilter);
            if (saved.selectedCuisine) setSelectedCuisine(saved.selectedCuisine);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const saveFilters = async () => {
        await storage.saveFilters('restaurants', {
            vegOnly,
            priceFilter,
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

            const priceValue = getPriceValue(item);
            if (priceFilter && priceValue !== null) {
                if (priceFilter === 'budget' && priceValue > 200) return false;
                if (priceFilter === 'mid' && (priceValue <= 200 || priceValue > 400)) return false;
                if (priceFilter === 'premium' && priceValue <= 400) return false;
            }
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
    }, [allRestaurants, debouncedQuery, selectedCuisine, vegOnly, priceFilter, sortBy]);

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

    const handleRestaurantPress = useCallback((id: string) => {
        navigation.navigate('RestaurantDetail', { id });
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

    const sortOptions = [
        { value: 'default', label: 'Default' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Rating' },
        { value: 'distance', label: 'Distance' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ backgroundColor: theme.headerBgRestaurant, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, overflow: 'visible' }}>
                <View style={{ position: 'absolute', right: 0, top: 0, height: 128, width: 128, borderRadius: 64, backgroundColor: theme.headerCircleRestaurant }} />
                <View style={{ position: 'absolute', left: 0, bottom: 0, height: 96, width: 96, borderRadius: 48, backgroundColor: theme.headerCircleRestaurant }} />
                <ScreenHeader
                    title="Restaurants"
                    subtitle="Takeaway and dining picks"
                    rightSlot={
                        <TouchableOpacity
                            data-testid="sort-button"
                            onPress={() => setShowSortMenu(!showSortMenu)}
                            style={{ backgroundColor: theme.card, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.sectionLabel }}>Sort ▼</Text>
                        </TouchableOpacity>
                    }
                />
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

            {showSortMenu && (
                <View style={{ position: 'absolute', top: 100, right: 20, zIndex: 100, backgroundColor: theme.card, borderRadius: 16, elevation: 8, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, minWidth: 200 }}>
                    {sortOptions.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            data-testid={`sort-option-${option.value}`}
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: sortBy === option.value ? '#e6f4f4' : 'transparent' }}
                            onPress={() => { setSortBy(option.value as SortOption); setShowSortMenu(false); }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: '600', color: sortBy === option.value ? '#02757A' : theme.text }}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={{ paddingHorizontal: 20, marginTop: -16, zIndex: 1 }}>
                <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.sectionLabel }}>Quick filters</Text>
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        {renderChip('Veg', vegOnly, () => setVegOnly((prev) => !prev))}
                        {renderChip('Budget', priceFilter === 'budget', () => setPriceFilter(priceFilter === 'budget' ? null : 'budget'))}
                        {renderChip('Mid', priceFilter === 'mid', () => setPriceFilter(priceFilter === 'mid' ? null : 'mid'))}
                        {renderChip('Premium', priceFilter === 'premium', () => setPriceFilter(priceFilter === 'premium' ? null : 'premium'))}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
                        {cuisineOptions.map((cuisine) =>
                            <FilterChip
                                key={cuisine}
                                label={cuisine}
                                selected={selectedCuisine === cuisine}
                                onPress={() => setSelectedCuisine(selectedCuisine === cuisine ? null : cuisine)}
                                testID={`filter-chip-${cuisine.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                        )}
                    </View>
                </View>
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
                                setPriceFilter(null);
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
