import React from 'react';
import './live.css';

export default function LiveView() {
  return (
    <>
      {/*  NAV  */}
<nav>
  <div className="nav-left">
    <a className="nav-logo" href="index.html">
      <div className="nav-dot"></div>
      <span className="nav-name">Market DVR</span>
    </a>
    <nav className="nav-links">
      <a className="nav-link active" href="live.html">Live</a>
      <a className="nav-link" href="#">Events</a>
      <a className="nav-link" href="#">Replay</a>
      <a className="nav-link" href="#">Docs</a>
    </nav>
  </div>
  <div className="nav-right">
    <div className="nav-rec">
      <div className="rec-dot"></div>
      Recording mainnet
    </div>
    <button className="theme-btn" id="theme-toggle" onClick="toggleTheme()" title="Toggle theme">🌙</button>
  </div>
</nav>

<div className="page">
  <div className="container">

    {/*  PAGE HEADER  */}
    <div className="page-header">
      <div className="page-title-group">
        <div className="page-eyebrow">Live feed</div>
        <h1 className="page-title">Markets</h1>
      </div>
      <div className="page-meta">
        <div className="meta-item">
          <div className="meta-bullet"></div>
          <span id="asset-count">19 assets</span>
        </div>
        <div className="meta-item">
          <span id="live-ts" style={{fontFamily: '\'JetBrains Mono\',monospace'}}></span>
        </div>
        <div className="meta-item">
          <span style={{color: 'var(--green)'}}>50ms</span>&nbsp;resolution
        </div>
      </div>
    </div>

    {/*  STAT STRIP  */}
    <div className="stat-strip">
      <div className="stat-box">
        <div className="stat-val" id="s-btc">$97,412</div>
        <div className="stat-lbl">BTC/USD</div>
        <div className="stat-delta up" id="s-btc-d">+1.24%</div>
      </div>
      <div className="stat-box">
        <div className="stat-val" id="s-eth">$3,841</div>
        <div className="stat-lbl">ETH/USD</div>
        <div className="stat-delta down" id="s-eth-d">−0.37%</div>
      </div>
      <div className="stat-box">
        <div className="stat-val" id="s-sol">$188.4</div>
        <div className="stat-lbl">SOL/USD</div>
        <div className="stat-delta up" id="s-sol-d">+2.81%</div>
      </div>
      <div className="stat-box">
        <div className="stat-val" id="s-xau">$2,341</div>
        <div className="stat-lbl">XAU/USD</div>
        <div className="stat-delta up" id="s-xau-d">+0.08%</div>
      </div>
    </div>

    {/*  FILTER BAR  */}
    <div className="filter-bar">
      <div className="filter-tabs">
        <button className="filter-tab active" onClick="setTab('all', this)">All</button>
        <button className="filter-tab" onClick="setTab('crypto', this)">Crypto</button>
        <button className="filter-tab" onClick="setTab('commodities', this)">Commodities</button>
        <button className="filter-tab" onClick="setTab('forex', this)">Forex</button>
      </div>
      <div className="search-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input className="search-input" type="text" placeholder="Search assets…" id="search-input" onInput="filterAssets()" />
      </div>
    </div>

    {/*  TABLE / CARDS  */}
    <div id="table-view">
      <div className="table-wrap">
        <table id="asset-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Class</th>
              <th className="right">Price</th>
              <th className="right">Change 5m</th>
              <th className="right">Spread</th>
              <th className="center">Confidence</th>
              <th className="right">Trend</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="table-body">
          </tbody>
        </table>
      </div>
    </div>

    <div id="cards-view" style={{display: 'none'}}>
      <div className="cards-grid" id="cards-grid"></div>
    </div>

    {/*  BOTTOM SECTION: PULSE + EVENTS  */}
    <div className="two-col">
      {/*  LEFT: MARKET PULSE  */}
      <div>
        <div className="section-label">
          <span>Market pulse</span><hr/>
        </div>
        <div className="pulse-wrap">
          <div className="pulse-header">
            <span className="pulse-title">5-min relative change</span>
            <span className="pulse-range" id="pulse-range">—</span>
          </div>
          <svg id="pulse-svg" width="100%" height="180" viewBox="0 0 700 180" preserveAspectRatio="none" style={{display: 'block'}}></svg>
          <div className="pulse-legend" id="pulse-legend"></div>
        </div>

        <div className="section-label" style={{marginTop: '24px'}}>
          <span>Correlation matrix</span><hr/>
        </div>
        <div className="corr-wrap">
          <div id="corr-grid" style={{display: 'grid', gap: '2px', overflowX: 'auto'}}></div>
        </div>
      </div>

      {/*  RIGHT: EVENTS SIDEBAR  */}
      <div>
        <div className="section-label">
          <span>Recent events</span><hr/>
        </div>
        <div className="events-sidebar" id="events-sidebar">
          <div className="events-sidebar-header">
            <span className="events-sidebar-title">Detected anomalies</span>
            <a className="events-view-all" href="#">View all →</a>
          </div>
          <div id="events-list">
            {/*  populated by JS  */}
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

{/*  RECORDING BAR  */}
<div className="rec-bar">
  <div className="rec-bar-dot"></div>
  <span className="rec-bar-label">Recording <strong>mainnet</strong> — Pyth Pro Lazer</span>
  <span className="rec-spacer"></span>
  <span className="rec-bar-count up" id="rb-gainers">12 ▲</span>
  <span style={{color: 'var(--muted)', fontSize: '11px', fontFamily: '\'JetBrains Mono\',monospace'}}>&nbsp;/&nbsp;</span>
  <span className="rec-bar-count down" id="rb-losers">7 ▼</span>
  <span style={{width: '1px', height: '14px', background: 'var(--border)', margin: '0 8px', display: 'inline-block'}}></span>
  <span className="rec-ts" id="rb-ts">—</span>
</div>

{
  /* TODO: Move this logic to a React Effect or Helper */
  /*

// ── MOCK DATA ────────────────────────────────────────────
const ASSETS = [
  { symbol:'BTC/USD',  name:'Bitcoin',         cls:'crypto',      price:97412,    change:1.24,  spread:0.82,   conf:98.2, color:'#f5f5f7' },
  { symbol:'ETH/USD',  name:'Ethereum',        cls:'crypto',      price:3841.50,  change:-0.37, spread:0.24,   conf:97.6, color:'#0a84ff' },
  { symbol:'SOL/USD',  name:'Solana',          cls:'crypto',      price:188.42,   change:2.81,  spread:0.018,  conf:96.8, color:'#32d74b' },
  { symbol:'BNB/USD',  name:'BNB',             cls:'crypto',      price:612.30,   change:0.52,  spread:0.041,  conf:95.4, color:'#ffd60a' },
  { symbol:'DOGE/USD', name:'Dogecoin',        cls:'crypto',      price:0.3847,   change:-1.22, spread:0.00012,conf:93.1, color:'#c2a633' },
  { symbol:'WIF/USD',  name:'dogwifhat',       cls:'crypto',      price:2.1840,   change:-3.41, spread:0.0009, conf:88.7, color:'#ff453a' },
  { symbol:'BONK/USD', name:'Bonk',            cls:'crypto',      price:0.0000328,change:4.17,  spread:0.0000003,conf:86.4,color:'#e6007a'},
  { symbol:'XAU/USD',  name:'Gold',            cls:'commodities', price:2341.80,  change:0.08,  spread:0.30,   conf:99.1, color:'#ffd700' },
  { symbol:'XAG/USD',  name:'Silver',          cls:'commodities', price:27.842,   change:-0.14, spread:0.012,  conf:98.3, color:'#c0c0c0' },
  { symbol:'WTI/USD',  name:'Crude Oil (WTI)', cls:'commodities', price:81.24,    change:0.31,  spread:0.018,  conf:97.5, color:'#8b6914' },
  { symbol:'BRENT/USD',name:'Brent Crude',     cls:'commodities', price:84.17,    change:0.22,  spread:0.022,  conf:97.2, color:'#a0522d' },
  { symbol:'NATGAS/USD',name:'Natural Gas',    cls:'commodities', price:2.184,    change:-0.88, spread:0.004,  conf:95.8, color:'#87ceeb' },
  { symbol:'COPPER/USD',name:'Copper',         cls:'commodities', price:4.1240,   change:0.44,  spread:0.003,  conf:96.2, color:'#b87333' },
  { symbol:'EUR/USD',  name:'Euro',            cls:'forex',       price:1.08742,  change:-0.11, spread:0.00004,conf:99.4, color:'#5ac8fa' },
  { symbol:'GBP/USD',  name:'British Pound',   cls:'forex',       price:1.27384,  change:0.06,  spread:0.00005,conf:99.2, color:'#ff6b6b' },
  { symbol:'USD/JPY',  name:'Japanese Yen',    cls:'forex',       price:149.842,  change:0.19,  spread:0.008,  conf:99.3, color:'#32d74b' },
  { symbol:'USD/CHF',  name:'Swiss Franc',     cls:'forex',       price:0.88124,  change:-0.07, spread:0.00004,conf:99.1, color:'#ff453a' },
  { symbol:'AUD/USD',  name:'Aussie Dollar',   cls:'forex',       price:0.65381,  change:0.14,  spread:0.00004,conf:98.9, color:'#ffd60a' },
  { symbol:'USD/CAD',  name:'Canadian Dollar', cls:'forex',       price:1.35742,  change:0.03,  spread:0.00005,conf:98.8, color:'#e6007a' },
];

const EVENTS = [
  { type:'volatility_spike',      asset:'WIF/USD',  desc:'3.4σ move detected in 120ms window',  ts:'14:23:07', color:'#ff453a' },
  { type:'spread_spike',          asset:'BONK/USD', desc:'Spread widened 8× above 5m baseline', ts:'14:21:44', color:'#ffd60a' },
  { type:'confidence_divergence', asset:'ETH/USD',  desc:'Conf dropped 14pp vs aggregated ref',  ts:'14:19:12', color:'#bf5af2' },
  { type:'volatility_spike',      asset:'SOL/USD',  desc:'Intra-tick volatility burst +2.1%',    ts:'14:16:38', color:'#ff453a' },
  { type:'spread_spike',          asset:'WTI/USD',  desc:'Spread 4× above daily average',        ts:'14:11:55', color:'#ffd60a' },
  { type:'confidence_divergence', asset:'BNB/USD',  desc:'Conf interval 3× wider than normal',   ts:'14:08:22', color:'#bf5af2' },
];

// ── STATE ────────────────────────────────────────────────
let activeTab = 'all';
let searchQ = '';
let sparklineData = {};  // symbol → array of pct change from baseline

// Seed sparklines
ASSETS.forEach(a => {
  const pts = [];
  for (let i = 0; i < 50; i++) {
    const v = (Math.random() - 0.5) * 0.8 + (i / 50) * a.change;
    pts.push(v);
  }
  sparklineData[a.symbol] = pts;
});

// ── HELPERS ──────────────────────────────────────────────
function fmtPrice(p) {
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  if (p >= 100)   return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)     return p.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  if (p >= 0.01)  return p.toFixed(5);
  return p.toFixed(8);
}

function fmtSpread(s) {
  if (s >= 1)    return '$' + s.toFixed(2);
  if (s >= 0.01) return '$' + s.toFixed(4);
  if (s >= 0.0001) return '$' + s.toFixed(6);
  return '$' + s.toFixed(9);
}

function confColor(c) {
  if (c >= 95) return '#32d74b';
  if (c >= 80) return '#ffd60a';
  return '#ff453a';
}

function isLight() { return document.body.classList.contains('light'); }

function sparkSVG(pts, color, w=80, h=32) {
  const valid = pts.filter(isFinite);
  if (valid.length < 2) return '<svg width="'+w+'" height="'+h+'"></svg>';
  const mn = Math.min(...valid), mx = Math.max(...valid);
  const range = mx - mn || 0.001;
  const xs = valid.map((_,i)=> 2 + (i/(valid.length-1))*(w-4));
  const ys = valid.map(v=> (h-4) - ((v-mn)/range)*(h-8) + 2);
  const pts2 = xs.map((x,i)=>x+','+ys[i]).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style={{display: 'block', overflow: 'visible'}}>
    <polyline points="${pts2}" fill="none" stroke="${color}" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
  </svg>`;
}

function eventTypeName(t) {
  if (t==='volatility_spike')      return 'VOL SPIKE';
  if (t==='spread_spike')          return 'SPREAD SPIKE';
  if (t==='confidence_divergence') return 'CONF DIV';
  return t.toUpperCase();
}

// ── FILTERED ASSETS ──────────────────────────────────────
function filtered() {
  let list = activeTab === 'all' ? ASSETS : ASSETS.filter(a => a.cls === activeTab);
  if (searchQ.trim()) {
    const q = searchQ.trim().toLowerCase();
    list = list.filter(a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }
  return list;
}

// ── RENDER TABLE ─────────────────────────────────────────
function renderTable() {
  const list = filtered();
  const tbody = document.getElementById('table-body');
  const light = isLight();

  tbody.innerHTML = list.map(a => {
    const up = a.change >= 0;
    const chgClass = up ? 'up' : 'down';
    const chgStr = (up ? '+' : '') + a.change.toFixed(2) + '%';
    const cc = confColor(a.conf);
    const spark = sparkSVG(sparklineData[a.symbol] || [], a.color);
    const badgeClass = a.cls === 'crypto' ? 'badge-crypto' : a.cls === 'commodities' ? 'badge-commodities' : 'badge-forex';

    return `<tr onClick="goReplay('${a.symbol}')">
      <td>
        <span className="asset-name">${a.symbol}</span>
        <span className="asset-sub">${a.name}</span>
      </td>
      <td><span className="badge ${badgeClass}">${a.cls}</span></td>
      <td className="td-right"><span className="price">$${fmtPrice(a.price)}</span></td>
      <td className="td-right"><span className="change ${chgClass}">${chgStr}</span></td>
      <td className="td-right"><span className="spread">${fmtSpread(a.spread)}</span></td>
      <td className="td-center">
        <div className="conf-cell">
          <span className="conf-val" style={{color: '${cc}'}}>${a.conf.toFixed(1)}%</span>
          <div className="conf-bar"><div className="conf-fill" style={{width: '${a.conf}%', background: '${cc}'}}></div></div>
        </div>
      </td>
      <td className="spark-cell">${spark}</td>
      <td className="td-right"><button className="replay-btn" onClick="event.stopPropagation();goReplay('${a.symbol}')">Replay ↗</button></td>
    </tr>`;
  }).join('');
}

// ── RENDER CARDS ─────────────────────────────────────────
function renderCards() {
  const list = filtered();
  const grid = document.getElementById('cards-grid');

  grid.innerHTML = list.map(a => {
    const up = a.change >= 0;
    const chgClass = up ? 'up' : 'down';
    const chgStr = (up ? '+' : '') + a.change.toFixed(2) + '%';
    const spark = sparkSVG(sparklineData[a.symbol] || [], a.color, 220, 44);
    const badgeClass = a.cls === 'crypto' ? 'badge-crypto' : a.cls === 'commodities' ? 'badge-commodities' : 'badge-forex';

    return `<div className="asset-card" onClick="goReplay('${a.symbol}')">
      <div className="card-top">
        <div>
          <div className="card-symbol">${a.symbol}</div>
          <div className="card-name">${a.name}</div>
        </div>
        <span className="badge ${badgeClass}">${a.cls}</span>
      </div>
      <div className="card-price">$${fmtPrice(a.price)}</div>
      <div className="card-change ${chgClass}">${chgStr}</div>
      <div className="card-spark">${spark}</div>
    </div>`;
  }).join('');
}

// ── TABS ─────────────────────────────────────────────────
function setTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (tab === 'all') {
    document.getElementById('table-view').style.display = '';
    document.getElementById('cards-view').style.display = 'none';
    renderTable();
  } else {
    document.getElementById('table-view').style.display = 'none';
    document.getElementById('cards-view').style.display = '';
    renderCards();
  }
  renderPulse();
}

function filterAssets() {
  searchQ = document.getElementById('search-input').value;
  if (activeTab === 'all') renderTable();
  else renderCards();
}

// ── MARKET PULSE SVG ─────────────────────────────────────
const PULSE_SYMBOLS = ['BTC/USD','ETH/USD','SOL/USD','BNB/USD','XAU/USD','EUR/USD'];
const PULSE_COLORS_DARK  = { 'BTC/USD':'#f5f5f7','ETH/USD':'#0a84ff','SOL/USD':'#32d74b','BNB/USD':'#ffd60a','XAU/USD':'#ffd700','EUR/USD':'#5ac8fa' };
const PULSE_COLORS_LIGHT = { 'BTC/USD':'#0055d4','ETH/USD':'#0a84ff','SOL/USD':'#1a8f35','BNB/USD':'#b8860b','XAU/USD':'#b8860b','EUR/USD':'#0055d4' };

function renderPulse() {
  const svg = document.getElementById('pulse-svg');
  const legend = document.getElementById('pulse-legend');
  const W = 700, H = 180;
  const pad = { t:12, r:52, b:12, l:8 };
  const light = isLight();
  const colors = light ? PULSE_COLORS_LIGHT : PULSE_COLORS_DARK;

  // gather data
  const lines = PULSE_SYMBOLS.map(sym => {
    const pts = sparklineData[sym];
    if (!pts || pts.length < 2) return null;
    return { sym, pts, color: colors[sym] };
  }).filter(Boolean);

  const allVals = lines.flatMap(l => l.pts).filter(isFinite);
  const mn = Math.min(...allVals);
  const mx = Math.max(...allVals);
  const range = (mx - mn) || 0.1;
  const padded = { mn: mn - range*0.1, mx: mx + range*0.1 };
  const r2 = padded.mx - padded.mn;
  const cW = W - pad.l - pad.r;
  const cH = H - pad.t - pad.b;

  const gridC = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
  const lblC  = light ? 'rgba(0,0,0,0.3)'  : 'rgba(255,255,255,0.3)';
  const zeroC = light ? 'rgba(0,0,0,0.1)'  : 'rgba(255,255,255,0.08)';
  const fmt = v => (v>=0?'+':'')+v.toFixed(3)+'%';

  const yZero = pad.t + ((padded.mx - 0) / r2) * cH;
  const showZero = yZero > pad.t && yZero < pad.t + cH;

  let out = '';

  // grid
  [0.25,0.5,0.75].forEach(f => {
    const y = pad.t + f*cH;
    out += `<line x1="${pad.l}" x2="${W-pad.r}" y1="${y}" y2="${y}" stroke="${gridC}" strokeWidth="1"/>`;
  });
  if (showZero) {
    out += `<line x1="${pad.l}" x2="${W-pad.r}" y1="${yZero}" y2="${yZero}" stroke="${zeroC}" strokeWidth="1" strokeDasharray="4 4"/>`;
    out += `<text x="${W-pad.r+6}" y="${yZero+3}" fill="${lblC}" font-size="10" font-family="JetBrains Mono,monospace">0%</text>`;
  }
  out += `<text x="${W-pad.r+6}" y="${pad.t+4}" fill="${lblC}" font-size="10" font-family="JetBrains Mono,monospace">${fmt(padded.mx)}</text>`;
  out += `<text x="${W-pad.r+6}" y="${pad.t+cH}" fill="${lblC}" font-size="10" font-family="JetBrains Mono,monospace">${fmt(padded.mn)}</text>`;

  // lines
  lines.forEach(({ sym, pts, color }) => {
    const points = pts.map((v,i) => {
      const x = pad.l + (i/(pts.length-1))*cW;
      const y = pad.t + ((padded.mx - v)/r2)*cH;
      return `${x},${y}`;
    }).join(' ');
    out += `<polyline points="${points}" fill="none" stroke="${color}" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>`;
  });

  svg.innerHTML = out;

  // range label
  document.getElementById('pulse-range').textContent = `${fmt(mn)} → ${fmt(mx)}`;

  // legend
  const assetMap = Object.fromEntries(ASSETS.map(a=>[a.symbol,a]));
  legend.innerHTML = lines.map(({sym,color}) => {
    const a = assetMap[sym];
    if (!a) return '';
    const up = a.change >= 0;
    return `<div className="legend-item">
      <div className="legend-dot" style={{background: '${color}'}}></div>
      <span className="legend-sym">${sym}</span>
      <span className="legend-chg ${up?'up':'down'}" style={{color: '${up?\'var(--green)\':\'var(--red)\'}'}}>${up?'+':''}${a.change.toFixed(2)}%</span>
    </div>`;
  }).join('');
}

// ── CORRELATION MATRIX ───────────────────────────────────
function renderCorr() {
  const syms = ['BTC/USD','ETH/USD','SOL/USD','BNB/USD','XAU/USD'];
  const grid = document.getElementById('corr-grid');
  const light = isLight();
  const n = syms.length;
  grid.style.gridTemplateColumns = `80px repeat(${n}, 1fr)`;

  const label = (t, bold) => `<div style={{padding: '6px', fontSize: '10px', fontWeight: '${bold?500:400}', color: 'var(--muted)', ${bold?'textAlign: 'right\':\'text-align:left\'}', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>${t}</div>`;

  let out = label('', false);
  syms.forEach(s => out += label(s.split('/')[0], true));

  syms.forEach((r, ri) => {
    out += label(r.split('/')[0], false);
    syms.forEach((c, ci) => {
      let corr;
      if (ri === ci) corr = 1;
      else {
        const base = 0.45 + Math.abs(ri - ci) * 0.08;
        corr = parseFloat((base + (Math.random()-0.5)*0.3).toFixed(2));
        corr = Math.max(-0.99, Math.min(0.99, corr));
      }
      const intensity = Math.abs(corr);
      const positive = corr >= 0;
      const bg = ri === ci
        ? (light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')
        : positive
          ? `rgba(50,215,75,${intensity * 0.28})`
          : `rgba(255,69,58,${intensity * 0.28})`;
      const txt = ri === ci ? 'var(--muted)' : (positive ? 'var(--green)' : 'var(--red)');
      out += `<div style={{padding: '8px 4px', textAlign: 'center', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '11px', fontWeight: '${ri===ci?500:400}', background: '${bg}', color: '${txt}', borderRadius: '4px'}}>${ri===ci?'—':corr.toFixed(2)}</div>`;
    });
  });
  grid.innerHTML = out;
}

// ── EVENTS ───────────────────────────────────────────────
function renderEvents() {
  const list = document.getElementById('events-list');
  list.innerHTML = EVENTS.map(e => {
    const typeName = eventTypeName(e.type);
    return `<div className="event-row" onClick="goReplay('${e.asset}')">
      <div className="event-row-top">
        <span className="event-type-pill" style={{background: '${e.color}22', color: '${e.color}', border: '1px solid ${e.color}44'}}>${typeName}</span>
        <span className="event-ts">${e.ts}</span>
      </div>
      <div className="event-asset">${e.asset}</div>
      <div className="event-desc">${e.desc}</div>
    </div>`;
  }).join('');
}

// ── CLOCK / TICKER ───────────────────────────────────────
function updateClock() {
  const now = new Date();
  const ts = now.toTimeString().slice(0,8) + '.' + String(now.getMilliseconds()).padStart(3,'0');
  const el = document.getElementById('live-ts');
  if (el) el.textContent = ts;
  const rb = document.getElementById('rb-ts');
  if (rb) rb.textContent = ts + ' UTC';
}
setInterval(updateClock, 50);
updateClock();

// ── SIMULATE PRICE JITTER ────────────────────────────────
let tick = 0;
function simTick() {
  tick++;
  ASSETS.forEach(a => {
    const jitter = (Math.random() - 0.498) * 0.04;
    a.change = parseFloat((a.change + jitter).toFixed(3));
    a.price  = a.price * (1 + jitter * 0.002);

    const hist = sparklineData[a.symbol];
    hist.push(a.change);
    if (hist.length > 60) hist.shift();
  });

  if (activeTab === 'all') renderTable();
  else renderCards();

  // update stat strip
  const btc = ASSETS.find(a=>a.symbol==='BTC/USD');
  const eth = ASSETS.find(a=>a.symbol==='ETH/USD');
  const sol = ASSETS.find(a=>a.symbol==='SOL/USD');
  const xau = ASSETS.find(a=>a.symbol==='XAU/USD');
  if (btc) { document.getElementById('s-btc').textContent='$'+fmtPrice(btc.price); const d=document.getElementById('s-btc-d'); d.textContent=(btc.change>=0?'+':'')+btc.change.toFixed(2)+'%'; d.className='stat-delta '+(btc.change>=0?'up':'down'); }
  if (eth) { document.getElementById('s-eth').textContent='$'+fmtPrice(eth.price); const d=document.getElementById('s-eth-d'); d.textContent=(eth.change>=0?'+':'')+eth.change.toFixed(2)+'%'; d.className='stat-delta '+(eth.change>=0?'up':'down'); }
  if (sol) { document.getElementById('s-sol').textContent='$'+fmtPrice(sol.price); const d=document.getElementById('s-sol-d'); d.textContent=(sol.change>=0?'+':'')+sol.change.toFixed(2)+'%'; d.className='stat-delta '+(sol.change>=0?'up':'down'); }
  if (xau) { document.getElementById('s-xau').textContent='$'+fmtPrice(xau.price); const d=document.getElementById('s-xau-d'); d.textContent=(xau.change>=0?'+':'')+xau.change.toFixed(2)+'%'; d.className='stat-delta '+(xau.change>=0?'up':'down'); }

  // update gainers/losers
  const g = ASSETS.filter(a=>a.change>=0).length;
  document.getElementById('rb-gainers').textContent = g+' ▲';
  document.getElementById('rb-losers').textContent  = (ASSETS.length-g)+' ▼';

  if (tick % 4 === 0) renderPulse();
  if (tick % 20 === 0) renderCorr();
}
setInterval(simTick, 1000);

// ── NAV ──────────────────────────────────────────────────
function goReplay(symbol) {
  alert('→ Replay for ' + symbol + '\n(would navigate to /replay?asset='+symbol+')');
}

// ── THEME ────────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-toggle').textContent = light ? '☀️' : '🌙';
  localStorage.setItem('theme','marketdvr-'+( light?'light':'dark'));
  renderPulse();
  renderCorr();
}
if (localStorage.getItem('theme') === 'marketdvr-light') {
  document.body.classList.add('light');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// ── INIT ─────────────────────────────────────────────────
renderTable();
renderPulse();
renderCorr();
renderEvents();

  */
}
    </>
  );
}
