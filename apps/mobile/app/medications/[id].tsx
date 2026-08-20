import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedication, useUpdateMedication, useDeleteMedication } from '../../src/hooks/useMedications';
import { useExplainMedication } from '../../src/hooks/usePrescriptions';
import { Card } from '../../src/components/ui/Card';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { ProgressRing } from '../../src/components/ui/ProgressRing';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { Skeleton } from '../../src/components/ui/LoadingSkeleton';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { FREQUENCY_LABELS, MEAL_RELATION_LABELS, MEDICATION_FORM_LABELS, DISCLAIMER } from '../../src/lib/constants';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';

export default function MedicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: med, isLoading, isError, refetch } = useMedication(id);
  const updateMed = useUpdateMedication();
  const deleteMed = useDeleteMedication();
  const explainMed = useExplainMedication();

  const [showExplain, setShowExplain] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handlePauseResume = () => {
    if (!med) return;
    const newStatus = med.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    Alert.alert(
      `${newStatus === 'ACTIVE' ? 'Resume' : 'Pause'} medication`,
      `Are you sure you want to ${newStatus === 'ACTIVE' ? 'resume' : 'pause'} ${med.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => updateMed.mutate({ id, input: { status: newStatus } }) },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert('Delete medication', `Remove ${med?.name} from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteMed.mutate(id, { onSuccess: () => router.back() }),
      },
    ]);
  };

  const handleExplain = async () => {
    if (!med) return;
    setShowExplain(true);
    if (!explanation) {
      try {
        const result = await explainMed.mutateAsync({
          medicationName: med.name,
          dosage: med.dosage,
          frequency: FREQUENCY_LABELS[med.frequency] ?? med.frequency,
          instructions: med.timingInstructions,
        });
        setExplanation(result.explanation);
      } catch {
        setExplanation('Unable to generate explanation at this time.');
      }
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Skeleton width={200} height={28} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={160} borderRadius={16} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !med) {
    return <ErrorState title="Medication not found" onRetry={() => void refetch()} />;
  }

  const color = med.color ?? Colors.primary;
  const statusVariant = med.status === 'ACTIVE' ? 'active' : med.status === 'PAUSED' ? 'paused' : 'completed';
  const refill = med.refillPrediction;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back + actions */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity onPress={handlePauseResume} style={styles.topActionBtn} disabled={med.status === 'COMPLETED'}>
              <Text>{med.status === 'ACTIVE' ? '⏸' : '▶️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.topActionBtn}>
              <Text>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header card */}
        <Card style={[styles.headerCard, { borderLeftColor: color, borderLeftWidth: 4 }] as any}>
          <View style={styles.headerRow}>
            <View style={styles.medIcon}>
              <Text style={styles.medIconText}>💊</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.medName}>{med.name}</Text>
              {med.genericName && <Text style={styles.genericName}>{med.genericName}</Text>}
              {med.dosage && <Text style={styles.dosage}>{med.dosage}</Text>}
            </View>
            <StatusBadge variant={statusVariant} size="md" />
          </View>
        </Card>

        {/* Schedule & adherence */}
        <View style={styles.metricsRow}>
          {typeof med.adherencePercentage === 'number' && (
            <Card style={styles.metricCard}>
              <ProgressRing
                percentage={med.adherencePercentage}
                size={64}
                color={med.adherencePercentage >= 80 ? Colors.success : Colors.warning}
                label={`${med.adherencePercentage}%`}
              />
              <Text style={styles.metricLabel}>Adherence{'\n'}(30 days)</Text>
            </Card>
          )}
          {med.currentQuantity !== undefined && (
            <Card style={styles.metricCard}>
              <Text style={styles.metricValue}>{med.currentQuantity}</Text>
              <Text style={styles.metricLabel}>{med.unit ?? 'tablets'}{'\n'}remaining</Text>
            </Card>
          )}
          {refill?.daysLeft !== undefined && (
            <Card style={[styles.metricCard, refill.isRunningLow ? { borderColor: Colors.error } : null] as any}>
              <Text style={[styles.metricValue, { color: refill.isRunningLow ? Colors.error : Colors.textPrimary }]}>
                {refill.daysLeft}d
              </Text>
              <Text style={styles.metricLabel}>Estimated{'\n'}supply left</Text>
            </Card>
          )}
        </View>

        {/* Details */}
        <Card style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Schedule</Text>
          <DetailRow icon="🔄" label="Frequency" value={FREQUENCY_LABELS[med.frequency] ?? med.frequency} />
          {med.schedules.map((s: any) => (
            <DetailRow key={s.id} icon="🕐" label="Time" value={`${s.timeOfDay} · ${MEAL_RELATION_LABELS[s.mealRelation] ?? s.mealRelation}`} />
          ))}
          {med.form && <DetailRow icon="💊" label="Form" value={MEDICATION_FORM_LABELS[med.form] ?? med.form} />}
          {med.timingInstructions && <DetailRow icon="📝" label="Instructions" value={med.timingInstructions} />}
          <DetailRow icon="📅" label="Start date" value={new Date(med.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
          {med.endDate && <DetailRow icon="📅" label="End date" value={new Date(med.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />}
          {med.notes && <DetailRow icon="📌" label="Notes" value={med.notes} />}
        </Card>

        {/* Refill prediction */}
        {refill && (
          <Card style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Refill Prediction</Text>
            <DetailRow icon="📦" label="Estimated remaining" value={`~${refill.estimatedRemaining} ${med.unit ?? 'tablets'}`} />
            {refill.estimatedRunOutDate && (
              <DetailRow
                icon="📅"
                label="Estimated run-out"
                value={new Date(refill.estimatedRunOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              />
            )}
            {refill.recommendedReorderDate && (
              <DetailRow
                icon="🛒"
                label="Reorder by"
                value={new Date(refill.recommendedReorderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
              />
            )}
            <DetailRow icon="📈" label="Adherence rate" value={`${Math.round((refill.adherenceRate ?? 1) * 100)}%`} />
          </Card>
        )}

        {/* AI explain button */}
        <TouchableOpacity onPress={handleExplain} style={styles.explainBtn} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.explainBtnText}>🤖 Explain this medication</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>

      {/* AI explanation sheet */}
      <BottomSheet visible={showExplain} onClose={() => setShowExplain(false)} title="Medication Explanation" snapPoint={0.65}>
        {explainMed.isPending ? (
          <View style={styles.explainLoading}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.explainLoadingText}>Generating explanation...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.explainText}>{explanation}</Text>
            <View style={styles.explainDisclaimer}>
              <Text style={styles.explainDisclaimerText}>{DISCLAIMER}</Text>
            </View>
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[5] },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  back: {},
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  topActions: { flexDirection: 'row', gap: Spacing[2] },
  topActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  headerCard: { padding: Spacing[4], marginBottom: Spacing[4] },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  medIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  medIconText: { fontSize: 26 },
  headerInfo: { flex: 1 },
  medName: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  genericName: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  dosage: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.semibold, marginTop: 2 },
  metricsRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  metricCard: { flex: 1, padding: Spacing[3], alignItems: 'center', gap: Spacing[2] },
  metricValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  metricLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
  detailsCard: { padding: Spacing[4], marginBottom: Spacing[4] },
  cardTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing[3], gap: Spacing[2] },
  detailIcon: { fontSize: 16, width: 24 },
  detailLabel: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, width: 110 },
  detailValue: { flex: 1, fontSize: Typography.fontSize.sm, color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium, textAlign: 'right' },
  explainBtn: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.xl, padding: Spacing[4], alignItems: 'center', borderWidth: 1, borderColor: Colors.primaryLight },
  explainBtnText: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.primary },
  explainLoading: { alignItems: 'center', paddingVertical: Spacing[10], gap: Spacing[4] },
  explainLoadingText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  explainText: { fontSize: Typography.fontSize.md, color: Colors.textPrimary, lineHeight: 24, marginBottom: Spacing[4] },
  explainDisclaimer: { backgroundColor: Colors.infoSurface, borderRadius: 10, padding: Spacing[3] },
  explainDisclaimerText: { fontSize: Typography.fontSize.xs, color: Colors.info, lineHeight: 18 },
});
