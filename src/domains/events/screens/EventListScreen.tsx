import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, ImageBackground, RefreshControl, Platform, ToastAndroid, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '@/app/navigation/types';
import { useEventsInfinite, useLocalEventFavorites, useToggleLocalEventFavorite } from '../hooks/useEvents';
import { Event } from '@/domains/events/types';
import { EventCard } from '../components/EventCard';
import { storage } from '@/services/storage/localStorage';
import { useTheme } from '@/ui/context/ThemeContext';
import { FilterBottomSheet } from '@/ui/components/FilterBottomSheet';
import { useUser } from '@/ui/context/UserContext';
import { prefetchImages } from '@/ui/utils/imagePrefetch';
import { useQueryClient } from '@tanstack/react-query';
import { mockEvents } from '../Mockdata/mockData';
import { useVoiceSearch } from '@/domains/search/hooks/useVoiceSearch';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventList'>;
type SortOption = 'default' | 'date-asc' | 'date-desc';

type VenueObj = { name?: string; address?: string; city?: string; state?: string; country?: string };

function getCardLocation(item: Event): string {
    if (item.venue && typeof item.venue === 'object') {
        const v = item.venue as VenueObj;
        const cityState = [v.city, v.state].filter(Boolean).join(', ');
        if (v.name && cityState) return `${v.name} · ${cityState}`;
        if (v.name) return v.name;
        if (cityState) return cityState;
        if (v.address) return v.address;
    }
    if (typeof item.venue === 'string' && item.venue.trim()) return item.venue;
    if (item.location?.address) return item.location.address;
    return '';
}

function formatEventDate(item: Event): string {
    const raw = item.startAt || item.date;
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Featured Card ────────────────────────────────────────────────────────────
const FeaturedEventCard = ({ item, onPress }: { item: Event; onPress: (item: Event) => void }) => {
    const { data: favoriteIds } = useLocalEventFavorites();
    const toggleFavorite = useToggleLocalEventFavorite();
    const queryClient = useQueryClient();

    const isFavorited   = useMemo(() => (favoriteIds ?? []).includes(item._id), [favoriteIds, item._id]);
    const locationLabel = useMemo(() => getCardLocation(item), [item]);
    const dateLabel     = useMemo(() => formatEventDate(item), [item]);

    return (
        <TouchableOpacity
            onPress={() => onPress(item)}
            activeOpacity={0.9}
            style={{ width: 200, marginRight: 16, backgroundColor: '#FFF' }}
        >
            <ImageBackground
                source={{ uri: item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800' }}
                style={{ width: 200, height: 260, overflow: 'hidden' }}
                imageStyle={{ borderRadius: 12 }}
                resizeMode="cover"
            >
                <TouchableOpacity
                    onPress={async () => {
                        const prev = isFavorited;
                        const result = await toggleFavorite.mutateAsync(item._id);
                        if (result.isFavorited) {
                            await storage.upsertFavoriteEventItem(item);
                        } else {
                            await storage.removeFavoriteEventItem(item._id);
                        }
                        queryClient.invalidateQueries({ queryKey: ['local-event-favorite-items'] });
                        const message = prev ? 'Removed from favourites' : 'Added to favourites';
                        if (Platform.OS === 'android') {
                            ToastAndroid.show(message, ToastAndroid.SHORT);
                        } else {
                            Alert.alert('Favourites', message);
                        }
                    }}
                    disabled={toggleFavorite.isPending}
                    style={{
                        position: 'absolute', top: 12, right: 12,
                        backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20,
                        width: 32, height: 32, alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Ionicons name={isFavorited ? 'bookmark' : 'bookmark-outline'} size={18} color="#FFF" />
                </TouchableOpacity>
            </ImageBackground>

            <View style={{ marginTop: 10 }}>
                {!!locationLabel && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="location-outline" size={12} color="#FF7F50" style={{ marginRight: 3 }} />
                        <Text style={{ fontSize: 11, color: '#FF7F50', fontWeight: '600', flex: 1 }} numberOfLines={1}>
                            {locationLabel}
                        </Text>
                    </View>
                )}
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 }} numberOfLines={2}>
                    {item.name || item.title}
                </Text>
                {!!dateLabel && (
                    <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{dateLabel}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const EventListScreen: React.FC<Props> = ({ navigation }) => {
    const { user } = useUser();

    const [query, setQuery]                   = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [dateFilter, setDateFilter]         = useState<'upcoming' | 'week' | 'past' | null>(null);
    const [sortBy, setSortBy]                 = useState<SortOption>('default');
    const [showFilters, setShowFilters]       = useState(false);

    // ── Voice search ──────────────────────────────────────────────────────────
    const { startListening, stopListening, isListening, isProcessing } = useVoiceSearch(
        (text) => setQuery(text)          // fills the search bar with the result
    );

    const handleMicPress = useCallback(() => {
        if (isListening) {
            void stopListening();
        } else {
            void startListening();
        }
    }, [isListening, startListening, stopListening]);
    // ─────────────────────────────────────────────────────────────────────────

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, isRefetching, refetch } =
        useEventsInfinite();

    const allEvents = useMemo(() => {
        const apiItems = data?.pages.flatMap((p) => p.items) ?? [];
        const combined = [...apiItems, ...(mockEvents as Event[])];
        const seen = new Set<string>();
        return combined.filter((item) => {
            if (!item._id) return true;
            if (seen.has(item._id)) return false;
            seen.add(item._id);
            return true;
        });
    }, [data]);

    useEffect(() => {
        const urls = allEvents.flatMap((item) => [
            ...(Array.isArray(item.images) ? item.images : []),
            item.imageUrl,
        ]).filter(Boolean) as string[];
        if (urls.length > 0) void prefetchImages(urls, 80);
    }, [allEvents]);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 500);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => { loadFilters(); }, []);

    useEffect(() => {
        void storage.saveFilters('events', { categoryFilter, dateFilter, sortBy });
    }, [categoryFilter, dateFilter, sortBy]);

    const loadFilters = async () => {
        const saved = await storage.getFilters('events');
        if (!saved) return;
        if (saved.categoryFilter) setCategoryFilter(saved.categoryFilter);
        if (saved.dateFilter)     setDateFilter(saved.dateFilter);
        if (saved.sortBy)         setSortBy(saved.sortBy);
    };

    const getEventDateMs = (item: Event) => {
        const raw = item.startAt || item.date;
        if (!raw) return null;
        const ms = new Date(raw).getTime();
        return Number.isFinite(ms) ? ms : null;
    };

    const categoryOptions = useMemo(() => {
        const set = new Set<string>();
        allEvents.forEach((e) => { if (e.category) set.add(e.category); });
        const cats = Array.from(set).filter(Boolean);
        if (cats.length === 0) return [{ value: 'Music', label: 'Music' }, { value: 'Tech', label: 'Tech' }];
        return cats.slice(0, 12).map((c) => ({ value: c, label: c }));
    }, [allEvents]);

    const filteredAndSortedEvents = useMemo(() => {
        const lq  = debouncedQuery.toLowerCase();
        const now = Date.now();
        const weekMs = 7 * 24 * 60 * 60 * 1000;

        let filtered = allEvents.filter((item) => {
            const title = (item.name || item.title || '').toLowerCase();
            if (lq && !title.includes(lq)) return false;
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (dateFilter) {
                const ms = getEventDateMs(item);
                if (ms === null) return false;
                if (dateFilter === 'upcoming' && ms < now)                        return false;
                if (dateFilter === 'past'     && ms >= now)                       return false;
                if (dateFilter === 'week'     && (ms < now || ms > now + weekMs)) return false;
            }
            return true;
        });

        if (sortBy === 'date-asc' || sortBy === 'date-desc') {
            const dir = sortBy === 'date-asc' ? 1 : -1;
            filtered = [...filtered].sort((a, b) => {
                const ma = getEventDateMs(a), mb = getEventDateMs(b);
                if (ma === null && mb === null) return 0;
                if (ma === null) return 1;
                if (mb === null) return -1;
                return dir * (ma - mb);
            });
        }
        return filtered;
    }, [allEvents, debouncedQuery, categoryFilter, dateFilter, sortBy]);

    const handleEventPress = useCallback((item: Event) => {
        navigation.navigate('EventDetail', { item });
    }, [navigation]);

    const renderListHeader = () => (
        <View>
            {/* Featured */}
            <View style={{ paddingVertical: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A', paddingHorizontal: 20, marginBottom: 16 }}>
                    Featured events
                </Text>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={allEvents.slice(0, 12)}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    keyExtractor={(item) => `featured-${item._id}`}
                    renderItem={({ item }) => <FeaturedEventCard item={item} onPress={handleEventPress} />}
                />
            </View>

            {/* All Events title */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>All Events</Text>
            </View>

            {/* Filter chips */}
            <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
                    <TouchableOpacity onPress={() => setShowFilters(true)} style={chipStyle}>
                        <Ionicons name="options-outline" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={chipText}>Filters</Text>
                        <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={chipStyle}>
                        <Text style={chipText}>Date</Text>
                        <Ionicons name="caret-down" size={12} color="#FF7F50" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={chipStyle}>
                        <Text style={chipText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={chipStyle}>
                        <Text style={chipText}>Near & Fast</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('FavoriteEvents')} style={chipStyle}>
                        <Ionicons name="bookmark" size={16} color="#FF7F50" style={{ marginRight: 6 }} />
                        <Text style={chipText}>Favourites</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );

    // ── Mic button appearance ─────────────────────────────────────────────────
    const micIcon = isListening ? 'mic' : isProcessing ? 'hourglass-outline' : 'mic-outline';
    const micColor = isListening ? '#FF7F50' : isProcessing ? '#FFA07A' : '#1A1A1A';

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Sticky header */}
            <View style={{ backgroundColor: '#FFF9F1', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 28, fontWeight: '700', color: '#1A1A1A' }}>
                                Hey, {user?.name?.split(' ')[0] || 'Ganesh'}
                            </Text>
                            <Text style={{ fontSize: 24, marginLeft: 8 }}>👋</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="location-outline" size={16} color="#4A4A4A" />
                            <Text style={{ fontSize: 16, color: '#4A4A4A', marginLeft: 4, fontWeight: '500' }}>
                                Toronto, Canada..
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('SettingsStack' as any)}
                        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#5D69BE', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>
                            {(user?.name || 'G')[0].toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Search bar */}
                <View style={{
                    marginTop: 20, flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#FFF', borderRadius: 22, paddingHorizontal: 16,
                    height: 44, borderWidth: 1,
                    borderColor: isListening ? '#FF7F50' : '#F0F0F0',
                    elevation: 1,
                }}>
                    <Ionicons name="search" size={18} color="#666" />
                    <TextInput
                        style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#1A1A1A' }}
                        placeholder={isListening ? 'Listening...' : 'Search for "Concert"'}
                        placeholderTextColor={isListening ? '#FF7F50' : '#999'}
                        value={query}
                        onChangeText={setQuery}
                        editable={!isListening && !isProcessing}
                    />
                    <View style={{ width: 1, height: 20, backgroundColor: '#EEE', marginHorizontal: 10 }} />

                    {/* Mic button */}
                    <TouchableOpacity
                        onPress={handleMicPress}
                        disabled={isProcessing}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color="#FF7F50" />
                        ) : (
                            <Ionicons name={micIcon} size={18} color={micColor} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Listening pulse label */}
                {isListening && (
                    <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#FF7F50', fontWeight: '600' }}>
                        🎙 Tap mic again when done speaking
                    </Text>
                )}
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
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#FF7F50" />}
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
                            { value: 'week',     label: 'This week' },
                            { value: 'past',     label: 'Past' },
                        ],
                        selected: dateFilter,
                        onSelect: (v) => setDateFilter(v === dateFilter ? null : (v as any)),
                    },
                    {
                        title: 'Sort by',
                        options: [
                            { value: 'default',   label: 'Default' },
                            { value: 'date-asc',  label: 'Date: Soonest first' },
                            { value: 'date-desc', label: 'Date: Latest first' },
                        ],
                        selected: sortBy,
                        onSelect: (v) => setSortBy(v as SortOption),
                    },
                    {
                        title: 'Favourites',
                        options: [{ value: 'open', label: 'View favourites' }],
                        selected: null,
                        onSelect: () => { setShowFilters(false); navigation.navigate('FavoriteEvents'); },
                    },
                ]}
            />
        </View>
    );
};

const chipStyle = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFF5F0',
    borderColor: '#FF7F50',
    elevation: 2,
};
const chipText = { fontSize: 13, fontWeight: '600' as const, color: '#FF7F50' };