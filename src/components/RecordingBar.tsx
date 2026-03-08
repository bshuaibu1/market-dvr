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
    <div className="fixed bottom-0 left-0 right-0 z-50 frosted-glass border-t border-border h-12 flex items-center px-6">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-negative pulse-red" />
        <span className="text-xs font-medium text-foreground">Recording</span>
      </div>
      <div className="flex-1 text-center text-xs text-muted-foreground tabular-nums">
        {h}h {m.toString().padStart(2, '0')}m {s.toString().padStart(2, '0')}s captured across 6 feeds
      </div>
      <Link to="/replay" className="text-xs font-medium text-foreground hover:text-primary apple-transition">
        View Replay →
      </Link>
    </div>
  );
}
