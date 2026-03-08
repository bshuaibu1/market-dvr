import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function RecordingBar() {
  const [seconds, setSeconds] = useState(16338);

  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 frosted-glass border-t border-border h-12 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-negative pulse-red" />
        <span className="text-xs font-medium text-foreground hidden md:inline">Recording</span>
        <span className="text-xs font-medium text-foreground md:hidden">REC</span>
      </div>
      <div className="flex-1 text-center text-[12px] md:text-xs text-muted-foreground tabular-nums truncate px-2">
        {h}h {m.toString().padStart(2, '0')}m {s.toString().padStart(2, '0')}s <span className="hidden sm:inline">captured across</span> <span className="sm:hidden">·</span> 6 feeds
      </div>
      <Link to="/replay" className="text-xs font-medium text-foreground hover:text-primary apple-transition flex-shrink-0 whitespace-nowrap">
        <span className="hidden sm:inline">View Replay →</span>
        <span className="sm:hidden">Replay →</span>
      </Link>
    </div>
  );
}
