import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/Navbar';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset, formatPrice, AssetWithClass, AssetClass } from '@/lib/mockData';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface HeatStyle {
  bg: string;
  border: string;
  borderOpacity: number;
}

function getHeatStyle(confidence: number, spread: number, normalSpread: number): HeatStyle {
  if (confidence < 0.8 || spread > normalSpread * 5) {
    return { bg: 'rgba(255,69,58,0.35)', border: '#ff453a', borderOpacity: 1 };
  }
  if (confidence < 0.88) {
    return { bg: 'rgba(255,159,10,0.25)', border: '#ff9f0a', borderOpacity: 1 };
  }
  if (confidence < 0.93) {
    return { bg: 'rgba(50,215,75,0.15)', border: '#32d74b', borderOpacity: 1 };
  }
  return { bg: 'rgba(50,215,75,0.08)', border: '#32d74b', borderOpacity: 0.4 };
}

function getStressLabel(assets: AssetWithClass[]): { label: string; color: string } {
  const avgConf = assets.reduce((s, a) => s + a.confidence, 0) / assets.length;
  if (avgConf < 0.75) return { label: 'EXTREME', color: '#ff1744' };
  if (avgConf < 0.82) return { label: 'HIGH', color: '#ff453a' };
  if (avgConf < 0.9) return { label: 'MODERATE', color: '#ff9f0a' };
  return { label: 'LOW', color: '#32d74b' };
}

const normalSpreads: Record<string, number> = {
  'BTC/USD': 5, 'ETH/USD': 1.5, 'SOL/USD': 0.2, 'BNB/USD': 0.8, 'WIF/USD': 0.003, 'BONK/USD': 0.0000001,
  'XAU/USD': 0.5, 'XAG/USD': 0.03, 'WTI/USD': 0.04, 'BRENT/USD': 0.05, 'NATGAS/USD': 0.005, 'COPPER/USD': 0.008,
  'EUR/USD': 0.00015, 'GBP/USD': 0.00018, 'USD/JPY': 0.015, 'USD/CHF': 0.00012, 'AUD/USD': 0.00014, 'USD/CAD': 0.00016,
};

const wideAssets = new Set(['BTC/USD', 'ETH/USD']);

function ShimmerSquare({ asset, isMobile }: { asset: AssetWithClass; isMobile: boolean }) {
  const [shimmer, setShimmer] = useState(false);
  const [tapped, setTapped] = useState(false);
  const prevPrice = useRef(asset.price);

  useEffect(() => {
    if (asset.price !== prevPrice.current) {
      prevPrice.current = asset.price;
      setShimmer(true);
      const t = setTimeout(() => setShimmer(false), 300);
      return () => clearTimeout(t);
    }
  }, [asset.price]);

  const isWide = wideAssets.has(asset.symbol);
  const style = getHeatStyle(asset.confidence, asset.spread, normalSpreads[asset.symbol] || 1);

  const content = (
    <Link
      to="/replay"
      className="relative flex flex-col justify-between overflow-hidden apple-transition hover:brightness-110 cursor-pointer"
      onClick={isMobile ? (e) => {
        if (!tapped) { e.preventDefault(); setTapped(true); }
        else { setTapped(false); }
      } : undefined}
      style={{
        gridColumn: isMobile && isWide ? '1 / -1' : (isWide ? 'span 2' : 'span 1'),
        background: style.bg,
        borderRadius: 12,
        borderTop: `1px solid ${style.border}`,
        borderLeft: `1px solid rgba(255,255,255,0.04)`,
        borderRight: `1px solid rgba(255,255,255,0.04)`,
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        borderTopColor: style.borderOpacity < 1 ? `${style.border}66` : style.border,
        height: 72,
        padding: '8px 10px',
        transition: 'background 0.6s ease, border-color 0.6s ease',
      }}
    >
      {shimmer && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)', animation: 'shimmerFade 0.3s ease-out forwards' }} />
      )}
      <div className="flex items-start justify-between">
        <span className="text-foreground font-semibold" style={{ fontSize: isWide ? 13 : 11 }}>{asset.symbol}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`tabular-nums font-medium ${asset.change >= 0 ? 'text-positive' : 'text-negative'}`} style={{ fontSize: 11 }}>
          {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
        <span className="text-muted-foreground tabular-nums" style={{ fontSize: 10 }}>
          {(asset.confidence * 100).toFixed(1)}%
        </span>
      </div>
    </Link>
  );

  if (isMobile) {
    return (
      <>
        {content}
        {tapped && (
          <div
            className="col-span-full rounded-xl p-3 text-xs space-y-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="font-medium text-foreground">{asset.name} ({asset.symbol})</div>
            <div className="text-muted-foreground">Price: <span className="text-foreground tabular-nums">${formatPrice(asset.price)}</span></div>
            <div className="text-muted-foreground">Confidence: <span className="text-foreground tabular-nums">{(asset.confidence * 100).toFixed(1)}%</span></div>
            <div className="text-muted-foreground">Spread: <span className="text-foreground tabular-nums">${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(4)}</span></div>
          </div>
        )}
      </>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="top" className="bg-popover border border-border rounded-xl p-3 max-w-[200px]">
        <div className="text-xs space-y-1">
          <div className="font-medium text-foreground">{asset.name} ({asset.symbol})</div>
          <div className="text-muted-foreground">Price: <span className="text-foreground tabular-nums">${formatPrice(asset.price)}</span></div>
          <div className="text-muted-foreground">Confidence: <span className="text-foreground tabular-nums">{(asset.confidence * 100).toFixed(1)}%</span></div>
          <div className="text-muted-foreground">Spread: <span className="text-foreground tabular-nums">${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(4)}</span></div>
          <div className="text-muted-foreground">Volatility: <span className="text-foreground tabular-nums">{asset.volatile ? 'High' : 'Normal'}</span></div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default function HeatmapPage() {
  const [assets, setAssets] = useState(getInitialAssets);
  const isMobile = useIsMobile();

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(tickAsset));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const groups: { label: string; cls: AssetClass }[] = [
    { label: 'CRYPTO', cls: 'crypto' },
    { label: 'COMMODITIES', cls: 'commodities' },
    { label: 'FOREX', cls: 'forex' },
  ];

  const mostVolatile = useMemo(() => [...assets].sort((a, b) => a.confidence - b.confidence)[0], [assets]);
  const mostStable = useMemo(() => [...assets].sort((a, b) => b.confidence - a.confidence)[0], [assets]);
  const stress = useMemo(() => getStressLabel(assets), [assets]);

  return (
    <div className="min-h-screen bg-background pt-14 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="label-caps text-base mb-1">Volatility Heatmap</h1>
          <p className="text-sm text-muted-foreground">Real-time market stress across all asset classes</p>
        </div>

        <div className="space-y-8">
          {groups.map((group, gi) => {
            const groupAssets = assets.filter(a => a.assetClass === group.cls);
            return (
              <div key={group.cls}>
                <div className="label-caps mb-1 text-muted-foreground" style={{ fontSize: 10 }}>{group.label}</div>
                {isMobile && gi === 0 && (
                  <div className="text-[11px] text-muted-foreground mb-2">Tap for details</div>
                )}
                <div className="grid gap-1.5" style={{
                  gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(90px, 1fr))' : 'repeat(auto-fill, minmax(100px, 1fr))',
                }}>
                  {groupAssets.map(asset => (
                    <ShimmerSquare key={asset.symbol} asset={asset} isMobile={isMobile} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 md:gap-8">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Most Volatile:</span>
            <span className="text-negative font-medium tabular-nums">{mostVolatile.symbol} {(mostVolatile.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Most Stable:</span>
            <span className="text-positive font-medium tabular-nums">{mostStable.symbol} {(mostStable.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Market Stress:</span>
            <span className="font-medium" style={{ color: stress.color }}>{stress.label}</span>
          </div>
        </div>
      </div>
      <RecordingBar />
    </div>
  );
}
