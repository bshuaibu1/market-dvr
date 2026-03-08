interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  positive?: boolean;
}

export default function SparklineChart({ data, width = 120, height = 40, positive = true }: Props) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;
  const strokeColor = positive ? '#32d74b' : '#ff453a';
  const fillColor = positive ? 'rgba(50,215,75,0.08)' : 'rgba(255,69,58,0.08)';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polygon points={fillPoints} fill={fillColor} />
      <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
