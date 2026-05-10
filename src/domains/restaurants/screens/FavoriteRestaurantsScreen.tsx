import React, { useMemo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useLocalRestaurantFavorites, useRestaurantsInfinite } from '@/domains/restaurants/hooks/useRestaurants';
import { RestaurantCard } from '@/domains/restaurants/components/RestaurantCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { Restaurant } from '@/domains/restaurants/types';

export const FavoriteRestaurantsScreen: React.FC = () => {
    const navigation = useNavigation();

    const { data: favoriteIds } = useLocalRestaurantFavorites();
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
            if (!r._id) return true;
            if (seen.has(r._id)) return false;
            seen.add(r._id);
            return true;
        });
    }, [data]);

    const favorites = useMemo(() => {
        const ids = new Set(favoriteIds ?? []);
        return allRestaurants.filter((r) => ids.has(r._id));
    }, [allRestaurants, favoriteIds]);

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
                refreshing={isLoading}
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
