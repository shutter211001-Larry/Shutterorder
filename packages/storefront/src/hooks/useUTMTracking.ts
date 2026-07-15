import { useEffect } from 'react';

export function useUTMTracking() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');

    if (utmSource) sessionStorage.setItem('utmSource', utmSource);
    if (utmMedium) sessionStorage.setItem('utmMedium', utmMedium);
    if (utmCampaign) sessionStorage.setItem('utmCampaign', utmCampaign);
  }, []);
}
