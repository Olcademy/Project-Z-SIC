import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { useAppDispatch } from '@/hooks/useAppStore';
import { setFeatureFlags } from '@/store/slices/uiSlice';
import { getGuestSession, loginAsGuest } from '@/platform/auth/guest';
import { AppConfig } from '@/platform/config';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();
    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        const initialize = async () => {
            try {
                dispatch(setFeatureFlags(AppConfig.FEATURE_FLAGS));

                const guestSession = await getGuestSession();

                if (guestSession) {
                    try {
                        await loginAsGuest();
                        timeoutId = setTimeout(() => {
                            navigation.replace('MainTabs');
                        }, 1000);
                        return;
                    } catch (error) {
                        console.log('Guest auto-login failed, redirecting to auth');
                    }
                }

                timeoutId = setTimeout(() => {
                    navigation.replace('AuthLanding');
                }, 1500);
            } catch (error) {
                console.error('Initialization error:', error);
                timeoutId = setTimeout(() => {
                    navigation.replace('AuthLanding');
                }, 1500);
            } finally {
                setIsInitializing(false);
            }
        };

        initialize();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [dispatch, navigation]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to SIC</Text>
            <Text style={styles.subtitle}>Discovery Phase</Text>
            {isInitializing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#02757A" />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
    },
    loadingContainer: {
        marginTop: 20,
    },
});
