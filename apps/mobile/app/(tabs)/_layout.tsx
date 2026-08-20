import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography } from '../../src/lib/theme';
import { useNotificationSetup } from '../../src/hooks/useNotifications';
import { useMe } from '../../src/hooks/useUser';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: me } = useMe();
  useNotificationSetup(me?.id);

  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="medications"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💊" label="Medicines" focused={focused} />,
          tabBarAccessibilityLabel: 'Medications',
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.scanBtn}>
              <Text style={styles.scanEmoji}>📷</Text>
            </View>
          ),
          tabBarAccessibilityLabel: 'Scan Prescription',
        }}
      />
      <Tabs.Screen
        name="adherence"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Adherence" focused={focused} />,
          tabBarAccessibilityLabel: 'Adherence',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 56,
  },
  tabIconFocused: {
    backgroundColor: Colors.primarySurface,
  },
  emoji: { fontSize: 20 },
  tabLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
    fontWeight: Typography.fontWeight.medium,
  },
  tabLabelFocused: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.semibold,
  },
  scanBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  scanEmoji: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
});
