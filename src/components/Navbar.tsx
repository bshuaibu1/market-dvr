import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { AlertBell } from '@/components/AlertSystem';
import { useTheme } from '@/components/ThemeProvider';
import LogoMark from '@/components/LogoMark';

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
      className="fixed top-0 left-0 right-0 z-50 h-14 frosted-glass flex items-center px-4 md:px-6"
      style={{
        borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid hsl(var(--border))',
        boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        background: isLight ? 'rgba(255,255,255,0.85)' : undefined,
      }}
    >
      <Link to="/" className="flex items-center gap-2 flex-shrink-0">
        <LogoMark size={28} variant={isLight ? 'light' : 'dark'} />
        <span className="text-foreground font-semibold text-sm tracking-tight">Market DVR</span>
      </Link>

      {/* Desktop center tabs */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-full surface-1 p-1">
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

      {/* Desktop right icons */}
      <div className="hidden md:flex ml-auto items-center gap-2">
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

      {/* Mobile: REC indicator only */}
      <div className="flex md:hidden items-center ml-auto flex-shrink-0">
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 surface-1">
          <div className="w-1.5 h-1.5 rounded-full bg-negative pulse-red" />
          <span className="text-[10px] font-medium text-negative tracking-wide uppercase">REC</span>
        </div>
      </div>
    </nav>
  );
}
