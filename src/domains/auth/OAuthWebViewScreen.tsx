import React, { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { RootStackParamList } from '@/app/navigation/types';
import { AppConfig } from '@/platform/config'; // FIXED: API config

const PROVIDER_LABELS: Record<string, string> = {
    google: 'Google',
    facebook: 'Facebook',
    twitter: 'Twitter',
};

const APP_SCHEME = 'sic://';

type Props = NativeStackScreenProps<RootStackParamList, 'OAuthWebView'>;

export const OAuthWebViewScreen: React.FC<Props> = ({ route, navigation }) => {
    const { provider, rememberMe } = route.params;
    const [isLoading, setIsLoading] = useState(true);
    const [webError, setWebError] = useState('');
    const webViewRef = useRef<WebView | null>(null);

    const targetUrl = useMemo(() => {
        const param = rememberMe ? 'true' : 'false';
        return `${AppConfig.API_BASE_URL}/api/${provider}?rememberMe=${param}`; // FIXED: API config
    }, [provider, rememberMe]);

    const providerLabel = PROVIDER_LABELS[provider] || 'Account';

    const handleClose = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.replace('Login');
        }
    };

    const handleShouldStart = (request: any) => {
        const nextUrl = request?.url || '';
        if (nextUrl.startsWith(APP_SCHEME)) {
            handleClose();
            return false;
        }
        return true;
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f2f6f6] dark:bg-slate-950">
            <View className="bg-white dark:bg-slate-900 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={handleClose} className="mr-2 px-2 py-1">
                        <Text className="text-base text-gray-700 dark:text-slate-200">Back</Text>
                    </TouchableOpacity>
                    <Text className="text-base font-semibold text-gray-900 dark:text-slate-100">Continue with {providerLabel}</Text>
                </View>
            </View>

            {webError ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-center text-red-600">{webError}</Text>
                </View>
            ) : (
                <View className="flex-1">
                    {isLoading ? (
                        <View className="absolute top-0 left-0 right-0 h-1 items-center justify-center z-10">
                            <ActivityIndicator size="small" color="#02757A" />
                        </View>
                    ) : null}
                    <WebView
                        ref={webViewRef}
                        source={{ uri: targetUrl }}
                        onLoadStart={() => {
                            setIsLoading(true);
                            setWebError('');
                        }}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={(syntheticEvent: WebViewErrorEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            setWebError(nativeEvent.description || 'Unable to load login page.');
                        }}
                        onShouldStartLoadWithRequest={handleShouldStart}
                        javaScriptEnabled
                        domStorageEnabled
                    />
                </View>
            )}
        </SafeAreaView>
    );
};
