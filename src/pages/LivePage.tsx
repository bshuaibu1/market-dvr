import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import AssetCard from '@/components/AssetCard';
import RecordingBar from '@/components/RecordingBar';
import CorrelationMatrix from '@/components/CorrelationMatrix';
import { getInitialAssets, tickAsset, mockEvents, formatPrice, AssetWithClass, AssetClass } from '@/lib/mockData';
import { checkAlerts } from '@/components/AlertSystem';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { useIsMobile } from '@/hooks/use-mobile';

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
  'AUD/USD': '#ffd60a', 'USD/CAD': '#e6007a',
};

const classBadgeColors: Record<AssetClass, { bg: string; text: string; lightBg?: string; lightText?: string; lightBorder?: string }> = {
  crypto: { bg: 'rgba(160, 32, 240, 0.15)', text: '#bf7fff', lightBg: '#ede8ff', lightText: '#5b21b6', lightBorder: '1px solid #c4b5fd' },
  commodities: { bg: 'rgba(255, 214, 10, 0.15)', text: '#ffd60a', lightBg: '#fef3e2', lightText: '#92400e', lightBorder: '1px solid #fcd34d' },
  forex: { bg: 'rgba(10, 132, 255, 0.15)', text: '#0a84ff', lightBg: '#e0f2fe', lightText: '#075985', lightBorder: '1px solid #7dd3fc' },
};

function MarketPulseChart({ assets }: { assets: AssetWithClass[] }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useIsMobile();
  const width = 800;
  const height = isMobile ? 120 : 200;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };

  const lightColors: Record<string, string> = {
    'BTC/USD': '#1d1d1f', 'XAU/USD': '#b8860b', 'EUR/USD': '#0055d4',
  };

  const lines = useMemo(() => {
    return assets.map(asset => {
      const sparkline = asset.sparkline;
      if (sparkline.length < 2) return null;
      const basePrice = sparkline[0];
      const pctChanges = sparkline.map(p => ((p - basePrice) / basePrice) * 100);
      const min = Math.min(...pctChanges);
      const max = Math.max(...pctChanges);
      return { symbol: asset.symbol, pctChanges, min, max, currentPct: pctChanges[pctChanges.length - 1] };
    }).filter(Boolean) as { symbol: string; pctChanges: number[]; min: number; max: number; currentPct: number }[];
  }, [assets]);

  const allMin = Math.min(...lines.map(l => l.min), -0.5);
  const allMax = Math.max(...lines.map(l => l.max), 0.5);
  const range = allMax - allMin || 1;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <line
        x1={padding.left} x2={width - padding.right}
        y1={padding.top + ((allMax - 0) / range) * chartH}
        y2={padding.top + ((allMax - 0) / range) * chartH}
        stroke={isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'} strokeWidth="1" strokeDasharray="4 4"
      />
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
          <polyline key={line.symbol} points={points} fill="none" stroke={color} strokeWidth={isLight ? '2.5' : '1.5'} strokeLinecap="round" strokeLinejoin="round" opacity={isLight ? '1' : '0.8'} />
        );
      })}
    </svg>
  );
}

function AllAssetsTable({ assets, isLight }: { assets: AssetWithClass[]; isLight: boolean }) {
  const isMobile = useIsMobile();

  return (
    <div className="surface-1 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th className="text-left py-3 px-3 md:px-4 label-caps font-normal">Asset</th>
              {!isMobile && <th className="text-left py-3 px-4 label-caps font-normal">Class</th>}
              <th className="text-right py-3 px-3 md:px-4 label-caps font-normal">Price</th>
              <th className="text-right py-3 px-3 md:px-4 label-caps font-normal">Change %</th>
              {!isMobile && <th className="text-right py-3 px-4 label-caps font-normal">Spread</th>}
              {!isMobile && <th className="text-right py-3 px-4 label-caps font-normal">Confidence</th>}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => {
              const positive = asset.change >= 0;
              const badge = classBadgeColors[asset.assetClass];
              return (
                <tr
                  key={asset.symbol}
                  className="apple-transition hover:bg-accent/50"
                  style={{
                    background: i % 2 === 1 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <td className="py-3 px-3 md:px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium text-[13px] md:text-sm">{asset.symbol}</span>
                      {isMobile ? null : <span className="text-muted-foreground text-xs">{asset.name}</span>}
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
                  <td className="py-3 px-3 md:px-4 text-right tabular-nums text-foreground font-medium text-[13px] md:text-sm">
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
                    <td className="py-3 px-4 text-right tabular-nums text-foreground">
                      {(asset.confidence * 100).toFixed(1)}%
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

export default function LivePage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const lightLegendColors: Record<string, string> = {
    'BTC/USD': '#1d1d1f', 'XAU/USD': '#b8860b', 'EUR/USD': '#0055d4',
  };
  const [assets, setAssets] = useState(getInitialAssets);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => {
        const updated = prev.map(tickAsset);
        checkAlerts(updated);
        return updated;
      });
    }, 200);
    return () => clearInterval(interval);
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
        a.symbol === 'BTC/USD' || a.symbol === 'XAU/USD' || a.symbol === 'EUR/USD'
      );
    }
    return filteredAssets;
  }, [assets, filteredAssets, activeTab]);

  const allEvents = mockEvents;

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
                  background: activeTab === tab.value ? '#f5f5f7' : 'transparent',
                  color: activeTab === tab.value ? '#0d0d0d' : '#86868b',
                  border: activeTab === tab.value ? 'none' : '1px solid rgba(255,255,255,0.08)',
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
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
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
          {filteredAssets.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No assets found</div>
          ) : activeTab === 'all' ? (
            <AllAssetsTable assets={filteredAssets} isLight={isLight} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.symbol} asset={asset} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Market Pulse */}
        <div className="mt-12">
          <h2 className="label-caps mb-4">Market Pulse</h2>
          <div className="surface-1 rounded-2xl p-4 md:p-6" style={{ background: isLight ? '#ffffff' : undefined, border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)' }}>
            <MarketPulseChart assets={pulseAssets} />
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
        </div>

        <CorrelationMatrix assets={assets} />

        {/* Recent Events */}
        <div className="mt-12">
          <h2 className="label-caps mb-4">Recent Events</h2>
          <div className="surface-1 rounded-2xl p-3 md:p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {allEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-3 md:gap-4 py-3 md:py-4 px-2 md:px-3 apple-transition hover:bg-accent/50 rounded-lg"
                style={{ borderLeft: `3px solid ${event.color}` }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] md:text-sm font-medium text-foreground">{event.asset}</span>
                  <span className="text-[13px] md:text-sm text-muted-foreground ml-2 hidden sm:inline">{event.description}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">{event.timestamp}</span>
                <Link to="/replay" className="text-xs text-muted-foreground hover:text-foreground apple-transition whitespace-nowrap min-h-[44px] md:min-h-0 flex items-center">
                  Replay →
                </Link>
              </div>
            ))}
            <div className="flex justify-end pt-3 pr-2">
              <Link to="/events" className="text-xs text-primary hover:text-primary/80 apple-transition font-medium">
                View All Events →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <RecordingBar />
      <MobileBottomNav />
    </div>
  );
}
