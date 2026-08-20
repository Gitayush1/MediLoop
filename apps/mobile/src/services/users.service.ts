import { apiClient } from '../lib/api';

export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  role: string;
  profile: {
    firstName: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    avatarUrl?: string;
    timezone: string;
  } | null;
  notificationPreference: {
    doseReminders: boolean;
    missedDoseAlerts: boolean;
    refillAlerts: boolean;
    caregiverAlerts: boolean;
    reminderMinutesBefore: number;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  } | null;
  stats: {
    activeMedications: number;
    prescriptions: number;
  };
}

export const usersService = {
  async getMe(): Promise<UserProfile> {
    const res = await apiClient.get<{ data: UserProfile }>('/users/me');
    return res.data.data;
  },

  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    timezone?: string;
  }) {
    const res = await apiClient.patch<{ data: UserProfile['profile'] }>('/users/me', data);
    return res.data.data;
  },

  async deleteAccount() {
    await apiClient.delete('/users/me');
  },

  async getNotifications(params?: { unreadOnly?: boolean; page?: number }) {
    const res = await apiClient.get('/notifications', { params });
    return res.data;
  },

  async markNotificationRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllNotificationsRead() {
    await apiClient.patch('/notifications/read-all');
  },

  async getNotificationPreferences() {
    const res = await apiClient.get('/notifications/preferences');
    return res.data.data as UserProfile['notificationPreference'];
  },

  async updateNotificationPreferences(data: Partial<UserProfile['notificationPreference']>) {
    const res = await apiClient.patch('/notifications/preferences', data);
    return res.data.data;
  },

  async getCaregivers() {
    const res = await apiClient.get('/caregivers');
    return res.data.data as unknown[];
  },

  async inviteCaregiver(data: { email: string; permissions: string[] }) {
    const res = await apiClient.post('/caregivers/invite', data);
    return res.data.data;
  },

  async revokeCaregiver(caregiverId: string) {
    await apiClient.delete(`/caregivers/${caregiverId}`);
  },

  async getRefills() {
    const res = await apiClient.get('/refills');
    return res.data.data;
  },

  async acknowledgeRefill(medicationId: string) {
    await apiClient.post(`/refills/${medicationId}/acknowledge`);
  },

  async addInventory(medicationId: string, data: { quantity: number; note?: string }) {
    const res = await apiClient.post(`/refills/${medicationId}/inventory`, { ...data, type: 'PURCHASE' });
    return res.data.data;
  },
};
