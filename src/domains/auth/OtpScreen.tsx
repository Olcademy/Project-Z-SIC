import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { apiClient } from '@/platform/api/client';
import { useAppSelector } from '@/hooks/useAppStore';

 type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export const OtpScreen: React.FC<Props> = ({ route, navigation }) => {
    const { email, password, username } = route.params;
    const theme = useAppSelector((state) => state.ui.theme);
    const isDark = theme === 'dark';

    const [otpArray, setOtpArray] = useState(Array(6).fill(''));
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [timer, setTimer] = useState(300);
    const [resendDisabled, setResendDisabled] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const otpRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (timer === 0) {
            setResendDisabled(false);
            return undefined;
        }

        const intervalId = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    setResendDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timer]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const next = [...otpArray];
        next[index] = value;
        setOtpArray(next);
        if (errorMessage) setErrorMessage(null);
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: any) => {
        if (e.nativeEvent.key === 'Backspace' && !otpArray[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const verifyOtp = async () => {
        const enteredOtp = otpArray.join('');
        if (enteredOtp.length !== 6) {
            setErrorMessage('Please enter the complete 6-digit OTP.');
            return;
        }

        setIsVerifying(true);
        setErrorMessage(null);
        try {
            await apiClient.post('/api/verify', {
                identifier: email.trim().toLowerCase(),
                otp: Number(enteredOtp),
                password,
                username,
            });

            let loggedIn = false;
            if (password) {
                try {
                    const loginResponse = await apiClient.post('/api/login', {
                        email: email.trim().toLowerCase(),
                        password,
                        rememberMe: true,
                    });
                    if (loginResponse.data?.success || loginResponse.data?.message === 'Login successful!') {
                        loggedIn = true;
                    }
                } catch {
                    loggedIn = false;
                }
            }

            if (loggedIn) {
                navigation.replace('MainTabs');
            } else {
                navigation.replace('Login');
            }
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.error || error?.response?.data?.message || 'Invalid OTP.');
        } finally {
            setIsVerifying(false);
        }
    };

    const resendOtp = async () => {
        if (resendDisabled) return;
        setIsResending(true);
        setErrorMessage(null);
        try {
            await apiClient.post('/api/send-email-otp', { email: email.trim().toLowerCase() });
            setTimer(300);
            setResendDisabled(true);
            setOtpArray(Array(6).fill(''));
            otpRefs.current[0]?.focus();
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.error || error?.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <View className="flex-1 bg-[#f2f6f6] dark:bg-slate-950">
            <View className="bg-[#e6f4f4] dark:bg-slate-900 px-6 pt-12 pb-8">
                <View className="absolute right-[-40px] top-[-30px] h-36 w-36 rounded-full bg-[#d6efef] dark:bg-slate-800" />
                <View className="absolute left-[-30px] bottom-[-30px] h-24 w-24 rounded-full bg-[#d6efef] dark:bg-slate-800" />
                <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100">Verify Email</Text>
                <Text className="text-sm text-gray-700 dark:text-slate-300 mt-2">
                    Enter the 6-digit code sent to <Text className="font-semibold">{email}</Text>.
                </Text>
            </View>

            <View className="px-6 -mt-6">
                <View
                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
                    style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }]}
                >

            {errorMessage ? (
                <Text className="text-sm text-red-600 mt-2 text-center">{errorMessage}</Text>
            ) : null}

            <View className="flex-row justify-between mt-8">
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
                className="bg-[#02757A] mt-8 px-5 py-4 rounded-2xl items-center"
                onPress={verifyOtp}
                disabled={isVerifying || otpArray.join('').length !== 6}
            >
                {isVerifying ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <Text className="text-white text-base font-semibold">Verify Account</Text>
                )}
            </TouchableOpacity>

            <View className="flex-row justify-center items-center mt-6">
                <Text className="text-sm text-gray-600 dark:text-slate-300">Didn't receive code?</Text>
                <TouchableOpacity onPress={resendOtp} disabled={resendDisabled || isResending}>
                    <Text className={`ml-2 text-sm font-semibold ${resendDisabled || isResending ? 'text-gray-400' : 'text-[#02757A]'}`}>
                        {isResending ? 'Sending...' : resendDisabled ? `Resend in ${formatTime(timer)}` : 'Resend Code'}
                    </Text>
                </TouchableOpacity>
            </View>
                </View>
            </View>
        </View>
    );
};
