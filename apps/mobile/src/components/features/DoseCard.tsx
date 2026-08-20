import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../lib/theme';
import { StatusBadge } from '../ui/StatusBadge';
import { STATUS_LABELS, MEAL_RELATION_LABELS } from '../../lib/constants';
import type { DoseEvent } from '../../services/doses.service';

interface DoseCardProps {
  dose: DoseEvent;
  onTake?: () => void;
  onSkip?: () => void;
  onSnooze?: () => void;
  isLoading?: boolean;
}

export const DoseCard: React.FC<DoseCardProps> = ({
  dose,
  onTake,
  onSkip,
  onSnooze,
  isLoading = false,
}) => {
  const isPending = dose.status === 'SCHEDULED' || dose.status === 'SNOOZED';
  const color = dose.medication.color ?? Colors.primary;

  const scheduledTime = new Date(dose.scheduledAt);
  const timeStr = scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusVariant = dose.status.toLowerCase() as Parameters<typeof StatusBadge>[0]['variant'];

  return (
    <View
      style={[styles.card, !isPending && styles.cardDone]}
      accessibilityLabel={`${dose.medication.name} at ${timeStr}, status: ${STATUS_LABELS[dose.status]}`}
    >
      {/* Time column */}
      <View style={styles.timeColumn}>
        <Text style={styles.time}>{timeStr}</Text>
        <Text style={styles.mealRelation}>
          {MEAL_RELATION_LABELS[dose.schedule.mealRelation] ?? dose.schedule.mealRelation}
        </Text>
      </View>

      {/* Vertical line */}
      <View style={styles.timeline}>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: isPending ? color : dose.status === 'TAKEN' ? Colors.success : Colors.gray300,
            },
          ]}
        />
        <View style={styles.line} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.medName} numberOfLines={1}>
              {dose.medication.name}
            </Text>
            {dose.medication.dosage && (
              <Text style={styles.dosage}>{dose.medication.dosage}</Text>
            )}
          </View>
          <StatusBadge variant={statusVariant} size="sm" />
        </View>

        {/* Action buttons for pending doses */}
        {isPending && (
          <View style={styles.actions}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <TouchableOpacity
                  onPress={onTake}
                  style={styles.takeBtn}
                  activeOpacity={0.8}
                  accessibilityLabel={`Mark ${dose.medication.name} as taken`}
                  accessibilityRole="button"
                >
                  <Text style={styles.takeBtnText}>✓ Taken</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSnooze}
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Snooze 15 minutes"
                >
                  <Text style={styles.secondaryBtnText}>⏰</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSkip}
                  style={styles.secondaryBtn}
                  activeOpacity={0.8}
                  accessibilityLabel="Skip this dose"
                >
                  <Text style={styles.secondaryBtnText}>✕</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Taken time */}
        {dose.status === 'TAKEN' && dose.takenAt && (
          <Text style={styles.takenAt}>
            Taken at {new Date(dose.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {/* Snoozed until */}
        {dose.status === 'SNOOZED' && dose.snoozedUntil && (
          <Text style={styles.snoozedText}>
            Snoozed until {new Date(dose.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing[3],
    overflow: 'hidden',
  },
  cardDone: {
    opacity: 0.75,
  },
  timeColumn: {
    width: 68,
    paddingVertical: Spacing[4],
    paddingLeft: Spacing[3],
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  time: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  mealRelation: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    lineHeight: 14,
  },
  timeline: {
    width: 20,
    alignItems: 'center',
    paddingTop: Spacing[5],
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingVertical: Spacing[4],
    paddingRight: Spacing[4],
    paddingLeft: Spacing[2],
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  nameRow: { flex: 1 },
  medName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  dosage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  takeBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  takeBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.sm,
  },
  secondaryBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  takenAt: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[2],
  },
  snoozedText: {
    fontSize: Typography.fontSize.xs,
    color: '#7C3AED',
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing[2],
  },
});
