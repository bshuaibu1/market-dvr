import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface AutopsyData {
  eventType: 'Volatility Spike' | 'Spread Spike' | 'Confidence Divergence';
  asset: string;
  duration: string;
  metrics: {
    priceMovement: { before: string; after: string; direction: 'up' | 'down' };
    spreadExpansion: { before: string; after: string; direction: 'up' | 'down' };
    confidenceInterval: { before: string; after: string; direction: 'up' | 'down' };
  };
  peakFrame: { timestamp: string; frameIndex: number };
}

// Mock autopsy data for demo
export const mockAutopsyData: AutopsyData = {
  eventType: 'Volatility Spike',
  asset: 'BTC/USD',
  duration: '4.2s',
  metrics: {
    priceMovement: { before: '$83,421.50', after: '$80,685.20', direction: 'down' },
    spreadExpansion: { before: '$5.21', after: '$52.40', direction: 'up' },
    confidenceInterval: { before: '92.1%', after: '54.3%', direction: 'down' },
  },
  peakFrame: { timestamp: '14:32:07.842 UTC', frameIndex: 156 },
};

export default function MarketAutopsy({ data = mockAutopsyData }: { data?: AutopsyData }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const metricRows = [
    { label: 'Price Movement', ...data.metrics.priceMovement },
    { label: 'Spread Expansion', ...data.metrics.spreadExpansion },
    { label: 'Confidence Interval', ...data.metrics.confidenceInterval },
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
            background: data.eventType === 'Confidence Divergence'
              ? 'rgba(147, 51, 234, 0.15)'
              : 'rgba(230, 0, 122, 0.15)',
            color: data.eventType === 'Confidence Divergence' ? '#9333ea' : '#e6007a',
            border: `1px solid ${data.eventType === 'Confidence Divergence' ? 'rgba(147, 51, 234, 0.3)' : 'rgba(230, 0, 122, 0.3)'}`,
          }}
        >
          {data.eventType}
        </span>
      </div>

      {/* Asset & Duration */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Asset</div>
          <div className="text-sm font-medium text-foreground">{data.asset}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-0.5">Duration</div>
          <div className="text-sm font-medium text-foreground">{data.duration}</div>
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

      {/* Peak Frame */}
      <div
        className="rounded-xl p-3"
        style={{
          background: 'rgba(230, 0, 122, 0.06)',
          border: '1px solid rgba(230, 0, 122, 0.15)',
        }}
      >
        <div className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: '#e6007a' }}>Peak Frame</div>
        <div className="text-sm tabular-nums text-foreground font-medium">{data.peakFrame.timestamp}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">Frame #{data.peakFrame.frameIndex}</div>
      </div>

      {/* Confidence Divergence note */}
      {data.eventType === 'Confidence Divergence' && (
        <p className="text-xs italic text-muted-foreground leading-relaxed">
          Price sources began disagreeing. This often indicates liquidity stress or exchange instability.
        </p>
      )}
    </motion.div>
  );
}
