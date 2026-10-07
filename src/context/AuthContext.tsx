import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/agent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, onAuthStateChanged, signOut as fbSignOut } from '../services/firebase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGitHub: async () => {},
  signInAsGuest: async () => {},
  signOutUser: async () => {},
});

const AUTH_STORAGE_KEY = '@agent_app_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for persistent guest or cached social user
    async function loadStoredUser() {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.warn('Failed to load user from storage', err);
      } finally {
        setLoading(false);
      }
    }

    loadStoredUser();

    // Listen to Firebase auth state if connected
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Agent Pioneer',
          photoURL: fbUser.photoURL,
          provider: 'google',
          createdAt: Date.now(),
        };
        setUser(profile);
        AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      // Social login simulation / AuthSession wrapper
      // Ready for Google Cloud Client IDs or mock authentication in local dev
      const mockGoogleUser: UserProfile = {
        uid: 'google_user_' + Date.now().toString().slice(-6),
        email: 'alex.creator@gmail.com',
        displayName: 'Alex Creator',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        provider: 'google',
        createdAt: Date.now(),
      };
      setUser(mockGoogleUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockGoogleUser));
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const mockGitHubUser: UserProfile = {
        uid: 'github_user_' + Date.now().toString().slice(-6),
        email: 'octodev@users.noreply.github.com',
        displayName: 'Octo Developer',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        provider: 'github',
        createdAt: Date.now(),
      };
      setUser(mockGitHubUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockGitHubUser));
    } finally {
      setLoading(false);
    }
  };

  const signInAsGuest = async () => {
    setLoading(true);
    try {
      const guestUser: UserProfile = {
        uid: 'guest_' + Math.random().toString(36).substring(2, 9),
        email: null,
        displayName: 'Guest Explorer',
        photoURL: null,
        provider: 'guest',
        createdAt: Date.now(),
      };
      setUser(guestUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(guestUser));
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {}
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithGitHub,
        signInAsGuest,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
