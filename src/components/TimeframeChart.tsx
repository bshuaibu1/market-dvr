import { useMemo } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface OHLCCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
  confidence: number;
}

interface TimeframeChartProps {
  rawData: { time: number; price: number; bid: number; ask: number; spread: number; confidence: number }[];
  timeframe: string;
  frame: number;
  chartWidth: number;
  chartHeight: number;
  isLight?: boolean;
  showBid?: boolean;
  showAsk?: boolean;
  showConfidence?: boolean;
}

const ticksPerCandle: Record<string, number> = {
  '50ms': 1,
  '200ms': 1,
  '1s': 5,
  '5s': 25,
  '30s': 150,
  '1m': 300,
  '5m': 1500,
  '15m': 4500,
  '1h': 18000,
};

export function isRawTimeframe(tf: string) {
  return ['50ms', '200ms', '1s', '5s', '30s', '1m'].includes(tf);
}

export function isVolumeTimeframe(tf: string) {
  return ['5m', '15m', '1h'].includes(tf);
}

export function getTicksPerCandle(tf: string) {
  return ticksPerCandle[tf] || 5;
}

export function getCandleCount(rawLength: number, tf: string) {
  const tpc = getTicksPerCandle(tf);
  if (isRawTimeframe(tf)) return rawLength;
  return Math.ceil(rawLength / tpc);
}

export default function TimeframeChart({
  rawData,
  timeframe,
  frame,
  chartWidth,
  chartHeight,
  isLight = false,
  showBid = false,
  showAsk = false,
  showConfidence = false,
}: TimeframeChartProps) {
  const tpc = ticksPerCandle[timeframe] || 5;
  const isRaw = isRawTimeframe(timeframe);
  const showVolume = isVolumeTimeframe(timeframe);

  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)';
  const labelColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.25)';
  const cursorColor = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)';
  const volLineColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const volLabelColor = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)';

  const candles = useMemo(() => {
    if (isRaw) return [];

    const result: OHLCCandle[] = [];

    for (let i = 0; i < rawData.length; i += tpc) {
      const slice = rawData.slice(i, i + tpc);
      if (slice.length === 0) continue;

      const validPrices = slice.map((s) => s.price).filter((p) => Number.isFinite(p));
      if (!validPrices.length) continue;

      result.push({
        open: slice[0].price,
        high: Math.max(...validPrices),
        low: Math.min(...validPrices),
        close: slice[slice.length - 1].price,
        volume: slice.length,
        bid: slice[slice.length - 1].bid,
        ask: slice[slice.length - 1].ask,
        confidence: slice[slice.length - 1].confidence,
      });
    }

    return result;
  }, [rawData, tpc, isRaw]);

  const mainChartHeight = showVolume ? chartHeight * 0.72 : chartHeight;
  const volumeHeight = showVolume ? chartHeight * 0.2 : 0;
  const volumeTop = mainChartHeight + chartHeight * 0.08;

  if (isRaw) {
    const chartData = rawData
      .map((d, i) => ({ ...d, index: i }))
      .filter((d) => Number.isFinite(d.price));

    const prices = chartData.map((d) => d.price);
    const minP = prices.length ? Math.min(...prices) : 0;
    const maxP = prices.length ? Math.max(...prices) : 1;
    const pad = (maxP - minP) * 0.08 || Math.max(Math.abs(minP) * 0.002, 0.000001);

    const label = `Raw Ticks · ${timeframe}`;
    const clampedFrame = Math.min(frame, Math.max(chartData.length - 1, 0));

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <svg viewBox={`0 0 ${chartWidth} ${mainChartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4].map((i) => (
              <line
                key={i}
                x1="0"
                y1={(i * mainChartHeight) / 4}
                x2={chartWidth}
                y2={(i * mainChartHeight) / 4}
                stroke={gridColor}
              />
            ))}
            <text x={chartWidth - 10} y="16" textAnchor="end" fill={labelColor} fontSize="11" fontFamily="Inter, sans-serif">
              {label}
            </text>
          </svg>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <YAxis domain={[minP - pad, maxP + pad]} hide />

            {showConfidence && (
              <Line
                type="stepAfter"
                dataKey={(d: any) => d.price + d.confidence}
                stroke="rgba(230,0,122,0.4)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showConfidence && (
              <Line
                type="stepAfter"
                dataKey={(d: any) => d.price - d.confidence}
                stroke="rgba(230,0,122,0.4)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showBid && (
              <Line
                type="stepAfter"
                dataKey="bid"
                stroke={isLight ? '#0055d4' : '#0a84ff'}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
                opacity={0.5}
              />
            )}

            {showAsk && (
              <Line
                type="stepAfter"
                dataKey="ask"
                stroke={isLight ? '#cc2200' : '#ff453a'}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
                opacity={0.5}
              />
            )}

            <Line
              type="stepAfter"
              dataKey="price"
              stroke={isLight ? '#1d1d1f' : '#fff'}
              strokeWidth={isLight ? 2.5 : 2}
              dot={false}
              isAnimationActive={false}
              opacity={isLight ? 0.8 : 1}
            />

            <ReferenceLine x={clampedFrame} stroke={cursorColor} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const minCandlesNeeded =
    timeframe === '5m' ? 2 :
    timeframe === '15m' ? 2 :
    timeframe === '1h' ? 2 :
    1;

  if (candles.length < minCandlesNeeded) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: chartHeight,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <span
          style={{
            color: isLight ? '#1d1d1f' : '#fff',
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 8,
          }}
        >
          Building history... check back soon
        </span>
        <span
          style={{
            color: '#86868b',
            fontSize: 12,
            textAlign: 'center',
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          Longer timeframes need more recorded data before the replay looks meaningful.
        </span>
      </div>
    );
  }

  const allPrices = candles.flatMap((c) => [c.high, c.low]).filter((p) => Number.isFinite(p));
  const minP = allPrices.length ? Math.min(...allPrices) : 0;
  const maxP = allPrices.length ? Math.max(...allPrices) : 1;
  const rangeP = maxP - minP || 1;
  const padding = rangeP * 0.08 || Math.max(Math.abs(minP) * 0.002, 0.000001);

  const currentCandleIdx = Math.min(Math.floor(frame / tpc), Math.max(candles.length - 1, 0));
  const maxVolume = showVolume ? Math.max(...candles.map((c) => c.volume), 1) : 1;
  const tfLabel = showVolume ? `Line + Volume · ${timeframe}` : `Line · ${timeframe}`;

  const chartData = candles.map((c, i) => ({
    ...c,
    index: i,
    price: c.close,
    volume: c.volume,
  }));

  const mainTopOffset = 0;
  const chartSidePadding = 20;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="0"
              y1={(i * mainChartHeight) / 4}
              x2={chartWidth}
              y2={(i * mainChartHeight) / 4}
              stroke={gridColor}
            />
          ))}
          <text x={chartWidth - 10} y="16" textAnchor="end" fill={labelColor} fontSize="11" fontFamily="Inter, sans-serif">
            {tfLabel}
          </text>
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mainChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: mainTopOffset, right: chartSidePadding, left: chartSidePadding, bottom: 0 }}
          >
            <YAxis domain={[minP - padding, maxP + padding]} hide />

            {showConfidence && (
              <Line
                type="linear"
                dataKey={(d: any) => d.price + d.confidence}
                stroke="rgba(230,0,122,0.4)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showConfidence && (
              <Line
                type="linear"
                dataKey={(d: any) => d.price - d.confidence}
                stroke="rgba(230,0,122,0.4)"
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {showBid && (
              <Line
                type="linear"
                dataKey="bid"
                stroke={isLight ? '#0055d4' : '#0a84ff'}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
                opacity={0.5}
              />
            )}

            {showAsk && (
              <Line
                type="linear"
                dataKey="ask"
                stroke={isLight ? '#cc2200' : '#ff453a'}
                strokeWidth={1}
                dot={false}
                isAnimationActive={false}
                opacity={0.5}
              />
            )}

            <Line
              type="linear"
              dataKey="price"
              stroke={isLight ? '#1d1d1f' : '#fff'}
              strokeWidth={isLight ? 2 : 1.5}
              dot={false}
              isAnimationActive={false}
            />

            <ReferenceLine x={currentCandleIdx} stroke={cursorColor} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showVolume && maxVolume > 0 && (
        <div style={{ position: 'absolute', top: volumeTop, left: 0, right: 0, height: volumeHeight }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <svg viewBox={`0 0 ${chartWidth} ${volumeHeight}`} className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke={volLineColor} />
              <text x="4" y="12" fill={volLabelColor} fontSize="9" fontFamily="Inter, sans-serif">
                VOL
              </text>
            </svg>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: chartSidePadding, left: chartSidePadding, bottom: 0 }}>
              <YAxis domain={[0, maxVolume]} hide />
              <Line
                type="linear"
                dataKey="volume"
                stroke="#e6007a"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                opacity={0.6}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}