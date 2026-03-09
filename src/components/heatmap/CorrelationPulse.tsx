import { useState, useEffect } from 'react';
import { useTheme } from '@/components/ThemeProvider';

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
  const { theme } = useTheme();
  const light = theme === 'light';
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

  const labelColor = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)';
  const subColor = light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
  const pairColor = light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
  const dividerColor = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const trackBg = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const positiveBar = light ? '#1a8f35' : '#32d74b';
  const negativeBar = light ? '#cc2200' : '#ff453a';
  const neutralBar = light ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1.5 mb-3">
        <span style={{ fontSize: 10, letterSpacing: '0.12em', color: labelColor, textTransform: 'uppercase' as const, fontWeight: 500 }}>
          LIVE CORRELATIONS
        </span>
        <span style={{ fontSize: 10, color: subColor }}>· 5s</span>
      </div>
      {pairs.map((pair, i) => {
        const val = values[i];
        const color = val > 0.5 ? positiveBar : val > 0 ? neutralBar : negativeBar;
        const barWidth = Math.abs(val) * 100;
        return (
          <div
            key={`${pair.a}-${pair.b}`}
            className="flex items-center gap-2 py-2"
            style={{ borderBottom: i < pairs.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
          >
            <span style={{ fontSize: 11, color: pairColor, width: 100 }}>
              {pair.a} ↔ {pair.b}
            </span>
            <div className="flex-1 h-1 rounded-full" style={{ background: trackBg }}>
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
