import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api.js';
import { LocationOverrideSelector } from '../components/settings/LocationOverrideSelector';
import { useTranslation } from "react-i18next";

export default function SettingsMail() {
    const { t } = useTranslation();
  const token = localStorage.getItem('token') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [encryption, setEncryption] = useState<'none' | 'tls' | 'ssl'>('none');
  const [emailBrandName, setEmailBrandName] = useState('');
  const [emailHeaderColor, setEmailHeaderColor] = useState('#f97316');
  const [emailBgColor, setEmailBgColor] = useState('#f3f4f6');
  const [mailServiceType, setMailServiceType] = useState<'SMTP' | 'GMAIL_API'>('SMTP');
  const [testEmail, setTestEmail] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState('');
  const [searchParams] = useSearchParams();
  const [selectedLocationId, setSelectedLocationId] = useState(searchParams.get('locationId') || '');

  useEffect(() => {
    const url = selectedLocationId ? `/settings/mail?locationId=${selectedLocationId}` : '/settings/mail';
    api.get<any>(url)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setSmtpHost(d.smtpHost || '');
          setSmtpPort(d.smtpPort || 587);
          setSmtpUser(d.smtpUser || '');
          setSmtpPass(d.smtpPass || '');
          setSenderName(d.senderName || '');
          setSenderEmail(d.senderEmail || '');
          setEncryption(d.encryption || 'none');
          if (d.emailBgColor) setEmailBgColor(d.emailBgColor);
          if (d.mailServiceType) setMailServiceType(d.mailServiceType);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, selectedLocationId]);

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const url = selectedLocationId ? `/settings/mail?locationId=${selectedLocationId}` : '/settings/mail';
      const res = await api.put<any>(url, {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        senderName,
        senderEmail,
        encryption,
        emailHeaderColor,
        emailBgColor,
        mailServiceType,
      });
      const data = res;
      if (data.success) {
        if (data.data?.smtpPass) setSmtpPass(data.data.smtpPass);
        setSuccess((t('settingsMail.ba0652') || '設定已儲存 (系統已重新載入郵件設定)'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(typeof data.error === 'string' ? data.error : (t('settingsMail.24510f') || '儲存失敗'));
      }
    } catch {
      setError((t('settingsMail.dccf60') || '網路連線錯誤'));
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    if (!testEmail) return;
    setTestSending(true);
    setTestResult('');
    try {
      const url = selectedLocationId ? `/settings/mail/test?locationId=${selectedLocationId}` : '/settings/mail/test';
      const res = await api.post<any>(url, { to: testEmail });
      const data = res;
      setTestResult(data.success ? (t('settingsMail.6609d5') || '測試信已發送！') : (data.error || (t('settingsMail.09f37c') || '發送失敗')));
    } catch {
      setTestResult((t('settingsMail.dccf60') || '網路連線錯誤'));
    } finally {
      setTestSending(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
        <div>
          <Link to="/settings" className="text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> {t('settingsMail.706883') || (t('settingsMail.706883') || '返回系統設定')}</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1 flex items-center gap-2">
            {t('settingsMail.812420') || (t('settingsMail.812420') || '⚙️ 郵件伺服器設定 (SMTP)')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {t('settingsMail.1c5230') || (t('settingsMail.1c5230') || '配置系統發送通知與驗證信所使用的 SMTP 發信伺服器連線參數。')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 active:bg-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{t('settingsMail.4dafaa') || (t('settingsMail.4dafaa') || '儲存中...')}</span>
            </>
          ) : (
            (t('settingsMail.8494e6') || '儲存設定')
          )}
        </button>
      </div>

      <LocationOverrideSelector value={selectedLocationId} onChange={setSelectedLocationId} />

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg text-sm shadow-sm flex items-center gap-2">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-lg text-sm shadow-sm flex items-center gap-2">
          <span>✅</span>
          <div>{success}</div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-indigo-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {t('settingsMail.a11473') || (t('settingsMail.a11473') || '🔌 郵件伺服器連線參數配置')}</h2>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.101999') || (t('settingsMail.101999') || '服務類型 (Service Type):')}</label>
              <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none shadow-sm cursor-pointer" value={mailServiceType} onChange={(e) => setMailServiceType(e.target.value as 'SMTP' | 'GMAIL_API')}>
                <option value="SMTP">{t('settingsMail.ef08b9') || (t('settingsMail.ef08b9') || '標準 SMTP 連線')}</option>
                <option value="GMAIL_API">Google Gmail API (OAuth2)</option>
              </select>
            </div>
          </div>

          {mailServiceType === 'SMTP' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SMTP Host</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder={t('settingsMail.eb4b92') || '例如 smtp.gmail.com'} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">SMTP Port</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder={t('settingsMail.bc15da') || '例如 587'} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.140318') || (t('settingsMail.140318') || '帳號 (User)')}</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder={t('settingsMail.12193f') || '您的信箱'} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.eb2c44') || (t('settingsMail.eb2c44') || '密碼 (Password / App Password)')}</label>
                <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder={t('settingsMail.126dc6') || '已設定 (留白保持不變)'} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.75409f') || (t('settingsMail.75409f') || '加密方式')}</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none shadow-sm cursor-pointer" value={encryption} onChange={(e) => setEncryption(e.target.value as any)}>
                  <option value="none">{t('settingsMail.1da3ee') || (t('settingsMail.1da3ee') || '無 (None)')}</option>
                  <option value="tls">{t('settingsMail.05b785') || (t('settingsMail.05b785') || 'STARTTLS (通常為 587)')}</option>
                  <option value="ssl">{t('settingsMail.edb79c') || (t('settingsMail.edb79c') || 'SSL/TLS (通常為 465)')}</option>
                </select>
              </div>
            </div>
          )}

          {mailServiceType === 'GMAIL_API' && (
            <div className="border-t border-gray-100 pt-4">
              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                <div className="text-2xl">🔗</div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{t('settingsMail.40fdcd') || (t('settingsMail.40fdcd') || '前往 Google 整合設定')}</h3>
                  <p className="text-sm">
                    {t('settingsMail.5b297c') || (t('settingsMail.5b297c') || '使用 Gmail API 寄信需要 Google OAuth 憑證。請前往')}<strong>{t('settingsMail.2acbc6') || (t('settingsMail.2acbc6') || 'Google 整合設定')}</strong> {t('settingsMail.fe5233') || (t('settingsMail.fe5233') || '頁面填寫您的 Client ID、Client Secret 與 Refresh Token。')}</p>
                  <a href="/settings/google" className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    {t('settingsMail.e54d00') || (t('settingsMail.e54d00') || '設定 Gmail 憑證')}</a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Sender Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {t('settingsMail.dcf605') || (t('settingsMail.dcf605') || '👤 寄件人資訊欄位')}</h2>
          <p className="text-xs text-gray-400">
            {t('settingsMail.be2451') || (t('settingsMail.be2451') || '決定顧客收到信件時，信箱收件箱中顯示的寄件者暱稱與回信地址。')}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.8d6394') || (t('settingsMail.8d6394') || '寄件者顯示名稱 (Sender Name)')}</label>
              <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="text" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder={t('settingsMail.c99af5') || '例：夏特點餐系統 官方總部'} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.ee36c6') || (t('settingsMail.ee36c6') || '發件電子郵件 (Sender Email)')}</label>
              <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="noreply@shutterorder.com" />
            </div>
          </div>
        </div>

        {/* Section 3: Test Email */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
            {t('settingsMail.156244') || (t('settingsMail.156244') || '🧪 測試發送信件連線')}</h2>
          <p className="text-xs text-gray-400 mb-4">
            {t('settingsMail.0451fd') || (t('settingsMail.0451fd') || '在儲存設定後，您可以輸入個人的 Email 地址來發送一封測試郵件，以即時確認 SMTP 伺服器與發信資訊是否設定成功。')}</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('settingsMail.ffb302') || (t('settingsMail.ffb302') || '測試收件者電子郵件')}</label>
              <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 outline-none placeholder:text-gray-400 shadow-sm" type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <button
              onClick={handleTestEmail}
              disabled={testSending || !testEmail}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black active:bg-gray-800 disabled:opacity-50 shadow-md transition-all flex items-center gap-1.5 h-[42px]"
            >
              {testSending ? (t('settingsMail.7ea7f5') || '傳送中...') : (t('settingsMail.6dd28b') || '🚀 發送測試信')}
            </button>
          </div>
          {testResult && (
            <div className={`mt-3 p-3 rounded-xl text-xs font-semibold ${
              testResult.includes((t('settingsMail.330363') || '成功')) || testResult.includes('sent')
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
