import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  login as loginService,
  logout as logoutService,
  onAuthStateChangedListener,
  register as registerService
} from '../../services/authService';
import {
  ensureUserProfiles,
  getMyPrivateProfile,
  getUserById,
  updateMyPrivateProfile,
  updateUserProfile
} from '../../services/userService';
import { getErrorMessage } from '../../utils/errors';

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, ms = 4000): Promise<T | null> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), ms);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(() => {
          clearTimeout(timer);
          resolve(null);
        });
    });
  }, []);

  const syncUser = useCallback(async (authUser: any) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    try {
      await withTimeout(
        ensureUserProfiles({
          uid: authUser.uid,
          email: authUser.email || '',
          nome: authUser.displayName || ''
        }),
        5000
      );

      const profile = await withTimeout(getUserById(authUser.uid), 4500);
      setUser((prev: any) => ({
        uid: authUser.uid,
        email: authUser.email,
        ...prev,
        ...profile
      }));

      const privateProfile = await withTimeout(getMyPrivateProfile(authUser.uid), 2500);
      if (privateProfile) {
        setUser((prev: any) => ({
          ...prev,
          ...privateProfile
        }));
      }
    } catch (err) {
      console.error('[AuthProvider] Erro ao sincronizar usuário:', err);
    }
  }, [withTimeout]);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener((authUser) => {
      syncUser(authUser).finally(() => setLoading(false));
    });

    return unsubscribe;
  }, [syncUser]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError('');
    try {
      await loginService(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: any) => {
    setLoading(true);
    setError('');
    try {
      await registerService(payload);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    if (!user?.uid) return;
    setLoading(true);
    setError('');
    try {
      await updateUserProfile(user.uid, data);
      await syncUser({ uid: user.uid, email: user.email });
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, syncUser]);

  const updatePrivateProfile = useCallback(async (data: any) => {
    if (!user?.uid) return;
    setLoading(true);
    setError('');
    try {
      await updateMyPrivateProfile(user.uid, data);
      await syncUser({ uid: user.uid, email: user.email });
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, syncUser]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await logoutService();
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
      throw err;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      updateProfile,
      updatePrivateProfile,
      logout
    }),
    [user, loading, error, login, register, updateProfile, updatePrivateProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
