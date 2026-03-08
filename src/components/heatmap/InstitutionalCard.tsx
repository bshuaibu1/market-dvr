import { useEffect, useRef, useState } from 'react';
import { AssetWithClass, formatPrice } from '@/lib/mockData';
import SparklineChart from '@/components/SparklineChart';
import { Link } from 'react-router-dom';

interface Props {
  asset: AssetWithClass;
  large?: boolean;
}

export default function InstitutionalCard({ asset, large = false }: Props) {
  const positive = asset.change >= 0;
  const [flash, setFlash] = useState(false);
  const prevPrice = useRef(asset.price);

  useEffect(() => {
    if (asset.price !== prevPrice.current) {
      prevPrice.current = asset.price;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 200);
      return () => clearTimeout(t);
    }
  }, [asset.price]);

  // Confidence color
  const confColor = asset.confidence > 0.9 ? '#32d74b' : asset.confidence > 0.7 ? '#ff9f0a' : '#ff453a';
  // Left accent: map confidence to color (green=high, red=low)
  const accentColor = asset.confidence > 0.9 ? '#32d74b' : asset.confidence > 0.7 ? '#ff9f0a' : '#ff453a';

  const spreadPct = asset.price > 0 ? ((asset.spread / asset.price) * 100) : 0;

  return (
    <Link
      to="/replay"
      className="group relative flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        height: large ? 120 : 80,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(230,0,122,0.4)';
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(230,0,122,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[12px] group-hover:brightness-150"
        style={{ background: accentColor, transition: 'filter 0.2s ease' }}
      />

      <div className="flex-1 flex flex-col justify-between pl-[15px] pr-3 py-2.5">
        {/* Top: ticker + name */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{asset.symbol}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{asset.name}</span>
        </div>

        {/* Middle: price change + sparkline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums" style={{ fontSize: large ? 24 : 20, color: positive ? '#32d74b' : '#ff453a', fontWeight: 400 }}>
              {positive ? '+' : ''}{asset.change.toFixed(2)}%
            </span>
            <span style={{ fontSize: 10, color: positive ? '#32d74b' : '#ff453a' }}>
              {positive ? '▲' : '▼'}
            </span>
          </div>
          <div className="flex-shrink-0">
            <SparklineChart data={asset.sparkline} width={48} height={large ? 32 : 24} positive={positive} />
          </div>
        </div>

        {/* Bottom: micro-stats */}
        {large && (
          <div className="flex items-center gap-0">
            <span className="tabular-nums" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              BID-ASK ${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(2)}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', margin: '0 6px' }}>|</span>
            <span className="tabular-nums" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              CONF {(asset.confidence * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.1)', margin: '0 6px' }}>|</span>
            <span className="tabular-nums" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
              SPREAD {spreadPct.toFixed(3)}%
            </span>
          </div>
        )}
      </div>

      {/* Confidence bar at bottom */}
      <div className="w-full h-[2px] relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div className="absolute inset-y-0 left-0" style={{ width: '100%', background: 'rgba(255,255,255,0.15)' }} />
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${asset.confidence * 100}%`, background: confColor, transition: 'width 0.6s ease' }}
        />
      </div>

      {flash && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,255,255,0.03)', animation: 'shimmerFade 0.2s ease-out forwards' }} />
      )}
    </Link>
  );
}
