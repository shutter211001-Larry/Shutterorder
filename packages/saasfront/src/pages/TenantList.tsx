import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api.js';
import { toast } from 'react-hot-toast';
import { Plus, Server, Edit, Trash2, Key, Globe, Check, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { useTranslation } from "react-i18next";

interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  hasErpAccess: boolean;
  subscriptionEndsAt: string | null;
  createdAt: string;
  _count?: {
    users: number;
    locations: number;
    orders: number;
  };
  users?: {
    name: string;
    email: string;
    phone: string | null;
  }[];
}

export default function TenantList() {
    const { t } = useTranslation();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTenantId, setExpandedTenantId] = useState<string | null>(null);
  
  // Inline editing states
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');
  
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [domainValue, setDomainValue] = useState('');
  
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expValue, setExpValue] = useState('');
  
  const [editingPurchaserId, setEditingPurchaserId] = useState<string | null>(null);
  const [purchaserName, setPurchaserName] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');
  const [purchaserPhone, setPurchaserPhone] = useState('');
  const [purchaserPassword, setPurchaserPassword] = useState('');
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  const [confirmReset, setConfirmReset] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await api.get<{ data: Tenant[] }>('/platform-admin/tenants');
      setTenants(res.data);
    } catch (error) {
      toast.error((t('tenantList.a7d8ae') || '無法獲取租戶列表'));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (tenant: Tenant) => {
    try {
      await api.patch<{ data: Tenant }>(`/platform-admin/tenants/${tenant.id}`, {
        isActive: !tenant.isActive
      });
      toast.success(tenant.isActive ? (t('tenantList.e9cbed') || '租戶已停權') : (t('tenantList.76c450') || '租戶已啟用'));
      fetchTenants();
    } catch (error) {
      toast.error((t('tenantList.725f75') || '無法更新租戶狀態'));
    }
  };

  const toggleErpAccess = async (tenant: Tenant) => {
    try {
      await api.patch<{ data: Tenant }>(`/platform-admin/tenants/${tenant.id}`, {
        hasErpAccess: !tenant.hasErpAccess
      });
      toast.success(tenant.hasErpAccess ? (t('tenantList.16847a') || 'ERP 存取已停用') : (t('tenantList.7fd230') || 'ERP 存取已啟用'));
      fetchTenants();
    } catch (error) {
      toast.error((t('tenantList.95add8') || '無法更新 ERP 存取權限'));
    }
  };

  const saveDomain = async (tenant: Tenant) => {
    try {
      await api.patch(`/platform-admin/tenants/${tenant.id}`, { domain: domainValue.toLowerCase().trim() || null });
      toast.success((t('tenantList.367b97') || '網域更新成功'));
      setEditingDomainId(null);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.1e1736') || '無法更新網域'));
    }
  };

  const saveName = async (tenant: Tenant) => {
    try {
      if (!nameValue.trim()) return toast.error((t('tenantList.6ffa9f') || '名稱不可為空'));
      await api.patch(`/platform-admin/tenants/${tenant.id}`, { name: nameValue.trim() });
      toast.success((t('tenantList.1ae90c') || '租戶名稱更新成功'));
      setEditingNameId(null);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.b074f2') || '無法更新名稱'));
    }
  };

  const saveExpiration = async (tenant: Tenant) => {
    try {
      await api.patch(`/platform-admin/tenants/${tenant.id}`, { subscriptionEndsAt: expValue || null });
      toast.success((t('tenantList.02de77') || '到期日更新成功'));
      setEditingExpId(null);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.f38eb3') || '無法更新到期日'));
    }
  };

  const savePurchaser = async (tenant: Tenant) => {
    try {
      const payload: any = {};
      if (purchaserName !== undefined) payload.adminName = purchaserName;
      if (purchaserEmail !== undefined) payload.adminEmail = purchaserEmail;
      if (purchaserPhone !== undefined) payload.adminPhone = purchaserPhone;
      if (purchaserPassword) payload.adminPassword = purchaserPassword;

      await api.patch(`/platform-admin/tenants/${tenant.id}`, payload);
      toast.success((t('tenantList.c3e547') || '購買者資料更新成功'));
      setEditingPurchaserId(null);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.aff3e8') || '無法更新購買者資料'));
    }
  };

  const confirmDeleteTenant = async (tenant: Tenant) => {
    if (deleteConfirmName !== tenant.name) {
      return toast.error((t('tenantList.ad1c15') || '名稱不符，取消刪除'));
    }
    const loadingToast = toast.loading((t('tenantList.28986c') || '正在刪除租戶與所有資料...'));
    try {
      await api.delete(`/platform-admin/tenants/${tenant.id}`);
      toast.success((t('tenantList.4f12b2') || '租戶已永久刪除'), { id: loadingToast });
      setDeletingId(null);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.333ca5') || '刪除失敗'), { id: loadingToast });
    }
  };

  const handleResetDemo = async () => {
    const loadingToast = toast.loading((t('tenantList.174add') || '開始重設示範資料...'));
    try {
      await api.post('/platform-admin/tenants/reset-demo', {});
      toast.success((t('tenantList.7ad563') || '已啟動示範資料重設程序。'), { id: loadingToast });
      setConfirmReset(false);
      setTimeout(fetchTenants, 5000);
    } catch (error) {
      toast.error((t('tenantList.b5e7e2') || '重設失敗。'), { id: loadingToast });
    }
  };

  const handleSendWelcomeEmail = async (tenant: Tenant) => {
    const loadingToast = toast.loading((t('tenantList.0a6126') || '正在發送歡迎信...'));
    try {
      await api.post(`/platform-admin/tenants/${tenant.id}/send-welcome-email`, {});
      toast.success((t('tenantList.0ab324') || '歡迎信已成功寄出'), { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message || (t('tenantList.09f37c') || '發送失敗'), { id: loadingToast });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400 animate-pulse">{t('tenantList.f4a243') || (t('tenantList.f4a243') || '正在載入租戶...')}</div>;
  }

  // Dashboard Stats
  const activeTenants = tenants.filter(tenant => tenant.isActive).length;
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);
  
  const pendingRenewals = tenants.filter(tenant => {
    if (!tenant.subscriptionEndsAt) return false;
    const endsAt = new Date(tenant.subscriptionEndsAt);
    return endsAt > now && endsAt <= thirtyDaysFromNow;
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-indigo-400" />
            {t('tenantList.994c40') || (t('tenantList.994c40') || '品牌管理')}</div>
        }
        subtitle={t('tenantList.db9dc1') || '管理 SaaS 實例、網域與訂閱。'}
        action={
          <div className="flex gap-3 items-center">
            {confirmReset ? (
              <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/50 px-3 py-1.5 rounded-lg">
                <span className="text-sm text-red-400 font-medium mr-2">{t('tenantList.67a181') || (t('tenantList.67a181') || '確定重設？')}</span>
                <button onClick={handleResetDemo} className="p-1 hover:bg-red-500/20 text-red-400 rounded">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmReset(false)} className="p-1 hover:bg-gray-700 text-gray-400 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                {t('tenantList.f514fa') || (t('tenantList.f514fa') || '重設示範資料')}</button>
            )}
            
            <button
              onClick={() => navigate('/tenants/new')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('tenantList.1c1a1f') || (t('tenantList.1c1a1f') || '新增品牌')}</button>
          </div>
        }
      />

      {/* Top Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{t('tenantList.26de3c') || (t('tenantList.26de3c') || '總品牌數')}</p>
          <h3 className="text-2xl font-semibold text-white">{tenants.length}</h3>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{t('tenantList.dcab79') || (t('tenantList.dcab79') || '有效訂閱數')}</p>
          <h3 className="text-2xl font-semibold text-white">{activeTenants}</h3>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{t('tenantList.f7e8a3') || (t('tenantList.f7e8a3') || '待續約數')}</p>
          <h3 className="text-2xl font-semibold text-white">{pendingRenewals}</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-visible shadow-sm">
        <div className="w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-900/50 border-b border-gray-800 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t('tenantList.09307c') || (t('tenantList.09307c') || '品牌')}</th>
                <th className="px-6 py-4 font-medium">{t('tenantList.bd91f6') || (t('tenantList.bd91f6') || '狀態')}</th>
                <th className="px-6 py-4 font-medium">{t('tenantList.fe49d0') || (t('tenantList.fe49d0') || '指標與權限')}</th>
                <th className="px-6 py-4 font-medium">{t('tenantList.0c611a') || (t('tenantList.0c611a') || '建立日期')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('tenantList.2b6bc0') || (t('tenantList.2b6bc0') || '操作')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 text-gray-300">
              {tenants.map((tenant) => {
                let statusColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
                let statusText = (t('tenantList.bcc8b9') || '啟用中');
                
                if (!tenant.isActive) {
                  statusColor = "text-red-400 border-red-500/20 bg-red-500/10";
                  statusText = (t('tenantList.e74ca3') || '已停權');
                } else if (tenant.subscriptionEndsAt) {
                  const endsAt = new Date(tenant.subscriptionEndsAt);
                  if (endsAt < now) {
                    statusColor = "text-red-400 border-red-500/20 bg-red-500/10";
                    statusText = (t('tenantList.e5b59f') || '已到期');
                  } else if (endsAt <= thirtyDaysFromNow) {
                    statusColor = "text-amber-400 border-amber-500/20 bg-amber-500/10";
                    statusText = (t('tenantList.e015bc') || '即將到期');
                  }
                }

                return (
                  <React.Fragment key={tenant.id}>
                    <tr 
                      className={`hover:bg-gray-800/30 transition-colors group cursor-pointer ${expandedTenantId === tenant.id ? 'bg-gray-800/20' : ''}`}
                      onClick={() => setExpandedTenantId(expandedTenantId === tenant.id ? null : tenant.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-medium border border-gray-700">
                            {tenant.name.charAt(0).toUpperCase()}
                          </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {editingNameId === tenant.id ? (
                                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                    <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500 w-32 sm:w-48" autoFocus />
                                    <button onClick={(e) => { e.stopPropagation(); saveName(tenant); }} className="p-1 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white rounded shadow-sm"><Check className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingNameId(null); }} className="p-1 bg-gray-700 hover:bg-gray-600 transition-colors text-white rounded"><X className="w-3 h-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <p className="font-medium text-white">{tenant.name}</p>
                                    <button onClick={(e) => { e.stopPropagation(); setEditingNameId(tenant.id); setNameValue(tenant.name); }} className="text-gray-500 hover:text-indigo-400 transition-colors">
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-mono mt-0.5">{tenant.domain || (t('tenantList.bfeed6') || '無自訂網域')}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${statusColor}`}>
                          {statusText}
                        </span>
                        {tenant.subscriptionEndsAt && (
                          <p className="text-xs text-gray-500 mt-1.5">
                            {t('tenantList.efa2b2') || (t('tenantList.efa2b2') || '到期日：')}{new Date(tenant.subscriptionEndsAt).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs text-gray-400">
                            {t('tenantList.73ad70') || (t('tenantList.73ad70') || '使用者:')}{tenant._count?.users || 0} <span className="mx-1 text-gray-600">|</span> {t('tenantList.15d108') || (t('tenantList.15d108') || '門市:')}{tenant._count?.locations || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendWelcomeEmail(tenant);
                            }}
                            className="px-2 py-1.5 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 rounded-md text-xs font-medium transition-colors border border-indigo-700/50"
                          >
                            {t('tenantList.87bae6') || (t('tenantList.87bae6') || '發送歡迎信')}</button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
                              
                              if (tenant.domain && !isLocal) {
                                const protocol = tenant.domain.includes('localhost') ? 'http' : 'https';
                                let targetHost = `store.${tenant.domain}`;
                                if (tenant.domain.endsWith('.shutterorder.pro')) {
                                  const subdomain = tenant.domain.replace('.shutterorder.pro', '');
                                  targetHost = `${subdomain}.store.shutterorder.pro`;
                                }
                                window.open(`${protocol}://${targetHost}`, '_blank');
                              } else {
                                const baseUrl = import.meta.env.VITE_STORE_URL_PUBLIC || 'http://localhost:3000';
                                window.open(`${baseUrl}?set_tenant_id=${tenant.id}`, '_blank');
                              }
                            }}
                            className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
                          >
                            {t('tenantList.bd13a7') || (t('tenantList.bd13a7') || '前台')}</button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
                              
                              if (tenant.domain && !isLocal) {
                                const protocol = tenant.domain.includes('localhost') ? 'http' : 'https';
                                let targetHost = `admin.${tenant.domain}`;
                                if (tenant.domain.endsWith('.shutterorder.pro')) {
                                  const subdomain = tenant.domain.replace('.shutterorder.pro', '');
                                  targetHost = `${subdomain}.admin.shutterorder.pro`;
                                }
                                window.open(`${protocol}://${targetHost}`, '_blank');
                              } else {
                                const baseUrl = import.meta.env.VITE_ADMIN_URL_PUBLIC || 'http://localhost:5173';
                                window.open(`${baseUrl}?set_tenant_id=${tenant.id}`, '_blank');
                              }
                            }}
                            className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-xs font-medium transition-colors border border-gray-700"
                          >
                            {t('tenantList.129ebe') || (t('tenantList.129ebe') || '後台')}</button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
                              
                              if (tenant.domain && !isLocal) {
                                const protocol = tenant.domain.includes('localhost') ? 'http' : 'https';
                                let targetHost = `erp.${tenant.domain}`;
                                if (tenant.domain.endsWith('.shutterorder.pro')) {
                                  const subdomain = tenant.domain.replace('.shutterorder.pro', '');
                                  targetHost = `${subdomain}.erp.shutterorder.pro`;
                                }
                                window.open(`${protocol}://${targetHost}`, '_blank');
                              } else {
                                const baseUrl = import.meta.env.VITE_ERP_URL_PUBLIC || 'http://localhost:3002';
                                window.open(`${baseUrl}?set_tenant_id=${tenant.id}`, '_blank');
                              }
                            }}
                            className="px-2 py-1.5 bg-indigo-900/40 hover:bg-indigo-800 text-indigo-300 rounded-md text-xs font-medium transition-colors border border-indigo-700/50"
                          >
                            ERP
                          </button>
                          <span className="text-xs text-indigo-400 ml-2">
                            {expandedTenantId === tenant.id ? (t('tenantList.968f1d') || '收合') : (t('tenantList.029c0d') || '設定')}
                          </span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Detail / Edit Row */}
                    {expandedTenantId === tenant.id && (
                      <tr className="bg-gray-800/40 border-b border-gray-800/50 shadow-inner">
                        <td colSpan={5} className="px-6 py-6 cursor-default">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 text-sm">
                            
                            {/* Card 1: 購買者基本資料 */}
                            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-sm">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-gray-400 text-xs tracking-wider uppercase flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                  {t('tenantList.23fd29') || (t('tenantList.23fd29') || '購買者基本資料')}</h4>
                                {editingPurchaserId !== tenant.id && (
                                  <button onClick={(e) => { e.stopPropagation(); setEditingPurchaserId(tenant.id); setPurchaserName(tenant.users?.[0]?.name || ''); setPurchaserEmail(tenant.users?.[0]?.email || ''); setPurchaserPhone(tenant.users?.[0]?.phone || ''); setPurchaserPassword(''); }} className="text-indigo-400 hover:text-indigo-300">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              
                              {editingPurchaserId === tenant.id ? (
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-gray-500 text-[10px] mb-1">{t('tenantList.60d045') || (t('tenantList.60d045') || '姓名')}</p>
                                    <input type="text" value={purchaserName} onChange={e => setPurchaserName(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-[10px] mb-1">{t('tenantList.2bbea6') || (t('tenantList.2bbea6') || '電子信箱')}</p>
                                    <input type="email" value={purchaserEmail} onChange={e => setPurchaserEmail(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-[10px] mb-1">{t('tenantList.f7e4f1') || (t('tenantList.f7e4f1') || '電話')}</p>
                                    <input type="text" value={purchaserPhone} onChange={e => setPurchaserPhone(e.target.value)} className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-[10px] mb-1">{t('tenantList.b9e3f9') || (t('tenantList.b9e3f9') || '重設密碼 (留空代表不修改)')}</p>
                                    <input type="password" value={purchaserPassword} onChange={e => setPurchaserPassword(e.target.value)} placeholder={t('tenantList.84edbc') || '輸入新密碼'} className="w-full bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1.5 focus:border-indigo-500 outline-none" />
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                    <button onClick={() => savePurchaser(tenant)} className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded font-medium hover:bg-indigo-500">{t('tenantList.e9dabe') || (t('tenantList.e9dabe') || '儲存')}</button>
                                    <button onClick={() => setEditingPurchaserId(null)} className="flex-1 bg-gray-700 text-white text-xs py-1.5 rounded font-medium hover:bg-gray-600">{t('tenantList.625fb2') || (t('tenantList.625fb2') || '取消')}</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-gray-500 text-xs mb-1">{t('tenantList.60d045') || (t('tenantList.60d045') || '姓名')}</p>
                                    <p className="text-gray-100 font-medium">{tenant.users?.[0]?.name || (t('tenantList.11ea81') || '未提供')}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-xs mb-1">{t('tenantList.439f4c') || (t('tenantList.439f4c') || '電子信箱 (Mail)')}</p>
                                    <p className="text-gray-100 font-medium">{tenant.users?.[0]?.email || (t('tenantList.11ea81') || '未提供')}</p>
                                  </div>
                                  <div>
                                    <p className="text-gray-500 text-xs mb-1">{t('tenantList.480f57') || (t('tenantList.480f57') || '聯絡電話')}</p>
                                    <p className="text-gray-100 font-medium">{tenant.users?.[0]?.phone || (t('tenantList.11ea81') || '未提供')}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Card 2: 租約與網域 */}
                            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-sm">
                              <h4 className="font-medium text-gray-400 text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-indigo-400" />
                                {t('tenantList.4ede73') || (t('tenantList.4ede73') || '租約與網域')}</h4>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-gray-500 text-xs">{t('tenantList.499b9a') || (t('tenantList.499b9a') || '到期日')}</p>
                                    {editingExpId !== tenant.id && (
                                      <button onClick={(e) => { e.stopPropagation(); setEditingExpId(tenant.id); setExpValue(tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toISOString().split('T')[0] : ''); }} className="text-indigo-400 hover:text-indigo-300">
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {editingExpId === tenant.id ? (
                                    <div className="flex items-center gap-1 mt-1">
                                      <input type="date" value={expValue} onChange={(e) => setExpValue(e.target.value)} className="bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1 flex-1 focus:outline-none focus:border-indigo-500 [color-scheme:dark]" />
                                      <button onClick={() => saveExpiration(tenant)} className="p-1 bg-indigo-600 text-white rounded"><Check className="w-3 h-3" /></button>
                                      <button onClick={() => setEditingExpId(null)} className="p-1 bg-gray-700 text-white rounded"><X className="w-3 h-3" /></button>
                                    </div>
                                  ) : (
                                    <p className="text-gray-100 font-medium">{tenant.subscriptionEndsAt ? new Date(tenant.subscriptionEndsAt).toLocaleDateString() : (t('tenantList.da6173') || '無期限')}</p>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-gray-500 text-xs">{t('tenantList.03fc0a') || (t('tenantList.03fc0a') || '自訂網域')}</p>
                                    {editingDomainId !== tenant.id && (
                                      <button onClick={(e) => { e.stopPropagation(); setEditingDomainId(tenant.id); setDomainValue(tenant.domain || ''); }} className="text-indigo-400 hover:text-indigo-300">
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  {editingDomainId === tenant.id ? (
                                    <div className="flex items-center gap-1 mt-1">
                                      <input type="text" value={domainValue} onChange={(e) => setDomainValue(e.target.value)} placeholder={t('tenantList.13817d') || '例如 test.localhost'} className="bg-gray-950 border border-gray-700 text-white text-xs rounded px-2 py-1 flex-1 focus:outline-none focus:border-indigo-500" />
                                      <button onClick={() => saveDomain(tenant)} className="p-1 bg-indigo-600 text-white rounded"><Check className="w-3 h-3" /></button>
                                      <button onClick={() => setEditingDomainId(null)} className="p-1 bg-gray-700 text-white rounded"><X className="w-3 h-3" /></button>
                                    </div>
                                  ) : (
                                    <p className="text-gray-100 font-mono font-medium">{tenant.domain || (t('tenantList.a8b53f') || '未設定')}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card 3: 模組狀態 */}
                            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-sm">
                              <h4 className="font-medium text-gray-400 text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                {t('tenantList.dff269') || (t('tenantList.dff269') || '模組開通狀態')}</h4>
                              <div className="space-y-5">
                                <div className="flex items-center justify-between p-3 bg-gray-950/50 rounded-lg border border-gray-800/80">
                                  <div>
                                    <p className="text-gray-200 font-medium text-sm">{t('tenantList.b7906b') || (t('tenantList.b7906b') || 'ERP 模組')}</p>
                                    <p className="text-gray-500 text-xs mt-0.5">{tenant.hasErpAccess ? (t('tenantList.84c17b') || '總部功能已啟用') : (t('tenantList.69b0f6') || '已停用')}</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); toggleErpAccess(tenant); }} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${tenant.hasErpAccess ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${tenant.hasErpAccess ? 'translate-x-4' : 'translate-x-1'}`} />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Card 4: 整合金鑰 */}
                            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-sm">
                              <h4 className="font-medium text-gray-400 text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
                                <Key className="w-4 h-4 text-indigo-400" />
                                {t('tenantList.1c127c') || (t('tenantList.1c127c') || '系統金鑰與整合')}</h4>
                              <div className="space-y-5">
                                <p className="text-xs text-gray-500 leading-relaxed">
                                  {t('tenantList.9d68f6') || (t('tenantList.9d68f6') || '管理此品牌的第三方服務金鑰（如 LINE Login, LINE Pay, Google 登入、電子發票等）。')}</p>
                                <button onClick={() => navigate(`/tenants/${tenant.id}/integrations`, { state: { tenantName: tenant.name } })} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors">
                                  <Key className="w-3.5 h-3.5" /> {t('tenantList.bf761c') || (t('tenantList.bf761c') || '第三方整合 (LINE / 支付)')}</button>
                              </div>
                            </div>

                            {/* Card 5: 租約與危險操作 */}
                            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-sm">
                              <h4 className="font-medium text-red-400 text-xs tracking-wider uppercase mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> {t('tenantList.219acb') || (t('tenantList.219acb') || '租約操作')}</h4>
                              <div className="space-y-4">
                                <div className="flex flex-col gap-2">
                                  <p className="text-gray-500 text-xs">{t('tenantList.5c11a5') || (t('tenantList.5c11a5') || '整體租約狀態')}</p>
                                  <button onClick={() => toggleStatus(tenant)} className={`w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex justify-center items-center gap-2 ${tenant.isActive ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}>
                                    {tenant.isActive ? (t('tenantList.e0c1d2') || '停權此租戶') : (t('tenantList.c8665c') || '恢復啟用')}
                                  </button>
                                </div>

                                <div className="pt-2 border-t border-gray-800">
                                  {deletingId === tenant.id ? (
                                    <div className="bg-red-900/20 border border-red-500/30 p-2.5 rounded-lg space-y-2">
                                      <p className="text-[10px] text-red-400">{t('tenantList.bd438c') || (t('tenantList.bd438c') || '請輸入')}<span className="font-bold text-white select-all">{tenant.name}</span> {t('tenantList.af2a16') || (t('tenantList.af2a16') || '以確認刪除：')}</p>
                                      <input type="text" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} placeholder={tenant.name} className="w-full bg-gray-950 border border-red-500/50 text-white text-xs rounded px-2 py-1.5 focus:outline-none focus:border-red-400" />
                                      <div className="flex gap-1">
                                        <button onClick={() => confirmDeleteTenant(tenant)} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs py-1 rounded font-medium">{t('tenantList.772af1') || (t('tenantList.772af1') || '確認刪除')}</button>
                                        <button onClick={() => { setDeletingId(null); setDeleteConfirmName(''); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-1 rounded font-medium">{t('tenantList.625fb2') || (t('tenantList.625fb2') || '取消')}</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setDeletingId(tenant.id); setDeleteConfirmName(''); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/10 rounded-lg text-xs transition-colors">
                                      <Trash2 className="w-3.5 h-3.5" /> {t('tenantList.e5327c') || (t('tenantList.e5327c') || '永久刪除資料')}</button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {t('tenantList.c0adfa') || (t('tenantList.c0adfa') || '找不到任何租戶。點擊「新增租戶」來建立一個。')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
