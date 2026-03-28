import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/domains/restaurants/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface RestaurantCardProps {
    item: Restaurant;
    onPress: (id: string) => void;
}

export const RestaurantCard = memo<RestaurantCardProps>(({ item, onPress }) => {
    const theme = useTheme();

    const getCuisineTags = (r: Restaurant) => {
        if (Array.isArray(r.cuisineTags)) return r.cuisineTags;
        if (Array.isArray(r.cuisines)) return r.cuisines;
        if (typeof r.cuisines === 'string') return r.cuisines.split(',').map(c => c.trim()).filter(Boolean);
        return [];
    };

    const getPriceValue = (r: Restaurant) => {
        if (typeof r.priceRange === 'number') return r.priceRange;
        if (typeof r.priceRange === 'string') {
            const match = r.priceRange.match(/\d+/g);
            if (match && match.length > 0) return Number(match[0]);
        }
        return null;
    };

    const isVegRestaurant = (r: Restaurant) => {
        if (r.vegOnly || r.isVeg) return true;
        const tags = getCuisineTags(r).map(t => t.toLowerCase());
        return tags.includes('veg') || tags.includes('vegetarian') || tags.includes('pure veg');
    };

    const cuisines = getCuisineTags(item);
    const priceValue = getPriceValue(item);
    const imageUrl = item.imageUrl || item.images?.[0];
    const isVeg = isVegRestaurant(item);
    const rating = item.restaurantInfo?.ratings?.overall ?? (item as any).rating;
    const address = item.address || item.location?.address || item.restaurantInfo?.address;

    const infoItems = [
        rating ? null : null,
        priceValue !== null ? `₹${priceValue} for two` : null,
        '20–30 min',
    ].filter(Boolean) as string[];

    return (
        <TouchableOpacity
            data-testid={`restaurant-card-${item._id}`}
            activeOpacity={0.93}
            style={{
                backgroundColor: theme.card,
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
            }}
            onPress={() => onPress(item._id || 'unknown')}
        >
            <View style={{ height: 190, backgroundColor: '#e8f4f4' }}>
                {imageUrl ? (
                    <ImageBackground source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover">
                        {isVeg ? (
                            <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#16a34a', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>PURE VEG</Text>
                            </View>
                        ) : null}
                    </ImageBackground>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, color: theme.subtext }}>No image available</Text>
                    </View>
                )}
            </View>

            <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                        {item.name || 'Unnamed Restaurant'}
                    </Text>
                    {rating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#02757A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                            <Ionicons name="star" size={11} color="#fff" />
                            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 3 }}>{Number(rating).toFixed(1)}</Text>
                        </View>
                    ) : null}
                </View>

                {cuisines.length > 0 ? (
                    <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 3 }} numberOfLines={1}>
                        {cuisines.slice(0, 4).join(' · ')}
                    </Text>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                        <Ionicons name="time-outline" size={13} color={theme.subtext} />
                        <Text style={{ fontSize: 12, color: theme.subtext, marginLeft: 3, fontWeight: '500' }}>20–30 min</Text>
                    </View>
                    {priceValue !== null ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
                            <Ionicons name="pricetag-outline" size={13} color={theme.subtext} />
                            <Text style={{ fontSize: 12, color: theme.subtext, marginLeft: 3, fontWeight: '500' }}>₹{priceValue} for two</Text>
                        </View>
                    ) : null}
                </View>

                {address ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <Ionicons name="location-outline" size={13} color={theme.subtext} />
                        <Text style={{ fontSize: 12, color: theme.subtext, marginLeft: 3, flex: 1 }} numberOfLines={1}>{address}</Text>
                    </View>
                ) : null}
            </View>
        </TouchableOpacity>
    );
}, () => false);

RestaurantCard.displayName = 'RestaurantCard';
