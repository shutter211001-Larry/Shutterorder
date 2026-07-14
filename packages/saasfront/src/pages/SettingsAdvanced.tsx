import { api } from '../lib/api';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ToggleRow } from '../components/ui/ToggleRow';
import { PageHeader } from '../components/layout/PageHeader';
import { PageContent } from '../components/layout/PageContent';
import { confirm } from "../lib/confirm";
import { useTranslation } from "react-i18next";

function IPBlacklistManager({ token }: { token: string }) {
    const { t } = useTranslation();
  const [list, setList] = useState<{ ip: string; reason: string | null; createdAt: string }[]>([]);
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchList = () => {
    api.get<any>('/settings/ip-blacklist')
      
      .then(res => { if (res.success) setList(res.data); });
  };

  useEffect(() => { fetchList(); }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await api.post<any>('/settings/ip-blacklist', { ip: newIp, reason: newReason });
    setNewIp('');
    setNewReason('');
    fetchList();
    setLoading(false);
  };

  const handleRemove = async (ip: string) => {
    if (!await confirm(`確定要解除封鎖 ${ip} 嗎？`)) return;
    await api.delete<any>(`/settings/ip-blacklist/${ip}`);
    fetchList();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" required type="text" placeholder={t('settingsAdvanced.92575f') || 'IP 地址 (例如: 1.2.3.4)'} value={newIp} onChange={e => setNewIp(e.target.value)} />
        <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" placeholder={t('settingsAdvanced.d395b0') || '原因 (選填)'} value={newReason} onChange={e => setNewReason(e.target.value)} />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
        >
          {t('settingsAdvanced.51b5e1') || (t('settingsAdvanced.51b5e1') || '封鎖 IP')}</button>
      </form>

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-700">{t('settingsAdvanced.c10992') || (t('settingsAdvanced.c10992') || 'IP 地址')}</th>
              <th className="px-4 py-3 font-semibold text-gray-700">{t('settingsAdvanced.41dfb0') || (t('settingsAdvanced.41dfb0') || '原因')}</th>
              <th className="px-4 py-3 font-semibold text-gray-700 text-right">{t('settingsAdvanced.2b6bc0') || (t('settingsAdvanced.2b6bc0') || '操作')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {list.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">{t('settingsAdvanced.873969') || (t('settingsAdvanced.873969') || '目前沒有黑名單 IP')}</td></tr>
            ) : (
              list.map(item => (
                <tr key={item.ip} className="bg-white">
                  <td className="px-4 py-3 font-mono text-xs">{item.ip}</td>
                  <td className="px-4 py-3 text-gray-500">{item.reason || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleRemove(item.ip)} className="text-red-600 hover:text-red-700 text-xs font-bold transition-colors">{t('settingsAdvanced.2d9253') || (t('settingsAdvanced.2d9253') || '解除')}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SettingsAdvanced() {
    const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [enableRateLimiting, setEnableRateLimiting] = useState(false);
  const [inventorySyncFrequency, setInventorySyncFrequency] = useState('6h');

  // S3 Settings
  const [s3Endpoint, setS3Endpoint] = useState('');
  const [s3Bucket, setS3Bucket] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [s3PublicUrl, setS3PublicUrl] = useState('');

  useEffect(() => {
    api.get<any>('/settings/advanced')
      
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          if (d.maintenanceMode !== undefined) setMaintenanceMode(d.maintenanceMode);
          if (d.maintenanceMessage) setMaintenanceMessage(d.maintenanceMessage);
          if (d.enableRateLimiting !== undefined) setEnableRateLimiting(d.enableRateLimiting);
          if (d.inventorySyncFrequency) setInventorySyncFrequency(d.inventorySyncFrequency);
          if (d.s3Settings) {
            setS3Endpoint(d.s3Settings.endpoint || '');
            setS3Bucket(d.s3Settings.bucket || '');
            setS3AccessKey(d.s3Settings.accessKey || '');
            setS3SecretKey(d.s3Settings.secretKey || '');
            setS3PublicUrl(d.s3Settings.publicUrl || '');
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await api.put<any>('/settings/advanced', {
          maintenanceMode,
          maintenanceMessage,
          enableRateLimiting,
          inventorySyncFrequency,
          s3Settings: {
            endpoint: s3Endpoint,
            bucket: s3Bucket,
            accessKey: s3AccessKey,
            secretKey: s3SecretKey,
            publicUrl: s3PublicUrl,
          },
        });
      if (data.success) {
        setSuccess((t('settingsAdvanced.dbde74') || '進階設定已更新'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(typeof data.error === 'string' ? data.error : (t('settingsAdvanced.24510f') || '儲存失敗'));
      }
    } catch {
      setError((t('settingsAdvanced.dccf60') || '網路連線錯誤'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-gray-500">{t('settingsAdvanced.d39337') || (t('settingsAdvanced.d39337') || '載入中...')}</div>;

  const steps = ['realtime', '1h', '3h', '6h', '12h', '1d', '1w', '1m'];
  const labels: Record<string, string> = {
    realtime: (t('settingsAdvanced.3f0a97') || '即時更新 (Real-time)'),
    '1h': (t('settingsAdvanced.30048e') || '每 1 小時'),
    '3h': (t('settingsAdvanced.fddeff') || '每 3 小時'),
    '6h': (t('settingsAdvanced.a86704') || '每 6 小時 (✨ 推薦設定)'),
    '12h': (t('settingsAdvanced.2a922b') || '每 12 小時'),
    '1d': (t('settingsAdvanced.4d1225') || '每 1 天 (24 小時)'),
    '1w': (t('settingsAdvanced.c61115') || '每 1 週'),
    '1m': (t('settingsAdvanced.8d58db') || '每 1 個月'),
  };
  const descriptions: Record<string, { desc: string; type: 'warning' | 'info' | 'success' }> = {
    realtime: {
      desc: (t('settingsAdvanced.426b7a') || '⚠️ 即時更新：數據即時性最高。但高峰期會產生高頻率的 API 呼叫與資料庫寫入開銷，適合門市規模小或伺服器規格極高的總部。'),
      type: 'warning',
    },
    '1h': {
      desc: (t('settingsAdvanced.7774a9') || '🕒 每小時同步：接近即時，適合對當天門市原物料銷耗非常敏感的品牌，效能開銷較大。'),
      type: 'info',
    },
    '3h': {
      desc: (t('settingsAdvanced.f316e0') || '🕒 每 3 小時同步：適合半天結算一次，在數據頻率與效能開銷之間提供中等平衡。'),
      type: 'info',
    },
    '6h': {
      desc: (t('settingsAdvanced.8986c3') || '✨ 推薦設定：在「營業數據即時性」與「系統負載與省錢」之間達到最完美的黃金平衡！資料庫讀寫次數暴跌 99% 以上。'),
      type: 'success',
    },
    '12h': {
      desc: (t('settingsAdvanced.4f71d4') || '🕒 每半天同步：適合每日交班時自動對帳，系統資源佔用極低。'),
      type: 'success',
    },
    '1d': {
      desc: (t('settingsAdvanced.3ae304') || '📅 每日對帳：每天打烊後自動結算一次，非常省錢且數據乾淨，能將資料庫連線壓力降到最低。'),
      type: 'success',
    },
    '1w': {
      desc: (t('settingsAdvanced.03d4d5') || '📅 每週結算：適合按週向加盟商請款與配送原物料的連鎖品牌，幾乎不耗費任何伺服器資源。'),
      type: 'success',
    },
    '1m': {
      desc: (t('settingsAdvanced.7bb81f') || '📅 每月對帳：極致省錢。僅在月底結算請款時一次性處理，對外 API 與資料庫開銷近乎為零。'),
      type: 'success',
    },
  };

  const currentIndex = steps.indexOf(inventorySyncFrequency);
  const safeIndex = currentIndex !== -1 ? currentIndex : 3; // default to 6h

  const currentDesc = descriptions[steps[safeIndex]] || { desc: '', type: 'info' };

  const actionButton = (
    <button onClick={handleSave} disabled={saving} className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50">
      {saving ? (t('settingsAdvanced.4dafaa') || '儲存中...') : (t('settingsAdvanced.604efd') || '儲存變更')}
    </button>
  );

  return (
    <div className="pb-12">
      <PageHeader 
        title={t('settingsAdvanced.1b47c7') || '⚙️ 系統進階與效能設定'}
        backUrl="/settings"
        backText={t('settingsAdvanced.706883') || '返回系統設定'}
        action={actionButton}
      />

      <PageContent>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

        <div className="space-y-6">
          
          {/* Section 1: Maintenance Mode */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              {t('settingsAdvanced.40f17b') || (t('settingsAdvanced.40f17b') || '🚧 維護模式設定')}</h2>
            
            <div>
              <ToggleRow
                title={t('settingsAdvanced.3875aa') || '啟用維護模式'}
                checked={maintenanceMode}
                onChange={setMaintenanceMode}
                className="bg-transparent border-none p-0"
              />
              {maintenanceMode && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                  {t('settingsAdvanced.8afb89') || (t('settingsAdvanced.8afb89') || '⚠️ 警告：啟用維護模式後，顧客端點餐網站將暫時阻擋，僅顯示下方的維護公告訊息。')}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsAdvanced.29a571') || (t('settingsAdvanced.29a571') || '維護公告訊息')}</label>
              <textarea className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm min-h-[100px] resize-y" value={maintenanceMessage} onChange={(e) => setMaintenanceMessage(e.target.value)} rows={3} placeholder={t('settingsAdvanced.1f509d') || '網站維護中，請稍候再試。'} />
            </div>
          </div>

          {/* Google Integrations Redirect Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="flex items-start gap-4">
              <div className="text-3xl">🌐</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('settingsAdvanced.6ffbdc') || (t('settingsAdvanced.6ffbdc') || 'Google 整合服務 (Gemini AI, SSO)')}</h2>
                <p className="text-sm text-gray-500 mb-3">
                  {t('settingsAdvanced.052cae') || (t('settingsAdvanced.052cae') || 'Gemini AI 金鑰、第三方登入 (Google SSO) 以及其他 Google 服務已移至專屬設定頁面。')}</p>
                <Link to="/settings/google" className="inline-block px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                  {t('settingsAdvanced.40fdcd') || (t('settingsAdvanced.40fdcd') || '前往 Google 整合設定')}</Link>
              </div>
            </div>
          </div>

          {/* Section 2: Performance Sync Frequency (The Gorgeous Slider!) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  {t('settingsAdvanced.f97a8d') || (t('settingsAdvanced.f97a8d') || '📈 總部食譜配方與庫存對帳同步設定 (Sync Frequency)')}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('settingsAdvanced.c635b0') || (t('settingsAdvanced.c635b0') || '設定點單系統（加盟店端）的銷貨日誌，每隔多久同步扣減總部配方管理系統（ShutterERP）的原料庫存。')}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-full shadow-sm whitespace-nowrap ml-4">
                {t('settingsAdvanced.f31e24') || (t('settingsAdvanced.f31e24') || '省電保護中')}</span>
            </div>

            {/* Interactive Range Slider UI */}
            <div className="py-6 px-2 space-y-6">
              <div className="relative">
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="range" min="0" max="7" value={safeIndex} onChange={(e) => setInventorySyncFrequency(steps[parseInt(e.target.value) || 0])} />
                
                {/* Range Scale Tick Labels */}
                <div className="flex justify-between text-[10px] text-gray-500 font-semibold px-1 mt-2 select-none">
                  <span>{t('settingsAdvanced.5a37ba') || (t('settingsAdvanced.5a37ba') || '即時更新')}</span>
                  <span>{t('settingsAdvanced.b9b41f') || (t('settingsAdvanced.b9b41f') || '1小時')}</span>
                  <span>{t('settingsAdvanced.14f0a1') || (t('settingsAdvanced.14f0a1') || '3小時')}</span>
                  <span className="text-emerald-600 font-bold">{t('settingsAdvanced.329040') || (t('settingsAdvanced.329040') || '6小時')}</span>
                  <span>{t('settingsAdvanced.bc97cd') || (t('settingsAdvanced.bc97cd') || '12小時')}</span>
                  <span>{t('settingsAdvanced.7db888') || (t('settingsAdvanced.7db888') || '1天')}</span>
                  <span>{t('settingsAdvanced.0bb844') || (t('settingsAdvanced.0bb844') || '1週')}</span>
                  <span>{t('settingsAdvanced.bbcca0') || (t('settingsAdvanced.bbcca0') || '1個月')}</span>
                </div>
              </div>

              {/* Dynamic Frequency Detail Widget */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 font-bold block uppercase">{t('settingsAdvanced.943d95') || (t('settingsAdvanced.943d95') || '當前同步排程')}</span>
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                    🔄 {labels[steps[safeIndex]]}
                  </span>
                </div>
                
                {/* Mini performance meter badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-200 rounded-lg shadow-sm self-start md:self-auto">
                  <span className="text-[10px] text-gray-500 font-bold">{t('settingsAdvanced.ae232f') || (t('settingsAdvanced.ae232f') || '系統負載：')}</span>
                  <span className={`text-xs font-bold ${
                    steps[safeIndex] === 'realtime' ? 'text-red-600' :
                    ['1h', '3h'].includes(steps[safeIndex]) ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {steps[safeIndex] === 'realtime' ? (t('settingsAdvanced.4fd422') || '🔴 高負載') :
                     ['1h', '3h'].includes(steps[safeIndex]) ? (t('settingsAdvanced.e028ff') || '🟡 中負載') : (t('settingsAdvanced.83d3b9') || '🟢 極低負載')}
                  </span>
                </div>
              </div>

              {/* Dynamic Dynamic cost efficiency and database load description box */}
              <div className={`p-4 rounded-xl text-xs leading-relaxed border font-medium transition-all duration-300 ${
                currentDesc.type === 'warning' ? 'bg-red-50 text-red-800 border-red-200' :
                currentDesc.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}>
                {currentDesc.desc}
              </div>
            </div>
          </div>

          {/* Section 3: Rate Limiting */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
              {t('settingsAdvanced.23435f') || (t('settingsAdvanced.23435f') || '🛡️ 安全性防禦設定')}</h2>
            <ToggleRow
              title={t('settingsAdvanced.6bb0b3') || '啟用 API 請求速率限制 (Rate Limiting)'}
              description={t('settingsAdvanced.99d572') || '開啟此功能後，系統會自動防止同一 IP 在極短時間內發送大量惡意點單請求，加固系統免受簡易的 CC 攻擊。'}
              checked={enableRateLimiting}
              onChange={setEnableRateLimiting}
              className="bg-transparent border-none p-0"
            />
          </div>

          {/* Section 4: S3 / Cloudflare R2 Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {t('settingsAdvanced.bc6f1c') || (t('settingsAdvanced.bc6f1c') || '☁️ 雲端圖床 (S3 / Cloudflare R2) 設定')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('settingsAdvanced.85a285') || (t('settingsAdvanced.85a285') || '設定專屬的雲端儲存空間。設定完成後，所有上傳的圖片將直接串流至您的圖床，不會佔用伺服器空間。若留空，系統將退回使用本地儲存 (不建議)。')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">S3 Endpoint URL</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" placeholder="https://<account_id>.r2.cloudflarestorage.com" value={s3Endpoint} onChange={e => setS3Endpoint(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsAdvanced.249f28') || (t('settingsAdvanced.249f28') || 'Bucket Name (儲存桶名稱)')}</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" placeholder="shutter-images" value={s3Bucket} onChange={e => setS3Bucket(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Access Key ID</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" placeholder="Access Key" value={s3AccessKey} onChange={e => setS3AccessKey(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Secret Access Key</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="password" placeholder="Secret Key" value={s3SecretKey} onChange={e => setS3SecretKey(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsAdvanced.9d62b5') || (t('settingsAdvanced.9d62b5') || 'Public Domain URL (公開訪問網址)')}</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" placeholder="https://pub-xxxxxx.r2.dev" value={s3PublicUrl} onChange={e => setS3PublicUrl(e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">{t('settingsAdvanced.fd853f') || (t('settingsAdvanced.fd853f') || '此網址將會與檔名組合，成為前端載入圖片的來源。請確認結尾不要有斜線。')}</p>
              </div>
            </div>
          </div>

          {/* Section 5: IP Blacklist Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                {t('settingsAdvanced.35979c') || (t('settingsAdvanced.35979c') || '🚫 惡意 IP 黑名單管理')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('settingsAdvanced.cb19ad') || (t('settingsAdvanced.cb19ad') || '在此手動封鎖惡意嘗試登入或破壞的 IP 地址，封鎖後將無法訪問任何服務。')}</p>
            </div>
            
            <IPBlacklistManager token={token} />
          </div>
        </div>
      </PageContent>
    </div>
  );
}

