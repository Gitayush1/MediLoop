import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prescriptionsService, ConfirmMedicineInput } from '../services/prescriptions.service';

export const PRESCRIPTIONS_KEY = 'prescriptions';

export function usePrescriptions() {
  return useQuery({
    queryKey: [PRESCRIPTIONS_KEY],
    queryFn: () => prescriptionsService.list(),
    staleTime: 60_000,
  });
}

export function usePrescription(id: string) {
  return useQuery({
    queryKey: [PRESCRIPTIONS_KEY, id],
    queryFn: () => prescriptionsService.getById(id),
    enabled: !!id,
  });
}

export function useUploadPrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uri, fileName, mimeType }: { uri: string; fileName: string; mimeType: string }) =>
      prescriptionsService.upload(uri, fileName, mimeType),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRESCRIPTIONS_KEY] });
    },
  });
}

export function useProcessPrescription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prescriptionId: string) => prescriptionsService.process(prescriptionId),
    onSuccess: (_data, prescriptionId) => {
      void qc.invalidateQueries({ queryKey: [PRESCRIPTIONS_KEY, prescriptionId] });
    },
  });
}

export function useConfirmMedicines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      prescriptionId,
      confirmations,
    }: {
      prescriptionId: string;
      confirmations: ConfirmMedicineInput[];
    }) => prescriptionsService.confirmMedicines(prescriptionId, confirmations),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [PRESCRIPTIONS_KEY] });
      void qc.invalidateQueries({ queryKey: ['medications'] });
    },
  });
}

export function useExplainMedication() {
  return useMutation({
    mutationFn: (data: {
      medicationName: string;
      dosage?: string;
      frequency?: string;
      instructions?: string;
      duration?: string;
    }) => prescriptionsService.explain(data),
  });
}
