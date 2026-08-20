import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTodayDoses, useMarkTaken, useMarkSkipped, useSnoozeDose, useAdherence } from '../../src/hooks/useDoses';
import { useRefills } from '../../src/hooks/useUser';
import { useMe } from '../../src/hooks/useUser';
import { DoseCard } from '../../src/components/features/DoseCard';
import { Card } from '../../src/components/ui/Card';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { DoseCardSkeleton } from '../../src/components/ui/LoadingSkeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/lib/theme';
import type { DoseEvent } from '../../src/services/doses.service';

export default function HomeScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const { data: todayDoses, isLoading: dosesLoading, refetch, isRefetching } = useTodayDoses();
  const { data: adherence } = useAdherence('7d');
  const { data: refills } = useRefills();
  const markTaken = useMarkTaken();
  const markSkipped = useMarkSkipped();
  const snoozeDose = useSnoozeDose();

  const firstName = me?.profile?.firstName ?? 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const runningLow = Array.isArray(refills)
    ? refills.filter((r: { isRunningLow?: boolean }) => r.isRunningLow)
    : [];

  const onRefresh = useCallback(() => { void refetch(); }, [refetch]);

  const handleTaken = (dose: DoseEvent) => {
    markTaken.mutate({ id: dose.id });
  };
  const handleSkipped = (dose: DoseEvent) => {
    markSkipped.mutate({ id: dose.id });
  };
  const handleSnooze = (dose: DoseEvent) => {
    snoozeDose.mutate({ id: dose.id, snoozeMinutes: 15 });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, {firstName} 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={styles.avatar}
            accessibilityLabel="Profile"
          >
            <Text style={styles.avatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Adherence + streak summary */}
        {adherence && (
          <Card style={styles.adherenceCard}>
            <View style={styles.adherenceRow}>
              <ProgressRing
                percentage={adherence.adherenceRate}
                size={72}
                color={adherence.adherenceRate >= 80 ? Colors.success : Colors.warning}
                label={`${adherence.adherenceRate}%`}
                sublabel="7d"
              />
              <View style={styles.adherenceStats}>
                <Text style={styles.adherenceTitle}>Medication health</Text>
                <Text style={styles.adherenceSubtitle}>Adherence this week</Text>
                {adherence.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakText}>🔥 {adherence.streak} day streak</Text>
                  </View>
                )}
              </View>
              <View style={styles.miniStats}>
                <MiniStat value={adherence.taken} label="Taken" color={Colors.success} />
                <MiniStat value={adherence.missed} label="Missed" color={Colors.error} />
              </View>
            </View>
          </Card>
        )}

        {/* Today's doses */}
        <SectionHeader
          title="Today's medications"
          action={todayDoses ? `${todayDoses.takenCount}/${todayDoses.total} done` : undefined}
        />

        {dosesLoading ? (
          <>
            <DoseCardSkeleton />
            <DoseCardSkeleton />
          </>
        ) : !todayDoses || todayDoses.total === 0 ? (
          <EmptyState
            icon="🎉"
            title="No medications today"
            description="You have no scheduled doses for today."
          />
        ) : (
          <>
            {todayDoses.upcoming.length > 0 && (
              <>
                <Text style={styles.subSection}>Upcoming</Text>
                {todayDoses.upcoming.map((dose) => (
                  <DoseCard
                    key={dose.id}
                    dose={dose}
                    onTake={() => handleTaken(dose)}
                    onSkip={() => handleSkipped(dose)}
                    onSnooze={() => handleSnooze(dose)}
                    isLoading={markTaken.isPending && markTaken.variables?.id === dose.id}
                  />
                ))}
              </>
            )}
            {todayDoses.past.length > 0 && (
              <>
                <Text style={styles.subSection}>Earlier today</Text>
                {todayDoses.past.map((dose) => (
                  <DoseCard key={dose.id} dose={dose} />
                ))}
              </>
            )}
          </>
        )}

        {/* Running low */}
        {runningLow.length > 0 && (
          <>
            <SectionHeader
              title="Running low"
              action="View all"
              onAction={() => router.push('/refills')}
            />
            {runningLow.slice(0, 2).map((r: {
              medication: { id: string; name: string; dosage?: string; color?: string };
              estimatedRemaining: number;
              daysLeft?: number;
              urgency?: string;
            }) => (
              <RefillAlert key={r.medication.id} refill={r} onReorder={() => router.push('/refills')} />
            ))}
          </>
        )}

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.quickActions}>
          <QuickActionBtn
            icon="📷"
            label="Scan Prescription"
            onPress={() => router.push('/(tabs)/scan')}
            color={Colors.primary}
          />
          <QuickActionBtn
            icon="➕"
            label="Add Medicine"
            onPress={() => router.push('/medications/add')}
            color={Colors.secondary}
          />
          <QuickActionBtn
            icon="🔔"
            label="Refill Center"
            onPress={() => router.push('/refills')}
            color={Colors.warning}
          />
          <QuickActionBtn
            icon="👨‍👩‍👧"
            label="Family"
            onPress={() => router.push('/caregivers')}
            color={Colors.success}
          />
        </View>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function MiniStat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

function RefillAlert({ refill, onReorder }: { refill: {
  medication: { name: string; dosage?: string; color?: string };
  estimatedRemaining: number;
  daysLeft?: number;
  urgency?: string;
}; onReorder: () => void }) {
  const isCritical = refill.urgency === 'CRITICAL' || refill.urgency === 'HIGH';
  return (
    <Card style={[styles.refillCard, isCritical && styles.refillCardCritical]}>
      <View style={styles.refillRow}>
        <View style={styles.refillInfo}>
          <Text style={styles.refillName}>{refill.medication.name}</Text>
          <Text style={styles.refillDose}>
            ~{refill.estimatedRemaining} doses remaining
            {refill.daysLeft != null ? ` · ${refill.daysLeft}d left` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onReorder}
          style={[styles.reorderBtn, isCritical && styles.reorderBtnCritical]}
          accessibilityLabel={`Reorder ${refill.medication.name}`}
        >
          <Text style={styles.reorderBtnText}>Reorder</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

function QuickActionBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.quickAction}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.qaIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.qaEmoji}>{icon}</Text>
      </View>
      <Text style={styles.qaLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing[5] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  greeting: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  date: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  adherenceCard: {
    marginBottom: Spacing[5],
    padding: Spacing[4],
  },
  adherenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  adherenceStats: { flex: 1 },
  adherenceTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  adherenceSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    marginTop: Spacing[2],
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  streakText: { fontSize: Typography.fontSize.xs, color: '#92400E', fontWeight: Typography.fontWeight.semibold },
  miniStats: { gap: Spacing[2] },
  miniStat: { alignItems: 'center' },
  miniStatValue: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  miniStatLabel: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  sectionAction: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  subSection: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
    marginTop: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refillCard: { marginBottom: Spacing[3], padding: Spacing[4] },
  refillCardCritical: { borderColor: Colors.error, borderWidth: 1.5 },
  refillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  refillInfo: { flex: 1 },
  refillName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  refillDose: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  reorderBtn: {
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  reorderBtnCritical: { backgroundColor: Colors.errorSurface },
  reorderBtnText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  quickAction: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    alignItems: 'center',
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qaIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  qaEmoji: { fontSize: 24 },
  qaLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
