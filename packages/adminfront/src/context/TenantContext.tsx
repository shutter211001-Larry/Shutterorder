import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

interface TenantSettings {
  siteName: string;
  logo: string | null;
  colorPrimary: string;
}

interface TenantContextType {
  settings: TenantSettings | null;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType>({ settings: null, loading: true });

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real SaaS, this would call an unauthenticated public endpoint to get branding based on the current domain/tenantId
    const fetchSettings = async () => {
      try {
        // We assume /api/settings/public exists
        const res = await api.get<{ data: TenantSettings }>('/settings/public');
        setSettings(res.data);
        
        // Inject CSS variables
        if (res.data.colorPrimary) {
          document.documentElement.style.setProperty('--color-primary', res.data.colorPrimary);
        }
      } catch (err) {
        console.error('Failed to load tenant settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <TenantContext.Provider value={{ settings, loading }}>
      {children}
    </TenantContext.Provider>
  );
};
