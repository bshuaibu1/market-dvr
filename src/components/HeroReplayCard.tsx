import { useEffect, useRef, useState } from 'react';
import { Pause } from 'lucide-react';

// Generate a BTC flash crash: sharp drop over ~30% of frames, then partial recovery
function generateFlashCrashData(length: number): number[] {
  const data: number[] = [];
  const startPrice = 84200;
  const crashBottom = 78500;
  const recoveryTop = 82100;
  const crashEnd = Math.floor(length * 0.2);
  const recoveryEnd = Math.floor(length * 0.85);

  for (let i = 0; i < length; i++) {
    let price: number;
    if (i <= crashEnd) {
      // Sharp crash
      const t = i / crashEnd;
      const ease = t * t; // accelerating drop
      price = startPrice - (startPrice - crashBottom) * ease;
    } else if (i <= recoveryEnd) {
      // Gradual recovery
      const t = (i - crashEnd) / (recoveryEnd - crashEnd);
      const ease = 1 - (1 - t) * (1 - t); // decelerating recovery
      price = crashBottom + (recoveryTop - crashBottom) * ease;
    } else {
      price = recoveryTop + (Math.random() - 0.5) * 100;
    }
    // Add small noise
    price += (Math.random() - 0.5) * 80;
    data.push(price);
  }
  return data;
}

const TOTAL_FRAMES = 300;
const flashCrashData = generateFlashCrashData(TOTAL_FRAMES);

export default function HeroReplayCard() {
  const [frame, setFrame] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    animRef.current = setInterval(() => {
      setFrame(f => (f + 1) % TOTAL_FRAMES);
    }, 50); // 15s loop at 50ms per frame = 300 frames
    return () => clearInterval(animRef.current);
  }, []);

  const chartW = 560;
  const chartH = 180;
  const prices = flashCrashData;
  const minP = Math.min(...prices) - 200;
  const maxP = Math.max(...prices) + 200;
  const rangeP = maxP - minP;
  const toX = (i: number) => (i / (TOTAL_FRAMES - 1)) * chartW;
  const toY = (v: number) => chartH - ((v - minP) / rangeP) * chartH;

  // Build path up to current frame
  const visiblePrices = prices.slice(0, frame + 1);
  const linePath = visiblePrices.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(p)}`).join(' ');
  const fillPath = linePath + ` L${toX(frame)},${chartH} L0,${chartH} Z`;

  const currentPrice = prices[frame];
  const scrubberPct = (frame / (TOTAL_FRAMES - 1)) * 100;

  return (
    <div className="w-full max-w-[620px]">
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 0 40px rgba(230,0,122,0.12), 0 0 80px rgba(230,0,122,0.05)',
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
            BTC/USD Flash Crash · Mar 4 2026 · 14:32:07 UTC
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-negative pulse-red" />
            <span className="text-[10px] font-medium text-negative tracking-wide uppercase">REC was LIVE</span>
          </div>
        </div>

        {/* Chart */}
        <div className="px-4 py-2">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 180 }} preserveAspectRatio="none">
            {/* Grid */}
            {[0, 1, 2, 3].map(i => (
              <line key={i} x1="0" y1={i * chartH / 3} x2={chartW} y2={i * chartH / 3} stroke="rgba(255,255,255,0.03)" />
            ))}
            {/* Gradient fill */}
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e6007a" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#e6007a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={fillPath} fill="url(#heroGrad)" />
            <path d={linePath} fill="none" stroke="#f5f5f7" strokeWidth="1.5" />
            {/* Cursor dot */}
            <circle cx={toX(frame)} cy={toY(currentPrice)} r="3" fill="#e6007a" />
            <circle cx={toX(frame)} cy={toY(currentPrice)} r="6" fill="none" stroke="#e6007a" strokeWidth="0.8" opacity="0.4" />
          </svg>
        </div>

        {/* Mock DVR controls */}
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <Pause size={10} className="text-foreground" />
          </div>
          <div className="flex-1 h-1 rounded-full relative" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${scrubberPct}%`, background: '#e6007a' }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-foreground" style={{ left: `${scrubberPct}%`, transform: `translate(-50%, -50%)` }} />
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground font-medium">1x</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-3 tracking-wide">
        Real sub-second tick data · Powered by Pyth Pro
      </p>
    </div>
  );
}
