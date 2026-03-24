import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import RecordingBar from '@/components/RecordingBar';
import { baseAssets, AssetWithClass, AssetClass } from '@/lib/mockData';
import { fetchLatest } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/components/ThemeProvider';
import InstitutionalCard from '@/components/heatmap/InstitutionalCard';
import StressGauge from '@/components/heatmap/StressGauge';
import TopMovers from '@/components/heatmap/TopMovers';
import CorrelationPulse from '@/components/heatmap/CorrelationPulse';
import MarketBottomBar from '@/components/heatmap/MarketBottomBar';
import AudioIntro from '@/components/AudioIntro';

interface LatestApiAsset {
  asset: string;
  price: number;
  best_bid: number;
  best_ask: number;
  confidence: number;
  exponent: number;
  timestamp_us: number;
}

type HeatmapAsset = AssetWithClass & {
  replayAt?: number;
};

const assetMetaBySymbol: Record<string, { name: string; assetClass: AssetClass }> = baseAssets.reduce(
  (acc, asset) => {
    acc[asset.symbol] = { name: asset.name, assetClass: asset.assetClass };
    return acc;
  },
  {} as Record<string, { name: string; assetClass: AssetClass }>
);

function SectionLabel({ label }: { label: string }) {
  const { theme } = useTheme();
  const light = theme === 'light';

  return (
    <div className="flex items-center gap-3 mb-2">
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          color: light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)',
          fontWeight: 500,
          textTransform: 'uppercase' as const,
          whiteSpace: 'nowrap' as const,
        }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)' }}
      />
    </div>
  );
}

function formatCaptureTime(timestampUs: number | null) {
  if (!timestampUs || !Number.isFinite(timestampUs)) return '—';
  const d = new Date(timestampUs / 1000);
  if (Number.isNaN(d.getTime())) return '—';

  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ss = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');

  return `${hh}:${mm}:${ss}.${ms}`;
}

function formatLag(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms behind`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s behind`;
  return `${(ms / 60000).toFixed(1)}m behind`;
}

function formatMovePct(v: number) {
  if (!Number.isFinite(v)) return '0.00%';
  const safe = Math.abs(v) < 0.005 ? 0 : v;
  return `${safe >= 0 ? '+' : ''}${safe.toFixed(2)}%`;
}

function formatSpread(v: number) {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);
  if (abs >= 1000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (abs >= 1) return `$${v.toFixed(2)}`;
  if (abs >= 0.01) return `$${v.toFixed(4)}`;
  if (abs >= 0.0001) return `$${v.toFixed(6)}`;
  return `$${v.toFixed(8)}`;
}

export default function HeatmapPage() {
  const [assets, setAssets] = useState<HeatmapAsset[]>([]);
  const [lastCapturedUs, setLastCapturedUs] = useState<number | null>(null);
  const [captureClientMs, setCaptureClientMs] = useState<number | null>(null);

  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const light = theme === 'light';

  const priceHistoryRef = useRef<Record<string, { price: number; timestamp: number }[]>>({});

  const openReplayForAsset = (asset: HeatmapAsset) => {
    navigate(
      `/replay?asset=${encodeURIComponent(asset.symbol)}${
        asset.replayAt ? `&replayAt=${asset.replayAt}` : ''
      }`
    );
  };

  useEffect(() => {
    let isMounted = true;

    async function loadLatest() {
      try {
        const data = (await fetchLatest()) as LatestApiAsset[];
        if (!isMounted) return;

        const maxTimestampUs =
          data.length > 0
            ? data.reduce((max, item) => Math.max(max, Number(item.timestamp_us || 0)), 0)
            : 0;

        setLastCapturedUs(maxTimestampUs || null);
        setCaptureClientMs(Date.now());

        setAssets((prev) => {
          const prevBySymbol = new Map(prev.map((a) => [a.symbol, a]));
          const now = Date.now();
          const isInitialFetch = Object.keys(priceHistoryRef.current).length === 0;

          const next: HeatmapAsset[] = data.map((item) => {
            const meta = assetMetaBySymbol[item.asset] ?? {
              name: item.asset,
              assetClass: 'crypto' as AssetClass,
            };

            const factor = Math.pow(10, item.exponent);
            const priceValue = item.price * factor;
            const spreadValue =
              isFinite(item.best_ask) && isFinite(item.best_bid)
                ? Math.abs(item.best_ask - item.best_bid) * factor
                : 0;
            const safePrice = isFinite(priceValue) && priceValue > 0 ? priceValue : 1;

            if (!priceHistoryRef.current[item.asset]) {
              priceHistoryRef.current[item.asset] = [];
            }

            if (isInitialFetch) {
              priceHistoryRef.current[item.asset].push({
                price: priceValue,
                timestamp: now - 300000,
              });
            }

            priceHistoryRef.current[item.asset].push({
              price: priceValue,
              timestamp: now,
            });

            priceHistoryRef.current[item.asset] = priceHistoryRef.current[item.asset].filter(
              (h) => now - h.timestamp < 360000
            );

            const history = priceHistoryRef.current[item.asset];
            const targetTime = now - 300000;

            let baselineEntry = history[0];
            for (let i = history.length - 1; i >= 0; i--) {
              if (history[i].timestamp <= targetTime) {
                baselineEntry = history[i];
                break;
              }
            }

            const change =
              baselineEntry.price > 0 && isFinite(priceValue) && isFinite(baselineEntry.price)
                ? ((priceValue - baselineEntry.price) / baselineEntry.price) * 100
                : 0;

            const confValue = item.confidence * factor;
            const confRatio =
              priceValue > 0 && isFinite(confValue) && isFinite(priceValue)
                ? confValue / priceValue
                : 0;

            const confidenceNorm =
              isFinite(confRatio) && confRatio > 0
                ? Math.max(0, Math.min(0.999, 1 - confRatio))
                : 0.75;

            const prevAsset = prevBySymbol.get(item.asset);
            const baseSparkline =
              prevAsset && prevAsset.sparkline.length > 0 ? prevAsset.sparkline : [priceValue];
            const sparkline = [...baseSparkline, priceValue].slice(-60);

            const volatile =
              Math.abs(change) > 0.5 || spreadValue / safePrice > 0.0005;

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
              replayAt: Number(item.timestamp_us || 0) || undefined,
            };
          });

          return next;
        });
      } catch (error) {
        console.error('Failed to load heatmap assets', error);
      }
    }

    loadLatest();
    const interval = window.setInterval(loadLatest, 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const crypto = useMemo(() => assets.filter((a) => a.assetClass === 'crypto'), [assets]);
  const commodities = useMemo(() => assets.filter((a) => a.assetClass === 'commodities'), [assets]);
  const forex = useMemo(() => assets.filter((a) => a.assetClass === 'forex'), [assets]);

  const avgConf = useMemo(() => {
    if (assets.length === 0) return 0.999;
    const sum = assets.reduce((s, a) => s + (isFinite(a.confidence) ? a.confidence : 0.999), 0);
    const avg = sum / assets.length;
    return isFinite(avg) ? avg : 0.999;
  }, [assets]);

  const stressValue = useMemo(() => {
    if (assets.length === 0) return 20;

    const avgAbsChange =
      assets.reduce((s, a) => s + Math.abs(isFinite(a.change) ? a.change : 0), 0) / assets.length;
    const volatilityScore = Math.min(100, avgAbsChange * 40);

    const volatileCount = assets.filter((a) => a.volatile).length;
    const spreadScore = Math.min(100, (volatileCount / Math.max(assets.length, 1)) * 100);

    const confDrop = Math.max(0, 0.999 - avgConf);
    const confScore = Math.min(100, confDrop * 5000);

    const composite = volatilityScore * 0.4 + spreadScore * 0.4 + confScore * 0.2;
    return Math.round(Math.max(0, Math.min(100, composite)));
  }, [assets, avgConf]);

  const stressLabel = useMemo(() => {
    if (stressValue < 30) return 'LOW';
    if (stressValue < 60) return 'MODERATE';
    return 'HIGH';
  }, [stressValue]);

  const cryptoLarge = crypto.filter((a) => a.symbol === 'BTC/USD' || a.symbol === 'ETH/USD');
  const cryptoSmall = crypto.filter((a) => a.symbol !== 'BTC/USD' && a.symbol !== 'ETH/USD');

  const liveLeader = useMemo(() => {
    if (assets.length === 0) return null;
    return [...assets].sort((a, b) => {
      const aScore = Math.abs(a.change) * 0.7 + (a.spread > 0 ? Math.min(5, a.spread) * 0.3 : 0);
      const bScore = Math.abs(b.change) * 0.7 + (b.spread > 0 ? Math.min(5, b.spread) * 0.3 : 0);
      return bScore - aScore;
    })[0];
  }, [assets]);

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

  const freshnessMs =
    lastCapturedUs && captureClientMs ? captureClientMs - lastCapturedUs / 1000 : NaN;

  const freshnessColor =
    !Number.isFinite(freshnessMs) ? '#86868b' : freshnessMs < 2000 ? '#32d74b' : freshnessMs < 5000 ? '#ffd60a' : '#ff453a';

  return (
    <div className="min-h-screen bg-background pt-14 pb-0 max-md:pb-0">
      <AudioIntro audioSrc="/audio/heatmappageaudio.mp3" pageKey="heatmap" label="Heatmap" />
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-6 md:pt-8 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-0">
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.15em',
                color: headerLabel,
                textTransform: 'uppercase' as const,
                fontWeight: 500,
              }}
            >
              VOLATILITY HEATMAP
            </div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 300,
                color: titleColor,
                marginTop: 4,
                lineHeight: 1.2,
              }}
            >
              Market Overview
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { label: 'ASSETS TRACKED', value: `${assets.length}` },
              { label: 'AVG CONFIDENCE', value: `${(avgConf * 100).toFixed(1)}%` },
              { label: 'MARKET STRESS', value: stressLabel },
            ].map((pill) => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums"
                style={{
                  background: pillBg,
                  border: `1px solid ${pillBorder}`,
                  fontSize: 12,
                }}
              >
                <span style={{ color: pillLabel }}>{pill.label}</span>
                <span style={{ color: pillValue, fontWeight: 500 }}>{pill.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="my-5" style={{ height: 1, background: divider }} />

        <div
          className="rounded-xl px-4 py-3 mb-6"
          style={{
            background: light ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}`,
            boxShadow: light ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: light ? 'rgba(230,0,122,0.06)' : 'rgba(230,0,122,0.1)',
                  border: `1px solid ${light ? 'rgba(230,0,122,0.14)' : 'rgba(230,0,122,0.2)'}`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: freshnessColor,
                    boxShadow: `0 0 10px ${freshnessColor}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#e6007a',
                    fontWeight: 600,
                  }}
                >
                  Recording Live
                </span>
              </div>

              <div
                className="rounded-full px-3 py-1.5"
                style={{
                  background: pillBg,
                  border: `1px solid ${pillBorder}`,
                }}
              >
                <span style={{ fontSize: 12, color: pillLabel, marginRight: 6 }}>Last captured tick</span>
                <span style={{ fontSize: 12, color: pillValue, fontWeight: 600 }}>
                  {formatCaptureTime(lastCapturedUs)}
                </span>
              </div>

              <div
                className="rounded-full px-3 py-1.5"
                style={{
                  background: pillBg,
                  border: `1px solid ${pillBorder}`,
                }}
              >
                <span style={{ fontSize: 12, color: pillLabel, marginRight: 6 }}>Freshness</span>
                <span style={{ fontSize: 12, color: pillValue, fontWeight: 600 }}>
                  {formatLag(freshnessMs)}
                </span>
              </div>

              <div
                className="rounded-full px-3 py-1.5"
                style={{
                  background: pillBg,
                  border: `1px solid ${pillBorder}`,
                }}
              >
                <span style={{ fontSize: 12, color: pillLabel, marginRight: 6 }}>Anchored window</span>
                <span style={{ fontSize: 12, color: pillValue, fontWeight: 600 }}>5m snapshot</span>
              </div>
            </div>

            {liveLeader && (
              <button
                onClick={() => openReplayForAsset(liveLeader)}
                className="text-left rounded-xl px-4 py-3 apple-transition"
                style={{
                  background: light ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                  minWidth: isMobile ? '100%' : 280,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: '#e6007a',
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Live Dislocation
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: titleColor,
                        marginBottom: 2,
                      }}
                    >
                      {liveLeader.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: pillLabel,
                      }}
                    >
                      {formatMovePct(liveLeader.change)} move • {formatSpread(liveLeader.spread)} spread
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: '#e6007a',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Open Replay →
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 lg:w-[70%] space-y-6">
            {crypto.length > 0 && (
              <div>
                <SectionLabel label="Crypto" />
                <div className="grid grid-cols-2 gap-2">
                  {cryptoLarge.map((a) => (
                    <InstitutionalCard key={a.symbol} asset={a} large />
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {cryptoSmall.map((a) => (
                    <InstitutionalCard key={a.symbol} asset={a} />
                  ))}
                </div>
              </div>
            )}

            {commodities.length > 0 && (
              <div>
                <SectionLabel label="Commodities" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commodities.map((a) => (
                    <InstitutionalCard key={a.symbol} asset={a} />
                  ))}
                </div>
              </div>
            )}

            {forex.length > 0 && (
              <div>
                <SectionLabel label="Forex" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {forex.map((a) => (
                    <InstitutionalCard key={a.symbol} asset={a} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`${isMobile ? 'w-full' : 'lg:w-[30%]'}`}>
            {isMobile ? (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
                <div
                  className="flex-shrink-0 rounded-xl p-3"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                    minWidth: 160,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: sidebarLabelColor,
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    STRESS GAUGE
                  </div>
                  <StressGauge value={stressValue} />
                </div>

                <div
                  className="flex-shrink-0 rounded-xl p-3"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                    minWidth: 220,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: sidebarLabelColor,
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    TOP MOVERS
                  </div>
                  <TopMovers assets={assets} />
                </div>

                <div
                  className="flex-shrink-0 rounded-xl p-3"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                    minWidth: 220,
                  }}
                >
                  <CorrelationPulse assets={assets} />
                </div>
              </div>
            ) : (
              <div className="space-y-5 sticky top-20">
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    color: sidebarLabelColor,
                    fontWeight: 500,
                  }}
                >
                  MARKET INTELLIGENCE
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: sidebarLabelColor,
                      marginBottom: 12,
                      fontWeight: 500,
                    }}
                  >
                    STRESS GAUGE
                  </div>
                  <StressGauge value={stressValue} />
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      color: sidebarLabelColor,
                      marginBottom: 12,
                      fontWeight: 500,
                    }}
                  >
                    TOP MOVERS
                  </div>
                  <TopMovers assets={assets} />
                </div>

                <div
                  className="rounded-xl p-4"
                  style={{
                    background: sidebarBg,
                    border: `1px solid ${sidebarBorder}`,
                    boxShadow: sidebarShadow,
                  }}
                >
                  <CorrelationPulse assets={assets} />
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