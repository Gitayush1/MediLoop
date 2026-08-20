import { apiClient } from '../lib/api';

export interface Notification {
  id: string;
  type: 'DOSE_REMINDER' | 'UPCOMING_DOSE' | 'MISSED_DOSE' | 'REFILL_WARNING' | 'CAREGIVER_ALERT' | 'SYSTEM';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  id: string;
  doseReminders: boolean;
  missedDoseAlerts: boolean;
  refillAlerts: boolean;
  caregiverAlerts: boolean;
  reminderMinutesBefore: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationsListResponse {
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    totalPages: number;
  };
}

export const notificationsService = {
  async getAll(params?: {
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<NotificationsListResponse> {
    const res = await apiClient.get<NotificationsListResponse>('/notifications', { params });
    return res.data;
  },

  async markRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get<{ data: NotificationPreferences }>('/notifications/preferences');
    return res.data.data;
  },

  async updatePreferences(
    data: Partial<Omit<NotificationPreferences, 'id'>>,
  ): Promise<NotificationPreferences> {
    const res = await apiClient.patch<{ data: NotificationPreferences }>(
      '/notifications/preferences',
      data,
    );
    return res.data.data;
  },

  async registerDevice(data: {
    pushToken: string;
    platform: 'IOS' | 'ANDROID' | 'WEB';
    deviceId: string;
  }): Promise<void> {
    await apiClient.post('/notifications/devices', data);
  },

  async deregisterDevice(deviceId: string): Promise<void> {
    await apiClient.delete(`/notifications/devices/${deviceId}`);
  },
};
