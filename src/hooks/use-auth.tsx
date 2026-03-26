import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { signUp, signIn, signOut, authClient } from '../lib/auth';

interface User {
  id: string;
  email: string;
  name?: string;
  company_name?: string;
  company_address?: string;
  company_email?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Helper to extract our User shape from a Better Auth user object.
 */
function toUser(authUser: any): User {
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.name,
    company_name: authUser.company_name,
    company_address: authUser.company_address,
    company_email: authUser.company_email,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount using Better Auth's SDK
  useEffect(() => {
    const checkSession = async () => {
      try {
        const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
        if (!authUrl) {
          console.warn(
            'VITE_NEON_AUTH_URL is not set. Skipping session check. ' +
            'Auth features will not work until this is configured.'
          );
          setUser(null);
          setLoading(false);
          return;
        }

        // Use Better Auth SDK's getSession – it knows the correct
        // base URL and path, so we avoid constructing URLs manually.
        const { data: session, error } = await authClient.getSession();

        if (error) {
          // Don't treat a missing session as a hard error – the user
          // simply isn't logged in.
          console.log('No active session:', error.message ?? error);
          setUser(null);
        } else if (session?.user) {
          if (session.user.emailVerified === false) {
            console.log('Unverified session detected on load, ignoring.');
            // Strictly require verification to let them act as a user.
            setUser(null);
            // Optionally authClient.signOut(); to kill it on server.
          } else {
            const userData = toUser(session.user);
            setUser(userData);
            // Signal that we have an active session — the API client will
            // fetch a real JWT from the /token endpoint on its next request.
            apiClient.setAuthToken();
            console.log('Session found:', userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Logging in with:', email);

      const response = await signIn.email({
        email,
        password,
      });

      console.log('Sign in response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Login failed');
      }

      if (response.data?.user) {
        if (response.data.user.emailVerified === false) {
          // Force error if user is returned but not verified
          throw Object.assign(new Error('email_not_verified'), { code: 'email_not_verified' });
        }
        const userData = toUser(response.data.user);
        setUser(userData);
        // Invalidate JWT cache so next API call fetches a fresh JWT
        apiClient.setAuthToken();
        console.log('User set from sign-in response:', userData);
      } else {
        // Fallback: fetch session via the SDK
        const { data: session } = await authClient.getSession();
        if (session?.user && session.user.emailVerified !== false) {
          const userData = toUser(session.user);
          setUser(userData);
          console.log('User set from session (post-login):', userData);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      console.log('Signing up with:', email, name);

      const response = await signUp.email({
        email,
        password,
        name,
      });

      console.log('Sign up response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Signup failed');
      }

      if (response.data?.user) {
        if (response.data.user.emailVerified === false) {
          console.log('User signed up but verification pending. Not setting session.');
          return;
        }
        const userData = toUser(response.data.user);
        setUser(userData);
        // Invalidate JWT cache so next API call fetches a fresh JWT
        apiClient.setAuthToken();
        console.log('User set from sign-up response:', userData);
      } else {
        // Fallback: fetch session via the SDK
        const { data: session } = await authClient.getSession();
        if (session?.user && session.user.emailVerified !== false) {
          const userData = toUser(session.user);
          setUser(userData);
          console.log('User set from session (post-signup):', userData);
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
    apiClient.clearAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
