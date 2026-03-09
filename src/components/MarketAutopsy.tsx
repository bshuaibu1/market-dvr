import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { formatPrice } from '@/lib/api'; // Or use standard formatter if needed

interface RealAutopsyData {
  event_type: string;
  asset?: string;
  duration_ms: number;
  first_price: number;
  last_price: number;
  max_spread: number;
  baseline_spread: number;
  start_time: string;
}

export default function MarketAutopsy({ data }: { data?: RealAutopsyData }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No recent events found.
      </div>
    );
  }

  // Format helper for numbers
  const formatNum = (num: number) => num < 1000 ? num.toFixed(4) : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const metricRows = [
    { 
      label: 'Price Movement', 
      before: `$${formatNum(data.first_price)}`, 
      after: `$${formatNum(data.last_price)}`, 
      direction: data.last_price >= data.first_price ? 'up' : 'down' 
    },
    { 
      label: 'Spread Expansion', 
      before: `$${formatNum(data.baseline_spread)}`, 
      after: `$${formatNum(data.max_spread)}`, 
      direction: data.max_spread >= data.baseline_spread ? 'up' : 'down' 
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Event Type Badge */}
      <div className="flex items-center gap-3">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
          style={{
            background: data.event_type === 'Confidence Divergence'
              ? 'rgba(147, 51, 234, 0.15)'
              : 'rgba(230, 0, 122, 0.15)',
            color: data.event_type === 'Confidence Divergence' ? '#9333ea' : '#e6007a',
            border: `1px solid ${data.event_type === 'Confidence Divergence' ? 'rgba(147, 51, 234, 0.3)' : 'rgba(230, 0, 122, 0.3)'}`,
          }}
        >
          {data.event_type}
        </span>
      </div>

      {/* Asset & Duration */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Asset</div>
          <div className="text-sm font-medium text-foreground">{data.asset || 'Unknown'}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Duration</div>
          <div className="text-sm font-medium text-foreground">{data.duration_ms}ms</div>
        </div>
      </div>

      {/* Metric Rows */}
      <div className="space-y-3">
        {metricRows.map((row) => (
          <div
            key={row.label}
            className="rounded-xl p-3"
            style={{
              background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-1.5">{row.label}</div>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-muted-foreground">{row.before}</span>
              <span
                className="text-[10px]"
                style={{ color: row.direction === 'up' ? (isLight ? '#1a8f35' : '#32d74b') : (isLight ? '#cc2200' : '#ff453a') }}
              >
                {row.direction === 'up' ? '▲' : '▼'}
              </span>
              <span className="text-sm tabular-nums text-foreground font-medium">{row.after}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Start Time */}
      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(230, 0, 122, 0.06)',
          border: '1px solid rgba(230, 0, 122, 0.15)',
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: '#e6007a' }}>Start Time</div>
        <div className="text-sm tabular-nums text-foreground font-medium">
          {data.start_time ? new Date(Number(data.start_time) / 1000).toLocaleString() : 'Unknown'}
        </div>
      </div>

      {/* Confidence Divergence note */}
      {data.event_type === 'Confidence Divergence' && (
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          Price sources began disagreeing. This often indicates liquidity stress or exchange instability.
        </p>
      )}
    </motion.div>
  );
}
