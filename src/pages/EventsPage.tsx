import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { MarketEvent } from '@/lib/mockData';
import { fetchEvents, fetchEventCount } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { Clock } from 'lucide-react';

const filters = [
  { label: 'All', type: null, color: null },
  { label: 'Crash', type: 'crash', color: '#ff453a' },
  { label: 'Pump', type: 'pump', color: '#32d74b' },
  { label: 'Spread Spike', type: 'spread', color: '#ffd60a' },
  { label: 'Confidence Drop', type: 'confidence', color: '#bf5af2' },
  { label: 'Divergence', type: 'divergence', color: '#6e6ef5' },
];

const typeConfig: Record<string, { color: string; label: string; borderColor: string }> = {
  crash: { color: '#ff453a', label: 'CRASH', borderColor: '#ff453a' },
  pump: { color: '#32d74b', label: 'PUMP', borderColor: '#32d74b' },
  spread: { color: '#ffd60a', label: 'SPREAD SPIKE', borderColor: '#ffd60a' },
  confidence: { color: '#bf5af2', label: 'CONFIDENCE DROP', borderColor: '#bf5af2' },
  divergence: { color: '#6e6ef5', label: 'DIVERGENCE', borderColor: '#6e6ef5' },
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

function mapApiEventType(event: ApiEvent): keyof typeof typeConfig {
  if (event.event_type === 'volatility_spike') {
    return event.last_price > event.first_price ? 'pump' : 'crash';
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
  'BTC/USD': -8, 'ETH/USD': -8, 'SOL/USD': -8, 'BNB/USD': -8,
  'BONK/USD': -10, 'WIF/USD': -8, 'DOGE/USD': -8, 'PYTH/USD': -8,
  'XAU/USD': -3, 'XAG/USD': -5, 'EUR/USD': -5, 'GBP/USD': -5,
  'USD/JPY': -3, 'USD/CHF': -5, 'AUD/USD': -5, 'USD/CAD': -5,
};

function formatTimestamp(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return createdAt;
  return date.toLocaleString();
}

function mapApiEvent(event: ApiEvent): MarketEvent {
  const type = mapApiEventType(event);
  const conf = typeConfig[type] ?? typeConfig.confidence;

  let description: string;
  switch (event.event_type) {
    case 'volatility_spike': {
      const first = Number(event.first_price);
      const last = Number(event.last_price);
      const durationMs = Number(event.duration_ms);
      const pct =
        first > 0
          ? ((last - first) / first) * 100
          : 0;
      const dir = last > first ? 'surged' : 'dropped';
      description = `Volatility spike — price ${dir} ${pct.toFixed(2)}% over ${(durationMs / 1000).toFixed(1)}s`;
      break;
    }
    case 'spread_spike': {
      const exp = assetExponents[event.asset] || -8;
      const mult = Math.pow(10, exp);
      let baseline = Number(event.baseline_spread) * mult;
      let max = Number(event.max_spread) * mult;
      
      const ratio = baseline > 0 ? max / baseline : 0;
      description = `Spread spike — bid/ask spread widened to ${max.toFixed(2)} (≈${ratio.toFixed(1)}x baseline)`;
      break;
    }
    case 'confidence_divergence':
    default: {
      description = 'Confidence divergence — data sources disagreed materially during this window';
      break;
    }
  }

  return {
    id: event.id,
    type: type as any,
    asset: event.asset,
    description,
    timestamp: formatTimestamp(event.created_at),
    color: conf.color,
  };
}

function generateEventSparkline(type: string): number[] {
  const points: number[] = [];
  let val = 100;
  for (let i = 0; i < 30; i++) {
    const t = i / 29;
    if (type === 'crash') {
      if (t > 0.3 && t < 0.5) val -= 2 + Math.random() * 1.5;
      else if (t > 0.5) val += 0.3 + Math.random() * 0.5;
      else val += (Math.random() - 0.5) * 0.3;
    } else if (type === 'pump') {
      if (t > 0.3 && t < 0.6) val += 1.5 + Math.random() * 1;
      else val += (Math.random() - 0.5) * 0.3;
    } else if (type === 'spread') {
      val += (Math.random() - 0.5) * (t > 0.3 && t < 0.6 ? 3 : 0.5);
    } else if (type === 'divergence') {
      val += (Math.random() - 0.5) * (t > 0.2 && t < 0.7 ? 4 : 0.3);
    } else {
      val += (Math.random() - 0.5) * 0.8;
    }
    points.push(val);
  }
  return points;
}

function MiniSparkline({ data, color, width = 80, height = 40, fill = false }: { data: number[]; color: string; width?: number; height?: number; fill?: boolean }) {
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
      <polyline points={points} fill="none" stroke={color} strokeWidth={fill ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const L = theme === 'light';
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [rawEvents, setRawEvents] = useState<ApiEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadCount() {
      try {
        const count = await fetchEventCount();
        if (isMounted) setTotalCount(count);
      } catch (error) {
        console.error('Failed to load event count', error);
      }
    }
    loadCount();
    const interval = window.setInterval(loadCount, 10000);
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
        let data = await fetchEvents(limit, apiType) as ApiEvent[];
        if (!isMounted) return;
        
        if (activeFilter === 'crash') {
          data = data.filter(e => Number(e.last_price) < Number(e.first_price));
        } else if (activeFilter === 'pump') {
          data = data.filter(e => Number(e.last_price) > Number(e.first_price));
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

  const featuredEvent: MarketEvent | null = events[0] ?? null;
  const featuredSparkline = featuredEvent ? generateEventSparkline(featuredEvent.type) : [];
  const featConf = featuredEvent ? (typeConfig[featuredEvent.type] || typeConfig.crash) : typeConfig.crash;

  const totalEvents = totalCount;
  const crashesDetected = events.filter(e => e.type === 'crash').length;
  const avgDurationSeconds =
    rawEvents.length > 0
      ? rawEvents.reduce((sum, ev) => sum + Number(ev.duration_ms || 0), 0) / rawEvents.length / 1000
      : 0;
  const mostActive =
    rawEvents.length > 0
      ? (() => {
          const counts: Record<string, number> = {};
          rawEvents.forEach(ev => {
            counts[ev.asset] = (counts[ev.asset] || 0) + 1;
          });
          return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
        })()
      : '—';

  const stats = [
    { label: 'Total Events', value: totalEvents.toLocaleString(), accent: 'rgba(255,255,255,0.15)' },
    { label: 'Crashes Detected', value: crashesDetected.toString(), accent: '#ff453a' },
    { label: 'Avg Duration', value: `${avgDurationSeconds.toFixed(1)}s`, accent: '#0a84ff' },
    { label: 'Most Active', value: mostActive, accent: '#e6007a' },
  ];

  return (
    <div className="min-h-screen bg-background pt-14" style={{ paddingBottom: 80 }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* #1: Page header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-0">
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#e6007a', textTransform: 'uppercase' as const, fontWeight: 500 }}>
              MARKET EVENTS
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 300, color: L ? '#1d1d1f' : '#fff', marginTop: 4, lineHeight: 1.1 }}>Events</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums"
              style={{ background: L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px solid ${L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, fontSize: 12 }}
            >
              <span style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>
                {totalEvents.toLocaleString()} EVENTS RECORDED
              </span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: L ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)', border: `1px solid ${L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}`, fontSize: 12 }}
            >
              <div className="w-2 h-2 rounded-full pulse-red" style={{ background: '#e6007a' }} />
              <span style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>RECORDING LIVE</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-5" style={{ height: 1, background: L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }} />

        {/* #2: Featured event */}
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
          <div className="flex flex-col sm:flex-row">
            {/* Content 60% */}
            <div className="flex-1 p-5 md:p-6" style={{ flex: '0 0 60%' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#e6007a', textTransform: 'uppercase' as const, fontWeight: 500, marginBottom: 12 }}>
                MOST DRAMATIC EVENT
              </div>
              <div className="flex items-center gap-3 mb-2">
                <span style={{ fontSize: 28, fontWeight: 600, color: L ? '#1d1d1f' : '#fff' }}>{featuredEvent?.asset ?? 'Waiting for first event'}</span>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    background: `${featConf.color}1f`,
                    border: `1px solid ${featConf.color}4d`,
                    color: featConf.color,
                    padding: '3px 10px',
                    borderRadius: 100,
                    fontWeight: 500,
                  }}
                >
                  {featConf.label}
                </span>
              </div>
              <div style={{ fontSize: 14, color: L ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 8 }}>
                {featuredEvent?.description ?? 'As soon as Market DVR detects a significant event, it will appear here.'}
              </div>
              <div style={{ fontSize: 12, color: L ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
                {featuredEvent?.timestamp ?? ''}
              </div>
              <button
                onClick={() => {
                  if (featuredEvent) {
                    navigate(`/replay?asset=${encodeURIComponent(featuredEvent.asset)}&eventId=${featuredEvent.id}`);
                  }
                }}
                className="inline-flex items-center justify-center text-sm font-medium apple-transition min-h-[44px]"
                style={{ background: '#e6007a', color: '#fff', borderRadius: 12, padding: '12px 24px', fontWeight: 500, transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cc0066'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e6007a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Replay this moment →
              </button>
            </div>
            {/* Chart 40% */}
            <div className="flex items-center justify-center p-5 md:p-6" style={{ flex: '0 0 40%' }}>
              <MiniSparkline data={featuredSparkline} color={featConf.color} width={200} height={80} />
            </div>
          </div>
        </motion.div>

        {/* #3: Filter pills */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {filters.map(f => {
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
                  color: isActive
                    ? '#e6007a'
                    : L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.15s ease',
                }}
              >
                {f.color && <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.color }} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* #4: Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="rounded-xl p-4 relative overflow-hidden group cursor-default"
              style={{
                background: L ? '#ffffff' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: L ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
              }}
            >
              {/* Accent top border */}
              <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: stat.accent }} />
              <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: L ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)', fontWeight: 500, marginBottom: 8 }}>
                {stat.label}
              </div>
              <div className="tabular-nums" style={{ fontSize: 36, fontWeight: 600, color: L ? '#1d1d1f' : '#fff', lineHeight: 1 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* #5: Event cards */}
        <div className="space-y-2">
          {filtered.length > 0 ? (
            filtered.map((event, i) => (
              <EventCard key={event.id + i} event={event} index={i} isLight={L} navigate={navigate} />
            ))
          ) : (
            /* #6: Empty state */
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

function EventCard({ event, index, isLight, navigate }: { event: MarketEvent; index: number; isLight: boolean; navigate: ReturnType<typeof useNavigate> }) {
  const L = isLight;
  const conf = typeConfig[event.type] || typeConfig.confidence;
  const sparkline = generateEventSparkline(event.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 overflow-hidden"
      style={{
        background: L ? '#ffffff' : 'rgba(255,255,255,0.02)',
        borderTop: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderRight: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderBottom: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `3px solid ${conf.borderColor}`,
        borderRadius: 12,
        boxShadow: L ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = L ? '#f9f9f9' : 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderTopColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderRightColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
        e.currentTarget.style.borderBottomColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = L ? '#ffffff' : 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderTopColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderRightColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderBottomColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
      }}
    >
      {/* Badge — fixed width */}
      <span
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: 120,
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          fontWeight: 500,
          background: `${conf.color}1f`,
          border: `1px solid ${conf.color}4d`,
          color: conf.color,
          padding: '4px 0',
          borderRadius: 100,
        }}
      >
        {conf.label}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 15, fontWeight: 600, color: L ? '#1d1d1f' : '#fff' }}>{event.asset}</div>
        <div className="truncate" style={{ fontSize: 13, color: L ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)' }}>{event.description}</div>
        <div style={{ fontSize: 11, color: L ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)', marginTop: 2 }}>{event.timestamp}</div>
      </div>

      {/* Sparkline */}
      <div className="flex-shrink-0 hidden sm:block">
        <MiniSparkline data={sparkline} color={conf.color} width={80} height={40} />
      </div>

      {/* Replay button */}
      <button
        onClick={() => {
          navigate(`/replay?asset=${encodeURIComponent(event.asset)}&eventId=${event.id}`);
        }}
        className="flex-shrink-0 flex items-center justify-center text-xs font-medium apple-transition min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: `1px solid ${L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
          color: L ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#e6007a';
          e.currentTarget.style.color = '#e6007a';
          e.currentTarget.style.background = 'rgba(230,0,122,0.06)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
          e.currentTarget.style.color = L ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
          e.currentTarget.style.background = 'transparent';
        }}
      >
        Replay →
      </button>
    </motion.div>
  );
}
