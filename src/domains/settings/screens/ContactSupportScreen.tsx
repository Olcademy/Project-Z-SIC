import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, Alert, Linking, Platform, ToastAndroid,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SUPPORT_EMAIL = 'support@projectz-sic.com';
const SUPPORT_PHONE = '+919000000000';

const topics = ['Order issue', 'Account problem', 'Payment issue', 'Restaurant info', 'Event issue', 'Other'];

export const ContactSupportScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();

    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSend = () => {
        if (!selectedTopic) {
            Alert.alert('Select a topic', 'Please select a topic before sending.');
            return;
        }
        if (message.trim().length < 10) {
            Alert.alert('Message too short', 'Please describe your issue in at least 10 characters.');
            return;
        }
        setSubmitted(true);
    };

    const handleEmail = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support Request&body=Hi Support Team,`);
    };

    const handleCall = () => {
        Linking.openURL(`tel:${SUPPORT_PHONE}`);
    };

    const handleWhatsApp = () => {
        Linking.openURL(`https://wa.me/${SUPPORT_PHONE.replace('+', '')}`);
    };

    const showToast = (msg: string) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(msg, ToastAndroid.SHORT);
        } else {
            Alert.alert('', msg);
        }
    };

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
                    <Ionicons name="headset-outline" size={30} color="#FF7A00" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 }}>
                            How can we help you?
                        </Text>
                        <Text style={{ fontSize: 12, color: '#888', lineHeight: 17 }}>
                            Our support team is available Mon–Sat, 9:00 AM – 6:00 PM IST.
                        </Text>
                    </View>
                </View>

                {/* Quick contact buttons */}
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Reach us directly
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={handleEmail}
                        activeOpacity={0.85}
                        style={{ flex: 1, backgroundColor: '#FFF5EE', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#FFD9BC' }}
                    >
                        <Ionicons name="mail-outline" size={22} color="#FF7A00" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF7A00', marginTop: 6 }}>Email</Text>
                        <Text style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: 'center' }}>support@{'\n'}projectz-sic.com</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleCall}
                        activeOpacity={0.85}
                        style={{ flex: 1, backgroundColor: '#F0F9FF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#B3DFF5' }}
                    >
                        <Ionicons name="call-outline" size={22} color="#0EA5E9" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0EA5E9', marginTop: 6 }}>Call</Text>
                        <Text style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: 'center' }}>+91 90000{'\n'}00000</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleWhatsApp}
                        activeOpacity={0.85}
                        style={{ flex: 1, backgroundColor: '#F0FFF4', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#B2F0C5' }}
                    >
                        <Ionicons name="logo-whatsapp" size={22} color="#22C55E" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#22C55E', marginTop: 6 }}>WhatsApp</Text>
                        <Text style={{ fontSize: 10, color: '#999', marginTop: 2, textAlign: 'center' }}>Chat with{'\n'}us live</Text>
                    </TouchableOpacity>
                </View>

                {/* Message form */}
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Send a message
                </Text>

                {submitted ? (
                    <View style={{
                        backgroundColor: '#F0FFF4',
                        borderRadius: 20,
                        padding: 28,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#B2F0C5',
                        marginBottom: 20,
                    }}>
                        <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginTop: 12, marginBottom: 6 }}>
                            Message sent!
                        </Text>
                        <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 }}>
                            Thanks for reaching out. We will get back to you within 24 hours at your registered email address.
                        </Text>
                        <TouchableOpacity
                            onPress={() => { setSubmitted(false); setMessage(''); setSelectedTopic(null); }}
                            style={{ marginTop: 16 }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FF7A00' }}>Send another message</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{
                        backgroundColor: '#fff',
                        borderRadius: 20,
                        padding: 18,
                        marginBottom: 20,
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 12,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: '#F0F0F0',
                    }}>
                        {/* Topic selector */}
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 10 }}>
                            What is this about?
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                            {topics.map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    onPress={() => setSelectedTopic(topic)}
                                    style={{
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        backgroundColor: selectedTopic === topic ? '#FF7A00' : '#FFF5EE',
                                        borderColor: selectedTopic === topic ? '#FF7A00' : '#FFD9BC',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: selectedTopic === topic ? '#fff' : '#FF7A00',
                                    }}>
                                        {topic}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Message input */}
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 }}>
                            Describe your issue
                        </Text>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Tell us what happened and we will help you out..."
                            placeholderTextColor="#BBB"
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            style={{
                                borderWidth: 1,
                                borderColor: message.length > 0 ? '#FF7A00' : '#F0F0F0',
                                borderRadius: 14,
                                padding: 14,
                                fontSize: 13,
                                color: '#1A1A1A',
                                lineHeight: 20,
                                minHeight: 110,
                                backgroundColor: '#FAFAFA',
                            }}
                        />
                        <Text style={{ fontSize: 11, color: '#BBB', marginTop: 6, textAlign: 'right' }}>
                            {message.length} characters
                        </Text>

                        {/* Send button */}
                        <TouchableOpacity
                            onPress={handleSend}
                            activeOpacity={0.9}
                            style={{
                                marginTop: 10,
                                height: 48,
                                borderRadius: 14,
                                backgroundColor: '#FF7A00',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'row',
                            }}
                        >
                            <Ionicons name="send-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Send Message</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Footer */}
                <View style={{ paddingTop: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: theme.subtext, textAlign: 'center', lineHeight: 18 }}>
                        For urgent issues, call us during support hours.{'\n'}Mon–Sat, 9:00 AM – 6:00 PM IST
                    </Text>
                </View>

            </ScrollView>
        </View>
    );
};