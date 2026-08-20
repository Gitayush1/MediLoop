import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/store/auth.store';
import { useOfflineStore, initNetworkMonitor } from '../src/store/offline.store';
import { sessionExpiredEmitter } from '../src/lib/api';
import { Colors } from '../src/lib/theme';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function RootLayout() {
  const { hydrate, logout } = useAuthStore();
  const { loadFromStorage } = useOfflineStore();

  useEffect(() => {
    async function init() {
      await Promise.all([hydrate(), loadFromStorage()]);
      await SplashScreen.hideAsync();
    }
    void init();

    // Listen for session expiry
    const unsub = sessionExpiredEmitter.on(() => void logout());

    // Network monitor
    const unsubNetwork = initNetworkMonitor();

    return () => {
      unsub();
      unsubNetwork();
    };
  }, [hydrate, loadFromStorage, logout]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
