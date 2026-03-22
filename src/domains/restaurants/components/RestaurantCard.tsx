import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Restaurant } from '@/domains/restaurants/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface RestaurantCardProps {
    item: Restaurant;
    onPress: (id: string) => void;
}

export const RestaurantCard = memo<RestaurantCardProps>(({ item, onPress }) => {
    const theme = useTheme();

    const getCuisineTags = (item: Restaurant) => {
        if (Array.isArray(item.cuisineTags)) return item.cuisineTags;
        if (Array.isArray(item.cuisines)) return item.cuisines;
        if (typeof item.cuisines === 'string') {
            return item.cuisines.split(',').map((c) => c.trim()).filter(Boolean);
        }
        return [];
    };

    const getPriceValue = (item: Restaurant) => {
        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match && match.length > 0) return Number(match[0]);
        }
        return null;
    };

    const isVegRestaurant = (item: Restaurant) => {
        if (item.vegOnly || item.isVeg) return true;
        const tags = getCuisineTags(item).map((tag) => tag.toLowerCase());
        return tags.includes('veg') || tags.includes('vegetarian') || tags.includes('pure veg');
    };

    const cuisines = getCuisineTags(item);
    const priceValue = getPriceValue(item);
    const imageUrl = item.imageUrl || item.images?.[0];
    const isVeg = isVegRestaurant(item);

    return (
        <TouchableOpacity
            data-testid={`restaurant-card-${item._id}`}
            activeOpacity={0.92}
            style={{
                backgroundColor: theme.card,
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 18,
                shadowColor: '#02757A',
                shadowOpacity: 0.10,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
            }}
            onPress={() => onPress(item._id || 'unknown')}
        >
            <View style={{ height: 180, backgroundColor: '#e8f4f4' }}>
                {imageUrl ? (
                    <ImageBackground source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover">
                        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.38)' }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                            {isVeg && (
                                <View style={{ backgroundColor: '#16a34a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>🌿 PURE VEG</Text>
                                </View>
                            )}
                            {priceValue !== null && (
                                <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>₹{priceValue} for two</Text>
                                </View>
                            )}
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 40 }}>🍽️</Text>
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 6 }}>No image available</Text>
                    </View>
                )}
            </View>

            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {item.name || 'Unnamed Restaurant'}
                    </Text>
                    {item.rating && (
                        <View style={{ backgroundColor: '#02757A', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>⭐ {item.rating}</Text>
                        </View>
                    )}
                </View>

                {cuisines.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
                        {cuisines.slice(0, 3).map((c) => (
                            <View key={c} style={{ backgroundColor: theme.chipBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: theme.chipBorder }}>
                                <Text style={{ fontSize: 11, color: theme.chipText, fontWeight: '600' }}>{c}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {item.description ? (
                    <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 8, lineHeight: 18 }} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}

                <View style={{ height: 1, backgroundColor: theme.border, marginTop: 12, marginBottom: 10 }} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '500' }}>Tap to explore menu</Text>
                    <View style={{ backgroundColor: '#02757A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>View →</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, () => false);

RestaurantCard.displayName = 'RestaurantCard';
