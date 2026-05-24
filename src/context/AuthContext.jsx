import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearVerifiedTrainee, saveVerifiedTrainee } from '../services/traineeVerification';

const AUTH_STORAGE_KEY = 'vanloka_auth_session';
const DEMO_NAME = 'Ram';
const DEMO_MOBILE = '9874563210';

const AuthContext = createContext(null);

function getStoredSession() {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch (error) {
    console.log('Unable to read auth session:', error);
    return null;
  }
}

function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  const value = useMemo(() => {
    const user = session?.user || null;

    return {
      user,
      isAuthenticated: Boolean(user),
      demoCredentials: {
        name: DEMO_NAME,
        mobile: DEMO_MOBILE,
      },
      login(credentials) {
        const nextUser = {
          name: credentials.name.trim(),
          mobile: normalizeMobile(credentials.mobile),
        };

        setSession({ user: nextUser });
        saveVerifiedTrainee({
          id: 't1',
          name: nextUser.name,
          phone: nextUser.mobile,
          status: 'active',
          attempts: 0,
          bestScore: 0,
        });
      },
      logout() {
        setSession(null);
        clearVerifiedTrainee();
      },
    };
  }, [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}