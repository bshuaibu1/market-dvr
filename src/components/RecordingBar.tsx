import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function RecordingBar() {
  const [now, setNow] = useState(Date.now());
  const startTime = new Date('2026-03-09T10:00:00Z').getTime();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = Math.max(0, now - startTime);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const formatDuration = () => {
    const s = diffSec % 60;
    const m = diffMin % 60;
    const h = diffHour % 24;
    const d = diffDay;

    if (d < 1) {
      if (h < 1) {
        return `${m}m ${s}s captured`;
      }
      return `${h}h ${m}m ${s}s captured`;
    }
    return `${d} ${d === 1 ? 'day' : 'days'} ${h}h ${m}m ${s}s captured`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 frosted-glass border-t border-border h-12 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-negative pulse-red" />
        <span className="text-xs font-medium text-foreground hidden md:inline">Recording</span>
        <span className="text-xs font-medium text-foreground md:hidden">REC</span>
      </div>
      <div className="flex-1 text-center text-[12px] md:text-xs text-muted-foreground tabular-nums truncate px-2">
        {formatDuration()} <span className="hidden sm:inline">across</span> <span className="sm:hidden">·</span> 16 feeds <span className="hidden md:inline">· Powered by <span className="inline-block w-1.5 h-1.5 rounded-full align-middle" style={{ background: '#e6007a' }} /> Pyth Pro</span>
      </div>
      <Link to="/replay" className="text-xs font-medium text-foreground hover:text-primary apple-transition flex-shrink-0 whitespace-nowrap">
        <span className="hidden sm:inline">View Replay →</span>
        <span className="sm:hidden">Replay →</span>
      </Link>
    </div>
  );
}
