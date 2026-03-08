import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import AssetCard from '@/components/AssetCard';
import EventItem from '@/components/EventItem';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset, mockEvents, Asset } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const assetColors: Record<string, string> = {
  'BTC/USD': '#f5f5f7',
  'ETH/USD': '#0a84ff',
  'SOL/USD': '#32d74b',
  'BNB/USD': '#ffd60a',
  'WIF/USD': '#ff453a',
  'BONK/USD': '#e6007a',
};

function MarketPulseChart({ assets }: { assets: Asset[] }) {
  const width = 800;
  const height = 200;
  const padding = { top: 10, right: 10, bottom: 10, left: 10 };

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
      {/* Zero line */}
      <line
        x1={padding.left} x2={width - padding.right}
        y1={padding.top + ((allMax - 0) / range) * chartH}
        y2={padding.top + ((allMax - 0) / range) * chartH}
        stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
      />
      {lines.map(line => {
        const points = line.pctChanges.map((pct, i) => {
          const x = padding.left + (i / (line.pctChanges.length - 1)) * chartW;
          const y = padding.top + ((allMax - pct) / range) * chartH;
          return `${x},${y}`;
        }).join(' ');
        return (
          <polyline
            key={line.symbol}
            points={points}
            fill="none"
            stroke={assetColors[line.symbol] || '#f5f5f7'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        );
      })}
    </svg>
  );
}

export default function LivePage() {
  const [assets, setAssets] = useState(getInitialAssets);

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(tickAsset));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const allEvents = mockEvents;

  return (
    <div className="min-h-screen bg-background pt-14 pb-16">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {assets.map(asset => (
            <AssetCard key={asset.symbol} asset={asset} />
          ))}
        </motion.div>

        {/* Market Pulse */}
        <div className="mt-12">
          <h2 className="label-caps mb-4">Market Pulse</h2>
          <div className="surface-1 rounded-2xl p-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <MarketPulseChart assets={assets} />
            <div className="flex items-center gap-5 mt-4 flex-wrap">
              {assets.map(asset => {
                const positive = asset.change >= 0;
                return (
                  <div key={asset.symbol} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: assetColors[asset.symbol] }} />
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

        {/* Recent Events */}
        <div className="mt-12">
          <h2 className="label-caps mb-4">Recent Events</h2>
          <div className="surface-1 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {allEvents.map(event => (
              <div
                key={event.id}
                className="flex items-center gap-4 py-4 px-3 apple-transition hover:bg-accent/50 rounded-lg"
                style={{ borderLeft: `3px solid ${event.color}` }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground">{event.asset}</span>
                  <span className="text-sm text-muted-foreground ml-2">{event.description}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                <Link to="/replay" className="text-xs text-muted-foreground hover:text-foreground apple-transition whitespace-nowrap">
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
    </div>
  );
}
