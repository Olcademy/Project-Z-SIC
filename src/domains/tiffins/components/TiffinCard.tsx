import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { Tiffin } from '@/domains/tiffins/types';
import { useTheme } from '@/ui/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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

    const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800';
    const priceValue = getPriceValue(item);
    const rating = item.rating || 4.2;

    return (
        <TouchableOpacity
            data-testid={`tiffin-card-${item._id}`}
            activeOpacity={0.92}
            style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 18,
                shadowColor: '#b45309',
                shadowOpacity: 0.10,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
            }}
            onPress={() => onPress(item)}
        >
            <View style={{ height: 180, backgroundColor: '#F3F4F6' }}>
                <ImageBackground source={{ uri: imageUrl }} style={{ flex: 1 }} resizeMode="cover">
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 12 }}>
                        {item.vegOnly && (
                            <View style={{ backgroundColor: '#1B5E20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>🌿 VEG ONLY</Text>
                            </View>
                        )}
                        <TouchableOpacity style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="heart-outline" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* Dark Green Rating Badge on Image (Optional, matched with Design) */}
                    <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#1B5E20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800', marginRight: 2 }}>{rating}</Text>
                        <Ionicons name="star" size={10} color="#FFF" />
                    </View>
                </ImageBackground>
            </View>

            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }} numberOfLines={1}>
                        {item.name || 'Unnamed Tiffin'}
                    </Text>
                </View>
                
                <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }} numberOfLines={1}>
                    {item.shortDescription || 'Healthy home-cooked meals delivered daily'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                    <View style={{ backgroundColor: '#FFF5F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7F50' }}>₹{priceValue || 120} / meal</Text>
                    </View>
                    <View style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#4A4A4A' }}>FREE DELIVERY</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}, () => false);

TiffinCard.displayName = 'TiffinCard';
