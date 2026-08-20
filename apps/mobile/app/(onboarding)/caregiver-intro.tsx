import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/lib/theme';

const FEATURES = [
  { icon: '👁️', text: 'View your medication schedule' },
  { icon: '✅', text: 'Track whether doses were taken' },
  { icon: '🔁', text: 'Monitor refill levels and alerts' },
  { icon: '📋', text: 'See adherence statistics' },
];

export default function CaregiverIntroScreen() {
  function handleGetStarted() {
    router.replace('/(tabs)');
  }

  function handleInviteCaregiver() {
    // Navigate to the main app first, then open caregiver screen
    router.replace('/(tabs)');
    // Delay to allow tab navigation to mount
    setTimeout(() => router.push('/caregivers'), 300);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Step dots */}
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>
        <Text style={styles.stepLabel}>Step 3 of 3</Text>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.title}>Care together,{'\n'}stay safer</Text>
          <Text style={styles.subtitle}>
            Invite a family member or carer to monitor your medications — with only the access you choose.
          </Text>
        </View>

        {/* Permission card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Caregivers can:</Text>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.safetyRow}>
            <Text style={styles.safetyIcon}>🔒</Text>
            <Text style={styles.safetyText}>
              Caregivers can never modify your prescriptions or medication instructions.
            </Text>
          </View>
        </View>

        {/* CTAs */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleInviteCaregiver}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Invite a Caregiver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>Start without caregiver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingBottom: Spacing[8],
  },
  stepRow: { flexDirection: 'row', gap: 6, marginTop: Spacing[8], justifyContent: 'center' },
  stepDot: {
    width: 8, height: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.gray200,
  },
  stepDotActive: { backgroundColor: Colors.primary, width: 24 },
  stepLabel: {
    textAlign: 'center',
    marginTop: Spacing[2],
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  hero: { alignItems: 'center', marginVertical: Spacing[6] },
  heroEmoji: { fontSize: 64, marginBottom: Spacing[4] },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[3],
    lineHeight: 34,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    ...Shadow.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  featureIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  featureText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing[3] },
  safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[3] },
  safetyIcon: { fontSize: 16 },
  safetyText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
    lineHeight: 20,
  },
  actions: { marginTop: 'auto', gap: Spacing[3] },
  primaryBtn: {
    height: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  primaryBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#fff',
  },
  secondaryBtn: {
    height: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
});
