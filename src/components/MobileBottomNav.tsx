import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const tabs = [
  { label: 'Live', path: '/live' },
  { label: 'Replay', path: '/replay' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Events', path: '/events' },
];

export default function MobileHamburgerMenu() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger trigger — rendered in Navbar */}
      <button
        onClick={() => setOpen(true)}
        className="flex md:hidden items-center justify-center w-11 h-11"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Full-screen overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center md:hidden"
            style={{
              background: 'rgba(13,13,13,0.97)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center"
              aria-label="Close menu"
            >
              <X size={22} className="text-foreground" />
            </button>

            {/* Nav links with stagger */}
            <nav className="flex flex-col items-center gap-8">
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
                      className="text-[32px] font-medium apple-transition"
                      style={{
                        color: active ? '#e6007a' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {tab.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
