/**
 * PRODUCTION AUTHENTICATION SYSTEM
 * Real JWT-based authentication replacing mock localStorage system
 */

import { getApiConfig } from './backend';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

// Token management
const TOKEN_KEY = 'crm_auth_token';
const USER_KEY = 'crm_user_data';

export class TokenManager {
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

// Production Authentication Service
export class ProductionAuthService {
  private apiConfig = getApiConfig();

  async signIn(username: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const { token, user } = await response.json();

      // Store token and user data
      TokenManager.setToken(token);
      TokenManager.setStoredUser(user);

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signUp(username: string, password: string, name?: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password, name: name || username })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const { token, user } = await response.json();

      // Store token and user data
      TokenManager.setToken(token);
      TokenManager.setStoredUser(user);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const token = TokenManager.getToken();
      if (token) {
        await fetch(`${this.apiConfig.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth state
      TokenManager.removeToken();
    }
  }

  async verifyToken(): Promise<User | null> {
    const token = TokenManager.getToken();
    if (!token || TokenManager.isTokenExpired()) {
      TokenManager.removeToken();
      return null;
    }

    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        TokenManager.removeToken();
        return null;
      }

      const { user } = await response.json();
      TokenManager.setStoredUser(user);
      return user;
    } catch (error) {
      console.error('Token verification error:', error);
      TokenManager.removeToken();
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    const currentToken = TokenManager.getToken();
    if (!currentToken) return null;

    try {
      const response = await fetch(`${this.apiConfig.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        TokenManager.removeToken();
        return null;
      }

      const { token, user } = await response.json();
      TokenManager.setToken(token);
      TokenManager.setStoredUser(user);

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      TokenManager.removeToken();
      return null;
    }
  }

  getCurrentUser(): User | null {
    return TokenManager.getStoredUser();
  }

  isAuthenticated(): boolean {
    const token = TokenManager.getToken();
    return !!(token && !TokenManager.isTokenExpired());
  }
}

// Singleton instance
let authService: ProductionAuthService | null = null;

export const getAuthService = (): ProductionAuthService => {
  if (!authService) {
    authService = new ProductionAuthService();
  }
  return authService;
};

// Hook for components (simplified without React context)
export const useProductionAuth = () => {
  const authService = getAuthService();
  
  return {
    signIn: (username: string, password: string) => authService.signIn(username, password),
    signUp: (username: string, password: string, name?: string) => authService.signUp(username, password, name),
    signOut: () => authService.signOut(),
    verifyToken: () => authService.verifyToken(),
    refreshToken: () => authService.refreshToken(),
    getCurrentUser: () => authService.getCurrentUser(),
    isAuthenticated: () => authService.isAuthenticated()
  };
};

// API Request interceptor with authentication
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = TokenManager.getToken();
  
  const authHeaders = token ? {
    'Authorization': `Bearer ${token}`,
    ...options.headers
  } : options.headers;

  const response = await fetch(url, {
    ...options,
    headers: authHeaders
  });

  // Handle 401 unauthorized
  if (response.status === 401 && token) {
    // Try to refresh token
    const authService = getAuthService();
    const newToken = await authService.refreshToken();
    
    if (newToken) {
      // Retry with new token
      return fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${newToken}`,
          ...options.headers
        }
      });
    } else {
      // Refresh failed, redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
  }

  return response;
};
