import { useMemo } from 'react';

interface OHLCCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TimeframeChartProps {
  rawData: { time: number; price: number; bid: number; ask: number; spread: number; confidence: number }[];
  timeframe: string;
  frame: number;
  chartWidth: number;
  chartHeight: number;
}

const ticksPerCandle: Record<string, number> = {
  '50ms': 1, '200ms': 1, '1s': 5, '5s': 25, '30s': 50,
  '1m': 100, '5m': 250, '15m': 500, '1h': 500,
};

export function isRawTimeframe(tf: string) { return tf === '50ms' || tf === '200ms'; }
export function isVolumeTimeframe(tf: string) { return ['1m', '5m', '15m', '1h'].includes(tf); }
export function getTicksPerCandle(tf: string) { return ticksPerCandle[tf] || 5; }

export function getCandleCount(rawLength: number, tf: string) {
  const tpc = getTicksPerCandle(tf);
  if (isRawTimeframe(tf)) return rawLength;
  return Math.ceil(rawLength / tpc);
}

export default function TimeframeChart({ rawData, timeframe, frame, chartWidth, chartHeight }: TimeframeChartProps) {
  const tpc = ticksPerCandle[timeframe] || 5;
  const isRaw = isRawTimeframe(timeframe);
  const showVolume = isVolumeTimeframe(timeframe);

  const candles = useMemo(() => {
    if (isRaw) return [];
    const result: OHLCCandle[] = [];
    for (let i = 0; i < rawData.length; i += tpc) {
      const slice = rawData.slice(i, i + tpc);
      if (slice.length === 0) continue;
      result.push({
        open: slice[0].price,
        high: Math.max(...slice.map(s => s.price)),
        low: Math.min(...slice.map(s => s.price)),
        close: slice[slice.length - 1].price,
        volume: Math.floor(Math.random() * 1000 + 100 + Math.sin(i * 0.1) * 500),
      });
    }
    return result;
  }, [rawData, tpc, isRaw]);

  const mainChartHeight = showVolume ? chartHeight * 0.72 : chartHeight;
  const volumeHeight = showVolume ? chartHeight * 0.2 : 0;
  const volumeTop = mainChartHeight + chartHeight * 0.08;

  if (isRaw) {
    const prices = rawData.map(d => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pad = (maxP - minP) * 0.08 || 50;
    const rangeP = (maxP + pad) - (minP - pad);
    const toY = (v: number) => mainChartHeight - ((v - (minP - pad)) / rangeP) * mainChartHeight;
    const toX = (i: number) => 20 + (i / (rawData.length - 1)) * (chartWidth - 20);

    const line = rawData.map((d, i) => `${toX(i)},${toY(d.price)}`).join(' ');
    const clampedFrame = Math.min(frame, rawData.length - 1);
    const frameX = toX(clampedFrame);
    const frameY = toY(rawData[clampedFrame].price);

    // Show label
    const label = timeframe === '50ms' ? 'Raw Ticks · 50ms' : 'Raw Ticks · 200ms';

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
        {[0, 1, 2, 3, 4].map(i => (
          <line key={i} x1="0" y1={i * mainChartHeight / 4} x2={chartWidth} y2={i * mainChartHeight / 4} stroke="rgba(255,255,255,0.03)" />
        ))}
        {/* Label */}
        <text x={chartWidth - 10} y="16" textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="11" fontFamily="Inter, sans-serif">
          {label}
        </text>
        {/* Thin connecting line */}
        <polyline points={line} fill="none" stroke="rgba(245,245,247,0.3)" strokeWidth="0.8" />
        {/* Individual tick dots — sample every Nth for performance */}
        {rawData.filter((_, i) => i % Math.max(1, Math.floor(rawData.length / 200)) === 0).map((d, _, __, idx = rawData.indexOf(d)) => (
          <circle key={idx} cx={toX(rawData.indexOf(d))} cy={toY(d.price)} r="1.8" fill="#f5f5f7" opacity="0.6" />
        ))}
        {/* Frame cursor */}
        <line x1={frameX} y1="0" x2={frameX} y2={chartHeight} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4,4" />
        <circle cx={frameX} cy={frameY} r="5" fill="#e6007a" />
        <circle cx={frameX} cy={frameY} r="8" fill="none" stroke="#e6007a" strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }

  // OHLC candlestick mode
  if (candles.length === 0) return null;

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const rangeP = maxP - minP || 1;
  const padding = rangeP * 0.08;
  const toY = (v: number) => mainChartHeight - ((v - (minP - padding)) / (rangeP + padding * 2)) * mainChartHeight;

  const candleWidth = Math.max(2, Math.min(12, (chartWidth - 40) / candles.length * 0.65));
  const gap = (chartWidth - 40) / candles.length;
  const toX = (i: number) => 20 + i * gap + gap / 2;

  const currentCandleIdx = Math.min(Math.floor(frame / tpc), candles.length - 1);
  const maxVolume = showVolume ? Math.max(...candles.map(c => c.volume)) : 1;

  const tfLabel = showVolume ? `OHLC + Volume · ${timeframe}` : `OHLC · ${timeframe}`;

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1="0" y1={i * mainChartHeight / 4} x2={chartWidth} y2={i * mainChartHeight / 4} stroke="rgba(255,255,255,0.03)" />
      ))}
      {/* Label */}
      <text x={chartWidth - 10} y="16" textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="11" fontFamily="Inter, sans-serif">
        {tfLabel}
      </text>
      {/* Candles */}
      {candles.map((c, i) => {
        const x = toX(i);
        const isUp = c.close >= c.open;
        const color = isUp ? '#32d74b' : '#ff453a';
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBottom = toY(Math.min(c.open, c.close));
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        const isCurrent = i === currentCandleIdx;

        return (
          <g key={i} opacity={isCurrent ? 1 : 0.85}>
            <line x1={x} y1={toY(c.high)} x2={x} y2={toY(c.low)} stroke={color} strokeWidth="1" opacity="0.6" />
            <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} rx="1" />
            {isCurrent && (
              <rect x={x - candleWidth / 2 - 1} y={bodyTop - 1} width={candleWidth + 2} height={bodyHeight + 2} fill="none" stroke="#f5f5f7" strokeWidth="1" rx="2" opacity="0.5" />
            )}
          </g>
        );
      })}
      {/* Volume bars */}
      {showVolume && (
        <>
          <line x1="0" y1={volumeTop} x2={chartWidth} y2={volumeTop} stroke="rgba(255,255,255,0.04)" />
          <text x="4" y={volumeTop + 12} fill="rgba(255,255,255,0.15)" fontSize="9" fontFamily="Inter, sans-serif">VOL</text>
          {candles.map((c, i) => {
            const x = toX(i);
            const barHeight = (c.volume / maxVolume) * volumeHeight;
            const isUp = c.close >= c.open;
            return (
              <rect
                key={`v${i}`}
                x={x - candleWidth / 2}
                y={volumeTop + volumeHeight - barHeight}
                width={candleWidth}
                height={barHeight}
                fill={isUp ? 'rgba(50,215,75,0.15)' : 'rgba(255,69,58,0.15)'}
                rx="1"
              />
            );
          })}
        </>
      )}
      {/* Frame cursor */}
      <line x1={toX(currentCandleIdx)} y1="0" x2={toX(currentCandleIdx)} y2={chartHeight} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,4" />
    </svg>
  );
}
