import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTicks } from '@/lib/api';

interface ReactingAsset {
  symbol: string;
  delay: string;
  change: string;
  reacted: boolean;
}

interface ShockPropagationProps {
  sourceAsset?: string;
  currentFrame?: number;
}

const CORRELATED_ASSETS: Record<string, string[]> = {
  'BTC/USD': ['ETH/USD', 'SOL/USD', 'BNB/USD', 'XAU/USD', 'EUR/USD'],
  'ETH/USD': ['BTC/USD', 'SOL/USD', 'BNB/USD', 'XAU/USD', 'EUR/USD'],
  'SOL/USD': ['BTC/USD', 'ETH/USD', 'BNB/USD', 'WIF/USD', 'BONK/USD'],
  'XAU/USD': ['XAG/USD', 'EUR/USD', 'GBP/USD', 'BTC/USD', 'USD/JPY'],
  'EUR/USD': ['GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'XAU/USD'],
};

const DEFAULT_PEERS = ['ETH/USD', 'SOL/USD', 'BNB/USD', 'XAU/USD', 'EUR/USD'];

function shortSymbol(s: string) {
  return s.replace('/USD', '').replace('USD/', '');
}

export default function ShockPropagation({ sourceAsset = 'BTC/USD', currentFrame = 0 }: ShockPropagationProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useIsMobile();
  const [shockData, setShockData] = useState<{ primary: string; reactingAssets: ReactingAsset[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    async function compute() {
      try {
        const peers = CORRELATED_ASSETS[sourceAsset] || DEFAULT_PEERS;
        const allAssets = [sourceAsset, ...peers.slice(0, 4)];

        const ticksArrays = await Promise.all(
          allAssets.map(asset => fetchTicks(asset, 60).catch(() => []))
        );

        if (!active) return;

        const sourceChanges = (ticksArrays[0] as any[]).map((t: any, i: number, arr: any[]) => {
          if (i === 0) return 0;
          const exp = t.exponent || -8;
          const factor = Math.pow(10, exp);
          const prev = arr[i - 1].price * factor;
          const curr = t.price * factor;
          return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
        });

        const reacting: ReactingAsset[] = peers.slice(0, 4).map((asset, idx) => {
          const ticks = ticksArrays[idx + 1] as any[];
          if (!ticks || ticks.length < 5) {
            return { symbol: shortSymbol(asset), delay: '', change: '', reacted: false };
          }

          const peerChanges = ticks.map((t: any, i: number, arr: any[]) => {
            if (i === 0) return 0;
            const exp = t.exponent || -8;
            const factor = Math.pow(10, exp);
            const prev = arr[i - 1].price * factor;
            const curr = t.price * factor;
            return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
          });

          // Find max source shock in recent window
          const recent = sourceChanges.slice(-30);
          const maxShockIdx = recent.reduce((mi, v, i, a) => Math.abs(v) > Math.abs(a[mi]) ? i : mi, 0);
          const shockMag = recent[maxShockIdx];

          if (Math.abs(shockMag) < 0.01) {
            return { symbol: shortSymbol(asset), delay: '', change: '', reacted: false };
          }

          // Find peer reaction within 5 ticks after shock
          let reactionDelay = -1;
          let reactionChange = 0;
          for (let lag = 0; lag <= 5; lag++) {
            const peerIdx = maxShockIdx + lag;
            if (peerIdx < peerChanges.length) {
              const peerChange = peerChanges.slice(-30)[peerIdx] || 0;
              if (Math.abs(peerChange) > 0.005 && Math.sign(peerChange) === Math.sign(shockMag)) {
                reactionDelay = lag;
                reactionChange = peerChange;
                break;
              }
            }
          }

          if (reactionDelay === -1) {
            return { symbol: shortSymbol(asset), delay: '', change: '', reacted: false };
          }

          return {
            symbol: shortSymbol(asset),
            delay: `+${(reactionDelay * 0.25).toFixed(1)}s`,
            change: `${reactionChange >= 0 ? '+' : ''}${reactionChange.toFixed(2)}%`,
            reacted: true,
          };
        });

        if (active) {
          setShockData({ primary: shortSymbol(sourceAsset), reactingAssets: reacting });
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }

    compute();
    return () => { active = false; };
  }, [open, sourceAsset, currentFrame]);

  const display = shockData || {
    primary: shortSymbol(sourceAsset),
    reactingAssets: CORRELATED_ASSETS[sourceAsset]?.slice(0, 4).map(a => ({
      symbol: shortSymbol(a), delay: '', change: '', reacted: false,
    })) || [],
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl apple-transition min-h-[44px]"
        style={{
          background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
        }}
      >
        <span className="label-caps flex-1">Shock Propagation</span>
        {loading && open && <span className="text-[10px] text-muted-foreground">computing...</span>}
        <ChevronDown size={14} className={`text-muted-foreground apple-transition ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 px-1">
              {isMobile ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(230,0,122,0.06)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(230,0,122,0.15)', border: '2px solid #e6007a', color: '#e6007a' }}>
                      {display.primary}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-foreground">Source</div>
                      <div className="text-[11px] text-muted-foreground">Origin of shock</div>
                    </div>
                  </div>
                  {display.reactingAssets.map((asset) => (
                    <div key={asset.symbol} className="flex items-center gap-3 p-2 rounded-lg"
                      style={{
                        background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'}`,
                        opacity: asset.reacted ? 1 : 0.5,
                      }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                        style={{
                          background: asset.reacted ? (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)') : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                          border: `1px solid ${asset.reacted ? (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)')}`,
                          color: asset.reacted ? (isLight ? '#1d1d1f' : '#f5f5f7') : (isLight ? '#999' : '#555'),
                        }}>
                        {asset.symbol}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-foreground">{asset.symbol}</div>
                        {asset.reacted ? (
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="text-muted-foreground tabular-nums">{asset.delay}</span>
                            <span className="tabular-nums font-medium"
                              style={{ color: asset.change.startsWith('-') ? (isLight ? '#cc2200' : '#ff453a') : (isLight ? '#1a8f35' : '#32d74b') }}>
                              {asset.change}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">no reaction</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 overflow-x-auto">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                    className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(230,0,122,0.15)', border: '2px solid #e6007a', color: '#e6007a', boxShadow: '0 2px 8px rgba(230,0,122,0.3)' }}>
                        {display.primary}
                      </div>
                      <motion.div className="absolute inset-0 rounded-full" style={{ border: '2px solid #e6007a' }}
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground">Source</span>
                  </motion.div>

                  {display.reactingAssets.map((asset, i) => (
                    <motion.div key={asset.symbol} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
                      className="flex items-center gap-3 flex-shrink-0">
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                        transition={{ delay: 0.1 + i * 0.1, duration: 0.3 }}
                        className="w-8 h-px origin-left"
                        style={{ background: asset.reacted ? (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)') : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)') }} />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            background: asset.reacted ? (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)') : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                            border: `1px solid ${asset.reacted ? (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)') : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)')}`,
                            color: asset.reacted ? (isLight ? '#1d1d1f' : '#f5f5f7') : (isLight ? '#999' : '#555'),
                            boxShadow: asset.reacted ? (isLight ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.4)') : 'none',
                            opacity: asset.reacted ? 1 : 0.5,
                          }}>
                          {asset.symbol}
                        </div>
                        {asset.reacted ? (
                          <div className="text-center">
                            <div className="text-[10px] tabular-nums text-muted-foreground">{asset.delay}</div>
                            <div className="text-[10px] tabular-nums font-medium"
                              style={{ color: asset.change.startsWith('-') ? (isLight ? '#cc2200' : '#ff453a') : (isLight ? '#1a8f35' : '#32d74b') }}>
                              {asset.change}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[9px] text-muted-foreground italic">no reaction</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
