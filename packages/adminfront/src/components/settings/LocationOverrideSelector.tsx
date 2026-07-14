import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { MapPin, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Location {
  id: string;
  name: string;
}

interface LocationOverrideSelectorProps {
  value: string; // '' means global
  onChange: (locationId: string) => void;
}

export function LocationOverrideSelector({ value, onChange }: LocationOverrideSelectorProps) {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    api.get('locations')
      .then(res => {
        if (res.success && res.data) {
          setLocations(res.data);
        }
      });
  }, []);

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h3 className="text-blue-900 font-bold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          {t('locationOverrideSelector.13ea39') || (t('locationOverrideSelector.13ea39') || '分店獨立設定覆寫 (Location Override)')}</h3>
        <p className="text-sm text-blue-700 mt-1">
          {t('locationOverrideSelector.81743d') || (t('locationOverrideSelector.81743d') || '您可以選擇「全局預設」來套用至所有分店，或是選擇特定分店以覆寫預設值。')}</p>
      </div>

      <div className="relative min-w-[200px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-blue-200 text-blue-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-2.5 shadow-sm font-medium"
        >
          <option value="">{t('locationOverrideSelector.3306fc') || (t('locationOverrideSelector.3306fc') || '🌐 全局預設 (Global Default)')}</option>
          {locations.map(loc => (
            <option key={loc.id} value={loc.id}>
              🏪 {loc.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    </div>
  );
}
