import { apiClient } from '../lib/api';

export interface Medication {
  id: string;
  name: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  frequency: string;
  timingInstructions?: string;
  startDate: string;
  endDate?: string;
  currentQuantity?: number;
  unit?: string;
  notes?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  color?: string;
  schedules: MedicationSchedule[];
  refillPrediction?: RefillPrediction;
  adherencePercentage?: number;
}

export interface MedicationSchedule {
  id: string;
  timeOfDay: string;
  mealRelation: string;
}

export interface RefillPrediction {
  estimatedRemaining: number;
  estimatedRunOutDate?: string;
  recommendedReorderDate?: string;
  adherenceRate: number;
  warningAcknowledged: boolean;
  daysLeft?: number;
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isRunningLow?: boolean;
}

export interface CreateMedicationInput {
  name: string;
  dosage?: string;
  form?: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  scheduleTimes: Array<{ time: string; mealRelation?: string }>;
  initialQuantity?: number;
  unit?: string;
  notes?: string;
  prescriptionId?: string;
}

export const medicationsService = {
  async list(params?: { status?: string; page?: number; limit?: number }) {
    const res = await apiClient.get<{ data: Medication[]; meta: { total: number; page: number; totalPages: number } }>('/medications', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<{ data: Medication }>(`/medications/${id}`);
    return res.data.data;
  },

  async create(input: CreateMedicationInput) {
    const res = await apiClient.post<{ data: Medication }>('/medications', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<CreateMedicationInput> & { status?: string }) {
    const res = await apiClient.patch<{ data: Medication }>(`/medications/${id}`, input);
    return res.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/medications/${id}`);
  },
};
