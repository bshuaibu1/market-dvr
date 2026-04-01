require('dotenv').config();
const { PythLazerClient } = require('@pythnetwork/pyth-lazer-sdk');
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const ASSETS = {
  1: 'BTC/USD',
  2: 'ETH/USD',
  6: 'SOL/USD',
  15: 'BNB/USD',
  9: 'BONK/USD',
  10: 'WIF/USD',
  13: 'DOGE/USD',
  3: 'PYTH/USD',
  346: 'XAU/USD',
  345: 'XAG/USD',
  327: 'EUR/USD',
  333: 'GBP/USD',
  340: 'USD/JPY',
  339: 'USD/CHF',
  315: 'AUD/USD',
  338: 'USD/CAD',
};

const EXPONENTS = {
  1: -8,
  2: -8,
  6: -8,
  9: -10,
  10: -8,
  13: -8,
  15: -8,
  3: -8,
  346: -3,
  345: -5,
  327: -5,
  333: -5,
  340: -3,
  339: -5,
  315: -5,
  338: -5,
};

const CRYPTO_IDS = [1, 2, 6, 9, 10];
const OTHER_IDS = [15, 13, 3, 346, 345, 327, 333, 340, 339, 315, 338];
const FEED_IDS = [...CRYPTO_IDS, ...OTHER_IDS];

const WINDOW = 50;
const VOLATILITY_THRESHOLD = 0.0005;
const SPREAD_THRESHOLD = 3.0;
const CONFIDENCE_THRESHOLD = 3.0;

const MAX_TICK_BUFFER = 5000;
const TICK_FLUSH_INTERVAL_MS = 2000;
const MAX_EVENT_QUEUE = 500;
const EVENT_FLUSH_INTERVAL_MS = 1000;
const MAX_LATEST_AGE_MS = 5 * 60 * 1000;

const baselines = {};
for (const id of FEED_IDS) {
  baselines[id] = {
    prices: [],
    spreads: [],
    confidences: [],
    inEvent: false,
    eventType: null,
    eventStart: null,
    eventFirstPrice: null,
    eventMaxSpread: null,
    eventMaxConfidence: null,
    eventPeakFrame: null,
  };
}

const wsClients = new Set();
const latestTicks = {};
let tickInsertBuffer = [];
let eventInsertQueue = [];
let flushingTicks = false;
let flushingEvents = false;
let shuttingDown = false;
let pythClient = null;
let tickFlushTimer = null;
let eventFlushTimer = null;
let latestCleanupTimer = null;

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function buildTickRow(asset, timestampUs, price, bestBid, bestAsk, confidence, exponent) {
  return {
    asset,
    timestamp_us: String(timestampUs),
    price: String(price),
    best_bid: String(bestBid),
    best_ask: String(bestAsk),
    confidence: String(confidence),
    exponent,
  };
}

function broadcast(payload) {
  if (wsClients.size === 0) return;
  const msg = JSON.stringify(payload);

  for (const ws of wsClients) {
    if (ws.readyState === 1) {
      try {
        ws.send(msg);
      } catch (err) {
        console.error('WS send error:', err.message);
      }
    }
  }
}

function broadcastTick(asset, tick) {
  broadcast({ type: 'tick', asset, data: tick });
}

function broadcastEvent(event) {
  broadcast({ type: 'event', data: event });
}

function queueTick(asset, timestampUs, price, bestBid, bestAsk, confidence, exponent = -8) {
  if (
    !asset ||
    !Number.isFinite(Number(timestampUs)) ||
    !Number.isFinite(Number(price)) ||
    !Number.isFinite(Number(bestBid)) ||
    !Number.isFinite(Number(bestAsk)) ||
    !Number.isFinite(Number(confidence))
  ) {
    return;
  }

  tickInsertBuffer.push([
    asset,
    String(timestampUs),
    String(price),
    String(bestBid),
    String(bestAsk),
    String(confidence),
    exponent,
  ]);

  if (tickInsertBuffer.length > MAX_TICK_BUFFER) {
    tickInsertBuffer = tickInsertBuffer.slice(-MAX_TICK_BUFFER);
  }
}

function queueEvent(asset, eventType, startTime, endTime, firstPrice, lastPrice, maxSpread, baselineSpread, maxConfidence, baselineConfidence, peakFrame) {
  if (
    !asset ||
    !eventType ||
    !Number.isFinite(Number(startTime)) ||
    !Number.isFinite(Number(endTime))
  ) {
    return;
  }

  const duration = Math.max(0, Math.round((Number(endTime) - Number(startTime)) / 1000));

  eventInsertQueue.push({
    asset,
    eventType,
    startTime: String(startTime),
    endTime: String(endTime),
    firstPrice: String(firstPrice),
    lastPrice: String(lastPrice),
    maxSpread: String(Math.round(maxSpread)),
    baselineSpread: String(Math.round(baselineSpread)),
    maxConfidence: String(Math.round(maxConfidence)),
    baselineConfidence: String(Math.round(baselineConfidence)),
    peakFrame: String(peakFrame),
    duration,
  });

  if (eventInsertQueue.length > MAX_EVENT_QUEUE) {
    eventInsertQueue = eventInsertQueue.slice(-MAX_EVENT_QUEUE);
  }
}

async function flushTicks() {
  if (flushingTicks || tickInsertBuffer.length === 0 || shuttingDown) return;

  flushingTicks = true;
  const batch = tickInsertBuffer.splice(0, Math.min(tickInsertBuffer.length, 1000));

  try {
    const values = [];
    const placeholders = batch.map((row, rowIndex) => {
      const base = rowIndex * 7;
      values.push(...row);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
    });

    const sql = `
      INSERT INTO ticks (
        asset,
        timestamp_us,
        price,
        best_bid,
        best_ask,
        confidence,
        exponent
      ) VALUES ${placeholders.join(', ')}
    `;

    await pool.query(sql, values);
  } catch (err) {
    console.error('Tick batch flush failed:', err.message);
    tickInsertBuffer = batch.concat(tickInsertBuffer).slice(-MAX_TICK_BUFFER);
  } finally {
    flushingTicks = false;
  }
}

async function flushEvents() {
  if (flushingEvents || eventInsertQueue.length === 0 || shuttingDown) return;

  flushingEvents = true;
  const event = eventInsertQueue.shift();

  try {
    const result = await pool.query(
      `INSERT INTO events (
        asset,
        event_type,
        start_time,
        end_time,
        first_price,
        last_price,
        max_spread,
        baseline_spread,
        max_confidence,
        baseline_confidence,
        peak_frame_timestamp,
        duration_ms
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      RETURNING *`,
      [
        event.asset,
        event.eventType,
        event.startTime,
        event.endTime,
        event.firstPrice,
        event.lastPrice,
        event.maxSpread,
        event.baselineSpread,
        event.maxConfidence,
        event.baselineConfidence,
        event.peakFrame,
        event.duration,
      ]
    );

    if (result.rows[0]) {
      console.log(`Event saved: ${event.eventType} on ${event.asset} duration ${event.duration}ms`);
      broadcastEvent(result.rows[0]);
    }
  } catch (err) {
    console.error('Event flush failed:', err.message);
    eventInsertQueue.unshift(event);
  } finally {
    flushingEvents = false;
  }
}

function detectEvents(feedId, timestampUs, price, spread, confidence) {
  const b = baselines[feedId];
  const asset = ASSETS[feedId];
  if (!b || !asset) return;

  b.prices.push(price);
  b.spreads.push(spread);
  b.confidences.push(confidence);

  if (b.prices.length > WINDOW) b.prices.shift();
  if (b.spreads.length > WINDOW) b.spreads.shift();
  if (b.confidences.length > WINDOW) b.confidences.shift();

  if (b.prices.length < 10) return;

  const avgSpread = b.spreads.reduce((a, c) => a + c, 0) / b.spreads.length;
  const avgConfidence = b.confidences.reduce((a, c) => a + c, 0) / b.confidences.length;
  const avgPrice = b.prices.reduce((a, c) => a + c, 0) / b.prices.length;

  if (!Number.isFinite(avgSpread) || !Number.isFinite(avgConfidence) || !Number.isFinite(avgPrice) || avgPrice <= 0) {
    return;
  }

  const priceChange = Math.abs(price - avgPrice) / avgPrice;

  if (!b.inEvent) {
    let detected = null;

    if (priceChange > VOLATILITY_THRESHOLD) detected = 'volatility_spike';
    else if (avgSpread > 0 && spread > avgSpread * SPREAD_THRESHOLD) detected = 'spread_spike';
    else if (avgConfidence > 0 && confidence > avgConfidence * CONFIDENCE_THRESHOLD) detected = 'confidence_divergence';

    if (detected) {
      b.inEvent = true;
      b.eventType = detected;
      b.eventStart = timestampUs;
      b.eventFirstPrice = price;
      b.eventMaxSpread = spread;
      b.eventMaxConfidence = confidence;
      b.eventPeakFrame = timestampUs;
      console.log(`Event started: ${detected} on ${asset}`);
    }

    return;
  }

  if (spread > b.eventMaxSpread) {
    b.eventMaxSpread = spread;
    b.eventPeakFrame = timestampUs;
  }

  if (confidence > b.eventMaxConfidence) {
    b.eventMaxConfidence = confidence;
  }

  const spreadNormal = spread < avgSpread * 1.5;
  const confidenceNormal = confidence < avgConfidence * 1.5;
  const priceNormal = priceChange < VOLATILITY_THRESHOLD * 0.5;

  if (spreadNormal && confidenceNormal && priceNormal) {
    queueEvent(
      asset,
      b.eventType,
      b.eventStart,
      timestampUs,
      b.eventFirstPrice,
      price,
      b.eventMaxSpread,
      avgSpread,
      b.eventMaxConfidence,
      avgConfidence,
      b.eventPeakFrame
    );

    b.inEvent = false;
    b.eventType = null;
    b.eventStart = null;
    b.eventFirstPrice = null;
    b.eventMaxSpread = null;
    b.eventMaxConfidence = null;
    b.eventPeakFrame = null;
  }
}

function handleMessage(message) {
  try {
    if (message?.type !== 'json') return;

    const data = message.value;
    if (data?.type !== 'streamUpdated') return;

    const timestampUs = safeNumber(data?.parsed?.timestampUs);
    const priceFeeds = Array.isArray(data?.parsed?.priceFeeds) ? data.parsed.priceFeeds : [];

    if (!timestampUs || priceFeeds.length === 0) return;

    for (const feed of priceFeeds) {
      const feedId = safeNumber(feed.priceFeedId);
      const asset = ASSETS[feedId];
      if (!asset) continue;

      const price = safeNumber(feed.price);
      const bid = safeNumber(feed.bestBidPrice, price);
      const ask = safeNumber(feed.bestAskPrice, price);
      const confidence = safeNumber(feed.confidence);
      const exponent = EXPONENTS[feedId] ?? -8;

      if (!Number.isFinite(price) || price <= 0) continue;

      const spread = Math.max(0, ask - bid);
      const tick = buildTickRow(asset, timestampUs, price, bid, ask, confidence, exponent);

      latestTicks[asset] = {
        ...tick,
        _lastSeenMs: Date.now(),
      };

      broadcastTick(asset, tick);
      queueTick(asset, timestampUs, price, bid, ask, confidence, exponent);
      detectEvents(feedId, timestampUs, price, spread, confidence);
    }
  } catch (err) {
    console.error('Error processing message:', err.message);
  }
}

async function startPythConnection() {
  console.log('Connecting to Pyth Pro...');

  pythClient = await PythLazerClient.create({
    token: process.env.PYTH_ACCESS_TOKEN,
    webSocketPoolConfig: {
      numConnections: 3,
      onError: (e) => console.error('WebSocket error:', e.message),
    },
  });

  pythClient.addMessageListener(handleMessage);

  pythClient.subscribe({
    type: 'subscribe',
    subscriptionId: 1,
    priceFeedIds: CRYPTO_IDS,
    properties: ['price', 'bestBidPrice', 'bestAskPrice', 'confidence'],
    formats: ['solana'],
    deliveryFormat: 'json',
    channel: 'real_time',
    jsonBinaryEncoding: 'hex',
  });

  pythClient.subscribe({
    type: 'subscribe',
    subscriptionId: 2,
    priceFeedIds: OTHER_IDS,
    properties: ['price', 'bestBidPrice', 'bestAskPrice', 'confidence', 'feedUpdateTimestamp'],
    formats: ['solana'],
    deliveryFormat: 'json',
    channel: 'fixed_rate@200ms',
    jsonBinaryEncoding: 'hex',
  });

  console.log(`Subscribed to ${FEED_IDS.length} feeds`);
}

const app = express();
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      timestamp: Date.now(),
      tickBuffer: tickInsertBuffer.length,
      eventQueue: eventInsertQueue.length,
      latestCount: Object.keys(latestTicks).length,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

app.get('/latest', async (req, res) => {
  try {
    const now = Date.now();
    const cached = Object.values(latestTicks)
      .filter((t) => {
        if (!t) return false;
        if (!t.price || t.price === 'NaN' || Number.isNaN(Number(t.price))) return false;
        if (t._lastSeenMs && now - t._lastSeenMs > MAX_LATEST_AGE_MS) return false;
        return true;
      })
      .map(({ _lastSeenMs, ...tick }) => tick);

    res.json(cached);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/ticks/:asset', async (req, res) => {
  try {
    const asset = decodeURIComponent(req.params.asset);
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);

    const result = await pool.query(
      `SELECT * FROM ticks WHERE asset = $1 ORDER BY timestamp_us DESC LIMIT $2`,
      [asset, limit]
    );

    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/ticks/:asset/range', async (req, res) => {
  try {
    const asset = decodeURIComponent(req.params.asset);
    const from = req.query.from;
    const to = req.query.to;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    const result = await pool.query(
      `SELECT * FROM ticks
       WHERE asset = $1
       AND timestamp_us BETWEEN $2 AND $3
       ORDER BY timestamp_us ASC`,
      [asset, from, to]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/events', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const type = req.query.type;

    let query = `SELECT * FROM events`;
    const params = [];

    if (type) {
      params.push(type);
      query += ` WHERE event_type = $${params.length}`;
    }

    params.push(limit);
    params.push(offset);

    query += ` ORDER BY start_time DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/events/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM events');
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/events/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN event_type = 'volatility_spike' AND last_price < first_price THEN 1 END) AS crashes,
        AVG(duration_ms) AS avg_duration,
        MODE() WITHIN GROUP (ORDER BY asset) AS most_active
      FROM events
    `);

    const row = result.rows[0];
    res.json({
      total: parseInt(row.total || '0', 10),
      crashes: parseInt(row.crashes || '0', 10),
      avg_duration_ms: parseFloat(row.avg_duration) || 0,
      most_active: row.most_active || '—',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/events/:asset', async (req, res) => {
  try {
    const asset = decodeURIComponent(req.params.asset);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const result = await pool.query(
      `SELECT * FROM events
       WHERE asset = $1
       ORDER BY start_time DESC
       LIMIT $2 OFFSET $3`,
      [asset, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log(`WS client connected (${wsClients.size} total)`);

  const cached = Object.values(latestTicks)
    .filter((t) => t && t.price && t.price !== 'NaN' && !Number.isNaN(Number(t.price)))
    .map(({ _lastSeenMs, ...tick }) => tick);

  if (cached.length > 0) {
    try {
      ws.send(JSON.stringify({ type: 'snapshot', data: cached }));
    } catch (err) {
      console.error('WS snapshot send error:', err.message);
    }
  }

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`WS client disconnected (${wsClients.size} total)`);
  });

  ws.on('error', (err) => {
    console.error('WS client error:', err.message);
    wsClients.delete(ws);
  });
});

function startBackgroundFlushers() {
  tickFlushTimer = setInterval(() => {
    flushTicks().catch((err) => console.error('flushTicks timer error:', err.message));
  }, TICK_FLUSH_INTERVAL_MS);

  eventFlushTimer = setInterval(() => {
    flushEvents().catch((err) => console.error('flushEvents timer error:', err.message));
  }, EVENT_FLUSH_INTERVAL_MS);

  latestCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const asset of Object.keys(latestTicks)) {
      const tick = latestTicks[asset];
      if (tick && tick._lastSeenMs && now - tick._lastSeenMs > MAX_LATEST_AGE_MS) {
        delete latestTicks[asset];
      }
    }
  }, 30000);
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received, shutting down...`);

  if (tickFlushTimer) clearInterval(tickFlushTimer);
  if (eventFlushTimer) clearInterval(eventFlushTimer);
  if (latestCleanupTimer) clearInterval(latestCleanupTimer);

  try {
    await flushTicks();
  } catch (err) {
    console.error('Final tick flush failed:', err.message);
  }

  try {
    while (eventInsertQueue.length > 0) {
      await flushEvents();
    }
  } catch (err) {
    console.error('Final event flush failed:', err.message);
  }

  try {
    if (pythClient && typeof pythClient.close === 'function') {
      await pythClient.close();
    }
  } catch (err) {
    console.error('Error closing Pyth client:', err.message);
  }

  try {
    wss.close();
    server.close();
  } catch (err) {
    console.error('Error closing server:', err.message);
  }

  try {
    await pool.end();
  } catch (err) {
    console.error('Error closing postgres pool:', err.message);
  }

  process.exit(0);
}

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((err) => {
    console.error('Shutdown error:', err.message);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((err) => {
    console.error('Shutdown error:', err.message);
    process.exit(1);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  console.log(`API + WS server running on port ${PORT}`);
  startBackgroundFlushers();

  try {
    await startPythConnection();
  } catch (err) {
    console.error('Failed to start Pyth connection:', err.message);
  }
});
