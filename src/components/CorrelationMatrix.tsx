import { useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { AssetWithClass } from '@/lib/mockData';

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

function getCellColor(val: number): string {
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

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="label-caps">Correlation Matrix</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground apple-transition">
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[260px] text-xs">
            Correlation measures how two assets move together. +1.0 means they move in perfect sync,
            -1.0 means they move in opposite directions, and 0 means no relationship.
          </TooltipContent>
        </Tooltip>
      </div>
      <p className="text-xs text-muted-foreground mb-4">How assets are moving together right now — updated every 5 seconds</p>

      <div className="relative">
        {/* Mobile scroll hint */}
        <div className="md:hidden text-[11px] text-muted-foreground mb-2 flex items-center gap-1">
          <span>scroll →</span>
        </div>
        <div className="surface-1 rounded-2xl p-4 overflow-x-auto scrollbar-hide" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <table className="text-xs" style={{ minWidth: 420 }}>
            <thead>
              <tr>
                <th className="p-2" />
                {labels.map(l => (
                  <th key={l} className="p-2 text-center label-caps font-normal">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((rowLabel, i) => (
                <tr key={rowLabel}>
                  <td className="p-2 label-caps font-normal text-right pr-3">{rowLabel}</td>
                  {labels.map((colLabel, j) => {
                    const val = correlations[i]?.[j] ?? 0;
                    const isDiag = i === j;
                    return (
                      <Tooltip key={colLabel}>
                        <TooltipTrigger asChild>
                          <td
                            className="p-2 text-center tabular-nums font-medium text-foreground cursor-default apple-transition"
                            style={{
                              background: isDiag ? 'rgba(255,255,255,0.06)' : getCellColor(val),
                              borderRadius: 8,
                              border: Math.abs(val) > 0.7 && !isDiag ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                            }}
                          >
                            {val >= 0 ? '+' : ''}{val.toFixed(2)}
                          </td>
                        </TooltipTrigger>
                        {!isDiag && (
                          <TooltipContent side="top" className="max-w-[240px] text-xs">
                            <div className="font-medium text-foreground mb-1">
                              {matrixAssets[i]} and {matrixLabels[matrixAssets[j]]} correlation: {val >= 0 ? '+' : ''}{val.toFixed(2)}
                            </div>
                            <div className="text-muted-foreground">
                              These assets are {getCorrelationLabel(val)} right now
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
