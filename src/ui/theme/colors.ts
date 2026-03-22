export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
    background: string;
    surface: string;
    card: string;
    border: string;
    text: string;
    textMuted: string;
    primary: string;
    tabIconInactive: string;
    inputBackground: string;
};

export const lightColors: ThemeColors = {
    background: '#F2F6F6',
    surface: '#E6F4F4',
    card: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#6B7280',
    primary: '#02757A',
    tabIconInactive: '#6B7280',
    inputBackground: '#FFFFFF',
};

export const darkColors: ThemeColors = {
    // Matches Tailwind defaults used throughout the app (gray-950/900/etc.)
    background: '#030712',
    surface: '#111827',
    card: '#111827',
    border: '#1F2937',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    primary: '#02757A',
    tabIconInactive: '#9CA3AF',
    inputBackground: '#111827',
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
    return mode === 'dark' ? darkColors : lightColors;
};
