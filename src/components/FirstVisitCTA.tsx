import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'pyth-dvr-first-visit-dismissed';

export default function FirstVisitCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="px-4 md:px-0"
          style={{
            position: 'fixed',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            maxWidth: 600,
            zIndex: 1000,
          }}
        >
          <div
            className="relative rounded-xl px-5 py-3 text-sm"
            style={{
              background: 'rgba(230,0,122,0.12)',
              border: '1px solid rgba(230,0,122,0.4)',
            }}
          >
            <span className="text-foreground">
              👀 A BTC flash crash was just recorded —{' '}
            </span>
            <Link
              to="/replay"
              onClick={dismiss}
              className="underline font-medium apple-transition"
              style={{ color: 'hsl(330, 100%, 45%)' }}
            >
              Watch the frame-by-frame replay →
            </Link>
            <button
              onClick={dismiss}
              className="absolute top-1/2 -translate-y-1/2 right-2 w-8 h-8 flex items-center justify-center rounded-lg apple-transition"
              style={{ color: 'rgba(230,0,122,0.6)' }}
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
