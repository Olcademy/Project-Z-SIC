import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@/domains/splash/SplashScreen';
import {
    AuthLandingScreen,
    LoginScreen,
    SignupScreen,
    OtpScreen,
    OAuthWebViewScreen,
} from '@/domains/auth';
import { SearchScreen } from '@/domains/search/screens/SearchScreen';
import { NotFoundScreen } from '@/ui/components/NotFoundScreen';
import { TabsNavigator } from './TabsNavigator';
import { RootStackParamList } from './types';
import { useUser } from '@/ui/context/UserContext';
import { useAppDispatch } from '@/hooks/useAppStore';
import { setFeatureFlags } from '@/store/slices/uiSlice';
import { AppConfig } from '@/platform/config';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
    const { user, loading } = useUser();
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setFeatureFlags(AppConfig.FEATURE_FLAGS));
    }, [dispatch]);

    if (loading) {
        return <SplashScreen />;
    }

    return (
        <Stack.Navigator
            key={user ? 'app' : 'auth'}
            screenOptions={{ headerShown: false }}
        >
            {user ? (
                <>
                    <Stack.Screen name="MainTabs" component={TabsNavigator} />
                    <Stack.Screen name="Search" component={SearchScreen} />
                    <Stack.Screen name="NotFound" component={NotFoundScreen} />
                </>
            ) : (
                <>
                    <Stack.Screen name="AuthLanding" component={AuthLandingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Signup" component={SignupScreen} />
                    <Stack.Screen name="Otp" component={OtpScreen} />
                    <Stack.Screen name="OAuthWebView" component={OAuthWebViewScreen} />
                    <Stack.Screen name="NotFound" component={NotFoundScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};
