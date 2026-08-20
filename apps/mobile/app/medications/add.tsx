import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMedicationSchema } from '@mediloop/shared';
import { z } from 'zod';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useCreateMedication } from '../../src/hooks/useMedications';
import { FREQUENCY_LABELS, MEDICATION_FORM_LABELS, MEAL_RELATION_LABELS } from '../../src/lib/constants';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';

type FormData = z.infer<typeof createMedicationSchema>;

const FREQUENCIES = Object.entries(FREQUENCY_LABELS).map(([k, v]) => ({ key: k, label: v }));
const FORMS = Object.entries(MEDICATION_FORM_LABELS).map(([k, v]) => ({ key: k, label: v }));
const MEAL_RELATIONS = Object.entries(MEAL_RELATION_LABELS).map(([k, v]) => ({ key: k, label: v }));

export default function AddMedicationScreen() {
  const router = useRouter();
  const createMed = useCreateMedication();
  const [step, setStep] = useState(1);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createMedicationSchema),
    defaultValues: {
      frequency: 'ONCE_DAILY',
      startDate: new Date().toISOString().split('T')[0],
      scheduleTimes: [{ time: '08:00', mealRelation: 'ANY' }],
    },
  });

  const frequency = watch('frequency');

  // Suggest schedule times based on frequency
  const suggestTimes = (freq: string) => {
    const timeMap: Record<string, string[]> = {
      ONCE_DAILY: ['08:00'],
      TWICE_DAILY: ['08:00', '20:00'],
      THREE_TIMES_DAILY: ['08:00', '14:00', '20:00'],
      FOUR_TIMES_DAILY: ['08:00', '12:00', '16:00', '20:00'],
    };
    const times = timeMap[freq] ?? ['08:00'];
    setValue('scheduleTimes', times.map((t) => ({ time: t, mealRelation: 'ANY' })));
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createMed.mutateAsync(data);
      Alert.alert('✅ Medication added', `${data.name} has been added to your medications.`, [
        { text: 'View', onPress: () => router.replace('/(tabs)/medications') },
        { text: 'Add another', onPress: () => router.replace('/medications/add') },
      ]);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      Alert.alert('Error', error.response?.data?.error?.message ?? 'Failed to add medication');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
            <Text style={styles.backText}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Medication</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepDot, s <= step && styles.stepDotActive, s < step && styles.stepDotDone]}>
                <Text style={[styles.stepNum, s <= step && styles.stepNumActive]}>
                  {s < step ? '✓' : s}
                </Text>
              </View>
              {s < 3 && <View style={[styles.stepLine, s < step && styles.stepLineDone]} />}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Step 1: Basic info */}
          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>Basic Information</Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Medication name *"
                    placeholder="e.g. Metformin"
                    autoCapitalize="words"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="dosage"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Dosage"
                    placeholder="e.g. 500mg"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Text style={styles.fieldLabel}>Form</Text>
              <View style={styles.chipGrid}>
                <Controller
                  control={control}
                  name="form"
                  render={({ field: { onChange, value } }) => (
                    <>
                      {FORMS.map((f) => (
                        <TouchableOpacity
                          key={f.key}
                          onPress={() => onChange(f.key)}
                          style={[styles.chip, value === f.key && styles.chipActive]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: value === f.key }}
                        >
                          <Text style={[styles.chipText, value === f.key && styles.chipTextActive]}>
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                />
              </View>

              <Button label="Next →" onPress={() => setStep(2)} variant="primary" size="lg" fullWidth style={{ marginTop: Spacing[4] }} />
            </View>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>Schedule</Text>

              <Text style={styles.fieldLabel}>Frequency *</Text>
              <View style={styles.chipGrid}>
                <Controller
                  control={control}
                  name="frequency"
                  render={({ field: { onChange, value } }) => (
                    <>
                      {FREQUENCIES.map((f) => (
                        <TouchableOpacity
                          key={f.key}
                          onPress={() => { onChange(f.key); suggestTimes(f.key); }}
                          style={[styles.chip, value === f.key && styles.chipActive]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: value === f.key }}
                        >
                          <Text style={[styles.chipText, value === f.key && styles.chipTextActive]}>
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                />
              </View>

              <Controller
                control={control}
                name="startDate"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Start date *"
                    placeholder="YYYY-MM-DD"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.startDate?.message}
                    hint="Format: YYYY-MM-DD"
                  />
                )}
              />

              <Controller
                control={control}
                name="endDate"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="End date (optional)"
                    placeholder="YYYY-MM-DD"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    hint="Leave empty for ongoing medication"
                  />
                )}
              />

              <Controller
                control={control}
                name="timingInstructions"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Timing instructions"
                    placeholder="e.g. After meals, at bedtime"
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <View style={styles.navRow}>
                <Button label="← Back" onPress={() => setStep(1)} variant="outline" size="md" style={{ flex: 1 }} />
                <Button label="Next →" onPress={() => setStep(3)} variant="primary" size="md" style={{ flex: 2 }} />
              </View>
            </View>
          )}

          {/* Step 3: Quantity & Notes */}
          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>Quantity & Notes</Text>

              <Controller
                control={control}
                name="initialQuantity"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Initial quantity"
                    placeholder="e.g. 30"
                    keyboardType="numeric"
                    value={value?.toString() ?? ''}
                    onChangeText={(t) => onChange(t ? parseInt(t) : undefined)}
                    onBlur={onBlur}
                    hint="How many tablets/doses do you have?"
                  />
                )}
              />

              <Controller
                control={control}
                name="unit"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Unit"
                    placeholder="tablets, capsules, ml..."
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label="Notes (optional)"
                    placeholder="Any additional notes..."
                    multiline
                    numberOfLines={3}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />

              <View style={styles.navRow}>
                <Button label="← Back" onPress={() => setStep(2)} variant="outline" size="md" style={{ flex: 1 }} />
                <Button
                  label="Add Medication ✓"
                  onPress={handleSubmit(onSubmit)}
                  variant="primary"
                  size="md"
                  isLoading={createMed.isPending}
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[5], paddingBottom: Spacing[3] },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], marginBottom: Spacing[4] },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray200, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotDone: { backgroundColor: Colors.success },
  stepNum: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.bold, color: Colors.textSecondary },
  stepNumActive: { color: Colors.textInverse },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.gray200, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.success },
  form: { padding: Spacing[5], paddingTop: 0 },
  stepTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[5] },
  fieldLabel: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing[2] },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[4] },
  chip: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: BorderRadius.full, backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: 'transparent' },
  chipActive: { backgroundColor: Colors.primarySurface, borderColor: Colors.primary },
  chipText: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, fontWeight: Typography.fontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: Typography.fontWeight.semibold },
  navRow: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[4] },
});
