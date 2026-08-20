import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { usersService } from '../../src/services/users.service';

export default function ProfileSetupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = firstName.trim().length >= 2;

  async function handleContinue() {
    if (!isValid) return;
    setLoading(true);
    try {
      await usersService.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() || undefined, phone: phone.trim() || undefined });
      router.replace('/(onboarding)/notification-permissions');
    } catch {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepIndicator}>
              <View style={[styles.stepDot, styles.stepDotActive]} />
              <View style={styles.stepDot} />
              <View style={styles.stepDot} />
            </View>
            <Text style={styles.stepLabel}>Step 1 of 3</Text>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>
              Personalise your MediLoop experience with a few quick details.
            </Text>
          </View>

          {/* Avatar placeholder */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {firstName.trim().charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>

          {/* Fields */}
          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>First name *</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="e.g. Ayush"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Optional"
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Optional – for caregiver alerts"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="phone-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, !isValid && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Continue →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(onboarding)/notification-permissions')} style={styles.skip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing[5], paddingBottom: Spacing[8] },
  header: { alignItems: 'center', marginTop: Spacing[8], marginBottom: Spacing[6] },
  stepIndicator: { flexDirection: 'row', gap: 6, marginBottom: Spacing[2] },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
  },
  stepDotActive: { backgroundColor: Colors.primary, width: 24 },
  stepLabel: { fontSize: Typography.fontSize.sm, color: Colors.textTertiary, marginBottom: Spacing[3] },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarContainer: { alignItems: 'center', marginBottom: Spacing[6] },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  form: { gap: Spacing[4] },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  btn: {
    marginTop: Spacing[8],
    height: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { backgroundColor: Colors.gray300 },
  btnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#fff',
  },
  skip: { alignItems: 'center', marginTop: Spacing[4] },
  skipText: { fontSize: Typography.fontSize.sm, color: Colors.textTertiary },
});
