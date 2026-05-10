import React, { useEffect, useRef } from 'react';
import {
    Modal, View, Text, TouchableOpacity, ScrollView,
    Animated, TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { useTheme } from '@/ui/context/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export type FilterSection = {
    title: string;
    options: { label: string; value: string }[];
    selected: string | string[] | null;
    onSelect: (value: string | string[]) => void;
    multi?: boolean;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onClear: () => void;
    sections: FilterSection[];
    accentColor?: string;
};

export const FilterBottomSheet: React.FC<Props> = ({
    visible, onClose, onClear, sections, accentColor = '#FF7A00',
}) => {
    const theme = useTheme();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 4,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const activeCount = sections.reduce((acc, s) => {
        if (Array.isArray(s.selected)) return s.selected.length > 0 ? acc + 1 : acc;
        if (s.selected === null) return acc;
        if (s.selected === 'default') return acc;
        return acc + 1;
    }, 0);

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} />
            </TouchableWithoutFeedback>

            <Animated.View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: theme.card,
                borderTopLeftRadius: 24, borderTopRightRadius: 24,
                maxHeight: SCREEN_HEIGHT * 0.75,
                transform: [{ translateY: slideAnim }],
            }}>
                {/* Handle */}
                <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                    <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
                </View>

                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Filters</Text>
                    <TouchableOpacity onPress={onClear}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: accentColor }}>Clear all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                    {sections.map((section) => (
                        <View key={section.title} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {section.title}
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {section.options.map((opt) => {
                                    const isActive = Array.isArray(section.selected)
                                        ? section.selected.includes(opt.value)
                                        : section.selected === opt.value;
                                    return (
                                        <TouchableOpacity
                                            key={opt.value}
                                            onPress={() => {
                                                if (section.multi) {
                                                    const current = Array.isArray(section.selected) ? section.selected : [];
                                                    const next = current.includes(opt.value)
                                                        ? current.filter((v) => v !== opt.value)
                                                        : [...current, opt.value];
                                                    section.onSelect(next);
                                                } else {
                                                    section.onSelect(opt.value);
                                                }
                                            }}
                                            style={{
                                                borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 8,
                                                backgroundColor: isActive ? accentColor : theme.chipBg,
                                                borderColor: isActive ? accentColor : theme.chipBorder,
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: isActive ? '#fff' : theme.chipText }}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Apply button */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border }}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ backgroundColor: accentColor, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                    >
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                            Apply{activeCount > 0 ? ` (${activeCount} active)` : ''}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
};
