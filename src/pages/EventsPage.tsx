import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import { MarketEvent } from '@/lib/mockData';
import { fetchEvents, fetchEventStats } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { Clock, ChevronRight, AlertTriangle, TrendingUp, Activity, ShieldAlert } from 'lucide-react';

const filters = [
  { label: 'All', type: null, color: null },
  { label: 'Crash', type: 'crash', color: '#ff453a' },
  { label: 'Pump', type: 'pump', color: '#32d74b' },
  { label: 'Spread Spike', type: 'spread', color: '#ffd60a' },
  { label: 'Confidence Drop', type: 'confidence', color: '#bf5af2' },
  { label: 'Divergence', type: 'divergence', color: '#6e6ef5' },
];

const typeConfig: Record<string, { color: string; label: string; borderColor: string; icon: any }> = {
  crash: { color: '#ff453a', label: 'CRASH', borderColor: '#ff453a', icon: AlertTriangle },
  pump: { color: '#32d74b', label: 'PUMP', borderColor: '#32d74b', icon: TrendingUp },
  spread: { color: '#ffd60a', label: 'SPREAD SPIKE', borderColor: '#ffd60a', icon: Activity },
  confidence: { color: '#bf5af2', label: 'CONFIDENCE DROP', borderColor: '#bf5af2', icon: ShieldAlert },
  divergence: { color: '#6e6ef5', label: 'DIVERGENCE', borderColor: '#6e6ef5', icon: Activity },
};

interface ApiEvent {
  id: string;
  asset: string;
  event_type: string;
  start_time: string;
  end_time: string;
  first_price: number | string;
  last_price: number | string;
  max_spread: number | string;
  baseline_spread: number | string;
  duration_ms: number | string;
  created_at: string;
}

interface EventMetric {
  label: string;
  value: string;
}

interface EnrichedMarketEvent extends MarketEvent {
  metrics: EventMetric[];
  sparkline?: number[];
  rawType?: string;
  aiExplanation?: string;
  featuredTimestamp?: string;
}

function mapApiEventType(event: ApiEvent): keyof typeof typeConfig {
  if (event.event_type === 'volatility_spike') {
    return Number(event.last_price) > Number(event.first_price) ? 'pump' : 'crash';
  }
  if (event.event_type === 'spread_spike') {
    return 'spread';
  }
  if (event.event_type === 'confidence_divergence') {
    return 'confidence';
  }
  return 'confidence';
}

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

function formatTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  return date.toLocaleString();
}

function formatAbsoluteTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString();
}

function formatSignedPercent(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

function formatDurationMs(durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '—';
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  return `${(durationMs / 60000).toFixed(1)}m`;
}

function formatSpreadDisplay(value: number) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (abs >= 1) return value.toFixed(2);
  if (abs >= 0.01) return value.toFixed(4);
  if (abs >= 0.0001) return value.toFixed(6);
  return value.toFixed(8);
}

function formatPriceDisplay(value: number) {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (abs >= 1) return value.toFixed(2);
  if (abs >= 0.01) return value.toFixed(4);
  if (abs >= 0.0001) return value.toFixed(6);
  return value.toFixed(8);
}

function generateEventSparkline(type: string, intensity = 1): number[] {
  const points: number[] = [];
  let val = 100;

  for (let i = 0; i < 30; i++) {
    const t = i / 29;

    if (type === 'crash') {
      if (t > 0.28 && t < 0.5) val -= (1.8 + Math.random() * 1.4) * intensity;
      else if (t >= 0.5) val += (0.25 + Math.random() * 0.35) * intensity;
      else val += (Math.random() - 0.5) * 0.25;
    } else if (type === 'pump') {
      if (t > 0.28 && t < 0.58) val += (1.2 + Math.random() * 1.1) * intensity;
      else val += (Math.random() - 0.5) * 0.25;
    } else if (type === 'spread') {
      val += (Math.random() - 0.5) * (t > 0.3 && t < 0.62 ? 2.8 * intensity : 0.4);
    } else if (type === 'divergence' || type === 'confidence') {
      val += (Math.random() - 0.5) * (t > 0.2 && t < 0.75 ? 3.2 * intensity : 0.35);
    } else {
      val += (Math.random() - 0.5) * 0.7;
    }

    points.push(val);
  }

  return points;
}

function mapApiEvent(event: ApiEvent): EnrichedMarketEvent {
  const type = mapApiEventType(event);
  const conf = typeConfig[type] ?? typeConfig.confidence;

  const exp = assetExponents[event.asset] ?? -8;
  const mult = Math.pow(10, exp);

  const first = Number(event.first_price) * mult;
  const last = Number(event.last_price) * mult;
  const durationMs = Number(event.duration_ms);
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;

  let description = '';
  let metrics: EventMetric[] = [];
  let aiExplanation = '';

  switch (event.event_type) {
    case 'volatility_spike': {
      const dirWord = last > first ? 'surged' : 'dropped';
      const absPct = Math.abs(pct);
      description = `Price ${dirWord} ${absPct.toFixed(2)}% during a sharp volatility window.`;

      metrics = [
        { label: 'PRICE MOVE', value: formatSignedPercent(pct) },
        { label: 'EVENT DURATION', value: formatDurationMs(durationMs) },
        { label: 'CLOSE PRICE', value: `$${formatPriceDisplay(last)}` },
      ];

      aiExplanation =
        last > first
          ? 'Likely cause: rapid directional buying or thin liquidity during a fast upward move.'
          : 'Likely cause: aggressive selling pressure or liquidity withdrawal during a fast downward move.';
      break;
    }

    case 'spread_spike': {
      const baseline = Number(event.baseline_spread) * mult;
      const max = Number(event.max_spread) * mult;
      const ratio = baseline > 0 ? max / baseline : 0;

      description = 'Bid/ask spread expanded sharply beyond its normal baseline.';
      metrics = [
        { label: 'MAX SPREAD', value: formatSpreadDisplay(max) },
        { label: 'BASELINE MULTIPLIER', value: baseline > 0 ? `${ratio.toFixed(1)}x` : 'No baseline' },
        { label: 'EVENT DURATION', value: formatDurationMs(durationMs) },
      ];

      aiExplanation =
        baseline > 0
          ? `Likely cause: liquidity withdrawal during rapid price movement. Spread expanded ${ratio.toFixed(1)}× normal baseline.`
          : 'Likely cause: temporary market dislocation with insufficient stable baseline data.';
      break;
    }

    case 'confidence_divergence':
    default: {
      description = 'Confidence interval expanded materially, suggesting unusual feed disagreement or uncertainty.';
      metrics = [
        { label: 'EVENT DURATION', value: formatDurationMs(durationMs) },
        { label: 'PRICE MOVE', value: formatSignedPercent(pct) },
        { label: 'SIGNAL', value: 'Feed mismatch' },
      ];

      aiExplanation =
        'Likely cause: temporary disagreement across market inputs or elevated uncertainty during this window.';
      break;
    }
  }

  const intensity = Math.max(1, Math.min(2.5, Math.abs(pct) / 3 || 1));

  return {
    id: event.id,
    type,
    asset: event.asset,
    description,
    timestamp: formatTimestamp(event.created_at),
    featuredTimestamp: formatAbsoluteTimestamp(event.created_at),
    color: conf.color,
    metrics,
    sparkline: generateEventSparkline(type, intensity),
    rawType: event.event_type,
    aiExplanation,
  };
}

function MiniSparkline({
  data,
  color,
  width = 80,
  height = 40,
  fill = false,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  });

  const points = pts.join(' ');
  const fillPoints = fill ? `0,${height} ${points} ${width},${height}` : '';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {fill && <polygon points={fillPoints} fill={color} opacity="0.1" />}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={fill ? '2' : '1.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const L = theme === 'light';

  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [events, setEvents] = useState<EnrichedMarketEvent[]>([]);
  const [rawEvents, setRawEvents] = useState<ApiEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [crashCount, setCrashCount] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);
  const [mostActive, setMostActive] = useState('—');

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const stats = await fetchEventStats();
        if (!isMounted) return;

        setTotalCount(stats.total);
        setCrashCount(stats.crashes);
        setAvgDuration(stats.avg_duration_ms / 1000);
        setMostActive(stats.most_active);
      } catch (error) {
        console.error('Failed to load event stats', error);
      }
    }

    loadStats();
    const interval = window.setInterval(loadStats, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        let apiType: string | undefined = undefined;

        if (activeFilter === 'crash' || activeFilter === 'pump') apiType = 'volatility_spike';
        else if (activeFilter === 'spread') apiType = 'spread_spike';
        else if (activeFilter === 'confidence' || activeFilter === 'divergence') apiType = 'confidence_divergence';

        const limit = activeFilter ? 100 : 200;
        let data = (await fetchEvents(limit, apiType)) as ApiEvent[];
        if (!isMounted) return;

        if (activeFilter === 'crash') {
          data = data.filter((e) => Number(e.last_price) < Number(e.first_price));
        } else if (activeFilter === 'pump') {
          data = data.filter((e) => Number(e.last_price) > Number(e.first_price));
        }

        setRawEvents(data);
        setEvents(data.map(mapApiEvent));
      } catch (error) {
        console.error('Failed to load events', error);
      }
    }

    loadEvents();
    const interval = window.setInterval(loadEvents, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [activeFilter]);

  const filtered = events;

  const featuredEvent = useMemo(() => {
    if (!rawEvents.length) return null;

    const scored = rawEvents
      .map((event) => {
        const exp = assetExponents[event.asset] ?? -8;
        const mult = Math.pow(10, exp);

        const first = Number(event.first_price) * mult;
        const last = Number(event.last_price) * mult;
        const duration = Number(event.duration_ms || 0);
        const pct = first > 0 ? Math.abs(((last - first) / first) * 100) : 0;

        let score = pct;

        if (event.event_type === 'spread_spike') {
          const baseline = Number(event.baseline_spread) * mult;
          const max = Number(event.max_spread) * mult;
          const ratio = baseline > 0 ? max / baseline : 0;
          score = Math.max(score, ratio * 4);
        }

        if (event.event_type === 'confidence_divergence') {
          score = Math.max(score, duration / 1000);
        }

        return { event, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0]?.event ? mapApiEvent(scored[0].event) : null;
  }, [rawEvents]);

  const stats = [
    { label: 'Total Events', value: totalCount.toLocaleString(), accent: 'rgba(255,255,255,0.15)' },
    { label: 'Crashes Detected', value: crashCount.toLocaleString(), accent: '#ff453a' },
    { label: 'Avg Duration', value: `${avgDuration.toFixed(1)}s`, accent: '#0a84ff' },
    { label: 'Most Active', value: mostActive, accent: '#e6007a' },
  ];

  const activeTypeConfig = featuredEvent ? typeConfig[featuredEvent.type] || typeConfig.confidence : typeConfig.confidence;
  const FeaturedIcon = activeTypeConfig.icon;

  return (
    <div className="min-h-screen bg-background pt-14" style={{ paddingBottom: 80 }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-0">
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.15em',
                color: '#e6007a',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              MARKET EVENTS
            </div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 300,
                color: L ? '#1d1d1f' : '#fff',
                marginTop: 4,
                lineHeight: 1.1,
              }}
            >
              Events
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums"
              style={{
                background: L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 12,
              }}
            >
              <span style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>
                {totalCount.toLocaleString()} EVENTS RECORDED
              </span>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`,
                fontSize: 12,
              }}
            >
              <div className="w-2 h-2 rounded-full pulse-red" style={{ background: '#e6007a' }} />
              <span style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>RECORDING LIVE</span>
            </div>
          </div>
        </div>

        <div className="my-5" style={{ height: 1, background: L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden mb-8"
          style={{
            background: L ? '#ffffff' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${L ? 'rgba(230,0,122,0.2)' : 'rgba(230,0,122,0.3)'}`,
            borderLeft: '3px solid #e6007a',
            borderRadius: 16,
            boxShadow: L ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 p-5 md:p-6" style={{ flex: '0 0 62%' }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  color: '#e6007a',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  marginBottom: 12,
                }}
              >
                MOST DRAMATIC EVENT
              </div>

              {featuredEvent ? (
                <>
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span style={{ fontSize: 28, fontWeight: 600, color: L ? '#1d1d1f' : '#fff' }}>
                      {featuredEvent.asset}
                    </span>

                    <span
                      className="tabular-nums inline-flex items-center gap-1.5"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        background: `${activeTypeConfig.color}1f`,
                        border: `1px solid ${activeTypeConfig.color}4d`,
                        color: activeTypeConfig.color,
                        padding: '3px 10px',
                        borderRadius: 100,
                        fontWeight: 500,
                      }}
                    >
                      <FeaturedIcon size={11} />
                      {activeTypeConfig.label}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: L ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)',
                      lineHeight: 1.5,
                      marginBottom: 12,
                    }}
                  >
                    {featuredEvent.description}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {featuredEvent.metrics.map((metric, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl px-3 py-2"
                        style={{
                          background: L ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: L ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)',
                            marginBottom: 4,
                          }}
                        >
                          {metric.label}
                        </div>
                        <div
                          className="tabular-nums"
                          style={{
                            fontSize: 13,
                            color: L ? '#1d1d1f' : '#fff',
                            fontWeight: 500,
                          }}
                        >
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {featuredEvent.aiExplanation && (
                    <div
                      className="rounded-xl px-4 py-3 mb-4"
                      style={{
                        background: L ? 'rgba(230,0,122,0.035)' : 'rgba(230,0,122,0.06)',
                        border: `1px solid ${L ? 'rgba(230,0,122,0.12)' : 'rgba(230,0,122,0.18)'}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#e6007a',
                          fontWeight: 600,
                          marginBottom: 6,
                        }}
                      >
                        AI EXPLANATION
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: L ? 'rgba(0,0,0,0.62)' : 'rgba(255,255,255,0.72)',
                        }}
                      >
                        {featuredEvent.aiExplanation}
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 12,
                      color: L ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
                      marginBottom: 20,
                    }}
                  >
                    {featuredEvent.featuredTimestamp}
                  </div>

                  <button
                    onClick={() => navigate(`/replay?asset=${encodeURIComponent(featuredEvent.asset)}&eventId=${featuredEvent.id}`)}
                    className="inline-flex items-center justify-center text-sm font-medium apple-transition min-h-[44px]"
                    style={{
                      background: '#e6007a',
                      color: '#fff',
                      borderRadius: 12,
                      padding: '12px 24px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#cc0066';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#e6007a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Replay this moment →
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 24, fontWeight: 600, color: L ? '#1d1d1f' : '#fff', marginBottom: 8 }}>
                    Waiting for first event
                  </div>
                  <div style={{ fontSize: 14, color: L ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }}>
                    As soon as Market DVR detects a significant event, it will appear here.
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center p-5 md:p-6" style={{ flex: '0 0 38%' }}>
              <MiniSparkline
                data={featuredEvent?.sparkline || []}
                color={activeTypeConfig.color}
                width={220}
                height={90}
                fill
              />
            </div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {filters.map((f) => {
            const isActive = activeFilter === f.type;
            return (
              <button
                key={f.label}
                onClick={() => setActiveFilter(f.type)}
                className="flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap"
                style={{
                  height: 32,
                  padding: '0 16px',
                  borderRadius: 100,
                  fontSize: 12,
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  background: isActive ? 'rgba(230,0,122,0.12)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(230,0,122,0.4)'
                    : `1px solid ${L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#e6007a' : L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.color && <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.color }} />}
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-4 relative overflow-hidden group cursor-default"
              style={{
                background: L ? '#ffffff' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: L ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: stat.accent }} />
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: L ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)',
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                {stat.label}
              </div>
              <div
                className="tabular-nums"
                style={{ fontSize: 36, fontWeight: 600, color: L ? '#1d1d1f' : '#fff', lineHeight: 1 }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((event, i) => (
              <EventCard
                key={event.id + i}
                event={event}
                index={i}
                isLight={L}
                navigate={navigate}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock size={48} style={{ color: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)' }} />
              <div className="mt-4" style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', fontSize: 15 }}>
                No events recorded yet
              </div>
              <div className="mt-1" style={{ color: L ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                Market DVR is recording live — events will appear here automatically
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event,
  index,
  isLight,
  navigate,
}: {
  event: EnrichedMarketEvent;
  index: number;
  isLight: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const L = isLight;
  const conf = typeConfig[event.type] || typeConfig.confidence;
  const Icon = conf.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.22 }}
      className="group relative overflow-hidden"
      style={{
        background: L ? '#ffffff' : 'rgba(255,255,255,0.02)',
        borderTop: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderRight: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderBottom: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${conf.borderColor}`,
        borderRadius: 14,
        boxShadow: L ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = L ? '#f9f9f9' : 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderTopColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderRightColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderBottomColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = L ? '#ffffff' : 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderTopColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderRightColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderBottomColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      }}
    >
      <div className="p-4 md:p-5">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div
              className="flex-shrink-0 rounded-xl flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                background: `${conf.color}1a`,
                border: `1px solid ${conf.color}33`,
                color: conf.color,
              }}
            >
              <Icon size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span style={{ fontSize: 16, fontWeight: 600, color: L ? '#1d1d1f' : '#fff' }}>
                  {event.asset}
                </span>

                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    background: `${conf.color}1f`,
                    border: `1px solid ${conf.color}4d`,
                    color: conf.color,
                    padding: '3px 9px',
                    borderRadius: 100,
                  }}
                >
                  {conf.label}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: L ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.28)',
                  }}
                >
                  {event.timestamp}
                </span>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: L ? 'rgba(0,0,0,0.48)' : 'rgba(255,255,255,0.54)',
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {event.description}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {event.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="rounded-full px-3 py-1.5 tabular-nums"
                    style={{
                      fontSize: 11,
                      background: L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
                      color: L ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <span style={{ opacity: 0.7, marginRight: 6 }}>{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                ))}
              </div>

              {event.aiExplanation && (
                <div
                  className="rounded-xl px-3 py-2"
                  style={{
                    background: L ? 'rgba(230,0,122,0.03)' : 'rgba(230,0,122,0.05)',
                    border: `1px solid ${L ? 'rgba(230,0,122,0.1)' : 'rgba(230,0,122,0.16)'}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#e6007a',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    AI EXPLANATION
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      color: L ? 'rgba(0,0,0,0.56)' : 'rgba(255,255,255,0.66)',
                    }}
                  >
                    {event.aiExplanation}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 lg:flex-shrink-0">
            <div className="hidden sm:block">
              <MiniSparkline data={event.sparkline || []} color={conf.color} width={96} height={44} />
            </div>

            <button
              onClick={() => navigate(`/replay?asset=${encodeURIComponent(event.asset)}&eventId=${event.id}`)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium apple-transition min-h-[44px] w-full sm:w-auto"
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: `1px solid ${L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
                color: L ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e6007a';
                e.currentTarget.style.color = '#e6007a';
                e.currentTarget.style.background = 'rgba(230,0,122,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = L ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Replay
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}