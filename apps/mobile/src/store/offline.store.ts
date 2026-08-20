import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dosesService } from '../services/doses.service';
import { logger } from '../lib/logger';

export type OfflineAction =
  | { type: 'MARK_DOSE_TAKEN'; payload: { doseId: string; takenAt?: string; notes?: string } }
  | { type: 'MARK_DOSE_SKIPPED'; payload: { doseId: string; notes?: string } }
  | { type: 'SNOOZE_DOSE'; payload: { doseId: string; snoozeMinutes: number } };

interface PendingAction {
  id: string;
  action: OfflineAction;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: PendingAction[];
  lastSyncAt: number | null;

  setOnline: (online: boolean) => void;
  queueAction: (action: OfflineAction) => Promise<void>;
  sync: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const STORAGE_KEY = 'mediloop_offline_queue';

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  isSyncing: false,
  pendingActions: [],
  lastSyncAt: null,

  setOnline: (online) => {
    set({ isOnline: online });
    if (online && get().pendingActions.length > 0) {
      void get().sync();
    }
  },

  queueAction: async (action) => {
    const pending: PendingAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      action,
      timestamp: Date.now(),
      retryCount: 0,
    };

    const newQueue = [...get().pendingActions, pending];
    set({ pendingActions: newQueue });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
    } catch (err) {
      logger.warn('Failed to persist offline queue');
    }

    // Try to process immediately if online
    if (get().isOnline) {
      void get().sync();
    }
  },

  sync: async () => {
    if (get().isSyncing || !get().isOnline) return;

    const queue = get().pendingActions;
    if (queue.length === 0) return;

    set({ isSyncing: true });
    logger.info(`Syncing ${queue.length} offline actions`);

    const failed: PendingAction[] = [];

    for (const item of queue) {
      try {
        await executeAction(item.action);
        logger.debug(`Synced action: ${item.action.type}`);
      } catch (err) {
        logger.warn(`Failed to sync action: ${item.action.type}`);
        if (item.retryCount < 3) {
          failed.push({ ...item, retryCount: item.retryCount + 1 });
        }
        // Drop after 3 retries — data is likely stale
      }
    }

    set({ pendingActions: failed, isSyncing: false, lastSyncAt: Date.now() });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(failed));
    } catch (err) {
      logger.warn('Failed to persist offline queue after sync');
    }
  },

  loadFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as PendingAction[];
        set({ pendingActions: parsed });
        logger.debug(`Loaded ${parsed.length} pending offline actions`);
      }
    } catch {
      logger.warn('Failed to load offline queue from storage');
    }
  },
}));

async function executeAction(action: OfflineAction): Promise<void> {
  switch (action.type) {
    case 'MARK_DOSE_TAKEN':
      await dosesService.markTaken(action.payload.doseId, {
        takenAt: action.payload.takenAt,
        notes: action.payload.notes,
      });
      break;
    case 'MARK_DOSE_SKIPPED':
      await dosesService.markSkipped(action.payload.doseId, action.payload.notes);
      break;
    case 'SNOOZE_DOSE':
      await dosesService.snooze(action.payload.doseId, action.payload.snoozeMinutes);
      break;
    default:
      logger.warn(`Unknown offline action type`);
  }
}

// ─────────────────────────────────────────────────────────────
// Network monitor — uses fetch polling as a reliable fallback
// when @react-native-community/netinfo is not available
// ─────────────────────────────────────────────────────────────
let networkMonitorInterval: ReturnType<typeof setInterval> | null = null;

export function initNetworkMonitor(): () => void {
  // Poll connectivity every 10s
  const check = async () => {
    try {
      await fetch('https://clients3.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      useOfflineStore.getState().setOnline(true);
    } catch {
      useOfflineStore.getState().setOnline(false);
    }
  };

  void check();
  networkMonitorInterval = setInterval(() => void check(), 10_000);

  return () => {
    if (networkMonitorInterval) {
      clearInterval(networkMonitorInterval);
      networkMonitorInterval = null;
    }
  };
}
