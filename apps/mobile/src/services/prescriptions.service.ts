import { apiClient } from '../lib/api';
import { Platform } from 'react-native';
import type { PrescriptionExtraction } from '@mediloop/shared';

export interface Prescription {
  id: string;
  originalName?: string;
  mimeType?: string;
  fileSize?: number;
  fileUrl?: string;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  doctorName?: string;
  patientName?: string;
  prescriptionDate?: string;
  medicines: PrescriptionMedicine[];
  createdAt: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage?: string;
  form?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  confidence: number;
  requiresConfirmation?: boolean;
  userConfirmed: boolean;
}

export interface ConfirmMedicineInput {
  prescriptionMedicineId: string;
  confirmed: boolean;
  overrides?: {
    name?: string;
    dosage?: string;
    form?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  };
}

export const prescriptionsService = {
  async upload(uri: string, fileName: string, mimeType: string) {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      // On web, uri is a blob: or data: URL — fetch it to get a real Blob
      const response = await fetch(uri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    } else {
      // On native, React Native's fetch layer handles { uri, name, type } objects
      formData.append('file', {
        uri,
        name: fileName,
        type: mimeType,
      } as unknown as Blob);
    }

    const res = await apiClient.post<{ data: Prescription }>('/prescriptions/upload', formData, {
      // Let the browser/RN set Content-Type with the multipart boundary automatically.
      // Manually setting it on web strips the boundary and breaks the request.
      headers: Platform.OS === 'web' ? {} : { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data.data;
  },

  async process(prescriptionId: string): Promise<PrescriptionExtraction & { prescriptionId: string }> {
    const res = await apiClient.post<{ data: PrescriptionExtraction & { prescriptionId: string } }>(
      `/prescriptions/${prescriptionId}/process`,
    );
    return res.data.data;
  },

  async getReview(prescriptionId: string): Promise<Prescription> {
    const res = await apiClient.get<{ data: Prescription }>(`/prescriptions/${prescriptionId}/review`);
    return res.data.data;
  },

  async confirmMedicines(prescriptionId: string, confirmations: ConfirmMedicineInput[]) {
    const res = await apiClient.post(`/prescriptions/${prescriptionId}/confirm`, { confirmations });
    return res.data;
  },

  async list(params?: { page?: number; limit?: number }) {
    const res = await apiClient.get<{ data: Prescription[] }>('/prescriptions', { params });
    return res.data;
  },

  async getById(id: string): Promise<Prescription> {
    const res = await apiClient.get<{ data: Prescription }>(`/prescriptions/${id}`);
    return res.data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/prescriptions/${id}`);
  },

  async explain(data: {
    medicationName: string;
    dosage?: string;
    frequency?: string;
    instructions?: string;
    duration?: string;
  }) {
    const res = await apiClient.post<{ data: { explanation: string; disclaimer: string } }>(
      '/prescriptions/explain',
      data,
    );
    return res.data.data;
  },
};
