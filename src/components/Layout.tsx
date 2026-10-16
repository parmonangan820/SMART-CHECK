import { Outlet, NavLink } from 'react-router-dom';
import { Home, ScanLine, History, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';
import { useEffect, ReactNode } from 'react';

export default function Layout() {
  const darkMode = useAppStore((state) => state.settings.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-50 px-6 py-3 pb-safe">
        <ul className="flex justify-between items-center max-w-md mx-auto">
          <NavItem to="/" icon={<Home size={24} />} label="Dashboard" />
          <NavItem to="/scan" icon={<ScanLine size={24} />} label="Scan" />
          <NavItem to="/history" icon={<History size={24} />} label="History" />
          <NavItem to="/settings" icon={<Settings size={24} />} label="Settings" />
        </ul>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center space-y-1 transition-colors',
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
          )
        }
      >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </NavLink>
    </li>
  );
}
