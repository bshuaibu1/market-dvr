import { useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { AssetWithClass } from '@/lib/mockData';

interface CorrelationPulseProps {
  assets?: AssetWithClass[];
}

const targetPairs = [
  { a: 'BTC/USD', b: 'ETH/USD', labelA: 'BTC', labelB: 'ETH' },
  { a: 'BTC/USD', b: 'SOL/USD', labelA: 'BTC', labelB: 'SOL' },
  { a: 'ETH/USD', b: 'SOL/USD', labelA: 'ETH', labelB: 'SOL' },
  { a: 'BTC/USD', b: 'XAU/USD', labelA: 'BTC', labelB: 'XAU' },
  { a: 'SOL/USD', b: 'BNB/USD', labelA: 'SOL', labelB: 'BNB' },
];

function pearsonCorrelation(x: number[], y: number[]) {
  let arrX = x;
  let arrY = y;
  if (arrX.length !== arrY.length) {
    const minLen = Math.min(arrX.length, arrY.length);
    arrX = arrX.slice(-minLen);
    arrY = arrY.slice(-minLen);
  }
  if (arrX.length < 5) return 0;

  const n = arrX.length;
  const sumX = arrX.reduce((a, b) => a + b, 0);
  const sumY = arrY.reduce((a, b) => a + b, 0);
  const sumXY = arrX.reduce((sum, xi, i) => sum + xi * arrY[i], 0);
  const sumX2 = arrX.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = arrY.reduce((sum, yi) => sum + yi * yi, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return num / den;
}

export default function CorrelationPulse({ assets = [] }: CorrelationPulseProps) {
  const { theme } = useTheme();
  const light = theme === 'light';

  const values = useMemo(() => {
    return targetPairs.map(p => {
      const assetA = assets.find(a => a.symbol === p.a);
      const assetB = assets.find(a => a.symbol === p.b);
      if (!assetA || !assetB) return 0;
      return pearsonCorrelation(assetA.sparkline, assetB.sparkline);
    });
  }, [assets]);

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
      {targetPairs.map((pair, i) => {
        const val = values[i];
        const color = val > 0.5 ? positiveBar : val > 0 ? neutralBar : negativeBar;
        const barWidth = Math.abs(val) * 100;
        return (
          <div
            key={`${pair.a}-${pair.b}`}
            className="flex items-center gap-2 py-2"
            style={{ borderBottom: i < targetPairs.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
          >
            <span style={{ fontSize: 11, color: pairColor, width: 100 }}>
              {pair.labelA} ↔ {pair.labelB}
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
