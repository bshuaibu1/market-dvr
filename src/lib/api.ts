const API_BASE = 'https://dvr.masterwattson.site';

export async function fetchLatest() {
  const res = await fetch(`${API_BASE}/latest`);
  return res.json();
}

export async function fetchTicks(asset: string, limit = 500) {
  const res = await fetch(`${API_BASE}/ticks/${encodeURIComponent(asset)}?limit=${limit}`);
  return res.json();
}

export async function fetchTickRange(asset: string, from: number, to: number) {
  const res = await fetch(`${API_BASE}/ticks/${encodeURIComponent(asset)}/range?from=${from}&to=${to}`);
  return res.json();
}

export async function fetchEvents(limit = 50, type?: string) {
  const url = type
    ? `${API_BASE}/events?limit=${limit}&type=${type}`
    : `${API_BASE}/events?limit=${limit}`;
  const res = await fetch(url);
  return res.json();
}

export async function fetchEventCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/events/count`);
  const data = await res.json();
  return data.count;
}

export async function fetchAssetEvents(asset: string) {
  const res = await fetch(`${API_BASE}/events/${encodeURIComponent(asset)}`);
  return res.json();
}

export function formatPrice(rawPrice: number, exponent: number): number {
  return rawPrice * Math.pow(10, exponent);
}

export function formatPriceDisplay(rawPrice: number, exponent: number): string {
  const price = formatPrice(rawPrice, exponent);
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toFixed(10);
}

