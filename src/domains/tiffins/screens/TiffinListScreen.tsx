import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TiffinStackParamList } from '@/app/navigation/types';
import { useTiffinsInfinite } from '../hooks/useTiffins';
import { Tiffin } from '@/domains/tiffins/types';
import { TiffinCard } from '../components/TiffinCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { FilterChip } from '@/ui/components/FilterChip';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'veg-first';

export const TiffinListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
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
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        saveFilters();
    }, [vegOnly, priceFilter, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('tiffins');
        if (saved) {
            if (saved.vegOnly !== undefined) setVegOnly(saved.vegOnly);
            if (saved.priceFilter) setPriceFilter(saved.priceFilter);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const saveFilters = async () => {
        await storage.saveFilters('tiffins', { vegOnly, priceFilter, sortBy });
    };

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const getPriceValue = (item: Tiffin) => {
        if (typeof item.pricePerMeal === 'number') return item.pricePerMeal;
        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match && match.length > 0) return Number(match[0]);
        }
        return null;
    };

    const filteredAndSortedTiffins = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allTiffins.filter((item) => {
            const searchable = [item.name, item.shortDescription, ...(item.mealPlans || [])]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (vegOnly && !item.vegOnly) return false;

            const priceValue = getPriceValue(item);
            if (priceFilter && priceValue !== null) {
                if (priceFilter === 'budget' && priceValue > 120) return false;
                if (priceFilter === 'mid' && (priceValue <= 120 || priceValue > 250)) return false;
                if (priceFilter === 'premium' && priceValue <= 250) return false;
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
        } else if (sortBy === 'veg-first') {
            filtered = filtered.sort((a, b) => {
                if (a.vegOnly && !b.vegOnly) return -1;
                if (!a.vegOnly && b.vegOnly) return 1;
                return 0;
            });
        }

        return filtered;
    }, [allTiffins, debouncedQuery, vegOnly, priceFilter, sortBy]);

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

    const handleTiffinPress = useCallback((id: string) => {
        navigation.navigate('TiffinDetail', { id });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: Tiffin }) => (
        <TiffinCard item={item} onPress={handleTiffinPress} />
    ), [handleTiffinPress]);

    const keyExtractor = useCallback((item: Tiffin, index: number) => item._id || index.toString(), []);

    const getItemLayout = useCallback((data: ArrayLike<Tiffin> | null | undefined, index: number) => ({
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
        { value: 'veg-first', label: 'Veg Priority' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ backgroundColor: theme.headerBgTiffin, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, overflow: 'visible' }}>
                <View style={{ position: 'absolute', right: 0, top: 0, height: 112, width: 112, borderRadius: 56, backgroundColor: theme.headerCircleTiffin }} />
                <View style={{ position: 'absolute', left: 0, bottom: 0, height: 96, width: 96, borderRadius: 48, backgroundColor: theme.headerCircleTiffin }} />
                <ScreenHeader
                    title="Tiffin"
                    subtitle="Home-style meal services"
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
                        placeholder="Search by meal plan or provider"
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
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: sortBy === option.value ? '#f5efe8' : 'transparent' }}
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
                </View>
            </View>

            {isLoading ? (
                <LoadingSkeletonList />
            ) : isError ? (
                <ErrorState message="Failed to load tiffin services." onRetry={refetch} />
            ) : (
                <FlatList
                    data={filteredAndSortedTiffins}
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
                            title="No tiffin services found"
                            description="Try adjusting your search or filters."
                            actionLabel="Clear search"
                            onAction={() => {
                                setQuery('');
                                setVegOnly(false);
                                setPriceFilter(null);
                                setSortBy('default');
                            }}
                        />
                    }
                />
            )}
        </View>
    );
};
