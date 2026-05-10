import React, { useMemo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { EmptyState } from '@/ui/components/EmptyState';
import { Event } from '@/domains/events/types';
import { EventCard } from '@/domains/events/components/EventCard';
import { useEventsInfinite, useLocalEventFavoriteItems, useLocalEventFavorites } from '@/domains/events/hooks/useEvents';

export const FavoriteEventsScreen: React.FC = () => {
    const navigation = useNavigation();

    const { data: favoriteIds } = useLocalEventFavorites();
    const { data: favoriteItems, isLoading: isLoadingFavoriteItems } = useLocalEventFavoriteItems();

    const { data, isLoading, isError, refetch } = useEventsInfinite();

    const allEvents = useMemo(() => {
        const items = data?.pages.flatMap((p) => p.items) ?? [];
        const seen = new Set<string>();
        return items.filter((e) => {
            if (!e._id) return false;
            if (seen.has(e._id)) return false;
            seen.add(e._id);
            return true;
        });
    }, [data]);

    const favorites = useMemo(() => {
        const items = favoriteItems ?? [];
        if (items.length > 0) {
            const seen = new Set<string>();
            return items.filter((e) => {
                if (!e?._id) return false;
                if (seen.has(e._id)) return false;
                seen.add(e._id);
                return true;
            });
        }
        const ids = new Set(favoriteIds ?? []);
        return allEvents.filter((e) => ids.has(e._id));
    }, [allEvents, favoriteIds, favoriteItems]);

    const handleEventPress = (item: Event) => {
        (navigation as any).navigate('EventDetail', { item });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 }}>
                <ScreenHeader
                    title="Favourites"
                    subtitle="Your saved events"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            {isError ? (
                <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
                    <Text style={{ color: '#b91c1c', fontWeight: '700' }}>Failed to load events.</Text>
                </View>
            ) : null}

            <FlatList
                data={favorites}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <EventCard item={item} onPress={handleEventPress} isGrid />}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, paddingTop: 8 }}
                refreshing={isLoading || isLoadingFavoriteItems}
                onRefresh={refetch}
                ListEmptyComponent={
                    <EmptyState
                        title="No favourites yet"
                        description="Tap the bookmark on any event to save it here."
                        actionLabel="Go back"
                        onAction={() => (navigation as any).goBack()}
                    />
                }
            />
        </View>
    );
};
