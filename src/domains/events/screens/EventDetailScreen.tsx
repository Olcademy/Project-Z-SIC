import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl, Image } from 'react-native';
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
import { mockEvents } from '../Mockdata/mockData';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetail'>;

type VenueObj = {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
};

/**
 * Resolves all location parts from the Event's venue + location fields.
 *
 * venue object  →  { name, address, city, state, country }
 * venue string  →  treated as venueName
 * location.address → street-level fallback
 *
 * Returns:
 *   venueName   – "TIFF Bell Lightbox"
 *   streetLine  – "350 King St W"
 *   cityState   – "Toronto, ON"           (used in compact info row)
 *   country     – "Canada"
 *   fullAddress – "350 King St W, Toronto, ON, Canada"  (shown in address card)
 */
function resolveLocation(event: Event) {
    let venueName  = '';
    let streetLine = '';
    let city       = '';
    let state      = '';
    let country    = '';

    if (event.location) {
        if (typeof event.location === 'object') {
            const v = event.location as VenueObj;
            venueName  = v.name    || '';
            streetLine = v.address || '';
            city       = v.city    || '';
            state      = v.state   || '';
            country    = v.country || '';
        } else {
            // location is a plain string — treat it as the venue name
            venueName = String(event.location);
        }
    }

    // city + state for the compact row
    const cityState = [city, state].filter(Boolean).join(', ');

    // full address: street · city, state · country
    const fullAddress = [streetLine, cityState, country].filter(Boolean).join(', ');

    // Absolute fallback if location gave us nothing
    const displayAddress = fullAddress || event.location?.address || '';

    return { venueName, streetLine, cityState, country, fullAddress: displayAddress };
}

export const EventDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const paramItem = route.params.item;
    const id = ('id' in route.params ? route.params.id : undefined) ?? paramItem?._id ?? '';

    const { data: event, isLoading, isError, isRefetching, refetch } = useEventDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    // Priority: live API → param item → mockEvents fallback (for deep-links)
    const normalizedEvent: Event | undefined = useMemo(() => {
        if (event)     return event as Event;
        if (paramItem) return paramItem;
        return (mockEvents as Event[]).find((e) => e._id === id);
    }, [event, paramItem, id]);

    const images = useMemo(() => {
        if (!normalizedEvent) return [];
        const raw = [...(normalizedEvent.images || [])].filter(Boolean) as string[];
        if (raw.length > 0) return Array.from(new Set(raw));
        const fallback = normalizedEvent.imageUrl || (normalizedEvent as any).image;
        return fallback ? [String(fallback)] : [];
    }, [normalizedEvent]);

    const { venueName, streetLine, cityState, country, fullAddress } = useMemo(
        () => normalizedEvent ? resolveLocation(normalizedEvent) : { venueName: '', streetLine: '', cityState: '', country: '', fullAddress: '' },
        [normalizedEvent],
    );

    const dateObj = useMemo(() => {
        const raw = normalizedEvent?.startAt || normalizedEvent?.date;
        if (!raw) return null;
        const d = new Date(raw);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [normalizedEvent]);

    const endDateObj = useMemo(() => {
        if (!normalizedEvent?.endAt) return null;
        const d = new Date(normalizedEvent.endAt);
        return Number.isNaN(d.getTime()) ? null : d;
    }, [normalizedEvent]);

    const dateText = dateObj
        ? dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
        : '—';
    const timeText = dateObj
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—';

    const isPastEvent = useMemo(() => {
        const raw = normalizedEvent?.endAt || normalizedEvent?.date;
        if (!raw) return false;
        const ms = new Date(raw).getTime();
        return Number.isFinite(ms) && ms < Date.now();
    }, [normalizedEvent]);

    if (isLoading && !paramItem) return <LoadingSkeletonList count={2} />;
    if ((isError && !paramItem) || !normalizedEvent) {
        return <ErrorState message="Failed to load event details." onRetry={refetch} />;
    }

    const bookingEnabled  = Boolean(featureFlags?.enableBooking) && !isPastEvent;
    const hasExtraDetails = Boolean(normalizedEvent.priceInfo || normalizedEvent.price || endDateObj);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: insets.bottom + 96 }}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
            >
                {/* ── Image carousel ─────────────────────────────────── */}
                <View style={{ width: '100%' }}>
                    {images.length > 0 ? (
                        <View style={{ height: 280 }}>
                            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ height: 280 }}>
                                {images.map((uri, i) => (
                                    <Image
                                        key={i.toString()}
                                        source={{ uri }}
                                        style={{
                                            width: Dimensions.get('window').width,
                                            height: 280,
                                            borderBottomLeftRadius: 20,
                                            borderBottomRightRadius: 20,
                                        }}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                    
                        </View>
                    ) : (
                        <View style={{ height: 280, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
                            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
                            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 8 }}>No image available</Text>
                        </View>
                    )}

                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{
                            position: 'absolute', top: insets.top + 10, left: 16,
                            height: 40, width: 40, borderRadius: 20,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                        }}
                        accessibilityRole="button" accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={{ padding: 16 }}>

                    {/* ── Category badge + title ──────────────────────── */}
                    <View style={{ marginBottom: 16 }}>
                        {!!normalizedEvent.category && (
                            <View style={{
                                alignSelf: 'flex-start', backgroundColor: '#FFF5F0',
                                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
                            }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7F50' }}>
                                    {normalizedEvent.category}
                                </Text>
                            </View>
                        )}
                        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text }}>
                            {normalizedEvent.name || normalizedEvent.title || 'Unnamed Event'}
                        </Text>
                        {isPastEvent && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', marginTop: 8,
                                backgroundColor: '#FFF0F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                            }}>
                                <Ionicons name="time-outline" size={14} color="#CC4444" style={{ marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: '#CC4444', fontWeight: '600' }}>This event has ended</Text>
                            </View>
                        )}
                    </View>

                    {/* ── Compact info row: Date | Time | City ───────── */}
                    <View style={{
                        marginBottom: 16, backgroundColor: colors.card,
                        borderWidth: 1, borderColor: colors.border, borderRadius: 16,
                        paddingVertical: 14, flexDirection: 'row', alignItems: 'center',
                    }}>
                        {/* Date */}
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                            <Ionicons name="calendar-outline" size={16} color="#FF7F50" style={{ marginBottom: 4 }} />
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>Date</Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }} numberOfLines={2}>
                                {dateText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 40, backgroundColor: colors.border }} />
                        {/* Time */}
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                            <Ionicons name="time-outline" size={16} color="#FF7F50" style={{ marginBottom: 4 }} />
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>Time</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }} numberOfLines={1}>
                                {timeText}
                            </Text>
                        </View>
                        <View style={{ width: 1, height: 40, backgroundColor: colors.border }} />
                        {/* City / State */}
                        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
                            <Ionicons name="location-outline" size={16} color="#FF7F50" style={{ marginBottom: 4 }} />
                            <Text style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>Location</Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.text, textAlign: 'center' }} numberOfLines={2}>
                                {cityState || venueName || '—' }
                            </Text>
                        </View>
                    </View>

                    {/* ── Full venue + address card ───────────────────── */}
                    {(venueName || fullAddress) ? (
                        <View style={{
                            marginBottom: 16, backgroundColor: colors.card,
                            borderWidth: 1, borderColor: colors.border, borderRadius: 16,
                            padding: 14, flexDirection: 'row', alignItems: 'flex-start',
                        }}>
                            {/* Pin icon bubble */}
                            <View style={{
                                width: 38, height: 38, borderRadius: 19,
                                backgroundColor: '#FFF5F0', alignItems: 'center', justifyContent: 'center',
                                marginRight: 12, marginTop: 2,
                            }}>
                                <Ionicons name="map" size={18} color="#FF7F50" />
                            </View>

                            <View style={{ flex: 1 }}>
                                {/* Venue name */}
                                {!!venueName && (
                                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 }}>
                                        {venueName}
                                    </Text>
                                )}
                                {/* Street address */}
                                {!!streetLine && (
                                    <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                                        {streetLine}
                                    </Text>
                                )}
                                {/* City, State */}
                                {!!cityState && (
                                    <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 2 }}>
                                        {cityState}
                                    </Text>
                                )}
                                {/* Country */}
                                {!!country && (
                                    <Text style={{ fontSize: 12, color: colors.textMuted }}>
                                        {country}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ) : null}

                    {/* ── About ──────────────────────────────────────── */}
                    <View style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>About</Text>
                        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.textMuted }}>
                                {normalizedEvent.description || 'No description available.'}
                            </Text>
                        </View>
                    </View>

                    {/* ── Price / End date ───────────────────────────── */}
                    {hasExtraDetails && (
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 8 }}>Event details</Text>
                            <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 14 }}>
                                {(normalizedEvent.priceInfo || normalizedEvent.price) && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: endDateObj ? 14 : 0 }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Ionicons name="pricetag-outline" size={16} color="#FF7F50" />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Price</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                                {normalizedEvent.priceInfo || String(normalizedEvent.price)}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                {endDateObj && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF5F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                            <Ionicons name="calendar-outline" size={16} color="#FF7F50" />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>Ends</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                                                {endDateObj.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                {' · '}
                                                {endDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
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

            {/* ── Bottom CTA ─────────────────────────────────────── */}
            <View style={{
                position: 'absolute', left: 0, right: 0, bottom: 0,
                padding: 16, paddingBottom: Math.max(16, insets.bottom + 16),
                backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border,
            }}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={isPastEvent ? 'Event ended' : 'Book now'}
                    activeOpacity={0.9}
                    disabled={!bookingEnabled}
                    onPress={() => {}}
                    style={{
                        height: 50, borderRadius: 16,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: bookingEnabled ? colors.primary : colors.border,
                    }}
                >
                    <Text style={{ fontSize: 15, fontWeight: '800', color: bookingEnabled ? '#FFFFFF' : colors.textMuted }}>
                        {isPastEvent ? 'Event Ended' : 'Book Now'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};