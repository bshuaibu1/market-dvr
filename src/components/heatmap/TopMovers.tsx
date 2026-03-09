import { useNavigate } from 'react-router-dom';
import { AssetWithClass } from '@/lib/mockData';
import SparklineChart from '@/components/SparklineChart';
import { useTheme } from '@/components/ThemeProvider';

interface Props {
  assets: AssetWithClass[];
}

export default function TopMovers({ assets }: Props) {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const light = theme === 'light';
  const sorted = [...assets]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  const rankColor = light ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)';
  const tickerColor = light ? '#1d1d1f' : '#fff';
  const dividerColor = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
  const positiveColor = light ? '#1a8f35' : '#32d74b';
  const negativeColor = light ? '#cc2200' : '#ff453a';
  const badgeBg = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const badgeBorder = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
  const badgeText = light ? '#1d1d1f' : '#fff';

  return (
    <div className="space-y-0">
      {sorted.map((asset, i) => {
        const positive = asset.change >= 0;
        return (
          <div
            key={asset.symbol}
            className="flex items-center gap-2 py-2 cursor-pointer group"
            onClick={() => navigate(`/replay?asset=${encodeURIComponent(asset.symbol)}`)}
            style={{ borderBottom: i < sorted.length - 1 ? `1px solid ${dividerColor}` : 'none' }}
          >
            <span className="tabular-nums" style={{ fontSize: 10, color: rankColor, width: 14, textAlign: 'right' }}>{i + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: tickerColor, width: 64 }}>{asset.symbol.split('/').find(s => s !== 'USD') || asset.symbol}</span>
            <div className="flex-shrink-0">
              <SparklineChart data={asset.sparkline} width={40} height={16} positive={positive} />
            </div>
            <span className="tabular-nums ml-auto" style={{ fontSize: 11, color: positive ? positiveColor : negativeColor }}>
              {positive ? '+' : ''}{asset.change.toFixed(2)}%
            </span>
            <span
              className="tabular-nums rounded px-1.5 py-0.5"
              style={{
                fontSize: 9,
                background: badgeBg,
                border: `1px solid ${badgeBorder}`,
                color: badgeText,
              }}
            >
              {(asset.confidence * 100).toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
