// API Client with JWT token management for DRME backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || 'default-tenant';

interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private tenantId: string = DEFAULT_TENANT_ID;

  constructor() {
    // 1. Detect tenant from subdomain (subdomain.drme.com)
    const subdomainTenant = this.resolveSubdomainTenant();
    if (subdomainTenant) {
      this.tenantId = subdomainTenant;
    } else {
      // 2. Fallback to localStorage
      const storedTenantId = localStorage.getItem('tenantId');
      if (storedTenantId) {
        this.tenantId = storedTenantId;
      }
    }

    // 3. Load token from localStorage
    this.accessToken = localStorage.getItem('accessToken');
  }

  private resolveSubdomainTenant(): string | null {
    if (typeof window === 'undefined') return null;
    
    const hostname = window.location.hostname;
    // Skip localhost and IP addresses
    if (
      hostname === 'localhost' || 
      hostname === '127.0.0.1' ||
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    ) {
      return null;
    }

    const parts = hostname.split('.');
    // Need at least 3 parts for subdomain (e.g., tenant.example.com)
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    localStorage.setItem('tenantId', tenantId);
  }

  getTenantId(): string {
    return this.tenantId;
  }

  clearAuth() {
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.tenantId,
      ...headers,
    };

    // Add auth header if we have a token and skipAuth is false
    if (this.accessToken && !skipAuth) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: 'include', // For cookies (refresh token)
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}`, config);

    // Handle 401 - try to refresh token
    if (response.status === 401 && !skipAuth && !endpoint.includes('auth/refresh')) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry the original request
        requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}/${endpoint}`, {
          ...config,
          headers: requestHeaders,
        });
        
        if (!retryResponse.ok) {
          const error: ApiError = await retryResponse.json().catch(() => ({
            message: 'Request failed',
            statusCode: retryResponse.status,
          }));
          throw error;
        }
        
        return retryResponse.json();
      } else {
        // Refresh failed, clear auth
        this.clearAuth();
        throw { message: 'Session expired', statusCode: 401 };
      }
    }

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'Request failed',
        statusCode: response.status,
      }));
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  }

  private async tryRefreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': this.tenantId,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Convenience methods
  get<T>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  delete<T>(endpoint: string, options?: Omit<ApiClientOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
export type { ApiError };
