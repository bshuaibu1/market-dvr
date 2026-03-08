import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { AssetWithClass } from '@/lib/mockData';
import { useTheme } from '@/components/ThemeProvider';

const matrixAssets = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'XAU/USD', 'WTI/USD', 'EUR/USD'];
const matrixLabels: Record<string, string> = {
  'BTC/USD': 'BTC', 'ETH/USD': 'ETH', 'SOL/USD': 'SOL',
  'XAU/USD': 'Gold', 'WTI/USD': 'Oil', 'EUR/USD': 'EUR',
};

function computeCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

function getCellColor(val: number, isLight: boolean): string {
  if (isLight) {
    if (val > 0.7) return 'rgba(26,143,53,0.2)';
    if (val > 0.3) return 'rgba(26,143,53,0.08)';
    if (val > -0.3) return 'rgba(0,0,0,0.02)';
    if (val > -0.7) return 'rgba(204,34,0,0.08)';
    return 'rgba(204,34,0,0.2)';
  }
  if (val > 0.7) return 'rgba(0,200,83,0.35)';
  if (val > 0.3) return 'rgba(50,215,75,0.15)';
  if (val > -0.3) return 'rgba(255,255,255,0.04)';
  if (val > -0.7) return 'rgba(255,69,58,0.15)';
  return 'rgba(255,69,58,0.35)';
}

function getCorrelationLabel(val: number): string {
  if (val > 0.7) return 'moving strongly together';
  if (val > 0.3) return 'mildly correlated';
  if (val > -0.3) return 'moving independently';
  if (val > -0.7) return 'mildly inversely correlated';
  return 'moving in opposite directions';
}

export default function CorrelationMatrix({ assets }: { assets: AssetWithClass[] }) {
  const { theme } = useTheme();
  const L = theme === 'light';

  const correlations = useMemo(() => {
    const selected = matrixAssets.map(s => assets.find(a => a.symbol === s)).filter(Boolean) as AssetWithClass[];
    const matrix: number[][] = [];
    for (let i = 0; i < selected.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < selected.length; j++) {
        if (i === j) { matrix[i][j] = 1; continue; }
        const aData = selected[i].sparkline.map((v, k) => k === 0 ? 0 : (v - selected[i].sparkline[0]) / selected[i].sparkline[0]);
        const bData = selected[j].sparkline.map((v, k) => k === 0 ? 0 : (v - selected[j].sparkline[0]) / selected[j].sparkline[0]);
        matrix[i][j] = computeCorrelation(aData, bData);
      }
    }
    return matrix;
  }, [assets]);

  const labels = matrixAssets.map(s => matrixLabels[s]);
  const divider = L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const labelColor = L ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)';

  return (
    <div style={{ marginTop: 24 }}>
      {/* #12: Section label with rule */}
      <div className="flex items-center gap-3 mb-3">
        <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: labelColor, fontWeight: 500, whiteSpace: 'nowrap' }}>
          CORRELATION MATRIX
        </span>
        <div className="flex-1 h-px" style={{ background: divider }} />
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground apple-transition">
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-xs z-[100]">
            Correlation measures how two assets move together. +1.0 = perfect sync, -1.0 = opposite, 0 = no relationship.
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground mb-3">How assets move together — updated every 5 seconds</p>

      <div className="relative">
        <div className="md:hidden text-[11px] text-muted-foreground mb-2">scroll →</div>
        {/* #7: overflow-x auto, min-width per cell */}
        <div
          className="rounded-2xl p-4"
          style={{
            background: L ? '#ffffff' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: L ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
            overflowX: 'auto',
          }}
        >
          <table className="text-xs" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th className="p-2" style={{ minWidth: 52 }} />
                {labels.map(l => (
                  <th key={l} className="p-2 text-center font-normal" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor, minWidth: 52 }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((rowLabel, i) => (
                <tr key={rowLabel}>
                  <td className="p-2 font-normal text-right pr-3" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: labelColor, minWidth: 52 }}>{rowLabel}</td>
                  {labels.map((colLabel, j) => {
                    const val = correlations[i]?.[j] ?? 0;
                    const isDiag = i === j;
                    // #5: Diagonal cells — neutral
                    const cellBg = isDiag
                      ? (L ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)')
                      : getCellColor(val, L);
                    const cellColor = isDiag
                      ? (L ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)')
                      : (L ? '#1d1d1f' : '#fff');
                    // #6: Tooltip positioning — bottom for top half, top for bottom half
                    const tooltipSide = i < labels.length / 2 ? 'bottom' : 'top';

                    return (
                      <Tooltip key={colLabel}>
                        <TooltipTrigger asChild>
                          <td
                            className="p-2 text-center tabular-nums font-medium cursor-default apple-transition"
                            style={{
                              background: cellBg,
                              color: cellColor,
                              borderRadius: 8,
                              border: Math.abs(val) > 0.7 && !isDiag
                                ? `1px solid ${L ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`
                                : '1px solid transparent',
                              minWidth: 52,
                            }}
                          >
                            {val >= 0 ? '+' : ''}{val.toFixed(2)}
                          </td>
                        </TooltipTrigger>
                        {!isDiag && (
                          <TooltipContent side={tooltipSide as any} className="max-w-[200px] text-xs z-[100]">
                            <div className="font-medium text-foreground mb-1">
                              {matrixAssets[i]} ↔ {matrixLabels[matrixAssets[j]]}: {val >= 0 ? '+' : ''}{val.toFixed(2)}
                            </div>
                            <div className="text-muted-foreground">
                              {getCorrelationLabel(val)}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
