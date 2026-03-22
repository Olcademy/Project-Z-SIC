import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppStore';
import { getThemeColors, ThemeMode, ThemeColors } from './colors';

export type AppTheme = {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
};

export const useTheme = (): AppTheme => {
    const mode = useAppSelector((state) => state.ui.theme);

    return useMemo(() => {
        const colors = getThemeColors(mode);
        return {
            mode,
            isDark: mode === 'dark',
            colors,
        };
    }, [mode]);
};
