import { NavLink, Outlet } from 'react-router-dom';
import { useThemeListener } from '../store/useTheme';
import ThemeToggle from './ThemeToggle';
import {
  LayoutDashboard,
  Calendar,
  List,
  BarChart3,
  Settings,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '首页' },
  { to: '/calendar', icon: Calendar, label: '日历' },
  { to: '/subscriptions', icon: List, label: '管理' },
  { to: '/analytics', icon: BarChart3, label: '统计' },
  { to: '/settings', icon: Settings, label: '设置' },
];

export default function Layout() {
  useThemeListener();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border flex-col shrink-0 h-screen sticky top-0">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-text">SubTracker</h1>
          <p className="text-sm text-text-secondary mt-1">订阅扣费管理</p>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-alt hover:text-text'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border shrink-0">
          <ThemeToggle />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-border sticky top-0 z-40">
          <h1 className="text-lg font-bold">SubTracker</h1>
          <ThemeToggle />
        </header>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50 mobile-nav">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-secondary'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
