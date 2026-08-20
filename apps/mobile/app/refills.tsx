import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRefills } from '../src/hooks/useUser';
import { Card } from '../src/components/ui/Card';
import { StatusBadge } from '../src/components/ui/StatusBadge';
import { EmptyState } from '../src/components/ui/EmptyState';
import { Skeleton } from '../src/components/ui/LoadingSkeleton';
import { usersService } from '../src/services/users.service';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';

interface RefillItem {
  medication: { id: string; name: string; dosage?: string; color?: string; unit?: string; currentQuantity?: number };
  estimatedRemaining: number;
  estimatedRunOutDate?: string;
  recommendedReorderDate?: string;
  adherenceRate: number;
  daysLeft?: number;
  urgency?: string;
  isRunningLow?: boolean;
  warningAcknowledged: boolean;
}

export default function RefillsScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: refills, isLoading, refetch, isRefetching } = useRefills();
  const items = (refills as RefillItem[] | undefined) ?? [];

  const acknowledge = useMutation({
    mutationFn: (medicationId: string) => usersService.acknowledgeRefill(medicationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['refills'] }),
  });

  const addInventory = useMutation({
    mutationFn: ({ medicationId, quantity }: { medicationId: string; quantity: number }) =>
      usersService.addInventory(medicationId, { quantity }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['refills'] }),
  });

  const handleReorder = (item: RefillItem) => {
    Alert.prompt(
      `Restock ${item.medication.name}`,
      'How many did you purchase?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to inventory',
          onPress: (qty) => {
            const quantity = parseInt(qty ?? '0');
            if (isNaN(quantity) || quantity <= 0) {
              Alert.alert('Invalid quantity');
              return;
            }
            addInventory.mutate({ medicationId: item.medication.id, quantity });
          },
        },
      ],
      'plain-text',
      '30',
      'numeric'
    );
  };

  const urgencyVariant = (u?: string): 'low' | 'critical' | 'active' => {
    if (u === 'CRITICAL' || u === 'HIGH') return 'critical';
    if (u === 'MEDIUM') return 'low';
    return 'active';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Refill Center</Text>
        <View style={{ width: 60 }} />
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <Skeleton width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.medication.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />}
          ListHeaderComponent={
            items.filter((r) => r.isRunningLow).length > 0 ? (
              <View style={styles.alertBanner}>
                <Text style={styles.alertText}>
                  ⚠️ {items.filter((r) => r.isRunningLow).length} medication{items.filter((r) => r.isRunningLow).length > 1 ? 's are' : ' is'} running low
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="📦"
              title="All stocked up!"
              description="None of your medications are running low."
            />
          }
          renderItem={({ item }) => (
            <Card
              style={[styles.card, item.urgency === 'CRITICAL' && styles.cardCritical] as any}
              onPress={() => router.push(`/medications/${item.medication.id}`)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.medInfo}>
                  <Text style={styles.medName}>{item.medication.name}</Text>
                  {item.medication.dosage && <Text style={styles.medDosage}>{item.medication.dosage}</Text>}
                </View>
                <StatusBadge variant={urgencyVariant(item.urgency)} label={item.urgency} size="sm" />
              </View>

              <View style={styles.statsRow}>
                <StatBox
                  label="Remaining"
                  value={`~${item.estimatedRemaining} ${item.medication.unit ?? 'doses'}`}
                  color={item.isRunningLow ? Colors.error : Colors.textPrimary}
                />
                {item.daysLeft !== undefined && (
                  <StatBox
                    label="Days left"
                    value={`${item.daysLeft}d`}
                    color={item.daysLeft <= 7 ? Colors.error : Colors.textPrimary}
                  />
                )}
                <StatBox
                  label="Adherence"
                  value={`${Math.round(item.adherenceRate * 100)}%`}
                  color={Colors.textPrimary}
                />
              </View>

              {item.estimatedRunOutDate && (
                <Text style={styles.runOutDate}>
                  📅 Estimated run-out: {new Date(item.estimatedRunOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              )}
              {item.recommendedReorderDate && (
                <Text style={styles.reorderDate}>
                  🛒 Reorder by: {new Date(item.recommendedReorderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              )}

              <View style={styles.actions}>
                {!item.warningAcknowledged && (
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation?.(); acknowledge.mutate(item.medication.id); }}
                    style={styles.dismissBtn}
                  >
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation?.(); handleReorder(item); }}
                  style={styles.reorderBtn}
                >
                  <Text style={styles.reorderBtnText}>+ Add stock</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[5], paddingBottom: Spacing[3] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  content: { padding: Spacing[5] },
  alertBanner: { backgroundColor: Colors.warningSurface, borderRadius: 12, padding: Spacing[3], marginBottom: Spacing[4] },
  alertText: { fontSize: Typography.fontSize.sm, color: Colors.warning, fontWeight: Typography.fontWeight.semibold },
  card: { marginBottom: Spacing[3], padding: Spacing[4] },
  cardCritical: { borderColor: Colors.error, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing[3] },
  medInfo: { flex: 1 },
  medName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  medDosage: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  statBox: { flex: 1 },
  statValue: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  runOutDate: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  reorderDate: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: Spacing[3] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  dismissBtn: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingVertical: Spacing[2], alignItems: 'center' },
  dismissBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  reorderBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing[2], alignItems: 'center' },
  reorderBtnText: { fontSize: Typography.fontSize.sm, color: Colors.textInverse, fontWeight: Typography.fontWeight.semibold },
});
