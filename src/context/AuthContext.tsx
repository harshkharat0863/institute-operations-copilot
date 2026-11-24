import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { decodeJwt } from '../lib/jwt';
import { DEMO_ACCOUNTS } from '../lib/demoAccounts';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, specialization?: string) => Promise<void>;
  logout: () => void;
  switchRoleQuick: (targetRole: UserRole) => Promise<void>;
  forbiddenScreenTriggered: boolean;
  setForbiddenScreenTriggered: (val: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('copilot_jwt_token');
    }
    return null;
  });

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [forbiddenScreenTriggered, setForbiddenScreenTriggered] = useState<boolean>(false);

  // Sync token and extract role strictly from decoded JWT payload
  useEffect(() => {
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.role) {
        const demoMatch = Object.values(DEMO_ACCOUNTS).find(u => u.id === decoded.id || u.role === decoded.role);
        setUser({
          id: decoded.id,
          name: decoded.name,
          email: decoded.email,
          role: decoded.role,
          trainer_id: decoded.trainer_id,
          avatar: demoMatch?.avatar,
        });
        setRole(decoded.role);
      } else {
        // Invalid or expired token
        localStorage.removeItem('copilot_jwt_token');
        setToken(null);
        setUser(null);
        setRole(null);
      }
    } else {
      setUser(null);
      setRole(null);
    }
    setIsLoading(false);
  }, [token]);

  // Global listener for 401 & 403 API responses
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setRole(null);
    };

    const handleForbidden = () => {
      setForbiddenScreenTriggered(true);
    };

    window.addEventListener('auth_unauthorized', handleUnauthorized);
    window.addEventListener('auth_forbidden', handleForbidden);
    return () => {
      window.removeEventListener('auth_unauthorized', handleUnauthorized);
      window.removeEventListener('auth_forbidden', handleForbidden);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { token: newToken } = await api.login(email, password);
      setToken(newToken);
      setForbiddenScreenTriggered(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole, specialization?: string) => {
    setIsLoading(true);
    try {
      const { token: newToken } = await api.register({ name, email, password, role, specialization });
      setToken(newToken);
      setForbiddenScreenTriggered(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('copilot_jwt_token');
    setToken(null);
    setUser(null);
    setRole(null);
    setForbiddenScreenTriggered(false);
  };

  const switchRoleQuick = async (targetRole: UserRole) => {
    const targetDemo = DEMO_ACCOUNTS[targetRole];
    if (targetDemo) {
      await login(targetDemo.email, targetDemo.password);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user && !!role,
        isLoading,
        login,
        register,
        logout,
        switchRoleQuick,
        forbiddenScreenTriggered,
        setForbiddenScreenTriggered,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
