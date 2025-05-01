import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { authService } from '../services/api';

type User = {
  id: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
        const accessToken = tokens?.access;
        const refreshToken = tokens?.refresh;
        const storedUser = localStorage.getItem('user');
        
        if (accessToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            try {
              const userData = await authService.getUserProfile();
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              scheduleTokenRefresh();
            } catch (error) {
              const authTokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
              if (authTokens?.refresh) {
                await attemptTokenRefresh();
              } else {
                clearAuthState();
              }
            }
          } catch (error) {
            clearAuthState();
          }
        } else if (tokens) {
          if (tokens.refresh) {
            await attemptTokenRefresh();
          } else {
            clearAuthState();
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadUser();
    
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, []);

  const clearAuthState = () => {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
    setUser(null);
    if (refreshTimer) clearInterval(refreshTimer);
  };

  const scheduleTokenRefresh = () => {
    if (refreshTimer) clearInterval(refreshTimer);
    const timer = setInterval(async () => {
      await attemptTokenRefresh();
    }, 25 * 60 * 1000);
    setRefreshTimer(timer);
  };

  const attemptTokenRefresh = async (): Promise<boolean> => {
    const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
    const refreshTokenValue = tokens?.refresh;
    if (!refreshTokenValue) {
      return false;
    }
    
    try {
      const response = await authService.refreshToken(refreshTokenValue);
      if (response && (response.token || response.access)) {
        localStorage.setItem('authTokens', JSON.stringify({ access: response.token || response.access, refresh: refreshTokenValue }));
      } else {
        throw new Error('No access token returned from refresh');
      }
      try {
        const userData = await authService.getUserProfile();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
      }
      return true;
    } catch (error) {
      clearAuthState();
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const now = Date.now();
    if (now - lastRefreshAttempt < 2000) {
      return !!user;
    }
    
    setLastRefreshAttempt(now);
    
    try {
      const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
      const accessToken = tokens?.access;
      if (!accessToken) {
        return await attemptTokenRefresh();
      }
      try {
        const userData = await authService.getUserProfile();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } catch (error) {
        return await attemptTokenRefresh();
      }
    } catch (error) {
      clearAuthState();
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.signIn(email, password);
      localStorage.setItem('authTokens', JSON.stringify({ access: response.token || response.access || response['token'], refresh: response.refresh }));
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || `${response.user.first_name || ''} ${response.user.last_name || ''}`.trim(),
        first_name: response.user.first_name,
        last_name: response.user.last_name,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Signed in successfully');
      scheduleTokenRefresh();
    } catch (error) {
      toast.error('Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const nameParts = name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      const response = await authService.signUp(first_name, last_name, email, password);
      localStorage.setItem('authTokens', JSON.stringify({ access: response.token || response.access || response['token'], refresh: response.refresh }));
      const userData = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || `${response.user.first_name || ''} ${response.user.last_name || ''}`.trim(),
        first_name: response.user.first_name,
        last_name: response.user.last_name,
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      toast.success('Account created successfully');
      scheduleTokenRefresh();
    } catch (error) {
      toast.error('Failed to create account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    clearAuthState();
    toast.success('Signed out successfully');
  };

  if (!isInitialized) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
