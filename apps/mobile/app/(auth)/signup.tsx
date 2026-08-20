import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useAuthStore } from '../../src/store/auth.store';
import { Colors, Typography, Spacing } from '../../src/lib/theme';

const schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().max(50).optional(),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await registerUser(data.email, data.password, data.firstName, data.lastName);
      router.replace('/(tabs)');
    } catch { /* error in store */ }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>💊</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start managing your medications smarter</Text>
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="First name"
                    placeholder="Ayush"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => lastNameRef.current?.focus()}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.firstName?.message}
                  />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    ref={lastNameRef}
                    label="Last name"
                    placeholder="Sharma"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                ref={emailRef}
                label="Email address"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                isPassword
                returnKeyType="next"
                onSubmitEditing={() => confirmRef.current?.focus()}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                ref={confirmRef}
                label="Confirm password"
                placeholder="Repeat your password"
                isPassword
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <View style={styles.terms}>
            <Text style={styles.termsText}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          <Button
            label="Create Account"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            style={styles.submitBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')} accessibilityRole="button">
              <Text style={styles.footerLink}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing[5] },
  back: { marginBottom: Spacing[4] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  header: { alignItems: 'center', marginBottom: Spacing[6] },
  logo: { fontSize: 48, marginBottom: Spacing[3] },
  title: { fontSize: Typography.fontSize['3xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  subtitle: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  errorBanner: { backgroundColor: Colors.errorSurface, borderRadius: 10, padding: Spacing[3], marginBottom: Spacing[4] },
  errorText: { fontSize: Typography.fontSize.sm, color: Colors.error },
  nameRow: { flexDirection: 'row', gap: Spacing[3] },
  terms: { marginBottom: Spacing[4] },
  termsText: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  submitBtn: { marginBottom: Spacing[4] },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: Spacing[4] },
  footerText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
});
