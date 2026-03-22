import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NotFound'>;

export const NotFoundScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View className="flex-1 bg-[#f7f7f7] dark:bg-gray-950 items-center justify-center px-6">
            <Text className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2 text-center">
                Page Not Found
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-300 mb-8 text-center">
                The page you're looking for doesn't exist or has been moved.
            </Text>
            <TouchableOpacity
                data-testid="go-home-button"
                className="bg-[#02757A] rounded-2xl px-8 py-4"
                onPress={() => navigation.navigate('MainTabs')}
            >
                <Text className="text-white font-semibold text-base">Go to Home</Text>
            </TouchableOpacity>
        </View>
    );
};
