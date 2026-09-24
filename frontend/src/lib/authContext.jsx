'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from './api.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = localStorage.getItem('trao_auth_token');
        if (token) {
          const res = await api.auth.me();
          setUser(res.user);
        }
      } catch (err) {
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    api.auth.logout().catch(() => {});
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
