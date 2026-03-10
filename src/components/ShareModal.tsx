import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Download, Link as LinkIcon, Image as ImageIcon, Check, Film, Loader2, X } from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { toPng } from 'html-to-image';
import LogoMark from '@/components/LogoMark';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: string;
  frame: number;
  frameData: { price: number; bid: number; ask: number; spread: number; confidence: number };
  recentPrices?: number[];
  eventName?: string;
  allFrames?: { price: number; bid: number; ask: number; spread: number; confidence: number; timestamp_us: number }[];
}

export default function ShareModal({ open, onOpenChange, asset, frame, frameData, recentPrices = [], eventName, allFrames = [] }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'image' | 'clip'>('link');
  const [copied, setCopied] = useState(false);
  const [clipDuration, setClipDuration] = useState<'5s' | '10s' | '30s'>('10s');
  const [clipSpeed, setClipSpeed] = useState<'0.25x' | '0.5x' | '1x'>('1x');
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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

  const handleExportClip = useCallback(async () => {
    if (allFrames.length < 2) return;
    setExporting(true);
    setExportDone(false);

    try {
      const durationSeconds = parseInt(clipDuration);
      const speedMultiplier = parseFloat(clipSpeed);
      const W = 600, H = 300;
      const fps = 20;
      const totalFrames = fps * durationSeconds;
      const startIdx = Math.max(0, frame - Math.floor(totalFrames * speedMultiplier / 2));
      const endIdx = Math.min(allFrames.length - 1, startIdx + Math.floor(totalFrames * speedMultiplier));
      const frameSlice = allFrames.slice(startIdx, endIdx + 1);
      const step = Math.max(1, Math.floor(frameSlice.length / totalFrames));
      const sampledFrames = frameSlice.filter((_, i) => i % step === 0).slice(0, totalFrames);

      const prices = sampledFrames.map(f => f.price).filter(p => isFinite(p) && p > 0);
      if (prices.length < 2) { setExporting(false); return; }
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      const rangeP = maxP - minP || 1;

      const canvas = document.createElement('canvas');
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Encode as APNG-like webm via MediaRecorder
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 2500000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `market-dvr-${asset.replace('/', '-')}-clip.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setExporting(false);
        setExportDone(true);
      };

      recorder.start();

      const drawFrame = (i: number) => {
        if (i >= sampledFrames.length) { recorder.stop(); return; }
        const f = sampledFrames[i];
        const visiblePrices = sampledFrames.slice(0, i + 1).map(d => d.price).filter(p => isFinite(p) && p > 0);

        ctx.fillStyle = '#0d0d0d';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let g = 0; g <= 4; g++) {
          const y = (g / 4) * (H - 80) + 20;
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
        }

        // Price line
        if (visiblePrices.length >= 2) {
          ctx.beginPath();
          visiblePrices.forEach((p, idx) => {
            const x = (idx / (sampledFrames.length - 1)) * (W - 40) + 20;
            const y = H - 80 - ((p - minP) / rangeP) * (H - 100);
            idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.strokeStyle = f.price >= sampledFrames[0].price ? '#32d74b' : '#ff453a';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Dot at current position
          const cx = ((visiblePrices.length - 1) / (sampledFrames.length - 1)) * (W - 40) + 20;
          const cy = H - 80 - ((f.price - minP) / rangeP) * (H - 100);
          ctx.beginPath();
          ctx.arc(cx, cy, 4, 0, Math.PI * 2);
          ctx.fillStyle = f.price >= sampledFrames[0].price ? '#32d74b' : '#ff453a';
          ctx.fill();
        }

        // Price label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(`$${f.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 16, H - 50);

        // Asset label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText(asset, 16, H - 32);

        // Spread
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Spread $${isFinite(f.spread) ? f.spread.toFixed(4) : '—'}`, 16, H - 16);

        // Watermark
        ctx.fillStyle = 'rgba(230,0,122,0.9)';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillText('Market DVR · Pyth Pro', W - 150, H - 16);

        setTimeout(() => drawFrame(i + 1), 1000 / fps);
      };

      drawFrame(0);
    } catch (err) {
      console.error('Clip export failed:', err);
      setExporting(false);
    }
  }, [allFrames, frame, clipDuration, clipSpeed, asset]);

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

  const modalContent = (
    <>
      {/* Drag handle on mobile */}
      {isMobile && (
        <div className="flex justify-center pt-2 pb-3">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}

      {/* Tab selector — equal width pills */}
      <div className="flex gap-2 mt-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setExportDone(false); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium apple-transition text-center"
            style={{
              background: activeTab === t.key ? 'rgba(230,0,122,0.15)' : 'rgba(255,255,255,0.04)',
              border: activeTab === t.key ? '1px solid #e6007a' : '1px solid rgba(255,255,255,0.08)',
              color: activeTab === t.key ? '#e6007a' : '#86868b',
            }}
          >
            <t.icon size={14} />
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'link' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-xs text-muted-foreground truncate flex-1 tabular-nums min-w-0">{shareUrl}</span>
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
          <div
            ref={cardRef}
            className="rounded-2xl p-6 space-y-3 mx-auto"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)', width: 600, maxWidth: '100%' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LogoMark size={20} variant="dark" />
                <span className="text-xs font-semibold text-white tracking-tight" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Market DVR</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>· Powered by Pyth Pro</span>
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
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export a {clipDuration} animated replay clip with watermark — perfect for sharing on Twitter
          </p>

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

          <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2">Watermark Preview</div>
            <div className="h-24 rounded-lg relative" style={{ background: 'rgba(0,0,0,0.4)' }}>
              <div className="absolute top-2 right-2 text-[9px] text-muted-foreground tabular-nums">{asset} • Frame #{frame}</div>
              <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.6))' }} />
              <div
                className="absolute bottom-2 left-2 flex items-center gap-1.5"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 12px',
                  borderRadius: '100px',
                }}
              >
                <LogoMark size={16} variant="dark" />
                <span className="text-[9px] text-white font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Market DVR</span>
                <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>· Powered by Pyth Pro</span>
              </div>
            </div>
          </div>

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
    </>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="frosted-glass border-border !max-w-full !w-full !translate-x-0 !translate-y-0 !top-auto !left-0 !bottom-0 !right-0 overflow-y-auto"
          style={{
            background: 'rgba(13,13,13,0.95)',
            borderRadius: '20px 20px 0 0',
            maxHeight: '60vh',
            position: 'fixed',
            animation: 'none',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="text-foreground text-lg font-medium">Share this moment</DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="w-11 h-11 flex items-center justify-center rounded-full surface-1"
              aria-label="Close"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>
          <DialogDescription className="text-muted-foreground text-sm sr-only">Share or export a snapshot of this replay frame.</DialogDescription>
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop: centered dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-glass border-border max-w-lg" style={{ background: 'rgba(13,13,13,0.95)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-medium">Share this moment</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Share or export a snapshot of this replay frame.</DialogDescription>
        </DialogHeader>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
