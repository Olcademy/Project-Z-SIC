import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';

export const FaqScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();

    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    };

    const Q = ({ title, body }: { title: string; body: string }) => (
        <View style={cardStyle}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>{body}</Text>
        </View>
    );

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
                <Q
                    title="How do filters work?"
                    body="Use Filters to narrow results by cuisine, veg-only, rating, offers, date, and sorting. Changes apply instantly and stay saved for next time."
                />
                <Q
                    title="Why can't I add favourites as a guest?"
                    body="Favourites need an account so they can sync across sessions. Please login to save and manage your favourites."
                />
                <Q
                    title="How do I update my profile?"
                    body="Go to Settings → Profile to edit your name, phone number, and profile photo."
                />
                <View style={{ paddingTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, textAlign: 'center' }}>
                        Need more help? Use Contact Support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};
