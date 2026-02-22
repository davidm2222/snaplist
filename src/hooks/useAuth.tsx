'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  useEffect(() => {
    // If auth is not initialized (no Firebase config), stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      firebaseUserRef.current = firebaseUser;
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      setError('Firebase not configured');
      throw new Error('Firebase not configured');
    }
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    if (!auth) {
      setError('Firebase not configured');
      throw new Error('Firebase not configured');
    }
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out';
      setError(message);
      throw err;
    }
  };

  const getIdToken = async (): Promise<string> => {
    if (!firebaseUserRef.current) throw new Error('Not authenticated');
    return firebaseUserRef.current.getIdToken();
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, getIdToken, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
