import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image } from 'react-native';
import { Event } from '@/domains/events/types';
import { Restaurant } from '@/domains/restaurants/types';
import { Tiffin } from '@/domains/tiffins/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface SearchResultsSectionProps {
    title: string;
    data: Restaurant[] | Tiffin[] | Event[];
    onItemPress: (item: any) => void;
    emptyMessage?: string;
}

export const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
    title,
    data,
    onItemPress,
    emptyMessage = 'No results found',
}) => {
    const theme = useTheme();

    const dedupedData = React.useMemo(() => {
        const seen = new Set<string>();
        return data.filter((item: any) => {
            const id = item._id;
            if (!id) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }, [data]);

    if (!data || data.length === 0) return null;

    const renderItem = ({ item }: { item: any }) => {
        const imageUrl = item.imageUrl || item.images?.[0];
        const displayName = item.name || item.title || 'Untitled';
        const description = item.description || item.shortDescription || '';

        return (
            <TouchableOpacity
                data-testid={`search-result-${item._id}`}
                style={{ backgroundColor: theme.card, borderRadius: 24, overflow: 'hidden', marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: theme.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 }}
                onPress={() => onItemPress(item)}
            >
                <View style={{ width: 96, height: 96, backgroundColor: theme.border }}>
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 96, height: 96 }} />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 12, color: theme.subtext }}>No image</Text>
                        </View>
                    )}
                </View>
                <View style={{ flex: 1, padding: 12, justifyContent: 'center' }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }} numberOfLines={1}>
                        {displayName}
                    </Text>
                    {description ? (
                        <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 4 }} numberOfLines={2}>
                            {description}
                        </Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>{title}</Text>
            <FlatList
                data={dedupedData}
                keyExtractor={(item, index) => (item._id || index).toString()}
                renderItem={renderItem}
                scrollEnabled={false}
            />
        </View>
    );
};
