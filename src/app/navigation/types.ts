import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Restaurant } from '@/domains/restaurants/types';
import type { Tiffin } from '@/domains/tiffins/types';
import type { Event } from '@/domains/events/types';

export type RestaurantsStackParamList = {
    RestaurantList: undefined;
    RestaurantDetail: { item: Restaurant } | { id: string; item?: Restaurant };
    FavoriteRestaurants: undefined;
};

export type TiffinStackParamList = {
    TiffinList: undefined;
    TiffinDetail: { item: Tiffin } | { id: string; item?: Tiffin };
    FavoriteTiffins: undefined;
};

export type EventsStackParamList = {
    EventList: undefined;
    EventDetail: { item: Event } | { id: string; item?: Event };
};

export type SettingsStackParamList = {
    Settings: undefined;
    EditProfile: undefined;
    FAQ: undefined;
    ContactSupport: undefined;
    PrivacyPolicy: undefined;
};

export type MainTabsParamList = {
    RestaurantsStack: NavigatorScreenParams<RestaurantsStackParamList>;
    TiffinStack: NavigatorScreenParams<TiffinStackParamList>;
    EventsStack: NavigatorScreenParams<EventsStackParamList>;
    SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
    AuthLanding: undefined;
    Login: undefined;
    Signup: undefined;
    Otp: {
        email: string;
        password?: string;
        username?: string;
    };
    OAuthWebView: {
        provider: 'google' | 'facebook' | 'twitter';
        rememberMe?: boolean;
    };
    Search: undefined;
    NotFound: undefined;
    MainTabs: NavigatorScreenParams<MainTabsParamList> | undefined;
};
