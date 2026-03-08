import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { mockEvents, MarketEvent } from '@/lib/mockData';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const filters = [
  { label: 'All', type: null },
  { label: 'Crash 🔴', type: 'crash' },
  { label: 'Pump 🟢', type: 'pump' },
  { label: 'Spread Spike 🟡', type: 'spread' },
  { label: 'Confidence Drop ⚪', type: 'confidence' },
];

const typeIcons: Record<string, { bg: string; color: string }> = {
  crash: { bg: 'rgba(255,69,58,0.15)', color: '#ff453a' },
  pump: { bg: 'rgba(50,215,75,0.15)', color: '#32d74b' },
  spread: { bg: 'rgba(255,214,10,0.15)', color: '#ffd60a' },
  confidence: { bg: 'rgba(134,134,139,0.15)', color: '#86868b' },
};

export default function EventsPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filtered = activeFilter ? mockEvents.filter(e => e.type === activeFilter) : mockEvents;

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="heading-thin text-3xl mb-8">Events</h1>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {filters.map(f => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.type)}
              className={`px-4 py-2 rounded-full text-xs font-medium apple-transition ${activeFilter === f.type ? 'surface-2 inner-glow text-foreground' : 'surface-1 text-muted-foreground hover:text-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Event cards */}
        <div className="space-y-3">
          {filtered.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, index }: { event: MarketEvent; index: number }) {
  const icon = typeIcons[event.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="surface-1 rounded-2xl p-5 card-hover flex items-center gap-4"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: icon.bg }}>
        <div className="w-3 h-3 rounded-full" style={{ background: icon.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{event.asset}</div>
        <div className="text-sm text-muted-foreground truncate">{event.description}</div>
        <div className="text-xs text-muted-foreground mt-1">{event.timestamp}</div>
      </div>

      <Link
        to="/replay"
        className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground apple-transition hover:text-foreground"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        Replay →
      </Link>
    </motion.div>
  );
}
