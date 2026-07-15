import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, ShoppingBag, Target, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api.js';

interface UTMStats {
  source: string;
  medium: string;
  campaign: string;
  ordersCount: number;
  totalRevenue: number;
}

export default function MarketingDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<UTMStats[]>([]);
  const [summary, setSummary] = useState({ totalUTMOrders: 0, totalUTMRevenue: 0 });
  
  // Funnel State
  const [funnel, setFunnel] = useState<Record<string, number>>({
    VIEW_MENU: 0,
    ADD_TO_CART: 0,
    BEGIN_CHECKOUT: 0,
    PURCHASE: 0
  });

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  // UTM Generator State
  const [utmSource, setUtmSource] = useState('facebook');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState('summer_sale');
  const [copied, setCopied] = useState(false);

  // Store URL fallback logic
  const storeUrl = import.meta.env.VITE_STORE_URL_PUBLIC || window.location.origin.replace('admin.', 'store.');
  const generatedLink = `${storeUrl}?utm_source=${encodeURIComponent(utmSource)}&utm_medium=${encodeURIComponent(utmMedium)}&utm_campaign=${encodeURIComponent(utmCampaign)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const end = new Date();
      const start = new Date();
      if (dateRange === '7d') start.setDate(start.getDate() - 7);
      if (dateRange === '30d') start.setDate(start.getDate() - 30);
      if (dateRange === '90d') start.setDate(start.getDate() - 90);
      
      const query = dateRange !== 'all' 
        ? `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        : '';

      const res = await api.get<{ success: boolean; data: { stats: UTMStats[]; summary: any } }>(`/marketing/stats${query}`);
      setStats(res.data.stats);
      setSummary(res.data.summary);

      const funnelRes = await api.get<{ success: boolean; data: Record<string, number> }>(`/analytics/funnel${query}`);
      if (funnelRes.success && funnelRes.data) {
        setFunnel({
          VIEW_MENU: funnelRes.data.VIEW_MENU || 0,
          ADD_TO_CART: funnelRes.data.ADD_TO_CART || 0,
          BEGIN_CHECKOUT: funnelRes.data.BEGIN_CHECKOUT || 0,
          PURCHASE: funnelRes.data.PURCHASE || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch marketing stats', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('nav.marketingDashboard')}
        </h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tracked Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '-' : summary.totalUTMOrders}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tracked Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {loading ? '-' : `$${summary.totalUTMRevenue.toFixed(2)}`}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <LinkIcon size={20} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">產生行銷追蹤網址 (UTM Generator)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">來源 (Source)</label>
            <input 
              type="text" 
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              placeholder="e.g. facebook, google, ig"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">媒介 (Medium)</label>
            <input 
              type="text" 
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              placeholder="e.g. social, cpc, email"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">活動 (Campaign)</label>
            <input 
              type="text" 
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="e.g. summer_sale, kol_promo"
              className="w-full rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <code className="flex-1 text-sm text-gray-800 dark:text-gray-200 break-all">
            {generatedLink}
          </code>
          <button 
            onClick={handleCopyLink}
            className="flex items-center gap-2 whitespace-nowrap px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? '已複製！' : '複製網址'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">購物漏斗轉換分析 (Shopping Funnel Analysis)</h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {[
            { label: '瀏覽菜單', value: funnel.VIEW_MENU, color: 'bg-blue-500' },
            { label: '加入購物車', value: funnel.ADD_TO_CART, color: 'bg-indigo-500' },
            { label: '開始結帳', value: funnel.BEGIN_CHECKOUT, color: 'bg-purple-500' },
            { label: '完成購買', value: funnel.PURCHASE, color: 'bg-green-500' }
          ].map((step, idx, arr) => {
            const maxVal = Math.max(funnel.VIEW_MENU, 1);
            const heightPerc = Math.max(10, Math.round((step.value / maxVal) * 100));
            const prevVal = idx === 0 ? step.value : arr[idx - 1].value;
            const dropoff = prevVal === 0 ? 0 : Math.round(((prevVal - step.value) / prevVal) * 100);

            return (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center flex-1 w-full">
                  <div className="h-40 w-full flex items-end justify-center mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2">
                    <div 
                      className={`${step.color} w-16 md:w-20 rounded-t-md transition-all duration-1000 ease-in-out flex items-start justify-center pt-2`}
                      style={{ height: `${heightPerc}%` }}
                    >
                      <span className="text-white font-bold text-sm drop-shadow-md">{step.value}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{step.label}</span>
                </div>
                
                {idx < arr.length - 1 && (
                  <div className="flex flex-col items-center justify-center px-2">
                    <span className="text-xs text-red-500 font-medium mb-1 whitespace-nowrap">流失 {dropoff}%</span>
                    <div className="hidden md:block w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                    <div className="md:hidden h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Target size={20} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Campaign Performance</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Medium</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Orders</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Loading data...</td>
                </tr>
              ) : stats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No marketing data found for the selected period.
                  </td>
                </tr>
              ) : (
                stats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {stat.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {stat.medium}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {stat.campaign}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {stat.ordersCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 text-right">
                      ${stat.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
