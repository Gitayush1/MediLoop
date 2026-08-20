import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../lib/theme';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We ran into an unexpected error. Please try again.',
  onRetry,
}) => (
  <View style={styles.container}>
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <Button
        label="Try Again"
        onPress={onRetry}
        variant="outline"
        style={styles.button}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[10],
  },
  icon: { fontSize: 48, marginBottom: Spacing[3] },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  message: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing[4],
  },
  button: { minWidth: 140 },
});
