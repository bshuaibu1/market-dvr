const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://dvr.masterwattson.site';

async function fetchJson(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} (${url})`);
  }

  return res.json();
}

export async function fetchLatest() {
  return fetchJson(`${API_BASE}/latest`);
}

export async function fetchTicks(asset: string, limit = 500) {
  return fetchJson(`${API_BASE}/ticks/${encodeURIComponent(asset)}?limit=${limit}`);
}

export async function fetchTickRange(asset: string, from: number, to: number) {
  return fetchJson(
    `${API_BASE}/ticks/${encodeURIComponent(asset)}/range?from=${from}&to=${to}`
  );
}

export async function fetchEvents(limit = 50, type?: string) {
  const url = type
    ? `${API_BASE}/events?limit=${limit}&type=${encodeURIComponent(type)}`
    : `${API_BASE}/events?limit=${limit}`;

  return fetchJson(url);
}

export async function fetchEventCount(): Promise<number> {
  const data = await fetchJson(`${API_BASE}/events/count`);
  return data.count;
}

export async function fetchAssetEvents(asset: string) {
  return fetchJson(`${API_BASE}/events/${encodeURIComponent(asset)}`);
}

export function formatPrice(rawPrice: number, exponent: number): number {
  return rawPrice * Math.pow(10, exponent);
}

export function formatPriceDisplay(rawPrice: number, exponent: number): string {
  const price = formatPrice(rawPrice, exponent);

  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (price >= 1) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toFixed(10);
}

export async function fetchEventStats() {
  return fetchJson(`${API_BASE}/events/stats`);
}