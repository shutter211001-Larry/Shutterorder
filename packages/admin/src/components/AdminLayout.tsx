import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

type Role = 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
  children?: { path: string; label: string }[];
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '□', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/orders', label: 'Orders', icon: '📋', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/reservations', label: 'Reservations', icon: '🗓', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/reviews', label: 'Reviews', icon: '⭐', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/kitchen', label: 'Kitchen', icon: '🍳', roles: ['SUPER_ADMIN', 'MANAGER', 'STAFF'] },
  { path: '/locations', label: 'Locations', icon: '◎', roles: ['SUPER_ADMIN', 'MANAGER'] },
  {
    path: '/menu',
    label: 'Menu',
    icon: '☰',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/menu/items', label: 'Items' },
      { path: '/menu/categories', label: 'Categories' },
    ],
  },
  { path: '/coupons', label: 'Coupons', icon: '🏷', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/automation', label: 'Automation', icon: '⚡', roles: ['SUPER_ADMIN', 'MANAGER'] },
  { path: '/loyalty', label: 'Loyalty', icon: '🎁', roles: ['SUPER_ADMIN', 'MANAGER'] },
  {
    path: '/design',
    label: 'Design',
    icon: '🎨',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/design/landing', label: 'Landing Page' },
      { path: '/design/branding', label: 'Branding' },
      { path: '/design/theme', label: 'Theme' },
    ],
  },
  {
    path: '/legal',
    label: 'Legal',
    icon: '⚖',
    roles: ['SUPER_ADMIN', 'MANAGER'],
    children: [
      { path: '/legal/pages', label: 'Pages' },
      { path: '/legal/cookies', label: 'Cookie Categories' },
      { path: '/legal/consent', label: 'Consent Log' },
    ],
  },
  { path: '/staff', label: 'Staff', icon: '👥', roles: ['SUPER_ADMIN'] },
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
  const location = useLocation();
  const { user } = useAuth();

  const filteredNav = user
    ? navItems.filter((item) => item.roles.includes(user.role))
    : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-primary-400">KitchenAsty</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {filteredNav.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <div key={item.path}>
                <Link
                  to={item.children ? item.children[0].path : item.path}
                  className={`flex items-center px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-primary-400 border-r-2 border-primary-400'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
                {item.children && isActive && (
                  <div className="bg-gray-950">
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`block pl-14 pr-6 py-2 text-xs transition-colors ${
                          location.pathname.startsWith(child.path)
                            ? 'text-primary-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-500">{user.name}</span>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
