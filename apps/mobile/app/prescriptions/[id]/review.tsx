import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePrescription, useConfirmMedicines } from '../../../src/hooks/usePrescriptions';
import { useCreateMedication } from '../../../src/hooks/useMedications';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { ErrorState } from '../../../src/components/ui/ErrorState';
import { Skeleton } from '../../../src/components/ui/LoadingSkeleton';
import { DISCLAIMER } from '../../../src/lib/constants';
import { Colors, Typography, Spacing, BorderRadius } from '../../../src/lib/theme';
import type { PrescriptionMedicine } from '../../../src/services/prescriptions.service';

interface EditableMedicine extends PrescriptionMedicine {
  selected: boolean;
  editedName: string;
  editedDosage: string;
  editedFrequency: string;
  editedDuration: string;
  editedInstructions: string;
}

export default function PrescriptionReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: prescription, isLoading, isError, refetch } = usePrescription(id);
  const confirmMedicines = useConfirmMedicines();
  const createMed = useCreateMedication();

  const [medicines, setMedicines] = useState<EditableMedicine[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Initialize editable state from loaded data
  React.useEffect(() => {
    if (prescription?.medicines && !medicines) {
      setMedicines(
        prescription.medicines.map((m) => ({
          ...m,
          selected: m.confidence >= 0.7,
          editedName: m.name,
          editedDosage: m.dosage ?? '',
          editedFrequency: m.frequency ?? '',
          editedDuration: m.duration ?? '',
          editedInstructions: m.instructions ?? '',
        }))
      );
    }
  }, [prescription, medicines]);

  const handleConfirm = async () => {
    if (!medicines || !prescription) return;

    const selectedMeds = medicines.filter((m) => m.selected);
    if (selectedMeds.length === 0) {
      Alert.alert('Select medications', 'Please select at least one medication to add to your schedule.');
      return;
    }

    try {
      // 1. Confirm extractions
      await confirmMedicines.mutateAsync({
        prescriptionId: id,
        confirmations: medicines.map((m) => ({
          prescriptionMedicineId: m.id,
          confirmed: m.selected,
          overrides: m.selected ? {
            name: m.editedName,
            dosage: m.editedDosage || undefined,
            frequency: m.editedFrequency || undefined,
            duration: m.editedDuration || undefined,
            instructions: m.editedInstructions || undefined,
          } : undefined,
        })),
      });

      // 2. Create medications for selected ones
      const today = new Date().toISOString().split('T')[0];

      for (const med of selectedMeds) {
        const endDate = parseDuration(med.editedDuration);
        const scheduleTime = suggestScheduleTime(med.editedFrequency);

        await createMed.mutateAsync({
          name: med.editedName,
          dosage: med.editedDosage || undefined,
          frequency: inferFrequency(med.editedFrequency),
          startDate: today,
          endDate,
          scheduleTimes: scheduleTime,
          timingInstructions: med.editedInstructions || undefined,
          prescriptionId: id,
        });
      }

      Alert.alert(
        '✅ Schedule created!',
        `${selectedMeds.length} medication${selectedMeds.length > 1 ? 's have' : ' has'} been added to your schedule.`,
        [{ text: 'View Medications', onPress: () => router.replace('/(tabs)/medications') }]
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      Alert.alert('Error', error.response?.data?.error?.message ?? 'Failed to create medication schedule');
    }
  };

  if (isLoading || !medicines) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Skeleton width={200} height={24} style={{ marginBottom: 16 }} />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={120} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !prescription) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  const selectedCount = medicines.filter((m) => m.selected).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Extraction</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Prescription info */}
        {(prescription.doctorName || prescription.prescriptionDate) && (
          <Card style={styles.prescriptionInfo}>
            {prescription.doctorName && (
              <Text style={styles.doctorName}>👨‍⚕️ {prescription.doctorName}</Text>
            )}
            {prescription.prescriptionDate && (
              <Text style={styles.prescDate}>
                📅 {new Date(prescription.prescriptionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </Card>
        )}

        {/* AI notice */}
        <View style={styles.aiNotice}>
          <Text style={styles.aiNoticeText}>
            🤖 AI has extracted the following medications. Please review each one carefully and make any corrections before confirming.
          </Text>
        </View>

        {/* Medicine cards */}
        {medicines.map((med, idx) => (
          <MedicineReviewCard
            key={med.id}
            medicine={med}
            isExpanded={expandedId === med.id}
            onToggleExpand={() => setExpandedId(expandedId === med.id ? null : med.id)}
            onToggleSelect={(selected) => {
              setMedicines((prev) => prev?.map((m, i) => i === idx ? { ...m, selected } : m) ?? null);
            }}
            onEdit={(field, value) => {
              setMedicines((prev) => prev?.map((m, i) => i === idx ? { ...m, [field]: value } : m) ?? null);
            }}
          />
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Confirm bar */}
      <View style={styles.confirmBar}>
        <Text style={styles.confirmCount}>
          {selectedCount} of {medicines.length} selected
        </Text>
        <Button
          label={confirmMedicines.isPending || createMed.isPending ? 'Creating...' : `Confirm & Add ${selectedCount}`}
          onPress={handleConfirm}
          variant="primary"
          size="lg"
          isLoading={confirmMedicines.isPending || createMed.isPending}
          disabled={selectedCount === 0}
          style={styles.confirmBtn}
        />
      </View>
    </SafeAreaView>
  );
}

interface MedicineReviewCardProps {
  medicine: EditableMedicine;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSelect: (v: boolean) => void;
  onEdit: (field: string, value: string) => void;
}

function MedicineReviewCard({ medicine, isExpanded, onToggleExpand, onToggleSelect, onEdit }: MedicineReviewCardProps) {
  const confidencePct = Math.round(medicine.confidence * 100);
  const confidenceColor = confidencePct >= 85 ? Colors.success : confidencePct >= 65 ? Colors.warning : Colors.error;

  return (
    <Card style={[styles.medCard, !medicine.selected && styles.medCardDeselected]}>
      {/* Card header */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.8} style={styles.medHeader}>
        <TouchableOpacity
          onPress={() => onToggleSelect(!medicine.selected)}
          style={[styles.checkbox, medicine.selected && styles.checkboxSelected]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: medicine.selected }}
        >
          {medicine.selected && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.medInfo}>
          <Text style={[styles.medName, !medicine.selected && styles.medNameDeselected]} numberOfLines={1}>
            {medicine.editedName}
          </Text>
          <View style={styles.medMeta}>
            {medicine.editedDosage ? <Text style={styles.metaChip}>{medicine.editedDosage}</Text> : null}
            {medicine.editedFrequency ? <Text style={styles.metaChip}>{medicine.editedFrequency}</Text> : null}
          </View>
        </View>

        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidence, { color: confidenceColor }]}>{confidencePct}%</Text>
          <Text style={styles.confidenceLabel}>confidence</Text>
        </View>

        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Editable fields */}
      {isExpanded && (
        <View style={styles.editFields}>
          <View style={styles.divider} />
          <EditField label="Medication name" value={medicine.editedName} onEdit={(v) => onEdit('editedName', v)} />
          <EditField label="Dosage" value={medicine.editedDosage} onEdit={(v) => onEdit('editedDosage', v)} placeholder="e.g. 500mg" />
          <EditField label="Frequency" value={medicine.editedFrequency} onEdit={(v) => onEdit('editedFrequency', v)} placeholder="e.g. twice daily" />
          <EditField label="Duration" value={medicine.editedDuration} onEdit={(v) => onEdit('editedDuration', v)} placeholder="e.g. 5 days" />
          <EditField label="Instructions" value={medicine.editedInstructions} onEdit={(v) => onEdit('editedInstructions', v)} placeholder="e.g. after meals" />

          {medicine.confidence < 0.7 && (
            <View style={styles.lowConfidenceWarning}>
              <Text style={styles.lowConfidenceText}>
                ⚠️ Low confidence ({confidencePct}%). Please verify this information carefully.
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

function EditField({ label, value, onEdit, placeholder }: { label: string; value: string; onEdit: (v: string) => void; placeholder?: string }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value}
        onChangeText={onEdit}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        placeholderTextColor={Colors.textTertiary}
      />
    </View>
  );
}

// Helpers
function inferFrequency(freq: string): string {
  const lower = freq.toLowerCase();
  if (lower.includes('once') || lower.includes('od')) return 'ONCE_DAILY';
  if (lower.includes('twice') || lower.includes('bd') || lower.includes('bid')) return 'TWICE_DAILY';
  if (lower.includes('three') || lower.includes('tds') || lower.includes('tid')) return 'THREE_TIMES_DAILY';
  if (lower.includes('four') || lower.includes('qid')) return 'FOUR_TIMES_DAILY';
  if (lower.includes('week')) return 'WEEKLY';
  if (lower.includes('need') || lower.includes('sos') || lower.includes('prn')) return 'AS_NEEDED';
  return 'ONCE_DAILY';
}

function parseDuration(duration: string): string | undefined {
  if (!duration) return undefined;
  const match = /(\d+)\s*day/i.exec(duration);
  if (match) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(match[1]));
    return d.toISOString().split('T')[0];
  }
  return undefined;
}

function suggestScheduleTime(freq: string): Array<{ time: string; mealRelation: string }> {
  const f = inferFrequency(freq);
  const map: Record<string, Array<{ time: string; mealRelation: string }>> = {
    ONCE_DAILY: [{ time: '08:00', mealRelation: 'AFTER_MEAL' }],
    TWICE_DAILY: [{ time: '08:00', mealRelation: 'AFTER_MEAL' }, { time: '20:00', mealRelation: 'AFTER_MEAL' }],
    THREE_TIMES_DAILY: [{ time: '08:00', mealRelation: 'AFTER_MEAL' }, { time: '14:00', mealRelation: 'AFTER_MEAL' }, { time: '20:00', mealRelation: 'AFTER_MEAL' }],
    FOUR_TIMES_DAILY: [{ time: '08:00', mealRelation: 'ANY' }, { time: '12:00', mealRelation: 'ANY' }, { time: '16:00', mealRelation: 'ANY' }, { time: '20:00', mealRelation: 'ANY' }],
  };
  return map[f] ?? [{ time: '08:00', mealRelation: 'ANY' }];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[5], paddingBottom: Spacing[3] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  content: { padding: Spacing[5] },
  prescriptionInfo: { padding: Spacing[4], marginBottom: Spacing[4] },
  doctorName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  prescDate: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  aiNotice: { backgroundColor: Colors.primarySurface, borderRadius: 12, padding: Spacing[4], marginBottom: Spacing[4] },
  aiNoticeText: { fontSize: Typography.fontSize.sm, color: Colors.primary, lineHeight: 20 },
  medCard: { marginBottom: Spacing[3], padding: 0, overflow: 'hidden' },
  medCardDeselected: { opacity: 0.6 },
  medHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: Colors.textInverse, fontSize: 12, fontWeight: Typography.fontWeight.bold },
  medInfo: { flex: 1 },
  medName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  medNameDeselected: { color: Colors.textTertiary },
  medMeta: { flexDirection: 'row', gap: Spacing[2], marginTop: 4, flexWrap: 'wrap' },
  metaChip: { fontSize: Typography.fontSize.xs, backgroundColor: Colors.gray100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full, color: Colors.textSecondary },
  confidenceContainer: { alignItems: 'center' },
  confidence: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.bold },
  confidenceLabel: { fontSize: 10, color: Colors.textTertiary },
  expandIcon: { fontSize: 12, color: Colors.textTertiary, marginLeft: 4 },
  editFields: { paddingHorizontal: Spacing[4], paddingBottom: Spacing[4] },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing[3] },
  editField: { marginBottom: Spacing[3] },
  editLabel: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary, marginBottom: 4 },
  editInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
    fontSize: Typography.fontSize.md, color: Colors.textPrimary, backgroundColor: Colors.surface,
  },
  lowConfidenceWarning: { backgroundColor: Colors.warningSurface, borderRadius: 10, padding: Spacing[3], marginTop: Spacing[2] },
  lowConfidenceText: { fontSize: Typography.fontSize.xs, color: Colors.warning, lineHeight: 18 },
  disclaimer: { backgroundColor: Colors.gray50, borderRadius: 12, padding: Spacing[4], marginTop: Spacing[2] },
  disclaimerText: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  confirmBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, padding: Spacing[4],
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingBottom: Spacing[6],
  },
  confirmCount: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  confirmBtn: { flex: 1 },
});
