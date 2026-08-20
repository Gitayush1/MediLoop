import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../lib/theme';
import { StatusBadge } from '../ui/StatusBadge';
import { FREQUENCY_LABELS } from '../../lib/constants';
import type { Medication } from '../../services/medications.service';

interface MedicationCardProps {
  medication: Medication;
  onPress?: () => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({ medication, onPress }) => {
  const color = medication.color ?? Colors.primary;
  const statusVariant =
    medication.status === 'ACTIVE'
      ? 'active'
      : medication.status === 'PAUSED'
        ? 'paused'
        : 'completed';

  const refill = medication.refillPrediction;
  const isRunningLow = refill?.isRunningLow === true;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${FREQUENCY_LABELS[medication.frequency] ?? medication.frequency}`}
    >
      {/* Color accent bar */}
      <View style={[styles.accentBar, { backgroundColor: color }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.pill}>
            <Text style={[styles.pillText, { color }]}>💊</Text>
          </View>
          <View style={styles.titleGroup}>
            <Text style={styles.name} numberOfLines={1}>
              {medication.name}
            </Text>
            {medication.dosage && (
              <Text style={styles.dosage}>{medication.dosage}</Text>
            )}
          </View>
          <StatusBadge variant={statusVariant} size="sm" />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Details row */}
        <View style={styles.detailRow}>
          <DetailChip
            icon="🔄"
            label={FREQUENCY_LABELS[medication.frequency] ?? medication.frequency}
          />
          {medication.schedules[0] && (
            <DetailChip icon="🕐" label={medication.schedules[0].timeOfDay} />
          )}
          {medication.currentQuantity !== undefined && (
            <DetailChip
              icon={isRunningLow ? '⚠️' : '📦'}
              label={`${medication.currentQuantity} ${medication.unit ?? 'units'}`}
              highlight={isRunningLow}
            />
          )}
        </View>

        {/* Refill warning */}
        {isRunningLow && refill && (
          <View style={styles.refillWarning}>
            <Text style={styles.refillText}>
              🔴 Refill needed
              {refill.daysLeft !== undefined ? ` · ${refill.daysLeft}d left` : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface DetailChipProps {
  icon: string;
  label: string;
  highlight?: boolean;
}

const DetailChip: React.FC<DetailChipProps> = ({ icon, label, highlight }) => (
  <View style={[styles.chip, highlight && styles.chipHighlight]}>
    <Text style={styles.chipIcon}>{icon}</Text>
    <Text
      style={[styles.chipLabel, highlight && styles.chipLabelHighlight]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },
  content: {
    flex: 1,
    padding: Spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  pill: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 18 },
  titleGroup: { flex: 1 },
  name: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  dosage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing[3],
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
  },
  chipHighlight: {
    backgroundColor: Colors.warningSurface,
  },
  chipIcon: { fontSize: 11 },
  chipLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  chipLabelHighlight: {
    color: Colors.warning,
  },
  refillWarning: {
    marginTop: Spacing[3],
    backgroundColor: Colors.errorSurface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  refillText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    fontWeight: Typography.fontWeight.medium,
  },
});
