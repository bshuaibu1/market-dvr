import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const tabs = [
  { label: 'Live', path: '/live' },
  { label: 'Replay', path: '/replay' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Events', path: '/events' },
];

export default function MobileHamburgerMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex md:hidden items-center justify-center w-11 h-11"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed md:hidden"
            style={{
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              background: 'rgba(13,13,13,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute flex items-center justify-center"
              style={{ top: 20, right: 20, width: 44, height: 44, fontSize: 24, color: 'rgba(255,255,255,0.7)' }}
              aria-label="Close menu"
            >
              ×
            </button>

            {/* Nav links */}
            <nav className="flex flex-col items-center" style={{ gap: 0 }}>
              {tabs.map((tab, i) => {
                const active = location.pathname === tab.path;
                return (
                  <motion.div
                    key={tab.path}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <Link
                      to={tab.path}
                      onClick={() => setOpen(false)}
                      style={{
                        fontSize: 32,
                        fontWeight: 500,
                        lineHeight: '48px',
                        color: active ? '#e6007a' : 'rgba(255,255,255,0.7)',
                        display: 'block',
                        textAlign: 'center',
                      }}
                    >
                      {tab.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Theme toggle pill */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.25 }}
              className="flex items-center rounded-full"
              style={{
                marginTop: 48,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: 4,
              }}
            >
              <button
                onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                className="rounded-full px-5 py-2 text-sm font-medium apple-transition"
                style={{
                  background: theme === 'dark' ? '#e6007a' : 'transparent',
                  color: theme === 'dark' ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                Dark
              </button>
              <button
                onClick={() => { if (theme !== 'light') toggleTheme(); }}
                className="rounded-full px-5 py-2 text-sm font-medium apple-transition"
                style={{
                  background: theme === 'light' ? '#e6007a' : 'transparent',
                  color: theme === 'light' ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                Light
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
