import { useState, useEffect } from 'react';

interface CorrelationPair {
  a: string;
  b: string;
  base: number;
}

const pairs: CorrelationPair[] = [
  { a: 'BTC', b: 'ETH', base: 0.86 },
  { a: 'BTC', b: 'GOLD', base: 0.12 },
  { a: 'OIL', b: 'NATGAS', base: 0.71 },
];

export default function CorrelationPulse() {
  const [values, setValues] = useState(pairs.map(p => p.base));

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(pairs.map(p => {
        const jitter = (Math.random() - 0.5) * 0.06;
        return Math.min(1, Math.max(-1, p.base + jitter));
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' as const, fontWeight: 500 }}>
          LIVE CORRELATIONS
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>· 5s</span>
      </div>
      {pairs.map((pair, i) => {
        const val = values[i];
        const color = val > 0.5 ? '#32d74b' : val > 0 ? 'rgba(255,255,255,0.4)' : '#ff453a';
        const barWidth = Math.abs(val) * 100;
        return (
          <div
            key={`${pair.a}-${pair.b}`}
            className="flex items-center gap-2 py-2"
            style={{ borderBottom: i < pairs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', width: 100 }}>
              {pair.a} ↔ {pair.b}
            </span>
            <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${barWidth}%`, background: color, transition: 'all 0.6s ease' }}
              />
            </div>
            <span className="tabular-nums" style={{ fontSize: 11, color, width: 40, textAlign: 'right' }}>
              {val >= 0 ? '+' : ''}{val.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
