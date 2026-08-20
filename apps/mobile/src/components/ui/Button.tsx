import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  labelStyle,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textInverse}
        />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text
            style={[
              styles.label,
              styles[`${variant}Label` as keyof typeof styles],
              styles[`${size}Label` as keyof typeof styles],
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },

  // Sizes
  sm: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], minHeight: 36 },
  md: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], minHeight: 48 },
  lg: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[4], minHeight: 56 },

  // Labels
  label: {
    fontWeight: Typography.fontWeight.semibold,
  },
  primaryLabel: { color: Colors.textInverse },
  secondaryLabel: { color: Colors.textInverse },
  outlineLabel: { color: Colors.primary },
  ghostLabel: { color: Colors.primary },
  dangerLabel: { color: Colors.textInverse },

  smLabel: { fontSize: Typography.fontSize.sm },
  mdLabel: { fontSize: Typography.fontSize.md },
  lgLabel: { fontSize: Typography.fontSize.lg },

  // Icon spacing
  leftIcon: { marginRight: Spacing[2] },
  rightIcon: { marginLeft: Spacing[2] },
});
