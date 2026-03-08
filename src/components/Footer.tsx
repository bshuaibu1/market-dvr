export default function Footer() {
  return (
    <footer className="py-8 text-center">
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tracking-tight">Market DVR</span>
        <span className="flex items-center gap-1.5">
          Powered by <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: '#e6007a' }} /> Pyth Pro
        </span>
        <span>© 2026</span>
      </div>
    </footer>
  );
}
