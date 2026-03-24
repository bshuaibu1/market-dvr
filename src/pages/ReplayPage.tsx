import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AudioIntro from '@/components/AudioIntro';
import { generateReplayData, formatPrice, allAssetsList } from '@/lib/mockData';
import { fetchTicks, fetchTickRange, fetchLatest, fetchAssetEvents } from '@/lib/api';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Share2, Keyboard, GitCompareArrows, ChevronRight } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import pythLogo from '@/assets/pyth-logo.png';
import ShortcutsModal from '@/components/ShortcutsModal';
import ShareModal from '@/components/ShareModal';
import TimeframeChart from '@/components/TimeframeChart';
import { useTheme } from '@/components/ThemeProvider';
import MarketAutopsy from '@/components/MarketAutopsy';
import ShockPropagation from '@/components/ShockPropagation';
import { useIsMobile } from '@/hooks/use-mobile';

const timeframes = ['50ms', '200ms', '1s', '5s', '30s', '1m', '5m', '15m', '1h'];

const timeframeLabels: Record<string, string> = {
  '50ms': '50ms',
  '200ms': '200ms',
  '1s': '1s',
  '5s': '5s',
  '30s': '30s',
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
};

const speeds = ['0.25x', '0.5x', '1x', '2x', '4x'];
const speedMap: Record<string, number> = { '0.25x': 200, '0.5x': 100, '1x': 50, '2x': 25, '4x': 12 };
const keyToSpeed: Record<string, string> = { '1': '0.25x', '2': '0.5x', '3': '1x', '4': '2x', '5': '4x' };

const assetExponents: Record<string, number> = {
  'BTC/USD': -8,
  'ETH/USD': -8,
  'SOL/USD': -8,
  'BNB/USD': -8,
  'BONK/USD': -10,
  'WIF/USD': -8,
  'DOGE/USD': -8,
  'PYTH/USD': -8,
  'XAU/USD': -3,
  'XAG/USD': -5,
  'EUR/USD': -5,
  'GBP/USD': -5,
  'USD/JPY': -3,
  'USD/CHF': -5,
  'AUD/USD': -5,
  'USD/CAD': -5,
};

type ReplayTick = {
  time: number;
  timestamp_us: number;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  confidenceAbs: number;
  confidenceNorm: number;
};

function formatSpread(v: number) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '$0.00';
  const abs = Math.abs(v);
  if (abs < 0.0001) return `$${v.toFixed(8)}`;
  if (abs < 0.01) return `$${v.toFixed(6)}`;
  if (abs < 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

function parseTimestampToUs(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 1e14) return Math.round(value);
    if (value > 1e11) return Math.round(value * 1000);
    if (value > 1e9) return Math.round(value * 1_000_000);
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const numeric = Number(trimmed);
    if (Number.isFinite(numeric)) return parseTimestampToUs(numeric);

    const parsedMs = Date.parse(trimmed);
    if (Number.isFinite(parsedMs)) return Math.round(parsedMs * 1000);
  }

  return null;
}

function mapApiTick(t: any, i: number, fallbackExponent = -8): ReplayTick | null {
  const exponent = Number.isFinite(Number(t.exponent)) ? Number(t.exponent) : fallbackExponent;
  const factor = Math.pow(10, exponent);

  const price = Number(t.price) * factor;
  if (!Number.isFinite(price) || price <= 0) return null;

  const bid = Number.isFinite(Number(t.best_bid)) ? Number(t.best_bid) * factor : NaN;
  const ask = Number.isFinite(Number(t.best_ask)) ? Number(t.best_ask) * factor : NaN;
  const spread = Number.isFinite(bid) && Number.isFinite(ask) ? Math.max(0, ask - bid) : 0;

  const confidenceAbs = Number.isFinite(Number(t.confidence)) ? Number(t.confidence) * factor : 0;
  const confidenceNorm =
    Number.isFinite(confidenceAbs) && price > 0
      ? Math.max(0, Math.min(0.999, 1 - confidenceAbs / price))
      : 0.95;

  const timestampUs = parseTimestampToUs(t.timestamp_us ?? t.start_time);
  if (!timestampUs || timestampUs <= 0) return null;

  return {
    time: i,
    timestamp_us: timestampUs,
    price,
    bid,
    ask,
    spread,
    confidenceAbs,
    confidenceNorm,
  };
}

function findClosestFrameByTimestamp(ticks: ReplayTick[], targetTimestampUs: number): number {
  if (!ticks.length) return 0;

  let bestIdx = 0;
  let bestDelta = Math.abs((ticks[0].timestamp_us || 0) - targetTimestampUs);

  for (let i = 1; i < ticks.length; i++) {
    const delta = Math.abs((ticks[i].timestamp_us || 0) - targetTimestampUs);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIdx = i;
    }
  }

  return bestIdx;
}

function formatReplayTimestamp(timestampUs: number) {
  if (!Number.isFinite(timestampUs) || timestampUs <= 0) return '—';
  const ms = Math.floor(timestampUs / 1000);
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function getReplayWindowUs(timeframe: string) {
  if (timeframe === '50ms') return 30 * 1000 * 1000;
  if (timeframe === '200ms') return 60 * 1000 * 1000;
  if (timeframe === '1s') return 2 * 60 * 1000 * 1000;
  if (timeframe === '5s') return 10 * 60 * 1000 * 1000;
  if (timeframe === '30s') return 30 * 60 * 1000 * 1000;
  if (timeframe === '1m') return 60 * 60 * 1000 * 1000;
  if (timeframe === '5m') return 3 * 60 * 60 * 1000 * 1000;
  if (timeframe === '15m') return 6 * 60 * 60 * 1000 * 1000;
  return 12 * 60 * 60 * 1000 * 1000;
}

function prettifyEventType(raw: string | null) {
  if (!raw) return 'Clicked Event';
  if (raw === 'volatility_spike') return 'Volatility Spike';
  if (raw === 'spread_spike') return 'Spread Spike';
  if (raw === 'confidence_divergence') return 'Confidence Drop';
  return raw;
}

export default function ReplayPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const assetParam = searchParams.get('asset');
  const eventIdParam = searchParams.get('eventId');
  const replayAtParam = parseTimestampToUs(searchParams.get('replayAt'));

  const eventTypeParam = searchParams.get('eventType');
  const eventLabelParam = searchParams.get('eventLabel');
  const eventTimeLabelParam = searchParams.get('eventTimeLabel');
  const metric1Param = searchParams.get('metric1');
  const metric2Param = searchParams.get('metric2');
  const metric3Param = searchParams.get('metric3');
  const aiExplanationParam = searchParams.get('aiExplanation');

  const [selectedAsset, setSelectedAsset] = useState(assetParam || 'BTC/USD');
  const [compareMode, setCompareMode] = useState(false);
  const [compareAsset, setCompareAsset] = useState('ETH/USD');
  const [inspectorTab, setInspectorTab] = useState<'inspector' | 'autopsy'>('inspector');
  const [autopsyData, setAutopsyData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  const [apiAssets, setApiAssets] = useState<{ symbol: string }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [data, setData] = useState<ReplayTick[]>([]);

  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');
  const [showBid, setShowBid] = useState(false);
  const [showAsk, setShowAsk] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [timeframe, setTimeframe] = useState('1s');
  const [isLive, setIsLive] = useState(false);

  const liveIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const playRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (assetParam) setSelectedAsset(assetParam);
  }, [assetParam]);

  useEffect(() => {
    fetchLatest()
      .then((res: any[]) => {
        if (res && res.length) {
          setApiAssets(res.map(r => ({ symbol: r.asset })));
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setDataLoading(true);

      try {
        const events = await fetchAssetEvents(selectedAsset);
        if (!active) return;

        let targetEvent: any = null;
        let targetTimestampUs: number | null = replayAtParam;

        if (events && events.length) {
          targetEvent = eventIdParam
            ? (events.find((e: any) => String(e.id) === String(eventIdParam)) || null)
            : null;

          if (targetEvent) {
            const eventStartUs = parseTimestampToUs(targetEvent.start_time);
            const eventCreatedUs = parseTimestampToUs(targetEvent.created_at);
            targetTimestampUs = replayAtParam ?? eventStartUs ?? eventCreatedUs;
          }

          setTimelineEvents(events);
        } else {
          setTimelineEvents([]);
        }

        const exp = assetExponents[selectedAsset] || -8;
        const mult = Math.pow(10, exp);

        if (targetEvent) {
          setAutopsyData({
            ...targetEvent,
            first_price: Number(targetEvent.first_price || 0) * mult,
            last_price: Number(targetEvent.last_price || 0) * mult,
            max_spread: Number(targetEvent.max_spread || 0) * mult,
            baseline_spread: Number(targetEvent.baseline_spread || 0) * mult,
          });
        } else if (replayAtParam) {
          setAutopsyData({
            id: eventIdParam || `clicked-${replayAtParam}`,
            asset: selectedAsset,
            event_type: eventTypeParam || 'clicked_event',
            label: eventLabelParam || prettifyEventType(eventTypeParam),
            start_time: replayAtParam,
            created_at: replayAtParam,
            featuredTimestamp: eventTimeLabelParam || formatReplayTimestamp(replayAtParam),
            first_price: 0,
            last_price: 0,
            max_spread: 0,
            baseline_spread: 0,
            metric1: metric1Param,
            metric2: metric2Param,
            metric3: metric3Param,
            aiExplanation: aiExplanationParam,
            isFallbackFromUrl: true,
          });
        } else {
          setAutopsyData(null);
        }

        const fallbackExp = assetExponents[selectedAsset] || -8;
        let ticks: any[] = [];

        if (targetTimestampUs && targetTimestampUs > 0) {
          const halfWindowUs = getReplayWindowUs(timeframe);
          const from = Math.max(0, targetTimestampUs - halfWindowUs);
          const to = targetTimestampUs + halfWindowUs;

          try {
            ticks = await fetchTickRange(selectedAsset, from, to);
          } catch (rangeErr) {
            console.error('fetchTickRange failed, falling back to fetchTicks', rangeErr);
            const fallbackLimit = ['5m', '15m', '1h'].includes(timeframe) ? 1500 : 500;
            ticks = await fetchTicks(selectedAsset, fallbackLimit);
          }
        } else {
          const fallbackLimit = ['5m', '15m', '1h'].includes(timeframe) ? 1500 : 500;
          ticks = await fetchTicks(selectedAsset, fallbackLimit);
        }

        if (!active) return;

        const mapped = (ticks || [])
          .map((t: any, i: number) => mapApiTick(t, i, fallbackExp))
          .filter((d): d is ReplayTick => d !== null)
          .sort((a, b) => a.timestamp_us - b.timestamp_us)
          .map((tick, i) => ({ ...tick, time: i }));

        setData(mapped);
        setDataLoading(false);

        if (!mapped.length) {
          setFrame(0);
          return;
        }

        if (targetTimestampUs && targetTimestampUs > 0) {
          const targetIdx = findClosestFrameByTimestamp(mapped, targetTimestampUs);
          setFrame(targetIdx);

          if (!targetEvent && replayAtParam) {
            const currentTick = mapped[targetIdx];
            setAutopsyData((prev: any) =>
              prev
                ? {
                    ...prev,
                    first_price: currentTick?.price ?? 0,
                    last_price: currentTick?.price ?? 0,
                    max_spread: currentTick?.spread ?? 0,
                    baseline_spread: 0,
                  }
                : prev
            );
          }
        } else {
          setFrame(prev => Math.min(prev, mapped.length - 1));
        }
      } catch (err) {
        console.error(err);
        if (active) setDataLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [
    selectedAsset,
    timeframe,
    eventIdParam,
    replayAtParam,
    eventTypeParam,
    eventLabelParam,
    eventTimeLabelParam,
    metric1Param,
    metric2Param,
    metric3Param,
    aiExplanationParam,
  ]);

  useEffect(() => {
    if (!isLive) {
      clearInterval(liveIntervalRef.current);
      return;
    }

    setPlaying(false);

    async function pollLive() {
      try {
        const fallbackExp = assetExponents[selectedAsset] || -8;
        const ticks = await fetchTicks(selectedAsset, 500);

        const mapped = (ticks || [])
          .map((t: any, i: number) => mapApiTick(t, i, fallbackExp))
          .filter((d): d is ReplayTick => d !== null)
          .sort((a, b) => a.timestamp_us - b.timestamp_us)
          .map((tick, i) => ({ ...tick, time: i }));

        if (!mapped.length) return;

        setData(mapped);
        setFrame(mapped.length - 1);
      } catch (err) {
        console.error(err);
      }
    }

    pollLive();
    liveIntervalRef.current = setInterval(pollLive, 1000);

    return () => clearInterval(liveIntervalRef.current);
  }, [isLive, selectedAsset]);

  const handleScrub = (val: number) => {
    if (isLive && val < data.length - 5) setIsLive(false);
    setFrame(val);
  };

  const compareData = useMemo(() => {
    if (!compareMode) return [];
    const base = data[0]?.price || 100;
    return generateReplayData(Math.max(500, data.length || 500), base);
  }, [compareMode, compareAsset, data]);

  useEffect(() => {
    if (playing) {
      const ms = speedMap[speed] || 50;
      playRef.current = setInterval(() => {
        setFrame(f => {
          if (f >= data.length - 1) {
            setPlaying(false);
            return f;
          }
          return f + 1;
        });
      }, ms);
    }

    return () => clearInterval(playRef.current);
  }, [playing, speed, data.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        setPlaying(p => !p);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFrame(f => Math.max(0, f - (e.shiftKey ? 100 : 10)));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFrame(f => Math.min(data.length - 1, f + (e.shiftKey ? 100 : 10)));
        break;
      case 'Home':
        e.preventDefault();
        setFrame(0);
        break;
      case 'End':
        e.preventDefault();
        setFrame(data.length - 1);
        break;
      default:
        if (keyToSpeed[e.key]) setSpeed(keyToSpeed[e.key]);
    }
  }, [data.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const emptyTick: ReplayTick = {
    time: 0,
    timestamp_us: 0,
    price: 0,
    bid: 0,
    ask: 0,
    spread: 0,
    confidenceAbs: 0,
    confidenceNorm: 0,
  };

  const current = data[frame] ?? emptyTick;
  const prev = data[Math.max(0, frame - 1)] ?? emptyTick;
  const priceChange = current.price - prev.price;

  const useCompare = compareMode && compareData.length > 0;
  const compareCurrent = useCompare ? compareData[Math.min(frame, compareData.length - 1)] : null;

  const chartWidth = 800;
  const chartHeight = isMobile ? 160 : 300;

  const startPrice1 = (data[0] ?? emptyTick).price || 1;
  const startPrice2 = useCompare && compareData[0] ? compareData[0].price || 1 : 1;

  let minP = 0;
  let maxP = 1;

  if (useCompare) {
    const pcts1 = data.map(d => ((d.price - startPrice1) / startPrice1) * 100);
    const pcts2 = compareData.map(d => ((d.price - startPrice2) / startPrice2) * 100);
    const allPcts = [...pcts1, ...pcts2].filter(Number.isFinite);

    const rawMin = allPcts.length ? Math.min(...allPcts) : -1;
    const rawMax = allPcts.length ? Math.max(...allPcts) : 1;
    const pad = Math.max((rawMax - rawMin) * 0.1, 0.05);

    minP = rawMin - pad;
    maxP = rawMax + pad;
  } else {
    const prices = data.map(d => d.price).filter(Number.isFinite);
    const rawMin = prices.length ? Math.min(...prices) : 0;
    const rawMax = prices.length ? Math.max(...prices) : 1;
    const pad = Math.max((rawMax - rawMin) * 0.08, rawMax * 0.0005 || 0.0001);

    minP = rawMin - pad;
    maxP = rawMax + pad;
  }

  const rechartsData = useMemo(() => {
    return data.map((d, i) => {
      let pct1 = 0;
      let pct2 = 0;

      if (useCompare) {
        pct1 = ((d.price - startPrice1) / startPrice1) * 100;
        if (compareData[i]) {
          pct2 = ((compareData[i].price - startPrice2) / startPrice2) * 100;
        }
      }

      return {
        ...d,
        index: i,
        pct1,
        pct2,
        confidenceUpper: d.price + d.confidenceAbs,
        confidenceLower: d.price - d.confidenceAbs,
      };
    });
  }, [data, compareData, useCompare, startPrice1, startPrice2]);

  const spreads = data.map(d => d.spread).filter(Number.isFinite);
  const maxSpread = spreads.length ? Math.max(...spreads) : 1;

  const spreadChartH = isMobile ? 48 : 80;

  const maxSpreadIdx = data.length
    ? data.reduce((bestIdx, d, i, arr) => (d.spread > arr[bestIdx].spread ? i : bestIdx), 0)
    : 0;

  const minConfIdx = data.length
    ? data.reduce((bestIdx, d, i, arr) => (d.confidenceNorm < arr[bestIdx].confidenceNorm ? i : bestIdx), 0)
    : 0;

  let peakVolIdx = 0;
  let peakVolDelta = 0;
  for (let i = 1; i < data.length; i++) {
    const delta = Math.abs(data[i].price - data[i - 1].price);
    if (delta > peakVolDelta) {
      peakVolDelta = delta;
      peakVolIdx = i;
    }
  }

  const timelineMarkers = useMemo(() => {
    if (!data.length) return [];

    const markers: any[] = [];
    const firstTickTime = data[0].timestamp_us || 0;
    const lastTickTime = data[data.length - 1].timestamp_us || 0;

    if (replayAtParam && replayAtParam >= firstTickTime && replayAtParam <= lastTickTime) {
      const clickedFrame = findClosestFrameByTimestamp(data, replayAtParam);
      markers.push({
        id: `clicked-${eventIdParam || replayAtParam}`,
        frame: clickedFrame,
        label: eventLabelParam || prettifyEventType(eventTypeParam),
        event_type: eventTypeParam || 'clicked_event',
        start_time: replayAtParam,
        isClickedEvent: true,
      });
    }

    for (const ev of timelineEvents) {
      const start = parseTimestampToUs(ev.start_time) ?? parseTimestampToUs(ev.created_at) ?? 0;
      if (start < firstTickTime || start > lastTickTime) continue;

      const frameIdx = findClosestFrameByTimestamp(data, start);

      let label = ev.event_type;
      if (label === 'volatility_spike') label = 'Volatility Spike';
      else if (label === 'spread_spike') label = 'Spread Spike';
      else if (label === 'confidence_divergence') label = 'Confidence Drop';

      markers.push({
        ...ev,
        frame: frameIdx,
        label,
      });
    }

    const deduped = new Map<string, any>();
    for (const m of markers) {
      deduped.set(String(m.id), m);
    }

    return Array.from(deduped.values()).sort((a, b) => a.frame - b.frame);
  }, [timelineEvents, data, replayAtParam, eventIdParam, eventLabelParam, eventTypeParam]);

  const pct1 = (((current.price - startPrice1) / startPrice1) * 100).toFixed(2);
  const pct2 = compareCurrent ? (((compareCurrent.price - startPrice2) / startPrice2) * 100).toFixed(2) : '0.00';

  const inspectorLabelColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const inspectorValueColor = isLight ? '#1d1d1f' : '#fff';
  const inspectorDivider = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  const fallbackAutopsyPanel =
    autopsyData?.isFallbackFromUrl ? (
      <div className="space-y-4">
        <div
          className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium"
          style={{
            background: 'rgba(230,0,122,0.10)',
            border: '1px solid rgba(230,0,122,0.24)',
            color: '#e6007a',
          }}
        >
          {autopsyData.label || 'Clicked Event'}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>Asset</div>
            <div style={{ fontSize: 28, fontWeight: 600, color: inspectorValueColor }}>{autopsyData.asset}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>Start Time</div>
            <div style={{ fontSize: 18, color: inspectorValueColor }}>
              {autopsyData.featuredTimestamp || formatReplayTimestamp(autopsyData.start_time)}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {autopsyData.metric1 && (
            <div className="rounded-xl px-4 py-3" style={{ background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>Metric 1</div>
              <div style={{ fontSize: 20, color: inspectorValueColor }}>{autopsyData.metric1}</div>
            </div>
          )}
          {autopsyData.metric2 && (
            <div className="rounded-xl px-4 py-3" style={{ background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>Metric 2</div>
              <div style={{ fontSize: 20, color: inspectorValueColor }}>{autopsyData.metric2}</div>
            </div>
          )}
          {autopsyData.metric3 && (
            <div className="rounded-xl px-4 py-3" style={{ background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>Metric 3</div>
              <div style={{ fontSize: 20, color: inspectorValueColor }}>{autopsyData.metric3}</div>
            </div>
          )}
        </div>

        {autopsyData.aiExplanation && (
          <div
            className="rounded-xl px-4 py-3"
            style={{
              background: isLight ? 'rgba(230,0,122,0.035)' : 'rgba(230,0,122,0.06)',
              border: `1px solid ${isLight ? 'rgba(230,0,122,0.12)' : 'rgba(230,0,122,0.18)'}`,
            }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e6007a', fontWeight: 600, marginBottom: 6 }}>
              AI Explanation
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: isLight ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.72)' }}>
              {autopsyData.aiExplanation}
            </div>
          </div>
        )}
      </div>
    ) : (
      <MarketAutopsy data={autopsyData} />
    );

  const inspectorPanel = (
    <>
      <div className="flex items-center gap-1 p-1 rounded-full surface-1 mb-6">
        <button
          onClick={() => setInspectorTab('inspector')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium apple-transition flex-1 text-center ${inspectorTab === 'inspector' ? 'surface-2 inner-glow text-foreground' : 'text-muted-foreground'}`}
        >
          Frame Inspector
        </button>
        <button
          onClick={() => setInspectorTab('autopsy')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium apple-transition flex-1 text-center ${inspectorTab === 'autopsy' ? 'text-foreground' : 'text-muted-foreground'}`}
          style={inspectorTab === 'autopsy' ? { background: '#e6007a', color: '#fff' } : {}}
        >
          Autopsy
        </button>
      </div>

      {inspectorTab === 'inspector' ? (
        <>
          {useCompare && compareCurrent ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-medium text-foreground mb-3">{selectedAsset}</div>
                {[
                  { label: 'PRICE', value: `$${formatPrice(current.price)}` },
                  { label: 'BID', value: Number.isFinite(current.bid) ? `$${formatPrice(current.bid)}` : '—' },
                  { label: 'ASK', value: Number.isFinite(current.ask) ? `$${formatPrice(current.ask)}` : '—' },
                  { label: 'SPREAD', value: formatSpread(current.spread) },
                  { label: 'CONF', value: `${Math.min(100, current.confidenceNorm * 100).toFixed(1)}%` },
                  { label: 'TIME', value: formatReplayTimestamp(current.timestamp_us) },
                ].map((row, idx, arr) => (
                  <div key={row.label} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none', padding: '12px 0' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>{row.label}</div>
                    <div className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</div>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-xs font-medium mb-3" style={{ color: '#0a84ff' }}>{compareAsset}</div>
                {[
                  { label: 'PRICE', value: `$${formatPrice(compareCurrent.price)}` },
                  { label: 'BID', value: Number.isFinite(compareCurrent.bid) ? `$${formatPrice(compareCurrent.bid)}` : '—' },
                  { label: 'ASK', value: Number.isFinite(compareCurrent.ask) ? `$${formatPrice(compareCurrent.ask)}` : '—' },
                  { label: 'SPREAD', value: formatSpread(compareCurrent.spread) },
                  { label: 'CONF', value: `${Math.min(100, compareCurrent.confidenceNorm * 100).toFixed(1)}%` },
                ].map((row, idx, arr) => (
                  <div key={row.label} style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none', padding: '12px 0' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor }}>{row.label}</div>
                    <div className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {[
                { label: 'PRICE', value: `$${formatPrice(current.price)}`, change: priceChange },
                { label: 'BID', value: Number.isFinite(current.bid) ? `$${formatPrice(current.bid)}` : '—' },
                { label: 'ASK', value: Number.isFinite(current.ask) ? `$${formatPrice(current.ask)}` : '—' },
                { label: 'SPREAD', value: formatSpread(current.spread) },
                { label: 'CONFIDENCE', value: `${Math.min(100, current.confidenceNorm * 100).toFixed(1)}%` },
                { label: 'TIME', value: formatReplayTimestamp(current.timestamp_us) },
                { label: 'FRAME', value: `${frame} / ${Math.max(0, data.length - 1)}` },
                { label: 'RESOLUTION', value: timeframe },
              ].map((row, idx, arr) => (
                <div
                  key={row.label}
                  style={{
                    borderBottom: idx < arr.length - 1 ? `1px solid ${inspectorDivider}` : 'none',
                    padding: '12px 0',
                  }}
                >
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: inspectorLabelColor, marginBottom: 2 }}>
                    {row.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums" style={{ fontSize: 18, color: inspectorValueColor }}>{row.value}</span>
                    {'change' in row && row.change !== undefined && (
                      <span className={`text-xs tabular-nums ${row.change >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {row.change >= 0 ? '+' : ''}{row.change.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h3 className="label-caps mb-3">Timeline Events</h3>
            <div className="flex flex-wrap gap-2">
              {timelineMarkers.length > 0 ? (
                timelineMarkers.map((m: any, idx) => (
                  <button
                    key={`${m.id}-${idx}`}
                    onClick={() => setFrame(m.frame)}
                    className="px-3 py-1 rounded-full surface-1 text-[11px] text-muted-foreground font-medium apple-transition hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    {m.label}
                  </button>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground">No events in this range</span>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="label-caps mb-3">AI Markers</h3>
            <div className="space-y-0">
              {[
                { color: '#f97316', label: 'Max Spread', frame: maxSpreadIdx },
                { color: '#9333ea', label: 'Max Confidence Expansion', frame: minConfIdx },
                { color: isLight ? '#1d1d1f' : '#f5f5f7', label: 'Peak Volatility', frame: peakVolIdx },
              ].map(m => (
                <button
                  key={m.label}
                  onClick={() => setFrame(m.frame)}
                  className="group/marker flex items-center gap-2 w-full text-left min-h-[44px] md:min-h-[36px] rounded-lg px-2 -mx-2"
                  style={{ transition: 'background 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div className="w-2 h-2 rotate-45 flex-shrink-0" style={{ background: m.color }} />
                  <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground ml-auto">#{m.frame}</span>
                  <ChevronRight size={12} className="text-muted-foreground opacity-0 group-hover/marker:opacity-100" style={{ transition: 'opacity 0.15s ease' }} />
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        fallbackAutopsyPanel
      )}
    </>
  );

  const togglePillInactiveBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
  const togglePillActiveBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const togglePillInactiveText = isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
  const togglePillActiveText = isLight ? '#1d1d1f' : '#fff';

  const eventPositions = [140, 165, 300, 350];

  return (
    <div className="min-h-screen bg-background pt-14">
      <AudioIntro audioSrc="/audio/replaypageaudio.mp3" pageKey="replay" label="Replay" />
      <Navbar />

      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-56px)]">
        <div className="flex-1 flex flex-col p-4 md:p-6 min-w-0" style={{ gap: 8 }}>
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <select
              value={selectedAsset}
              onChange={e => {
                setSelectedAsset(e.target.value);
                setFrame(0);
                setPlaying(false);
                setIsLive(false);
              }}
              className="h-11 md:h-9 rounded-xl bg-background text-foreground text-sm px-3 font-medium focus:outline-none min-w-[120px]"
              style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}
            >
              {allAssetsList.map(a => (
                <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
              ))}
            </select>

            <span className="label-caps">Replay</span>

            <button
              onClick={() => setIsLive(l => !l)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0"
              style={{
                background: isLive ? 'rgba(230,0,122,0.15)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                border: isLive ? '1px solid #e6007a' : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                color: isLive ? '#e6007a' : undefined,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: isLive ? '#e6007a' : (isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'),
                  animation: isLive ? 'pulse 1.5s infinite' : 'none',
                }}
              />
              LIVE
            </button>

            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0 ${compareMode ? 'text-foreground' : 'text-muted-foreground'}`}
              style={{
                background: compareMode ? 'rgba(10,132,255,0.15)' : (isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'),
                border: compareMode ? '1px solid #0a84ff' : `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              <GitCompareArrows size={14} /> Compare
            </button>

            {compareMode && (
              <>
                <span className="text-xs text-muted-foreground">vs</span>
                <select
                  value={compareAsset}
                  onChange={e => setCompareAsset(e.target.value)}
                  className="h-11 md:h-9 rounded-xl bg-background text-foreground text-sm px-3 focus:outline-none"
                  style={{ border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  {allAssetsList
                    .filter(a => a.symbol !== selectedAsset)
                    .map(a => (
                      <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                    ))}
                </select>
              </>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowShortcuts(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl surface-1 text-xs font-medium text-muted-foreground apple-transition hover:text-foreground"
              >
                <Keyboard size={14} /> Shortcuts
              </button>

              <button
                onClick={() => setShowShare(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium apple-transition min-h-[44px] md:min-h-0 ${isMobile ? 'w-full justify-center' : ''}`}
                style={{ background: '#e6007a', color: '#fff', border: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cc0066'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e6007a'; }}
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {useCompare ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: isLight ? '#0055d4' : '#f5f5f7' }} />
                <span className="text-xs text-foreground font-medium">{selectedAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct1) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct1) >= 0 ? '+' : ''}{pct1}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: isLight ? '#e6007a' : '#0a84ff' }} />
                <span className="text-xs font-medium" style={{ color: isLight ? '#e6007a' : '#0a84ff' }}>{compareAsset}</span>
                <span className={`text-xs tabular-nums ${parseFloat(pct2) >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {parseFloat(pct2) >= 0 ? '+' : ''}{pct2}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 w-fit">
              {[
                { label: 'Bid', active: showBid, toggle: () => setShowBid(!showBid), color: isLight ? '#0055d4' : '#0a84ff' },
                { label: 'Ask', active: showAsk, toggle: () => setShowAsk(!showAsk), color: isLight ? '#cc2200' : '#ff453a' },
                { label: 'Confidence', active: showConfidence, toggle: () => setShowConfidence(!showConfidence), color: '#e6007a' },
              ].map(t => (
                <button
                  key={t.label}
                  onClick={t.toggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium min-h-[44px] md:min-h-0"
                  style={{
                    background: t.active ? togglePillActiveBg : togglePillInactiveBg,
                    color: t.active ? togglePillActiveText : togglePillInactiveText,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: t.color,
                      opacity: t.active ? 1 : 0.3,
                      transition: 'opacity 0.15s ease',
                    }}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 p-1 rounded-full surface-1 overflow-x-auto scrollbar-hide">
              {timeframes.map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    setFrame(0);
                    setPlaying(false);
                    setIsLive(false);
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium apple-transition flex-shrink-0 min-h-[44px] md:min-h-0 ${timeframe === tf ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  style={timeframe === tf ? { background: '#e6007a', color: '#fff' } : {}}
                >
                  {timeframeLabels[tf]}
                </button>
              ))}
            </div>

            {(timeframe === '50ms' || timeframe === '200ms') && (
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide flex-shrink-0"
                style={{
                  color: '#e6007a',
                  background: 'rgba(230,0,122,0.1)',
                  border: '1px solid rgba(230,0,122,0.2)',
                }}
              >
                <img src={pythLogo} alt="Pyth" width={14} height={14} className="inline-block" /> Pyth Pro Only
              </span>
            )}
          </div>

          <div className="flex items-baseline justify-between">
            {dataLoading ? (
              <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }} />
            ) : (
              <span className="tabular-nums" style={{ fontSize: 32, fontWeight: 600, color: isLight ? '#1d1d1f' : '#fff' }}>
                ${formatPrice(current.price)}
              </span>
            )}

            {!dataLoading && (
              <span
                className="tabular-nums"
                style={{
                  fontSize: 14,
                  color: priceChange >= 0 ? (isLight ? '#1a8f35' : '#32d74b') : (isLight ? '#cc2200' : '#ff453a'),
                }}
              >
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}
              </span>
            )}
          </div>

          <div
            className="text-xs"
            style={{ color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}
          >
            Frame time: {formatReplayTimestamp(current.timestamp_us)}
          </div>

          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              height: isMobile ? 160 : undefined,
              flex: isMobile ? 'none' : 1,
              minHeight: isMobile ? undefined : 200,
              background: isLight ? '#fff' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {!useCompare && timeframe !== '1s' ? (
              <TimeframeChart
                rawData={data}
                timeframe={timeframe}
                frame={frame}
                chartWidth={chartWidth}
                chartHeight={chartHeight}
                isLight={isLight}
                showBid={showBid}
                showAsk={showAsk}
                showConfidence={showConfidence}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rechartsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)'} />
                  <YAxis domain={[minP, maxP]} hide />

                  {!useCompare && showConfidence && (
                    <Line type="monotone" dataKey="confidenceUpper" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
                  )}
                  {!useCompare && showConfidence && (
                    <Line type="monotone" dataKey="confidenceLower" stroke="rgba(230,0,122,0.4)" strokeWidth={1} dot={false} isAnimationActive={false} />
                  )}
                  {!useCompare && showBid && (
                    <Line type="monotone" dataKey="bid" stroke={isLight ? '#0055d4' : '#0a84ff'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
                  )}
                  {!useCompare && showAsk && (
                    <Line type="monotone" dataKey="ask" stroke={isLight ? '#cc2200' : '#ff453a'} strokeWidth={1} dot={false} isAnimationActive={false} opacity={0.5} connectNulls={false} />
                  )}

                  <Line
                    type="monotone"
                    dataKey={useCompare ? 'pct1' : 'price'}
                    stroke={useCompare ? (isLight ? '#0055d4' : '#f5f5f7') : (isLight ? '#1d1d1f' : '#fff')}
                    strokeWidth={isLight ? 2 : 1.5}
                    dot={false}
                    isAnimationActive={false}
                  />

                  {useCompare && (
                    <Line type="monotone" dataKey="pct2" stroke={isLight ? '#e6007a' : '#0a84ff'} strokeWidth={2} dot={false} isAnimationActive={false} />
                  )}

                  <ReferenceLine x={frame} stroke="#e6007a" strokeOpacity={0.5} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {!useCompare && (
            <div style={{ height: spreadChartH }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="label-caps">Spread Width</span>
                <span className="text-sm tabular-nums text-foreground font-medium">{formatSpread(current.spread)}</span>
              </div>

              <div style={{ width: '100%', height: spreadChartH - 16 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rechartsData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <YAxis domain={[0, maxSpread > 0 ? maxSpread * 1.1 : 1]} hide />
                    <Line type="monotone" dataKey="spread" stroke="#e6007a" strokeWidth={isLight ? 2 : 1.5} dot={false} isAnimationActive={false} />
                    <ReferenceLine x={frame} stroke="#e6007a" strokeOpacity={0.3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <ShockPropagation sourceAsset={selectedAsset} currentFrame={frame} />

          <div className="flex flex-col items-center" style={{ gap: 4 }}>
            <div className="w-full relative flex items-center" style={{ height: 32 }}>
              {timelineMarkers.map((m: any, i) => (
                <div
                  key={`tm-${i}`}
                  className="absolute -top-1 w-2 h-2 rotate-45 cursor-pointer"
                  style={{
                    left: `${data.length > 1 ? (m.frame / (data.length - 1)) * 100 : 0}%`,
                    background: m.isClickedEvent ? '#e6007a' : '#e6007a',
                    outline: isLight ? '1.5px solid #1d1d1f' : 'none',
                    zIndex: 10,
                  }}
                  title={m.label}
                  onClick={() => setFrame(m.frame)}
                />
              ))}

              <div
                className="absolute -top-1 w-2 h-2 rotate-45"
                style={{
                  left: `${data.length > 1 ? (maxSpreadIdx / (data.length - 1)) * 100 : 0}%`,
                  background: '#f97316',
                  outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(249,115,22,0.5)',
                }}
                title="Max Spread"
              />
              <div
                className="absolute -top-1 w-2 h-2 rotate-45"
                style={{
                  left: `${data.length > 1 ? (minConfIdx / (data.length - 1)) * 100 : 0}%`,
                  background: '#9333ea',
                  outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(147,51,234,0.5)',
                }}
                title="Max Confidence Expansion"
              />
              <div
                className="absolute -top-1 w-2 h-2 rotate-45"
                style={{
                  left: `${data.length > 1 ? (peakVolIdx / (data.length - 1)) * 100 : 0}%`,
                  background: isLight ? '#1d1d1f' : '#f5f5f7',
                  outline: isLight ? '1.5px solid #1d1d1f' : '1px solid rgba(255,255,255,0.5)',
                }}
                title="Peak Volatility"
              />

              {useCompare && [120, 280, 380].map((pos, i) => (
                <div
                  key={`c${i}`}
                  className="absolute -top-1 w-2 h-2 rotate-45"
                  style={{
                    left: `${data.length > 1 ? (Math.min(pos, data.length - 1) / (data.length - 1)) * 100 : 0}%`,
                    background: isLight ? '#e6007a' : '#0a84ff',
                    outline: isLight ? '1.5px solid #1d1d1f' : 'none',
                  }}
                />
              ))}

              <input
                type="range"
                min={0}
                max={Math.max(0, data.length - 1)}
                value={frame}
                onChange={e => handleScrub(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #e6007a 0%, #e6007a ${data.length > 1 ? (frame / (data.length - 1)) * 100 : 0}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} ${data.length > 1 ? (frame / (data.length - 1)) * 100 : 0}%, ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'} 100%)`,
                }}
              />
            </div>

            <div
              className="rounded-full px-3 md:px-4 flex items-center gap-2 md:gap-4"
              style={{
                height: 56,
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isLight ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <button onClick={() => setFrame(Math.max(0, frame - 10))} className="text-muted-foreground hover:text-foreground apple-transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">
                <SkipBack size={16} />
              </button>

              <button onClick={() => setPlaying(!playing)} className="w-9 h-9 rounded-full flex items-center justify-center apple-transition" style={{ background: '#e6007a' }}>
                {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" className="ml-0.5" />}
              </button>

              <button onClick={() => setFrame(Math.min(data.length - 1, frame + 10))} className="text-muted-foreground hover:text-foreground apple-transition min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center">
                <SkipForward size={16} />
              </button>

              <div className="h-4 w-px bg-border" />

              <div className="flex items-center gap-0.5">
                {speeds.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-1.5 md:px-2 py-0.5 rounded-full text-[11px] md:text-[10px] font-medium apple-transition min-h-[44px] md:min-h-0 flex items-center ${speed === s ? 'surface-2 text-foreground inner-glow' : 'text-muted-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isMobile && (
            <button
              onClick={() => setShowShare(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: '#e6007a', color: '#fff' }}
            >
              <Share2 size={16} /> Share This Replay
            </button>
          )}

          {isMobile && (
            <div
              className="mt-4 p-4 rounded-2xl"
              style={{
                background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {inspectorPanel}
            </div>
          )}
        </div>

        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="w-80 p-6 overflow-y-auto"
            style={{
              background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
              borderLeft: '2px solid #e6007a',
              boxShadow: isLight ? '-4px 0 24px rgba(0,0,0,0.06)' : '-4px 0 24px rgba(0,0,0,0.3)',
            }}
          >
            {inspectorPanel}
          </motion.div>
        )}
      </div>

      <ShortcutsModal open={showShortcuts} onOpenChange={setShowShortcuts} />

      <ShareModal
        open={showShare}
        onOpenChange={setShowShare}
        asset={selectedAsset}
        frame={frame}
        frameData={current}
        recentPrices={data.slice(Math.max(0, frame - 59), frame + 1).map(d => d.price)}
        allFrames={data}
        eventName={
          eventPositions.some(p => Math.abs(frame - p) < 15)
            ? ['Flash Crash', 'Spread Spike', 'Recovery', 'Confidence Drop'][eventPositions.findIndex(p => Math.abs(frame - p) < 15)] + ` — Frame ${frame}`
            : undefined
        }
      />
    </div>
  );
}