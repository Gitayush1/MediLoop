import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      containerStyle,
      isPassword = false,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasError = !!error;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={styles.label} accessibilityRole="text">
            {label}
          </Text>
        )}

        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.focused,
            hasError && styles.error,
          ]}
        >
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

          <TextInput
            ref={ref}
            style={[styles.input, leftIcon ? styles.inputWithLeft : null]}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={isPassword && !showPassword}
            placeholderTextColor={Colors.textTertiary}
            accessibilityLabel={label}
            accessibilityHint={hint}
            {...props}
          />

          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.rightIcon}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            >
              <Text style={styles.passwordToggle}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          )}

          {rightIcon && !isPassword && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>

        {(error || hint) && (
          <Text style={[styles.hint, hasError && styles.errorText]} accessibilityRole="alert">
            {error ?? hint}
          </Text>
        )}
      </View>
    );
  },
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  focused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  error: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  inputWithLeft: {
    paddingLeft: Spacing[2],
  },
  leftIcon: {
    paddingLeft: Spacing[3],
  },
  rightIcon: {
    paddingRight: Spacing[3],
  },
  passwordToggle: {
    fontSize: 16,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
  },
  errorText: {
    color: Colors.error,
  },
});
