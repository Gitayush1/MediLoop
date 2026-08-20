import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';

type BadgeVariant = 'taken' | 'missed' | 'skipped' | 'scheduled' | 'snoozed' | 'active' | 'paused' | 'completed' | 'low' | 'critical';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<BadgeVariant, { bg: string; text: string; defaultLabel: string }> = {
  taken:     { bg: Colors.successSurface, text: Colors.success,   defaultLabel: 'Taken' },
  missed:    { bg: Colors.errorSurface,   text: Colors.error,     defaultLabel: 'Missed' },
  skipped:   { bg: Colors.warningSurface, text: Colors.warning,   defaultLabel: 'Skipped' },
  scheduled: { bg: Colors.primarySurface, text: Colors.primary,   defaultLabel: 'Upcoming' },
  snoozed:   { bg: '#F5F3FF',            text: '#7C3AED',        defaultLabel: 'Snoozed' },
  active:    { bg: Colors.successSurface, text: Colors.success,   defaultLabel: 'Active' },
  paused:    { bg: Colors.warningSurface, text: Colors.warning,   defaultLabel: 'Paused' },
  completed: { bg: Colors.gray100,        text: Colors.gray500,   defaultLabel: 'Completed' },
  low:       { bg: Colors.warningSurface, text: Colors.warning,   defaultLabel: 'Low Supply' },
  critical:  { bg: Colors.errorSurface,   text: Colors.error,     defaultLabel: 'Critical' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  size = 'sm',
}) => {
  const config = BADGE_CONFIG[variant];
  const displayLabel = label ?? config.defaultLabel;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === 'md' && styles.badgeMd,
      ]}
      accessibilityLabel={displayLabel}
    >
      <Text
        style={[
          styles.label,
          { color: config.text },
          size === 'md' && styles.labelMd,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  labelMd: {
    fontSize: Typography.fontSize.sm,
  },
});
