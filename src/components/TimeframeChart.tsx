import { useMemo } from 'react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface RawTick {
  time: number;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  confidence?: number;
  confidenceAbs?: number;
  confidenceNorm?: number;
}

interface OHLCCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bid: number;
  ask: number;
  confidenceAbs: number;
}

interface TimeframeChartProps {
  rawData: RawTick[];
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
  '30s': 50,
  '1m': 100,
  '5m': 250,
  '15m': 500,
  '1h': 1000,
};

export function isRawTimeframe(tf: string) {
  return ['50ms', '200ms', '1s', '5s', '30s', '1m'].includes(tf);
}

export function isVolumeTimeframe(tf: string) {
  return ['1m', '5m', '15m', '1h'].includes(tf);
}

export function getTicksPerCandle(tf: string) {
  return ticksPerCandle[tf] || 5;
}

export function getCandleCount(rawLength: number, tf: string) {
  const tpc = getTicksPerCandle(tf);
  if (isRawTimeframe(tf)) return rawLength;
  return Math.ceil(rawLength / tpc);
}

function finiteOrZero(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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

  const normalizedRawData = useMemo(() => {
    return rawData
      .map((d, i) => {
        const price = finiteOrZero(d.price);
        const bid = Number.isFinite(Number(d.bid)) ? Number(d.bid) : NaN;
        const ask = Number.isFinite(Number(d.ask)) ? Number(d.ask) : NaN;

        let confidenceAbs = 0;

        if (Number.isFinite(Number(d.confidenceAbs))) {
          confidenceAbs = Number(d.confidenceAbs);
        } else if (Number.isFinite(Number(d.confidence)) && Number(d.confidence) >= 0 && Number(d.confidence) < 1) {
          // looks like normalized confidence, not absolute
          confidenceAbs = 0;
        } else if (Number.isFinite(Number(d.confidence))) {
          confidenceAbs = Number(d.confidence);
        }

        return {
          ...d,
          index: i,
          price,
          bid,
          ask,
          confidenceAbs,
        };
      })
      .filter(d => Number.isFinite(d.price) && d.price > 0);
  }, [rawData]);

  const candles = useMemo(() => {
    if (isRaw) return [];

    const result: OHLCCandle[] = [];

    for (let i = 0; i < normalizedRawData.length; i += tpc) {
      const slice = normalizedRawData.slice(i, i + tpc);
      if (slice.length === 0) continue;

      const prices = slice.map(s => s.price).filter(Number.isFinite);
      if (!prices.length) continue;

      const finiteBids = slice.map(s => s.bid).filter(Number.isFinite);
      const finiteAsks = slice.map(s => s.ask).filter(Number.isFinite);
      const finiteConfs = slice.map(s => s.confidenceAbs).filter(Number.isFinite);

      result.push({
        open: slice[0].price,
        high: Math.max(...prices),
        low: Math.min(...prices),
        close: slice[slice.length - 1].price,
        volume: prices.length,
        bid: finiteBids.length ? finiteBids.reduce((a, b) => a + b, 0) / finiteBids.length : NaN,
        ask: finiteAsks.length ? finiteAsks.reduce((a, b) => a + b, 0) / finiteAsks.length : NaN,
        confidenceAbs: finiteConfs.length ? finiteConfs.reduce((a, b) => a + b, 0) / finiteConfs.length : 0,
      });
    }

    return result;
  }, [normalizedRawData, tpc, isRaw]);

  const mainChartHeight = showVolume ? chartHeight * 0.72 : chartHeight;
  const volumeHeight = showVolume ? chartHeight * 0.2 : 0;
  const volumeTop = mainChartHeight + chartHeight * 0.08;

  if (isRaw) {
    if (!normalizedRawData.length) {
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>
          No data
        </div>
      );
    }

    const prices = normalizedRawData.map(d => d.price);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const pad = Math.max((maxP - minP) * 0.08, maxP * 0.001 || 0.0001);

    const label = `Raw Ticks · ${timeframe}`;
    const clampedFrame = Math.min(frame, normalizedRawData.length - 1);

    const chartData = normalizedRawData.map(d => ({
      ...d,
      confidenceUpper: d.price + d.confidenceAbs,
      confidenceLower: d.price - d.confidenceAbs,
    }));

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <svg viewBox={`0 0 ${chartWidth} ${mainChartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="0" y1={(i * mainChartHeight) / 4} x2={chartWidth} y2={(i * mainChartHeight) / 4} stroke={gridColor} />
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
              <Line type="monotone" dataKey="confidenceUpper" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
            )}
            {showConfidence && (
              <Line type="monotone" dataKey="confidenceLower" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
            )}
            {showBid && (
              <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
            )}
            {showAsk && (
              <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
            )}
            <Line type="monotone" dataKey="price" stroke={isLight ? '#1d1d1f' : '#fff'} strokeWidth={isLight ? 2.5 : 2} dot={false} isAnimationActive={false} opacity={isLight ? 0.8 : 1} />
            <ReferenceLine x={clampedFrame} stroke={cursorColor} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (!candles.length) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: chartHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <span style={{ color: isLight ? '#1d1d1f' : '#fff', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>No aggregated candles yet</span>
      </div>
    );
  }

  const allPrices = candles.flatMap(c => [c.high, c.low]).filter(Number.isFinite);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const rangeP = maxP - minP || 1;
  const padding = Math.max(rangeP * 0.08, maxP * 0.001 || 0.0001);

  const currentCandleIdx = Math.min(Math.floor(frame / tpc), candles.length - 1);
  const maxVolume = showVolume ? Math.max(...candles.map(c => c.volume), 1) : 1;
  const tfLabel = showVolume ? `Line + Volume · ${timeframe}` : `Line · ${timeframe}`;

  const chartData = candles.map((c, i) => ({
    ...c,
    index: i,
    price: c.close,
    confidenceUpper: c.close + c.confidenceAbs,
    confidenceLower: c.close - c.confidenceAbs,
  }));

  const mainTopOffset = 0;
  const candleGapOffset = 20;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1="0" y1={(i * mainChartHeight) / 4} x2={chartWidth} y2={(i * mainChartHeight) / 4} stroke={gridColor} />
          ))}
          <text x={chartWidth - 10} y="16" textAnchor="end" fill={labelColor} fontSize="11" fontFamily="Inter, sans-serif">
            {tfLabel}
          </text>
        </svg>
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: mainChartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: mainTopOffset, right: candleGapOffset, left: candleGapOffset, bottom: 0 }}>
            <YAxis domain={[minP - padding, maxP + padding]} hide />
            {showConfidence && (
              <Line type="monotone" dataKey="confidenceUpper" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
            )}
            {showConfidence && (
              <Line type="monotone" dataKey="confidenceLower" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
            )}
            {showBid && (
              <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
            )}
            {showAsk && (
              <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
            )}
            <Line type="monotone" dataKey="price" stroke={isLight ? '#1d1d1f' : '#fff'} strokeWidth={isLight ? 2 : 1.5} dot={false} isAnimationActive={false} />
            <ReferenceLine x={currentCandleIdx} stroke={cursorColor} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {showVolume && (
        <div style={{ position: 'absolute', top: volumeTop, left: 0, right: 0, height: volumeHeight }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <svg viewBox={`0 0 ${chartWidth} ${volumeHeight}`} className="w-full h-full" preserveAspectRatio="none">
              <line x1="0" y1="0" x2={chartWidth} y2="0" stroke={volLineColor} />
              <text x="4" y="12" fill={volLabelColor} fontSize="9" fontFamily="Inter, sans-serif">VOL</text>
            </svg>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 0, right: candleGapOffset, left: candleGapOffset, bottom: 0 }}>
              <YAxis domain={[0, maxVolume]} hide />
              <Line type="monotone" dataKey="volume" stroke="#e6007a" strokeWidth={1.5} dot={false} isAnimationActive={false} opacity={0.6} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}