import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EventDetailScreen } from '@/domains/events/screens/EventDetailScreen';
import { EventListScreen } from '@/domains/events/screens/EventListScreen';
import { RestaurantDetailScreen } from '@/domains/restaurants/screens/RestaurantDetailScreen';
import { RestaurantListScreen } from '@/domains/restaurants/screens/RestaurantListScreen';
import { FavoriteRestaurantsScreen } from '@/domains/restaurants/screens/FavoriteRestaurantsScreen';
import { SettingsScreen } from '@/domains/settings/screens/SettingsScreen';
import { TiffinDetailScreen } from '@/domains/tiffins/screens/TiffinDetailScreen';
import { TiffinListScreen } from '@/domains/tiffins/screens/TiffinListScreen';
import { FavoriteTiffinsScreen } from '@/domains/tiffins/screens/FavoriteTiffinsScreen';
import { EditProfileScreen } from '@/domains/settings/screens/EditProfileScreen';
import { FaqScreen } from '@/domains/settings/screens/FaqScreen';
import { ContactSupportScreen } from '@/domains/settings/screens/ContactSupportScreen';
import { PrivacyPolicyScreen } from '@/domains/settings/screens/PrivacyPolicyScreen';
import { Ionicons } from '@expo/vector-icons';
import type {
    EventsStackParamList,
    MainTabsParamList,
    RestaurantsStackParamList,
    SettingsStackParamList,
    TiffinStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabsParamList>();
const RestaurantsStack = createNativeStackNavigator<RestaurantsStackParamList>();
const TiffinStack = createNativeStackNavigator<TiffinStackParamList>();
const EventsStack = createNativeStackNavigator<EventsStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const RESTAURANTS_ACTIVE_ICON = '#FF7A00';
const TIFFIN_ACTIVE_ICON = '#FF7A00';

const RestaurantsStackNavigator = () => (
    <RestaurantsStack.Navigator screenOptions={{ headerShown: false }}>
        <RestaurantsStack.Screen name="RestaurantList" component={RestaurantListScreen} />
        <RestaurantsStack.Screen name="FavoriteRestaurants" component={FavoriteRestaurantsScreen} />
        <RestaurantsStack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
    </RestaurantsStack.Navigator>
);

const TiffinStackNavigator = () => (
    <TiffinStack.Navigator screenOptions={{ headerShown: false }}>
        <TiffinStack.Screen name="TiffinList" component={TiffinListScreen} />
        <TiffinStack.Screen name="FavoriteTiffins" component={FavoriteTiffinsScreen} />
        <TiffinStack.Screen name="TiffinDetail" component={TiffinDetailScreen} />
    </TiffinStack.Navigator>
);

const EventsStackNavigator = () => (
    <EventsStack.Navigator screenOptions={{ headerShown: false }}>
        <EventsStack.Screen name="EventList" component={EventListScreen} />
        <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
    </EventsStack.Navigator>
);

const SettingsStackNavigator = () => (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
        <SettingsStack.Screen name="Settings" component={SettingsScreen} />
        <SettingsStack.Screen name="EditProfile" component={EditProfileScreen} />
        <SettingsStack.Screen name="FAQ" component={FaqScreen} />
        <SettingsStack.Screen name="ContactSupport" component={ContactSupportScreen} />
        <SettingsStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </SettingsStack.Navigator>
);

export const TabsNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopColor: '#f3f4f6',
                    borderTopWidth: 1,
                    height: 100,
                    paddingBottom: 40,
                    paddingTop: 12,
                },
                tabBarActiveTintColor: '#FF7A00',
                tabBarInactiveTintColor: '#6b7280',
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
                        RestaurantsStack: { active: 'restaurant', inactive: 'restaurant-outline' },
                        TiffinStack: { active: 'fast-food', inactive: 'fast-food-outline' },
                        EventsStack: { active: 'calendar', inactive: 'calendar-outline' },
                        SettingsStack: { active: 'settings', inactive: 'settings-outline' },
                    };
                    const icon = icons[route.name];
                    return <Ionicons name={focused ? icon.active : icon.inactive} size={22} color={color} />;
                },
            })}
        >
            <Tab.Screen name="RestaurantsStack" component={RestaurantsStackNavigator} options={{ title: 'Restaurants' }} />
            <Tab.Screen name="TiffinStack" component={TiffinStackNavigator} options={{ title: 'Tiffin' }} />
            <Tab.Screen name="EventsStack" component={EventsStackNavigator} options={{ title: 'Events' }} />
            <Tab.Screen name="SettingsStack" component={SettingsStackNavigator} options={{ title: 'Settings' }} />
        </Tab.Navigator>
    );
};
