import { MarketEvent } from '@/lib/mockData';
import { Link } from 'react-router-dom';

export default function EventItem({ event }: { event: MarketEvent }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border apple-transition hover:bg-accent/50 px-2 rounded-lg">
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: event.color }} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{event.asset}</span>
        <span className="text-sm text-muted-foreground ml-2">{event.description}</span>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
      <Link to="/replay" className="text-xs text-muted-foreground hover:text-foreground apple-transition whitespace-nowrap">
        Replay →
      </Link>
    </div>
  );
}
