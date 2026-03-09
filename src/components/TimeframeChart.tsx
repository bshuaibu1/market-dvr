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
  '50ms': 1, '200ms': 1, '1s': 5, '5s': 25, '30s': 50,
  '1m': 100, '5m': 250, '15m': 500, '1h': 500,
};

export function isRawTimeframe(tf: string) { return ['50ms', '200ms', '1s', '5s', '30s', '1m'].includes(tf); }
export function isVolumeTimeframe(tf: string) { return ['1m', '5m', '15m', '1h'].includes(tf); }
export function getTicksPerCandle(tf: string) { return ticksPerCandle[tf] || 5; }

export function getCandleCount(rawLength: number, tf: string) {
  const tpc = getTicksPerCandle(tf);
  if (isRawTimeframe(tf)) return rawLength;
  return Math.ceil(rawLength / tpc);
}

export default function TimeframeChart({ rawData, timeframe, frame, chartWidth, chartHeight, isLight = false, showBid = false, showAsk = false, showConfidence = false }: TimeframeChartProps) {
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
      const avgPrice = slice.reduce((sum, s) => sum + s.price, 0) / slice.length;
      const avgBid = slice.reduce((sum, s) => sum + s.bid, 0) / slice.length;
      const avgAsk = slice.reduce((sum, s) => sum + s.ask, 0) / slice.length;
      const avgConf = slice.reduce((sum, s) => sum + s.confidence, 0) / slice.length;

      result.push({
        open: slice[0].price,
        high: Math.max(...slice.map(s => s.price)),
        low: Math.min(...slice.map(s => s.price)),
        close: avgPrice,
        volume: Math.floor(Math.random() * 1000 + 100 + Math.sin(i * 0.1) * 500),
        bid: avgBid,
        ask: avgAsk,
        confidence: avgConf,
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
    
    const chartData = rawData.map((d, i) => ({ ...d, index: i }));
    const label = `Raw Ticks · ${timeframe}`;
    const clampedFrame = Math.min(frame, rawData.length - 1);

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          <svg viewBox={`0 0 ${chartWidth} ${mainChartHeight}`} className="w-full h-full" preserveAspectRatio="none">
            {[0, 1, 2, 3, 4].map(i => (
              <line key={i} x1="0" y1={i * mainChartHeight / 4} x2={chartWidth} y2={i * mainChartHeight / 4} stroke={gridColor} />
            ))}
            <text x={chartWidth - 10} y="16" textAnchor="end" fill={labelColor} fontSize="11" fontFamily="Inter, sans-serif">
              {label}
            </text>
          </svg>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <YAxis domain={[minP - pad, maxP + pad]} hide />
            {showConfidence && <Line type="monotone" dataKey={(d: any) => d.price + d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
            {showConfidence && <Line type="monotone" dataKey={(d: any) => d.price - d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
            {showBid && <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
            {showAsk && <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
            <Line type="monotone" dataKey="price" stroke={isLight ? '#1d1d1f' : '#fff'} strokeWidth={isLight ? 2.5 : 2} dot={false} isAnimationActive={false} opacity={isLight ? 0.8 : 1} />
            <ReferenceLine x={clampedFrame} stroke={cursorColor} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Candlestick replaced with generalized Line mode
  if (candles.length < 10) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: chartHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <span style={{ color: isLight ? '#1d1d1f' : '#fff', fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Building history... check back soon</span>
        <span style={{ color: '#86868b', fontSize: 12, textAlign: 'center', maxWidth: 300, lineHeight: 1.5 }}>
          Market DVR has been recording since Mar 9, 2026. Longer timeframes need more data.
        </span>
      </div>
    );
  }

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices);
  const maxP = Math.max(...allPrices);
  const rangeP = maxP - minP || 1;
  const padding = rangeP * 0.08;

  const currentCandleIdx = Math.min(Math.floor(frame / tpc), candles.length - 1);
  const maxVolume = showVolume ? Math.max(...candles.map(c => c.volume)) : 1;
  const tfLabel = showVolume ? `Line + Volume · ${timeframe}` : `Line · ${timeframe}`;

  const chartData = candles.map((c, i) => ({
    ...c,
    index: i,
    price: c.close,
    volume: c.volume
  }));

  const mainTopOffset = 0;
  const candleGapOffset = 20;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
          {[0, 1, 2, 3, 4].map(i => (
            <line key={i} x1="0" y1={i * mainChartHeight / 4} x2={chartWidth} y2={i * mainChartHeight / 4} stroke={gridColor} />
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
            {showConfidence && <Line type="monotone" dataKey={(d: any) => d.price + d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
            {showConfidence && <Line type="monotone" dataKey={(d: any) => d.price - d.confidence} stroke={isLight ? 'rgba(230,0,122,0.4)' : 'rgba(230,0,122,0.4)'} strokeWidth={1} dot={false} isAnimationActive={false} />}
            {showBid && <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
            {showAsk && <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} />}
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
