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

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  requiresVerification: boolean;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
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

  setStoredToken(token: string) {
    apiClient.setAccessToken(token);
  },

  async register(credentials: RegisterCredentials, tenantId?: string): Promise<RegisterResponse> {
    if (tenantId) {
      apiClient.setTenantId(tenantId);
    }

    return apiClient.post<RegisterResponse>('auth/register', credentials, {
      skipAuth: true,
    });
  },

  async verifyEmail(token: string, tenantId?: string): Promise<VerifyEmailResponse> {
    if (tenantId) {
      apiClient.setTenantId(tenantId);
    }

    return apiClient.get<VerifyEmailResponse>(`auth/verify-email/${token}`, {
      skipAuth: true,
    });
  },

  async forgotPassword(email: string, tenantId?: string): Promise<ForgotPasswordResponse> {
    if (tenantId) {
      apiClient.setTenantId(tenantId);
    }

    return apiClient.post<ForgotPasswordResponse>('auth/forgot-password', { email }, {
      skipAuth: true,
    });
  },

  async resetPassword(token: string, newPassword: string, tenantId?: string): Promise<ResetPasswordResponse> {
    if (tenantId) {
      apiClient.setTenantId(tenantId);
    }

    return apiClient.post<ResetPasswordResponse>('auth/reset-password', { token, newPassword }, {
      skipAuth: true,
    });
  },
  
  async getProfile(): Promise<User> {
    return apiClient.get<User>('auth/me');
  },
};
