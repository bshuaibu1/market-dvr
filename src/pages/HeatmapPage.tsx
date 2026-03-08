import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import RecordingBar from '@/components/RecordingBar';
import { getInitialAssets, tickAsset } from '@/lib/mockData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/components/ThemeProvider';
import InstitutionalCard from '@/components/heatmap/InstitutionalCard';
import StressGauge from '@/components/heatmap/StressGauge';
import TopMovers from '@/components/heatmap/TopMovers';
import CorrelationPulse from '@/components/heatmap/CorrelationPulse';
import MarketBottomBar from '@/components/heatmap/MarketBottomBar';

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  const light = theme === 'light';
  return (
    <div className="flex items-center gap-3 mb-2">
      <span style={{ fontSize: 10, letterSpacing: '0.12em', color: light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)', fontWeight: 500, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

export default function HeatmapPage() {
  const [assets, setAssets] = useState(getInitialAssets);
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const light = theme === 'light';

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

  const cryptoLarge = crypto.filter(a => a.symbol === 'BTC/USD' || a.symbol === 'ETH/USD');
  const cryptoSmall = crypto.filter(a => a.symbol !== 'BTC/USD' && a.symbol !== 'ETH/USD');

  // Theme colors
  const headerLabel = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.4)';
  const titleColor = light ? '#1d1d1f' : '#fff';
  const pillBg = light ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const pillBorder = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const pillLabel = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
  const pillValue = light ? '#1d1d1f' : '#fff';
  const divider = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const sidebarBg = light ? '#ffffff' : 'rgba(255,255,255,0.03)';
  const sidebarBorder = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
  const sidebarLabelColor = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)';
  const sidebarShadow = light ? '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' : 'none';

  return (
    <div className="min-h-screen bg-background pt-14 pb-0 max-md:pb-0">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-6 md:pt-8 md:pb-8">
        {/* Header — 24px top padding via pt-6 */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-0">
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: headerLabel, textTransform: 'uppercase' as const, fontWeight: 500 }}>
              VOLATILITY HEATMAP
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: titleColor, marginTop: 4, lineHeight: 1.2 }}>Market Overview</h1>
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
                style={{ background: pillBg, border: `1px solid ${pillBorder}`, fontSize: 12 }}
              >
                <span style={{ color: pillLabel }}>{pill.label}</span>
                <span style={{ color: pillValue, fontWeight: 500 }}>{pill.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-5" style={{ height: 1, background: divider }} />

        {/* Two column layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: heatmap grid */}
          <div className="flex-1 lg:w-[70%] space-y-6">
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

            <div>
              <SectionLabel label="Commodities" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {commodities.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel label="Forex" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {forex.map(a => (
                  <InstitutionalCard key={a.symbol} asset={a} />
                ))}
              </div>
            </div>
          </div>

          {/* Right: Market Intelligence sidebar */}
          <div className={`${isMobile ? 'w-full' : 'lg:w-[30%]'}`}>
            {isMobile ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow, minWidth: 160 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: sidebarLabelColor, marginBottom: 8, fontWeight: 500 }}>STRESS GAUGE</div>
                  <StressGauge value={stressValue} />
                </div>
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow, minWidth: 220 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: sidebarLabelColor, marginBottom: 8, fontWeight: 500 }}>TOP MOVERS</div>
                  <TopMovers assets={assets} />
                </div>
                <div className="flex-shrink-0 rounded-xl p-3" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow, minWidth: 220 }}>
                  <CorrelationPulse />
                </div>
              </div>
            ) : (
              <div className="space-y-5 sticky top-20">
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: sidebarLabelColor, fontWeight: 500 }}>
                  MARKET INTELLIGENCE
                </div>

                <div className="rounded-xl p-4" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: sidebarLabelColor, marginBottom: 12, fontWeight: 500 }}>STRESS GAUGE</div>
                  <StressGauge value={stressValue} />
                </div>

                <div className="rounded-xl p-4" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: sidebarLabelColor, marginBottom: 12, fontWeight: 500 }}>TOP MOVERS</div>
                  <TopMovers assets={assets} />
                </div>

                <div className="rounded-xl p-4" style={{ background: sidebarBg, border: `1px solid ${sidebarBorder}`, boxShadow: sidebarShadow }}>
                  <CorrelationPulse />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <MarketBottomBar assets={assets} />
      </div>

      <RecordingBar />
    </div>
  );
}
