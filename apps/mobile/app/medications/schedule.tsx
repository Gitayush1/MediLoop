import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../src/lib/theme';
import { useTodayDoses } from '../../src/hooks/useDoses';

const STATUS_COLORS: Record<string, string> = {
  TAKEN: Colors.statusTaken,
  MISSED: Colors.statusMissed,
  SKIPPED: Colors.statusSkipped,
  SCHEDULED: Colors.statusScheduled,
  SNOOZED: Colors.statusSnoozed,
};

const STATUS_LABELS: Record<string, string> = {
  TAKEN: 'Taken',
  MISSED: 'Missed',
  SKIPPED: 'Skipped',
  SCHEDULED: 'Scheduled',
  SNOOZED: 'Snoozed',
};

export default function MedicationScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Mon

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const { data: todayDoses, isLoading } = useTodayDoses();

  // Filter doses for the selected date (today's doses for now; extend with history hook)
  const displayDoses = isToday(selectedDate) ? [...(todayDoses?.upcoming ?? []), ...(todayDoses?.past ?? [])] : [];

  function goToPrevWeek() {
    setSelectedDate((d) => subDays(d, 7));
  }

  function goToNextWeek() {
    setSelectedDate((d) => addDays(d, 7));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Week navigator */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.navArrow}>
          <Text style={styles.navArrowText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>
          {format(weekStart, 'MMMM yyyy')}
        </Text>

        <TouchableOpacity onPress={goToNextWeek} style={styles.navArrow}>
          <Text style={styles.navArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayStrip}
      >
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
              onPress={() => setSelectedDate(day)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, isSelected && styles.dayNameActive]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberActive, isTodayDay && !isSelected && styles.dayNumberToday]}>
                {format(day, 'd')}
              </Text>
              {isTodayDay && <View style={[styles.todayDot, isSelected && styles.todayDotActive]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected date label */}
      <View style={styles.dateLabelRow}>
        <Text style={styles.dateLabel}>
          {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, d MMMM')}
        </Text>
        {displayDoses.length > 0 && (
          <Text style={styles.doseCount}>{displayDoses.length} dose{displayDoses.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {/* Dose list */}
      {isLoading ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : displayDoses.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>
            {isToday(selectedDate) ? 'All caught up today!' : 'No doses this day'}
          </Text>
          <Text style={styles.emptyText}>
            {isToday(selectedDate)
              ? 'No medications scheduled for the rest of today.'
              : 'Tap another day to view its schedule.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayDoses as Record<string, unknown>[]}
          keyExtractor={(item) => item.id as string}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const status = item.status as string;
            const med = item.medication as Record<string, string>;
            const sched = item.schedule as Record<string, string>;
            return (
              <View style={styles.doseCard}>
                <View style={[styles.statusBar, { backgroundColor: STATUS_COLORS[status] ?? Colors.gray300 }]} />
                <View style={styles.doseInfo}>
                  <View style={styles.doseHeader}>
                    <Text style={styles.medName}>{med?.name ?? 'Unknown'}</Text>
                    <View style={[styles.statusPill, { backgroundColor: (STATUS_COLORS[status] ?? Colors.gray300) + '22' }]}>
                      <Text style={[styles.statusPillText, { color: STATUS_COLORS[status] ?? Colors.gray500 }]}>
                        {STATUS_LABELS[status] ?? status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.doseSub}>
                    {med?.dosage ?? ''}{med?.dosage && sched?.timeOfDay ? ' · ' : ''}{sched?.timeOfDay ?? ''}
                  </Text>
                  {sched?.mealRelation && sched.mealRelation !== 'ANY' && (
                    <Text style={styles.mealTag}>
                      {sched.mealRelation.replace('_', ' ').toLowerCase()}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 24, color: Colors.primary },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
  },
  navArrow: { padding: Spacing[2] },
  navArrowText: { fontSize: 28, color: Colors.primary, lineHeight: 28 },
  monthLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  dayStrip: {
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[3],
    gap: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dayBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.lg,
    minWidth: 44,
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dayNameActive: { color: 'rgba(255,255,255,0.8)' },
  dayNumber: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  dayNumberActive: { color: '#fff' },
  dayNumberToday: { color: Colors.primary },
  todayDot: {
    width: 5, height: 5, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, marginTop: 3,
  },
  todayDotActive: { backgroundColor: '#fff' },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
  },
  dateLabel: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  doseCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textTertiary,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing[4] },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  emptyText: { fontSize: Typography.fontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  list: { padding: Spacing[5], gap: Spacing[3] },
  doseCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  statusBar: { width: 5 },
  doseInfo: { flex: 1, padding: Spacing[4] },
  doseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  medName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing[2],
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillText: { fontSize: Typography.fontSize.xs, fontWeight: Typography.fontWeight.semibold },
  doseSub: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  mealTag: {
    marginTop: 4,
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textTransform: 'capitalize',
  },
});
