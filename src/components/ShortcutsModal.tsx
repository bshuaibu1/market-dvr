import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const shortcuts = [
  { keys: ['Space'], desc: 'Play / Pause' },
  { keys: ['←'], desc: 'Back 10 frames' },
  { keys: ['→'], desc: 'Forward 10 frames' },
  { keys: ['Shift', '←'], desc: 'Back 100 frames' },
  { keys: ['Shift', '→'], desc: 'Forward 100 frames' },
  { keys: ['1'], desc: 'Speed 0.25x' },
  { keys: ['2'], desc: 'Speed 0.5x' },
  { keys: ['3'], desc: 'Speed 1x' },
  { keys: ['4'], desc: 'Speed 2x' },
  { keys: ['5'], desc: 'Speed 4x' },
  { keys: ['Home'], desc: 'Jump to start' },
  { keys: ['End'], desc: 'Jump to end' },
];

export default function ShortcutsModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="frosted-glass border-border max-w-md" style={{ background: 'rgba(13,13,13,0.95)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-medium">Keyboard Shortcuts</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">Use these shortcuts to control replay playback.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-muted-foreground">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="px-2 py-0.5 rounded-lg text-xs font-medium text-foreground surface-2" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
