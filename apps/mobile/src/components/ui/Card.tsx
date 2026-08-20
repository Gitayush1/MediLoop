import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Shadow, Spacing } from '../../lib/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: keyof typeof Spacing | 0;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 4,
}) => {
  const paddingValue = padding === 0 ? 0 : Spacing[padding as keyof typeof Spacing];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[styles.card, { padding: paddingValue }, style]}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.card, { padding: paddingValue }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
