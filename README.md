# 📼 Market DVR

> A DVR for financial markets. Record crashes, pumps, and news shocks — then replay them frame-by-frame at sub-second resolution.

**Live demo:** [dvr.masterwattson.site](https://dvr.masterwattson.site)

Built for the **Pyth Pro Hackathon** — powered by [Pyth Lazer](https://pyth.network/) real-time price feeds.

---

## What is Market DVR?

Traditional charting tools show you *that* something happened. Market DVR shows you *how* it happened — at millisecond precision.

When a flash crash hits, a whale dumps, or a news shock ripples through correlated assets, Market DVR captures every tick and lets you scrub through the event like rewinding a DVR. You can pause, step frame-by-frame, and watch exactly how price, spread, and confidence evolved in real time.

---

## Features

### 📺 Live Page
- Real-time prices for 16 assets across crypto, commodities, and forex
- 5-minute % change, bid-ask spread, and Pyth confidence score per asset
- Market Pulse chart — normalized % change for BTC, ETH, SOL overlaid
- Correlation Matrix — live Pearson correlation updated every 5 seconds
- Recent Events feed — automatically detected volatility spikes, spread spikes, confidence divergences

### 🎬 Replay Page
- Scrub through any recorded event frame-by-frame
- Playback speeds: 50ms, 200ms, 5s, 30s, 1m
- Frame inspector — price, spread, confidence, bid/ask at each tick
- **Live tail mode** — follow the latest ticks in real time (auto-detaches on scrub)
- Shock Propagation panel — see how a price shock in one asset rippled to correlated peers
- Pyth Pro badge on sub-second timeframes

### 🗺️ Heatmap Page
- Volatility heatmap across all 16 assets
- Market Stress Gauge — composite score of spread, confidence, and volatility
- Top Movers — ranked by absolute % change with confidence scores
- Live Correlations — 5 key asset pairs with real-time Pearson correlation bars

### 📋 Events Page
- Full log of 40,000+ automatically detected market events
- Filter by type: volatility spike, spread spike, confidence divergence
- Search by asset
- Stats: total events, crash count, avg duration, most active asset
- One-click Replay → jump straight to any event

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data | Pyth Lazer (Pyth Pro) — real-time WebSocket feed |
| Backend | Node.js + Express + WebSocket server |
| Database | PostgreSQL — tick storage + event detection |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| Hosting | VPS + Caddy reverse proxy |

---

## Architecture

```
Pyth Lazer WebSocket
        │
        ▼
  Node.js Backend
  ├── Tick recorder → PostgreSQL
  ├── Event detector (volatility / spread / confidence)
  ├── In-memory latest tick cache
  ├── REST API (/latest, /ticks, /events)
  └── WebSocket broadcast → frontend
        │
        ▼
  React Frontend
  ├── Live Page   — polling /latest every 1s
  ├── Replay Page — fetching tick ranges from DB
  ├── Heatmap     — derived from live tick data
  └── Events Page — paginated event log from DB
```

---

## Assets Tracked (16 feeds)

**Crypto:** BTC/USD, ETH/USD, SOL/USD, BNB/USD, BONK/USD, WIF/USD, DOGE/USD, PYTH/USD

**Commodities:** XAU/USD (Gold), XAG/USD (Silver)

**Forex:** EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD

---

## Event Detection

The backend continuously monitors each feed and auto-detects:

- **Volatility Spike** — price deviates >0.05% from rolling 50-tick average
- **Spread Spike** — bid-ask spread widens >3x baseline
- **Confidence Divergence** — Pyth confidence score drops >3x baseline

Each event is stored with full metadata: start/end time, first/last price, peak spread, duration.

---

## Running Locally

```bash
# Backend
cd backend
npm install
cp .env.example .env  # add your Pyth Pro token + DB credentials
node index.js

# Frontend
npm install
npm run dev
```

**Environment variables needed:**
```
PYTH_ACCESS_TOKEN=your_pyth_pro_token
DB_HOST=localhost
DB_PORT=5432
DB_NAME=market_dvr
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Why Pyth Pro?

Standard price feeds update every few seconds. Pyth Pro (Lazer) delivers:
- **Real-time** WebSocket streaming at sub-second resolution
- **Bid/ask spread** data — not just mid price
- **Confidence intervals** — Pyth's own uncertainty metric per tick
- **50ms and 200ms channels** — true millisecond market microstructure

This is what makes the DVR concept possible. Without sub-second data, you can't see the microstructure of a crash — just its aftermath.

---

## License

MIT
