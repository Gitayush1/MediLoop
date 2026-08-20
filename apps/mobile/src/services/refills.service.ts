import { apiClient } from '../lib/api';

export interface RefillPrediction {
  id: string;
  medicationId: string;
  estimatedRemaining: number;
  estimatedRunOutDate?: string;
  recommendedReorderDate?: string;
  adherenceRate: number;
  dailyConsumptionRate: number;
  warningThreshold: number;
  warningAcknowledged: boolean;
  calculatedAt: string;
  // Computed fields from server
  daysLeft?: number | null;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
  isRunningLow?: boolean;
  medication: {
    id: string;
    name: string;
    dosage?: string;
    form?: string;
    color?: string;
    unit?: string;
    currentQuantity?: number;
  };
}

export const refillsService = {
  async getAll(): Promise<RefillPrediction[]> {
    const res = await apiClient.get<{ data: RefillPrediction[] }>('/refills');
    return res.data.data;
  },

  async getByMedication(medicationId: string): Promise<RefillPrediction | null> {
    const res = await apiClient.get<{ data: RefillPrediction }>(`/refills/${medicationId}`);
    return res.data.data;
  },

  async acknowledge(medicationId: string): Promise<void> {
    await apiClient.post(`/refills/${medicationId}/acknowledge`);
  },

  async addInventory(
    medicationId: string,
    data: { quantity: number; type?: 'INITIAL' | 'PURCHASE' | 'ADJUSTMENT'; note?: string },
  ): Promise<RefillPrediction> {
    const res = await apiClient.post<{ data: RefillPrediction }>(
      `/refills/${medicationId}/inventory`,
      data,
    );
    return res.data.data;
  },
};
