import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { generateReplayData, formatPrice } from '@/lib/mockData';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Share2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

const speeds = ['0.25x', '0.5x', '1x', '2x', '4x'];

export default function ReplayPage() {
  const data = useMemo(() => generateReplayData(500), []);
  const [frame, setFrame] = useState(250);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [showBid, setShowBid] = useState(true);
  const [showAsk, setShowAsk] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  const playRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (playing) {
      const ms = { '0.25x': 200, '0.5x': 100, '1x': 50, '2x': 25, '4x': 12 }[speed] || 50;
      playRef.current = setInterval(() => {
        setFrame(f => {
          if (f >= data.length - 1) { setPlaying(false); return f; }
          return f + 1;
        });
      }, ms);
    }
    return () => clearInterval(playRef.current);
  }, [playing, speed, data.length]);

  const current = data[frame];
  const prev = data[Math.max(0, frame - 1)];
  const priceChange = current.price - prev.price;

  // Chart rendering
  const chartWidth = 800;
  const chartHeight = 300;
  const prices = data.map(d => d.price);
  const minP = Math.min(...prices) - 50;
  const maxP = Math.max(...prices) + 50;
  const rangeP = maxP - minP;

  const chartPadLeft = 20;
  const toX = (i: number) => chartPadLeft + (i / (data.length - 1)) * (chartWidth - chartPadLeft);
  const toY = (v: number) => chartHeight - ((v - minP) / rangeP) * chartHeight;

  const priceLine = data.map((d, i) => `${toX(i)},${toY(d.price)}`).join(' ');
  const bidLine = data.map((d, i) => `${toX(i)},${toY(d.bid)}`).join(' ');
  const askLine = data.map((d, i) => `${toX(i)},${toY(d.ask)}`).join(' ');

  const confFill = data.map((d, i) => `${toX(i)},${toY(d.price + (1 - d.confidence) * 100)}`).join(' ')
    + ' ' + [...data].reverse().map((d, i) => `${toX(data.length - 1 - i)},${toY(d.price - (1 - d.confidence) * 100)}`).join(' ');

  // Spread chart
  const spreads = data.map(d => d.spread);
  const maxSpread = Math.max(...spreads);
  const spreadLine = data.map((d, i) => `${toX(i)},${60 - (d.spread / maxSpread) * 55}`).join(' ');
  const spreadFill = `0,60 ${spreadLine} ${chartWidth},60`;

  // Event markers on timeline
  const eventPositions = [140, 165, 300, 350];

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />

      <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
        {/* Main chart area */}
        <div className="flex-1 flex flex-col p-6 min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-light text-foreground tracking-tight">BTC/USD</h1>
              <span className="label-caps">Replay</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl surface-1 text-xs font-medium text-foreground apple-transition hover:border-[rgba(255,255,255,0.15)]">
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Toggle pills */}
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

          {/* Chart */}
          <div className="flex-1 min-h-0 relative">
            {/* Floating price label */}
            <div className="absolute top-3 left-4 z-10">
              <span className="text-2xl tabular-nums text-foreground font-medium">${formatPrice(current.price)}</span>
            </div>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
              {/* Grid */}
              {[0,1,2,3,4].map(i => (
                <line key={i} x1="0" y1={i * chartHeight / 4} x2={chartWidth} y2={i * chartHeight / 4} stroke="rgba(255,255,255,0.03)" />
              ))}
              {/* Confidence band */}
              {showConfidence && <polygon points={confFill} fill="rgba(230,0,122,0.06)" />}
              {/* Bid */}
              {showBid && <polyline points={bidLine} fill="none" stroke="#0a84ff" strokeWidth="1" opacity="0.6" />}
              {/* Ask */}
              {showAsk && <polyline points={askLine} fill="none" stroke="#ff453a" strokeWidth="1" opacity="0.6" />}
              {/* Price */}
              <polyline points={priceLine} fill="none" stroke="#f5f5f7" strokeWidth="2" />
              {/* Playhead */}
              <line x1={toX(frame)} y1="0" x2={toX(frame)} y2={chartHeight} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx={toX(frame)} cy={toY(current.price)} r="4" fill="#f5f5f7" />
            </svg>
          </div>

          {/* Spread panel */}
          <div className="mt-4 h-16">
            <div className="flex items-center gap-3 mb-2">
              <span className="label-caps">Spread Width</span>
              <span className="text-sm tabular-nums text-foreground font-medium">${current.spread.toFixed(2)}</span>
            </div>
            <svg viewBox={`0 0 ${chartWidth} 60`} className="w-full h-full" preserveAspectRatio="none">
              <polygon points={spreadFill} fill="rgba(230,0,122,0.1)" />
              <polyline points={spreadLine} fill="none" stroke="#e6007a" strokeWidth="1.5" />
              <line x1={toX(frame)} y1="0" x2={toX(frame)} y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3,3" />
            </svg>
          </div>

          {/* Playback controls */}
          <div className="mt-6 flex flex-col items-center gap-3">
            {/* Timeline scrubber */}
            <div className="w-full relative h-6 flex items-center">
              {/* Event markers */}
              {eventPositions.map((pos, i) => (
                <div key={i} className="absolute -top-1 w-2 h-2 rotate-45" style={{ left: `${(pos / data.length) * 100}%`, background: '#e6007a' }} />
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

            {/* Controls pill */}
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
    </div>
  );
}
