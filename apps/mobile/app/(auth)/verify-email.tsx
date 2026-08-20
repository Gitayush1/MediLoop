import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../src/services/auth.service';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing } from '../../src/lib/theme';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please request a new one.');
      return;
    }

    authService.verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      })
      .catch((err: unknown) => {
        const e = err as { response?: { data?: { error?: { message?: string } } } };
        setStatus('error');
        setMessage(e.response?.data?.error?.message ?? 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {status === 'loading' && (
          <>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Verifying your email...</Text>
          </>
        )}

        {status === 'success' && (
          <>
            <Text style={styles.icon}>✅</Text>
            <Text style={styles.title}>Email Verified!</Text>
            <Text style={styles.message}>{message}</Text>
            <Button
              label="Go to App"
              onPress={() => router.replace('/(tabs)')}
              variant="primary"
              size="lg"
              style={styles.btn}
            />
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.icon}>❌</Text>
            <Text style={styles.title}>Verification Failed</Text>
            <Text style={styles.message}>{message}</Text>
            <Button
              label="Back to Login"
              onPress={() => router.replace('/(auth)/login')}
              variant="primary"
              size="lg"
              style={styles.btn}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  icon: { fontSize: 72, marginBottom: Spacing[5] },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[6],
  },
  loadingText: {
    marginTop: Spacing[4],
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  btn: { minWidth: 200 },
});
