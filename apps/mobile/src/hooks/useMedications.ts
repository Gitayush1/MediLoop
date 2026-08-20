import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationsService, CreateMedicationInput } from '../services/medications.service';

export const MEDICATIONS_KEY = 'medications';

export function useMedications(params?: { status?: string }) {
  return useQuery({
    queryKey: [MEDICATIONS_KEY, params],
    queryFn: () => medicationsService.list(params),
    staleTime: 30_000,
  });
}

export function useMedication(id: string) {
  return useQuery({
    queryKey: [MEDICATIONS_KEY, id],
    queryFn: () => medicationsService.getById(id),
    staleTime: 30_000,
    enabled: !!id,
  });
}

export function useCreateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMedicationInput) => medicationsService.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [MEDICATIONS_KEY] });
    },
  });
}

export function useUpdateMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof medicationsService.update>[1] }) =>
      medicationsService.update(id, input),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: [MEDICATIONS_KEY, id] });
      void qc.invalidateQueries({ queryKey: [MEDICATIONS_KEY] });
    },
  });
}

export function useDeleteMedication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationsService.delete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [MEDICATIONS_KEY] });
    },
  });
}
