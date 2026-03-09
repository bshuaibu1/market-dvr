import { useMemo } from 'react';
import { AssetWithClass } from '@/lib/mockData';

interface Props {
  assets: AssetWithClass[];
}

const stressSegments = ['CALM', 'LOW', 'MODERATE', 'HIGH', 'EXTREME'] as const;

export default function MarketBottomBar({ assets }: Props) {
  const mostVolatile = useMemo(() => [...assets].sort((a, b) => a.confidence - b.confidence)[0], [assets]);
  const mostStable = useMemo(() => [...assets].sort((a, b) => b.confidence - a.confidence)[0], [assets]);

  const avgConf = useMemo(() => assets.reduce((s, a) => s + a.confidence, 0) / assets.length, [assets]);
  const activeSegment = useMemo(() => {
    if (avgConf > 0.95) return 0;
    if (avgConf > 0.9) return 1;
    if (avgConf > 0.82) return 2;
    if (avgConf > 0.75) return 3;
    return 4;
  }, [avgConf]);

  const segmentColors = ['#32d74b', '#32d74b', '#ff9f0a', '#ff453a', '#ff1744'];

  return (
    <div
      className="w-full flex items-center justify-between px-4 md:px-6 py-3 flex-wrap gap-y-2"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left: most volatile */}
      <div className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>MOST VOLATILE</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span style={{ color: '#ff453a', fontWeight: 500 }} className="tabular-nums">{mostVolatile.symbol}</span>
        <span style={{ color: '#ff453a' }} className="tabular-nums">
          {mostVolatile.change >= 0 ? '+' : ''}{mostVolatile.change.toFixed(2)}%
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }} className="tabular-nums">
          {(mostVolatile.confidence * 100).toFixed(1)}% conf
        </span>
      </div>

      {/* Center: stress gauge */}
      <div className="flex items-center gap-2 max-md:hidden">
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>MARKET STRESS INDEX</span>
        <div className="flex gap-0.5">
          {stressSegments.map((seg, i) => (
            <div
              key={seg}
              className="flex items-center justify-center rounded-sm px-1.5 py-0.5"
              style={{
                fontSize: 8,
                letterSpacing: '0.08em',
                background: i === activeSegment ? segmentColors[i] + '22' : 'rgba(255,255,255,0.03)',
                color: i === activeSegment ? segmentColors[i] : 'rgba(255,255,255,0.2)',
                border: i === activeSegment ? `1px solid ${segmentColors[i]}44` : '1px solid transparent',
                fontWeight: i === activeSegment ? 600 : 400,
              }}
            >
              {seg}
            </div>
          ))}
        </div>
      </div>

      {/* Right: most stable */}
      <div className="flex items-center gap-1.5" style={{ fontSize: 11 }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>MOST STABLE</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span style={{ color: '#32d74b', fontWeight: 500 }} className="tabular-nums">{mostStable.symbol}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }} className="tabular-nums">
          {(mostStable.confidence * 100).toFixed(1)}% conf
        </span>
      </div>
    </div>
  );
}
