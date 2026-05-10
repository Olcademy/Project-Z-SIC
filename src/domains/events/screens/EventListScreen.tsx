import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions, ImageBackground, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '@/app/navigation/types';
import { useEventsInfinite } from '../hooks/useEvents';
import { Event } from '@/domains/events/types';
import { EventCard } from '../components/EventCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';
import { FilterBottomSheet } from '@/ui/components/FilterBottomSheet';
import { useUser } from '@/ui/context/UserContext';
import { prefetchImages } from '@/ui/utils/imagePrefetch';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventList'>;
type SortOption = 'default' | 'date-asc' | 'date-desc';

const FeaturedEventCard = ({ item, onPress }: { item: Event, onPress: (item: Event) => void }) => {
    return (
        <TouchableOpacity 
            onPress={() => onPress(item)}
            activeOpacity={0.9}
            style={{ 
                width: 200, marginRight: 16, backgroundColor: '#FFF'
            }}
        >
            <ImageBackground 
                source={{ uri: item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }} 
                style={{ width: 200, height: 260, borderRadius: 0, overflow: 'hidden' }}
                imageStyle={{ borderRadius: 0 }}
                resizeMode="cover"
            >
                <TouchableOpacity style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="bookmark-outline" size={18} color="#FFF" />
                </TouchableOpacity>
            </ImageBackground>
            <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={12} color="#FF7F50" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, color: '#4A4A4A', fontWeight: '600' }} numberOfLines={1}>Dubai Parks and Resorts, Dubai</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 }}>{item.name || item.title}</Text>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>Thu, 05 Nov, 5:00 PM</Text>
            </View>
        </TouchableOpacity>
    );
};

export const EventListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useUser();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<'upcoming' | 'week' | 'past' | null>(null);
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
        const urls = allEvents.flatMap((item) => [
            ...(Array.isArray(item.images) ? item.images : []),
            item.imageUrl,
        ]);
        if (urls.length > 0) {
            void prefetchImages(urls, 80);
        }
    }, [allEvents]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        loadFilters();
    }, []);

    useEffect(() => {
        void storage.saveFilters('events', {
            categoryFilter,
            dateFilter,
            sortBy,
        });
    }, [categoryFilter, dateFilter, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('events');
        if (saved) {
            if (saved.categoryFilter) setCategoryFilter(saved.categoryFilter);
            if (saved.dateFilter) setDateFilter(saved.dateFilter);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    const getEventDateMs = (item: Event) => {
        const candidate = item.startAt || item.date;
        if (!candidate) return null;
        const ms = new Date(candidate).getTime();
        return Number.isFinite(ms) ? ms : null;
    };

    const categoryOptions = useMemo(() => {
        const set = new Set<string>();
        allEvents.forEach((e) => {
            if (e.category) set.add(e.category);
        });
        const categories = Array.from(set).filter(Boolean);
        if (categories.length === 0) return [{ value: 'Music', label: 'Music' }, { value: 'Tech', label: 'Tech' }];
        return categories.slice(0, 12).map((c) => ({ value: c, label: c }));
    }, [allEvents]);

    const filteredAndSortedEvents = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        let filtered = allEvents.filter((item) => {
            const title = (item.name || item.title || '').toLowerCase();
            if (lowerQuery && !title.includes(lowerQuery)) return false;
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (dateFilter) {
                const dateMs = getEventDateMs(item);
                if (dateMs === null) return false;
                if (dateFilter === 'upcoming' && dateMs < now) return false;
                if (dateFilter === 'past' && dateMs >= now) return false;
                if (dateFilter === 'week' && (dateMs < now || dateMs > now + weekMs)) return false;
            }
            return true;
        });

        if (sortBy === 'date-asc' || sortBy === 'date-desc') {
            const direction = sortBy === 'date-asc' ? 1 : -1;
            filtered = filtered.sort((a, b) => {
                const msA = getEventDateMs(a);
                const msB = getEventDateMs(b);
                if (msA === null && msB === null) return 0;
                if (msA === null) return 1;
                if (msB === null) return -1;
                return direction * (msA - msB);
            });
        }

        return filtered;
    }, [allEvents, debouncedQuery, categoryFilter, dateFilter, sortBy]);

    const handleEventPress = useCallback((item: Event) => {
        navigation.navigate('EventDetail', { item });
    }, [navigation]);

    const renderListHeader = () => (
        <View>
            {/* 1. Featured Events Section */}
            <View style={{ paddingVertical: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 20, marginBottom: 16 }}>Featured events</Text>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={allEvents.slice(0, 5)}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    keyExtractor={(item) => `featured-${item._id}`}
                    renderItem={({ item }) => <FeaturedEventCard item={item} onPress={handleEventPress} />}
                />
            </View>

            {/* 2. All Events Title */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>All Events</Text>
            </View>

            {/* 3. Filter Section (Below All Events Title) */}
            <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                    <TouchableOpacity
                        onPress={() => setShowFilters(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Ionicons name="options-outline" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Filters</Text>
                        <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Date</Text>
                        <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#FF7F50' }}>Near & Fast</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* FIXED STICKY HEADER */}
            <View style={{ backgroundColor: '#FFF9F1', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
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

                <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 16, height: 44, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 }}>
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' }}
                        placeholder={'Search for "Concert"'}
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

            <FlatList
                data={filteredAndSortedEvents}
                numColumns={2}
                keyExtractor={(item) => `all-${item._id}`}
                renderItem={({ item }) => <EventCard item={item} onPress={handleEventPress} isGrid />}
                ListHeaderComponent={renderListHeader}
                columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                onEndReached={() => hasNextPage && fetchNextPage()}
                ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={{ padding: 20 }} color="#FF7F50" /> : null}
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
            />
            
            <FilterBottomSheet
                visible={showFilters}
                onClose={() => setShowFilters(false)}
                onClear={() => { setCategoryFilter(null); setDateFilter(null); setSortBy('default'); }}
                accentColor="#FF7F50"
                sections={[
                    {
                        title: 'Category',
                        options: categoryOptions,
                        selected: categoryFilter,
                        onSelect: (v) => setCategoryFilter(v === categoryFilter ? null : (v as string)),
                    },
                    {
                        title: 'Date',
                        options: [
                            { value: 'upcoming', label: 'Upcoming' },
                            { value: 'week', label: 'This week' },
                            { value: 'past', label: 'Past' },
                        ],
                        selected: dateFilter,
                        onSelect: (v) => setDateFilter(v === dateFilter ? null : (v as any)),
                    },
                    {
                        title: 'Sort by',
                        options: [
                            { value: 'default', label: 'Default' },
                            { value: 'date-asc', label: 'Date: Soonest first' },
                            { value: 'date-desc', label: 'Date: Latest first' },
                        ],
                        selected: sortBy,
                        onSelect: (v) => setSortBy(v as SortOption),
                    }
                ]}
            />
        </View>
    );
};
