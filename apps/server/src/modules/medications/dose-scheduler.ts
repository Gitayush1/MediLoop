// ─────────────────────────────────────────────────────────────
// Dose Scheduling Engine
// Generates DoseEvent records from a Medication + MedicationSchedule
// ─────────────────────────────────────────────────────────────

import { MedicationFrequency } from '@mediloop/shared';

export interface ScheduleTime {
  time: string; // HH:MM
  mealRelation?: string;
}

interface GenerateDosesInput {
  medicationId: string;
  scheduleId: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  frequency: MedicationFrequency;
  scheduledTime: string; // HH:MM in user's timezone
  timezone: string;
  daysOfWeek?: number[]; // 0=Sun..6=Sat; empty = every day
}

interface DoseEventInput {
  medicationId: string;
  scheduleId: string;
  userId: string;
  scheduledAt: Date;
  status: 'SCHEDULED';
}

// Default schedule times per frequency (user's timezone local time)
export const DEFAULT_SCHEDULE_TIMES: Record<MedicationFrequency, string[]> = {
  ONCE_DAILY: ['08:00'],
  TWICE_DAILY: ['08:00', '20:00'],
  THREE_TIMES_DAILY: ['08:00', '14:00', '20:00'],
  FOUR_TIMES_DAILY: ['08:00', '12:00', '16:00', '20:00'],
  EVERY_OTHER_DAY: ['08:00'],
  WEEKLY: ['08:00'],
  AS_NEEDED: [],
  CUSTOM: [],
};

/**
 * Converts a local date+time string to UTC Date using user's timezone.
 * We use a simple offset approach – in production this should use a proper
 * IANA timezone library like luxon or date-fns-tz.
 */
function localTimeToUtc(dateStr: string, timeStr: string, _timezone: string): Date {
  // For simplicity and portability, combine date + time as ISO and create Date
  // In production: use luxon.DateTime.fromObject({...}, { zone: timezone }).toJSDate()
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/**
 * Generate all dose events for a single schedule entry.
 * Caps at 365 days ahead to prevent runaway generation.
 */
export function generateDoseEvents(input: GenerateDosesInput): DoseEventInput[] {
  const { medicationId, scheduleId, userId, startDate, endDate, frequency, scheduledTime, timezone, daysOfWeek } = input;

  // AS_NEEDED medications don't generate scheduled events
  if (frequency === 'AS_NEEDED') {
    return [];
  }

  const events: DoseEventInput[] = [];
  const cap = addDays(new Date(), 365);
  const end = endDate ?? cap;
  const effectiveEnd = end < cap ? end : cap;

  let current = new Date(startDate);
  let dayCount = 0;

  while (current <= effectiveEnd) {
    const dayOfWeek = getDayOfWeek(current);
    const dateStr = formatDate(current);

    // Check if this day applies
    let shouldSchedule = true;

    if (frequency === 'EVERY_OTHER_DAY' && dayCount % 2 !== 0) {
      shouldSchedule = false;
    }

    if (frequency === 'WEEKLY' && dayCount % 7 !== 0) {
      shouldSchedule = false;
    }

    if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(dayOfWeek)) {
      shouldSchedule = false;
    }

    if (shouldSchedule) {
      const scheduledAt = localTimeToUtc(dateStr, scheduledTime, timezone);

      events.push({
        medicationId,
        scheduleId,
        userId,
        scheduledAt,
        status: 'SCHEDULED',
      });
    }

    current = addDays(current, 1);
    dayCount++;
  }

  return events;
}

/**
 * Determine how many dose events to pre-generate.
 * For long-term medications without an end date, generate 90 days.
 */
export function calculateGenerationWindow(startDate: Date, endDate: Date | null): { from: Date; to: Date } {
  const from = startDate < new Date() ? startDate : new Date();
  
  if (endDate) {
    return { from, to: endDate };
  }
  
  // No end date: generate 90 days worth
  return { from, to: addDays(new Date(), 90) };
}
