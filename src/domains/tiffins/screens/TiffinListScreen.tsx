import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinList'>;
type SortOption = 'default' | 'price-low' | 'price-high' | 'veg-first';

export const TiffinListScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useTheme();
    const { user } = useUser();

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [vegOnly, setVegOnly] = useState(false);
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

    const loadFilters = async () => {
        const saved = await storage.getFilters('tiffins');
        if (saved) {
            if (saved.vegOnly !== undefined) setVegOnly(saved.vegOnly);
            if (saved.topRated !== undefined) setTopRated(saved.topRated);
            if (saved.hasOffers !== undefined) setHasOffers(saved.hasOffers);
            if (saved.sortBy) setSortBy(saved.sortBy);
        }
    };

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const getPriceValue = (item: Tiffin) => {
        if (typeof item.pricePerMeal === 'number') return item.pricePerMeal;
        if (typeof item.priceRange === 'number') return item.priceRange;
        return null;
    };

    const filteredAndSortedTiffins = useMemo(() => {
        const lowerQuery = debouncedQuery.toLowerCase();
        let filtered = allTiffins.filter((item) => {
            const searchable = [item.name, item.shortDescription].filter(Boolean).join(' ').toLowerCase();
            if (lowerQuery && !searchable.includes(lowerQuery)) return false;
            if (vegOnly && !item.vegOnly) return false;
            if (topRated && (item.rating ?? 0) < 4.0) return false;
            if (hasOffers && !item.hasOffer && !item.offer) return false;
            return true;
        });

        if (sortBy === 'price-low') {
            filtered = filtered.sort((a, b) => (getPriceValue(a) ?? Infinity) - (getPriceValue(b) ?? Infinity));
        } else if (sortBy === 'price-high') {
            filtered = filtered.sort((a, b) => (getPriceValue(b) ?? 0) - (getPriceValue(a) ?? 0));
        }

        return filtered;
    }, [allTiffins, debouncedQuery, vegOnly, topRated, hasOffers, sortBy]);

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
                    onPress={() => setVegOnly(p => !p)}
                    style={{ marginRight: 10, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: vegOnly ? '#FF7F50' : '#FFF5F0', borderColor: '#FF7F50', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 }}
                >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: vegOnly ? '#FFF' : '#FF7F50' }}>Veg</Text>
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
                    renderItem={({ item }) => <TiffinCard item={item} onPress={handleTiffinPress} />}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                    onEndReached={() => hasNextPage && fetchNextPage()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={isFetchingNextPage ? <ActivityIndicator size="small" color="#FF7F50" /> : null}
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
                accentColor="#FF7F50"
                sections={[
                    {
                        title: 'Sort by',
                        options: [
                            { value: 'default', label: 'Default' },
                            { value: 'price-low', label: 'Price: Low to High' },
                            { value: 'price-high', label: 'Price: High to Low' },
                        ],
                        selected: sortBy,
                        onSelect: (v) => setSortBy(v as SortOption),
                    }
                ]}
            />
        </View>
    );
};
