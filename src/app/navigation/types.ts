import type { NavigatorScreenParams } from '@react-navigation/native';

export type RestaurantsStackParamList = {
    RestaurantList: undefined;
    RestaurantDetail: { id: string };
};

export type TiffinStackParamList = {
    TiffinList: undefined;
    TiffinDetail: { id: string };
};

export type EventsStackParamList = {
    EventList: undefined;
    EventDetail: { id: string };
};

export type SettingsStackParamList = {
    Settings: undefined;
    EditProfile: undefined;
};

export type MainTabsParamList = {
    RestaurantsStack: NavigatorScreenParams<RestaurantsStackParamList>;
    TiffinStack: NavigatorScreenParams<TiffinStackParamList>;
    EventsStack: NavigatorScreenParams<EventsStackParamList>;
    SettingsStack: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
    Splash: undefined;
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
