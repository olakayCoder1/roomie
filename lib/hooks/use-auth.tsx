'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { loginUser, registerUser, logoutUser, checkAuth } from '@/app/actions/auth';

type User = {
  id: string; // UUID from Supabase
  email: string; // Required, as per users table
  full_name?: string; // Optional, from users table
  age?: number; // Optional, from users table
  occupation?: string; // Optional, from users table (used in ProfileContent)
  location?: string; // Optional, from users table
  bio?: string; // Optional, from users table
  budget_low?: number; // Optional, from users table (should be number for consistency)
  budget_high?: number; // Optional, from users table (should be number for consistency)
  profile_url?: string; // Optional, from users table
  department?: string; // Optional, from users table
  level?: string; // Optional, from users table
  lifestylePreferences?: string[]; // Optional, derived from roommate_preferences table
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success?: boolean; error?: string }>;
  signUp: (email: string, password: string, full_name: string) => Promise<{ success?: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>; // Add refreshUser method
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to check authentication and update user data
  const checkUserAuth = async () => {
    try {
      const authData = await checkAuth();
      if (authData && authData.success) {
        setUser(authData.user);
        console.log(authData.user);
        return authData.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (error) {
      console.log('No existing session found');
      setUser(null);
      return null;
    }
  };

  // Refresh user data from server
  const refreshUser = async () => {
    if (!user?.id) return; // Don't refresh if no user is logged in
    
    try {
      setLoading(true);
      await checkUserAuth();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already authenticated on mount
    const initAuth = async () => {
      try {
        await checkUserAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await loginUser(email, password);
      
      if (result.error) {
        return { error: result.error };
      }
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      
      return { error: 'Login failed' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, full_name: string) => {
    try {
      // setLoading(true);
      const result = await registerUser(email, password, full_name);
      
      if (result.error) {
        return { error: result.error };
      }
      
      if (result.success && result.user) {
        setUser(result.user);
        return { success: true };
      }
      
      return { error: 'Registration failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};