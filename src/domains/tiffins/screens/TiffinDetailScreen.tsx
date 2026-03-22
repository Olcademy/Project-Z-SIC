import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TiffinStackParamList } from '@/app/navigation/types';
import { useTiffinDetail } from '../hooks/useTiffins';
import { TiffinDetail } from '@/domains/tiffins/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { openInMaps } from '@/services/maps/googleMaps';
import { ErrorState } from '@/ui/components/ErrorState';
import { ImageCarousel } from '@/ui/components/ImageCarousel';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useTheme } from '@/ui/theme';

type Props = NativeStackScreenProps<TiffinStackParamList, 'TiffinDetail'>;

export const TiffinDetailScreen: React.FC<Props> = ({ route }) => {
    const { id } = route.params;
    const { data: tiffin, isLoading, isError, refetch } = useTiffinDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { isDark, colors } = useTheme();

    const normalizedTiffin = tiffin as TiffinDetail | undefined;

    const images = useMemo(() => {
        if (!normalizedTiffin) return [];
        return [normalizedTiffin.imageUrl].filter(Boolean) as string[];
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

    return (
        <ScrollView className="flex-1" style={{ backgroundColor: colors.background }}>
            <View className="px-4 py-6">
                {images.length > 0 && <ImageCarousel images={images} />}

                <View
                    className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm mt-5"
                    style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }]}
                >
                    <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">{normalizedTiffin.name || 'Unnamed Tiffin'}</Text>
                    {normalizedTiffin.vegOnly && (
                        <View className="mt-2 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full self-start">
                            <Text className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Veg Only</Text>
                        </View>
                    )}
                    {normalizedTiffin.description && (
                        <Text className="text-base text-gray-700 dark:text-gray-200 mt-4 leading-6">{normalizedTiffin.description}</Text>
                    )}
                    {(normalizedTiffin.pricePerMeal || normalizedTiffin.priceRange) && (
                        <Text className="text-sm font-semibold text-[#02757A] mt-3">₹{normalizedTiffin.pricePerMeal || normalizedTiffin.priceRange} per meal</Text>
                    )}

                    {!featureFlags?.enableOrdering && (
                        <View className="mt-4 bg-amber-50 dark:bg-amber-950 px-3 py-2 rounded-2xl self-start">
                            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-200">Ordering Coming Soon</Text>
                        </View>
                    )}
                </View>

                <View
                    className="mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm"
                    style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }]}
                >
                    <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Meal plans</Text>
                    {plans.length > 0 ? (
                        plans.map((plan) => (
                            <Text key={plan} className="text-sm text-gray-600 dark:text-gray-300 mb-1">• {plan}</Text>
                        ))
                    ) : (
                        <Text className="text-sm text-gray-600 dark:text-gray-300">Plans to be announced.</Text>
                    )}
                </View>

                {days.length > 0 && (
                    <View
                        className="mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm"
                        style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }]}
                    >
                        <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Meal schedule</Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-300">{days.join(', ')}</Text>
                    </View>
                )}

                {coverage.length > 0 && (
                    <View
                        className="mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm"
                        style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }]}
                    >
                        <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Coverage areas</Text>
                        <Text className="text-sm text-gray-600 dark:text-gray-300">{coverage.join(', ')}</Text>
                    </View>
                )}

                {(normalizedTiffin.contact || normalizedTiffin.contactPhone || normalizedTiffin.contactEmail || normalizedTiffin.location?.address) && (
                    <View
                        className="mt-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-sm"
                        style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }]}
                    >
                        <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-2">Contact</Text>
                        {normalizedTiffin.contact && <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">Contact: {normalizedTiffin.contact}</Text>}
                        {normalizedTiffin.contactPhone && <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">Phone: {normalizedTiffin.contactPhone}</Text>}
                        {normalizedTiffin.contactEmail && <Text className="text-sm text-gray-600 dark:text-gray-300 mb-1">Email: {normalizedTiffin.contactEmail}</Text>}
                        {normalizedTiffin.location?.address && <Text className="text-sm text-gray-600 dark:text-gray-300">Address: {normalizedTiffin.location.address}</Text>}
                    </View>
                )}

                {normalizedTiffin.location?.lat && normalizedTiffin.location?.lng && (
                    <TouchableOpacity
                        className="mt-6 bg-[#02757A] px-4 py-4 rounded-2xl items-center"
                        onPress={() => openInMaps(normalizedTiffin.location!.lat, normalizedTiffin.location!.lng)}
                    >
                        <Text className="text-white font-semibold text-base">Navigate in Google Maps</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
