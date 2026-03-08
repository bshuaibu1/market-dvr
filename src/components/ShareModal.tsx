import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Download, Link as LinkIcon, Image as ImageIcon, Check, Film, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { toPng } from 'html-to-image';
import LogoMark from '@/components/LogoMark';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: string;
  frame: number;
  frameData: { price: number; bid: number; ask: number; spread: number; confidence: number };
  recentPrices?: number[];
  eventName?: string;
}

export default function ShareModal({ open, onOpenChange, asset, frame, frameData, recentPrices = [], eventName }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'image' | 'clip'>('link');
  const [copied, setCopied] = useState(false);
  const [clipDuration, setClipDuration] = useState<'5s' | '10s' | '30s'>('10s');
  const [clipSpeed, setClipSpeed] = useState<'0.25x' | '0.5x' | '1x'>('1x');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/replay?asset=${encodeURIComponent(asset)}&frame=${frame}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#0d0d0d', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `market-dvr-${asset.replace('/', '-')}-frame-${frame}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [asset, frame]);

  const handleCopyImage = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#0d0d0d', pixelRatio: 2 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }, []);

  const handleExportClip = () => {
    setExporting(true);
    setExportDone(false);
    setTimeout(() => {
      setExporting(false);
      setExportDone(true);
    }, 2500);
  };

  // Build sparkline for export card
  const sparkData = recentPrices.length >= 2 ? recentPrices : [];
  const sparkW = 540;
  const sparkH = 60;
  let sparkPoints = '';
  let sparkPositive = true;
  if (sparkData.length >= 2) {
    const min = Math.min(...sparkData);
    const max = Math.max(...sparkData);
    const range = max - min || 1;
    sparkPositive = sparkData[sparkData.length - 1] >= sparkData[0];
    sparkPoints = sparkData.map((v, i) => {
      const x = (i / (sparkData.length - 1)) * sparkW;
      const y = sparkH - ((v - min) / range) * sparkH * 0.8 - sparkH * 0.1;
      return `${x},${y}`;
    }).join(' ');
  }

  const tabs = [
    { key: 'link' as const, icon: LinkIcon, label: 'Share Link' },
    { key: 'image' as const, icon: ImageIcon, label: 'Export Image' },
    { key: 'clip' as const, icon: Film, label: 'Export Clip' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-glass border-border max-w-lg" style={{ background: 'rgba(13,13,13,0.95)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-medium">Share this moment</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Share or export a snapshot of this replay frame.</DialogDescription>
        </DialogHeader>

        {/* Tab selector */}
        <div className="flex gap-2 mt-2 mb-4">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setExportDone(false); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium apple-transition"
              style={{
                background: activeTab === t.key ? 'rgba(230,0,122,0.15)' : 'rgba(255,255,255,0.04)',
                border: activeTab === t.key ? '1px solid #e6007a' : '1px solid rgba(255,255,255,0.08)',
                color: activeTab === t.key ? '#e6007a' : '#86868b',
              }}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'link' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="text-xs text-muted-foreground truncate flex-1 tabular-nums">{shareUrl}</span>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-foreground apple-transition flex-shrink-0"
                style={{ background: '#e6007a' }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Anyone with this link can replay this exact moment.</p>
          </div>
        ) : activeTab === 'image' ? (
          <div className="space-y-4">
            {/* Export card preview — 600px wide */}
            <div
              ref={cardRef}
              className="rounded-2xl p-6 space-y-3 mx-auto"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)', width: 600, maxWidth: '100%' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#e6007a' }} />
                  <span className="text-xs font-semibold text-foreground tracking-tight">Market DVR</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Frame #{frame}</span>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <div className="text-lg font-medium text-foreground">{asset}</div>
                  <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">${formatPrice(frameData.price)}</div>
                </div>
                {eventName && (
                  <div className="px-3 py-1 rounded-full text-[10px] font-medium" style={{ background: 'rgba(230,0,122,0.15)', color: '#e6007a' }}>
                    {eventName}
                  </div>
                )}
              </div>

              {/* Sparkline chart */}
              {sparkPoints && (
                <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <svg width={sparkW} height={sparkH} viewBox={`0 0 ${sparkW} ${sparkH}`} className="w-full" preserveAspectRatio="none">
                    <polyline
                      points={sparkPoints}
                      fill="none"
                      stroke={sparkPositive ? '#32d74b' : '#ff453a'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'BID', value: `$${formatPrice(frameData.bid)}` },
                  { label: 'ASK', value: `$${formatPrice(frameData.ask)}` },
                  { label: 'SPREAD', value: `$${frameData.spread.toFixed(2)}` },
                  { label: 'CONF', value: `${(frameData.confidence * 100).toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label}>
                    <div className="text-[9px] uppercase tracking-[0.08em] text-muted-foreground">{s.label}</div>
                    <div className="text-xs tabular-nums text-foreground font-medium mt-0.5">{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <span className="text-[9px] text-muted-foreground">Powered by Pyth Pro</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownloadPng}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary-foreground apple-transition"
                style={{ background: '#e6007a' }}
              >
                <Download size={14} /> Download PNG
              </button>
              <button
                onClick={handleCopyImage}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-foreground apple-transition surface-1"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy to clipboard'}
              </button>
            </div>
          </div>
        ) : (
          /* Export Clip tab */
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export a {clipDuration} animated replay clip with watermark — perfect for sharing on Twitter
            </p>

            {/* Duration selector */}
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Duration</div>
              <div className="flex gap-1.5">
                {(['5s', '10s', '30s'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setClipDuration(d)}
                    className="px-4 py-2 rounded-xl text-xs font-medium apple-transition"
                    style={{
                      background: clipDuration === d ? 'rgba(230,0,122,0.15)' : 'rgba(255,255,255,0.04)',
                      border: clipDuration === d ? '1px solid #e6007a' : '1px solid rgba(255,255,255,0.08)',
                      color: clipDuration === d ? '#e6007a' : '#86868b',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed selector */}
            <div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Playback Speed</div>
              <div className="flex gap-1.5">
                {(['0.25x', '0.5x', '1x'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setClipSpeed(s)}
                    className="px-4 py-2 rounded-xl text-xs font-medium apple-transition"
                    style={{
                      background: clipSpeed === s ? 'rgba(230,0,122,0.15)' : 'rgba(255,255,255,0.04)',
                      border: clipSpeed === s ? '1px solid #e6007a' : '1px solid rgba(255,255,255,0.08)',
                      color: clipSpeed === s ? '#e6007a' : '#86868b',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">Starting from current frame #{frame}</p>

            {/* Watermark preview */}
            <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Watermark Preview</div>
              <div className="h-24 rounded-lg relative" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div className="absolute top-2 right-2 text-[9px] text-muted-foreground tabular-nums">{asset} • Frame #{frame}</div>
                <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
                <div className="absolute bottom-2 left-2 text-[9px] text-foreground font-medium">Market DVR</div>
                <div className="absolute bottom-2 right-2 text-[9px]" style={{ color: '#e6007a' }}>Powered by Pyth Pro</div>
              </div>
            </div>

            {/* Export button */}
            <button
              onClick={handleExportClip}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium text-primary-foreground apple-transition disabled:opacity-60"
              style={{ background: '#e6007a' }}
            >
              {exporting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating clip…
                </>
              ) : exportDone ? (
                <>
                  <Check size={14} /> Clip ready — check your downloads
                </>
              ) : (
                <>
                  <Film size={14} /> Export Clip
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">Free to share. No account required.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
