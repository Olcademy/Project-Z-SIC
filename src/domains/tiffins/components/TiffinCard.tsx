import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Tiffin } from '@/domains/tiffins/types';
import { useTheme } from '@/ui/context/ThemeContext';

interface TiffinCardProps {
    item: Tiffin;
    onPress: (item: Tiffin) => void;
}

export const TiffinCard = memo<TiffinCardProps>(({ item, onPress }) => {
    const theme = useTheme();

    const getPriceValue = (item: Tiffin) => {
        if (typeof item.pricePerMeal === 'number') return item.pricePerMeal;
        if (typeof item.priceRange === 'number') return item.priceRange;
        if (typeof item.priceRange === 'string') {
            const match = item.priceRange.match(/\d+/g);
            if (match && match.length > 0) return Number(match[0]);
        }
        return null;
    };

    const imageUrl = item.imageUrl;
    const priceValue = getPriceValue(item);

    return (
        <TouchableOpacity
            data-testid={`tiffin-card-${item._id}`}
            activeOpacity={0.92}
            style={{
                backgroundColor: theme.card,
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 18,
            }}
            onPress={() => onPress(item)}
        >
            <View style={{ height: 180, backgroundColor: '#fef3e2' }}>
                {imageUrl ? (
                    <ImageBackground source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover">
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                            {item.vegOnly && (
                                <View style={{ backgroundColor: '#16a34a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>🌿 VEG ONLY</Text>
                                </View>
                            )}
                            {priceValue !== null && (
                                <View style={{ marginLeft: 'auto', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>₹{priceValue} / meal</Text>
                                </View>
                            )}
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 40 }}>🍱</Text>
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 6 }}>No image available</Text>
                    </View>
                )}
            </View>

            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }} numberOfLines={1}>
                    {item.name || 'Unnamed Tiffin'}
                </Text>
                {item.shortDescription && (
                    <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 8, lineHeight: 18 }} numberOfLines={2}>
                        {item.shortDescription}
                    </Text>
                )}
                <View style={{ height: 1, backgroundColor: theme.border, marginTop: 12, marginBottom: 10 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, fontWeight: '500' }}>Tap to explore plans</Text>
                    <View style={{ backgroundColor: '#b45309', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>View →</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, () => false);

TiffinCard.displayName = 'TiffinCard';
