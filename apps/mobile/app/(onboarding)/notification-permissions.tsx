import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/lib/theme';

const BENEFITS = [
  { icon: '💊', title: 'Dose Reminders', desc: 'Never miss a medication at the right time' },
  { icon: '⏰', title: 'Missed Dose Alerts', desc: 'Get notified if you forget a dose' },
  { icon: '🔔', title: 'Refill Warnings', desc: 'Know before you run out of medicine' },
  { icon: '👨‍👩‍👧', title: 'Caregiver Alerts', desc: 'Keep family members informed and safe' },
];

export default function NotificationPermissionsScreen() {
  const [requesting, setRequesting] = useState(false);

  async function handleAllow() {
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        router.replace('/(onboarding)/caregiver-intro');
      } else {
        Alert.alert(
          'Notifications disabled',
          'You can enable notifications later in your phone Settings → MediLoop.',
          [{ text: 'Continue anyway', onPress: () => router.replace('/(onboarding)/caregiver-intro') }],
        );
      }
    } catch {
      router.replace('/(onboarding)/caregiver-intro');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Step dots */}
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepLabel}>Step 2 of 3</Text>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🔔</Text>
          <Text style={styles.title}>Stay on track{'\n'}with reminders</Text>
          <Text style={styles.subtitle}>
            MediLoop needs permission to send you timely reminders so you never miss a dose.
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Text style={styles.benefitEmoji}>{b.icon}</Text>
              </View>
              <View style={styles.benefitText}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleAllow}
            disabled={requesting}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Allow Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(onboarding)/caregiver-intro')}
            style={styles.skip}
          >
            <Text style={styles.skipText}>Maybe later</Text>
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
  hero: { alignItems: 'center', marginVertical: Spacing[8] },
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
  benefits: { gap: Spacing[3] },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.sm,
  },
  benefitIcon: {
    width: 44, height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitEmoji: { fontSize: 22 },
  benefitText: { flex: 1 },
  benefitTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  actions: { marginTop: 'auto', gap: Spacing[3] },
  btn: {
    height: 54,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  btnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: '#fff',
  },
  skip: { alignItems: 'center', paddingVertical: Spacing[2] },
  skipText: { fontSize: Typography.fontSize.sm, color: Colors.textTertiary },
});
