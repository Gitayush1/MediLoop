import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../lib/api';
import { logger } from '../lib/logger';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function useNotificationSetup(userId?: string) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if (!userId) return;

    void registerForPushNotifications().then((token) => {
      if (token) {
        setExpoPushToken(token);
        void registerTokenWithServer(token, userId);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // Handle foreground notification
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((_response) => {
      // Handle notification tap – navigate to relevant screen
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [userId]);

  return { expoPushToken };
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    logger.warn('Push notifications not available on simulator');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });

    await Notifications.setNotificationChannelAsync('dose-reminders', {
      name: 'Dose Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

async function registerTokenWithServer(token: string, userId: string): Promise<void> {
  try {
    await apiClient.post('/users/devices', {
      pushToken: token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      deviceId: `${userId}-${Platform.OS}`,
    });
  } catch (err) {
    logger.error('Failed to register push token', err);
  }
}

// Schedule a local dose reminder
export async function scheduleLocalDoseReminder(params: {
  doseId: string;
  medicationName: string;
  scheduledAt: Date;
  minutesBefore?: number;
}): Promise<string> {
  const { doseId, medicationName, scheduledAt, minutesBefore = 15 } = params;
  const triggerTime = new Date(scheduledAt.getTime() - minutesBefore * 60 * 1000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '💊 Medication Reminder',
      body: `${medicationName} is due in ${minutesBefore} minutes`,
      data: { doseId, type: 'DOSE_REMINDER' },
      sound: 'default',
    },
    trigger: triggerTime > new Date() ? { date: triggerTime } : null,
  });

  return id;
}

export async function cancelDoseReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
