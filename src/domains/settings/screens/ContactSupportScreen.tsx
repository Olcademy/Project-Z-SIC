import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';

export const ContactSupportScreen: React.FC = () => {
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

    const Row = ({ label, value }: { label: string; value: string }) => (
        <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1A1A', marginTop: 4 }}>{value}</Text>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={{ paddingTop: 60, paddingBottom: 12, paddingHorizontal: 20 }}>
                <ScreenHeader
                    title="Contact Support"
                    subtitle="We usually reply within 24 hours"
                    showSearch={false}
                    onBack={() => (navigation as any).goBack()}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                <View style={cardStyle}>
                    <Row label="Email" value="support@projectz-sic.com" />
                    <Row label="Phone" value="+91 90000 00000" />
                    <Row label="Hours" value="Mon–Sat, 9:00 AM – 6:00 PM" />
                    <Text style={{ fontSize: 13, color: '#666', lineHeight: 18 }}>
                        Please include your registered email and a short description of the issue.
                    </Text>
                </View>

                <View style={{ paddingTop: 8 }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, textAlign: 'center' }}>
                        For urgent issues, call during support hours.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};
