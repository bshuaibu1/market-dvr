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

export type AssetClass = 'crypto' | 'commodities' | 'forex';

export interface AssetWithClass extends Asset {
  assetClass: AssetClass;
}

const baseAssets: AssetWithClass[] = [
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin', price: 83421.50, change: 1.24, spread: 5.21, confidence: 0.92, volatile: false, sparkline: [], assetClass: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum', price: 3287.80, change: -0.67, spread: 1.45, confidence: 0.88, volatile: false, sparkline: [], assetClass: 'crypto' },
  { symbol: 'SOL/USD', name: 'Solana', price: 187.42, change: 3.85, spread: 0.18, confidence: 0.85, volatile: true, sparkline: [], assetClass: 'crypto' },
  { symbol: 'BNB/USD', name: 'BNB', price: 612.30, change: 0.42, spread: 0.85, confidence: 0.91, volatile: false, sparkline: [], assetClass: 'crypto' },
  { symbol: 'WIF/USD', name: 'dogwifhat', price: 1.87, change: -2.31, spread: 0.003, confidence: 0.72, volatile: true, sparkline: [], assetClass: 'crypto' },
  { symbol: 'BONK/USD', name: 'Bonk', price: 0.00002847, change: 5.12, spread: 0.0000001, confidence: 0.68, volatile: true, sparkline: [], assetClass: 'crypto' },
  // Commodities
  { symbol: 'XAU/USD', name: 'Gold', price: 2340.00, change: 0.18, spread: 0.45, confidence: 0.96, volatile: false, sparkline: [], assetClass: 'commodities' },
  { symbol: 'XAG/USD', name: 'Silver', price: 27.50, change: -0.32, spread: 0.03, confidence: 0.94, volatile: false, sparkline: [], assetClass: 'commodities' },
  { symbol: 'WTI/USD', name: 'Crude Oil', price: 78.20, change: 0.85, spread: 0.04, confidence: 0.91, volatile: false, sparkline: [], assetClass: 'commodities' },
  { symbol: 'BRENT/USD', name: 'Brent Crude', price: 82.40, change: 0.72, spread: 0.05, confidence: 0.90, volatile: false, sparkline: [], assetClass: 'commodities' },
  { symbol: 'NATGAS/USD', name: 'Natural Gas', price: 2.10, change: -1.15, spread: 0.005, confidence: 0.82, volatile: true, sparkline: [], assetClass: 'commodities' },
  { symbol: 'COPPER/USD', name: 'Copper', price: 4.35, change: 0.41, spread: 0.008, confidence: 0.89, volatile: false, sparkline: [], assetClass: 'commodities' },
  // Forex
  { symbol: 'EUR/USD', name: 'Euro', price: 1.0820, change: 0.05, spread: 0.00015, confidence: 0.98, volatile: false, sparkline: [], assetClass: 'forex' },
  { symbol: 'GBP/USD', name: 'British Pound', price: 1.2650, change: -0.03, spread: 0.00018, confidence: 0.97, volatile: false, sparkline: [], assetClass: 'forex' },
  { symbol: 'USD/JPY', name: 'Japanese Yen', price: 149.50, change: 0.08, spread: 0.015, confidence: 0.97, volatile: false, sparkline: [], assetClass: 'forex' },
  { symbol: 'USD/CHF', name: 'Swiss Franc', price: 0.8980, change: -0.02, spread: 0.00012, confidence: 0.98, volatile: false, sparkline: [], assetClass: 'forex' },
  { symbol: 'AUD/USD', name: 'Australian Dollar', price: 0.6520, change: 0.04, spread: 0.00014, confidence: 0.96, volatile: false, sparkline: [], assetClass: 'forex' },
  { symbol: 'USD/CAD', name: 'Canadian Dollar', price: 1.3580, change: -0.06, spread: 0.00016, confidence: 0.96, volatile: false, sparkline: [], assetClass: 'forex' },
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

export function getInitialAssets(): AssetWithClass[] {
  return baseAssets.map(a => ({
    ...a,
    sparkline: generateSparkline(a.price, a.assetClass === 'forex' ? 0.0001 : a.assetClass === 'commodities' ? 0.0005 : 0.001),
  }));
}

export function tickAsset(asset: AssetWithClass): AssetWithClass {
  const assetClass = 'assetClass' in asset ? asset.assetClass : 'crypto';
  let volatility: number;
  if (assetClass === 'forex') {
    volatility = asset.volatile ? 0.00008 : 0.00003;
  } else if (assetClass === 'commodities') {
    volatility = asset.volatile ? 0.0004 : 0.00015;
  } else {
    volatility = asset.volatile ? 0.0008 : 0.0003;
  }
  const delta = (Math.random() - 0.5) * volatility * asset.price;
  const newPrice = asset.price + delta;
  const changeJitter = assetClass === 'forex' ? 0.005 : assetClass === 'commodities' ? 0.01 : 0.02;
  const newChange = asset.change + (Math.random() - 0.5) * changeJitter;
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
