import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../lib/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <View style={styles.container} accessibilityRole="text">
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
    {actionLabel && onAction && (
      <Button
        label={actionLabel}
        onPress={onAction}
        variant="primary"
        style={styles.action}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  icon: {
    fontSize: 56,
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
  action: {
    marginTop: Spacing[2],
    minWidth: 160,
  },
});
