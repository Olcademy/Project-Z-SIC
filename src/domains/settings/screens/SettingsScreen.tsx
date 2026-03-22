import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../../../app.json';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { useTheme } from '@/ui/context/ThemeContext';
import { useUser } from '@/ui/context/UserContext';
import { SettingsStackParamList } from '@/app/navigation/types';

type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsNavigationProp>();
    const theme = useTheme();
    const { user, login, logout } = useUser();
    const { data: featureFlags } = useFeatureFlags();

    const [isVegMode, setIsVegMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const appVersion = appConfig?.expo?.version || '1.0.0';
    const flagEntries = useMemo(() => Object.entries(featureFlags || {}), [featureFlags]);

    const SectionHeader = ({ title }: { title: string }) => (
        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4, letterSpacing: 1 }}>
            {title}
        </Text>
    );

    const SettingItem = ({ icon, label, value, onPress, showArrow = true, color = theme.text, iconBg = theme.bg }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 14, 
                borderBottomWidth: 1, 
                borderBottomColor: theme.border,
            }}
        >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={20} color={color === theme.text ? '#02757A' : color} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color }}>{label}</Text>
                {value && <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 1 }}>{value}</Text>}
            </View>
            {showArrow && <Ionicons name="chevron-forward" size={18} color={theme.subtext} />}
        </TouchableOpacity>
    );

    const mockLogin = () => {
        login({
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+91 9876543210',
            location: 'India',
            photoURL: 'https://ui-avatars.com/api/?name=John+Doe&background=02757A&color=fff'
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Minimal Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
                <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text }}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                {/* Profile Section */}
                <SectionHeader title="Profile" />
                <View style={{ marginBottom: 30 }}>
                    {user && !user.isGuest ? (
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('EditProfile')}
                            activeOpacity={0.8}
                            style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                backgroundColor: '#fff', 
                                padding: 16, 
                                borderRadius: 16,
                                shadowColor: '#000',
                                shadowOpacity: 0.05,
                                shadowRadius: 10,
                                elevation: 2,
                                borderWidth: 1,
                                borderColor: theme.border
                            }}
                        >
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: theme.border }}>
                                {user.photoURL ? (
                                    <Image source={{ uri: user.photoURL }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                                ) : (
                                    <Ionicons name="person" size={20} color="#d1d5db" />
                                )}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{user.name}</Text>
                                <Text style={{ fontSize: 13, color: theme.subtext, marginTop: 2 }}>{user.email}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ 
                            backgroundColor: '#fff', 
                            padding: 20, 
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: theme.border,
                            alignItems: 'flex-start'
                        }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 }}>Login to access your profile</Text>
                            <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 16 }}>Manage your preferences and sync data</Text>
                            <TouchableOpacity 
                                activeOpacity={0.8}
                                style={{ backgroundColor: '#02757A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                                onPress={mockLogin}
                            >
                                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Login / Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Preferences Section */}
                <SectionHeader title="Preferences" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="leaf-outline" size={18} color="#16a34a" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Veg Only Mode</Text>
                        </View>
                        <Switch 
                            value={isVegMode} 
                            onValueChange={setIsVegMode} 
                            trackColor={{ false: '#e2e8f0', true: '#16a34a' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Notifications Section */}
                <SectionHeader title="Notifications" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#f0f4ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="notifications-outline" size={18} color="#02757A" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>Push Notifications</Text>
                        </View>
                        <Switch 
                            value={notificationsEnabled} 
                            onValueChange={setNotificationsEnabled} 
                            trackColor={{ false: '#e2e8f0', true: '#02757A' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Location Section */}
                <SectionHeader title="Location" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                    <SettingItem icon="location-outline" label="Current Country" value={user?.location || 'India'} iconBg="#fff7ed" showArrow={true} />
                </View>

                {/* Support Section */}
                <SectionHeader title="Help & Support" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                    <SettingItem icon="help-circle-outline" label="Frequently Asked Questions" iconBg="#f5f3ff" />
                    <SettingItem icon="mail-outline" label="Contact Support" showArrow={false} iconBg="#ecfeff" />
                    <SettingItem icon="document-text-outline" label="Privacy Policy" iconBg="#fef2f2" />
                </View>

                {/* About Section */}
                <SectionHeader title="About" />
                <View style={{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: theme.border }}>
                    <SettingItem icon="information-circle-outline" label="App Version" value={appVersion} showArrow={false} iconBg="#eff6ff" />
                </View>

                {user && !user.isGuest && (
                    <TouchableOpacity 
                        onPress={logout}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 10 }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700', marginLeft: 12 }}>Logout Account</Text>
                    </TouchableOpacity>
                )}

                {/* Feature Flags (Debug) */}
                {flagEntries.length > 0 && (
                    <View style={{ marginTop: 24, opacity: 0.5 }}>
                        <SectionHeader title="Developer Options" />
                        {flagEntries.map(([key, value]) => (
                            <View key={key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <Text style={{ fontSize: 12, color: theme.subtext }}>{key}</Text>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: value ? '#16a34a' : theme.subtext }}>{value ? 'ON' : 'OFF'}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
