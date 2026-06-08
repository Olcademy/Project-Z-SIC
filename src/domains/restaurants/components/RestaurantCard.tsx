import React, { memo, useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, useWindowDimensions, Platform, ToastAndroid, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '@/domains/restaurants/types';
import { useTheme } from '@/ui/context/ThemeContext';
import { useLocalRestaurantFavorites, useToggleLocalRestaurantFavorite } from '../hooks/useRestaurants';
import { useUser } from '@/ui/context/UserContext';
import { storage } from '@/services/storage/localStorage';
import { useQueryClient } from '@tanstack/react-query';

interface RestaurantCardProps {
    item: Restaurant;
    onPress: (item: Restaurant) => void;
}

const IMAGE_HEIGHT = 200;

/**
 * Returns a stable price for a restaurant.
 * Priority: real data fields → menu item average → hash fallback (₹300–₹400).
 * The hash fallback uses the same algorithm as RestaurantListScreen.getPriceValue
 * so sort order always matches what the card displays.
 */
const getStablePrice = (item: Restaurant): number => {
    const a = item as any;

    // 1. Direct priceRange field
    if (typeof item.priceRange === 'number') return item.priceRange;
    if (typeof item.priceRange === 'string') {
        const match = item.priceRange.match(/\d+/g);
        if (match?.length) return Number(match[0]);
    }

    // 2. Common top-level price fields
    for (const field of [
        a.deliveryCost, a.delivery_cost, a.minOrder, a.min_order,
        a.minimumOrder, a.priceForTwo, a.price_for_two,
        a.avgPrice, a.averagePrice, a.costForTwo,
    ]) {
        if (typeof field === 'number' && Number.isFinite(field)) return field;
        if (typeof field === 'string') {
            const match = field.match(/\d+/g);
            if (match?.length) return Number(match[0]);
        }
    }

    // 3. Average of menu item prices (handles "₹199", "$12.89", 149, etc.)
    const menuItems: any[] = [
        ...(Array.isArray(a.menu) ? a.menu : []),
        ...(Array.isArray(a.menuSections)
            ? a.menuSections.flatMap((s: any) => (Array.isArray(s.items) ? s.items : []))
            : []),
    ];
    const prices = menuItems
        .map((mi: any) => {
            const p = mi?.price;
            if (typeof p === 'number' && Number.isFinite(p)) return p;
            if (typeof p === 'string') {
                const match = p.replace(/[₹$€£,]/g, '').match(/\d+(\.\d+)?/);
                if (match) return Number(match[0]);
            }
            return null;
        })
        .filter((p): p is number => p !== null);

    if (prices.length > 0) {
        return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }

    // 4. Stable hash fallback — ₹300–₹400, same _id always gives same price.
    //    MUST match the algorithm in RestaurantListScreen.getPriceValue
    //    so sort order matches what the card displays.
    const id = item._id ?? '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return 300 + (hash % 101); // ₹300 – ₹400
};

export const RestaurantCard = memo<RestaurantCardProps>(({ item, onPress }) => {
    const theme = useTheme();
    const { user } = useUser();
    const { width: screenWidth } = useWindowDimensions();
    const cardWidth = screenWidth - 40;

    const dotRefs = useRef<(View | null)[]>([]);
    const activeIndexRef = useRef(0);

    const { data: localFavorites } = useLocalRestaurantFavorites();
    const toggleLocalFavorite = useToggleLocalRestaurantFavorite();
    const queryClient = useQueryClient();

    const isFavorited = useMemo(() => {
        const ids = localFavorites ?? [];
        return ids.includes(item._id);
    }, [localFavorites, item._id]);

    const isMutating = toggleLocalFavorite.isPending;

    const handleToggleFavorite = useCallback(async () => {
        const prev = isFavorited;
        const result = await toggleLocalFavorite.mutateAsync(item._id);
        if (result.isFavorited) {
            await storage.upsertFavoriteRestaurantItem(item);
        } else {
            await storage.removeFavoriteRestaurantItem(item._id);
        }
        queryClient.invalidateQueries({ queryKey: ['local-restaurant-favorite-items'] });
        const message = prev ? 'Removed from favourites' : 'Added to favourites';
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('Favourites', message);
        }
    }, [isFavorited, item, toggleLocalFavorite, queryClient]);

    const handlePress = useCallback(() => onPress(item), [item, onPress]);

    const getCuisineTags = (r: Restaurant) => {
        if (Array.isArray(r.cuisineTags)) return r.cuisineTags;
        if (Array.isArray(r.cuisines)) return r.cuisines;
        if (typeof r.cuisines === 'string') return r.cuisines.split(',').map(c => c.trim()).filter(Boolean);
        return [];
    };

    const cuisines = useMemo(() => getCuisineTags(item), [item]);

    // Stable price — computed once per item, consistent with sort logic
    const displayPrice = useMemo(() => getStablePrice(item), [item]);

    const carouselImages = useMemo(() => {
        const imgs =
            item.images && item.images.length > 0
                ? item.images
                : (item.image_urls || [item.imageUrl].filter(Boolean) as string[]);
        return imgs.slice(0, 4);
    }, [item.images, item.image_urls, item.imageUrl]);

    const dotsCount = carouselImages.length;

    const handleScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
            if (index === activeIndexRef.current) return;
            dotRefs.current[activeIndexRef.current]?.setNativeProps({
                style: { backgroundColor: 'rgba(255,255,255,0.5)' },
            });
            dotRefs.current[index]?.setNativeProps({
                style: { backgroundColor: '#FFFFFF' },
            });
            activeIndexRef.current = index;
        },
        [cardWidth]
    );

    const rating = item.restaurantInfo?.ratings?.overall ?? (item as any).rating;
    const address = item.address || item.location?.address || item.restaurantInfo?.address;

    return (
        <TouchableOpacity
            activeOpacity={0.93}
            style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 24,
                overflow: 'hidden',
                marginBottom: 20,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
                borderWidth: 1,
                borderColor: '#F3F4F6',
            }}
            onPress={handlePress}
        >
            {/* ── Image carousel ─────────────────────────────── */}
            <View style={{ height: IMAGE_HEIGHT, backgroundColor: '#F3F4F6' }}>
                {carouselImages.length > 0 ? (
                    <>
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={100}
                            decelerationRate="fast"
                            onScroll={handleScroll}
                            style={{ width: cardWidth, height: IMAGE_HEIGHT }}
                        >
                            {carouselImages.map((img, idx) => (
                                <Image
                                    key={idx}
                                    source={{ uri: img }}
                                    style={{ width: cardWidth, height: IMAGE_HEIGHT }}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>

                        {/* Discount ribbon */}
                        <View style={{ position: 'absolute', top: 12, left: 0, flexDirection: 'row' }}>
                            <View style={{ backgroundColor: '#FFCE56', paddingLeft: 8, paddingRight: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>15% Off up to $10</Text>
                            </View>
                            <View style={{
                                width: 0, height: 0,
                                borderTopWidth: 10, borderBottomWidth: 10, borderLeftWidth: 10, borderRightWidth: 0,
                                borderTopColor: '#FFCE56', borderBottomColor: '#FFCE56', borderLeftColor: 'transparent',
                                position: 'absolute', right: -10, top: 0, transform: [{ rotate: '180deg' }]
                            }} />
                        </View>

                        {/* Dot indicators */}
                        {dotsCount > 1 && (
                            <View style={{ position: 'absolute', bottom: 10, right: 12, flexDirection: 'row', gap: 4 }}>
                                {carouselImages.map((_, i) => (
                                    <View
                                        key={i}
                                        ref={(r) => { dotRefs.current[i] = r; }}
                                        style={{
                                            width: 6, height: 6, borderRadius: 3,
                                            backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                                        }}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="image-outline" size={40} color="#CCC" />
                        <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 8 }}>No image available</Text>
                    </View>
                )}

                {/* Favourite button */}
                <TouchableOpacity
                    onPress={handleToggleFavorite}
                    disabled={isMutating}
                    style={{
                        position: 'absolute', top: 12, right: 12,
                        backgroundColor: '#FFFFFF', borderRadius: 15,
                        width: 30, height: 30, alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
                    }}
                >
                    <Ionicons name={isFavorited ? 'heart' : 'heart-outline'} size={18} color="#FF4D4D" />
                </TouchableOpacity>
            </View>

            {/* ── Text info ──────────────────────────────────── */}
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
                            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                                {Number(rating || 4.3).toFixed(1)}
                            </Text>
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
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#F0F0F0', borderRadius: 12,
                        paddingHorizontal: 10, paddingVertical: 6,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    }}>
                        <Ionicons name="time-outline" size={14} color="#4A4A4A" />
                        <Text style={{ fontSize: 12, color: '#4A4A4A', marginLeft: 4, fontWeight: '600' }}>30-35 mins • 4.8 Km</Text>
                    </View>

                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#F0F0F0', borderRadius: 12,
                        paddingHorizontal: 10, paddingVertical: 6,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    }}>
                        <Text style={{ fontSize: 12, color: '#4A4A4A', fontWeight: '600' }}>₹{displayPrice} for two</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
});

RestaurantCard.displayName = 'RestaurantCard';