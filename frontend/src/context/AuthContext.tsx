
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

  // Load user from token on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
        const accessToken = tokens?.access;
        const refreshToken = tokens?.refresh;
        const storedUser = localStorage.getItem('user');
        
        console.log('Initial auth state check:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, hasStoredUser: !!storedUser });
        
        if (accessToken && storedUser) {
          try {
            // Parse stored user
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('Retrieved stored user:', parsedUser);
            
            // Verify token validity with the server
            try {
              // Get fresh user data from the server
              console.log('Verifying token with server...');
              const userData = await authService.getUserProfile();
              console.log('Fresh user data from server:', userData);
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              
              // Setup token refresh schedule
              scheduleTokenRefresh();
            } catch (error) {
              console.error('Token validation failed:', error);
              // Try to refresh the token if we have a refresh token
              const authTokens = JSON.parse(storedAuthTokens);
              if (authTokens.refresh) {
                await attemptTokenRefresh();
              } else {
                clearAuthState();
              }
            }
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            clearAuthState();
          }
        } else if (storedAuthTokens) {
          // We have stored auth tokens but no stored user
          const authTokens = JSON.parse(storedAuthTokens);
          if (authTokens.refresh) {
            await attemptTokenRefresh();
          } else {
            clearAuthState();
          }
        } else {
          console.log('No stored authentication found');
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadUser();
    
    // Clean up refresh timer on unmount
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
    // Clear any existing refresh timer
    if (refreshTimer) clearInterval(refreshTimer);
    
    // Set up a timer to refresh the token every 25 minutes
    // (assuming the token expires in 1 hour)
    const timer = setInterval(async () => {
      console.log('Auto refreshing token...');
      await attemptTokenRefresh();
    }, 25 * 60 * 1000); // 25 minutes
    
    setRefreshTimer(timer);
  };
  
  const attemptTokenRefresh = async (): Promise<boolean> => {
    const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
    const refreshTokenValue = tokens?.refresh;
    if (!refreshTokenValue) {
      console.log('No refresh token available');
      return false;
    }
    
    try {
      console.log('Attempting to refresh token using refresh token');
      const response = await authService.refreshToken(refreshTokenValue);
      if (response && response.access) {
        localStorage.setItem('authTokens', JSON.stringify({ access: response.access, refresh: refreshTokenValue }));
        console.log('Token refreshed successfully');
      } else {
        throw new Error('No access token returned from refresh');
      }
      // Get fresh user data after token refresh
      try {
        const userData = await authService.getUserProfile();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Failed to get user profile after token refresh:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearAuthState();
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const now = Date.now();
    // Prevent multiple refresh attempts within 2 seconds
    if (now - lastRefreshAttempt < 2000) {
      console.log('Skipping token refresh - too soon since last attempt');
      return !!user; // Return current auth status
    }
    
    setLastRefreshAttempt(now);
    
    try {
      console.log('Attempting to refresh authentication...');
      
      // Check if token exists
      const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
      const accessToken = tokens?.access;
      if (!accessToken) {
        // Try to use refresh token
        console.log('No access token, attempting to refresh');
        return await attemptTokenRefresh();
      }
      
      // Verify current token with the server
      try {
        const userData = await authService.getUserProfile();
        console.log('Authentication token is still valid:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } catch (error) {
        console.log('Token validation failed, trying to refresh token');
        return await attemptTokenRefresh();
      }
    } catch (error) {
      console.error('Failed to refresh authentication:', error);
      clearAuthState();
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Signing in with email:', email);
      const response = await authService.signIn(email, password);
      console.log('Sign in successful, received token and user data:', response);
      
      // Store tokens (map token->access for compatibility)
      localStorage.setItem('authTokens', JSON.stringify({ access: response.token || response.access, refresh: response.refresh }));
      
      // Format user data
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
      
      // Setup token refresh schedule
      scheduleTokenRefresh();
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Split the name into first_name and last_name
      const nameParts = name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      
      console.log('Signing up with:', { first_name, last_name, email });
      const response = await authService.signUp(first_name, last_name, email, password);
      console.log('Sign up successful, received token and user data:', response);
      
      // Store tokens (map token->access for compatibility)
      localStorage.setItem('authTokens', JSON.stringify({ access: response.token || response.access, refresh: response.refresh }));
      
      // Format user data
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
      
      // Setup token refresh schedule
      scheduleTokenRefresh();
    } catch (error) {
      console.error('Sign up error:', error);
      toast.error('Failed to create account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    console.log('Signing out user');
    clearAuthState();
    toast.success('Signed out successfully');
  };

  // Only render children once auth is initialized
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