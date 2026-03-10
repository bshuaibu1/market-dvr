import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import AssetCard from '@/components/AssetCard';
import RecordingBar from '@/components/RecordingBar';
import CorrelationMatrix from '@/components/CorrelationMatrix';
import { baseAssets, formatPrice, AssetWithClass, AssetClass } from '@/lib/mockData';
import { checkAlerts } from '@/components/AlertSystem';
import { fetchLatest, fetchEvents } from '@/lib/api';
import { Search, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';

interface LatestApiAsset {
  asset: string;
  price: number;
  best_bid: number;
  best_ask: number;
  confidence: number;
  exponent: number;
  timestamp_us: number;
}

interface ApiEvent {
  id: string;
  event_type: string;
  asset: string;
  description: string;
  timestamp: string;
}

type TabType = 'all' | 'crypto' | 'commodities' | 'forex';

const tabs: { value: TabType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'forex', label: 'Forex' },
];

const assetColors: Record<string, string> = {
  'BTC/USD': '#f5f5f7', 'ETH/USD': '#0a84ff', 'SOL/USD': '#32d74b', 'BNB/USD': '#ffd60a',
  'WIF/USD': '#ff453a', 'BONK/USD': '#e6007a', 'XAU/USD': '#ffd700', 'XAG/USD': '#c0c0c0',
  'WTI/USD': '#8b6914', 'BRENT/USD': '#a0522d', 'NATGAS/USD': '#87ceeb', 'COPPER/USD': '#b87333',
  'EUR/USD': '#0a84ff', 'GBP/USD': '#ff6b6b', 'USD/JPY': '#32d74b', 'USD/CHF': '#ff453a',
  'AUD/USD': '#ffd60a', 'USD/CAD': '#e6007a', 'DOGE/USD': '#c2a633',
};

const classBadgeColors: Record<AssetClass, { bg: string; text: string; lightBg?: string; lightText?: string; lightBorder?: string }> = {
  crypto: { bg: 'rgba(160, 32, 240, 0.15)', text: '#bf7fff', lightBg: '#ede8ff', lightText: '#5b21b6', lightBorder: '1px solid #c4b5fd' },
  commodities: { bg: 'rgba(255, 214, 10, 0.15)', text: '#ffd60a', lightBg: '#fef3e2', lightText: '#92400e', lightBorder: '1px solid #fcd34d' },
  forex: { bg: 'rgba(10, 132, 255, 0.15)', text: '#0a84ff', lightBg: '#e0f2fe', lightText: '#075985', lightBorder: '1px solid #7dd3fc' },
};

const eventTypeConfig: Record<string, { color: string; abbr: string }> = {
  volatility_spike: { color: '#ff453a', abbr: 'VOLATILITY SPIKE' },
  spread_spike: { color: '#ffd60a', abbr: 'SPREAD SPIKE' },
  confidence_divergence: { color: '#bf5af2', abbr: 'CONF DIVERGENCE' },
};

const eventTypeLabel = (type: string) => {
  if (type === 'volatility_spike') return 'VOLATILITY SPIKE';
  if (type === 'spread_spike') return 'SPREAD SPIKE';
  if (type === 'confidence_divergence') return 'CONF DIVERGENCE';
  return (type || 'UNKNOWN').toUpperCase().replace('_', ' ');
};

const assetMetaBySymbol: Record<string, { name: string; assetClass: AssetClass }> = baseAssets.reduce(
  (acc, asset) => {
    acc[asset.symbol] = { name: asset.name, assetClass: asset.assetClass };
    return acc;
  },
  {} as Record<string, { name: string; assetClass: AssetClass }>
);

function MarketPulseChart({ assets, isLight }: { assets: AssetWithClass[]; isLight: boolean }) {
  const isMobile = useIsMobile();
  const width = 800;
  const height = isMobile ? 140 : 200;
  const padding = { top: 15, right: 50, bottom: 15, left: 10 };

  const lightColors: Record<string, string> = {
    'BTC/USD': '#0055d4', 'ETH/USD': '#0a84ff', 'SOL/USD': '#32d74b',
  };

  const lines = useMemo(() => {
    return assets.map(asset => {
      const sparkline = asset.sparkline.filter(v => isFinite(v) && !isNaN(v));
      if (sparkline.length < 2) return null;
      const basePrice = sparkline[0];
      if (!basePrice || basePrice === 0) return null;
      const pctChanges = sparkline.map(p => ((p - basePrice) / basePrice) * 100);
      if (pctChanges.some(v => !isFinite(v))) return null;
      const min = Math.min(...pctChanges);
      const max = Math.max(...pctChanges);
      return { symbol: asset.symbol, pctChanges, min, max, currentPct: pctChanges[pctChanges.length - 1] };
    }).filter(Boolean) as { symbol: string; pctChanges: number[]; min: number; max: number; currentPct: number }[];
  }, [assets]);

  const allMin = Math.min(...lines.map(l => l.min), -1.5);
  const allMax = Math.max(...lines.map(l => l.max), 1.5);
  const range = allMax - allMin || 1;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const gridColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const zeroColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
  const yLabelColor = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';

  // Y-axis positions for grid lines
  const yZero = padding.top + ((allMax - 0) / range) * chartH;
  const yTop = padding.top + ((allMax - allMax * 0.75) / range) * chartH;
  const yBot = padding.top + ((allMax - allMin * 0.75) / range) * chartH;

  // Y-axis labels
  const topLabel = `+${(allMax * 0.75).toFixed(1)}%`;
  const botLabel = `${(allMin * 0.75).toFixed(1)}%`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => {
        const y = padding.top + f * chartH;
        return <line key={f} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke={gridColor} strokeWidth="1" />;
      })}
      {/* Zero line */}
      <line x1={padding.left} x2={width - padding.right} y1={yZero} y2={yZero} stroke={zeroColor} strokeWidth="1" strokeDasharray="4 4" />
      {/* Y-axis labels */}
      <text x={width - padding.right + 6} y={yTop + 3} fill={yLabelColor} fontSize="10" fontFamily="Inter, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{topLabel}</text>
      <text x={width - padding.right + 6} y={yZero + 3} fill={yLabelColor} fontSize="10" fontFamily="Inter, sans-serif">0%</text>
      <text x={width - padding.right + 6} y={yBot + 3} fill={yLabelColor} fontSize="10" fontFamily="Inter, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>{botLabel}</text>
      {/* Lines */}
      {lines.map(line => {
        const points = line.pctChanges.map((pct, i) => {
          const x = padding.left + (i / (line.pctChanges.length - 1)) * chartW;
          const y = padding.top + ((allMax - pct) / range) * chartH;
          return `${x},${y}`;
        }).join(' ');
        const color = isLight
          ? (lightColors[line.symbol] || '#666666')
          : (assetColors[line.symbol] || '#f5f5f7');
        return (
          <polyline key={line.symbol} points={points} fill="none" stroke={color} strokeWidth={isLight ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round" opacity={isLight ? '1' : '0.8'} />
        );
      })}
    </svg>
  );
}

function SectionLabel({ label, isLight }: { label: string; isLight: boolean }) {
  const color = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const rule = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  return (
    <div className="flex items-center gap-3" style={{ marginTop: 24, marginBottom: 12 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color, fontWeight: 500, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: rule }} />
    </div>
  );
}

function AllAssetsTable({ assets, isLight }: { assets: AssetWithClass[]; isLight: boolean }) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const headerBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const headerColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const rowHover = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)';
  const altRow = isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)';
  const arrowColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
  const confTrack = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  return (
    <div className="rounded-2xl overflow-hidden" style={{
      background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
      boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
    }}>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: `1px solid ${headerBorder}` }}>
              <th className="text-left py-3 px-3 md:px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Asset</th>
              {!isMobile && <th className="text-left py-3 px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Class</th>}
              <th className="text-right py-3 px-3 md:px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Price</th>
              <th className="text-right py-3 px-3 md:px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Change %</th>
              {!isMobile && <th className="text-right py-3 px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Spread</th>}
              {!isMobile && <th className="text-center py-3 px-4 font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: headerColor }}>Confidence</th>}
              {!isMobile && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => {
              const positive = asset.change >= 0;
              const badge = classBadgeColors[asset.assetClass];
              const confPct = asset.confidence * 100;
              const confColor = confPct > 90 ? '#32d74b' : confPct > 70 ? '#ffd60a' : '#ff453a';
              return (
                <tr
                  key={asset.symbol}
                  className="group cursor-pointer"
                  onClick={() => navigate('/replay?asset=' + encodeURIComponent(asset.symbol))}
                  style={{
                    background: i % 2 === 1 ? altRow : 'transparent',
                    borderBottom: `1px solid ${isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = rowHover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? altRow : 'transparent'; }}
                >
                  <td className="py-3 px-3 md:px-4">
                    <div className="flex items-center gap-2">
                       <span style={{ color: isLight ? '#1d1d1f' : '#fff', fontWeight: 500, fontSize: isMobile ? 13 : 14 }}>{asset.symbol}</span>
                      {!isMobile && <span className="text-muted-foreground text-xs">{asset.name}</span>}
                    </div>
                  </td>
                  {!isMobile && (
                    <td className="py-3 px-4">
                      <span
                        className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full"
                        style={{ background: isLight && badge.lightBg ? badge.lightBg : badge.bg, color: isLight && badge.lightText ? badge.lightText : badge.text, border: isLight && badge.lightBorder ? badge.lightBorder : 'none' }}
                      >
                        {asset.assetClass}
                      </span>
                    </td>
                  )}
                  <td className="py-3 px-3 md:px-4 text-right tabular-nums font-medium text-[13px] md:text-sm" style={{ color: isLight ? '#1d1d1f' : '#fff' }}>
                    ${formatPrice(asset.price)}
                  </td>
                  <td className={`py-3 px-3 md:px-4 text-right tabular-nums font-medium text-[13px] md:text-sm ${positive ? 'text-positive' : 'text-negative'}`}>
                    {positive ? '+' : ''}{asset.change.toFixed(2)}%
                  </td>
                  {!isMobile && (
                    <td className="py-3 px-4 text-right tabular-nums text-muted-foreground">
                      ${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(4)}
                    </td>
                  )}
                  {!isMobile && (
                    <td className="py-3 px-4">
                      {/* #2: Confidence with visual bar */}
                      <div className="flex flex-col items-center gap-1">
                        <span className="tabular-nums text-sm" style={{ color: isLight ? '#1d1d1f' : '#fff' }}>{confPct.toFixed(1)}%</span>
                        <div className="rounded-full" style={{ width: 40, height: 3, background: confTrack }}>
                          <div className="rounded-full h-full" style={{ width: `${confPct}%`, background: confColor, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    </td>
                  )}
                  {!isMobile && (
                    <td className="py-3 pr-3">
                      <ChevronRight size={14} style={{ color: arrowColor, opacity: 0, transition: 'opacity 0.15s ease' }} className="group-hover:!opacity-100" />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const SkeletonCard = ({ isLight }: { isLight: boolean }) => (
  <div 
    className="rounded-2xl p-4 md:p-5 h-[140px] md:h-[160px]" 
    style={{ 
      background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`
    }}
  >
    <motion.div
      animate={{ opacity: [0.3, 0.15, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full h-full flex flex-col gap-3"
    >
      <div className="h-4 w-24 rounded-full bg-current opacity-10" />
      <div className="h-8 w-32 rounded-lg bg-current opacity-10" />
      <div className="mt-auto h-3 w-full rounded-full bg-current opacity-10" />
    </motion.div>
  </div>
);

const SkeletonTable = ({ isLight }: { isLight: boolean }) => (
  <div className="rounded-2xl overflow-hidden p-4 space-y-4" style={{
    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
    border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
  }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        animate={{ opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
        className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
      >
        <div className="h-4 w-32 rounded bg-current opacity-10" />
        <div className="h-4 w-16 rounded bg-current opacity-10" />
      </motion.div>
    ))}
  </div>
);

export default function LivePage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lightLegendColors: Record<string, string> = {
    'BTC/USD': '#0055d4', 'ETH/USD': '#0a84ff', 'SOL/USD': '#32d74b',
  };
  const [assets, setAssets] = useState<AssetWithClass[]>([]);
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Price history for 5-minute change calculation
  const priceHistoryRef = useRef<Record<string, { price: number; timestamp: number }[]>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadLatest() {
      try {
        const data = await fetchLatest() as LatestApiAsset[];
        if (!isMounted) return;
        setAssets(prev => {
          const prevBySymbol = new Map(prev.map(a => [a.symbol, a]));
          const now = Date.now();
          const isInitialFetch = Object.keys(priceHistoryRef.current).length === 0;

          const next: AssetWithClass[] = data.map(item => {
            const meta = assetMetaBySymbol[item.asset] ?? {
              name: item.asset,
              assetClass: 'crypto' as AssetClass,
            };

            const factor = Math.pow(10, item.exponent);
            const priceValue = item.price * factor;
            const spreadValue = (isFinite(item.best_ask) && isFinite(item.best_bid))
              ? Math.abs(item.best_ask - item.best_bid) * factor
              : 0;
            const safePrice = isFinite(priceValue) && priceValue > 0 ? priceValue : 1;

            if (!priceHistoryRef.current[item.asset]) {
              priceHistoryRef.current[item.asset] = [];
            }
            
            // Seed 5-minute-old baseline on first fetch
            if (isInitialFetch) {
              priceHistoryRef.current[item.asset].push({ 
                price: priceValue, 
                timestamp: now - 300000 
              });
            }

            priceHistoryRef.current[item.asset].push({ price: priceValue, timestamp: now });

            // Keep only last 6 minutes of data (360,000ms) to be safe
            priceHistoryRef.current[item.asset] = priceHistoryRef.current[item.asset].filter(
              h => now - h.timestamp < 360000
            );

            const history = priceHistoryRef.current[item.asset];
            const targetTime = now - 300000; // 5 minutes ago
            
            // Find the point closest to 5 minutes ago
            let baselineEntry = history[0];
            for (let i = history.length - 1; i >= 0; i--) {
              if (history[i].timestamp <= targetTime) {
                baselineEntry = history[i];
                break;
              }
            }

            const change = (isFinite(priceValue) && baselineEntry.price > 0)
              ? ((priceValue - baselineEntry.price) / baselineEntry.price) * 100
              : 0;

            const prevAsset = prevBySymbol.get(item.asset);
            const confValue = item.confidence * factor;
            const confRatio = (isFinite(confValue) && safePrice > 0) ? confValue / safePrice : 0;
            const confidenceNorm = isFinite(confRatio)
              ? Math.max(0.6, Math.min(0.99, 1 - confRatio * 2000))
              : 0.75;

            const baseSparkline =
              prevAsset && prevAsset.sparkline.length > 0
                ? prevAsset.sparkline
                : [safePrice];
            const sparkline = [...baseSparkline, safePrice]
              .filter(v => isFinite(v) && !isNaN(v))
              .slice(-60);

            const volatile = Math.abs(change) > 0.5 || (spreadValue / safePrice) > 0.0005;

            return {
              symbol: item.asset,
              name: meta.name,
              price: priceValue,
              change,
              spread: spreadValue,
              confidence: confidenceNorm,
              volatile,
              sparkline,
              assetClass: meta.assetClass,
            };
          });

          checkAlerts(next);
          return next;
        });
      } catch (error) {
        console.error('Failed to load latest assets', error);
      }
    }

    loadLatest();
    const interval = window.setInterval(loadLatest, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        const data = await fetchEvents(10) as ApiEvent[];
        if (!isMounted) return;
        setEvents(data);
      } catch (error) {
        console.error('Failed to load events', error);
      }
    }

    loadEvents();
    const interval = window.setInterval(loadEvents, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredAssets = useMemo(() => {
    let result = activeTab === 'all' ? assets : assets.filter(a => a.assetClass === activeTab);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(a =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.assetClass.toLowerCase().includes(q)
      );
    }
    return result;
  }, [assets, activeTab, search]);

  const pulseAssets = useMemo(() => {
    if (activeTab === 'all') {
      return assets.filter(a =>
        a.symbol === 'BTC/USD' || a.symbol === 'ETH/USD' || a.symbol === 'SOL/USD'
      );
    }
    return filteredAssets;
  }, [assets, filteredAssets, activeTab]);

  const allEvents = events;

  return (
    <div className="min-h-screen bg-background pt-14 pb-16 max-md:pb-[calc(64px+52px)]">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        {/* Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="px-4 py-1.5 rounded-full text-sm font-medium apple-transition flex-shrink-0 min-h-[44px] md:min-h-0"
                style={{
                  background: activeTab === tab.value ? (isLight ? '#1d1d1f' : '#f5f5f7') : 'transparent',
                  color: activeTab === tab.value ? (isLight ? '#fff' : '#0d0d0d') : (isLight ? 'rgba(0,0,0,0.4)' : '#86868b'),
                  border: activeTab === tab.value ? 'none' : `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto w-full sm:w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full h-11 md:h-9 pl-8 pr-3 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground bg-transparent apple-transition focus:outline-none"
              style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}` }}
            />
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab + search}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {assets.length === 0 ? (
            activeTab === 'all' ? (
              <SkeletonTable isLight={isLight} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 16 }).map((_, i) => (
                  <SkeletonCard key={i} isLight={isLight} />
                ))}
              </div>
            )
          ) : filteredAssets.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No assets found</div>
          ) : activeTab === 'all' ? (
            <AllAssetsTable assets={filteredAssets} isLight={isLight} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map(asset => (
                <AssetCard 
                  key={asset.symbol} 
                  asset={asset} 
                  onClick={() => navigate('/replay?asset=' + encodeURIComponent(asset.symbol))}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* #12: Market Pulse section label */}
        <SectionLabel label="Market Pulse" isLight={isLight} />
        <div className="rounded-2xl p-4 md:p-6" style={{
          background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        }}>
          <MarketPulseChart assets={pulseAssets} isLight={isLight} />
          <div className="flex items-center gap-3 md:gap-5 mt-4 flex-wrap">
            {pulseAssets.map(asset => {
              const positive = asset.change >= 0;
              const dotColor = isLight
                ? (lightLegendColors[asset.symbol] || '#666666')
                : (assetColors[asset.symbol] || '#f5f5f7');
              return (
                <div key={asset.symbol} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: dotColor }} />
                  <span className="text-xs text-muted-foreground">{asset.symbol}</span>
                  <span className={`text-xs font-medium tabular-nums ${positive ? 'text-positive' : 'text-negative'}`}>
                    {positive ? '+' : ''}{asset.change.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <CorrelationMatrix assets={assets} />

        {/* #12: Recent Events section label */}
        <SectionLabel label="Recent Events" isLight={isLight} />
        <div className="rounded-2xl p-3 md:p-4" style={{
          background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        }}>
          {allEvents.map(event => {
            const evConf = eventTypeConfig[event.event_type] || { color: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)', abbr: '—' };
            return (
              <div
                key={event.id}
                className="group flex items-center gap-3 md:gap-4 py-3 md:py-4 px-2 md:px-3 rounded-lg cursor-pointer"
                style={{
                  borderLeft: `3px solid ${evConf.color}`,
                  transition: 'background 0.15s ease',
                }}
                onClick={() => navigate(`/replay?asset=${encodeURIComponent(event.asset)}&eventId=${event.id}`)}
                onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.015)' : 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                {/* #9: Event type badge */}
                <span
                  className="flex-shrink-0 flex items-center justify-center tabular-nums"
                  style={{
                    width: 100,
                    fontSize: 8,
                    letterSpacing: '0.01em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    background: `${evConf.color}1f`,
                    border: `1px solid ${evConf.color}4d`,
                    color: evConf.color,
                    padding: '3px 0',
                    borderRadius: 100,
                  }}
                >
                  {eventTypeLabel(event.event_type)}
                </span>

                <div className="flex-1 min-w-0">
                  <span className="text-[13px] md:text-sm font-medium" style={{ color: isLight ? '#1d1d1f' : '#fff' }}>{event.asset}</span>
                  <span className="text-[13px] md:text-sm text-muted-foreground ml-2 hidden sm:inline">{event.description}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{event.timestamp}</span>
                {/* #10: Replay link */}
                <Link
                  to={`/replay?asset=${encodeURIComponent(event.asset)}&eventId=${event.id}`}
                  className="flex-shrink-0 text-[13px] whitespace-nowrap min-h-[44px] md:min-h-0 flex items-center rounded-md px-2"
                  style={{
                    color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={e => e.stopPropagation()}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#e6007a';
                    e.currentTarget.style.background = 'rgba(230,0,122,0.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Replay →
                </Link>
              </div>
            );
          })}
          <div className="flex justify-end pt-3 pr-2">
            <Link to="/events" className="text-xs text-primary hover:text-primary/80 apple-transition font-medium">
              View All Events →
            </Link>
          </div>
        </div>
      </div>

      <RecordingBar />
    </div>
  );
}
