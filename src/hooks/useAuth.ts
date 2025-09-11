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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
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
        
        // Check if user is already authenticated
        const storedUser = authService.getCurrentUser();
        if (storedUser && authService.isAuthenticated()) {
          // Verify token with backend
          const verifiedUser = await authService.verifyToken();
          setUser(verifiedUser);
        } else {
          // Clear invalid tokens
          TokenManager.removeToken();
          setUser(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
        setUser(null);
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
      const userData = await authService.signIn(email, password);
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    setError(null);

    try {
      const userData = await authService.signUp(email, password, name);
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
