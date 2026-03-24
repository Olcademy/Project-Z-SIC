import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinDetail'>;

export const TiffinDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { id } = route.params;
    const { data: tiffin, isLoading, isError, refetch } = useTiffinDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const normalizedTiffin = tiffin as TiffinDetail | undefined;

    const images = useMemo(() => {
        if (!normalizedTiffin) return [];
        return [normalizedTiffin.imageUrl, ...(normalizedTiffin.images || [])].filter(Boolean) as string[];
    }, [normalizedTiffin]);

    const heroImageUrl = images[0];

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
        const fromMealType = normalizedTiffin.menu?.mealTypes?.[0]?.label;
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

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [refetch])
    );

    if (isLoading) {
        return <LoadingSkeletonList count={2} />;
    }

    if (isError || !normalizedTiffin) {
        return <ErrorState message="Failed to load tiffin details." onRetry={refetch} />;
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

                    {/* About */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>About</Text>
                        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
                                {normalizedTiffin.description || normalizedTiffin.shortDescription || 'No description available.'}
                            </Text>
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
