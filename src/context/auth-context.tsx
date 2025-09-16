
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  React.useEffect(() => {
    // Simulate checking for a logged-in user in session storage
    const storedUserEmail = sessionStorage.getItem('currentUserEmail');
    if (storedUserEmail) {
      const user = users.find(u => u.email === storedUserEmail);
      setCurrentUser(user || null);
    }
    setLoading(false);
  }, []);

  const login = (email: string, password?: string) => {
    // This is a mock login. In a real app, you'd validate the password against a backend.
    const user = users.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('currentUserEmail', user.email);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUserEmail');
    router.push('/login');
  };

  const value = { currentUser, login, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
