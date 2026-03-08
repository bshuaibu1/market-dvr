import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MobileBottomNav from '@/components/MobileBottomNav';
import { generateReplayData, formatPrice, allAssetsList } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Share2, Keyboard, GitCompareArrows } from 'lucide-react';
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

export default function ReplayPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useIsMobile();
  const [selectedAsset, setSelectedAsset] = useState('BTC/USD');
  const [compareMode, setCompareMode] = useState(false);
  const [compareAsset, setCompareAsset] = useState('ETH/USD');
  const [inspectorTab, setInspectorTab] = useState<'inspector' | 'autopsy'>('inspector');

  const assetInfo = allAssetsList.find(a => a.symbol === selectedAsset);
  const compareInfo = allAssetsList.find(a => a.symbol === compareAsset);

  const data = useMemo(() => generateReplayData(500, assetInfo?.price || 83421.50), [selectedAsset]);
  const compareData = useMemo(() => compareMode ? generateReplayData(500, compareInfo?.price || 3287.80) : [], [compareMode, compareAsset]);

  const [frame, setFrame] = useState(250);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [showBid, setShowBid] = useState(true);
  const [showAsk, setShowAsk] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [timeframe, setTimeframe] = useState('1s');

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

  const current = data[frame];
  const prev = data[Math.max(0, frame - 1)];
  const priceChange = current.price - prev.price;

  const useCompare = compareMode && compareData.length > 0;
  const compareCurrent = useCompare ? compareData[frame] : null;

  const chartWidth = 800;
  const chartHeight = isMobile ? 160 : 300;

  const startPrice1 = data[0].price;
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
    minP = Math.min(...prices) - 50;
    maxP = Math.max(...prices) + 50;
    rangeP = maxP - minP;
    toY = (v: number) => chartHeight - ((v - minP) / rangeP) * chartHeight;
  }

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
  const spreadChartH = isMobile ? 36 : 60;
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

  const pct1 = ((current.price - startPrice1) / startPrice1 * 100).toFixed(2);
  const pct2 = compareCurrent ? ((compareCurrent.price - startPrice2) / startPrice2 * 100).toFixed(2) : '0';

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
                  { label: 'CONF', value: `${(current.confidence * 100).toFixed(1)}%` },
                ].map(row => (
                  <div key={row.label} className="mb-2">
                    <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{row.label}</div>
                    <div className="text-[13px] tabular-nums text-foreground font-medium">{row.value}</div>
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
                  { label: 'CONF', value: `${(compareCurrent.confidence * 100).toFixed(1)}%` },
                ].map(row => (
                  <div key={row.label} className="mb-2">
                    <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{row.label}</div>
                    <div className="text-[13px] tabular-nums text-foreground font-medium">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {[
                { label: 'PRICE', value: `$${formatPrice(current.price)}`, change: priceChange },
                { label: 'BID', value: `$${formatPrice(current.bid)}` },
                { label: 'ASK', value: `$${formatPrice(current.ask)}` },
                { label: 'SPREAD', value: `$${current.spread.toFixed(2)}` },
                { label: 'CONFIDENCE', value: `${(current.confidence * 100).toFixed(1)}%` },
                { label: 'FRAME', value: `${frame} / ${data.length}` },
                { label: 'RESOLUTION', value: timeframe },
              ].map(row => (
                <div
                  key={row.label}
                  className="rounded-lg px-2 py-2 -mx-2"
                  style={{ transition: 'all 0.15s ease', willChange: 'transform, box-shadow' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = isLight ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.3)';
                    e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-0.5">{row.label}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] tabular-nums text-foreground font-medium">{row.value}</span>
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
              {['Flash Crash', 'Spread Spike', 'Recovery', 'Confidence Drop'].map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full surface-1 text-[11px] text-muted-foreground font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="label-caps mb-3">AI Markers</h3>
            <div className="space-y-2">
              {[
                { color: '#f97316', label: 'Max Spread', frame: maxSpreadIdx },
                { color: '#9333ea', label: 'Max Confidence Expansion', frame: minConfIdx },
                { color: isLight ? '#1d1d1f' : '#f5f5f7', label: 'Peak Volatility', frame: peakVolIdx },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => setFrame(m.frame)}
                  className="flex items-center gap-2 w-full text-left apple-transition hover:opacity-80 min-h-[44px] md:min-h-0"
                >
                  <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground ml-auto">#{m.frame}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <MarketAutopsy />
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pt-14 h-auto lg:h-[calc(100vh-56px)]">
        {/* Main chart area */}
        <div className="flex-1 flex flex-col p-4 md:p-6 min-w-0">
          {/*  max-md:gap-1Top  max-md:gap-1bar  max-md:gap-1*/}
 max-md:gap-1          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
2 md2 md2 md:mb-:mb-:mb-            <select
              value={selectedAsset}
              onChange={e => { setSelectedAsset(e.target.value); setFrame(250); setPlaying(false); }}
              className="h-11 md:h-9 rounded-xl bg-background text-foreground text-sm px-3 font-medium focus:outline-none min-w-[120px]"
              style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}
            >
              {allAssetsList.map(a => (
                <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
              ))}
            </select>
            <span className="label-caps">Replay</span>

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
                  {allAssetsList.filter(a => a.symbol !== selectedAsset).map(a => (
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
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl surface-1 text-xs font-medium text-foreground apple-transition hover:border-[rgba(255,255,255,0.15)] min-h-[44px] md:min-h-0"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Toggle pills / Legend */}
          {useCompare ? (
            <div className="flex items-center gap-4 mb-4">
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
            <div className="flex items-center g1 md:mb-ap-11 md:mb- mb-4 p-1 rounded-full surface-1 w-fit">
              {[
                { label: 'Bid', active: showBid, toggle: () => setShowBid(!showBid), color: '#0a84ff' },
                { label: 'Ask', active: showAsk, toggle: () => setShowAsk(!showAsk), color: '#ff453a' },
                { label: 'Confidence', active: showConfidence, toggle: () => setShowConfidence(!showConfidence), color: '#e6007a' },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className={`px-3 py-1 rounded-full text-xs font-medium apple-transition min-h-[44px] md:min-h-0 ${t.active ? 'surface-2 inner-glow text-foreground' : 'text-muted-foreground'}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: t.active ? t.color : (isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)') }} />
                  {t.label}
                </button>
              ))}
            </div>
           )}

          {/* Timeframe selector pills */}
          <div className="flex items-center1gap-1.5 mb-2 md:mb-4">
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
            {isRaw && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex-shrink-0" style={{ color: '#e6007a', background: 'rgba(230,0,122,0.1)', border: '1px solid rgba(230,0,122,0.2)' }}>
                <img src={pythLogo} alt="Pyth" width={14} height={14} className="inline-block" /> Pyth Pro Only
              </span>
            )}
          </div>

          {/* Chart */}
          <div
            className="flex-1 min-h-[200px] lg:min-h-0 relative rounded-xl"
            style={{
              boxShadow: isLight ? 'inset 0 1px 0 rgba(230,0,122,0.12)' : 'inset 0 1px 0 rgba(230,0,122,0.2)',
            }}
          >
            <div className="absolute top-3 left-4 z-10">
              <span className="text-[28px] md:text-2xl tabular-nums text-foreground font-medium">${formatPrice(current.price)}</span>
            </div>
            {!useCompare && timeframe !== '1s' ? (
              <TimeframeChart rawData={data} timeframe={timeframe} frame={frame} chartWidth={chartWidth} chartHeight={chartHeight} isLight={isLight} />
            ) : (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
                {[0,1,2,3,4].map(i => (
                  <line key={i} x1="0" y1={i * chartHeight / 4} x2={chartWidth} y2={i * chartHeight / 4} stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)'} />
                ))}
                {!useCompare && showConfidence && confFill && (
                  <polygon points={confFill} fill={isLight ? 'rgba(230,0,122,0.12)' : 'rgba(230,0,122,0.06)'} stroke={isLight ? '#e6007a' : 'none'} strokeWidth={isLight ? '1.5' : '0'} />
                )}
                {!useCompare && showBid && bidLine && <polyline points={bidLine} fill="none" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={isLight ? '2.5' : '1'} opacity={isLight ? '1' : '0.6'} />}
                {!useCompare && showAsk && askLine && <polyline points={askLine} fill="none" stroke={isLight ? '#cc0000' : '#ff453a'} strokeWidth={isLight ? '2.5' : '1'} opacity={isLight ? '1' : '0.6'} />}
                <polyline points={priceLine} fill="none" stroke={useCompare ? (isLight ? '#0055d4' : '#f5f5f7') : (isLight ? '#1d1d1f' : '#f5f5f7')} strokeWidth={isLight ? '2.5' : '2'} />
                {useCompare && compareLine && <polyline points={compareLine} fill="none" stroke={isLight ? '#e6007a' : '#0a84ff'} strokeWidth={isLight ? '2.5' : '2'} />}
                <line x1={toX(frame)} y1="0" x2={toX(frame)} y2={chartHeight} stroke={isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'} strokeWidth="1" strokeDasharray="4,4" />
                <circle cx={toX(frame)} cy={useCompare ? toY(((current.price - startPrice1) / startPrice1) * 100) : toY(current.price)} r="4" fill={useCompare ? (isLight ? '#0055d4' : '#f5f5f7') : (isLight ? '#1d1d1f' : '#f5f5f7')} />
                {useCompare && compareCurrent && (
                  <circle cx={toX(frame)} cy={toY(((compareCurrent.price - startPrice2) / startPrice2) * 100)} r="4" fill={isLight ? '#e6007a' : '#0a84ff'} />
                )}
              </svg>
            )}
          </div>

          {/* Spread panel */}
          {!useCompare && (
            <div className="mt-4" style={{ height: isMobile ? 56 : 64 }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="label-caps">Spread Width</span>
                <span className="text-sm tabular-nums text-foreground font-medium">${current.spread.toFixed(2)}</span>
              </div>
              <svg viewBox={`0 0 ${chartWidth} ${spreadChartH}`} className="w-full h-full" preserveAspectRatio="none">
                <polygon points={spreadFillPoly} fill={isLight ? 'rgba(230,0,122,0.15)' : 'rgba(230,0,122,0.1)'} />
                <polyline points={spreadLine} fill="none" stroke="#e6007a" strokeWidth={isLight ? '2' : '1.5'} />
                <line x1={toX(frame)} y1="0" x2={toX(frame)} y2={spreadChartH} stroke={isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} strokeWidth="1" strokeDasharray="3,3" />
              </svg>
            </div>
          )}

          {/* Shock Propagation */}
          <ShockPropagation />

          {/* Playback controls */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-full relative h-6 flex items-center">
              {eventPositions.map((pos, i) => (
                <div key={i} className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(pos / data.length) * 100}%`, background: '#e6007a', outline: isLight ? '1.5px solid #1d1d1f' : 'none' }} />
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
                onChange={e => setFrame(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e6007a 0%, #e6007a ${(frame / (data.length - 1)) * 100}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} ${(frame / (data.length - 1)) * 100}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} 100%)`,
                }}
              />
            </div>

            <div
              className="rounded-full px-3 md:px-4 py-2 flex items-center gap-2 md:gap-4"
              style={{
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

          {/* Mobile: Inspector panel below controls */}
          {isMobile && (
            <div className="mt-6 p-4 rounded-2xl" style={{
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
        eventName={
          eventPositions.some(p => Math.abs(frame - p) < 15)
            ? ['Flash Crash', 'Spread Spike', 'Recovery', 'Confidence Drop'][eventPositions.findIndex(p => Math.abs(frame - p) < 15)] + ` — Frame ${frame}`
            : undefined
        }
      />
      <MobileBottomNav />
    </div>
  );
}
