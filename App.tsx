import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { RootNavigator } from '@/app/navigation/RootNavigator';
import { linking } from '@/app/navigation/linking';
import { queryClient } from '@/platform/api/queryClient';
import { store } from '@/store/store';
import { OfflineBanner } from '@/ui/components/OfflineBanner';
import { useAppSelector } from '@/hooks/useAppStore';
import './global.css';

import { UserProvider } from '@/ui/context/UserContext';

const AppShell = () => {
  const theme = useAppSelector((state) => state.ui.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [setColorScheme, theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineBanner />
      <NavigationContainer
        linking={linking}
        theme={theme === 'dark' ? DarkTheme : DefaultTheme}
      >
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <UserProvider>
        <AppShell />
      </UserProvider>
    </Provider>
  );
}
