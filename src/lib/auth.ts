/**
 * PRODUCTION AUTHENTICATION SYSTEM
 * Real JWT-based authentication replacing mock localStorage system
 */

import { useState, useEffect } from 'react';
import { getApiClient } from './backend';
import { getApiClient } from './backend';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
}

// Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management
const TOKEN_KEY = 'crm_auth_token';
const USER_KEY = 'crm_user_data';

class TokenManager {
  static getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static getStoredUser(): User | null {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  static setStoredUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// Auth Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiClient = getApiClient();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const token = TokenManager.getToken();
        const storedUser = TokenManager.getStoredUser();

        if (!token || TokenManager.isTokenExpired()) {
          // Token expired or missing
          TokenManager.removeToken();
          setUser(null);
          return;
        }

        if (storedUser) {
          // Verify token with backend
          try {
            await apiClient.verifyAuth();
            setUser(storedUser);
          } catch (err) {
            // Token invalid, clear auth
            TokenManager.removeToken();
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call real backend auth endpoint
      const response = await fetch(`${apiClient.getBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user: userData } = await response.json();

      // Store token and user data
      TokenManager.setToken(token);
      TokenManager.setStoredUser(userData);
      setUser(userData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Call real backend registration endpoint
      const response = await fetch(`${apiClient.getBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const { token, user: userData } = await response.json();

      // Store token and user data
      TokenManager.setToken(token);
      TokenManager.setStoredUser(userData);
      setUser(userData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      // Call backend logout endpoint
      await fetch(`${apiClient.getBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`,
          'Content-Type': 'application/json',
        }
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local auth state
      TokenManager.removeToken();
      setUser(null);
      setError(null);
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const currentToken = TokenManager.getToken();
      if (!currentToken) throw new Error('No token available');

      const response = await fetch(`${apiClient.getBaseUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const { token, user: userData } = await response.json();
      TokenManager.setToken(token);
      TokenManager.setStoredUser(userData);
      setUser(userData);

    } catch (err) {
      console.error('Token refresh error:', err);
      // If refresh fails, log out user
      await signOut();
    }
  };

  // Auto-refresh token before it expires
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      if (TokenManager.isTokenExpired()) {
        refreshToken();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// API interceptor for authentication
export class AuthenticatedApiClient {
  constructor(private baseClient: any) {}

  async request(url: string, options: RequestInit = {}) {
    const token = TokenManager.getToken();
    
    const authHeaders = token ? {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    } : options.headers;

    try {
      const response = await this.baseClient.request(url, {
        ...options,
        headers: authHeaders
      });

      return response;
    } catch (error: any) {
      // Handle 401 unauthorized errors
      if (error.status === 401) {
        // Token expired, try to refresh
        try {
          const authContext = useAuth();
          await authContext.refreshToken();
          
          // Retry request with new token
          const newToken = TokenManager.getToken();
          return await this.baseClient.request(url, {
            ...options,
            headers: {
              'Authorization': `Bearer ${newToken}`,
              ...options.headers
            }
          });
        } catch (refreshError) {
          // Refresh failed, redirect to login
          TokenManager.removeToken();
          window.location.href = '/login';
          throw refreshError;
        }
      }
      
      throw error;
    }
  }
}

export { TokenManager };
