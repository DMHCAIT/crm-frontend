/**
 * PRODUCTION AUTH HOOK
 * Replaces mock authentication with real backend integration
 */

import { useState, useEffect } from 'react';
import { getAuthService, User, TokenManager } from '../lib/productionAuth';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authService = getAuthService();

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Check if there's a stored token and it's not expired
        const token = TokenManager.getToken();
        const storedUser = authService.getCurrentUser();
        
        if (token && storedUser && !TokenManager.isTokenExpired()) {
          // Only verify token if we have a valid, non-expired token
          try {
            const verifiedUser = await authService.verifyToken();
            if (verifiedUser) {
              setUser(verifiedUser);
            } else {
              // Token verification failed, clear everything
              TokenManager.removeToken();
              setUser(null);
            }
          } catch (verifyError) {
            // If verification fails, clear tokens and continue as unauthenticated
            console.warn('Token verification failed, clearing session:', verifyError);
            TokenManager.removeToken();
            setUser(null);
          }
        } else {
          // No token or expired token, clear everything
          TokenManager.removeToken();
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Don't set error state for initialization issues, just clear session
        TokenManager.removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.signIn(username, password);
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.signUp(username, password, name);
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    
    try {
      await authService.signOut();
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Always clear state even if logout fails
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user && authService.isAuthenticated()
  };
};