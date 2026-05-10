import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../../../app.json';
import { useTheme } from '@/ui/context/ThemeContext';
import { useUser } from '@/ui/context/UserContext';
import { SettingsStackParamList } from '@/app/navigation/types';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { storage } from '@/services/storage/localStorage';

type SettingsNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

export const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<SettingsNavigationProp>();
    const theme = useTheme();
    const { user, logout } = useUser();

    const [isVegMode, setIsVegMode] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const appVersion = appConfig?.expo?.version || '1.0.0';

    useEffect(() => {
        const load = async () => {
            const saved = await storage.getVegOnlyMode();
            setIsVegMode(saved);
        };
        void load();
    }, []);

    const handleVegModeChange = (next: boolean) => {
        setIsVegMode(next);
        void storage.setVegOnlyMode(next);
    };

    const cardStyle = {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F0F0F0'
    };

    const CardTitle = ({ title }: { title: string }) => (
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 }}>
            {title}
        </Text>
    );

    const SettingItem = ({ icon, label, value, onPress, showArrow = true, color = '#1A1A1A', iconBg = '#FFF5F0', hasBorder = true }: any) => (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.7}
            style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 14, 
                borderBottomWidth: hasBorder ? 1 : 0, 
                borderBottomColor: '#F5F5F5',
            }}
        >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={20} color="#FF7F50" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color }}>{label}</Text>
                {value && <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{value}</Text>}
            </View>
            {showArrow && <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            {/* Header */}
            <View style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 }}>
                <ScreenHeader 
                    title="Settings" 
                    subtitle="Manage your preferences" 
                    showSearch={false}
                />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
                {/* Profile Section */}
                {user && !user.isGuest ? (
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('EditProfile')}
                        activeOpacity={0.8}
                        style={cardStyle}
                    >
                        <CardTitle title="Profile" />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1.5, borderColor: '#FF7F50' }}>
                                <Image 
                                    source={{ uri: user.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ganesh' }} 
                                    style={{ width: '100%', height: '100%' }} 
                                />
                            </View>
                            <View style={{ marginLeft: 16, flex: 1, justifyContent: 'center' }}>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1A1A' }}>{user.name}</Text>
                                <Text style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{user.email}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View style={[cardStyle, { alignItems: 'flex-start' }]}>
                        <CardTitle title="Profile" />
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 }}>Login to access your profile</Text>
                        <Text style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Manage your preferences and sync data</Text>
                        <TouchableOpacity 
                            activeOpacity={0.8}
                            style={{ backgroundColor: '#FF7F50', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, width: '100%', alignItems: 'center' }}
                            onPress={logout}
                        >
                            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Login / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Preferences Section */}
                <View style={cardStyle}>
                    <CardTitle title="Preferences" />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="leaf-outline" size={18} color="#FF7F50" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>Veg Only Mode</Text>
                        </View>
                        <Switch 
                            value={isVegMode} 
                            onValueChange={handleVegModeChange} 
                            trackColor={{ false: '#EEEEEE', true: '#FF7F50' }}
                            thumbColor="#fff"
                        />
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#FFF5F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                                <Ionicons name="notifications-outline" size={18} color="#FF7F50" />
                            </View>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>Notifications</Text>
                        </View>
                        <Switch 
                            value={notificationsEnabled} 
                            onValueChange={setNotificationsEnabled} 
                            trackColor={{ false: '#EEEEEE', true: '#FF7F50' }}
                            thumbColor="#fff"
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View style={[cardStyle, { paddingBottom: 6 }]}>
                    <CardTitle title="Help & Support" />
                    <SettingItem icon="help-circle-outline" label="FAQ" value="Find answers to common questions" iconBg="#FFF5F0" onPress={() => navigation.navigate('FAQ')} />
                    <SettingItem icon="mail-outline" label="Contact Support" value="Get help with orders, payments, or account" iconBg="#FFF5F0" onPress={() => navigation.navigate('ContactSupport')} />
                    <SettingItem icon="document-text-outline" label="Privacy Policy" value="Learn how your data is used and protected" iconBg="#FFF5F0" hasBorder={false} onPress={() => navigation.navigate('PrivacyPolicy')} />
                </View>

                {/* Logout Button */}
                {user && !user.isGuest && (
                    <TouchableOpacity 
                        onPress={logout}
                        activeOpacity={0.7}
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F0', borderRadius: 20, paddingVertical: 18, marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: '#FF7F50' }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="#FF7F50" />
                        <Text style={{ color: '#FF7F50', fontSize: 16, fontWeight: '800', marginLeft: 10 }}>Logout Account</Text>
                    </TouchableOpacity>
                )}

                <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text style={{ fontSize: 12, color: '#999', fontWeight: '500' }}>Version: {appVersion}</Text>
                    <Text style={{ fontSize: 12, color: '#BBB', marginTop: 4 }}>Strategic Information Center</Text>
                </View>
            </ScrollView>
        </View>
    );
};
