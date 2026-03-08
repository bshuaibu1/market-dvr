import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Download, Link as LinkIcon, Image as ImageIcon, Check } from 'lucide-react';
import { formatPrice } from '@/lib/mockData';
import { toPng } from 'html-to-image';

interface ShareModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  asset: string;
  frame: number;
  frameData: { price: number; bid: number; ask: number; spread: number; confidence: number };
}

export default function ShareModal({ open, onOpenChange, asset, frame, frameData }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');
  const [copied, setCopied] = useState(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-glass border-border max-w-lg" style={{ background: 'rgba(13,13,13,0.95)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-medium">Share this moment</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Share or export a snapshot of this replay frame.</DialogDescription>
        </DialogHeader>

        {/* Tab selector */}
        <div className="flex gap-2 mt-2 mb-4">
          {[
            { key: 'link' as const, icon: LinkIcon, label: 'Share Link' },
            { key: 'image' as const, icon: ImageIcon, label: 'Export Image' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
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
        ) : (
          <div className="space-y-4">
            {/* Export card preview */}
            <div
              ref={cardRef}
              className="rounded-2xl p-6 space-y-4"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#e6007a' }} />
                  <span className="text-xs font-semibold text-foreground tracking-tight">Market DVR</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Frame #{frame}</span>
              </div>

              <div>
                <div className="text-lg font-medium text-foreground">{asset}</div>
                <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">${formatPrice(frameData.price)}</div>
              </div>

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
        )}
      </DialogContent>
    </Dialog>
  );
}
