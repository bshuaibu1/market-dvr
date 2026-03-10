import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { generateReplayData, formatPrice, allAssetsList } from '@/lib/mockData';
import { fetchTicks, fetchLatest, fetchAssetEvents } from '@/lib/api';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Share2, Keyboard, GitCompareArrows, ChevronRight } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import pythLogo from '@/assets/pyth-logo.png';
import ShortcutsModal from '@/components/ShortcutsModal';
import ShareModal from '@/components/ShareModal';
import TimeframeChart, { isRawTimeframe, isVolumeTimeframe, getTicksPerCandle, getCandleCount } from '@/components/TimeframeChart';
import { useTheme } from '@/components/ThemeProvider';
import MarketAutopsy from '@/components/MarketAutopsy';
import ShockPropagation from '@/components/ShockPropagation';
import { useIsMobile } from '@/hooks/use-mobile';

const timeframes = ['50ms', '200ms', '1s', '5s', '30s', '1m', '5m', '15m', '1h'];
const timeframeLabels: Record<string, string> = {
  '50ms': '50ms', '200ms': '200ms', '1s': '1s', '5s': '5s', '30s': '30s',
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h',
};

const speeds = ['0.25x', '0.5x', '1x', '2x', '4x'];
const speedMap: Record<string, number> = { '0.25x': 200, '0.5x': 100, '1x': 50, '2x': 25, '4x': 12 };
const keyToSpeed: Record<string, string> = { '1': '0.25x', '2': '0.5x', '3': '1x', '4': '2x', '5': '4x' };

const assetExponents: Record<string, number> = {
  'BTC/USD': -8, 'ETH/USD': -8, 'SOL/USD': -8, 'BNB/USD': -8,
  'BONK/USD': -10, 'WIF/USD': -8, 'DOGE/USD': -8, 'PYTH/USD': -8,
  'XAU/USD': -3, 'XAG/USD': -5, 'EUR/USD': -5, 'GBP/USD': -5,
  'USD/JPY': -3, 'USD/CHF': -5, 'AUD/USD': -5, 'USD/CAD': -5,
};

export default function ReplayPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const initAsset = searchParams.get('asset');
  const initEventId = searchParams.get('eventId');
  const [selectedAsset, setSelectedAsset] = useState(initAsset || 'BTC/USD');
  const [compareMode, setCompareMode] = useState(false);
  const [compareAsset, setCompareAsset] = useState('ETH/USD');
  const [inspectorTab, setInspectorTab] = useState<'inspector' | 'autopsy'>('inspector');
  const [autopsyData, setAutopsyData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const assetParam = searchParams.get('asset');
  const eventIdParam = searchParams.get('eventId');

  useEffect(() => {
    if (assetParam) {
      setSelectedAsset(assetParam);
    }
  }, [assetParam]);

  const [apiAssets, setApiAssets] = useState<{symbol: string}[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<{time: number, timestamp_us: number, price: number, bid: number, ask: number, spread: number, confidence: number}[]>([]);

  const [frame, setFrame] = useState(250);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [showBid, setShowBid] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [timeframe, setTimeframe] = useState('1s');
  const [isLive, setIsLive] = useState(false);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetchLatest().then((res: any[]) => {
      if (res && res.length) {
        setApiAssets(res.map(r => ({ symbol: r.asset })));
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setDataLoading(true);
      try {
        const events = await fetchAssetEvents(selectedAsset);
        if (!active) return;
        
        let targetEvent = null;
        if (events && events.length) {
          targetEvent = initEventId ? (events.find((e: any) => e.id === initEventId) || events[0]) : events[0];
          const exp = assetExponents[selectedAsset] || -8;
          const mult = Math.pow(10, exp);
          
          setAutopsyData({
            ...targetEvent,
            first_price: targetEvent.first_price * mult,
            last_price: targetEvent.last_price * mult,
            max_spread: targetEvent.max_spread * mult,
            baseline_spread: targetEvent.baseline_spread * mult,
          });
          setTimelineEvents(events);
        } else {
          setAutopsyData(null);
          setTimelineEvents([]);
        }

        const fetchLimit = ['5m', '15m', '1h'].includes(timeframe) ? 1000 : 500;
        const ticks = await fetchTicks(selectedAsset, fetchLimit);
        if (!active || !ticks || !ticks.length) return;

        const mapped = ticks.map((t: any, i: number) => {
          const p = t.price * Math.pow(10, t.exponent);
          const b = t.best_bid * Math.pow(10, t.exponent);
          const a = t.best_ask * Math.pow(10, t.exponent);
          const confAbs = t.confidence * Math.pow(10, t.exponent);
          const safeP = isFinite(p) && p > 0 ? p : 1;
          const confNorm = isFinite(confAbs) && confAbs > 0 ? Math.max(0, Math.min(0.999, 1 - confAbs / safeP)) : 0.95;
          return {
            time: i,
            timestamp_us: Number(t.timestamp_us || t.start_time || 0),
            price: p,
            bid: b,
            ask: a,
            spread: a - b,
            confidence: confNorm,
          };
        }).filter((d: any) => isFinite(d.price) && d.price > 0);
        setData(mapped);
        setDataLoading(false);

        let targetIdx = -1;
        if (initEventId && targetEvent) {
          const tgtTime = Number(targetEvent.start_time);
          targetIdx = ticks.findIndex((t: any) => t.timestamp_us >= tgtTime);
        }

        if (targetIdx !== -1) {
          setFrame(targetIdx);
        } else {
          setFrame(f => Math.min(f, mapped.length - 1));
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadData();

    return () => { active = false; };
  }, [selectedAsset, timeframe, initEventId]);

  // Live tail mode — polls for new ticks and advances frame to end
  useEffect(() => {
    if (!isLive) {
      clearInterval(liveIntervalRef.current);
      return;
    }
    setPlaying(false);

    async function pollLive() {
      try {
        const ticks = await fetchTicks(selectedAsset, 500);
        if (!ticks || !ticks.length) return;
        const mapped = ticks.map((t: any, i: number) => {
          const exp = assetExponents[selectedAsset] || -8;
          const factor = Math.pow(10, exp);
          return {
            time: i,
            timestamp_us: Number(t.timestamp_us || 0),
            price: t.price * factor,
            bid: t.best_bid * factor,
            ask: t.best_ask * factor,
            spread: (t.best_ask - t.best_bid) * factor,
            confidence: t.confidence * factor,
          };
        });
        setData(mapped);
        setFrame(mapped.length - 1);
      } catch (err) {
        console.error(err);
      }
    }

    pollLive();
    liveIntervalRef.current = setInterval(pollLive, 1000);
    return () => clearInterval(liveIntervalRef.current);
  }, [isLive, selectedAsset]);

  // Detach from live when user scrubs
  const handleScrub = (val: number) => {
    if (isLive && val < data.length - 5) setIsLive(false);
    setFrame(val);
  };
  const compareData = useMemo(() => compareMode ? generateReplayData(500, compareInfo?.price || 3287.80) : [], [compareMode, compareAsset]);

  const isRaw = isRawTimeframe(timeframe);
  const showVol = isVolumeTimeframe(timeframe);
  const totalFrames = isRaw ? data.length : getCandleCount(data.length, timeframe);

  const playRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing) {
      const ms = speedMap[speed] || 50;
      playRef.current = setInterval(() => {
        setFrame(f => {
          if (f >= data.length - 1) { setPlaying(false); return f; }
          return f + 1;
        });
      }, ms);
    }
    return () => clearInterval(playRef.current);
  }, [playing, speed, data.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    switch (e.code) {
      case 'Space': e.preventDefault(); setPlaying(p => !p); break;
      case 'ArrowLeft':
        e.preventDefault();
        setFrame(f => Math.max(0, f - (e.shiftKey ? 100 : 10)));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFrame(f => Math.min(data.length - 1, f + (e.shiftKey ? 100 : 10)));
        break;
      case 'Home': e.preventDefault(); setFrame(0); break;
      case 'End': e.preventDefault(); setFrame(data.length - 1); break;
      default:
        if (keyToSpeed[e.key]) { setSpeed(keyToSpeed[e.key]); }
    }
  }, [data.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const emptyTick = { time: 0, timestamp_us: 0, price: 0, bid: 0, ask: 0, spread: 0, confidence: 0 };
  const current = data[frame] ?? emptyTick;
  const prev = data[Math.max(0, frame - 1)] ?? emptyTick;
  const priceChange = current.price - prev.price;

  const useCompare = compareMode && compareData.length > 0;
  const compareCurrent = useCompare ? compareData[frame] : null;

  const chartWidth = 800;
  const chartHeight = isMobile ? 160 : 300;

  const startPrice1 = (data[0] ?? emptyTick).price;
  const startPrice2 = useCompare ? compareData[0].price : 0;

  let minP: number, maxP: number, rangeP: number;
  let toY: (v: number) => number;

  if (useCompare) {
    const pcts1 = data.map(d => ((d.price - startPrice1) / startPrice1) * 100);
    const pcts2 = compareData.map(d => ((d.price - startPrice2) / startPrice2) * 100);
    const allPcts = [...pcts1, ...pcts2];
    minP = Math.min(...allPcts) - 0.5;
    maxP = Math.max(...allPcts) + 0.5;
    rangeP = maxP - minP || 1;
    toY = (pct: number) => chartHeight - ((pct - minP) / rangeP) * chartHeight;
  } else {
    const prices = data.map(d => d.price);
    minP = Math.min(...prices) * 0.999;
    maxP = Math.max(...prices) * 1.001;
    rangeP = maxP - minP || 1;
    toY = (v: number) => chartHeight - ((v - minP) / rangeP) * chartHeight;
  }

  const rechartsData = useMemo(() => {
    return data.map((d, i) => {
      let pct1 = 0, pct2 = 0;
      if (useCompare) {
        pct1 = ((d.price - startPrice1) / startPrice1) * 100;
        if (compareData[i]) {
          pct2 = ((compareData[i].price - startPrice2) / startPrice2) * 100;
        }
      }
      return {
        ...d,
        index: i,
        pct1,
        pct2
      };
    });
  }, [data, compareData, useCompare, startPrice1, startPrice2]);

  const chartPadLeft = 20;
  const toX = (i: number) => chartPadLeft + (i / (data.length - 1)) * (chartWidth - chartPadLeft);

  let priceLine: string, bidLine: string, askLine: string, confFill: string;
  let compareLine = '';

  if (useCompare) {
    priceLine = data.map((d, i) => `${toX(i)},${toY(((d.price - startPrice1) / startPrice1) * 100)}`).join(' ');
    compareLine = compareData.map((d, i) => `${toX(i)},${toY(((d.price - startPrice2) / startPrice2) * 100)}`).join(' ');
    bidLine = '';
    askLine = '';
    confFill = '';
  } else {
    priceLine = data.map((d, i) => `${toX(i)},${toY(d.price)}`).join(' ');
    bidLine = data.map((d, i) => `${toX(i)},${toY(d.bid)}`).join(' ');
    askLine = data.map((d, i) => `${toX(i)},${toY(d.ask)}`).join(' ');
    confFill = data.map((d, i) => `${toX(i)},${toY(d.price + (1 - d.confidence) * 100)}`).join(' ')
      + ' ' + [...data].reverse().map((d, i) => `${toX(data.length - 1 - i)},${toY(d.price - (1 - d.confidence) * 100)}`).join(' ');
  }

  const spreads = data.map(d => d.spread);
  const maxSpread = Math.max(...spreads);
  const spreadChartH = isMobile ? 48 : 80;
  const spreadLine = data.map((d, i) => `${toX(i)},${spreadChartH - (d.spread / maxSpread) * (spreadChartH - 5)}`).join(' ');
  const spreadFillPoly = `0,${spreadChartH} ${spreadLine} ${chartWidth},${spreadChartH}`;

  const eventPositions = [140, 165, 300, 350];

  const maxSpreadIdx = spreads.indexOf(Math.max(...spreads));
  const confidences = data.map(d => d.confidence);
  const minConfIdx = confidences.indexOf(Math.min(...confidences));
  let peakVolIdx = 0;
  let peakVolDelta = 0;
  for (let i = 1; i < data.length; i++) {
    const d = Math.abs(data[i].price - data[i - 1].price);
    if (d > peakVolDelta) { peakVolDelta = d; peakVolIdx = i; }
  }

  const timelineMarkers = useMemo(() => {
    if (!data.length || !timelineEvents.length) return [];
    const firstTickTime = data[0].timestamp_us || 0;
    const lastTickTime = data[data.length - 1].timestamp_us || 0;
    
    return timelineEvents.map(ev => {
      const start = Number(ev.start_time);
      if (start < firstTickTime || start > lastTickTime) return null;
      let frameIdx = data.findIndex(d => (d.timestamp_us || 0) >= start);
      if (frameIdx === -1) frameIdx = data.length - 1;
      
      let label = ev.event_type;
      if (label === 'volatility_spike') label = 'Volatility Spike';
      else if (label === 'spread_spike') label = 'Spread Spike';
      else if (label === 'confidence_divergence') label = 'Confidence Drop';

      return { ...ev, frame: frameIdx, label };
    }).filter(Boolean);
  }, [timelineEvents, data]);

  const pct1 = ((current.price - startPrice1) / startPrice1 * 100).toFixed(2);
  const pct2 = compareCurrent ? ((compareCurrent.price - startPrice2) / startPrice2 * 100).toFixed(2) : '0';

  // #6 #7: Frame inspector with row dividers
  const inspectorLabelColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const inspectorValueColor = isLight ? '#1d1d1f' : '#fff';
  const inspectorDivider = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  const inspectorPanel = (
    <>
      {/* Tab selector */}
      <div className="flex items-center gap-1 p-1 rounded-full surface-1 mb-6">
        <button
          onClick={() => setInspectorTab('inspector')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium apple-transition flex-1 text-center ${inspectorTab === 'inspector' ? 'surface-2 inner-glow text-foreground' : 'text-muted-foreground'}`}
        >
          Frame Inspector
        </button>
        <button
          onClick={() => setInspectorTab('autopsy')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium apple-transition flex-1 text-center ${inspectorTab === 'autopsy' ? 'text-foreground' : 'text-muted-foreground'}`}
          style={inspectorTab === 'autopsy' ? { background: '#e6007a', color: '#fff' } : {}}
        >
          Autopsy
        </button>
      </div>

      {inspectorTab === 'inspector' ? (
        <>
          {useCompare && compareCurrent ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-foreground mb-3">{selectedAsset}</div>
                {[
                  { label: 'PRICE', value: `$${formatPrice(current.price)}` },
                  { label: 'BID', value: `$${formatPrice(current.bid)}` },
                  { label: 'ASK', value: `$${formatPrice(current.ask)}` },
                  { label: 'SPREAD', value: `$${current.spread.toFixed(2)}` },
                  { label: 'CONF', value: `${Math.min(100, current.confidence * 100).toFixed(1)}%` },
                ].map((row, idx, arr) => (
                  <div key={row.label} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none', padding: '12px 0' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>{row.label}</div>
                    <div className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-medium mb-3" style={{ color: '#0a84ff' }}>{compareAsset}</div>
                {[
                  { label: 'PRICE', value: `$${formatPrice(compareCurrent.price)}` },
                  { label: 'BID', value: `$${formatPrice(compareCurrent.bid)}` },
                  { label: 'ASK', value: `$${formatPrice(compareCurrent.ask)}` },
                  { label: 'SPREAD', value: `$${compareCurrent.spread.toFixed(2)}` },
                  { label: 'CONF', value: `${Math.min(100, compareCurrent.confidence * 100).toFixed(1)}%` },
                ].map((row, idx, arr) => (
                  <div key={row.label} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none', padding: '12px 0' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>{row.label}</div>
                    <div className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: 'PRICE', value: `$${formatPrice(current.price)}`, change: priceChange },
                { label: 'BID', value: `$${formatPrice(current.bid)}` },
                { label: 'ASK', value: `$${formatPrice(current.ask)}` },
                { label: 'SPREAD', value: `$${current.spread.toFixed(2)}` },
                { label: 'CONFIDENCE', value: `${Math.min(100, current.confidence * 100).toFixed(1)}%` },
                { label: 'FRAME', value: `${frame} / ${data.length}` },
                { label: 'RESOLUTION', value: timeframe },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  style={{
                    borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none',
                    padding: '12px 0',
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor, marginBottom: 2 }}>{row.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</span>
                    {'change' in row && row.change !== undefined && (
                      <span className={`text-xs tabular-nums ${row.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h3 className="label-caps mb-3">Timeline Events</h3>
            <div className="flex flex-wrap gap-2">
              {timelineMarkers.length > 0 ? timelineMarkers.map((m: any, idx) => (
                <button
                  key={`${m.id}-${idx}`}
                  onClick={() => setFrame(m.frame)}
                  className="px-3 py-1 rounded-full surface-1 text-[11px] text-muted-foreground font-medium apple-transition hover:bg-slate-200 dark:hover:bg-slate-800"
                >
                  {m.label}
                </button>
              )) : (
                <span className="text-[11px] text-muted-foreground">No events in this range</span>
              )}
            </div>
          </div>

          {/* #8: AI Markers — clickable with hover arrow */}
          <div className="mt-6">
            <h3 className="label-caps mb-3">AI Markers</h3>
            <div className="space-y-0">
              {[
                { color: '#f97316', label: 'Max Spread', frame: maxSpreadIdx },
                { color: '#9333ea', label: 'Max Confidence Expansion', frame: minConfIdx },
                { color: isLight ? '#1d1d1f' : '#f5f5f7', label: 'Peak Volatility', frame: peakVolIdx },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => setFrame(m.frame)}
                  className="group/marker flex items-center gap-2 w-full text-left min-h-[44px] md:min-h-[36px] rounded-lg px-2 -mx-2"
                  style={{ transition: 'background 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground ml-auto">#{m.frame}</span>
                  <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover/marker:opacity-100" style={{ transition: 'opacity 0.15s ease' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <MarketAutopsy data={autopsyData} />
      )}
    </>
  );

  // Toggle pill colors
  const togglePillInactiveBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const togglePillActiveBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const togglePillInactiveText = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
  const togglePillActiveText = isLight ? '#1d1d1f' : '#fff';

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />

      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-56px)]">
        <div className="flex-1 flex flex-col p-4 md:p-6 min-w-0" style={{ gap: 8 }}>
          {/* Top bar — 16px from nav (pt-4 = 16px) */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <select
              value={selectedAsset}
              onChange={e => { setSelectedAsset(e.target.value); setFrame(250); setPlaying(false); }}
              className="h-11 md:h-9 rounded-xl bg-background text-foreground text-sm px-3 font-medium focus:outline-none min-w-[120px]"
              style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}
            >
              {(apiAssets.length > 0 ? apiAssets : allAssetsList).map(a => (
                <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
              ))}
            </select>
            <span className="label-caps">Replay</span>

            {/* LIVE button */}
            <button
              onClick={() => setIsLive(l => !l)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0"
              style={{
                background: isLive ? 'rgba(230,0,122,0.15)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                border: isLive ? '1px solid #e6007a' : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                color: isLive ? '#e6007a' : undefined,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: isLive ? '#e6007a' : (isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'), animation: isLive ? 'pulse 1.5s infinite' : 'none' }} />
              LIVE
            </button>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0 ${compareMode ? 'text-foreground' : 'text-muted-foreground'}`}
              style={{
                background: compareMode ? 'rgba(10,132,255,0.15)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                border: compareMode ? '1px solid #0a84ff' : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <GitCompareArrows size={14} /> Compare
            </button>

            {compareMode && (
              <>
                <span className="text-xs text-muted-foreground">vs</span>
                <select
                  value={compareAsset}
                  onChange={e => setCompareAsset(e.target.value)}
                  className="h-11 md:h-9 rounded-xl bg-background text-foreground text-sm px-3 focus:outline-none"
                  style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  {(apiAssets.length > 0 ? apiAssets : allAssetsList).filter(a => a.symbol !== selectedAsset).map(a => (
                    <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                  ))}
                </select>
              </>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl surface-1 text-xs font-medium text-muted-foreground apple-transition hover:text-foreground"
              >
                <Keyboard size={14} /> Shortcuts
              </button>
              {/* #10: Share button prominent pink */}
              <button
                onClick={() => setShowShare(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0 ${isMobile ? 'w-full justify-center' : ''}`}
                style={{
                  background: '#e6007a',
                  color: '#fff',
                  border: 'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cc0066'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e6007a'; }}
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Toggle pills / Legend */}
          {useCompare ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: isLight ? '#0055d4' : '#f5f5f7' }} />
                <span className="text-xs text-foreground font-medium">{selectedAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct1) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct1) >= 0 ? '+' : ''}{pct1}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: isLight ? '#e6007a' : '#0a84ff' }} />
                <span className="text-xs font-medium" style={{ color: isLight ? '#e6007a' : '#0a84ff' }}>{compareAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct2) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct2) >= 0 ? '+' : ''}{pct2}%
                </span>
              </div>
            </div>
          ) : (
            // #4: Redesigned toggle pills
            <div className="flex items-center gap-1.5 w-fit">
              {[
                { label: 'Bid', active: showBid, toggle: () => setShowBid(!showBid), color: isLight ? '#0055d4' : '#0a84ff' },
                { label: 'Ask', active: showAsk, toggle: () => setShowAsk(!showAsk), color: isLight ? '#cc2200' : '#ff453a' },
                { label: 'Confidence', active: showConfidence, toggle: () => setShowConfidence(!showConfidence), color: '#e6007a' },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
                  style={{
                    background: t.active ? togglePillActiveBg : togglePillInactiveBg,
                    color: t.active ? togglePillActiveText : togglePillInactiveText,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: t.color,
                      opacity: t.active ? 1 : 0.3,
                      transition: 'opacity 0.15s ease',
                    }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Timeframe selector pills */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 p-1 rounded-full surface-1 overflow-x-auto scrollbar-hide">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => { setTimeframe(tf); setFrame(0); setPlaying(false); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium apple-transition flex-shrink-0 min-h-[44px] md:min-h-0 ${timeframe === tf ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  style={timeframe === tf ? { background: '#e6007a', color: '#fff' } : {}}
                >
                  {timeframeLabels[tf]}
                </button>
              ))}
            </div>
            {(timeframe === '50ms' || timeframe === '200ms') && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex-shrink-0" style={{ color: '#e6007a', background: 'rgba(230,0,122,0.1)', border: '1px solid rgba(230,0,122,0.2)' }}>
                <img src={pythLogo} alt="Pyth" width={14} height={14} className="inline-block" /> Pyth Pro Only
              </span>
            )}
          </div>

          {/* #1: Price row — dedicated, outside chart */}
          <div className="flex items-baseline justify-between">
            {dataLoading ? (
              <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />
            ) : (
              <span className="tabular-nums" style={{ fontSize: 32, fontWeight: 600, color: isLight ? '#1d1d1f' : '#fff' }}>
                ${formatPrice(current.price)}
              </span>
            )}
            {!dataLoading && (
              <span className="tabular-nums" style={{ fontSize: 14, color: priceChange >= 0 ? (isLight ? '#1a8f35' : '#32d74b') : (isLight ? '#cc2200' : '#ff453a') }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
              </span>
            )}
          </div>

          {/* #5: Chart container — clean, no overlapping text */}
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              height: isMobile ? 160 : undefined,
              flex: isMobile ? 'none' : 1,
              minHeight: isMobile ? undefined : 200,
              background: isLight ? '#fff' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {!useCompare && timeframe !== '1s' ? (
              <TimeframeChart 
                rawData={data} 
                timeframe={timeframe} 
                frame={frame} 
                chartWidth={chartWidth} 
                chartHeight={chartHeight} 
                isLight={isLight} 
                showBid={showBid}
                showAsk={showAsk}
                showConfidence={showConfidence}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rechartsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)'} />
                  <YAxis domain={[minP, maxP]} hide />
                  {!useCompare && showConfidence && <Line type="monotone" dataKey={(d: any) => d.price + d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
                  {!useCompare && showConfidence && <Line type="monotone" dataKey={(d: any) => d.price - d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
                  {!useCompare && showBid && <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
                  {!useCompare && showAsk && <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
                  <Line type="monotone" dataKey={useCompare ? "pct1" : "price"} stroke={useCompare ? (isLight ? '#0055d4' : '#f5f5f7') : (isLight ? '#1d1d1f' : '#fff')} strokeWidth={isLight ? 2 : 1.5} dot={false} isAnimationActive={false} />
                  {useCompare && <Line type="monotone" dataKey="pct2" stroke={isLight ? '#e6007a' : '#0a84ff'} strokeWidth={2} dot={false} isAnimationActive={false} />}
                  <ReferenceLine x={frame} stroke="#e6007a" strokeOpacity={0.5} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Spread panel — React LineChart replaced */}
          {!useCompare && (
            <div style={{ height: spreadChartH }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="label-caps">Spread Width</span>
                <span className="text-sm tabular-nums text-foreground font-medium">${current.spread.toFixed(2)}</span>
              </div>
              <div style={{ width: '100%', height: spreadChartH - 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rechartsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <YAxis domain={['dataMin', 'dataMax * 1.1']} hide />
                    <Line type="monotone" dataKey="spread" stroke="#e6007a" strokeWidth={isLight ? 2 : 1.5} dot={false} isAnimationActive={false} />
                    <ReferenceLine x={frame} stroke="#e6007a" strokeOpacity={0.3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Shock Propagation — #9: 44px collapsed */}
          <ShockPropagation sourceAsset={selectedAsset} currentFrame={frame} />

          {/* Playback controls — #9: scrubber 32px + controls 56px */}
          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            {/* Scrubber — 32px */}
            <div className="w-full relative flex items-center" style={{ height: 32 }}>
              {timelineMarkers.map((m: any, i) => (
                <div key={`tm-${i}`} className="absolute -top-1 w-2 h-2 rotate-45 cursor-pointer" style={{ left: `${(m.frame / data.length) * 100}%`, background: '#e6007a', outline: isLight ? '1.5px solid #1d1d1f' : 'none', zIndex: 10 }} title={m.label} onClick={() => setFrame(m.frame)} />
              ))}
              <div className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(maxSpreadIdx / data.length) * 100}%`, background: '#f97316', outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(249,115,22,0.5)' }} title="Max Spread" />
              <div className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(minConfIdx / data.length) * 100}%`, background: '#9333ea', outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(147,51,234,0.5)' }} title="Max Confidence Expansion" />
              <div className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(peakVolIdx / data.length) * 100}%`, background: isLight ? '#1d1d1f' : '#f5f5f7', outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(255,255,255,0.5)' }} title="Peak Volatility" />
              {useCompare && [120, 280, 380].map((pos, i) => (
                <div key={`c${i}`} className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(pos / data.length) * 100}%`, background: isLight ? '#e6007a' : '#0a84ff', outline: isLight ? '1.5px solid #1d1d1f' : 'none' }} />
              ))}
              <input
                type="range"
                min={0}
                max={data.length - 1}
                value={frame}
                onChange={e => handleScrub(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e6007a 0%, #e6007a ${(frame / (data.length - 1)) * 100}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} ${(frame / (data.length - 1)) * 100}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} 100%)`,
                }}
              />
            </div>

            {/* Playback controls — 56px */}
            <div
              className="rounded-full px-3 md:px-4 flex items-center gap-2 md:gap-4"
              style={{
                height: 56,
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <button onClick={() => setFrame(Math.max(0, frame - 10))} className="text-muted-foreground hover:text-foreground apple-transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="w-9 h-9 rounded-full flex items-center justify-center apple-transition"
                style={{ background: '#e6007a' }}
              >
                {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" className="ml-0.5" />}
              </button>
              <button onClick={() => setFrame(Math.min(data.length - 1, frame + 10))} className="text-muted-foreground hover:text-foreground apple-transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">
                <SkipForward size={16} />
              </button>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-0.5">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 md:px-2 py-0.5 rounded-full text-[11px] md:text-[10px] font-medium apple-transition min-h-[44px] md:min-h-0 flex items-center ${speed === s ? 'surface-2 text-foreground inner-glow' : 'text-muted-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Share button full width */}
          {isMobile && (
            <button
              onClick={() => setShowShare(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#e6007a', color: '#fff' }}
            >
              <Share2 size={16} /> Share This Replay
            </button>
          )}

          {/* Mobile: Inspector panel below controls */}
          {isMobile && (
            <div className="mt-4 p-4 rounded-2xl" style={{
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {inspectorPanel}
            </div>
          )}
        </div>

        {/* Right Panel — Desktop only */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-80 p-6 overflow-y-auto"
            style={{
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: '2px solid #e6007a',
              boxShadow: isLight ? '-4px 0 24px rgba(0,0,0,0.06)' : '-4px 0 24px rgba(0,0,0,0.3)',
            }}
          >
            {inspectorPanel}
          </motion.div>
        )}
      </div>

      <ShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />
      <ShareModal
        open={showShare}
        onOpenChange={setShowShare}
        asset={selectedAsset}
        frame={frame}
        frameData={current}
        recentPrices={data.slice(Math.max(0, frame - 59), frame + 1).map(d => d.price)}
        allFrames={data}
        eventName={
          eventPositions.some(p => Math.abs(frame - p) < 15)
            ? ['Flash Crash', 'Spread Spike', 'Recovery', 'Confidence Drop'][eventPositions.findIndex(p => Math.abs(frame - p) < 15)] + ` — Frame ${frame}`
            : undefined
        }
      />
    </div>
  );
}
