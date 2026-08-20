import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────
// API Base URL (configure in app.json extra or env)
// ─────────────────────────────────────────────────────────────
const API_BASE_URL =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'http://localhost:3000/api/v1';

const SECURE_KEY_ACCESS = 'mediloop_access_token';
const SECURE_KEY_REFRESH = 'mediloop_refresh_token';

// ─────────────────────────────────────────────────────────────
// Token storage helpers
// ─────────────────────────────────────────────────────────────
export const TokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SECURE_KEY_ACCESS);
  },
  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(SECURE_KEY_REFRESH);
  },
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(SECURE_KEY_ACCESS, access),
      SecureStore.setItemAsync(SECURE_KEY_REFRESH, refresh),
    ]);
  },
  async clearTokens(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(SECURE_KEY_ACCESS),
      SecureStore.deleteItemAsync(SECURE_KEY_REFRESH),
    ]);
  },
};

// ─────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await TokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: refresh token on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post<{
          data: { accessToken: string; refreshToken: string };
        }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

        const { accessToken, refreshToken: newRefresh } = response.data.data;
        await TokenStorage.setTokens(accessToken, newRefresh);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await TokenStorage.clearTokens();
        // Emit session expired event
        sessionExpiredEmitter.emit();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ─────────────────────────────────────────────────────────────
// Session expired event bus
// ─────────────────────────────────────────────────────────────
type Listener = () => void;
const sessionExpiredEmitter = {
  listeners: new Set<Listener>(),
  emit() {
    this.listeners.forEach((l) => l());
  },
  on(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
};

export { sessionExpiredEmitter };
