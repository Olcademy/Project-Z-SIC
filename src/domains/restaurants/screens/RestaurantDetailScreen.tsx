import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RestaurantsStackParamList } from '@/app/navigation/types';
import { useRestaurantDetail } from '../hooks/useRestaurants';
import { RestaurantDetail, RestaurantMenuItem, RestaurantMenuSection } from '@/domains/restaurants/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useTheme } from '@/ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantDetail'>;

export const RestaurantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { id } = route.params;
    const { data: restaurant, isLoading, isError, refetch } = useRestaurantDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const normalizedRestaurant = restaurant as RestaurantDetail | undefined;

    const images = useMemo(() => {
        if (!normalizedRestaurant) return [];
        return [
            normalizedRestaurant.imageUrl,
            ...(normalizedRestaurant.images || []),
            ...(normalizedRestaurant.image_urls || []),
        ].filter(Boolean) as string[];
    }, [normalizedRestaurant]);

    const heroImageUrl = images[0];

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    const menuSections = useMemo<RestaurantMenuSection[]>(() => {
        if (!normalizedRestaurant) return [];
        const sections: RestaurantMenuSection[] = [];

        if (Array.isArray(normalizedRestaurant.menuSections)) {
            normalizedRestaurant.menuSections.forEach((section, index) => {
                const items = Array.isArray(section.items) ? section.items : [];
                const formattedItems: RestaurantMenuItem[] = items.map((item) => {
                    if (typeof item === 'string') {
                        return { name: item };
                    }
                    return {
                        name: item.name || 'Menu item',
                        description: item.description,
                        price: item.price,
                    };
                });

                sections.push({
                    title: section.title || section.name || `Section ${index + 1}`,
                    items: formattedItems,
                });
            });
        } else if (Array.isArray(normalizedRestaurant.menu)) {
            const formattedItems: RestaurantMenuItem[] = normalizedRestaurant.menu.map((item) => {
                if (typeof item === 'string') {
                    return { name: item };
                }
                return {
                    name: item.name || 'Menu item',
                    description: item.description,
                    price: item.price,
                };
            });
            sections.push({ title: 'Menu', items: formattedItems });
        }

        return sections;
    }, [normalizedRestaurant]);

    const cuisineTags = useMemo(() => {
        if (!normalizedRestaurant) return [];
        if (Array.isArray(normalizedRestaurant.cuisineTags)) return normalizedRestaurant.cuisineTags;
        if (Array.isArray(normalizedRestaurant.cuisines)) return normalizedRestaurant.cuisines;
        if (typeof normalizedRestaurant.cuisines === 'string') {
            return normalizedRestaurant.cuisines.split(',').map((tag) => tag.trim()).filter(Boolean);
        }
        return [];
    }, [normalizedRestaurant]);

    const locationText = useMemo(() => {
        if (!normalizedRestaurant) return '';
        return (
            normalizedRestaurant.address ||
            normalizedRestaurant.location?.address ||
            normalizedRestaurant.restaurantInfo?.address ||
            ''
        );
    }, [normalizedRestaurant]);

    const ratingText = useMemo(() => {
        if (!normalizedRestaurant) return '—';
        const candidate =
            (normalizedRestaurant as any).rating ??
            normalizedRestaurant.restaurantInfo?.ratings?.overall;
        if (candidate === undefined || candidate === null) return '—';
        const value = typeof candidate === 'string' ? Number(candidate) : candidate;
        if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(1);
        return String(candidate);
    }, [normalizedRestaurant]);

    const cuisinePrimary = cuisineTags[0] || '—';

    const deliveryTimeText = useMemo(() => {
        if (!normalizedRestaurant) return '—';
        const candidate =
            (normalizedRestaurant as any).deliveryTime ??
            (normalizedRestaurant as any).delivery_time ??
            (normalizedRestaurant as any).deliveryTimeText;
        if (candidate === undefined || candidate === null || candidate === '') return '—';
        return String(candidate);
    }, [normalizedRestaurant]);

    const menuPreview = useMemo(() => {
        if (menuSections.length === 0) return [] as RestaurantMenuItem[];
        const firstSection = menuSections[0];
        return (firstSection.items || []).slice(0, 4);
    }, [menuSections]);

    if (isLoading) {
        return <LoadingSkeletonList count={2} />;
    }

    if (isError || !normalizedRestaurant) {
        return <ErrorState message="Failed to load restaurant details." onRetry={refetch} />;
    }

    const orderingEnabled = Boolean(featureFlags?.enableOrdering);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}>
                {/* Top image section */}
                <View style={{ height: 200, width: '100%', backgroundColor: colors.surface }}>
                    {heroImageUrl ? (
                        <Image source={{ uri: heroImageUrl }} style={{ height: '100%', width: '100%' }} resizeMode="cover" />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '600' }}>No image available</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            position: 'absolute',
                            top: insets.top + 10,
                            left: 16,
                            height: 40,
                            width: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 16 }}>
                    {/* Title section */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
                            {normalizedRestaurant.name || 'Unnamed Restaurant'}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                            {cuisineTags.length > 0 ? cuisineTags.join(' • ') : '—'}
                        </Text>
                        {!!locationText && (
                            <Text style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }} numberOfLines={2}>
                                {locationText}
                            </Text>
                        )}
                    </View>

                    {/* Info row */}
                    <View
                        style={{
                            marginBottom: 16,
                            backgroundColor: colors.card,
                            borderWidth: 1,
                            borderColor: colors.border,
                            borderRadius: 16,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Rating</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{ratingText}</Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Cuisine</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {cuisinePrimary}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Delivery</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {deliveryTimeText}
                            </Text>
                        </View>
                    </View>

                    {/* About */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>About</Text>
                        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
                                {normalizedRestaurant.description || 'No description available.'}
                            </Text>
                        </View>
                    </View>

                    {/* Menu preview (optional) */}
                    {menuPreview.length > 0 && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Menu preview</Text>
                            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                                {menuPreview.map((item, index) => (
                                    <View
                                        key={`${item.name}-${index}`}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'flex-start',
                                            justifyContent: 'space-between',
                                            paddingVertical: 10,
                                            borderBottomWidth: index < menuPreview.length - 1 ? 1 : 0,
                                            borderBottomColor: colors.border,
                                        }}
                                    >
                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            {!!item.description && (
                                                <Text style={{ marginTop: 3, fontSize: 12, lineHeight: 18, color: colors.textMuted }} numberOfLines={2}>
                                                    {item.description}
                                                </Text>
                                            )}
                                        </View>
                                        {item.price !== undefined && item.price !== null && (
                                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.primary }}>₹{item.price}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Coming soon note */}
                    {!orderingEnabled && (
                        <Text style={{ marginBottom: 16, fontSize: 12, color: colors.textMuted }}>
                            Ordering is coming soon.
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* Bottom action button */}
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: 16,
                    paddingBottom: Math.max(16, insets.bottom + 16),
                    backgroundColor: colors.background,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                }}
            >
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Order now"
                    activeOpacity={0.9}
                    disabled={!orderingEnabled}
                    onPress={() => {}}
                    style={{
                        height: 50,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: orderingEnabled ? colors.primary : colors.border,
                    }}
                >
                    <Text style={{ fontSize: 15, fontWeight: '800', color: orderingEnabled ? '#FFFFFF' : colors.textMuted }}>
                        Order Now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
