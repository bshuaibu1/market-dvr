import { useMemo } from 'react';
import { useTheme } from '@/components/ThemeProvider';

interface Props {
  value: number; // 0-100
}

export default function StressGauge({ value }: Props) {
  const { theme } = useTheme();
  const light = theme === 'light';

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

  const trackColor = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const numberColor = light ? '#1d1d1f' : '#fff';

  // Semicircle: 180 degrees, opening downward like a speedometer
  const radius = 46;
  const cx = 60;
  const cy = 52;
  const strokeW = 8;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Arc from 180° to 0° (left to right, top semicircle)
  const startAngle = 180;
  const endAngle = 0;
  const sweep = (value / 100) * (startAngle - endAngle);
  const currentAngle = startAngle - sweep;

  const arcPoint = (angle: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy - radius * Math.sin(toRad(angle)),
  });

  const bgStart = arcPoint(startAngle);
  const bgEnd = arcPoint(endAngle);
  const valEnd = arcPoint(currentAngle);
  const largeArc = sweep > 180 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="72" viewBox="0 0 120 72">
        {/* Full semicircle track */}
        <path
          d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Filled portion */}
        {value > 0 && (
          <path
            d={`M ${bgStart.x} ${bgStart.y} A ${radius} ${radius} 0 ${largeArc} 1 ${valEnd.x} ${valEnd.y}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            style={{ transition: 'all 0.6s ease' }}
          />
        )}
        {/* Center number */}
        <text x={cx} y={cy - 2} textAnchor="middle" fill={numberColor} fontSize="24" fontWeight="300" fontFamily="Inter, -apple-system, sans-serif" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(value)}
        </text>
        {/* Label below number */}
        <text x={cx} y={cy + 14} textAnchor="middle" fill={color} fontSize="11" fontWeight="500" letterSpacing="0.08em" fontFamily="Inter, -apple-system, sans-serif">
          {label}
        </text>
      </svg>
    </div>
  );
}
