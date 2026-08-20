import { apiClient, TokenStorage } from '../lib/api';

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/register', input);
    const { tokens } = res.data.data;
    await TokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return res.data.data;
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const res = await apiClient.post<{ data: AuthResponse }>('/auth/login', input);
    const { tokens } = res.data.data;
    await TokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      await TokenStorage.clearTokens();
    }
  },

  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token });
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  },
};
