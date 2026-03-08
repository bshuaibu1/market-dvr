export interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  spread: number;
  confidence: number;
  volatile: boolean;
  sparkline: number[];
}

export interface MarketEvent {
  id: string;
  type: 'crash' | 'pump' | 'spread' | 'confidence';
  asset: string;
  description: string;
  timestamp: string;
  color: string;
}

const baseAssets: Asset[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 83421.50, change: 1.24, spread: 5.21, confidence: 0.92, volatile: false, sparkline: [] },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 3287.80, change: -0.67, spread: 1.45, confidence: 0.88, volatile: false, sparkline: [] },
  { symbol: 'SOL/USD', name: 'Solana', price: 187.42, change: 3.85, spread: 0.18, confidence: 0.85, volatile: true, sparkline: [] },
  { symbol: 'BNB/USD', name: 'BNB', price: 612.30, change: 0.42, spread: 0.85, confidence: 0.91, volatile: false, sparkline: [] },
  { symbol: 'WIF/USD', name: 'dogwifhat', price: 1.87, change: -2.31, spread: 0.003, confidence: 0.72, volatile: true, sparkline: [] },
  { symbol: 'BONK/USD', name: 'Bonk', price: 0.00002847, change: 5.12, spread: 0.0000001, confidence: 0.68, volatile: true, sparkline: [] },
];

function generateSparkline(base: number, volatility: number): number[] {
  const points: number[] = [];
  let current = base;
  for (let i = 0; i < 60; i++) {
    current += (Math.random() - 0.5) * volatility * base;
    points.push(current);
  }
  return points;
}

export function getInitialAssets(): Asset[] {
  return baseAssets.map(a => ({
    ...a,
    sparkline: generateSparkline(a.price, 0.001),
  }));
}

export function tickAsset(asset: Asset): Asset {
  const volatility = asset.volatile ? 0.0008 : 0.0003;
  const delta = (Math.random() - 0.5) * volatility * asset.price;
  const newPrice = asset.price + delta;
  const newChange = asset.change + (Math.random() - 0.5) * 0.02;
  const newSparkline = [...asset.sparkline.slice(1), newPrice];
  const spreadJitter = asset.spread * (1 + (Math.random() - 0.5) * 0.1);
  const confJitter = Math.min(1, Math.max(0.5, asset.confidence + (Math.random() - 0.5) * 0.01));

  return {
    ...asset,
    price: newPrice,
    change: newChange,
    spread: spreadJitter,
    confidence: confJitter,
    sparkline: newSparkline,
  };
}

export const mockEvents: MarketEvent[] = [
  { id: '1', type: 'crash', asset: 'BTC/USD', description: 'Flash crash — BTC dropped 3.2% in 2 seconds then recovered over 8s', timestamp: '2 min ago', color: '#ff453a' },
  { id: '2', type: 'spread', asset: 'ETH/USD', description: 'Liquidity crisis — bid/ask spread widened 10x for 45 seconds', timestamp: '8 min ago', color: '#ffd60a' },
  { id: '3', type: 'pump', asset: 'SOL/USD', description: 'SOL pumped 4.1% in 3 seconds on massive buy pressure', timestamp: '14 min ago', color: '#32d74b' },
  { id: '4', type: 'confidence', asset: 'BTC/USD', description: 'Confidence interval collapsed 5x during volatility spike', timestamp: '22 min ago', color: '#86868b' },
  { id: '5', type: 'crash', asset: 'WIF/USD', description: 'WIF flash crash — 8.4% drop in under 5 seconds', timestamp: '31 min ago', color: '#ff453a' },
  { id: '6', type: 'pump', asset: 'BONK/USD', description: 'BONK surged 12% in 10 seconds following whale accumulation', timestamp: '45 min ago', color: '#32d74b' },
];

export function formatPrice(price: number): string {
  if (price < 0.001) return price.toFixed(8);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Replay mock data
export function generateReplayData(points: number = 500) {
  const data = [];
  let price = 83421.50;
  let bid = price - 2.5;
  let ask = price + 2.5;
  
  for (let i = 0; i < points; i++) {
    const t = i / points;
    // Create a crash event around 30%
    let volatility = 0.0003;
    if (t > 0.28 && t < 0.32) volatility = 0.003;
    if (t > 0.6 && t < 0.65) volatility = 0.002;
    
    const delta = (Math.random() - 0.5) * volatility * price;
    price += delta;
    
    const spreadWidth = (t > 0.28 && t < 0.35) ? 25 + Math.random() * 30 : 3 + Math.random() * 4;
    bid = price - spreadWidth / 2;
    ask = price + spreadWidth / 2;
    
    const confidence = (t > 0.28 && t < 0.35) ? 0.5 + Math.random() * 0.2 : 0.85 + Math.random() * 0.1;
    
    data.push({
      time: i,
      price: Math.round(price * 100) / 100,
      bid: Math.round(bid * 100) / 100,
      ask: Math.round(ask * 100) / 100,
      spread: Math.round(spreadWidth * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    });
  }
  return data;
}
