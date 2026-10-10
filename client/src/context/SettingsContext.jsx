import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const SettingsContext = createContext(null);

const FALLBACK = {
  company_name: 'BnanBrand',
  company_email: '',
  phone: '',
  whatsapp: '',
  address: '',
  currency: '₪',
  shipping_fee: 0,
  free_shipping_threshold: 0,
  about_text: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/api/settings');
      setSettings({ ...FALLBACK, ...data.settings });
    } catch {
      setSettings(FALLBACK);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refresh: load }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
