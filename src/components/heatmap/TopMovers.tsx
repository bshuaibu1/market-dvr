import { AssetWithClass } from '@/lib/mockData';
import SparklineChart from '@/components/SparklineChart';

interface Props {
  assets: AssetWithClass[];
}

export default function TopMovers({ assets }: Props) {
  const sorted = [...assets]
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  return (
    <div className="space-y-0">
      {sorted.map((asset, i) => {
        const positive = asset.change >= 0;
        return (
          <div
            key={asset.symbol}
            className="flex items-center gap-2 py-2"
            style={{ borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
          >
            <span className="tabular-nums" style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', width: 14, textAlign: 'right' }}>{i + 1}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', width: 64 }}>{asset.symbol.split('/')[0]}</span>
            <div className="flex-shrink-0">
              <SparklineChart data={asset.sparkline} width={40} height={16} positive={positive} />
            </div>
            <span className="tabular-nums ml-auto" style={{ fontSize: 11, color: positive ? '#32d74b' : '#ff453a' }}>
              {positive ? '+' : ''}{asset.change.toFixed(2)}%
            </span>
            <span
              className="tabular-nums rounded px-1.5 py-0.5"
              style={{
                fontSize: 9,
                background: asset.confidence > 0.9 ? 'rgba(50,215,75,0.12)' : asset.confidence > 0.7 ? 'rgba(255,159,10,0.12)' : 'rgba(255,69,58,0.12)',
                color: asset.confidence > 0.9 ? '#32d74b' : asset.confidence > 0.7 ? '#ff9f0a' : '#ff453a',
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
