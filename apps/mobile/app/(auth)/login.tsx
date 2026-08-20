import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const passwordRef = useRef<TextInput>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login(data.email, data.password);
      router.replace('/(tabs)');
    } catch {
      // error displayed from store
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.back}
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>💊</Text>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue managing your medications</Text>
          </View>

          {/* Error banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
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
                  placeholder="Your password"
                  isPassword
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
              accessibilityRole="button"
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              style={styles.submitBtn}
            />

            {/* Demo credentials hint */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Demo Account',
                  'Email: demo@mediloop.app\nPassword: Demo@1234',
                  [{ text: 'OK' }]
                );
              }}
              style={styles.demoHint}
            >
              <Text style={styles.demoHintText}>View demo credentials</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              accessibilityRole="button"
            >
              <Text style={styles.footerLink}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing[5] },
  back: { marginBottom: Spacing[4] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  header: { alignItems: 'center', marginBottom: Spacing[8] },
  logo: { fontSize: 48, marginBottom: Spacing[3] },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: Colors.errorSurface,
    borderRadius: 10,
    padding: Spacing[3],
    marginBottom: Spacing[4],
  },
  errorBannerText: { fontSize: Typography.fontSize.sm, color: Colors.error, lineHeight: 20 },
  form: { gap: 0 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: Spacing[4], marginTop: -Spacing[2] },
  forgotPasswordText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  submitBtn: { marginTop: Spacing[2] },
  demoHint: { alignItems: 'center', marginTop: Spacing[3] },
  demoHintText: { fontSize: Typography.fontSize.sm, color: Colors.textTertiary },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing[8] },
  footerText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  footerLink: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
});
