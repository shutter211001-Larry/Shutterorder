import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.js';
import AdminChatWidget from './AdminChatWidget';

import { 
  LayoutDashboard, 
  Wallet, 
  Store, 
  ChefHat, 
  ClipboardList, 
  CalendarDays, 
  MenuSquare,
  Tags,
  MessageSquare,
  Users,
  UserCog,
  Clock,
  CheckSquare,
  CalendarCheck,
  Banknote,
  Briefcase,
  History,
  QrCode,
  MapPin,
  Settings,
  MonitorPlay,
  Palette,
  Paintbrush,
  LayoutTemplate,
  Scale,
  Cookie,
  FileCheck,
  Activity,
  ScrollText
} from 'lucide-react';

type Role = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';

interface NavItem {
  category?: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

const navItems: NavItem[] = [
  // 📊 營運與財務 (Operations & Finance)
  { category: 'operations', path: '/', label: 'nav.dashboard', icon: <LayoutDashboard size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { category: 'operations', path: '/finance', label: 'nav.finance', icon: <Wallet size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'operations', path: '/kitchen', label: 'nav.kitchen', icon: <ChefHat size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { category: 'operations', path: '/orders', label: 'nav.orders', icon: <ClipboardList size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { category: 'operations', path: '/reservations', label: 'nav.reservations', icon: <CalendarDays size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },

  // 🍽️ 菜單與行銷 (Menu & Marketing)
  { category: 'menu_marketing', path: '/menu/items', label: 'nav.menuItems', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/menu/categories', label: 'nav.categories', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/menu/stock', label: 'nav.stockOverview', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/menu/allergens', label: 'nav.allergens', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/menu/dietary', label: 'nav.dietary', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/menu/mealtimes', label: 'nav.mealtimes', icon: <MenuSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/promotions', label: 'nav.promotions', icon: <Tags size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'menu_marketing', path: '/reviews', label: 'nav.reviews', icon: <MessageSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },

  // 👥 人事與會員 (People)
  { category: 'people', path: '/customers', label: 'nav.customers', icon: <Users size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/staff', label: 'nav.staff', icon: <UserCog size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'people', path: '/attendance', label: 'nav.checkIn', icon: <Clock size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { category: 'people', path: '/attendance/leave', label: 'attendance.leaveTitle', icon: <CalendarDays size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { category: 'people', path: '/attendance/approvals', label: '簽核中心', icon: <CheckSquare size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/attendance/roster', label: '排班管理', icon: <CalendarCheck size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/attendance/payroll', label: '薪資結算', icon: <Banknote size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/attendance/job-roles', label: '職位設定', icon: <Briefcase size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/attendance/records', label: 'nav.attendanceRecords', icon: <History size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },
  { category: 'people', path: '/attendance/qr-generator', label: '產生 QR Code', icon: <QrCode size={20} />, roles: ['SUPER_ADMIN', 'MANAGER'] },

  // ⚙️ 系統與品牌 (System)
  { category: 'system', path: '/locations', label: 'nav.locations', icon: <MapPin size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/settings', label: 'nav.settings', icon: <Settings size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/design/landing', label: 'nav.landingPage', icon: <MonitorPlay size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/design/branding', label: 'nav.branding', icon: <Palette size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/design/theme', label: 'nav.theme', icon: <Paintbrush size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/design/templates', label: 'nav.templates', icon: <LayoutTemplate size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/legal/pages', label: 'nav.legalPages', icon: <Scale size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/legal/cookies', label: 'nav.cookieCategories', icon: <Cookie size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/legal/consent', label: 'nav.consentLog', icon: <FileCheck size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/developer/metrics', label: 'nav.apiMetrics', icon: <Activity size={20} />, roles: ['SUPER_ADMIN'] },
  { category: 'system', path: '/developer/audit-log', label: 'nav.auditLog', icon: <ScrollText size={20} />, roles: ['SUPER_ADMIN'] },
];

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-300',
  MANAGER: 'bg-blue-500/20 text-blue-300',
  STAFF: 'bg-gray-500/20 text-gray-300',
};

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export default function AdminLayout({ children, onLogout }: { children: React.ReactNode; onLogout?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, token } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [enableCounterDisplay, setEnableCounterDisplay] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  // Poll pending order count and settings
  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const statsRes = await fetch('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();
        if (statsData.success && statsData.data) {
          setPendingCount(statsData.data.pendingOrders ?? 0);
        }

        const settingsRes = await fetch('/api/settings/order', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          setEnableCounterDisplay(!!settingsData.data.enableCounterDisplay);
        }
      } catch { /* ignore */ }
    }

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [token]);


  // Inject Counter link if enabled
  if (enableCounterDisplay && user && !filteredNav.some(item => item.path === '/counter')) {
    const kitchenIdx = filteredNav.findIndex(item => item.path === '/kitchen');
    const counterItem = { category: 'operations', path: '/counter', label: 'nav.counter', icon: <Store size={20} />, roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] as Role[] };
    if (kitchenIdx !== -1) {
      filteredNav.splice(kitchenIdx + 1, 0, counterItem);
    } else {
      filteredNav.push(counterItem);
    }
  }

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isSuperAdmin = user && user.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Backdrop Overlay on mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-45 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[320px] md:w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="px-6 py-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">夏特點餐系統</h1>
          <p className="text-xs text-gray-400 mt-1">{t('common.adminPanel')}</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto select-none">
          {(() => {
            const grouped = filteredNav.reduce((acc, item) => {
              const cat = item.category || 'other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(item);
              return acc;
            }, {} as Record<string, NavItem[]>);

            const categories = [
              { id: 'operations', label: '營運與財務' },
              { id: 'menu_marketing', label: '菜單與行銷' },
              { id: 'people', label: '人事與會員' },
              { id: 'system', label: '系統與品牌' },
              { id: 'other', label: '其他' }
            ];

            return categories.map(cat => {
              const items = grouped[cat.id];
              if (!items || items.length === 0) return null;

              return (
                <div key={cat.id} className="mb-6">
                  {cat.id !== 'other' && (
                    <div className="px-6 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {cat.label}
                    </div>
                  )}
                  <div className="space-y-1">
                    {items.map(item => {
                      const isActive = item.path === '/' 
                        ? location.pathname === '/' 
                        : location.pathname.startsWith(item.path);

                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center px-6 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-gray-800 text-primary-400 border-r-2 border-primary-400'
                              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <span className="mr-3 text-gray-400">{item.icon}</span>
                          <span className="font-medium">{t(item.label)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </nav>

        {/* User info at bottom of sidebar */}
        {user && (
          <div className="px-6 py-4 border-t border-gray-700">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          {/* Hamburger menu button for mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <Link
              to="/orders?status=PENDING"
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Pending orders"
              aria-label="Pending orders"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="sr-only" aria-live="polite">
                {pendingCount > 0 ? `${pendingCount} pending order${pendingCount === 1 ? '' : 's'}` : ''}
              </span>
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full" aria-hidden="true">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>

            {/* Settings gear */}
            {isSuperAdmin && (
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            )}

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200" />

            {/* User avatar + dropdown */}
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 font-medium hidden sm:block">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {isSuperAdmin && (
                      <Link
                        to="/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t('nav.settings')}
                      </Link>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {t('nav.logout')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {isOffline && (
          <div className="bg-yellow-500 text-white px-4 py-2 text-sm font-bold flex items-center justify-center shadow-md z-40">
            ⚠️ 網路連線異常，已啟用本地幽靈模式，可繼續點餐與打卡。連線恢復後將自動同步。
          </div>
        )}

        <main className="flex-1 p-6">{children}</main>
        
        {/* Chat Widget */}
        {user && <AdminChatWidget />}
      </div>
    </div>
  );
}
