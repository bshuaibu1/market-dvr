import React from 'react';
import './heatmap.css';

export default function HeatmapView() {
  return (
    <>
      {/*  NAV  */}
<nav>
  <a className="nav-logo" href="index.html">
    <div className="nav-dot"></div>
    <span className="nav-name">Market DVR</span>
  </a>
  <div className="nav-center">
    <a className="nav-link" href="live.html">Live</a>
    <a className="nav-link active" href="heatmap.html">Heatmap</a>
    <a className="nav-link" href="#">Events</a>
    <a className="nav-link" href="#">Replay</a>
  </div>
  <div className="nav-right">
    <div className="rec-badge"><div className="rec-dot"></div>Recording</div>
    <button className="theme-btn" id="theme-toggle" onClick="toggleTheme()">🌙</button>
  </div>
</nav>

<div className="page">
  <div className="container">

    {/*  PAGE HEADER  */}
    <div className="page-head">
      <div>
        <div className="page-eyebrow">Volatility heatmap</div>
        <h1 className="page-title">Market Overview</h1>
      </div>
      <div className="stat-pills">
        <div className="stat-pill"><span className="pill-label">Assets</span><span className="pill-value" id="pill-assets">19</span></div>
        <div className="stat-pill"><span className="pill-label">Avg conf</span><span className="pill-value" id="pill-conf">98.4%</span></div>
        <div className="stat-pill"><span className="pill-label">Stress</span><span className="pill-value" id="pill-stress" style={{color: 'var(--green)'}}>LOW</span></div>
        <div className="stat-pill"><span className="pill-label">Resolution</span><span className="pill-value" style={{color: 'var(--green)'}}>50ms</span></div>
      </div>
    </div>

    {/*  STATUS STRIP  */}
    <div className="status-strip">
      <div className="rec-badge" style={{borderRadius: '8px'}}><div className="rec-dot"></div>Live</div>
      <div className="status-pill">
        <span className="lbl">Last tick</span>
        <span className="val" id="ss-tick">—</span>
      </div>
      <div className="status-pill">
        <span className="lbl">Freshness</span>
        <span className="val" style={{color: 'var(--green)'}}>~50ms</span>
      </div>
      <div className="status-pill">
        <span className="lbl">Window</span>
        <span className="val">5m snapshot</span>
      </div>
      <div className="dislocation-card" id="dislocation-card" onClick="alert('→ Replay for ' + topAsset)">
        <div>
          <div className="dis-eyebrow">Live Dislocation</div>
          <div className="dis-sym" id="dis-sym">BTC/USD</div>
          <div className="dis-meta" id="dis-meta">+1.24% move · $0.82 spread</div>
        </div>
        <div className="dis-link">Open Replay ↗</div>
      </div>
    </div>

    {/*  MAIN GRID  */}
    <div className="main-grid">

      {/*  HEATMAP  */}
      <div className="heatmap-col" id="heatmap-col">
        {/*  populated by JS  */}
      </div>

      {/*  SIDEBAR  */}
      <div className="sidebar">

        {/*  STRESS GAUGE  */}
        <div className="panel">
          <div className="panel-title">Market Stress</div>
          <div className="gauge-wrap">
            <svg width="160" height="90" viewBox="0 0 160 90" style={{overflow: 'visible'}}>
              {/*  track  */}
              <path d="M 16 80 A 64 64 0 0 1 144 80" fill="none" stroke="var(--btn-bg)" strokeWidth="10" strokeLinecap="round"/>
              {/*  filled arc  */}
              <path id="gauge-arc" d="M 16 80 A 64 64 0 0 1 144 80" fill="none" stroke="var(--green)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray="201" strokeDashoffset="201"/>
              {/*  needle  */}
              <g id="gauge-needle" style={{transformOrigin: '80px 80px', transform: 'rotate(-90deg)', transition: 'transform 1s cubic-bezier(0.34,1.56,0.64,1)'}}>
                <line x1="80" y1="80" x2="80" y2="26" stroke="var(--fg)" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <circle cx="80" cy="80" r="4" fill="var(--fg)" opacity="0.6"/>
              </g>
              {/*  labels  */}
              <text x="10" y="90" font-size="8" fill="var(--muted)" font-family="JetBrains Mono,monospace" text-anchor="middle">0</text>
              <text x="80" y="16" font-size="8" fill="var(--muted)" font-family="JetBrains Mono,monospace" text-anchor="middle">50</text>
              <text x="150" y="90" font-size="8" fill="var(--muted)" font-family="JetBrains Mono,monospace" text-anchor="middle">100</text>
            </svg>
            <div className="gauge-label" id="gauge-val">22</div>
            <div className="gauge-sub" id="gauge-lbl" style={{color: 'var(--green)'}}>LOW</div>
            <div className="gauge-desc" id="gauge-desc">Markets trading within normal volatility bands.</div>
          </div>
        </div>

        {/*  TOP MOVERS  */}
        <div className="panel">
          <div className="panel-title">Top Movers</div>
          <div id="top-movers-list"></div>
        </div>

        {/*  CORRELATION PULSE  */}
        <div className="panel">
          <div className="panel-title">Correlation Pulse</div>
          <div id="corr-pulse-wrap"></div>
        </div>

      </div>
    </div>

  </div>
</div>

{/*  BOTTOM TICKER BAR  */}
<div className="rec-bar">
  <div className="rec-bar-left">
    <div className="rb-dot"></div>
    <span className="rb-label">Recording <strong>mainnet</strong></span>
  </div>
  <div className="ticker-track">
    <div className="ticker-inner" id="ticker-inner"></div>
  </div>
  <div className="rec-bar-right">
    <span className="rb-ts" id="rb-ts">—</span>
  </div>
</div>

{
  /* TODO: Move this logic to a React Effect or Helper */
  /*

// ── MOCK DATA ────────────────────────────────────────────
const ASSETS = [
  // CRYPTO - large
  { symbol:'BTC/USD',   name:'Bitcoin',          cls:'crypto',      price:97412,     change:1.24,  spread:0.82,    conf:98.2, volatile:false },
  { symbol:'ETH/USD',   name:'Ethereum',         cls:'crypto',      price:3841.50,   change:-0.37, spread:0.24,    conf:97.6, volatile:false },
  // CRYPTO - mid
  { symbol:'SOL/USD',   name:'Solana',           cls:'crypto',      price:188.42,    change:2.81,  spread:0.018,   conf:96.8, volatile:true  },
  { symbol:'BNB/USD',   name:'BNB',              cls:'crypto',      price:612.30,    change:0.52,  spread:0.041,   conf:95.4, volatile:false },
  { symbol:'DOGE/USD',  name:'Dogecoin',         cls:'crypto',      price:0.3847,    change:-1.22, spread:0.00012, conf:93.1, volatile:false },
  { symbol:'WIF/USD',   name:'dogwifhat',        cls:'crypto',      price:2.1840,    change:-3.41, spread:0.0009,  conf:88.7, volatile:true  },
  { symbol:'BONK/USD',  name:'Bonk',             cls:'crypto',      price:0.0000328, change:4.17,  spread:0.000000 ,conf:86.4,volatile:true  },
  // COMMODITIES
  { symbol:'XAU/USD',   name:'Gold',             cls:'commodities', price:2341.80,   change:0.08,  spread:0.30,    conf:99.1, volatile:false },
  { symbol:'XAG/USD',   name:'Silver',           cls:'commodities', price:27.842,    change:-0.14, spread:0.012,   conf:98.3, volatile:false },
  { symbol:'WTI/USD',   name:'Crude Oil',        cls:'commodities', price:81.24,     change:0.31,  spread:0.018,   conf:97.5, volatile:false },
  { symbol:'BRENT/USD', name:'Brent Crude',      cls:'commodities', price:84.17,     change:0.22,  spread:0.022,   conf:97.2, volatile:false },
  { symbol:'NATGAS/USD',name:'Natural Gas',      cls:'commodities', price:2.184,     change:-0.88, spread:0.004,   conf:95.8, volatile:false },
  { symbol:'COPPER/USD',name:'Copper',           cls:'commodities', price:4.1240,    change:0.44,  spread:0.003,   conf:96.2, volatile:false },
  // FOREX
  { symbol:'EUR/USD',   name:'Euro',             cls:'forex',       price:1.08742,   change:-0.11, spread:0.00004, conf:99.4, volatile:false },
  { symbol:'GBP/USD',   name:'British Pound',    cls:'forex',       price:1.27384,   change:0.06,  spread:0.00005, conf:99.2, volatile:false },
  { symbol:'USD/JPY',   name:'Japanese Yen',     cls:'forex',       price:149.842,   change:0.19,  spread:0.008,   conf:99.3, volatile:false },
  { symbol:'USD/CHF',   name:'Swiss Franc',      cls:'forex',       price:0.88124,   change:-0.07, spread:0.00004, conf:99.1, volatile:false },
  { symbol:'AUD/USD',   name:'Aussie Dollar',    cls:'forex',       price:0.65381,   change:0.14,  spread:0.00004, conf:98.9, volatile:false },
  { symbol:'USD/CAD',   name:'Canadian Dollar',  cls:'forex',       price:1.35742,   change:0.03,  spread:0.00005, conf:98.8, volatile:false },
];

let topAsset = 'WIF/USD';

// ── HELPERS ───────────────────────────────────────────────
function fmtPrice(p) {
  if (p >= 10000) return '$' + p.toLocaleString('en-US',{maximumFractionDigits:0});
  if (p >= 100)   return '$' + p.toFixed(2);
  if (p >= 1)     return '$' + p.toFixed(4);
  if (p >= 0.001) return '$' + p.toFixed(6);
  return '$' + p.toFixed(9);
}
function fmtChg(c) { return (c>=0?'+':'')+c.toFixed(2)+'%'; }
function changeClass(c) {
  if (c > 2)    return 'strong-up';
  if (c > 0.5)  return 'up';
  if (c > 0.05) return 'slight-up';
  if (c < -2)   return 'strong-down';
  if (c < -0.5) return 'down';
  if (c < -0.05)return 'slight-down';
  return 'flat';
}
function confColor(c) {
  if (c >= 97) return 'var(--green)';
  if (c >= 88) return 'var(--yellow)';
  return 'var(--red)';
}
function isLight() { return document.body.classList.contains('light'); }

// ── RENDER HEATMAP ────────────────────────────────────────
function renderHeatmap() {
  const col = document.getElementById('heatmap-col');
  const crypto = ASSETS.filter(a=>a.cls==='crypto');
  const comms  = ASSETS.filter(a=>a.cls==='commodities');
  const forex  = ASSETS.filter(a=>a.cls==='forex');

  function cell(a, size='medium') {
    const cc = changeClass(a.change);
    const chgDir = a.change > 0 ? 'up' : a.change < 0 ? 'down' : 'flat';
    const confFill = confColor(a.conf);
    const volRing = a.volatile ? '<div className="vol-ring"></div>' : '';
    return `<div className="hm-cell ${cc} ${size}" onClick="alert('Replay: ${a.symbol}')">
      ${volRing}
      <div>
        <div className="cell-sym">${a.symbol}</div>
        ${size==='small' ? '' : `<div className="cell-name">${a.name}</div>`}
      </div>
      <div>
        ${size!=='small' ? `<div className="cell-price">${fmtPrice(a.price)}</div>` : ''}
        <div className="cell-change ${chgDir}">${fmtChg(a.change)}</div>
        <div className="cell-conf">
          <div className="cell-conf-bar"><div className="cell-conf-fill" style={{width: '${a.conf}%', background: '${confFill}'}}></div></div>
          <span className="cell-conf-val" style={{color: '${confFill}'}}>${a.conf.toFixed(0)}%</span>
        </div>
      </div>
    </div>`;
  }

  let html = '';

  // CRYPTO
  html += `<div className="sec-label"><span>Crypto</span><hr/></div>`;
  // Large row: BTC + ETH
  html += `<div className="hm-row">${cell(crypto[0],'large')}${cell(crypto[1],'large')}</div>`;
  // Mid row: SOL, BNB, DOGE
  html += `<div className="hm-row">${cell(crypto[2],'medium')}${cell(crypto[3],'medium')}${cell(crypto[4],'medium')}</div>`;
  // Small row: WIF, BONK
  html += `<div className="hm-row">${cell(crypto[5],'small')}${cell(crypto[6],'small')}<div style={{flex: '1'}}></div></div>`;

  // COMMODITIES
  html += `<div className="sec-label"><span>Commodities</span><hr/></div>`;
  html += `<div className="hm-row">${comms.slice(0,3).map(a=>cell(a,'medium')).join('')}</div>`;
  html += `<div className="hm-row">${comms.slice(3).map(a=>cell(a,'small')).join('')}<div style={{flex: '1'}}></div></div>`;

  // FOREX
  html += `<div className="sec-label"><span>Forex</span><hr/></div>`;
  html += `<div className="hm-row">${forex.slice(0,3).map(a=>cell(a,'medium')).join('')}</div>`;
  html += `<div className="hm-row">${forex.slice(3).map(a=>cell(a,'small')).join('')}<div style={{flex: '1'}}></div></div>`;

  col.innerHTML = html;
}

// ── STRESS GAUGE ──────────────────────────────────────────
function updateGauge(val) {
  // arc: total arc path ≈ 201px (half circle). dashoffset goes from 201 (empty) to 0 (full)
  const pct = Math.max(0, Math.min(100, val)) / 100;
  const arcLen = 201;
  const offset = arcLen - pct * arcLen;
  const arc = document.getElementById('gauge-arc');
  const needle = document.getElementById('gauge-needle');
  const gaugeVal = document.getElementById('gauge-val');
  const gaugeLbl = document.getElementById('gauge-lbl');
  const gaugeDesc = document.getElementById('gauge-desc');

  const color = val < 30 ? 'var(--green)' : val < 60 ? 'var(--yellow)' : 'var(--red)';
  const label = val < 30 ? 'LOW' : val < 60 ? 'MODERATE' : 'HIGH';
  const desc = val < 30
    ? 'Markets trading within normal volatility bands.'
    : val < 60
    ? 'Elevated volatility detected across multiple assets.'
    : 'High market stress — several assets showing extreme moves.';

  arc.style.strokeDashoffset = offset;
  arc.style.stroke = color;

  // needle: -90deg = 0%, 0deg = 50%, +90deg = 100%
  const deg = -90 + pct * 180;
  needle.style.transform = `rotate(${deg}deg)`;

  gaugeVal.textContent = val;
  gaugeLbl.textContent = label;
  gaugeLbl.style.color = color;
  gaugeDesc.textContent = desc;

  // pill
  const pill = document.getElementById('pill-stress');
  pill.textContent = label;
  pill.style.color = color;
}

// ── TOP MOVERS ─────────────────────────────────────────────
function renderTopMovers() {
  const sorted = [...ASSETS].sort((a,b) => Math.abs(b.change) - Math.abs(a.change)).slice(0,6);
  const maxAbs = Math.max(...sorted.map(a=>Math.abs(a.change)));

  document.getElementById('top-movers-list').innerHTML = sorted.map((a,i) => {
    const up = a.change >= 0;
    const w = (Math.abs(a.change) / maxAbs) * 100;
    const barColor = up ? 'var(--green)' : 'var(--red)';
    return `<div className="mover-row" onClick="alert('Replay: ${a.symbol}')">
      <span className="mover-rank">${i+1}</span>
      <span className="mover-sym">${a.symbol}</span>
      <div className="mover-bar-wrap"><div className="mover-bar-fill" style={{width: '${w}%', background: '${barColor}'}}></div></div>
      <span className="mover-chg" style={{color: '${barColor}'}}>${fmtChg(a.change)}</span>
    </div>`;
  }).join('');
}

// ── CORRELATION PULSE ──────────────────────────────────────
function renderCorrPulse() {
  const syms = ['BTC','ETH','SOL','XAU','EUR'];
  const n = syms.length;
  const light = isLight();

  let html = `<div className="corr-pulse-grid" style={{gridTemplateColumns: '36px repeat(${n},1fr)'}}>`;
  // header row
  html += `<div></div>`;
  syms.forEach(s => { html += `<div className="corr-hdr">${s}</div>`; });
  // data rows
  syms.forEach((r,ri) => {
    html += `<div className="corr-hdr" style={{textAlign: 'right', paddingRight: '4px'}}>${r}</div>`;
    syms.forEach((c,ci) => {
      let corr;
      if (ri===ci) corr = 1;
      else {
        const seed = (ri*7 + ci*13) % 17;
        corr = parseFloat(((seed/17)*1.8 - 0.9).toFixed(2));
        corr = Math.max(-0.99, Math.min(0.99, corr));
      }
      const abs = Math.abs(corr);
      const bg = ri===ci
        ? (light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.09)')
        : corr > 0
          ? `rgba(50,215,75,${abs*0.3})`
          : `rgba(255,69,58,${abs*0.3})`;
      const fc = ri===ci ? 'var(--muted)' : corr > 0 ? 'var(--green)' : 'var(--red)';
      html += `<div className="corr-cell" style={{background: '${bg}', color: '${fc}'}}>${ri===ci?'—':corr.toFixed(2)}</div>`;
    });
  });
  html += `</div>`;
  document.getElementById('corr-pulse-wrap').innerHTML = html;
}

// ── TICKER ────────────────────────────────────────────────
function renderTicker() {
  const items = ASSETS.map(a => {
    const up = a.change >= 0;
    return `<div className="ticker-item">
      <span className="tick-sym">${a.symbol}</span>
      <span className="tick-price">${fmtPrice(a.price)}</span>
      <span className="tick-chg ${up?'up':'down'}">${fmtChg(a.change)}</span>
    </div>`;
  }).join('');
  // duplicate for seamless loop
  document.getElementById('ticker-inner').innerHTML = items + items;
}

// ── CLOCK ─────────────────────────────────────────────────
function tick() {
  const now = new Date();
  const ts = now.toTimeString().slice(0,8)+'.'+String(now.getMilliseconds()).padStart(3,'0');
  document.getElementById('rb-ts').textContent = ts + ' UTC';
  document.getElementById('ss-tick').textContent = ts;
}
setInterval(tick, 50);

// ── SIM PRICE JITTER ─────────────────────────────────────
let simTick = 0;
function simulate() {
  simTick++;
  ASSETS.forEach(a => {
    const j = (Math.random()-0.499)*0.06;
    a.change = parseFloat((a.change + j).toFixed(3));
    a.price  = a.price * (1 + j*0.001);
    a.volatile = Math.abs(a.change) > 2;
  });

  if (simTick % 2 === 0) renderHeatmap();

  // update stress
  const avgAbs = ASSETS.reduce((s,a)=>s+Math.abs(a.change),0)/ASSETS.length;
  const stress = Math.round(Math.min(100, avgAbs * 40));
  updateGauge(stress);

  if (simTick % 3 === 0) renderTopMovers();
  if (simTick % 10 === 0) renderTicker();

  // dislocation
  const top = [...ASSETS].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change))[0];
  topAsset = top.symbol;
  document.getElementById('dis-sym').textContent = top.symbol;
  document.getElementById('dis-meta').textContent = fmtChg(top.change)+' move · '+Math.abs(top.spread).toFixed(4)+' spread';

  // avg conf
  const avg = ASSETS.reduce((s,a)=>s+a.conf,0)/ASSETS.length;
  document.getElementById('pill-conf').textContent = avg.toFixed(1)+'%';
}
setInterval(simulate, 1000);

// ── THEME ─────────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-toggle').textContent = light ? '☀️' : '🌙';
  localStorage.setItem('mdvr-theme', light ? 'light' : 'dark');
  renderCorrPulse();
}
if (localStorage.getItem('mdvr-theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// ── INIT ─────────────────────────────────────────────────
renderHeatmap();
renderTopMovers();
renderCorrPulse();
renderTicker();
updateGauge(22);
tick();

  */
}
    </>
  );
}
