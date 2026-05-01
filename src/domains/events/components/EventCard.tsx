import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/domains/events/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface EventCardProps {
    item: Event;
    onPress: (item: Event) => void;
    isGrid?: boolean;
}

export const EventCard = memo<EventCardProps>(({ item, onPress, isGrid }) => {
    const theme = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const gridItemWidth = (screenWidth - 56) / 2; // (Screen - horizontal padding - gap) / 2

    const formatVenue = (venue?: Event['venue']) => {
        if (!venue) return '';
        if (typeof venue === 'string') return venue;
        if (typeof venue === 'object') {
            const value = venue as { name?: string; city?: string };
            return [value.name, value.city].filter(Boolean).join(', ');
        }
        return String(venue);
    };

    const imageUrl = item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800';

    return (
        <TouchableOpacity
            data-testid={`event-card-${item._id}`}
            activeOpacity={0.92}
            style={{
                width: isGrid ? gridItemWidth : '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: 0,
                marginBottom: 24,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                borderWidth: 1,
                borderColor: '#F0F0F0',
            }}
            onPress={() => onPress(item)}
        >
            <View style={{ height: isGrid ? 200 : 220, backgroundColor: '#F3F4F6', borderRadius: 0, overflow: 'hidden' }}>
                <ImageBackground 
                    source={{ uri: imageUrl }} 
                    style={{ flex: 1 }} 
                    imageStyle={{ borderRadius: 0 }}
                    resizeMode="cover"
                >
                    <TouchableOpacity 
                        style={{ 
                            position: 'absolute', top: 10, right: 10, 
                            backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, 
                            width: 28, height: 28, alignItems: 'center', justifyContent: 'center' 
                        }}
                    >
                        <Ionicons name="bookmark-outline" size={16} color="#FFF" />
                    </TouchableOpacity>
                </ImageBackground>
            </View>

            <View style={{ padding: 10 }}>
                <Text style={{ fontSize: isGrid ? 14 : 16, fontWeight: '700', color: '#1A1A1A' }} numberOfLines={2}>
                    {item.name || item.title || 'Unnamed Event'}
                </Text>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                    Sat, 25 Apr, 10:00 PM
                </Text>
                <Text style={{ fontSize: 11, color: '#999', marginTop: 2 }} numberOfLines={1}>
                    {formatVenue(item.venue) || 'The Penthouse, Palm jumeira'}
                </Text>
            </View>
        </TouchableOpacity>
    );
});

EventCard.displayName = 'EventCard';
