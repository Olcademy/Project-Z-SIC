import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, ImageBackground, FlatList, useWindowDimensions, Platform, ToastAndroid, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/domains/restaurants/types';
import { useTheme } from '@/ui/context/ThemeContext';
import { useLocalRestaurantFavorites, useToggleLocalRestaurantFavorite } from '../hooks/useRestaurants';
import { useUser } from '@/ui/context/UserContext';

interface RestaurantCardProps {
    item: Restaurant;
    onPress: (item: Restaurant) => void;
}

export const RestaurantCard = memo<RestaurantCardProps>(({ item, onPress }) => {
    const theme = useTheme();
    const { user } = useUser();
    const { width: screenWidth } = useWindowDimensions();
    const cardWidth = screenWidth - 40; // 20px padding on each side
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    const isGuest = !user || user.isGuest;

    const { data: localFavorites } = useLocalRestaurantFavorites();
    const toggleLocalFavorite = useToggleLocalRestaurantFavorite();

    const isFavorited = useMemo(() => {
        const ids = localFavorites ?? [];
        return ids.includes(item._id);
    }, [localFavorites, item._id]);

    const isMutating = toggleLocalFavorite.isPending;

    const handleToggleFavorite = async () => {
        // Always update locally first (works for guest and offline).
        const prev = isFavorited;
        await toggleLocalFavorite.mutateAsync(item._id);

        const message = prev ? 'Removed from favourites' : 'Added to favourites';
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('Favourites', message);
        }
    };

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

    const cuisines = getCuisineTags(item);
    const priceValue = getPriceValue(item);
    const images = item.images && item.images.length > 0 ? item.images : (item.image_urls || [item.imageUrl].filter(Boolean));
    // For testing: if there's only 1 image, duplicate it once to ensure slide works
    const carouselImages = images.length === 1 ? [images[0], images[0]] : images;
    
    const rating = item.restaurantInfo?.ratings?.overall ?? (item as any).rating;
    const address = item.address || item.location?.address || item.restaurantInfo?.address;

    return (
        <TouchableOpacity
            data-testid={`restaurant-card-${item._id}`}
            activeOpacity={0.93}
            style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 20,
                shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
                elevation: 4, borderWidth: 1, borderColor: '#F3F4F6'
            }}
            onPress={() => onPress(item)}
        >
            <View style={{ height: 210, backgroundColor: '#F3F4F6' }}>
                {carouselImages.length > 0 ? (
                    <View style={{ flex: 1, width: cardWidth }}>
                        <FlatList
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            data={carouselImages}
                            onScroll={(e) => {
                                const offset = e.nativeEvent.contentOffset.x;
                                const index = Math.round(offset / cardWidth);
                                if (index !== activeImageIndex) {
                                    setActiveImageIndex(index);
                                }
                            }}
                            scrollEventThrottle={16}
                            decelerationRate="fast"
                            renderItem={({ item: img }) => (
                                <ImageBackground 
                                    source={{ uri: img }} 
                                    style={{ width: cardWidth, height: 210 }} 
                                    resizeMode="cover"
                                />
                            )}
                            keyExtractor={(img, idx) => `img-${idx}`}
                        />
                        
                        <View style={{ position: 'absolute', top: 12, left: 0, flexDirection: 'row' }}>
                            <View style={{ backgroundColor: '#FFCE56', paddingLeft: 8, paddingRight: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>15 % Off up to $10</Text>
                            </View>
                            <View style={{ 
                                width: 0, height: 0, 
                                borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 10, borderRightWidth: 0,
                                borderTopColor: '#FFCE56', borderBottomColor: '#FFCE56', borderLeftColor: 'transparent',
                                position: 'absolute', right: -10, top: 0, transform: [{ rotate: '180deg' }]
                            }} />
                        </View>

                        <View style={{ position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 4 }}>
                            {images.slice(0, 4).map((_, i) => (
                                <View 
                                    key={i}
                                    style={{ 
                                        width: 6, height: 6, borderRadius: 3, 
                                        backgroundColor: i === (activeImageIndex % 4) ? '#FFFFFF' : 'rgba(255,255,255,0.5)' 
                                    }} 
                                />
                            ))}
                        </View>
                    </View>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={40} color="#CCC" />
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 8 }}>No image available</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleToggleFavorite}
                    disabled={isMutating}
                    style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#FFFFFF', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
                >
                    <Ionicons name={isFavorited ? "heart" : "heart-outline"} size={18} color="#FF4D4D" />
                </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1A1A1A' }} numberOfLines={1}>
                            {item.name || 'Unnamed Restaurant'}
                        </Text>
                        {address ? (
                            <Text style={{ fontSize: 13, color: '#666', marginTop: 4 }} numberOfLines={1}>
                                {address}
                            </Text>
                        ) : null}
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1B5E20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                            <Ionicons name="star" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>{Number(rating || 4.3).toFixed(1)}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#999', marginTop: 4 }}>By 700+</Text>
                    </View>
                </View>

                {cuisines.length > 0 && (
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
                        {cuisines.slice(0, 3).join(' • ')}
                    </Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
                    <View style={{ 
                        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
                    }}>
                        <Ionicons name="time-outline" size={14} color="#4A4A4A" />
                        <Text style={{ fontSize: 12, color: '#4A4A4A', marginLeft: 4, fontWeight: '600' }}>30-35 mins • 4.8 Km</Text>
                    </View>
                    
                    <View style={{ 
                        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1
                    }}>
                        <Text style={{ fontSize: 12, color: '#4A4A4A', fontWeight: '600' }}>${priceValue || '200'} for two</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

RestaurantCard.displayName = 'RestaurantCard';
