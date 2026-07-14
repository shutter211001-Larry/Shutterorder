import { useState, FormEvent, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useTranslation } from "react-i18next";

export default function ResetPassword() {
    const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenParam = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!tokenParam) {
      setError((t('resetPassword.b2b77f') || '無效的重置連結，請重新申請'));
    }
  }, [tokenParam]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError((t('resetPassword.0ff7d4') || '兩次輸入的密碼不一致'));
      return;
    }
    
    if (password.length < 6) {
      setError((t('resetPassword.396165') || '密碼長度至少需要 6 個字元'));
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('auth/staff/reset-password', JSON.stringify({ token: tokenParam, newPassword: password }));
      
      let data: any = {};
      try {
        data = res;
      } catch (parseErr) {}
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('resetPassword.be1a52') || (t('resetPassword.be1a52') || '密碼重置成功')}</h2>
          <p className="text-sm text-gray-500">{t('resetPassword.0c3ae1') || (t('resetPassword.0c3ae1') || '系統即將跳轉至登入頁面...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-400">{t('resetPassword.18c4db') || (t('resetPassword.18c4db') || '夏特點餐系統')}</h1>
          <p className="text-gray-400 mt-1 text-sm">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-5">
          <h2 className="text-xl font-semibold text-gray-900 text-center">{t('resetPassword.8deb75') || (t('resetPassword.8deb75') || '設定新密碼')}</h2>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('resetPassword.17ce77') || (t('resetPassword.17ce77') || '新密碼')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={!tokenParam}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('resetPassword.a4460c') || (t('resetPassword.a4460c') || '確認新密碼')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!tokenParam}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !tokenParam}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (t('resetPassword.4dafaa') || '儲存中...') : (t('resetPassword.70a3df') || '重置密碼')}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 mt-4 cursor-pointer"
          >
            {t('resetPassword.1eee19') || (t('resetPassword.1eee19') || '返回登入')}</button>
        </form>
      </div>
    </div>
  );
}
