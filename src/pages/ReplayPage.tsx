import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import { generateReplayData, formatPrice, allAssetsList } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Share2, Keyboard, GitCompareArrows, Zap } from 'lucide-react';
import ShortcutsModal from '@/components/ShortcutsModal';
import ShareModal from '@/components/ShareModal';
import TimeframeChart, { isRawTimeframe, isVolumeTimeframe, getTicksPerCandle, getCandleCount } from '@/components/TimeframeChart';

const timeframes = ['50ms', '200ms', '1s', '5s', '30s', '1m', '5m', '15m', '1h'];
const timeframeLabels: Record<string, string> = {
  '50ms': '50ms', '200ms': '200ms', '1s': '1s', '5s': '5s', '30s': '30s',
  '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h',
};

const speeds = ['0.25x', '0.5x', '1x', '2x', '4x'];
const speedMap: Record<string, number> = { '0.25x': 200, '0.5x': 100, '1x': 50, '2x': 25, '4x': 12 };
const keyToSpeed: Record<string, string> = { '1': '0.25x', '2': '0.5x', '3': '1x', '4': '2x', '5': '4x' };

export default function ReplayPage() {
  const [selectedAsset, setSelectedAsset] = useState('BTC/USD');
  const [compareMode, setCompareMode] = useState(false);
  const [compareAsset, setCompareAsset] = useState('ETH/USD');

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

  // Keyboard shortcuts
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

  // Compare mode: normalize to % change
  const useCompare = compareMode && compareData.length > 0;
  const compareCurrent = useCompare ? compareData[frame] : null;

  // Chart rendering
  const chartWidth = 800;
  const chartHeight = 300;

  // For compare mode we normalize both to % change
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

  // Spread chart (only in single mode)
  const spreads = data.map(d => d.spread);
  const maxSpread = Math.max(...spreads);
  const spreadLine = data.map((d, i) => `${toX(i)},${60 - (d.spread / maxSpread) * 55}`).join(' ');
  const spreadFillPoly = `0,60 ${spreadLine} ${chartWidth},60`;

  const eventPositions = [140, 165, 300, 350];

  const pct1 = ((current.price - startPrice1) / startPrice1 * 100).toFixed(2);
  const pct2 = compareCurrent ? ((compareCurrent.price - startPrice2) / startPrice2 * 100).toFixed(2) : '0';

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        {/* Main chart area */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <select
                value={selectedAsset}
                onChange={e => { setSelectedAsset(e.target.value); setFrame(250); setPlaying(false); }}
                className="h-9 rounded-xl bg-background text-foreground text-sm px-3 font-medium focus:outline-none"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {allAssetsList.map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                ))}
              </select>
              <span className="label-caps">Replay</span>

              {/* Compare toggle */}
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium apple-transition ${compareMode ? 'text-foreground' : 'text-muted-foreground'}`}
                style={{
                  background: compareMode ? 'rgba(10,132,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: compareMode ? '1px solid #0a84ff' : '1px solid rgba(255,255,255,0.08)',
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
                    className="h-9 rounded-xl bg-background text-foreground text-sm px-3 focus:outline-none"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {allAssetsList.filter(a => a.symbol !== selectedAsset).map(a => (
                      <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                    ))}
                  </select>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl surface-1 text-xs font-medium text-muted-foreground apple-transition hover:text-foreground"
              >
                <Keyboard size={14} /> Shortcuts
              </button>
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl surface-1 text-xs font-medium text-foreground apple-transition hover:border-[rgba(255,255,255,0.15)]"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Toggle pills / Legend */}
          {useCompare ? (
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: '#f5f5f7' }} />
                <span className="text-xs text-foreground font-medium">{selectedAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct1) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct1) >= 0 ? '+' : ''}{pct1}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: '#0a84ff' }} />
                <span className="text-xs font-medium" style={{ color: '#0a84ff' }}>{compareAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct2) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct2) >= 0 ? '+' : ''}{pct2}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 mb-4 p-1 rounded-full surface-1 w-fit">
              {[
                { label: 'Bid', active: showBid, toggle: () => setShowBid(!showBid), color: '#0a84ff' },
                { label: 'Ask', active: showAsk, toggle: () => setShowAsk(!showAsk), color: '#ff453a' },
                { label: 'Confidence', active: showConfidence, toggle: () => setShowConfidence(!showConfidence), color: '#e6007a' },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className={`px-3 py-1 rounded-full text-xs font-medium apple-transition ${t.active ? 'surface-2 inner-glow text-foreground' : 'text-muted-foreground'}`}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ background: t.active ? t.color : 'rgba(255,255,255,0.2)' }} />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 min-h-0 relative">
            <div className="absolute top-3 left-4 z-10">
              <span className="text-2xl tabular-nums text-foreground font-medium">${formatPrice(current.price)}</span>
            </div>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
              {[0,1,2,3,4].map(i => (
                <line key={i} x1="0" y1={i * chartHeight / 4} x2={chartWidth} y2={i * chartHeight / 4} stroke="rgba(255,255,255,0.03)" />
              ))}
              {!useCompare && showConfidence && confFill && <polygon points={confFill} fill="rgba(230,0,122,0.06)" />}
              {!useCompare && showBid && bidLine && <polyline points={bidLine} fill="none" stroke="#0a84ff" strokeWidth="1" opacity="0.6" />}
              {!useCompare && showAsk && askLine && <polyline points={askLine} fill="none" stroke="#ff453a" strokeWidth="1" opacity="0.6" />}
              <polyline points={priceLine} fill="none" stroke="#f5f5f7" strokeWidth="2" />
              {useCompare && compareLine && <polyline points={compareLine} fill="none" stroke="#0a84ff" strokeWidth="2" />}
              <line x1={toX(frame)} y1="0" x2={toX(frame)} y2={chartHeight} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx={toX(frame)} cy={useCompare ? toY(((current.price - startPrice1) / startPrice1) * 100) : toY(current.price)} r="4" fill="#f5f5f7" />
              {useCompare && compareCurrent && (
                <circle cx={toX(frame)} cy={toY(((compareCurrent.price - startPrice2) / startPrice2) * 100)} r="4" fill="#0a84ff" />
              )}
            </svg>
          </div>

          {/* Spread panel (single mode only) */}
          {!useCompare && (
            <div className="mt-4 h-16">
              <div className="flex items-center gap-3 mb-2">
                <span className="label-caps">Spread Width</span>
                <span className="text-sm tabular-nums text-foreground font-medium">${current.spread.toFixed(2)}</span>
              </div>
              <svg viewBox={`0 0 ${chartWidth} 60`} className="w-full h-full" preserveAspectRatio="none">
                <polygon points={spreadFillPoly} fill="rgba(230,0,122,0.1)" />
                <polyline points={spreadLine} fill="none" stroke="#e6007a" strokeWidth="1.5" />
                <line x1={toX(frame)} y1="0" x2={toX(frame)} y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
              </svg>
            </div>
          )}

          {/* Playback controls */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-full relative h-6 flex items-center">
              {eventPositions.map((pos, i) => (
                <div key={i} className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(pos / data.length) * 100}%`, background: '#e6007a' }} />
              ))}
              {useCompare && [120, 280, 380].map((pos, i) => (
                <div key={`c${i}`} className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(pos / data.length) * 100}%`, background: '#0a84ff' }} />
              ))}
              <input
                type="range"
                min={0}
                max={data.length - 1}
                value={frame}
                onChange={e => setFrame(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e6007a 0%, #e6007a ${(frame / (data.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(frame / (data.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`,
                }}
              />
            </div>

            <div className="frosted-glass rounded-full px-4 py-2 flex items-center gap-4">
              <button onClick={() => setFrame(Math.max(0, frame - 10))} className="text-muted-foreground hover:text-foreground apple-transition">
                <SkipBack size={16} />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="w-9 h-9 rounded-full flex items-center justify-center apple-transition"
                style={{ background: '#e6007a' }}
              >
                {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" className="ml-0.5" />}
              </button>
              <button onClick={() => setFrame(Math.min(data.length - 1, frame + 10))} className="text-muted-foreground hover:text-foreground apple-transition">
                <SkipForward size={16} />
              </button>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-0.5">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium apple-transition ${speed === s ? 'surface-2 text-foreground inner-glow' : 'text-muted-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Frame Inspector */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full lg:w-80 frosted-glass border-l border-border p-6 overflow-y-auto"
          style={{ borderLeft: '2px solid #e6007a' }}
        >
          <h2 className="label-caps mb-6">Frame Inspector</h2>

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
            <div className="space-y-4">
              {[
                { label: 'PRICE', value: `$${formatPrice(current.price)}`, change: priceChange },
                { label: 'BID', value: `$${formatPrice(current.bid)}` },
                { label: 'ASK', value: `$${formatPrice(current.ask)}` },
                { label: 'SPREAD', value: `$${current.spread.toFixed(2)}` },
                { label: 'CONFIDENCE', value: `${(current.confidence * 100).toFixed(1)}%` },
                { label: 'FRAME', value: `${frame} / ${data.length}` },
              ].map(row => (
                <div key={row.label}>
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
        </motion.div>
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
    </div>
  );
}
