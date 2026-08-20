import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdherence } from '../../src/hooks/useDoses';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/LoadingSkeleton';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';

const PERIODS = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
] as const;

export default function AdherenceScreen() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const { data, isLoading, refetch, isRefetching } = useAdherence(period);

  const adherenceColor =
    !data ? Colors.gray400 :
    data.adherenceRate >= 90 ? Colors.success :
    data.adherenceRate >= 70 ? Colors.warning : Colors.error;

  const adherenceLabel =
    !data ? 'Loading...' :
    data.adherenceRate >= 90 ? 'Excellent' :
    data.adherenceRate >= 70 ? 'Good' :
    data.adherenceRate >= 50 ? 'Fair' : 'Needs improvement';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />}
      >
        <Text style={styles.title}>Adherence Report</Text>

        {/* Period selector */}
        <View style={styles.periods}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: period === p.key }}
            >
              <Text style={[styles.periodLabel, period === p.key && styles.periodLabelActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main metric */}
        <Card style={styles.mainCard}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <Skeleton width={120} height={120} borderRadius={60} />
              <View style={{ flex: 1, gap: 10 }}>
                <Skeleton width="80%" height={18} />
                <Skeleton width="60%" height={14} />
                <Skeleton width="70%" height={14} />
              </View>
            </View>
          ) : data ? (
            <View style={styles.mainRow}>
              <ProgressRing
                percentage={data.adherenceRate}
                size={120}
                strokeWidth={12}
                color={adherenceColor}
                label={`${data.adherenceRate}%`}
                sublabel="adherence"
              />
              <View style={styles.mainInfo}>
                <Text style={[styles.mainLabel, { color: adherenceColor }]}>{adherenceLabel}</Text>
                <Text style={styles.mainPeriod}>Last {period}</Text>
                {data.streak > 0 && (
                  <View style={styles.streak}>
                    <Text style={styles.streakText}>🔥 {data.streak}-day streak</Text>
                  </View>
                )}
              </View>
            </View>
          ) : null}
        </Card>

        {/* Stats grid */}
        {data && (
          <View style={styles.statsGrid}>
            <StatCard label="Doses Taken" value={data.taken} icon="✅" color={Colors.success} />
            <StatCard label="Doses Missed" value={data.missed} icon="❌" color={Colors.error} />
            <StatCard label="Doses Skipped" value={data.skipped} icon="⏭️" color={Colors.warning} />
            <StatCard label="Total Due" value={data.total} icon="💊" color={Colors.primary} />
          </View>
        )}

        {/* Adherence bar breakdown */}
        {data && data.total > 0 && (
          <Card style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Breakdown</Text>
            <BreakdownBar taken={data.taken} missed={data.missed} skipped={data.skipped} total={data.total} />
            <View style={styles.legendRow}>
              <LegendItem color={Colors.success} label={`Taken (${data.taken})`} />
              <LegendItem color={Colors.error} label={`Missed (${data.missed})`} />
              <LegendItem color={Colors.warning} label={`Skipped (${data.skipped})`} />
            </View>
          </Card>
        )}

        {/* Tips */}
        {data && data.adherenceRate < 80 && (
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips to improve adherence</Text>
            {[
              'Set reminders at the same time each day',
              'Keep medications in a visible location',
              'Use the snooze feature if you need more time',
              'Ask a family member to check in with you',
            ].map((tip) => (
              <Text key={tip} style={styles.tip}>• {tip}</Text>
            ))}
          </Card>
        )}

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function BreakdownBar({ taken, missed, skipped, total }: { taken: number; missed: number; skipped: number; total: number }) {
  const takenPct = total > 0 ? (taken / total) * 100 : 0;
  const missedPct = total > 0 ? (missed / total) * 100 : 0;
  const skippedPct = total > 0 ? (skipped / total) * 100 : 0;
  return (
    <View style={styles.bar}>
      {takenPct > 0 && <View style={[styles.barSegment, { flex: takenPct, backgroundColor: Colors.success }]} />}
      {skippedPct > 0 && <View style={[styles.barSegment, { flex: skippedPct, backgroundColor: Colors.warning }]} />}
      {missedPct > 0 && <View style={[styles.barSegment, { flex: missedPct, backgroundColor: Colors.error }]} />}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[5] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[4] },
  periods: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[5] },
  periodBtn: { flex: 1, paddingVertical: Spacing[2], borderRadius: BorderRadius.lg, backgroundColor: Colors.gray100, alignItems: 'center' },
  periodBtnActive: { backgroundColor: Colors.primary },
  periodLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary },
  periodLabelActive: { color: Colors.textInverse, fontWeight: Typography.fontWeight.semibold },
  mainCard: { padding: Spacing[5], marginBottom: Spacing[4] },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[5] },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[5] },
  mainInfo: { flex: 1 },
  mainLabel: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, marginBottom: 4 },
  mainPeriod: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  streak: { marginTop: Spacing[3], backgroundColor: '#FEF3C7', borderRadius: BorderRadius.full, paddingHorizontal: Spacing[3], paddingVertical: 4, alignSelf: 'flex-start' },
  streakText: { fontSize: Typography.fontSize.sm, color: '#92400E', fontWeight: Typography.fontWeight.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3], marginBottom: Spacing[4] },
  statCard: { flex: 1, minWidth: '45%', padding: Spacing[4], alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: Spacing[2] },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  breakdownCard: { padding: Spacing[4], marginBottom: Spacing[4] },
  breakdownTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  bar: { flexDirection: 'row', height: 12, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing[3] },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  tipsCard: { padding: Spacing[4], backgroundColor: Colors.primarySurface, borderColor: Colors.primary, borderWidth: 1 },
  tipsTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.primaryDark, marginBottom: Spacing[3] },
  tip: { fontSize: Typography.fontSize.sm, color: Colors.primary, lineHeight: 24 },
});
