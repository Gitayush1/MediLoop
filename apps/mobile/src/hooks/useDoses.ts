import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dosesService } from '../services/doses.service';
import { useOfflineStore } from '../store/offline.store';

export const DOSES_TODAY_KEY = 'doses-today';
export const DOSES_ADHERENCE_KEY = 'doses-adherence';

export function useTodayDoses() {
  return useQuery({
    queryKey: [DOSES_TODAY_KEY],
    queryFn: () => dosesService.getToday(),
    staleTime: 60_000,
    refetchInterval: 2 * 60 * 1000, // refresh every 2 min
  });
}

export function useAdherence(period: '7d' | '30d' | '90d' = '30d') {
  return useQuery({
    queryKey: [DOSES_ADHERENCE_KEY, period],
    queryFn: () => dosesService.getAdherence(period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkTaken() {
  const qc = useQueryClient();
  const { isOnline, queueAction } = useOfflineStore();

  return useMutation({
    mutationFn: async ({ id, takenAt, notes }: { id: string; takenAt?: string; notes?: string }) => {
      if (!isOnline) {
        await queueAction({ type: 'MARK_DOSE_TAKEN', payload: { doseId: id, takenAt, notes } });
        return null;
      }
      return dosesService.markTaken(id, { takenAt, notes });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [DOSES_TODAY_KEY] });
      void qc.invalidateQueries({ queryKey: [DOSES_ADHERENCE_KEY] });
      void qc.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useMarkSkipped() {
  const qc = useQueryClient();
  const { isOnline, queueAction } = useOfflineStore();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!isOnline) {
        await queueAction({ type: 'MARK_DOSE_SKIPPED', payload: { doseId: id, notes } });
        return null;
      }
      return dosesService.markSkipped(id, notes);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [DOSES_TODAY_KEY] });
    },
  });
}

export function useSnoozeDose() {
  const qc = useQueryClient();
  const { isOnline, queueAction } = useOfflineStore();

  return useMutation({
    mutationFn: async ({ id, snoozeMinutes }: { id: string; snoozeMinutes?: number }) => {
      if (!isOnline) {
        await queueAction({ type: 'SNOOZE_DOSE', payload: { doseId: id, snoozeMinutes: snoozeMinutes ?? 15 } });
        return null;
      }
      return dosesService.snooze(id, snoozeMinutes);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [DOSES_TODAY_KEY] });
    },
  });
}
