import { useState, useEffect, useCallback } from 'react';
import { Bell, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { allAssetsList } from '@/lib/mockData';
import { toast } from 'sonner';

export interface Alert {
  id: string;
  asset: string;
  condition: 'price_above' | 'price_below' | 'spread_exceeds' | 'confidence_below' | 'change_exceeds';
  value: number;
  triggered: boolean;
}

const conditionLabels: Record<string, string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  spread_exceeds: 'Spread Exceeds',
  confidence_below: 'Confidence Below',
  change_exceeds: '% Change Exceeds',
};

function conditionToText(alert: Alert): string {
  const label = conditionLabels[alert.condition];
  const unit = alert.condition === 'confidence_below' ? '%' : alert.condition === 'change_exceeds' ? '%' : '$';
  return `${alert.asset} ${label.toLowerCase()} ${unit}${alert.value}`;
}

// Global store for alerts accessible from Navbar
let globalAlerts: Alert[] = [];
let globalListeners: (() => void)[] = [];
export function getAlerts() { return globalAlerts; }
export function subscribeAlerts(fn: () => void) {
  globalListeners.push(fn);
  return () => { globalListeners = globalListeners.filter(f => f !== fn); };
}
function notifyAlerts() { globalListeners.forEach(fn => fn()); }

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>(globalAlerts);

  useEffect(() => {
    return subscribeAlerts(() => setAlerts([...globalAlerts]));
  }, []);

  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'triggered'>) => {
    const newAlert: Alert = { ...alert, id: crypto.randomUUID(), triggered: false };
    globalAlerts = [...globalAlerts, newAlert];
    notifyAlerts();
  }, []);

  const removeAlert = useCallback((id: string) => {
    globalAlerts = globalAlerts.filter(a => a.id !== id);
    notifyAlerts();
  }, []);

  const triggerAlert = useCallback((id: string) => {
    globalAlerts = globalAlerts.map(a => a.id === id ? { ...a, triggered: true } : a);
    notifyAlerts();
  }, []);

  return { alerts, addAlert, removeAlert, triggerAlert };
}

// Check alerts against current asset data
export function checkAlerts(assets: { symbol: string; price: number; spread: number; confidence: number; change: number }[]) {
  const triggered: Alert[] = [];
  globalAlerts.forEach(alert => {
    if (alert.triggered) return;
    const asset = assets.find(a => a.symbol === alert.asset);
    if (!asset) return;
    let shouldTrigger = false;
    switch (alert.condition) {
      case 'price_above': shouldTrigger = asset.price > alert.value; break;
      case 'price_below': shouldTrigger = asset.price < alert.value; break;
      case 'spread_exceeds': shouldTrigger = asset.spread > alert.value; break;
      case 'confidence_below': shouldTrigger = asset.confidence * 100 < alert.value; break;
      case 'change_exceeds': shouldTrigger = Math.abs(asset.change) > alert.value; break;
    }
    if (shouldTrigger) {
      triggered.push(alert);
      globalAlerts = globalAlerts.map(a => a.id === alert.id ? { ...a, triggered: true } : a);
    }
  });
  if (triggered.length > 0) {
    notifyAlerts();
    triggered.forEach(alert => {
      const asset = assets.find(a => a.symbol === alert.asset);
      toast.error(`🔴 ALERT: ${conditionToText(alert)}`, {
        description: asset ? `Current price: $${asset.price.toFixed(2)}` : undefined,
        duration: 8000,
        action: { label: 'View Replay →', onClick: () => window.location.href = '/replay' },
      });
    });
  }
}

export function AlertPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [showForm, setShowForm] = useState(false);
  const [formAsset, setFormAsset] = useState(allAssetsList[0].symbol);
  const [formCondition, setFormCondition] = useState<Alert['condition']>('price_above');
  const [formValue, setFormValue] = useState('');

  const handleCreate = () => {
    const val = parseFloat(formValue);
    if (isNaN(val)) return;
    addAlert({ asset: formAsset, condition: formCondition, value: val });
    setShowForm(false);
    setFormValue('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[360px] z-50 frosted-glass border-l border-border p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="label-caps text-sm">Alerts</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground apple-transition">
                <X size={18} />
              </button>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-primary-foreground apple-transition mb-6"
              style={{ background: '#e6007a' }}
            >
              <Plus size={14} /> Add Alert
            </button>

            <AnimatePresence>
              {showForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-6"
                >
                  <div className="space-y-3 surface-1 rounded-2xl p-4" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div>
                      <label className="label-caps block mb-1">Asset</label>
                      <select
                        value={formAsset}
                        onChange={e => setFormAsset(e.target.value)}
                        className="w-full h-9 rounded-xl bg-background text-foreground text-sm px-3 focus:outline-none"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {allAssetsList.map(a => (
                          <option key={a.symbol} value={a.symbol}>{a.symbol} — {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-caps block mb-1">Condition</label>
                      <select
                        value={formCondition}
                        onChange={e => setFormCondition(e.target.value as Alert['condition'])}
                        className="w-full h-9 rounded-xl bg-background text-foreground text-sm px-3 focus:outline-none"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {Object.entries(conditionLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-caps block mb-1">Value</label>
                      <input
                        type="number"
                        value={formValue}
                        onChange={e => setFormValue(e.target.value)}
                        placeholder="Enter value..."
                        className="w-full h-9 rounded-xl bg-background text-foreground text-sm px-3 placeholder:text-muted-foreground focus:outline-none tabular-nums"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      />
                    </div>
                    <button
                      onClick={handleCreate}
                      className="w-full py-2 rounded-xl text-sm font-medium text-primary-foreground apple-transition"
                      style={{ background: '#e6007a' }}
                    >
                      Create Alert
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No alerts set. Add one above.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="surface-1 rounded-xl p-3 flex items-center gap-3"
                    style={{
                      border: alert.triggered ? '1px solid #ff453a' : '1px solid rgba(255,255,255,0.08)',
                      background: alert.triggered ? 'rgba(255,69,58,0.08)' : undefined,
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.triggered ? 'bg-negative' : 'bg-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{alert.asset}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{conditionToText(alert)}</div>
                    </div>
                    <button onClick={() => removeAlert(alert.id)} className="text-muted-foreground hover:text-foreground apple-transition flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AlertBell() {
  const [open, setOpen] = useState(false);
  const { alerts } = useAlerts();
  const triggeredCount = alerts.filter(a => a.triggered).length;
  const hasActive = alerts.length > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full apple-transition hover:bg-accent"
        style={triggeredCount > 0 ? { animation: 'bell-shake 0.5s ease' } : undefined}
      >
        <Bell size={16} className={hasActive ? 'text-primary fill-primary' : 'text-muted-foreground'} style={hasActive ? { color: '#e6007a', fill: '#e6007a' } : undefined} />
        {triggeredCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-primary-foreground" style={{ background: '#e6007a' }}>
            {triggeredCount}
          </span>
        )}
      </button>
      <AlertPanel open={open} onClose={() => setOpen(false)} />
    </>
  );
}
