import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useLocalTiffinFavorites, useTiffinsInfinite } from '@/domains/tiffins/hooks/useTiffins';
import { TiffinCard } from '@/domains/tiffins/components/TiffinCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { Tiffin } from '@/domains/tiffins/types';

export const FavoriteTiffinsScreen: React.FC = () => {
    const navigation = useNavigation();

    const { data: favoriteIds } = useLocalTiffinFavorites();
    const { data, isLoading, isError, refetch } = useTiffinsInfinite();

    const allTiffins = useMemo(() => {
        const items = data?.pages.flatMap((p) => p.items) ?? [];
        const seen = new Set<string>();
        return items.filter((t) => {
            if (!t._id) return true;
            if (seen.has(t._id)) return false;
            seen.add(t._id);
            return true;
        });
    }, [data]);

    const favorites = useMemo(() => {
        const ids = new Set(favoriteIds ?? []);
        return allTiffins.filter((t) => ids.has(t._id));
    }, [allTiffins, favoriteIds]);

    const handleTiffinPress = (item: Tiffin) => {
        (navigation as any).navigate('TiffinDetail', { item });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 }}>
                <ScreenHeader
                    title="Favourites"
                    subtitle="Your saved tiffins"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <TiffinCard item={item} onPress={handleTiffinPress} />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                refreshing={isLoading}
                onRefresh={refetch}
                ListEmptyComponent={
                    <EmptyState
                        title="No favourites yet"
                        description="Tap the heart on any tiffin to save it here."
                        actionLabel="Go back"
                        onAction={() => (navigation as any).goBack()}
                    />
                }
            />
        </View>
    );
};
