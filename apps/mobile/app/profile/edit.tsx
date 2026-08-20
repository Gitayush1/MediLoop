import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@mediloop/shared';
import { z } from 'zod';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useMe, useUpdateProfile } from '../../src/hooks/useUser';
import { Colors, Typography, Spacing } from '../../src/lib/theme';

type FormData = z.infer<typeof updateProfileSchema>;

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: me } = useMe();
  const updateProfile = useUpdateProfile();
  const profile = me?.profile;

  const { control, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
      dateOfBirth: profile?.dateOfBirth
        ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
        : '',
      timezone: profile?.timezone ?? 'Asia/Kolkata',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Filter empty strings → undefined
      const clean = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== '' && v !== undefined),
      ) as FormData;
      await updateProfile.mutateAsync(clean);
      Alert.alert('✅ Profile updated');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar placeholder */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.firstName ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity accessibilityRole="button">
              <Text style={styles.changePhotoText}>Change photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Personal Information</Text>

          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="First name *"
                    placeholder="Ayush"
                    autoCapitalize="words"
                    value={value ?? ''}
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
                    label="Last name"
                    placeholder="Sharma"
                    autoCapitalize="words"
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
            name="phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Phone number"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="dateOfBirth"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Date of birth"
                placeholder="YYYY-MM-DD"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.dateOfBirth?.message}
                hint="Format: YYYY-MM-DD"
              />
            )}
          />

          <Text style={styles.sectionLabel}>Preferences</Text>

          <Text style={styles.fieldLabel}>Timezone</Text>
          <Controller
            control={control}
            name="timezone"
            render={({ field: { onChange, value } }) => (
              <View style={styles.tzList}>
                {TIMEZONES.map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    onPress={() => onChange(tz)}
                    style={[styles.tzOption, value === tz && styles.tzOptionActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: value === tz }}
                  >
                    <Text style={[styles.tzText, value === tz && styles.tzTextActive]}>
                      {tz}
                    </Text>
                    {value === tz && <Text style={styles.tzCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          />

          <Button
            label="Save Changes"
            onPress={handleSubmit(onSubmit)}
            variant="primary"
            size="lg"
            fullWidth
            isLoading={updateProfile.isPending}
            disabled={!isDirty}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[5], paddingBottom: Spacing[3],
  },
  cancelText: { fontSize: Typography.fontSize.md, color: Colors.primary },
  title: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  form: { padding: Spacing[5] },
  avatarSection: { alignItems: 'center', marginBottom: Spacing[6] },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primarySurface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.primary, marginBottom: Spacing[2],
  },
  avatarText: { fontSize: 32, fontWeight: Typography.fontWeight.bold, color: Colors.primary },
  changePhotoText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  sectionLabel: {
    fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing[3], marginTop: Spacing[2],
  },
  nameRow: { flexDirection: 'row', gap: Spacing[3] },
  fieldLabel: {
    fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary, marginBottom: Spacing[2],
  },
  tzList: { gap: Spacing[2], marginBottom: Spacing[5] },
  tzOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[3], borderRadius: 10, backgroundColor: Colors.gray100,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tzOptionActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  tzText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  tzTextActive: { color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  tzCheck: { color: Colors.primary, fontWeight: Typography.fontWeight.bold },
  saveBtn: { marginTop: Spacing[4] },
});
