import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { authService } from '../../src/services/auth.service';
import { Colors, Typography, Spacing } from '../../src/lib/theme';

const schema = z.object({ email: z.string().email('Enter a valid email') });
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await authService.forgotPassword(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>📬</Text>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successDesc}>
            If an account exists for this email, we've sent a password reset link. Check your inbox and spam folder.
          </Text>
          <Button label="Back to Login" onPress={() => router.replace('/(auth)/login')} variant="primary" size="lg" style={{ marginTop: Spacing[6] }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Button
          label="Send Reset Link"
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          style={{ marginTop: Spacing[2] }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing[5] },
  back: { marginBottom: Spacing[4] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  header: { alignItems: 'center', marginBottom: Spacing[8] },
  icon: { fontSize: 56, marginBottom: Spacing[4] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  successIcon: { fontSize: 72, marginBottom: Spacing[4] },
  successTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  successDesc: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
