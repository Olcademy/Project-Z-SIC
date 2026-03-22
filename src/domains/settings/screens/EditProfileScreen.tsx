import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/ui/context/UserContext';
import { useTheme } from '@/ui/context/ThemeContext';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import * as ImagePicker from 'expo-image-picker';

const COUNTRY_CODES = [
    { code: '+91', label: '🇮🇳 India', flag: '🇮🇳' },
    { code: '+977', label: '🇳🇵 Nepal', flag: '🇳🇵' },
    { code: '+1', label: '🇺🇸 USA', flag: '🇺🇸' },
];

export const EditProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    const theme = useTheme();
    const { user, loading, updateProfile } = useUser();

    const [name, setName] = useState(user?.name || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [saving, setSaving] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Split phone into code and number
    const safePhone = user?.phone || '';
    const initialCode = COUNTRY_CODES.find(c => safePhone.startsWith(c.code))?.code || '+91';
    const initialNumber = safePhone.replace(initialCode, '').trim();

    const [countryCode, setCountryCode] = useState(initialCode);
    const [phoneNumber, setPhoneNumber] = useState(initialNumber);
    const [showDropdown, setShowDropdown] = useState(false);

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#02757A" />
            </View>
        );
    }

    useEffect(() => {
        if (user) {
            setName(user.name);
            setPhotoURL(user.photoURL || '');
            const phoneStr = user.phone || '';
            const code = COUNTRY_CODES.find(c => phoneStr.startsWith(c.code))?.code || '+91';
            setCountryCode(code);
            setPhoneNumber(phoneStr.replace(code, '').trim());
        }
    }, [user]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setPhotoURL(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        if (phoneNumber.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number (min 10 digits)');
            return;
        }

        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const fullPhone = `${countryCode} ${phoneNumber}`.trim();
            await updateProfile({ 
                name, 
                phone: fullPhone, 
                photoURL: photoURL || undefined,
                location: countryCode === '+91' ? 'India' : (countryCode === '+977' ? 'Nepal' : 'USA')
            } as any);
            
            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: theme.bg }}
        >
            <View style={{ backgroundColor: theme.headerBgSettings, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -20, top: -10, width: 80, height: 80, borderRadius: 40, backgroundColor: theme.headerCircleSettings, opacity: 0.5 }} />
                <ScreenHeader 
                    title="Edit Profile" 
                    subtitle="Customize your public information" 
                    showSearch={false}
                    onBack={() => navigation.goBack()}
                    compact
                />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Avatar Section */}
                <View style={{ alignItems: 'center', marginBottom: 20, marginTop: 4 }}>
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={pickImage}
                        style={{ 
                            width: 76, 
                            height: 76, 
                            borderRadius: 38, 
                            backgroundColor: '#fff',
                            justifyContent: 'center',
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <View style={{ width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden', backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
                            {photoURL ? (
                                <Image source={{ uri: photoURL }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Ionicons name="person" size={36} color={theme.subtext} />
                            )}
                        </View>
                        <View style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            backgroundColor: '#02757A',
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 2,
                            borderColor: '#fff',
                            shadowColor: '#000',
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 3
                        }}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '600', color: '#02757A' }}>Change Profile Photo</Text>
                </View>

                {/* Name field */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: focusedField === 'name' ? '#02757A' : theme.text, marginBottom: 8, marginLeft: 4 }}>FULL NAME</Text>
                    <TextInput
                        style={{
                            backgroundColor: theme.card,
                            borderRadius: 16,
                            padding: 16,
                            fontSize: 15,
                            color: theme.text,
                            borderWidth: 1.5,
                            borderColor: focusedField === 'name' ? '#02757A' : theme.border,
                        }}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. John Doe"
                        placeholderTextColor={theme.subtext}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                {/* Phone number field with country code */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: focusedField === 'phone' ? '#02757A' : theme.text, marginBottom: 8, marginLeft: 4 }}>PHONE NUMBER</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {/* Country Code Dropdown Trigger */}
                        <TouchableOpacity 
                            onPress={() => setShowDropdown(!showDropdown)}
                            style={{
                                width: 90,
                                backgroundColor: theme.card,
                                borderRadius: 16,
                                padding: 16,
                                borderWidth: 1.5,
                                borderColor: showDropdown ? '#02757A' : theme.border,
                                marginRight: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <Text style={{ fontSize: 15, color: theme.text, fontWeight: '600' }}>{countryCode}</Text>
                            <Ionicons name="chevron-down" size={14} color={theme.subtext} />
                        </TouchableOpacity>

                        {/* Phone number input */}
                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: theme.card,
                                borderRadius: 16,
                                padding: 16,
                                fontSize: 15,
                                color: theme.text,
                                borderWidth: 1.5,
                                borderColor: focusedField === 'phone' ? '#02757A' : theme.border,
                            }}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            placeholder="9876543210"
                            placeholderTextColor={theme.subtext}
                            keyboardType="phone-pad"
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    {/* Minimal Dropdown Menu */}
                    {showDropdown && (
                        <View style={{
                            marginTop: 8,
                            backgroundColor: theme.card,
                            borderRadius: 16,
                            borderWidth: 1.5,
                            borderColor: theme.border,
                            padding: 8,
                            shadowColor: '#000',
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 5,
                            zIndex: 1000
                        }}>
                            {COUNTRY_CODES.map((item) => (
                                <TouchableOpacity 
                                    key={item.code}
                                    onPress={() => {
                                        setCountryCode(item.code);
                                        setShowDropdown(false);
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        padding: 12,
                                        borderRadius: 10,
                                        backgroundColor: countryCode === item.code ? '#e0f2f1' : 'transparent'
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>{item.label} ({item.code})</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Email field (read-only) */}
                <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 8, marginLeft: 4 }}>EMAIL ADDRESS</Text>
                    <TextInput
                        style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: 16,
                            padding: 16,
                            fontSize: 15,
                            color: theme.subtext,
                            borderWidth: 1.5,
                            borderColor: '#e5e7eb',
                        }}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 6, marginLeft: 4 }}>This field is linked to your account and cannot be edited.</Text>
                </View>

                {/* Save button */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                        marginTop: 8,
                        marginBottom: 12,
                        height: 48,
                        backgroundColor: '#02757A',
                        borderRadius: 12,
                        paddingHorizontal: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        shadowColor: '#02757A',
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 4,
                        opacity: saving ? 0.7 : 1
                    }}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={{ marginTop: 20, alignItems: 'center', padding: 10 }}
                >
                    <Text style={{ color: theme.subtext, fontWeight: '600', fontSize: 14 }}>Discard Changes</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};
