import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';

export const PrivacyPolicyScreen: React.FC = () => {
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

    const Section = ({ title, body }: { title: string; body: string }) => (
        <View style={cardStyle}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 6 }}>{title}</Text>
            <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>{body}</Text>
        </View>
    );

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
                <Section
                    title="What we collect"
                    body="We collect basic account information (like name and email) and app usage data to improve your experience."
                />
                <Section
                    title="How we use it"
                    body="Your data is used to authenticate you, personalize results, and save preferences like filters and favourites."
                />
                <Section
                    title="Your controls"
                    body="You can update your profile anytime in Settings. Logging out clears your local session on this device."
                />
                <View style={{ paddingTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, textAlign: 'center' }}>
                        For questions, reach out via Contact Support.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};
