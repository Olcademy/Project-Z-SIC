import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/ui/theme';

type LoadingSkeletonListProps = {
    count?: number;
};

export const LoadingSkeletonList: React.FC<LoadingSkeletonListProps> = ({ count = 3 }) => {
    const { isDark, colors } = useTheme();

    return (
        <View className="flex-1 px-4 pt-2" style={{ backgroundColor: colors.background }}>
            {Array.from({ length: count }).map((_, index) => (
                <View
                    key={`skeleton-${index}`}
                    className="bg-gray-200 dark:bg-gray-800 rounded-3xl h-48 mb-4"
                    style={[isDark ? null : { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }]}
                />
            ))}
        </View>
    );
};
