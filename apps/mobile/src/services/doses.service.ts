import { apiClient } from '../lib/api';

export interface DoseEvent {
  id: string;
  medicationId: string;
  scheduledAt: string;
  takenAt?: string;
  status: 'SCHEDULED' | 'TAKEN' | 'MISSED' | 'SKIPPED' | 'SNOOZED';
  snoozedUntil?: string;
  notes?: string;
  medication: {
    id: string;
    name: string;
    dosage?: string;
    form?: string;
    color?: string;
    unit?: string;
  };
  schedule: {
    timeOfDay: string;
    mealRelation: string;
  };
}

export interface TodayDoses {
  upcoming: DoseEvent[];
  past: DoseEvent[];
  total: number;
  takenCount: number;
  missedCount: number;
}

export interface AdherenceStats {
  period: string;
  taken: number;
  missed: number;
  skipped: number;
  total: number;
  adherenceRate: number;
  streak: number;
}

export const dosesService = {
  async getToday(): Promise<TodayDoses> {
    const res = await apiClient.get<{ data: TodayDoses }>('/doses/today');
    return res.data.data;
  },

  async getHistory(params?: { medicationId?: string; from?: string; to?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<{ data: DoseEvent[] }>('/doses/history', { params });
    return res.data;
  },

  async markTaken(id: string, data?: { takenAt?: string; notes?: string }) {
    const res = await apiClient.post<{ data: DoseEvent }>(`/doses/${id}/taken`, data ?? {});
    return res.data.data;
  },

  async markSkipped(id: string, notes?: string) {
    const res = await apiClient.post<{ data: DoseEvent }>(`/doses/${id}/skipped`, { notes });
    return res.data.data;
  },

  async snooze(id: string, snoozeMinutes = 15) {
    const res = await apiClient.post<{ data: DoseEvent }>(`/doses/${id}/snooze`, { snoozeMinutes });
    return res.data.data;
  },

  async getAdherence(period: '7d' | '30d' | '90d' = '30d'): Promise<AdherenceStats> {
    const res = await apiClient.get<{ data: AdherenceStats }>('/doses/adherence', { params: { period } });
    return res.data.data;
  },
};
