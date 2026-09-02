import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

console.log('--- _layout.tsx is evaluating ---');

import { useAuthStore } from '../src/store/auth.store';
import { useOfflineStore, initNetworkMonitor } from '../src/store/offline.store';
import { sessionExpiredEmitter } from '../src/lib/api';
import { Colors } from '../src/lib/theme';

// Prevent splash screen from auto-hiding until our init completes
SplashScreen.preventAutoHideAsync().catch((err) => console.error('Splash err:', err));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function RootLayout() {
  console.log('--- RootLayout function is mounting ---');
  const { hydrate, logout } = useAuthStore();
  const { loadFromStorage } = useOfflineStore();

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([hydrate(), loadFromStorage()]);
      } catch {
        // Non-fatal — app can still function without hydrated state
      } finally {
        // Always hide splash, even if hydration fails
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    void init();

    const unsub = sessionExpiredEmitter.on(() => void logout());
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
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
