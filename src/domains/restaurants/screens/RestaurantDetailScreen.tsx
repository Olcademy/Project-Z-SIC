import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RestaurantsStackParamList } from '@/app/navigation/types';
import { useRestaurantDetail } from '../hooks/useRestaurants';
import { RestaurantDetail, RestaurantMenuItem, RestaurantMenuSection } from '@/domains/restaurants/types';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ErrorState } from '@/ui/components/ErrorState';
import { LoadingSkeletonList } from '@/ui/components/LoadingSkeletonList';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ImageCarousel } from '@/ui/components/ImageCarousel';

import pizzaImg from '../../../../assets/pizza.jpg';
import pizzaImg2 from '../../../../assets/Pizza.png';

type Props = NativeStackScreenProps<RestaurantsStackParamList, 'RestaurantDetail'>;

const PRIMARY = '#FF7A00';
const BG = '#F5F5F5';
const TEXT = '#212121';
const TEXT_MUTED = '#757575';
const RATING_GREEN = '#2E7D32';

type FilterKey = 'nearFast' | 'rating4' | 'pureVeg';

const toNumber = (value: unknown): number | null => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const isLikelyVegItem = (item: RestaurantMenuItem, restaurantVegOnly?: boolean): boolean => {
    const anyItem = item as unknown as Record<string, unknown>;
    const explicit = anyItem.isVeg ?? anyItem.vegOnly ?? anyItem.veg ?? anyItem.is_veg;
    if (typeof explicit === 'boolean') return explicit;
    if (restaurantVegOnly) return true;

    const haystack = `${item.name ?? ''} ${item.description ?? ''}`.toLowerCase();
    if (haystack.includes('veg')) return true;
    const nonVegHints = ['chicken', 'mutton', 'lamb', 'egg', 'fish', 'prawn', 'shrimp', 'beef', 'pork'];
    return !nonVegHints.some((w) => haystack.includes(w));
};

const getItemRating = (item: RestaurantMenuItem, restaurantRating: number): number => {
    const candidate = (item as unknown as Record<string, unknown>).rating;
    const rating = toNumber(candidate);
    return rating ?? restaurantRating;
};

const chunk = <T,>(arr: T[], size: number) => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
};

export const RestaurantDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const paramItem = route.params.item;
    const id = ('id' in route.params ? route.params.id : undefined) ?? paramItem?._id ?? '';

    const { data: restaurant, isLoading, isError, isRefetching, refetch } = useRestaurantDetail(id);
    const { data: featureFlags } = useFeatureFlags();
    const insets = useSafeAreaInsets();
    const normalizedRestaurant = (restaurant ?? paramItem) as RestaurantDetail | undefined;

    const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
        nearFast: false,
        rating4: false,
        pureVeg: false,
    });

    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'Recommended for you': true,
        'Dum Biryani': false,
        Starters: false,
        'Main Course': false,
    });

    const mostOrderedTogether = useMemo(() => {
        return [
            { key: 'mexicanPizza', title: 'Mexican Pizza', veg: true, image: pizzaImg },
            { key: 'chickenPizza', title: 'Chicken Pizza', veg: false, image: pizzaImg2 },
        ] as const;
    }, []);

    const images = useMemo(() => {
        if (!normalizedRestaurant) return [];
        const raw = [
            ...(normalizedRestaurant.images || []),
            ...(normalizedRestaurant.image_urls || []),
        ].filter(Boolean) as string[];

        if (raw.length > 0) {
            const uniq = Array.from(new Set(raw));
            return uniq;
        }

        const fallback = normalizedRestaurant.imageUrl || (normalizedRestaurant as any).image;
        return fallback ? [String(fallback)] : [];
    }, [normalizedRestaurant]);

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

    const ratingValue = useMemo(() => {
        if (!normalizedRestaurant) return 0;
        const candidate =
            (normalizedRestaurant as any).rating ??
            normalizedRestaurant.restaurantInfo?.ratings?.overall;
        return toNumber(candidate) ?? 0;
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

    const distanceText = useMemo(() => {
        if (!normalizedRestaurant) return '—';
        const rawDistance =
            (normalizedRestaurant as any).distance ??
            (normalizedRestaurant as any).distanceKm ??
            (normalizedRestaurant as any).distance_km;
        const km = toNumber(rawDistance);

        const address =
            normalizedRestaurant.address ||
            normalizedRestaurant.location?.address ||
            normalizedRestaurant.restaurantInfo?.address ||
            '';

        const near = address ? `Near ${address.split(',')[0]?.trim()}` : 'Near you';
        if (km !== null) return `${km.toFixed(1)} Km - ${near}`;
        return `— - ${near}`;
    }, [normalizedRestaurant]);

    const toggleFilter = useCallback((key: FilterKey) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ nearFast: false, rating4: false, pureVeg: false });
    }, []);

    const anyFilterActive = filters.nearFast || filters.rating4 || filters.pureVeg;

    const menuPreview = useMemo(() => {
        if (menuSections.length === 0) return [] as RestaurantMenuItem[];
        const firstSection = menuSections[0];
        return (firstSection.items || []).slice(0, 4);
    }, [menuSections]);

    const filteredMenuSections = useMemo(() => {
        if (!normalizedRestaurant) return [] as RestaurantMenuSection[];

        const restaurantVegOnly = Boolean((normalizedRestaurant as any).vegOnly || (normalizedRestaurant as any).isVeg);
        const applyVeg = filters.pureVeg;
        const applyRating = filters.rating4;

        const next = (menuSections || []).map((section) => {
            const items = (section.items || []).filter((item) => {
                if (applyVeg && !isLikelyVegItem(item, restaurantVegOnly)) return false;
                if (applyRating && getItemRating(item, ratingValue) < 4) return false;
                return true;
            });
            return { ...section, items };
        });

        return next;
    }, [filters.pureVeg, filters.rating4, menuSections, normalizedRestaurant, ratingValue]);

    const allMenuItems = useMemo(() => {
        const items = filteredMenuSections.flatMap((s) => s.items || []);
        const seen = new Set<string>();
        return items.filter((i) => {
            const key = `${i.name}::${i.description ?? ''}::${i.price ?? ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [filteredMenuSections]);

    const accordionSections = useMemo(() => {
        const titles = ['Recommended for you', 'Dum Biryani', 'Starters', 'Main Course'] as const;

        const candidateSections = filteredMenuSections.filter((s) => (s.items || []).length > 0);
        if (candidateSections.length >= 4) {
            return titles.map((title, idx) => ({
                title,
                items: candidateSections[idx]?.items ?? [],
            }));
        }

        const items = allMenuItems;
        if (items.length === 0) {
            return titles.map((title) => ({ title, items: [] as RestaurantMenuItem[] }));
        }

        const per = Math.max(1, Math.ceil(items.length / titles.length));
        const pieces = chunk(items, per);
        return titles.map((title, idx) => ({
            title,
            items: pieces[idx] ?? [],
        }));
    }, [allMenuItems, filteredMenuSections]);

    const getQuantityKey = useCallback((item: RestaurantMenuItem) => {
        return `${id}::${item.name}::${item.price ?? ''}`;
    }, [id]);

    if (isLoading && !paramItem) {
        return <LoadingSkeletonList count={2} />;
    }

    if ((isError && !paramItem) || !normalizedRestaurant) {
        return <ErrorState message="Failed to load restaurant details." onRetry={refetch} />;
    }

    const orderingEnabled = Boolean(featureFlags?.enableOrdering);

    const heroHeight = 270;
    const screenWidth = Dimensions.get('window').width;

    return (
        <View style={styles.screen}>
            <ScrollView
                stickyHeaderIndices={[4]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={PRIMARY}
                    />
                }
            >
                {/* HERO */}
                <View style={styles.heroWrap}>
                    <View style={[styles.heroImageWrap, { height: heroHeight }]}
                        pointerEvents="box-none"
                    >
                        {images.length > 0 ? (
                            <ImageCarousel
                                images={images}
                                height={heroHeight}
                                width={screenWidth}
                                showDots={false}
                                imageStyle={styles.heroImage}
                            />
                        ) : (
                            <View style={[styles.heroFallback, { height: heroHeight }]}>
                                <Text style={styles.heroFallbackText}>No image available</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[styles.backBtn, { top: insets.top + 10 }]}
                            accessibilityRole="button"
                            accessibilityLabel="Go back"
                        >
                            <Ionicons name="chevron-back" size={22} color={TEXT} />
                        </TouchableOpacity>

                        <View style={styles.heroOverlayRow} pointerEvents="none">
                            <View style={{ flex: 1, paddingRight: 12 }}>
                                <Text style={styles.heroTitle} numberOfLines={1}>
                                    {normalizedRestaurant.name || 'Unnamed Restaurant'}
                                </Text>
                            </View>
                            <View style={styles.ratingPill}>
                                <Ionicons name="star" size={12} color="#FFFFFF" style={{ marginRight: 5 }} />
                                <Text style={styles.ratingText}>{ratingText}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* INFO */}
                <View style={styles.sectionPad}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Ionicons name="location-outline" size={14} color={TEXT_MUTED} style={styles.infoIcon} />
                            <Text style={styles.infoText} numberOfLines={1}>{distanceText}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="time-outline" size={14} color={TEXT_MUTED} style={styles.infoIcon} />
                            <Text style={styles.infoText} numberOfLines={1}>{deliveryTimeText}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name="calendar-outline" size={14} color={TEXT_MUTED} style={styles.infoIcon} />
                            <Text style={styles.infoText} numberOfLines={1}>Schedule for later</Text>
                        </View>
                    </View>
                </View>

                {/* FILTER CHIPS */}
                <View style={[styles.sectionPad, { paddingTop: 6, paddingBottom: 0 }]}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 16, paddingVertical: 2, alignItems: 'center' }}
                    >
                        <Pressable
                            onPress={() => { if (anyFilterActive) clearFilters(); }}
                            style={[styles.chip, anyFilterActive ? styles.chipActive : null]}
                        >
                            <Text style={[styles.chipText, anyFilterActive ? styles.chipTextActive : null]}>Filters</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => toggleFilter('nearFast')}
                            style={[styles.chip, filters.nearFast ? styles.chipActive : null]}
                        >
                            <Text style={[styles.chipText, filters.nearFast ? styles.chipTextActive : null]}>Near & Fast</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => toggleFilter('rating4')}
                            style={[styles.chip, filters.rating4 ? styles.chipActive : null]}
                        >
                            <Text style={[styles.chipText, filters.rating4 ? styles.chipTextActive : null]}>Rating 4.0+</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => toggleFilter('pureVeg')}
                            style={[styles.chip, filters.pureVeg ? styles.chipActive : null]}
                        >
                            <Text style={[styles.chipText, filters.pureVeg ? styles.chipTextActive : null]}>Pure Veg</Text>
                        </Pressable>
                    </ScrollView>
                </View>

                {/* MOST ORDERED TOGETHER */}
                <View style={[styles.sectionPad, { paddingTop: 8 }]}>
                    <Text style={styles.sectionTitle}>Most ordered together</Text>
                    <View style={styles.motListCard}>
                        {mostOrderedTogether.map((row, index) => {
                            const badgeColor = row.veg ? '#1B5E20' : '#B71C1C';
                            return (
                                <View key={row.key} style={styles.motRow}>
                                    <Image source={row.image} style={styles.motImage} />
                                    <View style={styles.motRight}>
                                        <Text style={styles.motTitle} numberOfLines={1}>{row.title}</Text>
                                        <Text style={styles.motSubtitle} numberOfLines={1}>Pizza · 8" · small</Text>
                                        <Text style={styles.motDesc} numberOfLines={2}>
                                            Tortillas (distinct from tostada shells) stacked with a layer of refried beans and seasoned ground beef in between.
                                        </Text>
                                        <View style={styles.motMetaRow}>
                                            <Text style={styles.motPrice}>$12.89</Text>
                                            <Text style={styles.motDiscount}>20% OFF</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.vegBadge, { borderColor: badgeColor }]}>
                                        <View style={[styles.vegDot, { backgroundColor: badgeColor }]} />
                                    </View>
                                    {index < mostOrderedTogether.length - 1 ? <View style={styles.motDivider} /> : null}
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* STICKY ORDER NOW */}
                <View style={styles.stickyWrap}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Order now"
                        activeOpacity={0.9}
                        disabled={!orderingEnabled}
                        onPress={() => {}}
                        style={[styles.orderNowBtn, !orderingEnabled ? { opacity: 0.55 } : null]}
                    >
                        <Text style={styles.orderNowText}>Order Now</Text>
                    </TouchableOpacity>
                    {!orderingEnabled ? (
                        <Text style={styles.orderDisabledNote}>Ordering is coming soon.</Text>
                    ) : null}
                </View>

                {/* COLLAPSIBLE SECTIONS */}
                <View style={styles.sectionPad}>
                    {(() => {
                        const recommended = accordionSections.find((s) => s.title === 'Recommended for you');
                        const children = accordionSections.filter((s) => s.title !== 'Recommended for you');
                        const isRecommendedOpen = Boolean(expanded['Recommended for you']);

                        if (!recommended) return null;

                        return (
                            <View style={styles.accordionWrap}>
                                <TouchableOpacity
                                    onPress={() => setExpanded((prev) => ({ ...prev, 'Recommended for you': !isRecommendedOpen }))}
                                    activeOpacity={0.85}
                                    style={styles.accordionHeader}
                                >
                                    <Text style={styles.accordionTitle}>Recommended for you</Text>
                                    <View style={{ transform: [{ rotate: isRecommendedOpen ? '180deg' : '0deg' }] }}>
                                        <Ionicons name="chevron-down" size={18} color={PRIMARY} />
                                    </View>
                                </TouchableOpacity>

                                {isRecommendedOpen ? (
                                    <View style={styles.recommendedBody}>
                                        {children.map((section) => {
                                            const isOpen = Boolean(expanded[section.title]);
                                            return (
                                                <View key={section.title} style={styles.nestedAccordionWrap}>
                                                    <TouchableOpacity
                                                        onPress={() => setExpanded((prev) => ({ ...prev, [section.title]: !isOpen }))}
                                                        activeOpacity={0.85}
                                                        style={styles.accordionHeader}
                                                    >
                                                        <Text style={styles.accordionTitle}>{section.title}</Text>
                                                        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
                                                            <Ionicons name="chevron-down" size={18} color={PRIMARY} />
                                                        </View>
                                                    </TouchableOpacity>

                                                    {isOpen ? (
                                                        <View style={styles.accordionBody}>
                                                            {section.items.length === 0 ? (
                                                                <Text style={styles.emptyItems}>No items found.</Text>
                                                            ) : (
                                                                section.items.map((it, idx) => (
                                                                    <View
                                                                        key={`${section.title}-${it.name}-${idx}`}
                                                                        style={[styles.menuRow, idx < section.items.length - 1 ? styles.menuRowBorder : null]}
                                                                    >
                                                                        <View style={{ flex: 1, paddingRight: 12 }}>
                                                                            <Text style={styles.menuName} numberOfLines={1}>{it.name}</Text>
                                                                            {it.description ? (
                                                                                <Text style={styles.menuDesc} numberOfLines={2}>{it.description}</Text>
                                                                            ) : null}
                                                                        </View>
                                                                        <Text style={styles.menuPrice}>
                                                                            {it.price !== undefined && it.price !== null ? `₹${it.price}` : ''}
                                                                        </Text>
                                                                    </View>
                                                                ))
                                                            )}
                                                        </View>
                                                    ) : null}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ) : null}
                            </View>
                        );
                    })()}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG },
    heroWrap: { backgroundColor: '#FFFFFF' },
    heroImageWrap: { width: '100%', backgroundColor: '#FFFFFF', overflow: 'hidden', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    heroImage: { backgroundColor: '#FFFFFF', width: Dimensions.get('window').width, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
    heroFallback: { width: '100%', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    heroFallbackText: { color: TEXT_MUTED, fontSize: 13, fontWeight: '600' },
    backBtn: { position: 'absolute', left: 16, height: 40, width: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E0E0' },
    heroOverlayRow: { position: 'absolute', left: 16, right: 16, bottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
    ratingPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: RATING_GREEN },
    ratingText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    sectionPad: { paddingHorizontal: 16, paddingTop: 14 },
    infoRow: { backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12 },
    infoItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    infoIcon: { marginRight: 8 },
    infoText: { color: TEXT_MUTED, fontSize: 13, fontWeight: '600', flex: 1 },
    chip: { borderWidth: 1, borderColor: PRIMARY, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, backgroundColor: '#FFFFFF' },
    chipActive: { backgroundColor: PRIMARY },
    chipText: { fontSize: 13, fontWeight: '700', color: PRIMARY },
    chipTextActive: { color: '#FFFFFF' },
    stickyWrap: { backgroundColor: BG, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
    orderNowBtn: { width: '100%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E0E0E0' },
    orderNowText: { fontSize: 15, fontWeight: '800', color: TEXT },
    orderDisabledNote: { marginTop: 8, fontSize: 12, fontWeight: '600', color: TEXT_MUTED },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT, marginBottom: 10 },
    motListCard: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
    motRow: { position: 'relative', flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 116 },
    motImage: { width: 92, height: 92, borderRadius: 12, backgroundColor: '#F3F4F6' },
    motRight: { flex: 1, paddingLeft: 12, paddingRight: 34 },
    motTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
    motSubtitle: { marginTop: 4, fontSize: 12, fontWeight: '700', color: TEXT },
    motDesc: { marginTop: 6, fontSize: 12, fontWeight: '600', lineHeight: 17, color: TEXT_MUTED },
    motMetaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    motPrice: { fontSize: 14, fontWeight: '900', color: TEXT },
    motDiscount: { fontSize: 12, fontWeight: '700', color: TEXT_MUTED },
    vegBadge: { position: 'absolute', top: 12, right: 12, width: 14, height: 14, borderRadius: 2, borderWidth: 1.6, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    vegDot: { width: 7, height: 7, borderRadius: 3.5 },
    motDivider: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 1, backgroundColor: '#EEEEEE' },
    accordionWrap: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
    accordionHeader: { paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    accordionTitle: { fontSize: 15, fontWeight: '800', color: TEXT },
    accordionBody: { paddingHorizontal: 14, paddingBottom: 10 },
    recommendedBody: { paddingHorizontal: 14, paddingBottom: 12 },
    nestedAccordionWrap: { marginTop: 10, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EEEEEE' },
    emptyItems: { fontSize: 12, fontWeight: '600', color: TEXT_MUTED, paddingVertical: 10 },
    menuRow: { paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#EEEEEE' },
    menuName: { fontSize: 14, fontWeight: '800', color: TEXT },
    menuDesc: { marginTop: 4, fontSize: 12, fontWeight: '600', lineHeight: 17, color: TEXT_MUTED },
    menuPrice: { fontSize: 13, fontWeight: '800', color: TEXT },
});