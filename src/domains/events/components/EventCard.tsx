import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Event } from '@/domains/events/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface EventCardProps {
    item: Event;
    onPress: (item: Event) => void;
}

export const EventCard = memo<EventCardProps>(({ item, onPress }) => {
    const theme = useTheme();

    const formatVenue = (venue?: Event['venue']) => {
        if (!venue) return '';
        if (typeof venue === 'string') return venue;
        if (typeof venue === 'object') {
            const value = venue as { name?: string; address?: string; city?: string; state?: string; country?: string };
            return [value.name, value.address, value.city, value.state, value.country]
                .filter(Boolean)
                .join(', ');
        }
        return String(venue);
    };

    const isPastEvent = (dateString?: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return false;
        return date.getTime() < Date.now();
    };

    const imageUrl = item.imageUrl || item.images?.[0];
    const ended = isPastEvent(item.date);

    return (
        <TouchableOpacity
            data-testid={`event-card-${item._id}`}
            activeOpacity={0.92}
            style={{
                backgroundColor: theme.card,
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 18,
                shadowColor: '#6d28d9',
                shadowOpacity: 0.10,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
            }}
            onPress={() => onPress(item)}
        >
            <View style={{ height: 180, backgroundColor: '#ede9fe' }}>
                {imageUrl ? (
                    <ImageBackground source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover">
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.38)' }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                            {item.category && (
                                <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.category}</Text>
                                </View>
                            )}
                            {ended && (
                                <View style={{ marginLeft: 'auto', backgroundColor: '#dc2626', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>ENDED</Text>
                                </View>
                            )}
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 40 }}>🎪</Text>
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 6 }}>No image available</Text>
                    </View>
                )}
            </View>

            <View style={{ padding: 16, backgroundColor: theme.card }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }} numberOfLines={1}>
                    {item.name || item.title || 'Unnamed Event'}
                </Text>
                {item.date && (
                    <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 6 }}>{new Date(item.date).toLocaleDateString()}</Text>
                )}
                {item.venue && (
                    <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 4 }} numberOfLines={1}>Venue: {formatVenue(item.venue)}</Text>
                )}
                {item.category && (
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#02757A', marginTop: 6 }}>{item.category}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}, () => false);

EventCard.displayName = 'EventCard';
