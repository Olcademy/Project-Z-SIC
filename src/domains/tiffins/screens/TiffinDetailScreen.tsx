import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TiffinStackParamList } from '@/app/navigation/types';
import { useTiffinDetail } from '../hooks/useTiffins';
import { TiffinDetail } from '@/domains/tiffins/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useTheme } from '@/ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImageCarousel } from '@/ui/components/ImageCarousel';

import rotiImg from '../../../../assets/roti.png';
import naanImg from '../../../../assets/naan.png';

const PRIMARY = '#FF7A00';

type FilterKey = 'budget' | 'rating4' | 'pureVeg';

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinDetail'>;

export const TiffinDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const paramItem = route.params.item;
    const id = ('id' in route.params ? route.params.id : undefined) ?? paramItem?._id ?? '';

    const { data: tiffin, isLoading, isError, isRefetching, refetch } = useTiffinDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const normalizedTiffin = (tiffin ?? paramItem) as TiffinDetail | undefined;

    const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
        budget: false,
        rating4: false,
        pureVeg: false,
    });

    const [recommendedOpen, setRecommendedOpen] = useState(true);
    const [recommendedExpanded, setRecommendedExpanded] = useState<Record<string, boolean>>({});

    const toggleFilter = useCallback((key: FilterKey) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ budget: false, rating4: false, pureVeg: false });
    }, []);

    const anyFilterActive = filters.budget || filters.rating4 || filters.pureVeg;

    const mostOrderedTogether = useMemo(() => {
        return [
            {
                key: 'roti',
                title: 'OG Roti',
                subtitle: 'Whole wheat · fresh & soft',
                description: 'Classic whole-wheat roti made fresh. Best with dal, sabzi, and gravies.',
                price: 12,
                rating: 4.6,
                veg: true,
                image: rotiImg,
            },
            {
                key: 'nonVegNaan',
                title: 'Non-veg naan',
                subtitle: 'Tandoori naan · buttery finish',
                description: 'Soft tandoori naan brushed with butter. A great pairing with rich non-veg curries.',
                price: 28,
                rating: 4.3,
                veg: false,
                image: naanImg,
            },
        ] as const;
    }, []);

    const recommendedForYou = useMemo(() => {
        const items = [
            {
                key: 'dalTadka',
                title: 'Dal Tadka',
                description: 'Comforting yellow dal tempered with garlic and spices.',
                price: 89,
                rating: 4.5,
                veg: true,
            },
            {
                key: 'paneerButterMasala',
                title: 'Paneer Butter Masala',
                description: 'Creamy tomato gravy with soft paneer cubes.',
                price: 129,
                rating: 4.4,
                veg: true,
            },
            {
                key: 'chickenCurry',
                title: 'Chicken Curry',
                description: 'Slow-cooked chicken curry with rich, spiced gravy.',
                price: 159,
                rating: 4.2,
                veg: false,
            },
            {
                key: 'jeeraRice',
                title: 'Jeera Rice',
                description: 'Fluffy basmati rice tempered with cumin.',
                price: 79,
                rating: 4.1,
                veg: true,
            },
        ] as const;

        return items.filter((it) => {
            if (filters.pureVeg && !it.veg) return false;
            if (filters.rating4 && it.rating < 4.0) return false;
            if (filters.budget && it.price > 120) return false;
            return true;
        });
    }, [filters.budget, filters.pureVeg, filters.rating4]);

    const images = useMemo(() => {
        if (!normalizedTiffin) return [];
        const raw = [...(normalizedTiffin.images || [])].filter(Boolean) as string[];
        if (raw.length > 0) {
            return Array.from(new Set(raw));
        }
        const fallback = normalizedTiffin.imageUrl || (normalizedTiffin as any).image;
        return fallback ? [String(fallback)] : [];
    }, [normalizedTiffin]);

    const plans = useMemo(() => {
        if (!normalizedTiffin) return [];
        return normalizedTiffin.mealPlans || [];
    }, [normalizedTiffin]);

    const days = useMemo(() => {
        if (!normalizedTiffin) return [];
        return normalizedTiffin.scheduleDays || [];
    }, [normalizedTiffin]);

    const coverage = useMemo(() => {
        if (!normalizedTiffin) return [];
        return normalizedTiffin.coverageAreas || [];
    }, [normalizedTiffin]);

    const subtitle = useMemo(() => {
        if (!normalizedTiffin) return '—';
        const menu = normalizedTiffin.menu;
        const fromMealType =
            menu && typeof menu === 'object' && !Array.isArray(menu)
                ? menu.mealTypes?.[0]?.label
                : undefined;
        const fromPlan = normalizedTiffin.mealPlans?.[0];
        const fromCategory = Array.isArray(normalizedTiffin.category) ? normalizedTiffin.category[0] : undefined;
        return fromMealType || fromPlan || fromCategory || 'Meal service';
    }, [normalizedTiffin]);

    const locationText = useMemo(() => {
        if (!normalizedTiffin) return '';
        return normalizedTiffin.address || normalizedTiffin.location?.address || '';
    }, [normalizedTiffin]);

    const priceText = useMemo(() => {
        if (!normalizedTiffin) return '—';
        const candidate = normalizedTiffin.pricePerMeal ?? normalizedTiffin.priceRange;
        if (candidate === undefined || candidate === null || candidate === '') return '—';
        const value = typeof candidate === 'number' ? `₹${candidate}` : String(candidate);
        return value.startsWith('₹') ? value : `₹${value}`;
    }, [normalizedTiffin]);

    const vegText = useMemo(() => {
        if (!normalizedTiffin) return '—';
        return normalizedTiffin.vegOnly === true ? 'Veg' : normalizedTiffin.vegOnly === false ? 'Non-veg' : '—';
    }, [normalizedTiffin]);

    const availabilityText = useMemo(() => {
        if (!normalizedTiffin) return '—';
        if (days.length > 0) {
            const short = days.slice(0, 2).join(', ');
            return days.length > 2 ? `${short}…` : short;
        }
        if (normalizedTiffin.deliveryTimeSlots && normalizedTiffin.deliveryTimeSlots.length > 0) {
            return `${normalizedTiffin.deliveryTimeSlots.length} slots`;
        }
        return '—';
    }, [days, normalizedTiffin]);

    if (isLoading && !paramItem) {
        return <LoadingSkeletonList count={2} />;
    }

    if ((isError && !paramItem) || !normalizedTiffin) {
        return <ErrorState message="Failed to load tiffin details." onRetry={refetch} />;
    }

    const orderingEnabled = Boolean(featureFlags?.enableOrdering);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={PRIMARY}
                    />
                }
            >
                {/* Top image section */}
                <View style={{ width: '100%', backgroundColor: colors.surface }}>
                    {images.length > 0 ? (
                        <ImageCarousel
                            images={images}
                            height={250}
                            width={Dimensions.get('window').width}
                            imageStyle={{
                                borderBottomLeftRadius: 20,
                                borderBottomRightRadius: 20,
                            }}
                        />
                    ) : (
                        <View style={{ height: 250, alignItems: 'center', justifyContent: 'center' }}>
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

                    {images.length > 0 ? (
                        <View
                            style={{
                                position: 'absolute',
                                top: insets.top + 14,
                                right: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 999,
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                            }}
                        >
                            <Ionicons name="images-outline" size={14} color={colors.textMuted} />
                            <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '800', color: colors.text }}>
                                {images.length}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View style={{ padding: 16 }}>
                    {/* Title section */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
                            {normalizedTiffin.name || 'Unnamed Tiffin'}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                            {subtitle}
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
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Price</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {priceText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Type</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {vegText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Availability</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {availabilityText}
                            </Text>
                        </View>
                    </View>

                    {/* Filters (Restaurant-style) */}
                    <View style={{ marginBottom: 16 }}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingVertical: 2, alignItems: 'center' }}
                        >
                            <TouchableOpacity
                                onPress={() => {
                                    if (anyFilterActive) clearFilters();
                                }}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: PRIMARY,
                                    borderRadius: 999,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    marginRight: 10,
                                    backgroundColor: anyFilterActive ? PRIMARY : colors.card,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: anyFilterActive ? '#FFFFFF' : PRIMARY }}>
                                    Filters
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => toggleFilter('budget')}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: PRIMARY,
                                    borderRadius: 999,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    marginRight: 10,
                                    backgroundColor: filters.budget ? PRIMARY : colors.card,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: filters.budget ? '#FFFFFF' : PRIMARY }}>
                                    Budget
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => toggleFilter('rating4')}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: PRIMARY,
                                    borderRadius: 999,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    marginRight: 10,
                                    backgroundColor: filters.rating4 ? PRIMARY : colors.card,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: filters.rating4 ? '#FFFFFF' : PRIMARY }}>
                                    Rating 4.0+
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => toggleFilter('pureVeg')}
                                activeOpacity={0.85}
                                style={{
                                    borderWidth: 1,
                                    borderColor: PRIMARY,
                                    borderRadius: 999,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    marginRight: 10,
                                    backgroundColor: filters.pureVeg ? PRIMARY : colors.card,
                                }}
                            >
                                <Text style={{ fontSize: 13, fontWeight: '800', color: filters.pureVeg ? '#FFFFFF' : PRIMARY }}>
                                    Pure Veg
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Most ordered together (Restaurant alignment/spacing) */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 }}>
                            Most ordered together
                        </Text>
                        <View
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 16,
                                overflow: 'hidden',
                            }}
                        >
                            {mostOrderedTogether.filter(row => !filters.pureVeg || row.veg).map((row, index) => {
                                const badgeColor = row.veg ? '#1B5E20' : '#B71C1C';
                                return (
                                    <View
                                        key={row.key}
                                        style={{
                                            position: 'relative',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            padding: 12,
                                            minHeight: 116,
                                        }}
                                    >
                                        <Image
                                            source={row.image}
                                            style={{ width: 92, height: 92, borderRadius: 12, backgroundColor: colors.border }}
                                            resizeMode="cover"
                                        />

                                        <View style={{ flex: 1, paddingLeft: 12, paddingRight: 34 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                                {row.title}
                                            </Text>
                                            <Text style={{ marginTop: 4, fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                                                {row.subtitle}
                                            </Text>
                                            <Text
                                                style={{ marginTop: 6, fontSize: 12, fontWeight: '600', lineHeight: 17, color: colors.textMuted }}
                                                numberOfLines={2}
                                            >
                                                {row.description}
                                            </Text>

                                            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>₹{row.price}</Text>
                                            </View>
                                        </View>

                                        <View
                                            style={{
                                                position: 'absolute',
                                                top: 12,
                                                right: 12,
                                                width: 14,
                                                height: 14,
                                                borderRadius: 2,
                                                borderWidth: 1.6,
                                                borderColor: badgeColor,
                                                backgroundColor: colors.card,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: badgeColor }} />
                                        </View>

                                        {index < mostOrderedTogether.length - 1 ? (
                                            <View
                                                style={{
                                                    position: 'absolute',
                                                    left: 12,
                                                    right: 12,
                                                    bottom: 0,
                                                    height: 1,
                                                    backgroundColor: colors.border,
                                                }}
                                            />
                                        ) : null}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Recommended for you */}
                    <View style={{ marginBottom: 16 }}>
                        <View
                            style={{
                                backgroundColor: colors.card,
                                borderWidth: 1,
                                borderColor: colors.border,
                                borderRadius: 16,
                                overflow: 'hidden',
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => setRecommendedOpen((p) => !p)}
                                activeOpacity={0.85}
                                style={{
                                    paddingHorizontal: 14,
                                    paddingVertical: 14,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }}>Recommended for you</Text>
                                <View style={{ transform: [{ rotate: recommendedOpen ? '180deg' : '0deg' }] }}>
                                    <Ionicons name="chevron-down" size={18} color={PRIMARY} />
                                </View>
                            </TouchableOpacity>

                            {recommendedOpen ? (
                                <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                                    {recommendedForYou.length === 0 ? (
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted, paddingVertical: 10 }}>
                                            No items match the selected filters.
                                        </Text>
                                    ) : (
                                        recommendedForYou.map((it) => {
                                            const isOpen = Boolean(recommendedExpanded[it.key]);
                                            return (
                                                <View
                                                    key={it.key}
                                                    style={{
                                                        marginTop: 10,
                                                        backgroundColor: colors.card,
                                                        borderRadius: 16,
                                                        overflow: 'hidden',
                                                        borderWidth: 1,
                                                        borderColor: colors.border,
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            setRecommendedExpanded((prev) => ({
                                                                ...prev,
                                                                [it.key]: !isOpen,
                                                            }))
                                                        }
                                                        activeOpacity={0.85}
                                                        style={{
                                                            paddingHorizontal: 14,
                                                            paddingVertical: 14,
                                                            flexDirection: 'row',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 15, fontWeight: '900', color: colors.text }} numberOfLines={1}>
                                                            {it.title}
                                                        </Text>
                                                        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                                                            <Ionicons name="chevron-down" size={18} color={PRIMARY} />
                                                        </View>
                                                    </TouchableOpacity>

                                                    {isOpen ? (
                                                        <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
                                                            <Text
                                                                style={{
                                                                    fontSize: 12,
                                                                    fontWeight: '600',
                                                                    lineHeight: 17,
                                                                    color: colors.textMuted,
                                                                }}
                                                            >
                                                                {it.description}
                                                            </Text>
                                                            <View
                                                                style={{
                                                                    marginTop: 10,
                                                                    flexDirection: 'row',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                }}
                                                            >
                                                                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.text }}>₹{it.price}</Text>
                                                                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textMuted }}>
                                                                    {it.veg ? 'Veg' : 'Non-veg'} · {it.rating.toFixed(1)}★
                                                                </Text>
                                                            </View>
                                                        </View>
                                                    ) : null}
                                                </View>
                                            );
                                        })
                                    )}
                                </View>
                            ) : null}
                        </View>
                    </View>

                    {/* Meal plan (optional) */}
                    {(plans.length > 0 || days.length > 0 || coverage.length > 0) && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Meal plan</Text>
                            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                                {plans.length > 0 && (
                                    <View style={{ marginBottom: days.length > 0 || coverage.length > 0 ? 12 : 0 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Plans</Text>
                                        {plans.slice(0, 6).map((plan) => (
                                            <Text key={plan} style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
                                                • {plan}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                                {days.length > 0 && (
                                    <View style={{ marginBottom: coverage.length > 0 ? 12 : 0 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Schedule</Text>
                                        <Text style={{ fontSize: 13, color: colors.textMuted }}>{days.join(', ')}</Text>
                                    </View>
                                )}
                                {coverage.length > 0 && (
                                    <View>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 6 }}>Coverage</Text>
                                        <Text style={{ fontSize: 13, color: colors.textMuted }}>{coverage.join(', ')}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {!orderingEnabled && (
                        <Text style={{ marginBottom: 16, fontSize: 12, color: colors.textMuted }}>
                            Subscription is coming soon.
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
                    accessibilityLabel="Subscribe"
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
                        Subscribe
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
