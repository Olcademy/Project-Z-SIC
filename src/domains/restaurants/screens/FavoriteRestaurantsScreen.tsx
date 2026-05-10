import React, { useMemo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useLocalRestaurantFavoriteItems, useLocalRestaurantFavorites, useRestaurantsInfinite } from '@/domains/restaurants/hooks/useRestaurants';
import { RestaurantCard } from '@/domains/restaurants/components/RestaurantCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { Restaurant } from '@/domains/restaurants/types';
import { storage } from '@/services/storage/localStorage';


export const FavoriteRestaurantsScreen: React.FC = () => {
    const navigation = useNavigation();

    const [globalVegOnlyMode, setGlobalVegOnlyMode] = React.useState(false);

    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        });
        void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        return unsub;
    }, [navigation]);

    const { data: favoriteIds } = useLocalRestaurantFavorites();
    const { data: favoriteItems, isLoading: isLoadingFavoriteItems } = useLocalRestaurantFavoriteItems();
    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useRestaurantsInfinite();

    const allRestaurants = useMemo(() => {
        const items = data?.pages.flatMap((p) => p.items) ?? [];
        const seen = new Set<string>();
        return items.filter((r) => {
            const id = r._id;
            if (!id) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [data]);

    const isVegRestaurant = (item: Restaurant) => {
        const cuisines = Array.isArray(item.cuisines) ? item.cuisines : [];
        const tags = cuisines.map((tag) => tag.toLowerCase());
        const hasNonVeg = tags.includes('non-veg') || tags.includes('non veg') || tags.includes('nonveg') || tags.some(t => t.includes('non-veg') || t.includes('non veg') || t.includes('nonveg'));
        
        if (hasNonVeg) return false;
        if (item.vegOnly || item.isVeg) return true;
        
        return tags.includes('veg') || tags.includes('vegetarian') || tags.includes('pure veg');
    };

    const favorites = useMemo(() => {
        const items = favoriteItems ?? [];
        let filtered: Restaurant[] = [];

        if (items.length > 0) {
            const seen = new Set<string>();
            filtered = items.filter((r) => {
                const id = r?._id;
                if (!id) return false;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
            });
        } else {
            const ids = new Set(favoriteIds ?? []);
            filtered = allRestaurants.filter((r) => ids.has(r._id));
        }

        if (globalVegOnlyMode) {
            filtered = filtered.filter((r) => isVegRestaurant(r));
        }

        return filtered;
    }, [allRestaurants, favoriteIds, favoriteItems, globalVegOnlyMode]);

    const handleRestaurantPress = (item: Restaurant) => {
        (navigation as any).navigate('RestaurantDetail', { item });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 }}>
                <ScreenHeader
                    title="Favourites"
                    subtitle="Your saved restaurants"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            {isError ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ color: '#b91c1c', fontWeight: '700' }}>Failed to load restaurants.</Text>
                </View>
            ) : null}

            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <RestaurantCard item={item} onPress={handleRestaurantPress} />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                refreshing={isLoading || isLoadingFavoriteItems}
                onRefresh={refetch}
                ListEmptyComponent={
                    <EmptyState
                        title="No favourites yet"
                        description="Tap the heart on any restaurant to save it here."
                        actionLabel="Go back"
                        onAction={() => (navigation as any).goBack()}
                    />
                }
            />
        </View>
    );
};
