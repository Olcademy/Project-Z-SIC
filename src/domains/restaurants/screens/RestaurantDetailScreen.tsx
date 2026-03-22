import React, { useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RestaurantsStackParamList } from '@/app/navigation/types';
import { useRestaurantDetail } from '../hooks/useRestaurants';
import { RestaurantDetail, RestaurantMenuItem, RestaurantMenuSection } from '@/domains/restaurants/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { openInMaps } from '@/services/maps/googleMaps';
import { ErrorState } from '@/ui/components/ErrorState';
import { ImageCarousel } from '@/ui/components/ImageCarousel';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useTheme } from '@/ui/context/ThemeContext';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantDetail'>;

export const RestaurantDetailScreen: React.FC<Props> = ({ route }) => {
    const { id } = route.params;
    const { data: restaurant, isLoading, isError, refetch } = useRestaurantDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const theme = useTheme();
    const normalizedRestaurant = restaurant as RestaurantDetail | undefined;

    const images = useMemo(() => {
        if (!normalizedRestaurant) return [];
        return [
            ...(normalizedRestaurant.images || []),
            normalizedRestaurant.imageUrl,
        ].filter(Boolean) as string[];
    }, [normalizedRestaurant]);

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

    const services = useMemo(() => {
        if (!normalizedRestaurant) return [];
        return [
            ...(normalizedRestaurant.serviceTypes || []),
            ...(normalizedRestaurant.badges || []),
        ].filter(Boolean);
    }, [normalizedRestaurant]);

    const hours = useMemo(() => {
        if (!normalizedRestaurant) return [];
        const hoursData = normalizedRestaurant.openingHours || normalizedRestaurant.hours;
        if (Array.isArray(hoursData)) return hoursData;
        if (typeof hoursData === 'string') return [hoursData];
        return [];
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

    if (isLoading) {
        return <LoadingSkeletonList count={2} />;
    }

    if (isError || !normalizedRestaurant) {
        return <ErrorState message="Failed to load restaurant details." onRetry={refetch} />;
    }

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.bg }}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
                {images.length > 0 && <ImageCarousel images={images} />}

                {/* Hero card */}
                <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>{normalizedRestaurant.name || 'Unnamed Restaurant'}</Text>
                    {cuisineTags.length > 0 && (
                        <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 6 }}>{cuisineTags.join(' • ')}</Text>
                    )}
                    {normalizedRestaurant.priceRange && (
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#02757A', marginTop: 6 }}>{normalizedRestaurant.priceRange}</Text>
                    )}
                    {normalizedRestaurant.description && (
                        <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 12, lineHeight: 22 }}>{normalizedRestaurant.description}</Text>
                    )}
                    {!featureFlags?.enableOrdering && (
                        <View style={{ marginTop: 14, backgroundColor: '#fffbeb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#fde68a' }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#b45309' }}>⏳ Ordering Coming Soon</Text>
                        </View>
                    )}
                </View>

                {/* Services */}
                {services.length > 0 && (
                    <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Services</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {services.map((service) => (
                                <View key={service} style={{ backgroundColor: theme.chipBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.chipBorder }}>
                                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.chipText }}>{service}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Hours */}
                {hours.length > 0 && (
                    <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 12 }}>Hours</Text>
                        {hours.map((line) => (
                            <Text key={line} style={{ fontSize: 13, color: theme.subtext, marginBottom: 4 }}>{line}</Text>
                        ))}
                    </View>
                )}

                {/* Location */}
                {(normalizedRestaurant.address || normalizedRestaurant.location?.address) && (
                    <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Location</Text>
                        <Text style={{ fontSize: 13, color: theme.subtext, lineHeight: 20 }}>{normalizedRestaurant.address || normalizedRestaurant.location?.address}</Text>
                    </View>
                )}

                {/* Menu */}
                {menuSections.length > 0 && (
                    <View style={{ backgroundColor: theme.card, borderRadius: 24, padding: 20, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 14 }}>Menu</Text>
                        {menuSections.map((section) => (
                            <View key={section.title} style={{ marginBottom: 16 }}>
                                <View style={{ backgroundColor: theme.chipBg, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 10 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.chipText }}>{section.title}</Text>
                                </View>
                                {section.items.map((item, index) => (
                                    <View key={`${section.title}-${index}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: index < section.items.length - 1 ? 1 : 0, borderBottomColor: theme.border }}>
                                        <View style={{ flex: 1, marginRight: 12 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text }}>{item.name}</Text>
                                            {item.description && (
                                                <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 3, lineHeight: 18 }}>{item.description}</Text>
                                            )}
                                        </View>
                                        {item.price !== undefined && item.price !== null && (
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#02757A' }}>₹{item.price}</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Navigate button */}
                {normalizedRestaurant.location?.lat && normalizedRestaurant.location?.lng && (
                    <TouchableOpacity
                        style={{ marginTop: 20, backgroundColor: '#02757A', paddingVertical: 16, borderRadius: 20, alignItems: 'center', shadowColor: '#02757A', shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 }}
                        onPress={() => openInMaps(normalizedRestaurant.location!.lat!, normalizedRestaurant.location!.lng!)}
                    >
                        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>🗺️  Navigate in Google Maps</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
