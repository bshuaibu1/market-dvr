import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { AlertBell } from '@/components/AlertSystem';
import { useTheme } from '@/components/ThemeProvider';

const tabs = [
  { label: 'Live', path: '/live' },
  { label: 'Replay', path: '/replay' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Events', path: '/events' },
];

export default function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 frosted-glass flex items-center px-6"
      style={{
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid hsl(var(--border))',
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        background: isLight ? 'rgba(255,255,255,0.85)' : undefined,
      }}
    >
      <Link to="/" className="flex items-center gap-2 mr-auto">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="27" height="27" rx="5.5" fill="#1a1a1a" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <polyline points="6,15 10,11 14,16 18,8 22,12" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="21" cy="21" r="2.5" fill="#e6007a" />
        </svg>
        <span className="text-foreground font-semibold text-sm tracking-tight">Market DVR</span>
      </Link>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full surface-1 p-1">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative px-4 py-1.5 text-xs font-medium rounded-full apple-transition"
            >
              {active && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-full"
                  style={{ background: isLight ? '#1d1d1f' : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${active ? (isLight ? 'text-white' : 'text-black') : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center surface-1 apple-transition text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <AlertBell />
        <div className="flex items-center gap-2 rounded-full px-3 py-1.5 surface-1">
          <div className="w-1.5 h-1.5 rounded-full bg-negative pulse-red" />
          <span className="text-[11px] font-medium text-negative tracking-wide uppercase">Recording</span>
        </div>
      </div>
    </nav>
  );
}
