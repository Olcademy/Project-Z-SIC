import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useLocalTiffinFavoriteItems, useLocalTiffinFavorites, useTiffinsInfinite } from '@/domains/tiffins/hooks/useTiffins';
import { TiffinCard } from '@/domains/tiffins/components/TiffinCard';
import { EmptyState } from '@/ui/components/EmptyState';
import { Tiffin } from '@/domains/tiffins/types';
import { storage } from '@/services/storage/localStorage';


export const FavoriteTiffinsScreen: React.FC = () => {
    const navigation = useNavigation();

    const [globalVegOnlyMode, setGlobalVegOnlyMode] = React.useState(false);

    const isVegTiffin = (item: Tiffin) => {
        const text = [
            item.name, 
            item.shortDescription, 
            ...(Array.isArray(item.category) ? item.category : [])
        ].filter(Boolean).join(' ').toLowerCase();
        
        const nonVegKeywords = ['chicken', 'mutton', 'beef', 'pork', 'fish', 'prawn', 'meat', 'egg', 'non-veg', 'non veg', 'nonveg'];
        if (nonVegKeywords.some(kw => text.includes(kw))) {
            return false;
        }

        const vegKeywords = ['veg', 'vegetarian', 'paneer', 'dal', 'roti', 'rice', 'sabzi', 'pure veg', 'chole', 'rajma', 'aloo', 'thali'];
        if (vegKeywords.some(kw => text.includes(kw))) {
            return true;
        }

        return item.vegOnly === true;
    };


    React.useEffect(() => {
        const unsub = navigation.addListener('focus', () => {
            void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        });
        void storage.getVegOnlyMode().then(setGlobalVegOnlyMode);
        return unsub;
    }, [navigation]);

    const { data: favoriteIds } = useLocalTiffinFavorites();
    const { data: favoriteItems, isLoading: isLoadingFavoriteItems } = useLocalTiffinFavoriteItems();
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
        const items = favoriteItems ?? [];
        let filtered: Tiffin[] = [];

        if (items.length > 0) {
            const seen = new Set<string>();
            filtered = items.filter((t) => {
                if (!t?._id) return false;
                if (seen.has(t._id)) return false;
                seen.add(t._id);
                return true;
            });
        } else {
            const ids = new Set(favoriteIds ?? []);
            filtered = allTiffins.filter((t) => ids.has(t._id));
        }

        if (globalVegOnlyMode) {
            filtered = filtered.filter((t) => isVegTiffin(t));
        }

        return filtered;
    }, [allTiffins, favoriteIds, favoriteItems, globalVegOnlyMode]);

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
                refreshing={isLoading || isLoadingFavoriteItems}
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
