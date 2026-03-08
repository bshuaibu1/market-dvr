import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const filters = [
  { label: 'All', type: null },
  { label: 'Crash 🔴', type: 'crash' },
  { label: 'Pump 🟢', type: 'pump' },
  { label: 'Spread Spike 🟡', type: 'spread' },
  { label: 'Confidence Drop ⚪', type: 'confidence' },
  { label: 'Divergence 🟣', type: 'divergence' },
];

const typeIcons: Record<string, { bg: string; color: string; glow: string }> = {
  crash: { bg: 'rgba(255,69,58,0.15)', color: '#ff453a', glow: '0 0 20px rgba(255,69,58,0.3)' },
  pump: { bg: 'rgba(50,215,75,0.15)', color: '#32d74b', glow: '0 0 20px rgba(50,215,75,0.3)' },
  spread: { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a', glow: '0 0 20px rgba(255,214,10,0.3)' },
  confidence: { bg: 'rgba(134,134,139,0.15)', color: '#86868b', glow: '0 0 20px rgba(134,134,139,0.3)' },
  divergence: { bg: 'rgba(147,51,234,0.15)', color: '#9333ea', glow: '0 0 20px rgba(147,51,234,0.3)' },
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

function MiniSparkline({ data, color, width = 80, height = 32 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.8 - height * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
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
  { label: 'Total Events Recorded', value: '847' },
  { label: 'Crashes Detected', value: '12' },
  { label: 'Avg Event Duration', value: '4.2s' },
  { label: 'Most Active Asset', value: 'BTC/USD' },
];

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const filtered = activeFilter ? allEventsRaw.filter(e => e.type === activeFilter) : allEventsRaw;

  const featIcon = typeIcons[featuredEvent.type];

  return (
    <div className="min-h-screen bg-background pt-14 pb-4 max-md:pb-[68px]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <h1 className="heading-thin text-3xl mb-8">Events</h1>

        {/* Featured Event */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="surface-1 rounded-2xl p-4 md:p-6 mb-8 relative overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="text-[11px] uppercase tracking-[0.08em] font-medium mb-3" style={{ color: '#e6007a' }}>
            Most Dramatic Event
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex-1">
              <div className="text-lg font-medium text-foreground mb-1">{featuredEvent.asset}</div>
              <div className="text-sm text-muted-foreground leading-relaxed mb-2">{featuredEvent.description}</div>
              <div className="text-xs text-muted-foreground mb-4">{featuredEvent.timestamp}</div>
              <Link
                to="/replay"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-primary-foreground apple-transition w-full sm:w-auto min-h-[44px]"
                style={{ background: '#e6007a' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Replay this moment →
              </Link>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
              <MiniSparkline data={featuredSparkline} color={featIcon.color} width={180} height={64} />
            </div>
          </div>
        </motion.div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1">
          {filters.map(f => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.type)}
              className={`px-4 py-2 rounded-full text-xs font-medium apple-transition flex-shrink-0 whitespace-nowrap min-h-[44px] md:min-h-0 ${activeFilter === f.type ? 'surface-2 inner-glow text-foreground' : 'surface-1 text-muted-foreground hover:text-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="surface-1 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground mb-2">{stat.label}</div>
              <div className="text-xl font-medium text-foreground tabular-nums">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Event cards */}
        <div className="space-y-3">
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}

function EventCard({event: MarketEvent; index: number }) {
  const icon = typeIcons[event.type] || typeIcons.confidence;
  const sparkline = generateEventSparkline(event.type);
  const isDivergence = event.type === ('divergence' as any);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="surface-1 rounded-2xl p-4 md:p-5 card-hover flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: icon.bg, boxShadow: icon.glow }}
      >
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: icon.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] md:text-sm font-medium text-foreground">{event.asset}</span>
          {isDivergence && (
            <span
              className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(147,51,234,0.15)',
                color: '#9333ea',
                border: '1px solid rgba(147,51,234,0.3)',
              }}
            >
              Divergence
            </span>
          )}
        </div>
        <div className="text-[13px] md:text-sm text-muted-foreground truncate">{event.description}</div>
        {isDivergence && (
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">Confidence: <span className="text-foreground font-medium">92.1%</span> → <span style={{ color: '#9333ea' }} className="font-medium">54.3%</span></span>
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">{event.timestamp}</div>
      </div>

      <div className="flex-shrink-0 hidden sm:block">
        <MiniSparkline data={sparkline} color={icon.color} width={80} height={32} />
      </div>

      <Link
        to="/replay"
        className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground apple-transition hover:text-primary-foreground min-h-[44px] flex items-center justify-center w-full sm:w-auto"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e6007a'; e.currentTarget.style.borderColor = '#e6007a'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
      >
        Replay →
      </Link>
    </motion.div>
  );
}
