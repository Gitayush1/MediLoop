import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';

export const USER_KEY = 'user-me';
export const NOTIFICATIONS_KEY = 'notifications';

export function useMe() {
  return useQuery({
    queryKey: [USER_KEY],
    queryFn: () => usersService.getMe(),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: () => void qc.invalidateQueries({ queryKey: [USER_KEY] }),
  });
}

export function useNotifications(params?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, params],
    queryFn: () => usersService.getNotifications(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.markNotificationRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => usersService.markAllNotificationsRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });
}

export function useCaregivers() {
  return useQuery({
    queryKey: ['caregivers'],
    queryFn: () => usersService.getCaregivers(),
    staleTime: 60_000,
  });
}

export function useInviteCaregiver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.inviteCaregiver,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['caregivers'] }),
  });
}

export function useRefills() {
  return useQuery({
    queryKey: ['refills'],
    queryFn: () => usersService.getRefills(),
    staleTime: 60_000,
  });
}
