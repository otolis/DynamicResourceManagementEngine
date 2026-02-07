// Auth API for DRME backend

import { apiClient } from './client';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authApi = {
  async login(credentials: LoginCredentials, tenantId?: string): Promise<LoginResponse> {
    // Set tenant ID if provided
    if (tenantId) {
      apiClient.setTenantId(tenantId);
    }

    const response = await apiClient.post<LoginResponse>('auth/login', credentials, {
      skipAuth: true,
    });

    // Store the access token
    apiClient.setAccessToken(response.accessToken);

    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('auth/logout');
    } finally {
      apiClient.clearAuth();
    }
  },

  async refreshToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(
      'auth/refresh',
      undefined,
      { skipAuth: true }
    );
    apiClient.setAccessToken(response.accessToken);
    return response;
  },

  isAuthenticated(): boolean {
    return !!apiClient.getAccessToken();
  },

  getStoredToken(): string | null {
    return apiClient.getAccessToken();
  },
};
