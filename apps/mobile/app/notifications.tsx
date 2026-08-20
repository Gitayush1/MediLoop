import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications, useMarkAllRead, useMarkNotificationRead } from '../src/hooks/useUser';
import { Card } from '../src/components/ui/Card';
import { EmptyState } from '../src/components/ui/EmptyState';
import { Skeleton } from '../src/components/ui/LoadingSkeleton';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';

const NOTIFICATION_ICONS: Record<string, string> = {
  DOSE_REMINDER: '⏰',
  UPCOMING_DOSE: '💊',
  MISSED_DOSE: '⚠️',
  REFILL_WARNING: '📦',
  CAREGIVER_ALERT: '👨‍👩‍👧',
  SYSTEM: '🔔',
};

const NOTIFICATION_COLORS: Record<string, string> = {
  DOSE_REMINDER: Colors.primary,
  UPCOMING_DOSE: Colors.info,
  MISSED_DOSE: Colors.error,
  REFILL_WARNING: Colors.warning,
  CAREGIVER_ALERT: Colors.secondary,
  SYSTEM: Colors.gray500,
};

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: result, isLoading, refetch, isRefetching } = useNotifications();
  const markAllRead = useMarkAllRead();
  const markRead = useMarkNotificationRead();

  // Safely extract from paginated response
  const notifications: Notification[] = (result as { data?: Notification[] } | undefined)?.data ?? [];
  const unreadCount: number = (result as { meta?: { unreadCount?: number } } | undefined)?.meta?.unreadCount ?? 0;

  const handleNotificationPress = (n: Notification) => {
    if (!n.read) {
      markRead.mutate(n.id);
    }
    // Navigate based on type
    // TODO: deep-link to relevant screen based on notification data
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            accessibilityRole="button"
          >
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.content}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonRow}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="70%" height={14} />
                <Skeleton width="90%" height={12} />
                <Skeleton width="30%" height={11} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔔"
              title="No notifications yet"
              description="You'll see dose reminders, missed dose alerts, and refill warnings here."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={[styles.notifItem, !item.read && styles.notifItemUnread]}>
                {/* Unread dot */}
                {!item.read && <View style={styles.unreadDot} />}

                {/* Icon */}
                <View style={[
                  styles.notifIcon,
                  { backgroundColor: (NOTIFICATION_COLORS[item.type] ?? Colors.gray400) + '20' },
                ]}>
                  <Text style={styles.notifIconText}>
                    {NOTIFICATION_ICONS[item.type] ?? '🔔'}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.notifBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.notifTime}>
                    {formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    width: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: Colors.textInverse,
    fontSize: 11,
    fontWeight: Typography.fontWeight.bold,
  },
  markAllRead: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
    width: 80,
    textAlign: 'right',
  },
  content: {
    paddingVertical: Spacing[2],
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  notifItemUnread: {
    backgroundColor: Colors.primarySurface + 'AA',
  },
  unreadDot: {
    position: 'absolute',
    left: Spacing[2],
    top: Spacing[5],
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
    flexShrink: 0,
  },
  notifIconText: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  notifTitleUnread: { fontWeight: Typography.fontWeight.semibold },
  notifBody: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing[5] + 44 + Spacing[3],
  },
});
