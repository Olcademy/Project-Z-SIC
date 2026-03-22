import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';
import { apiClient } from '@/platform/api/client';
import { useAppSelector } from '@/hooks/useAppStore';

 type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

 type SignupForm = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    accept: boolean;
};

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
    const theme = useAppSelector((state) => state.ui.theme);
    const isDark = theme === 'dark';
    const placeholderTextColor = isDark ? '#94A3B8' : '#6B7280';

    const [form, setForm] = useState<SignupForm>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        accept: false,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleChange = (key: keyof SignupForm, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errorMessage) setErrorMessage(null);
    };

    const handleSignup = async () => {
        const email = form.email.trim().toLowerCase();
        if (!form.username.trim() || !email || !form.password || !form.confirmPassword) {
            setErrorMessage('Please fill all required fields.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        if (!form.accept) {
            setErrorMessage('Please accept the terms and conditions.');
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.post('/api/signup', {
                username: form.username.trim(),
                email,
                password: form.password,
            });

            if (response.data?.success === false) {
                setErrorMessage(response.data?.message || 'Signup failed.');
                return;
            }

            navigation.navigate('Otp', {
                email,
                password: form.password,
                username: form.username.trim(),
            });
        } catch (error: any) {
            setErrorMessage(error?.response?.data?.message || 'Signup failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#f2f6f6] dark:bg-slate-950">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
                <View className="bg-[#f5efe8] dark:bg-slate-900 px-6 pt-12 pb-8">
                    <View className="absolute right-[-40px] top-[-30px] h-36 w-36 rounded-full bg-[#efe6db] dark:bg-slate-800" />
                    <View className="absolute left-[-30px] bottom-[-30px] h-24 w-24 rounded-full bg-[#efe6db] dark:bg-slate-800" />
                    <Text className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create account</Text>
                    <Text className="text-sm text-gray-700 dark:text-slate-300 mt-2">Join SIC and personalize your discovery.</Text>
                </View>

                <View className="px-6 -mt-6">
                    <View
                        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
                        style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 }]}
                    >
                    {errorMessage ? (
                        <Text className="text-sm text-red-600 mt-2 text-center">{errorMessage}</Text>
                    ) : null}

                    <View className="mt-4">
                        <Text className="text-sm text-gray-700 dark:text-slate-300 mb-2">Username</Text>
                        <TextInput
                            className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                            placeholder="Your name"
                            placeholderTextColor={placeholderTextColor}
                            value={form.username}
                            onChangeText={(value) => handleChange('username', value)}
                        />

                        <Text className="text-sm text-gray-700 dark:text-slate-300 mt-5 mb-2">Email</Text>
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

                        <Text className="text-sm text-gray-700 dark:text-slate-300 mt-5 mb-2">Confirm Password</Text>
                        <TextInput
                            className="border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-2xl px-4 py-3 text-base text-gray-900 dark:text-slate-100"
                            placeholder="Confirm password"
                            placeholderTextColor={placeholderTextColor}
                            secureTextEntry
                            value={form.confirmPassword}
                            onChangeText={(value) => handleChange('confirmPassword', value)}
                        />

                        <TouchableOpacity
                            className="mt-4 flex-row items-center"
                            onPress={() => handleChange('accept', !form.accept)}
                            activeOpacity={0.8}
                        >
                            <View
                                className={`h-5 w-5 rounded border ${form.accept ? 'bg-[#02757A] border-[#02757A]' : 'border-gray-300 dark:border-slate-600'}`}
                            />
                            <Text className="ml-3 text-sm text-gray-700 dark:text-slate-300">I accept the terms and conditions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-[#02757A] mt-6 px-5 py-4 rounded-2xl"
                            onPress={handleSignup}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white text-base font-semibold text-center">Create Account</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4"
                            onPress={() => navigation.replace('Login')}
                        >
                            <Text className="text-sm text-gray-700 dark:text-slate-300 text-center">
                                Already have an account? <Text className="text-[#02757A] font-semibold">Login</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
