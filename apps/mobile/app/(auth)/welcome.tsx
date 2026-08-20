import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../src/components/ui/Button';
import { Colors, Typography, Spacing } from '../../src/lib/theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: '📷', title: 'Scan Prescriptions', desc: 'AI-powered OCR extracts your medications automatically' },
  { icon: '⏰', title: 'Smart Reminders', desc: 'Never miss a dose with personalized notifications' },
  { icon: '📊', title: 'Track Adherence', desc: 'Monitor your medication history and streaks' },
  { icon: '🔔', title: 'Refill Alerts', desc: 'Get warned before you run out of medicine' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={styles.hero}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <Text style={styles.logo}>💊</Text>
            <Text style={styles.appName}>MediLoop</Text>
            <Text style={styles.tagline}>
              Your smart medication{'\n'}management companion
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Everything you need</Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🏥 MediLoop is a medication management tool. It does not replace medical advice from a qualified healthcare professional.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Get Started"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
            size="lg"
            fullWidth
          />
          <Button
            label="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="ghost"
            size="md"
            fullWidth
            style={styles.loginBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  hero: {
    paddingBottom: Spacing[8],
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: Spacing[8],
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[4],
  },
  logo: { fontSize: 72, marginBottom: Spacing[3] },
  appName: {
    fontSize: 40,
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.textInverse,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: Typography.fontSize.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: Spacing[2],
  },
  body: { flex: 1 },
  bodyContent: { padding: Spacing[5], paddingBottom: Spacing[10] },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[4],
    marginTop: Spacing[2],
  },
  features: { gap: Spacing[4], marginBottom: Spacing[5] },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[4],
  },
  featureIcon: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primarySurface,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { fontSize: 22 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    backgroundColor: Colors.infoSurface,
    borderRadius: 12,
    padding: Spacing[4],
    marginBottom: Spacing[5],
  },
  disclaimerText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.info,
    lineHeight: 18,
    textAlign: 'center',
  },
  actions: { gap: Spacing[2] },
  loginBtn: { marginTop: Spacing[1] },
});
