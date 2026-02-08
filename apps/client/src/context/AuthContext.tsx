// Auth Context for global authentication state

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, apiClient, type User, type LoginCredentials } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, tenantId?: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: (token: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = authApi.getStoredToken();
      if (token) {
        try {
          const userProfile = await authApi.getProfile();
          setUser(userProfile);
          // Synchronize tenantId for API requests
          apiClient.setTenantId(userProfile.tenantId);
          localStorage.setItem('user', JSON.stringify(userProfile));
        } catch {
          // Token invalid, clear auth
          authApi.logout();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const initializeSession = async (token: string) => {
    setIsLoading(true);
    try {
      // Set the token in apiClient via authApi
      authApi.setStoredToken(token);
      // Fetch user profile
      const userProfile = await authApi.getProfile();
      setUser(userProfile);
      // Synchronize tenantId for API requests
      apiClient.setTenantId(userProfile.tenantId);
      localStorage.setItem('user', JSON.stringify(userProfile));
    } catch (err) {
      console.error('Failed to initialize session:', err);
      authApi.logout();
      setUser(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials, tenantId?: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await authApi.login(credentials, tenantId);
      setUser(response.user);
      // Store user for persistence
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      const message = err instanceof Error ? err.message : 
        (err as { message?: string })?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        initializeSession,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
