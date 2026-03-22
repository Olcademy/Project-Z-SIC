import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type EmptyStateProps = {
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, actionLabel, onAction }) => {
    return (
        <View className="items-center justify-center px-6 py-10">
            <Text className="text-lg font-semibold text-gray-900 dark:text-gray-50 text-center">{title}</Text>
            {description ? (
                <Text className="text-sm text-gray-600 dark:text-gray-300 text-center mt-2">{description}</Text>
            ) : null}
            {actionLabel && onAction ? (
                <TouchableOpacity className="mt-5 bg-[#02757A] px-5 py-3 rounded-full" onPress={onAction}>
                    <Text className="text-white text-sm font-semibold">{actionLabel}</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};
