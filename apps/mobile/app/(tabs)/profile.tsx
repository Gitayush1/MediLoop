import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth.store';
import { useMe } from '../../src/hooks/useUser';
import { Card } from '../../src/components/ui/Card';
import { Skeleton } from '../../src/components/ui/LoadingSkeleton';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import { DISCLAIMER } from '../../src/lib/constants';
import { usersService } from '../../src/services/users.service';
import { useQueryClient } from '@tanstack/react-query';

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const { data: me, isLoading } = useMe();
  const qc = useQueryClient();

  const [notifPrefs, setNotifPrefs] = useState({
    doseReminders: true,
    missedDoseAlerts: true,
    refillAlerts: true,
    caregiverAlerts: true,
  });

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all medication data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersService.deleteAccount();
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const updateNotifPref = async (key: keyof typeof notifPrefs, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: value }));
    try {
      await usersService.updateNotificationPreferences({ [key]: value });
    } catch {
      setNotifPrefs((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const profile = me?.profile;
  const fullName = profile ? `${profile.firstName} ${profile.lastName ?? ''}`.trim() : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* User card */}
        <Card style={styles.userCard}>
          {isLoading ? (
            <View style={styles.userRow}>
              <Skeleton width={64} height={64} borderRadius={32} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="80%" height={14} />
              </View>
            </View>
          ) : (
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile?.firstName?.charAt(0).toUpperCase() ?? '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{fullName || 'Set up your name'}</Text>
                <Text style={styles.userEmail}>{me?.email}</Text>
                {!me?.emailVerified && (
                  <View style={styles.unverifiedBadge}>
                    <Text style={styles.unverifiedText}>⚠️ Email not verified</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push('/profile/edit')}
            style={styles.editProfileBtn}
            accessibilityRole="button"
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* Stats */}
        {me?.stats && (
          <View style={styles.statsRow}>
            <StatChip value={me.stats.activeMedications} label="Active medications" icon="💊" />
            <StatChip value={me.stats.prescriptions} label="Prescriptions" icon="📋" />
          </View>
        )}

        {/* Notification preferences */}
        <SectionHeader title="Notifications" />
        <Card style={styles.prefsCard}>
          <PrefToggle
            label="Dose reminders"
            desc="Get notified when it's time to take your medication"
            value={notifPrefs.doseReminders}
            onChange={(v) => void updateNotifPref('doseReminders', v)}
          />
          <PrefDivider />
          <PrefToggle
            label="Missed dose alerts"
            desc="Be notified when you miss a scheduled dose"
            value={notifPrefs.missedDoseAlerts}
            onChange={(v) => void updateNotifPref('missedDoseAlerts', v)}
          />
          <PrefDivider />
          <PrefToggle
            label="Refill alerts"
            desc="Get warned when medication supply is running low"
            value={notifPrefs.refillAlerts}
            onChange={(v) => void updateNotifPref('refillAlerts', v)}
          />
          <PrefDivider />
          <PrefToggle
            label="Caregiver alerts"
            desc="Receive alerts about connected family members"
            value={notifPrefs.caregiverAlerts}
            onChange={(v) => void updateNotifPref('caregiverAlerts', v)}
          />
        </Card>

        {/* Quick links */}
        <SectionHeader title="More" />
        <Card style={styles.linksCard}>
          <MenuRow icon="👨‍👩‍👧" label="Family & Caregivers" onPress={() => router.push('/caregivers')} />
          <PrefDivider />
          <MenuRow icon="📋" label="Prescription Vault" onPress={() => router.push('/prescriptions')} />
          <PrefDivider />
          <MenuRow icon="🔔" label="Refill Center" onPress={() => router.push('/refills')} />
          <PrefDivider />
          <MenuRow icon="🔐" label="Change Password" onPress={() => router.push('/(auth)/forgot-password')} />
        </Card>

        {/* Danger zone */}
        <SectionHeader title="Account" />
        <Card style={styles.linksCard}>
          <TouchableOpacity onPress={handleLogout} style={styles.menuRow} accessibilityRole="button">
            <Text style={styles.menuIcon}>🚪</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Log Out</Text>
          </TouchableOpacity>
          <PrefDivider />
          <TouchableOpacity onPress={handleDeleteAccount} style={styles.menuRow} accessibilityRole="button">
            <Text style={styles.menuIcon}>🗑️</Text>
            <Text style={[styles.menuLabel, { color: Colors.error }]}>Delete Account</Text>
          </TouchableOpacity>
        </Card>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
        </View>

        <View style={{ height: Spacing[6] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function StatChip({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <Card style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function PrefToggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.prefRow}>
      <View style={styles.prefInfo}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefDesc}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.gray200, true: Colors.primaryLight }}
        thumbColor={value ? Colors.primary : Colors.gray400}
        accessibilityLabel={label}
      />
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuRow} accessibilityRole="button">
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

function PrefDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[5] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[5] },
  userCard: { padding: Spacing[4], marginBottom: Spacing[4] },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[4] },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary },
  avatarText: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  userEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  unverifiedBadge: { marginTop: 4, backgroundColor: Colors.warningSurface, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  unverifiedText: { fontSize: Typography.fontSize.xs, color: Colors.warning },
  editProfileBtn: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg, padding: Spacing[3], alignItems: 'center' },
  editProfileText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.primary },
  statsRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  statChip: { flex: 1, padding: Spacing[4], alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.primary },
  statLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing[3], marginTop: Spacing[2] },
  prefsCard: { marginBottom: Spacing[4], padding: 0, overflow: 'hidden' },
  prefRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[4] },
  prefInfo: { flex: 1, marginRight: Spacing[3] },
  prefLabel: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  prefDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  linksCard: { marginBottom: Spacing[4], padding: 0, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], gap: Spacing[3] },
  menuIcon: { fontSize: 20, width: 28 },
  menuLabel: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textPrimary, fontWeight: Typography.fontWeight.medium },
  menuChevron: { fontSize: 20, color: Colors.textTertiary },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing[4] },
  disclaimer: { backgroundColor: Colors.gray50, borderRadius: 12, padding: Spacing[4], marginTop: Spacing[2] },
  disclaimerText: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
});
