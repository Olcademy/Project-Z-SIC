import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type ErrorStateProps = {
    message: string;
    onRetry?: () => void;
};

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
    return (
        <View className="items-center justify-center px-6 py-10">
            <Text className="text-base text-red-600 text-center">{message}</Text>
            {onRetry ? (
                <TouchableOpacity className="mt-4 bg-[#FF7A00] px-5 py-3 rounded-full" onPress={onRetry}>
                    <Text className="text-white text-sm font-semibold">Retry</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};
