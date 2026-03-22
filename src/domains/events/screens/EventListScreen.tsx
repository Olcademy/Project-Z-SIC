import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '@/app/navigation/types';
import { useEventsInfinite } from '../hooks/useEvents';
import { Event } from '@/domains/events/types';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { FilterChip } from '@/ui/components/FilterChip';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventList'>;
type SortOption = 'default' | 'date-asc' | 'date-desc' | 'price-low' | 'price-high';

export const EventListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<'upcoming' | 'week' | 'past' | null>(null);
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
    } = useEventsInfinite();

    const allEvents = useMemo(() => {
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
    }, [categoryFilter, dateFilter, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('events');
        if (saved) {
            if (saved.categoryFilter) setCategoryFilter(saved.categoryFilter);
            if (saved.dateFilter) setDateFilter(saved.dateFilter);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const saveFilters = async () => {
        await storage.saveFilters('events', { categoryFilter, dateFilter, sortBy });
    };

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const categoryOptions = useMemo(() => {
        const set = new Set<string>();
        allEvents.forEach((item) => {
            if (item.category) set.add(item.category);
        });
        return Array.from(set).slice(0, 8);
    }, [allEvents]);

    const isWithinDays = (dateString?: string, days = 7) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return false;
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
    };

    const isPastEvent = (dateString?: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return false;
        return date.getTime() < Date.now();
    };

    const getPrice = (event: Event): number | null => {
        if (typeof event.price === 'number') return event.price;
        if (typeof event.price === 'string') {
            const match = event.price.match(/\d+/);
            return match ? Number(match[0]) : null;
        }
        return null;
    };

    const filteredAndSortedEvents = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allEvents.filter((item) => {
            const title = item.name || item.title || '';
            const searchable = [title, item.description, item.category, item.venue]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (dateFilter === 'upcoming') return isWithinDays(item.date, 30);
            if (dateFilter === 'week') return isWithinDays(item.date, 7);
            if (dateFilter === 'past') return isPastEvent(item.date);
            return true;
        });

        if (sortBy === 'date-asc') {
            filtered = filtered.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : Infinity;
                const dateB = b.date ? new Date(b.date).getTime() : Infinity;
                return dateA - dateB;
            });
        } else if (sortBy === 'date-desc') {
            filtered = filtered.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateB - dateA;
            });
        } else if (sortBy === 'price-low') {
            filtered = filtered.sort((a, b) => {
                const priceA = getPrice(a) ?? Infinity;
                const priceB = getPrice(b) ?? Infinity;
                return priceA - priceB;
            });
        } else if (sortBy === 'price-high') {
            filtered = filtered.sort((a, b) => {
                const priceA = getPrice(a) ?? 0;
                const priceB = getPrice(b) ?? 0;
                return priceB - priceA;
            });
        }

        return filtered;
    }, [allEvents, debouncedQuery, categoryFilter, dateFilter, sortBy]);

    const filteredCount = filteredAndSortedEvents.length;

    const renderChip = (label: string, active: boolean, onPress: () => void) => (
        <TouchableOpacity
            key={label}
            data-testid={`filter-chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
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

    const handleEventPress = useCallback((id: string) => {
        navigation.navigate('EventDetail', { id });
    }, [navigation]);

    const renderItem = useCallback(({ item }: { item: Event }) => (
        <EventCard item={item} onPress={handleEventPress} />
    ), [handleEventPress]);

    const keyExtractor = useCallback((item: Event, index: number) => item._id || index.toString(), []);

    const getItemLayout = useCallback((data: ArrayLike<Event> | null | undefined, index: number) => ({
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
        { value: 'date-asc', label: 'Date: Nearest First' },
        { value: 'date-desc', label: 'Date: Latest First' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ backgroundColor: theme.headerBgEvents, paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, overflow: 'visible' }}>
                <View style={{ position: 'absolute', right: 0, top: 0, height: 112, width: 112, borderRadius: 56, backgroundColor: theme.headerCircleEvents }} />
                <View style={{ position: 'absolute', left: 0, bottom: 0, height: 96, width: 96, borderRadius: 48, backgroundColor: theme.headerCircleEvents }} />
                <ScreenHeader
                    title="Events"
                    subtitle="Live shows and community meetups"
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
                        placeholder="Search events, venues, or categories"
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
                            style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, backgroundColor: sortBy === option.value ? '#efe9f6' : 'transparent' }}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.sectionLabel }}>Quick filters</Text>
                        <Text style={{ fontSize: 12, color: theme.subtext }}>{filteredCount} events</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 12 }}>
                        {renderChip('Upcoming', dateFilter === 'upcoming', () => setDateFilter(dateFilter === 'upcoming' ? null : 'upcoming'))}
                        {renderChip('This Week', dateFilter === 'week', () => setDateFilter(dateFilter === 'week' ? null : 'week'))}
                        {renderChip('Past', dateFilter === 'past', () => setDateFilter(dateFilter === 'past' ? null : 'past'))}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' }}>
                        {categoryOptions.map((category) =>
                            <FilterChip
                                key={category}
                                label={category}
                                selected={categoryFilter === category}
                                onPress={() => setCategoryFilter(categoryFilter === category ? null : category)}
                                testID={`filter-chip-${category.toLowerCase().replace(/\s+/g, '-')}`}
                            />
                        )}
                    </View>
                </View>
            </View>

            {isLoading ? (
                <LoadingSkeletonList />
            ) : isError ? (
                <ErrorState message="Failed to load events." onRetry={refetch} />
            ) : (
                <FlatList
                    data={filteredAndSortedEvents}
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
                            title="No events match your filters"
                            description="Try a different category or date range."
                            actionLabel="Clear filters"
                            onAction={() => {
                                setCategoryFilter(null);
                                setDateFilter(null);
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
