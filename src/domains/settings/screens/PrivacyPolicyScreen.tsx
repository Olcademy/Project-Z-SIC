import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const sections = [
    {
        icon: 'document-text-outline' as const,
        title: 'What we collect',
        short: 'We collect basic account information and app usage data to improve your experience.',
        full: 'We collect basic account information such as your name, email address, and profile photo when you sign in. We also collect app usage data including the restaurants and events you view, your search queries, and filter preferences. This helps us personalize your experience and improve the app over time.',
    },
    {
        icon: 'analytics-outline' as const,
        title: 'How we use it',
        short: 'Your data is used to authenticate you, personalize results, and save preferences.',
        full: 'Your data is used to authenticate your identity securely, personalize restaurant and event recommendations, and save your preferences such as filters and favourites across sessions. We may also use aggregated, anonymized data to understand usage trends and improve app performance. We do not sell your personal data to third parties.',
    },
    {
        icon: 'share-social-outline' as const,
        title: 'Data sharing',
        short: 'We do not sell your data. Limited sharing happens only with trusted service providers.',
        full: 'We do not sell, rent, or trade your personal information. We may share limited data with trusted third-party service providers (such as authentication and cloud storage providers) solely to operate the app. These providers are contractually required to protect your data and may not use it for their own purposes.',
    },
    {
        icon: 'lock-closed-outline' as const,
        title: 'Data security',
        short: 'Your data is protected using industry-standard encryption and secure storage.',
        full: 'We use industry-standard encryption (TLS/HTTPS) for all data transmitted between your device and our servers. Passwords are never stored in plain text. Your session tokens are stored securely on your device and are invalidated when you log out. We regularly review our security practices to keep your data safe.',
    },
    {
        icon: 'time-outline' as const,
        title: 'Data retention',
        short: 'We retain your data only as long as your account is active or as needed.',
        full: 'We retain your account data for as long as your account remains active. If you delete your account, your personal data is permanently removed from our systems within 30 days. Some anonymized usage data may be retained longer for analytics purposes but cannot be linked back to you.',
    },
    {
        icon: 'person-outline' as const,
        title: 'Your controls',
        short: 'You can update or delete your profile anytime in Settings.',
        full: 'You can update your name, phone number, and profile photo at any time in Settings > Profile. Logging out clears your local session on this device. You may also request full deletion of your account and associated data by contacting our support team. We will process your request within 30 days.',
    },
    {
        icon: 'notifications-outline' as const,
        title: 'Cookies & tracking',
        short: 'We use minimal tracking only to keep the app functioning properly.',
        full: 'We use session tokens and local storage to keep you logged in and remember your preferences. We do not use third-party advertising trackers or sell your browsing behaviour. Any analytics we collect are anonymized and used solely to improve app performance and user experience.',
    },
    {
        icon: 'refresh-outline' as const,
        title: 'Policy updates',
        short: 'We may update this policy and will notify you of significant changes.',
        full: 'We may update this Privacy Policy from time to time to reflect changes in the app or applicable laws. When we make significant changes, we will notify you via an in-app notice or email. Continued use of the app after changes are posted constitutes your acceptance of the updated policy. The date of the latest revision is shown at the bottom of this screen.',
    },
];

export const PrivacyPolicyScreen: React.FC = () => {
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
                    title="Privacy Policy"
                    subtitle="How we use your data"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>

                {/* Intro banner */}
                <View style={{
                    backgroundColor: '#FFF5EE',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#FFD9BC',
                }}>
                    <Ionicons name="shield-checkmark-outline" size={28} color="#FF7A00" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 }}>Your privacy matters to us</Text>
                        <Text style={{ fontSize: 12, color: '#888', lineHeight: 17 }}>
                            We are committed to being transparent about how we collect and use your data. Tap any section to learn more.
                        </Text>
                    </View>
                </View>

                {sections.map((section, index) => {
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
                            {/* Header row */}
                            <TouchableOpacity
                                onPress={() => toggle(index)}
                                activeOpacity={0.8}
                                style={{ flexDirection: 'row', alignItems: 'center' }}
                            >
                                <View style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    backgroundColor: isExpanded ? '#FF7A00' : '#FFF5EE',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                }}>
                                    <Ionicons name={section.icon} size={17} color={isExpanded ? '#fff' : '#FF7A00'} />
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 8 }}>
                                    {section.title}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                    size={18}
                                    color="#FF7A00"
                                />
                            </TouchableOpacity>

                            {/* Body */}
                            <Text style={{ fontSize: 13, color: '#666', lineHeight: 20, marginTop: 10 }}>
                                {isExpanded ? section.full : section.short}
                            </Text>

                            {/* See more / less */}
                            <TouchableOpacity onPress={() => toggle(index)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7A00', marginRight: 4 }}>
                                    {isExpanded ? 'See less' : 'See more'}
                                </Text>
                                <Ionicons
                                    name={isExpanded ? 'arrow-up-circle-outline' : 'arrow-forward-circle-outline'}
                                    size={14}
                                    color="#FF7A00"
                                />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Footer */}
                <View style={{ paddingTop: 4, paddingBottom: 8, alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: theme.subtext, textAlign: 'center', lineHeight: 18 }}>
                        Last updated: May 2025{'\n'}For questions, reach out via Contact Support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};