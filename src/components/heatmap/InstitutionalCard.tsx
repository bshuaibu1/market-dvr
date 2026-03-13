import { useEffect, useRef, useState } from 'react';
import { AssetWithClass } from '@/lib/mockData';
import SparklineChart from '@/components/SparklineChart';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';

interface Props {
  asset: AssetWithClass & {
    replayAt?: number;
  };
  large?: boolean;
}

export default function InstitutionalCard({ asset, large = false }: Props) {
  const { theme } = useTheme();
  const light = theme === 'light';
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

  const confBarTrack = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const confBarFill = light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)';

  const accentColor =
    asset.confidence > 0.9
      ? light
        ? 'rgba(26,143,53,0.6)'
        : 'rgba(50,215,75,0.6)'
      : asset.confidence > 0.7
        ? 'rgba(255,159,10,0.6)'
        : light
          ? 'rgba(204,34,0,0.6)'
          : 'rgba(255,69,58,0.6)';

  const spreadPct = asset.price > 0 ? (asset.spread / asset.price) * 100 : 0;

  const cardBg = light ? '#ffffff' : '#0d0d0d';
  const cardBorder = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const cardShadow = light ? '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' : 'none';
  const tickerColor = light ? '#1d1d1f' : '#fff';
  const nameColor = light ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';
  const positiveColor = light ? '#1a8f35' : '#32d74b';
  const negativeColor = light ? '#cc2200' : '#ff453a';
  const changeColor = positive ? positiveColor : negativeColor;
  const microColor = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)';
  const dividerColor = light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  const replayUrl = `/replay?asset=${encodeURIComponent(asset.symbol)}${
    asset.replayAt ? `&replayAt=${asset.replayAt}` : ''
  }`;

  return (
    <Link
      to={replayUrl}
      className="group relative flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: 12,
        height: large ? 120 : 80,
        boxShadow: cardShadow,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(230,0,122,0.4)';
        e.currentTarget.style.boxShadow = `0 0 0 1px rgba(230,0,122,0.2)${
          light ? ', 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' : ''
        }`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = cardBorder;
        e.currentTarget.style.boxShadow = cardShadow;
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[12px]"
        style={{ background: accentColor }}
      />

      <div className="flex-1 flex flex-col justify-between pl-[15px] pr-3 py-2.5">
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 13, fontWeight: 600, color: tickerColor }}>{asset.symbol}</span>
          <span style={{ fontSize: 10, color: nameColor }}>{asset.name}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className="tabular-nums"
              style={{ fontSize: large ? 24 : 20, color: changeColor, fontWeight: 400 }}
            >
              {positive ? '+' : ''}
              {asset.change.toFixed(2)}%
            </span>
            <span style={{ fontSize: 10, color: changeColor }}>{positive ? '▲' : '▼'}</span>
          </div>
          <div className="flex-shrink-0">
            <SparklineChart
              data={asset.sparkline}
              width={48}
              height={large ? 32 : 24}
              positive={positive}
            />
          </div>
        </div>

        {large && (
          <div className="flex items-center gap-0">
            <span className="tabular-nums" style={{ fontSize: 10, color: microColor }}>
              BID-ASK{' '}
              {asset.spread === 0
                ? '—'
                : `$${asset.spread < 0.01 ? asset.spread.toFixed(6) : asset.spread.toFixed(2)}`}
            </span>
            <span style={{ fontSize: 10, color: dividerColor, margin: '0 6px' }}>|</span>
            <span className="tabular-nums" style={{ fontSize: 10, color: microColor }}>
              CONF {(asset.confidence * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 10, color: dividerColor, margin: '0 6px' }}>|</span>
            <span className="tabular-nums" style={{ fontSize: 10, color: microColor }}>
              SPREAD {asset.spread === 0 ? '—' : `${spreadPct.toFixed(3)}%`}
            </span>
          </div>
        )}
      </div>

      <div className="w-full h-[2px] relative" style={{ background: confBarTrack }}>
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${asset.confidence * 100}%`,
            background: confBarFill,
            transition: 'width 0.6s ease',
          }}
        />
      </div>

      {flash && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: light ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)',
            animation: 'shimmerFade 0.2s ease-out forwards',
          }}
        />
      )}
    </Link>
  );
}