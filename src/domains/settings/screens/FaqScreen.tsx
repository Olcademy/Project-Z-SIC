import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const faqs = [
    {
        title: 'How do filters work?',
        short: 'Use Filters to narrow results by cuisine, veg-only, rating, offers, date, and sorting.',
        full: 'Use Filters to narrow results by cuisine, veg-only, rating, offers, date, and sorting. Changes apply instantly and stay saved for next time. You can combine multiple filters at once — for example, filter by "Veg" and "Top Rated" together. To reset, tap the Clear button inside the filter panel.',
    },
    {
        title: "Why can't I add favourites as a guest?",
        short: 'Favourites need an account so they can sync across sessions.',
        full: 'Favourites need an account so they can sync across sessions. Please login to save and manage your favourites. Once logged in, your favourites are saved to your profile and will appear even if you reinstall the app or switch devices.',
    },
    {
        title: 'How do I update my profile?',
        short: 'Go to Settings > Profile to edit your name, phone number, and profile photo.',
        full: 'Go to Settings > Profile to edit your name, phone number, and profile photo. Changes are saved automatically. Your display name appears in the home screen greeting and in your order history.',
    },
    {
        title: 'How do I place a food order?',
        short: 'Browse a restaurant, select items, and tap Order to proceed to checkout.',
        full: 'Browse any restaurant, tap the items you want to add to your cart, and tap Order to proceed to checkout. You can review your cart, adjust quantities, add a tip for the staff, and choose your payment method before confirming. Orders are tracked in real time.',
    },
    {
        title: 'How does the tipping feature work?',
        short: 'At checkout you can add a tip for the restaurant or delivery staff.',
        full: 'At checkout you can add a tip for the restaurant or delivery staff. You can choose from preset amounts (e.g. 10%, 15%, 20%) or enter a custom tip amount. The tip is added to your total and goes directly to the staff. You can also choose to skip tipping entirely.',
    },
    {
        title: 'How do I find nearby events?',
        short: 'Tap the Events tab to explore events happening near you in Canada.',
        full: 'Tap the Events tab to explore events happening near you in Canada. You can filter events by date, category, and location. Tap any event for full details including venue, time, and pricing. You can also save events to your favourites to keep track of ones you are interested in.',
    },
    {
        title: 'How do I contact support?',
        short: 'Go to Settings > Contact Support to send us a message.',
        full: 'Go to Settings > Contact Support to send us a message. Our support team typically responds within 24 hours. For urgent issues, please include your registered email address and a description of the problem so we can assist you faster.',
    },
];

export const FaqScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggle = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(prev => (prev === index ? null : index));
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 }}>
                <ScreenHeader
                    title="FAQ"
                    subtitle="Quick answers"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {faqs.map((faq, index) => {
                    const isExpanded = expandedIndex === index;
                    return (
                        <View
                            key={index}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: 20,
                                padding: 18,
                                marginBottom: 14,
                                shadowColor: '#000',
                                shadowOpacity: 0.04,
                                shadowRadius: 12,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: isExpanded ? '#FF7A00' : '#F0F0F0',
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => toggle(index)}
                                activeOpacity={0.8}
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
                            >
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 10 }}>
                                    {faq.title}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color="#FF7A00"
                                />
                            </TouchableOpacity>

                            <Text style={{ fontSize: 13, color: '#666', lineHeight: 20, marginTop: 8 }}>
                                {isExpanded ? faq.full : faq.short}
                            </Text>

                            <TouchableOpacity onPress={() => toggle(index)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7A00', marginRight: 4 }}>
                                    {isExpanded ? 'See less' : 'See more'}
                                </Text>
                                <Ionicons name={isExpanded ? 'arrow-up-circle-outline' : 'arrow-forward-circle-outline'} size={14} color="#FF7A00" />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                <View style={{ paddingTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, textAlign: 'center' }}>
                        Need more help? Use Contact Support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};