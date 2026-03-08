import { useMemo } from 'react';

interface Props {
  value: number; // 0-100
}

export default function StressGauge({ value }: Props) {
  const color = useMemo(() => {
    if (value < 40) return '#32d74b';
    if (value < 70) return '#ff9f0a';
    return '#ff453a';
  }, [value]);

  const label = useMemo(() => {
    if (value < 40) return 'LOW';
    if (value < 70) return 'MODERATE';
    return 'HIGH';
  }, [value]);

  // SVG arc from -90deg to +90deg (semicircle)
  const radius = 50;
  const cx = 60;
  const cy = 55;
  const startAngle = -180;
  const endAngle = 0;
  const sweep = (value / 100) * (endAngle - startAngle);
  const currentAngle = startAngle + sweep;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const startX = cx + radius * Math.cos(toRad(startAngle));
  const startY = cy + radius * Math.sin(toRad(startAngle));
  const endX = cx + radius * Math.cos(toRad(currentAngle));
  const endY = cy + radius * Math.sin(toRad(currentAngle));
  const largeArc = sweep > 180 ? 1 : 0;

  const bgEndX = cx + radius * Math.cos(toRad(endAngle));
  const bgEndY = cy + radius * Math.sin(toRad(endAngle));

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${bgEndX} ${bgEndY}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Value arc */}
        {value > 0 && (
          <path
            d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            style={{ transition: 'all 0.6s ease' }}
          />
        )}
      </svg>
      <div className="flex items-center gap-1.5 -mt-2">
        <span style={{ color, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}>{label}</span>
        <span className="tabular-nums" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>· {Math.round(value)}</span>
      </div>
    </div>
  );
}
