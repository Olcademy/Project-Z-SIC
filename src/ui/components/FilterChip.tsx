import React, { memo } from 'react';
import { Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/ui/theme';

type FilterChipProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
    testID?: string;
    style?: ViewStyle;
};

export const FilterChip = memo<FilterChipProps>(({ label, selected, onPress, testID, style }) => {
    const { colors } = useTheme();

    return (
        <TouchableOpacity
            testID={testID}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={onPress}
            style={[
                styles.base,
                {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.border,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.label,
                    {
                        color: selected ? '#FFFFFF' : colors.text,
                    },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
});

FilterChip.displayName = 'FilterChip';

const styles = StyleSheet.create({
    base: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        lineHeight: 16,
    },
});
