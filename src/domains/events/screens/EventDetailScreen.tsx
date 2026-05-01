import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EventsStackParamList } from '@/app/navigation/types';
import { useEventDetail } from '../hooks/useEvents';
import { Event } from '@/domains/events/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useTheme } from '@/ui/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImageCarousel } from '@/ui/components/ImageCarousel';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

export const EventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const paramItem = route.params.item;
    const id = ('id' in route.params ? route.params.id : undefined) ?? paramItem?._id ?? '';

    const { data: event, isLoading, isError, isRefetching, refetch } = useEventDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const normalizedEvent = (event ?? paramItem) as Event | undefined;

    const images = useMemo(() => {
        if (!normalizedEvent) return [];
        const raw = [...(normalizedEvent.images || [])].filter(Boolean) as string[];
        if (raw.length > 0) {
            return Array.from(new Set(raw));
        }
        const fallback = normalizedEvent.imageUrl || (normalizedEvent as any).image;
        return fallback ? [String(fallback)] : [];
    }, [normalizedEvent]);

    const isPastEvent = (dateString?: string) => {
        if (!dateString) return false;
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return false;
        return date.getTime() < Date.now();
    };

    const formatVenue = (venue?: Event['venue']) => {
        if (!venue) return '';
        if (typeof venue === 'string') return venue;
        if (typeof venue === 'object') {
            const value = venue as { name?: string; address?: string; city?: string; state?: string; country?: string };
            return [value.name, value.address, value.city, value.state, value.country]
                .filter(Boolean)
                .join(', ');
        }
        return String(venue);
    };

    const venueText = useMemo(() => {
        if (!normalizedEvent) return '';
        return formatVenue(normalizedEvent.venue) || normalizedEvent.location?.address || '';
    }, [normalizedEvent]);

    const dateObj = useMemo(() => {
        if (!normalizedEvent) return null;
        const candidate = normalizedEvent.startAt || normalizedEvent.date;
        if (!candidate) return null;
        const parsed = new Date(candidate);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }, [normalizedEvent]);

    const dateText = dateObj ? dateObj.toLocaleDateString() : '—';
    const timeText = dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

    if (isLoading && !paramItem) {
        return <LoadingSkeletonList count={2} />;
    }

    if ((isError && !paramItem) || !normalizedEvent) {
        return <ErrorState message="Failed to load event details." onRetry={refetch} />;
    }

    const ended = isPastEvent(normalizedEvent.date);

    const bookingEnabled = Boolean(featureFlags?.enableBooking) && !ended;

    const hasExtraDetails = Boolean(normalizedEvent.priceInfo || normalizedEvent.price || normalizedEvent.endAt);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
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
                </View>

                <View style={{ padding: 16 }}>
                    {/* Title section */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
                            {normalizedEvent.name || normalizedEvent.title || 'Unnamed Event'}
                        </Text>
                        <Text style={{ marginTop: 6, fontSize: 13, fontWeight: '600', color: colors.textMuted }}>
                            {normalizedEvent.category || '—'}
                        </Text>
                        {!!venueText && (
                            <Text style={{ marginTop: 6, fontSize: 12, color: colors.textMuted }} numberOfLines={2}>
                                {venueText}
                            </Text>
                        )}
                        {ended && (
                            <Text style={{ marginTop: 8, fontSize: 12, color: colors.textMuted }}>This event has ended.</Text>
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
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Date</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {dateText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Time</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {timeText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 28, backgroundColor: colors.border }} />
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 10 }}>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 3 }}>Venue</Text>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {venueText || '—'}
                            </Text>
                        </View>
                    </View>

                    {/* About */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>About</Text>
                        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
                                {normalizedEvent.description || 'No description available.'}
                            </Text>
                        </View>
                    </View>

                    {/* Event details (optional) */}
                    {hasExtraDetails && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Event details</Text>
                            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                                {(normalizedEvent.priceInfo || normalizedEvent.price) && (
                                    <View style={{ marginBottom: normalizedEvent.endAt ? 10 : 0 }}>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>Price</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                            {normalizedEvent.priceInfo || normalizedEvent.price}
                                        </Text>
                                    </View>
                                )}
                                {normalizedEvent.endAt && (
                                    <View>
                                        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 2 }}>Ends</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                            {new Date(normalizedEvent.endAt).toLocaleString()}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {!featureFlags?.enableBooking && (
                        <Text style={{ marginBottom: 16, fontSize: 12, color: colors.textMuted }}>
                            Booking is coming soon.
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
                    accessibilityLabel="Book now"
                    activeOpacity={0.9}
                    disabled={!bookingEnabled}
                    onPress={() => {}}
                    style={{
                        height: 50,
                        borderRadius: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bookingEnabled ? colors.primary : colors.border,
                    }}
                >
                    <Text style={{ fontSize: 15, fontWeight: '800', color: bookingEnabled ? '#FFFFFF' : colors.textMuted }}>
                        Book Now
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};
