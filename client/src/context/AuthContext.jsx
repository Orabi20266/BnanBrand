import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('bnan_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('bnan_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('bnan_token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
