import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset, formatPrice, AssetWithClass, AssetClass } from '@/lib/mockData';
import { Link } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

function getHeatColor(confidence: number, spread: number, normalSpread: number): string {
  if (confidence < 0.7 || spread > normalSpread * 5) return '#ff1744';
  if (confidence < 0.8) return '#ff453a';
  if (confidence < 0.88) return '#ff9f0a';
  if (confidence < 0.93) return '#ffd60a';
  if (confidence < 0.97) return '#32d74b';
  return '#00c853';
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

const largeTickers = ['BTC/USD', 'ETH/USD'];

export default function HeatmapPage() {
  const [assets, setAssets] = useState(getInitialAssets);

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

  const mostVolatile = useMemo(() => {
    return [...assets].sort((a, b) => a.confidence - b.confidence)[0];
  }, [assets]);

  const mostStable = useMemo(() => {
    return [...assets].sort((a, b) => b.confidence - a.confidence)[0];
  }, [assets]);

  const stress = useMemo(() => getStressLabel(assets), [assets]);

  return (
    <div className="min-h-screen bg-background pt-14 pb-16">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="label-caps text-base mb-1">Volatility Heatmap</h1>
          <p className="text-sm text-muted-foreground">Real-time market stress across all asset classes</p>
        </div>

        <div className="space-y-8">
          {groups.map(group => {
            const groupAssets = assets.filter(a => a.assetClass === group.cls);
            return (
              <div key={group.cls}>
                <div className="label-caps mb-3">{group.label}</div>
                <div className="grid gap-2" style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                }}>
                  {groupAssets.map(asset => {
                    const isLarge = largeTickers.includes(asset.symbol);
                    const color = getHeatColor(asset.confidence, asset.spread, normalSpreads[asset.symbol] || 1);
                    const ticker = asset.symbol.split('/')[0];
                    return (
                      <Tooltip key={asset.symbol}>
                        <TooltipTrigger asChild>
                          <Link
                            to="/replay"
                            className="rounded-2xl flex flex-col items-center justify-center apple-transition hover:scale-[1.03] cursor-pointer"
                            style={{
                              gridColumn: isLarge ? 'span 2' : 'span 1',
                              gridRow: isLarge ? 'span 2' : 'span 1',
                              background: color + '22',
                              border: `1px solid ${color}44`,
                              minHeight: isLarge ? 180 : 90,
                              transition: 'background 0.6s ease, border-color 0.6s ease',
                            }}
                          >
                            <span className="text-foreground font-semibold text-sm">{ticker}</span>
                            <span className={`text-xs tabular-nums font-medium mt-1 ${asset.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                            </span>
                            <div className="w-3 h-3 rounded-full mt-2" style={{ background: color, boxShadow: `0 0 12px ${color}66` }} />
                          </Link>
                        </TooltipTrigger>
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
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div className="mt-10 flex flex-wrap items-center gap-6 surface-1 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Most Volatile:</span>
            <span className="text-negative font-medium tabular-nums">{mostVolatile.symbol} {(mostVolatile.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Most Stable:</span>
            <span className="text-positive font-medium tabular-nums">{mostStable.symbol} {(mostStable.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Market Stress Index:</span>
            <div className="w-2 h-2 rounded-full" style={{ background: stress.color }} />
            <span className="font-medium" style={{ color: stress.color }}>{stress.label}</span>
          </div>
        </div>
      </div>
      <RecordingBar />
    </div>
  );
}
