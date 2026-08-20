import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedications } from '../../src/hooks/useMedications';
import { MedicationCard } from '../../src/components/features/MedicationCard';
import { MedicationCardSkeleton } from '../../src/components/ui/LoadingSkeleton';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Colors, Typography, Spacing, BorderRadius } from '../../src/lib/theme';
import type { Medication } from '../../src/services/medications.service';

const TABS = [
  { key: 'ACTIVE', label: 'Active' },
  { key: 'PAUSED', label: 'Paused' },
  { key: 'COMPLETED', label: 'Completed' },
] as const;

export default function MedicationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'PAUSED' | 'COMPLETED'>('ACTIVE');
  const { data, isLoading, isError, refetch, isRefetching } = useMedications({ status: activeTab });

  const medications: Medication[] = data?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <TouchableOpacity
          onPress={() => router.push('/medications/add')}
          style={styles.addBtn}
          accessibilityLabel="Add medication"
          accessibilityRole="button"
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.listContent}>
          <MedicationCardSkeleton />
          <MedicationCardSkeleton />
          <MedicationCardSkeleton />
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicationCard
              medication={item}
              onPress={() => router.push(`/medications/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'ACTIVE' ? '💊' : activeTab === 'PAUSED' ? '⏸️' : '✅'}
              title={`No ${activeTab.toLowerCase()} medications`}
              description={
                activeTab === 'ACTIVE'
                  ? 'Add a medication manually or scan a prescription to get started.'
                  : `You have no ${activeTab.toLowerCase()} medications.`
              }
              actionLabel={activeTab === 'ACTIVE' ? 'Add Medication' : undefined}
              onAction={activeTab === 'ACTIVE' ? () => router.push('/medications/add') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  addBtn: {
    backgroundColor: Colors.primarySurface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  addBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[5],
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  tabLabelActive: { color: Colors.textInverse, fontWeight: Typography.fontWeight.semibold },
  listContent: { padding: Spacing[5], paddingTop: Spacing[3] },
});
