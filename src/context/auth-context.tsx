
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  switchUser?: (userId: string) => void; // Development only
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Development mode - bypass authentication
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDevelopment) {
      // In development, set a default admin user and skip Firebase auth
      const defaultUser = users.find(u => u.role === 'Admin') || users[0];
      setCurrentUser(defaultUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Try to get user data from Firestore first
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            // Fallback to local data for development
            const localUser = users.find(u => u.email === firebaseUser.email);
            setCurrentUser(localUser || null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to local data
          const localUser = users.find(u => u.email === firebaseUser.email);
          setCurrentUser(localUser || null);
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDevelopment]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isDevelopment) {
      // In development, find user by email or cedula
      const user = users.find(u => u.email === email || u.cedula === email);
      if (user) {
        setCurrentUser(user);
        return true;
      }
      return false;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const switchUser = (userId: string) => {
    if (isDevelopment) {
      const user = users.find(u => u.id === userId);
      if (user) {
        setCurrentUser(user);
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = { 
    currentUser, 
    firebaseUser, 
    login, 
    logout, 
    loading,
    ...(isDevelopment && { switchUser })
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
