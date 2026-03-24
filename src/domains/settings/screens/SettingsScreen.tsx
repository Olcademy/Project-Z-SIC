import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../../../app.json';
import { useTheme } from '@/ui/context/ThemeContext';
import { useUser } from '@/ui/context/UserContext';
import { SettingsStackParamList } from '@/app/navigation/types';
import { ScreenHeader } from '@/ui/components/ScreenHeader';

type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsNavigationProp>();
    const theme = useTheme();
    const { user, logout } = useUser();

    const [isVegMode, setIsVegMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const appVersion = appConfig?.expo?.version || '1.0.0';

    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.border
    };

    const CardTitle = ({ title }: { title: string }) => (
        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 16 }}>
            {title}
        </Text>
    );

    const SettingItem = ({ icon, label, value, onPress, showArrow = true, color = theme.text, iconBg = theme.bg, hasBorder = true }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 14, 
                borderBottomWidth: hasBorder ? 1 : 0, 
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

    const goToAuth = async () => {
        await logout();
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            {/* Header with decorative circles */}
            <View style={{ paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: theme.headerCircleSettings || '#e0e7ff', opacity: 0.5 }} />
                <View style={{ position: 'absolute', left: -40, top: 40, width: 120, height: 120, borderRadius: 60, backgroundColor: theme.headerCircleSettings || '#e0e7ff', opacity: 0.4 }} />
                <ScreenHeader 
                    title="Settings" 
                    subtitle="Manage your preferences" 
                    showSearch={false}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                {/* Profile Section */}
                {user && !user.isGuest ? (
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.8}
                        style={cardStyle}
                    >
                        <CardTitle title="Profile" />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={[cardStyle, { alignItems: 'flex-start' }]}>
                        <CardTitle title="Profile" />
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 }}>Login to access your profile</Text>
                        <Text style={{ fontSize: 13, color: theme.subtext, marginBottom: 16 }}>Manage your preferences and sync data</Text>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={{ backgroundColor: '#02757A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                            onPress={goToAuth}
                        >
                            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Login / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Appearance Section */}
                <View style={cardStyle}>
                    <CardTitle title="Appearance" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 15, color: theme.text }}>Theme</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ fontSize: 13, color: '#9ca3af', marginRight: 8 }}>Light</Text>
                            <Switch 
                                value={false} 
                                onValueChange={() => {}} 
                                trackColor={{ false: '#e5e7eb', true: '#d1d5db' }}
                                thumbColor="#f9fafb"
                            />
                        </View>
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={cardStyle}>
                    <CardTitle title="Preferences" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <View style={cardStyle}>
                    <CardTitle title="Notifications" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                <View style={[cardStyle, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 2 }]}>
                    <CardTitle title="Location" />
                    <SettingItem icon="location-outline" label="Current Country" value={user?.location || 'India'} iconBg="#fff7ed" showArrow={true} hasBorder={false} />
                </View>

                {/* Support Section */}
                <View style={[cardStyle, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 2 }]}>
                    <CardTitle title="Help & Support" />
                    <SettingItem icon="help-circle-outline" label="Frequently Asked Questions" iconBg="#f5f3ff" />
                    <SettingItem icon="mail-outline" label="Contact Support" showArrow={false} iconBg="#ecfeff" />
                    <SettingItem icon="document-text-outline" label="Privacy Policy" iconBg="#fef2f2" hasBorder={false} />
                </View>

                {/* App Section */}
                <View style={cardStyle}>
                    <CardTitle title="App" />
                    <Text style={{ fontSize: 15, color: theme.text, marginBottom: 8, fontWeight: '500' }}>Version: {appVersion}</Text>
                    <Text style={{ fontSize: 14, color: theme.subtext }}>Strategic Information Center</Text>
                </View>

                {/* About Section */}
                <View style={[cardStyle, { marginBottom: 30 }]}>
                    <CardTitle title="About" />
                    <Text style={{ fontSize: 14, color: theme.subtext, lineHeight: 22 }}>
                        SIC helps you discover trusted restaurants, tiffin services, and local events.
                    </Text>
                </View>

                {/* Logout Button (Bottom Only) */}
                {user && !user.isGuest && (
                    <TouchableOpacity 
                        onPress={logout}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', borderRadius: 16, paddingVertical: 16, marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: '#fee2e2' }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                        <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700', marginLeft: 10 }}>Logout Account</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
};
