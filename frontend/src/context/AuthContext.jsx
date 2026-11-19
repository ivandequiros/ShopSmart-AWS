import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api.me()
      .then((data) => { if (active) setUser(data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    checking,
    async login(credentials) {
      const data = await api.login(credentials);
      setUser(data.user);
      return data.user;
    },
    async register(account) {
      const data = await api.register(account);
      setUser(data.user);
      return data.user;
    },
    async logout() {
      await api.logout().catch(() => null);
      setUser(null);
    }
  }), [user, checking]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
