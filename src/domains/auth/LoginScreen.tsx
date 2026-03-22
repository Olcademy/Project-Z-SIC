import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { apiClient } from '@/platform/api/client';
import { ErrorState } from '@/ui/components/ErrorState';
import { useAppSelector } from '@/hooks/useAppStore';
import { useUser } from '@/ui/context/UserContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginForm = {
    email: string;
    password: string;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const { login } = useUser();
    const theme = useAppSelector((state) => state.ui.theme);
    const isDark = theme === 'dark';
    const placeholderTextColor = isDark ? '#94A3B8' : '#6B7280';

    const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [showReset, setShowReset] = useState(false);
    const [otpArray, setOtpArray] = useState(Array(6).fill(''));
    const [otpError, setOtpError] = useState<string | null>(null);
    const [timer, setTimer] = useState(60);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const otpRefs = useRef<Array<TextInput | null>>([]);

    const handleChange = (key: keyof LoginForm, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errorMessage) setErrorMessage(null);
        if (otpError) setOtpError(null);
    };

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (showReset && timer > 0) {
            intervalId = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        setResendDisabled(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [showReset, timer]);

    const handleLogin = async () => {
        if (!form.email || !form.password) {
            setErrorMessage('Please enter both email and password.');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.post('/api/login', {
                email: form.email.trim().toLowerCase(),
                password: form.password,
                rememberMe,
            });

            if (response.data?.success || response.data?.message === 'Login successful!') {
                const derivedName = form.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
                const userData = response.data.user || {
                    name: derivedName,
                    email: form.email,
                    phone: '',
                    location: 'India'
                };
                
                // Fallback if backend user object is missing a name
                if (!userData.name || userData.name.trim() === '') {
                    userData.name = derivedName;
                }

                await login(userData);
                navigation.replace('MainTabs');
                return;
            }

            setErrorMessage(response.data?.message || 'Login failed.');
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message || 'Login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!form.email.trim()) {
            setErrorMessage('Please enter your email to reset password.');
            return;
        }

        setOtpLoading(true);
        setErrorMessage(null);
        try {
            await apiClient.post('/api/send-email-otp', { email: form.email.trim().toLowerCase() });
            setShowReset(true);
            setTimer(60);
            setResendDisabled(true);
            setOtpArray(Array(6).fill(''));
            setIsOtpVerified(false);
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message || 'Failed to send OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const next = [...otpArray];
        next[index] = value;
        setOtpArray(next);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
        if (otpError) setOtpError(null);
    };

    const handleOtpKeyDown = (index: number, e: any) => {
        if (e.nativeEvent.key === 'Backspace' && !otpArray[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const resendOtp = async () => {
        if (resendDisabled) return;
        setOtpLoading(true);
        try {
            await apiClient.post('/api/send-email-otp', { email: form.email.trim().toLowerCase() });
            setTimer(60);
            setResendDisabled(true);
            setOtpArray(Array(6).fill(''));
        } catch (error: any) {
            setOtpError(error?.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOtp = async () => {
        const enteredOtp = otpArray.join('');
        if (enteredOtp.length !== 6) {
            setOtpError('Please enter the complete 6-digit OTP.');
            return;
        }
        setOtpLoading(true);
        setOtpError(null);
        try {
            const response = await apiClient.post('/api/verify-otp', {
                email: form.email.trim().toLowerCase(),
                otp: enteredOtp,
            });
            if (response.data?.success) {
                setIsOtpVerified(true);
            } else {
                setOtpError(response.data?.message || 'Invalid OTP.');
            }
        } catch (error: any) {
            setOtpError(error?.response?.data?.message || 'Verification failed.');
        } finally {
            setOtpLoading(false);
        }
    };

    const resetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            setErrorMessage('Please enter and confirm your new password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        setResetLoading(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.post('/api/reset-password', {
                email: form.email.trim().toLowerCase(),
                newPassword,
            });
            if (response.data?.success) {
                setShowReset(false);
                setIsOtpVerified(false);
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setErrorMessage(response.data?.message || 'Password reset failed.');
            }
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message || 'Password reset failed.');
        } finally {
            setResetLoading(false);
        }
    };

    const launchOAuthFlow = (provider: 'google' | 'facebook' | 'twitter') => {
        navigation.navigate('OAuthWebView', { provider, rememberMe });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f2f6f6] dark:bg-slate-950">
            <View className="bg-[#e6f4f4] dark:bg-slate-900 px-6 pt-12 pb-8">
                <View className="absolute right-[-40px] top-[-30px] h-36 w-36 rounded-full bg-[#d6efef] dark:bg-slate-800" />
                <View className="absolute left-[-30px] bottom-[-30px] h-24 w-24 rounded-full bg-[#d6efef] dark:bg-slate-800" />
                <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100">Welcome back</Text>
                <Text className="text-sm text-gray-700 dark:text-slate-300 mt-2">Sign in to continue your discovery journey.</Text>
            </View>

            <View className="px-6 -mt-6">
                <View
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
                    style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }]}
                >
                    <Text className="text-sm text-gray-700 dark:text-slate-300 mb-2">Email</Text>
                    <TextInput
                        className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                        placeholder="you@example.com"
                        placeholderTextColor={placeholderTextColor}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={form.email}
                        onChangeText={(value) => handleChange('email', value)}
                    />

                    <Text className="text-sm text-gray-700 dark:text-slate-300 mt-5 mb-2">Password</Text>
                    <TextInput
                        className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                        placeholder="Password"
                        placeholderTextColor={placeholderTextColor}
                        secureTextEntry
                        value={form.password}
                        onChangeText={(value) => handleChange('password', value)}
                    />

                    <View className="flex-row items-center justify-between mt-4">
                        <TouchableOpacity
                            className="flex-row items-center"
                            onPress={() => setRememberMe((prev) => !prev)}
                        >
                            <View
                                className={`h-5 w-5 rounded border ${rememberMe ? 'bg-[#02757A] border-[#02757A]' : 'border-gray-300 dark:border-slate-600'}`}
                            />
                            <Text className="ml-2 text-sm text-gray-700 dark:text-slate-300">Remember me</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleForgotPassword} disabled={otpLoading}>
                            <Text className="text-sm text-[#02757A] font-semibold">Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className="bg-[#02757A] mt-6 px-5 py-4 rounded-2xl"
                        onPress={handleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white text-base font-semibold text-center">Login</Text>
                        )}
                    </TouchableOpacity>

                    {errorMessage ? <ErrorState message={errorMessage} /> : null}

                    <View className="mt-6">
                        <Text className="text-xs text-gray-500 dark:text-slate-400 text-center">Or continue with</Text>
                        <View className="flex-row justify-center mt-3">
                            <TouchableOpacity
                                className="border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full mr-3"
                                onPress={() => launchOAuthFlow('google')}
                            >
                                <Text className="text-sm text-gray-700 dark:text-slate-200">Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full mr-3"
                                onPress={() => launchOAuthFlow('facebook')}
                            >
                                <Text className="text-sm text-gray-700 dark:text-slate-200">Facebook</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="border border-gray-200 dark:border-slate-700 px-4 py-2 rounded-full"
                                onPress={() => launchOAuthFlow('twitter')}
                            >
                                <Text className="text-sm text-gray-700 dark:text-slate-200">Twitter</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity className="mt-6" onPress={() => navigation.navigate('Signup')}>
                        <Text className="text-sm text-gray-700 dark:text-slate-300 text-center">
                            New here? <Text className="text-[#02757A] font-semibold">Create an account</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {showReset ? (
                <View className="px-6 pb-8 mt-6">
                    <View
                        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
                        style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }]}
                    >
                    <Text className="text-lg font-semibold text-gray-900 dark:text-slate-100">Reset Password</Text>
                    <Text className="text-sm text-gray-600 dark:text-slate-300 mt-2">Enter the OTP sent to your email.</Text>

                    {otpError ? <Text className="text-sm text-red-600 mt-3 text-center">{otpError}</Text> : null}

                    <View className="flex-row justify-between mt-5">
                        {otpArray.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(el) => {
                                    otpRefs.current[index] = el;
                                }}
                                className="w-11 h-12 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl text-center text-lg text-gray-900 dark:text-slate-100"
                                keyboardType="numeric"
                                maxLength={1}
                                value={digit}
                                onChangeText={(text) => handleOtpChange(index, text)}
                                onKeyPress={(e) => handleOtpKeyDown(index, e)}
                                autoFocus={index === 0}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        className="bg-[#02757A] mt-6 px-5 py-4 rounded-2xl items-center"
                        onPress={verifyOtp}
                        disabled={otpLoading || otpArray.join('').length !== 6}
                    >
                        {otpLoading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white text-base font-semibold">Verify OTP</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity className="mt-3" onPress={resendOtp} disabled={resendDisabled || otpLoading}>
                        <Text className={`text-sm text-center ${resendDisabled || otpLoading ? 'text-gray-400' : 'text-[#02757A]'}`}>
                            {resendDisabled ? `Resend in ${timer}s` : 'Resend OTP'}
                        </Text>
                    </TouchableOpacity>

                    {isOtpVerified ? (
                        <View className="mt-6">
                            <Text className="text-sm text-gray-700 dark:text-slate-300 mb-2">New Password</Text>
                            <TextInput
                                className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                                placeholder="New password"
                                placeholderTextColor={placeholderTextColor}
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />

                            <Text className="text-sm text-gray-700 dark:text-slate-300 mt-5 mb-2">Confirm Password</Text>
                            <TextInput
                                className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                                placeholder="Confirm password"
                                placeholderTextColor={placeholderTextColor}
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />

                            <TouchableOpacity
                                className="bg-[#02757A] mt-6 px-5 py-4 rounded-2xl items-center"
                                onPress={resetPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? (
                                    <ActivityIndicator color="#ffffff" />
                                ) : (
                                    <Text className="text-white text-base font-semibold">Update Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : null}
                    </View>
                </View>
            ) : null}
        </SafeAreaView>
    );
};
