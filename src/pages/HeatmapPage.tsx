import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset, AssetWithClass } from '@/lib/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import InstitutionalCard from '@/components/heatmap/InstitutionalCard';
import StressGauge from '@/components/heatmap/StressGauge';
import TopMovers from '@/components/heatmap/TopMovers';
import CorrelationPulse from '@/components/heatmap/CorrelationPulse';
import MarketBottomBar from '@/components/heatmap/MarketBottomBar';

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', fontWeight: 500, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
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

  const crypto = useMemo(() => assets.filter(a => a.assetClass === 'crypto'), [assets]);
  const commodities = useMemo(() => assets.filter(a => a.assetClass === 'commodities'), [assets]);
  const forex = useMemo(() => assets.filter(a => a.assetClass === 'forex'), [assets]);

  const avgConf = useMemo(() => assets.reduce((s, a) => s + a.confidence, 0) / assets.length, [assets]);
  const stressValue = useMemo(() => Math.round((1 - avgConf) * 200), [avgConf]);
  const stressLabel = useMemo(() => {
    if (avgConf > 0.9) return 'LOW';
    if (avgConf > 0.82) return 'MODERATE';
    return 'HIGH';
  }, [avgConf]);

  // BTC, ETH are large; rest are small
  const cryptoLarge = crypto.filter(a => a.symbol === 'BTC/USD' || a.symbol === 'ETH/USD');
  const cryptoSmall = crypto.filter(a => a.symbol !== 'BTC/USD' && a.symbol !== 'ETH/USD');

  return (
    <div className="min-h-screen bg-background pt-14 pb-0 max-md:pb-0">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-0">
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as const, fontWeight: 500 }}>
              VOLATILITY HEATMAP
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#fff', marginTop: 4, lineHeight: 1.2 }}>Market Overview</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'ASSETS TRACKED', value: `${assets.length}` },
              { label: 'AVG CONFIDENCE', value: `${(avgConf * 100).toFixed(1)}%` },
              { label: 'MARKET STRESS', value: stressLabel },
            ].map(pill => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 12,
                }}
              >
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{pill.label}</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{pill.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Two column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: heatmap grid — 70% */}
          <div className="flex-1 lg:w-[70%] space-y-6">
            {/* Crypto */}
            <div>
              <SectionLabel label="Crypto" />
              <div className="grid grid-cols-2 gap-2">
                {cryptoLarge.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} large />
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {cryptoSmall.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} />
                ))}
              </div>
            </div>

            {/* Commodities */}
            <div>
              <SectionLabel label="Commodities" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commodities.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} />
                ))}
              </div>
            </div>

            {/* Forex */}
            <div>
              <SectionLabel label="Forex" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {forex.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Market Intelligence sidebar — 30% */}
          <div className={`${isMobile ? 'w-full' : 'lg:w-[30%]'}`}>
            {isMobile ? (
              /* Mobile: horizontal scrolling stats strip */
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: 160 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8, fontWeight: 500 }}>STRESS GAUGE</div>
                  <StressGauge value={stressValue} />
                </div>
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: 220 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 8, fontWeight: 500 }}>TOP MOVERS</div>
                  <TopMovers assets={assets} />
                </div>
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', minWidth: 220 }}>
                  <CorrelationPulse />
                </div>
              </div>
            ) : (
              /* Desktop: vertical sidebar */
              <div className="space-y-5 sticky top-20">
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>
                  MARKET INTELLIGENCE
                </div>

                {/* Stress Gauge */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 12, fontWeight: 500 }}>STRESS GAUGE</div>
                  <StressGauge value={stressValue} />
                </div>

                {/* Top Movers */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 12, fontWeight: 500 }}>TOP MOVERS</div>
                  <TopMovers assets={assets} />
                </div>

                {/* Correlation Pulse */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <CorrelationPulse />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8">
        <MarketBottomBar assets={assets} />
      </div>

      <RecordingBar />
    </div>
  );
}
