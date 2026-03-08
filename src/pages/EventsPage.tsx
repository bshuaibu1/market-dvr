import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { mockEvents, MarketEvent } from '@/lib/mockData';
import { Link } from 'react-router-dom';
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

const divergenceEvents: MarketEvent[] = [
  { id: 'd1', type: 'confidence' as any, asset: 'ETH/USD', description: 'Confidence divergence — price sources disagreed by 2.8% for 12 seconds', timestamp: '18 min ago', color: '#9333ea' },
  { id: 'd2', type: 'confidence' as any, asset: 'SOL/USD', description: 'Confidence divergence — exchange prices diverged sharply during liquidation cascade', timestamp: '52 min ago', color: '#9333ea' },
];

const allEventsRaw = [
  ...mockEvents,
  { ...divergenceEvents[0], type: 'divergence' as any },
  { ...divergenceEvents[1], type: 'divergence' as any },
].sort(() => Math.random() - 0.5);

const featuredEvent = mockEvents[0];
const featuredSparkline = generateEventSparkline(featuredEvent.type);

const stats = [
  { label: 'Total Events', value: '847', accent: 'rgba(255,255,255,0.15)' },
  { label: 'Crashes Detected', value: '12', accent: '#ff453a' },
  { label: 'Avg Duration', value: '4.2s', accent: '#0a84ff' },
  { label: 'Most Active', value: 'BTC/USD', accent: '#e6007a' },
];

export default function EventsPage() {
  const { theme } = useTheme();
  const L = theme === 'light';
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filtered = activeFilter ? allEventsRaw.filter(e => e.type === activeFilter) : allEventsRaw;

  const featConf = typeConfig[featuredEvent.type] || typeConfig.crash;

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
              <span style={{ color: L ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)' }}>847 EVENTS RECORDED</span>
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
                <span style={{ fontSize: 28, fontWeight: 600, color: L ? '#1d1d1f' : '#fff' }}>{featuredEvent.asset}</span>
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
                {featuredEvent.description}
              </div>
              <div style={{ fontSize: 12, color: L ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
                {featuredEvent.timestamp}
              </div>
              <Link
                to="/replay"
                className="inline-flex items-center justify-center text-sm font-medium apple-transition min-h-[44px]"
                style={{ background: '#e6007a', color: '#fff', borderRadius: 12, padding: '12px 24px', fontWeight: 500, transition: 'all 0.2s ease' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#cc0066'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e6007a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Replay this moment →
              </Link>
            </div>
            {/* Chart 40% */}
            <div className="flex items-center justify-center p-5 md:p-6" style={{ flex: '0 0 40%' }}>
              <MiniSparkline data={featuredSparkline} color={featConf.color} width={200} height={80} fill />
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
              <EventCard key={event.id + i} event={event} index={i} isLight={L} />
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

function EventCard({ event, index, isLight }: { event: MarketEvent; index: number; isLight: boolean }) {
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
      }
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
      <Link
        to="/replay"
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
      </Link>
    </motion.div>
  );
}
