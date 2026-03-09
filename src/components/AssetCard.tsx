import { Asset, formatPrice } from '@/lib/mockData';
import SparklineChart from './SparklineChart';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  asset: Asset;
  onClick?: () => void;
}

export default function AssetCard({ asset, onClick }: Props) {
  const positive = asset.change >= 0;

  return (
    <div 
      className="surface-1 rounded-2xl p-8 card-hover cursor-pointer flex flex-col gap-3"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="label-caps">{asset.symbol}</span>
        <div className={`w-2 h-2 rounded-full ${asset.volatile ? 'bg-negative' : 'bg-positive'}`} />
      </div>

      <div className="tabular-nums text-[28px] font-medium text-foreground leading-none tracking-tight">
        ${formatPrice(asset.price)}
      </div>

      <div className="flex items-center gap-1.5">
        {positive ? <ArrowUp size={12} className="text-positive" /> : <ArrowDown size={12} className="text-negative" />}
        <span className={`text-sm font-medium tabular-nums ${positive ? 'text-positive' : 'text-negative'}`}>
          {positive ? '+' : ''}{asset.change.toFixed(2)}%
        </span>
      </div>

      <div className="text-xs text-muted-foreground tabular-nums">
        Spread ${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(2)}
      </div>

      {/* Confidence bar */}
      <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-1">Confidence</div>
      <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full apple-transition"
          style={{ width: `${asset.confidence * 100}%`, background: 'hsl(var(--primary))' }}
        />
      </div>

      <div className="mt-auto pt-2">
        <SparklineChart data={asset.sparkline} positive={positive} width={200} height={64} />
      </div>
    </div>
  );
}
