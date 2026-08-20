import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { usePrescriptions } from '../../src/hooks/usePrescriptions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsService } from '../../src/services/prescriptions.service';
import { Card } from '../../src/components/ui/Card';
import { StatusBadge } from '../../src/components/ui/StatusBadge';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Skeleton } from '../../src/components/ui/LoadingSkeleton';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';

const STATUS_MAP: Record<string, Parameters<typeof StatusBadge>[0]['variant']> = {
  UPLOADED: 'scheduled',
  PROCESSING: 'snoozed',
  PROCESSED: 'active',
  FAILED: 'missed',
};

export default function PrescriptionsVaultScreen() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: result, isLoading, isError, refetch, isRefetching } = usePrescriptions();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deletePrescription = useMutation({
    mutationFn: (id: string) => prescriptionsService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prescriptions'] });
      setSelectedId(null);
    },
  });

  const prescriptions = (result as { data?: unknown[] } | undefined)?.data ?? [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Prescription',
      `Remove "${name}" from your vault? This won't affect existing medication schedules.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePrescription.mutate(id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Prescription Vault</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/scan')}
          style={styles.addBtn}
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ Scan</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.content}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={110} borderRadius={16} style={{ marginBottom: 12 }} />
          ))}
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={prescriptions as Array<{
            id: string;
            originalName?: string;
            doctorName?: string;
            prescriptionDate?: string;
            status: string;
            fileUrl?: string;
            medicines: Array<{ name: string; userConfirmed: boolean }>;
            createdAt: string;
            _count?: { medicines: number };
          }>}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="No prescriptions yet"
              description="Scan or upload a prescription to get started. All your prescriptions will be stored securely here."
              actionLabel="Scan Prescription"
              onAction={() => router.push('/(tabs)/scan')}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <TouchableOpacity
                onPress={() => {
                  if (item.status === 'PROCESSED') {
                    router.push(`/prescriptions/${item.id}/review`);
                  }
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <View style={styles.cardContent}>
                  {/* Thumbnail */}
                  <View style={styles.thumbnail}>
                    {item.fileUrl ? (
                      <Image
                        source={{ uri: item.fileUrl }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.thumbnailIcon}>📋</Text>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <View style={styles.infoHeader}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {item.originalName ?? 'Prescription'}
                      </Text>
                      <StatusBadge variant={STATUS_MAP[item.status] ?? 'scheduled'} label={item.status} size="sm" />
                    </View>

                    {item.doctorName && (
                      <Text style={styles.doctor}>👨‍⚕️ {item.doctorName}</Text>
                    )}

                    {item.prescriptionDate && (
                      <Text style={styles.date}>
                        📅 {new Date(item.prescriptionDate).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Text>
                    )}

                    <View style={styles.footer}>
                      <Text style={styles.medicineCount}>
                        {item.medicines?.length ?? 0} medicines extracted
                      </Text>
                      <Text style={styles.uploadDate}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Actions */}
              <View style={styles.actions}>
                {item.status === 'UPLOADED' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/prescriptions/${item.id}/review`)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>Process →</Text>
                  </TouchableOpacity>
                )}
                {item.status === 'PROCESSED' && (
                  <TouchableOpacity
                    onPress={() => router.push(`/prescriptions/${item.id}/review`)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionBtnText}>View medicines →</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.originalName ?? 'Prescription')}
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  backText: { fontSize: Typography.fontSize.md, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  title: { fontSize: Typography.fontSize.xl, fontWeight: Typography.fontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  addBtnText: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: Colors.primary },
  content: { padding: Spacing[5] },
  card: { marginBottom: Spacing[3], padding: 0, overflow: 'hidden' },
  cardContent: { flexDirection: 'row', padding: Spacing[4], gap: Spacing[3] },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailImage: { width: 72, height: 72 },
  thumbnailIcon: { fontSize: 32 },
  info: { flex: 1 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  fileName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing[2],
  },
  doctor: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 3 },
  date: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  medicineCount: { fontSize: Typography.fontSize.xs, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  uploadDate: { fontSize: Typography.fontSize.xs, color: Colors.textTertiary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing[3],
    gap: Spacing[2],
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    alignItems: 'center',
  },
  actionBtnText: { fontSize: Typography.fontSize.sm, color: Colors.primary, fontWeight: Typography.fontWeight.medium },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 16 },
});
