import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { useUploadPrescription, useProcessPrescription } from '../../src/hooks/usePrescriptions';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';

type ScanStep = 'pick' | 'preview' | 'processing' | 'done';

export default function ScanScreen() {
  const router = useRouter();
  const [step, setStep] = useState<ScanStep>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null);

  const upload = useUploadPrescription();
  const process = useProcessPrescription();

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to upload prescriptions.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('preview');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access to scan prescriptions.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setStep('preview');
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    setStep('processing');
    try {
      const fileName = imageUri.split('/').pop() ?? 'prescription.jpg';
      const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const prescription = await upload.mutateAsync({ uri: imageUri, fileName, mimeType });
      setPrescriptionId(prescription.id);

      // Process with OCR + AI
      await process.mutateAsync(prescription.id);
      setStep('done');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      Alert.alert(
        'Processing failed',
        error.response?.data?.error?.message ?? 'Failed to process prescription. Please try again or add medications manually.',
        [{ text: 'OK', onPress: () => setStep('preview') }]
      );
    }
  };

  const goToReview = () => {
    if (prescriptionId) {
      router.push(`/prescriptions/${prescriptionId}/review`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scan Prescription</Text>

        {step === 'pick' && <PickStep onCamera={takePhoto} onGallery={pickFromGallery} />}

        {step === 'preview' && imageUri && (
          <PreviewStep
            uri={imageUri}
            onRetake={() => { setImageUri(null); setStep('pick'); }}
            onConfirm={handleUpload}
            isLoading={upload.isPending}
          />
        )}

        {step === 'processing' && <ProcessingStep />}

        {step === 'done' && (
          <DoneStep
            onReview={goToReview}
            onScanAnother={() => { setImageUri(null); setPrescriptionId(null); setStep('pick'); }}
          />
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            🤖 AI extracts medication information from your prescription. Always review and confirm before creating your schedule.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PickStep({ onCamera, onGallery }: { onCamera: () => void; onGallery: () => void }) {
  return (
    <View style={styles.pickContainer}>
      <Text style={styles.pickIcon}>📋</Text>
      <Text style={styles.pickTitle}>Upload a prescription</Text>
      <Text style={styles.pickDesc}>Take a photo or select from gallery. AI will extract your medications automatically.</Text>
      <View style={styles.pickActions}>
        <TouchableOpacity onPress={onCamera} style={styles.pickBtn} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.pickBtnIcon}>📷</Text>
          <Text style={styles.pickBtnLabel}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onGallery} style={[styles.pickBtn, styles.pickBtnSecondary]} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.pickBtnIcon}>🖼️</Text>
          <Text style={[styles.pickBtnLabel, { color: Colors.primary }]}>Choose from Gallery</Text>
        </TouchableOpacity>
      </View>
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Tips for best results</Text>
        {[
          'Ensure good lighting and no shadows',
          'Keep the prescription flat and unfolded',
          'Include the entire prescription in frame',
          'Make sure text is clearly readable',
        ].map((tip) => (
          <Text key={tip} style={styles.tipItem}>• {tip}</Text>
        ))}
      </Card>
    </View>
  );
}

function PreviewStep({ uri, onRetake, onConfirm, isLoading }: { uri: string; onRetake: () => void; onConfirm: () => void; isLoading: boolean }) {
  return (
    <View>
      <Text style={styles.stepLabel}>Step 1 of 3 — Review image</Text>
      <View style={styles.imagePreview}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
      </View>
      <Text style={styles.previewHint}>Does this clearly show the prescription text?</Text>
      <View style={styles.previewActions}>
        <Button label="Retake" onPress={onRetake} variant="outline" size="md" style={{ flex: 1 }} />
        <Button label="Process →" onPress={onConfirm} variant="primary" size="md" isLoading={isLoading} style={{ flex: 2 }} />
      </View>
    </View>
  );
}

function ProcessingStep() {
  return (
    <View style={styles.processingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: Spacing[6] }} />
      <Text style={styles.processingTitle}>Processing prescription...</Text>
      <View style={styles.processingSteps}>
        {[
          { icon: '🔍', label: 'Reading text with OCR', done: true },
          { icon: '🤖', label: 'Extracting medications with AI', done: false },
          { icon: '✅', label: 'Validating extracted data', done: false },
        ].map((s, i) => (
          <View key={i} style={styles.processingStep}>
            <Text style={styles.processingStepIcon}>{s.done ? '✅' : s.icon}</Text>
            <Text style={[styles.processingStepLabel, s.done && { color: Colors.success }]}>{s.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.processingNote}>This usually takes 10–20 seconds</Text>
    </View>
  );
}

function DoneStep({ onReview, onScanAnother }: { onReview: () => void; onScanAnother: () => void }) {
  return (
    <View style={styles.doneContainer}>
      <Text style={styles.doneIcon}>🎉</Text>
      <Text style={styles.doneTitle}>Extraction complete!</Text>
      <Text style={styles.doneDesc}>Your prescription has been processed. Review the extracted medications and confirm your schedule.</Text>
      <Button label="Review & Confirm Medications" onPress={onReview} variant="primary" size="lg" fullWidth style={{ marginBottom: Spacing[3] }} />
      <Button label="Scan Another" onPress={onScanAnother} variant="ghost" size="md" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing[5] },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[5] },
  pickContainer: { alignItems: 'center' },
  pickIcon: { fontSize: 64, marginBottom: Spacing[4] },
  pickTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  pickDesc: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing[6] },
  pickActions: { width: '100%', gap: Spacing[3], marginBottom: Spacing[6] },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[3],
    backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing[4],
  },
  pickBtnSecondary: { backgroundColor: Colors.primarySurface, borderWidth: 1.5, borderColor: Colors.primary },
  pickBtnIcon: { fontSize: 24 },
  pickBtnLabel: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textInverse },
  tipCard: { width: '100%', padding: Spacing[4] },
  tipTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing[2] },
  tipItem: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
  stepLabel: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.semibold, marginBottom: Spacing[3] },
  imagePreview: { borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: Colors.gray100, marginBottom: Spacing[4] },
  image: { width: '100%', height: 320 },
  previewHint: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing[4] },
  previewActions: { flexDirection: 'row', gap: Spacing[3] },
  processingContainer: { alignItems: 'center', paddingVertical: Spacing[10] },
  processingTitle: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[6] },
  processingSteps: { width: '100%', gap: Spacing[3], marginBottom: Spacing[6] },
  processingStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], backgroundColor: Colors.gray50, borderRadius: BorderRadius.lg },
  processingStepIcon: { fontSize: 20 },
  processingStepLabel: { fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  processingNote: { fontSize: Typography.fontSize.sm, color: Colors.textTertiary },
  doneContainer: { alignItems: 'center', paddingVertical: Spacing[8] },
  doneIcon: { fontSize: 72, marginBottom: Spacing[4] },
  doneTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing[3] },
  doneDesc: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing[6] },
  disclaimer: { marginTop: Spacing[6], backgroundColor: Colors.infoSurface, borderRadius: 12, padding: Spacing[4] },
  disclaimerText: { fontSize: Typography.fontSize.xs, color: Colors.info, lineHeight: 18, textAlign: 'center' },
});
