import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCaregivers, useInviteCaregiver } from '../src/hooks/useUser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../src/services/users.service';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { BottomSheet } from '../src/components/ui/BottomSheet';
import { EmptyState } from '../src/components/ui/EmptyState';
import { inviteCaregiverSchema } from '@mediloop/shared';
import { z } from 'zod';
import { Colors, Typography, Spacing, BorderRadius } from '../src/lib/theme';

const PERMISSIONS = [
  { key: 'VIEW_MEDICATIONS', label: '💊 View Medications', desc: 'See your medication list and schedule' },
  { key: 'VIEW_ADHERENCE', label: '📊 View Adherence', desc: 'See your dose tracking statistics' },
  { key: 'VIEW_REFILL_STATUS', label: '📦 View Refill Status', desc: 'See when you are running low' },
  { key: 'VIEW_MISSED_DOSES', label: '⚠️ View Missed Doses', desc: 'Be alerted when you miss a dose' },
];

type InviteFormData = z.infer<typeof inviteCaregiverSchema>;

export default function CaregiversScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: caregivers, isLoading } = useCaregivers();
  const invite = useInviteCaregiver();
  const [showInvite, setShowInvite] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['VIEW_MEDICATIONS', 'VIEW_ADHERENCE', 'VIEW_REFILL_STATUS', 'VIEW_MISSED_DOSES']);

  const revoke = useMutation({
    mutationFn: (caregiverId: string) => usersService.revokeCaregiver(caregiverId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['caregivers'] }),
  });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteCaregiverSchema),
    defaultValues: { email: '', permissions: ['VIEW_MEDICATIONS'] },
  });

  const handleInvite = async (data: InviteFormData) => {
    try {
      await invite.mutateAsync({ email: data.email, permissions: selectedPerms as never[] });
      Alert.alert('✅ Invitation sent', `An invitation has been sent to ${data.email}`);
      setShowInvite(false);
      reset();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      Alert.alert('Error', error.response?.data?.error?.message ?? 'Failed to send invitation');
    }
  };

  const handleRevoke = (caregiverId: string, name: string) => {
    Alert.alert('Remove caregiver', `Remove ${name} as your caregiver?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => revoke.mutate(caregiverId) },
    ]);
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const caregiverList = (caregivers as Array<{
    id: string;
    caregiverId: string;
    permissions: string[];
    caregiver: { email: string; profile: { firstName: string; lastName?: string } | null };
  }>) ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Family & Caregivers</Text>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.inviteBtn} accessibilityRole="button">
          <Text style={styles.inviteBtnText}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          👨‍👩‍👧 Caregivers can monitor your medication schedule and receive alerts. You control exactly what they can see.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading caregivers...</Text>
        </View>
      ) : caregiverList.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No caregivers yet"
          description="Invite a family member or trusted person to help you manage your medications."
          actionLabel="Invite Caregiver"
          onAction={() => setShowInvite(true)}
        />
      ) : (
        <FlatList
          data={caregiverList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => {
            const name = item.caregiver.profile
              ? `${item.caregiver.profile.firstName} ${item.caregiver.profile.lastName ?? ''}`.trim()
              : item.caregiver.email;
            return (
              <Card style={styles.caregiverCard}>
                <View style={styles.caregiverHeader}>
                  <View style={styles.caregiverAvatar}>
                    <Text style={styles.caregiverAvatarText}>{name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.caregiverInfo}>
                    <Text style={styles.caregiverName}>{name}</Text>
                    <Text style={styles.caregiverEmail}>{item.caregiver.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRevoke(item.caregiverId, name)}
                    style={styles.revokeBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.revokeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.permissionsRow}>
                  {item.permissions.map((p) => (
                    <View key={p} style={styles.permBadge}>
                      <Text style={styles.permBadgeText}>{PERMISSIONS.find((x) => x.key === p)?.label ?? p}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Invite sheet */}
      <BottomSheet visible={showInvite} onClose={() => setShowInvite(false)} title="Invite Caregiver" snapPoint={0.85}>
        <Text style={styles.inviteDesc}>
          Enter the email of the person you want to invite as your caregiver. They will receive an email invitation.
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value, onBlur } }) => (
            <Input
              label="Caregiver's email"
              placeholder="family@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Text style={styles.permissionsTitle}>Permissions to grant</Text>
        {PERMISSIONS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => togglePerm(p.key)}
            style={[styles.permRow, selectedPerms.includes(p.key) && styles.permRowSelected]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selectedPerms.includes(p.key) }}
          >
            <View style={[styles.permCheck, selectedPerms.includes(p.key) && styles.permCheckSelected]}>
              {selectedPerms.includes(p.key) && <Text style={styles.permCheckMark}>✓</Text>}
            </View>
            <View style={styles.permText}>
              <Text style={styles.permLabel}>{p.label}</Text>
              <Text style={styles.permDesc}>{p.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Button
          label="Send Invitation"
          onPress={handleSubmit(handleInvite)}
          variant="primary"
          size="lg"
          fullWidth
          isLoading={invite.isPending}
          disabled={selectedPerms.length === 0}
          style={{ marginTop: Spacing[4] }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[5], paddingBottom: Spacing[3] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  inviteBtn: { backgroundColor: Colors.primarySurface, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2] },
  inviteBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.primary },
  infoCard: { marginHorizontal: Spacing[5], backgroundColor: Colors.infoSurface, borderRadius: 12, padding: Spacing[4], marginBottom: Spacing[4] },
  infoText: { fontSize: Typography.fontSize.sm, color: Colors.info, lineHeight: 20 },
  content: { padding: Spacing[5] },
  loadingText: { textAlign: 'center', color: Colors.textSecondary },
  caregiverCard: { padding: Spacing[4], marginBottom: Spacing[3] },
  caregiverHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  caregiverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
  caregiverAvatarText: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, color: Colors.primary },
  caregiverInfo: { flex: 1 },
  caregiverName: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  caregiverEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  revokeBtn: { borderWidth: 1, borderColor: Colors.error, borderRadius: BorderRadius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[1] },
  revokeBtnText: { fontSize: Typography.fontSize.xs, color: Colors.error, fontWeight: Typography.fontWeight.medium },
  permissionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  permBadge: { backgroundColor: Colors.gray100, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  permBadgeText: { fontSize: 11, color: Colors.textSecondary },
  inviteDesc: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing[4] },
  permissionsTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], borderRadius: BorderRadius.lg, backgroundColor: Colors.gray50, marginBottom: Spacing[2], borderWidth: 1.5, borderColor: 'transparent' },
  permRowSelected: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  permCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  permCheckSelected: { backgroundColor: Colors.success, borderColor: Colors.success },
  permCheckMark: { color: Colors.textInverse, fontSize: 12, fontWeight: Typography.fontWeight.bold },
  permText: { flex: 1 },
  permLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textPrimary },
  permDesc: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
