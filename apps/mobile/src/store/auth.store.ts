import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { TokenStorage } from '../lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profile?: {
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
    timezone: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  hydrate: async () => {
    const token = await TokenStorage.getAccessToken();
    if (token) {
      set({ isAuthenticated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.login({ email, password });
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      set({
        isLoading: false,
        error: error.response?.data?.error?.message ?? 'Login failed. Please try again.',
      });
      throw err;
    }
  },

  register: async (email, password, firstName, lastName) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authService.register({ email, password, firstName, lastName });
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      set({
        isLoading: false,
        error: error.response?.data?.error?.message ?? 'Registration failed. Please try again.',
      });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearError: () => set({ error: null }),
}));
