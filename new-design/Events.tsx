import React from 'react';
import './events.css';

export default function EventsView() {
  return (
    <>
      {/*  NAV  */}
<nav>
  <a className="nav-logo" href="index.html">
    <div className="nav-dot"></div>
    <span className="nav-name">Market DVR</span>
  </a>
  <div className="nav-links">
    <a className="nav-link" href="live.html">Live</a>
    <a className="nav-link" href="heatmap.html">Heatmap</a>
    <a className="nav-link active" href="events.html">Events</a>
    <a className="nav-link" href="replay.html">Replay</a>
  </div>
  <div className="nav-right">
    <button className="theme-btn" id="theme-toggle" onClick="toggleTheme()">🌙</button>
  </div>
</nav>

<div className="page">
  <div className="container">

    {/*  PAGE HEADER  */}
    <div className="page-head">
      <div>
        <div className="page-eyebrow">Market Events</div>
        <h1 className="page-title">Events</h1>
      </div>
      <div className="head-pills">
        <div className="head-pill" id="total-pill">— Events recorded</div>
        <div className="head-pill"><div className="rec-dot"></div>Recording live</div>
      </div>
    </div>

    {/*  FEATURED EVENT  */}
    <div className="featured" id="featured-card">
      <div className="featured-inner">
        <div className="featured-content">
          <div className="featured-eyebrow">Most Dramatic Event</div>
          <div className="featured-asset" id="f-asset">WIF/USD</div>
          <div className="featured-badges" id="f-badges"></div>
          <div className="featured-desc" id="f-desc">Price dropped 3.41% during a sharp volatility window.</div>
          <div className="featured-metrics" id="f-metrics"></div>
          <div className="ai-block">
            <div className="ai-label">AI Explanation</div>
            <div className="ai-text" id="f-ai">Likely cause: aggressive selling pressure or liquidity withdrawal during a fast downward move.</div>
          </div>
          <div className="featured-ts" id="f-ts">—</div>
          <button className="replay-btn-primary" onClick="goReplay('WIF/USD')">
            Replay this moment
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div className="featured-spark">
          <canvas id="featured-spark-canvas" width="180" height="90"></canvas>
        </div>
      </div>
    </div>

    {/*  FILTER TABS  */}
    <div className="filter-row" id="filter-row">
      <div className="filter-track">
        <button className="filter-btn active" onClick="setFilter(null, this)">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          All
        </button>
        <div className="filter-sep"></div>
        <button className="filter-btn" onClick="setFilter('crash', this)">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          Crash
        </button>
        <button className="filter-btn" onClick="setFilter('pump', this)">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Pump
        </button>
        <div className="filter-sep"></div>
        <button className="filter-btn" onClick="setFilter('spread', this)">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Spread Spike
        </button>
        <button className="filter-btn" onClick="setFilter('confidence', this)">
          <svg className="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Confidence Drop
        </button>
      </div>
    </div>

    {/*  STATS GRID  */}
    <div className="stats-grid">
      <div className="stat-box">
        <div className="stat-accent" style={{background: 'rgba(255,255,255,0.15)'}}></div>
        <div className="stat-label">Total Events</div>
        <div className="stat-value" id="st-total">—</div>
      </div>
      <div className="stat-box">
        <div className="stat-accent" style={{background: '#ff453a'}}></div>
        <div className="stat-label">Crashes Detected</div>
        <div className="stat-value" id="st-crashes" style={{color: 'var(--red)'}}>—</div>
      </div>
      <div className="stat-box">
        <div className="stat-accent" style={{background: '#0a84ff'}}></div>
        <div className="stat-label">Avg Duration</div>
        <div className="stat-value" id="st-duration" style={{color: 'var(--blue)'}}>—</div>
      </div>
      <div className="stat-box">
        <div className="stat-accent" style={{background: '#e6007a'}}></div>
        <div className="stat-label">Most Active</div>
        <div className="stat-value" id="st-active" style={{fontSize: '18px', paddingTop: '5px'}}>—</div>
      </div>
    </div>

    {/*  EVENT LIST  */}
    <div className="events-list" id="events-list"></div>

    {/*  LOAD MORE  */}
    <div className="load-more-wrap">
      <button className="load-more-btn" id="load-more-btn" onClick="loadMore()">Load older events</button>
    </div>

  </div>
</div>

{/*  REC BAR  */}
<div className="rec-bar">
  <div className="rb-dot"></div>
  <span className="rb-label">Recording <strong>mainnet</strong> — Pyth Pro Lazer</span>
  <div className="rb-spacer"></div>
  <span className="rb-ts" id="rb-ts">—</span>
</div>

{
  /* TODO: Move this logic to a React Effect or Helper */
  /*

// ── MOCK DATA ────────────────────────────────────────────
const TYPE_CONFIG = {
  crash:      { color:'#ff453a', label:'CRASH',           icon:'⚠' },
  pump:       { color:'#32d74b', label:'PUMP',            icon:'↗' },
  spread:     { color:'#ffd60a', label:'SPREAD SPIKE',    icon:'⬡' },
  confidence: { color:'#bf5af2', label:'CONFIDENCE DROP', icon:'⊗' },
};

const SEV_CONFIG = {
  HIGH: { color:'#ff453a', bg:'rgba(255,69,58,0.12)',  border:'rgba(255,69,58,0.28)'  },
  MED:  { color:'#ffd60a', bg:'rgba(255,214,10,0.12)', border:'rgba(255,214,10,0.28)' },
  LOW:  { color:'#32d74b', bg:'rgba(50,215,75,0.12)',  border:'rgba(50,215,75,0.28)'  },
};

const RAW_EVENTS = [
  { id:'e1',  asset:'WIF/USD',   type:'crash',      sev:'HIGH', desc:'Price dropped 3.41% during a sharp volatility window.', ai:'Likely cause: aggressive selling pressure or liquidity withdrawal during a fast downward move.', m:[{l:'PRICE MOVE',v:'-3.41%'},{l:'EVENT DURATION',v:'840ms'},{l:'CLOSE PRICE',v:'$2.112'}], ts:'14:23:07', ago:'2m ago' },
  { id:'e2',  asset:'BONK/USD',  type:'pump',       sev:'HIGH', desc:'Price surged 4.17% in a rapid upward move.', ai:'Likely cause: rapid directional buying during thin liquidity window.', m:[{l:'PRICE MOVE',v:'+4.17%'},{l:'EVENT DURATION',v:'620ms'},{l:'CLOSE PRICE',v:'$0.0000342'}], ts:'14:21:44', ago:'4m ago' },
  { id:'e3',  asset:'BONK/USD',  type:'spread',     sev:'HIGH', desc:'Bid/ask spread expanded 8× above its normal baseline.', ai:'Likely cause: liquidity withdrawal during rapid price movement.', m:[{l:'MAX SPREAD',v:'$0.000003'},{l:'BASELINE MULT',v:'8.2×'},{l:'DURATION',v:'310ms'}], ts:'14:21:44', ago:'4m ago' },
  { id:'e4',  asset:'ETH/USD',   type:'confidence', sev:'MED',  desc:'Confidence interval expanded, suggesting unusual feed disagreement.', ai:'Likely cause: temporary disagreement across market inputs during this window.', m:[{l:'EVENT DURATION',v:'1.2s'},{l:'PRICE MOVE',v:'-0.37%'},{l:'SIGNAL',v:'Feed mismatch'}], ts:'14:19:12', ago:'6m ago' },
  { id:'e5',  asset:'SOL/USD',   type:'pump',       sev:'MED',  desc:'Price surged 2.81% intra-tick volatility burst.', ai:'Rapid buying pressure with spread remaining stable, indicating orderly upward move.', m:[{l:'PRICE MOVE',v:'+2.81%'},{l:'DURATION',v:'540ms'},{l:'CLOSE PRICE',v:'$192.4'}], ts:'14:16:38', ago:'9m ago' },
  { id:'e6',  asset:'WTI/USD',   type:'spread',     sev:'MED',  desc:'Spread expanded 4× above daily average during thin session.', ai:'Likely cause: temporary market dislocation during low-liquidity window.', m:[{l:'MAX SPREAD',v:'$0.072'},{l:'BASELINE MULT',v:'4.1×'},{l:'DURATION',v:'2.1s'}], ts:'14:11:55', ago:'14m ago' },
  { id:'e7',  asset:'BNB/USD',   type:'confidence', sev:'MED',  desc:'Confidence interval 3× wider than normal.', ai:'Feed aggregators showed higher variance, possibly during cross-exchange price discovery.', m:[{l:'DURATION',v:'3.4s'},{l:'PRICE MOVE',v:'+0.52%'},{l:'SIGNAL',v:'Feed mismatch'}], ts:'14:08:22', ago:'17m ago' },
  { id:'e8',  asset:'BTC/USD',   type:'pump',       sev:'LOW',  desc:'Price moved +1.24% within a short window.', ai:'Orderly upward move with no significant spread widening detected.', m:[{l:'PRICE MOVE',v:'+1.24%'},{l:'DURATION',v:'1.8s'},{l:'CLOSE PRICE',v:'$98,641'}], ts:'14:05:11', ago:'20m ago' },
  { id:'e9',  asset:'XAU/USD',   type:'spread',     sev:'LOW',  desc:'Minor spread widening detected at session open.', ai:'Expected behavior at market open — insufficient counterpart liquidity.', m:[{l:'MAX SPREAD',v:'$0.41'},{l:'BASELINE MULT',v:'2.3×'},{l:'DURATION',v:'280ms'}], ts:'14:01:44', ago:'24m ago' },
  { id:'e10', asset:'DOGE/USD',  type:'crash',      sev:'LOW',  desc:'Price dipped 1.22% in a brief sell-off.', ai:'Minor downside move with quick recovery — likely a small aggressive market order.', m:[{l:'PRICE MOVE',v:'-1.22%'},{l:'DURATION',v:'420ms'},{l:'CLOSE PRICE',v:'$0.3800'}], ts:'13:58:30', ago:'27m ago' },
];

// ── STATE ─────────────────────────────────────────────────
let activeFilter = null;
let visibleCount = 8;
const STATS = { total: 4821, crashes: 312, avgDuration: 1.4, mostActive: 'BTC/USD' };

// ── HELPERS ───────────────────────────────────────────────
function isLight() { return document.body.classList.contains('light'); }
function goReplay(asset) { alert('→ Replay for ' + asset + '\n(would navigate to /replay?asset=' + asset + ')'); }

function makeBadge(text, color, bgOpacity=0.12, borderOpacity=0.3, icon='') {
  return `<span className="badge" style={{background: '${color}${Math.round(bgOpacity*255).toString(16).padStart(2,\'0\')}', border: '1px solid ${color}${Math.round(borderOpacity*255).toString(16).padStart(2,\'0\')}', color: '${color}'}}>${icon?icon+' ':''}${text}</span>`;
}

function genSparkline(type, n=30) {
  let v=100; const pts=[];
  for(let i=0;i<n;i++){
    const t=i/(n-1);
    if(type==='crash'){
      if(t>0.28&&t<0.5) v-=(1.8+Math.random()*1.4);
      else if(t>=0.5) v+=(0.25+Math.random()*0.35);
      else v+=(Math.random()-0.5)*0.25;
    } else if(type==='pump'){
      if(t>0.28&&t<0.58) v+=(1.2+Math.random()*1.1);
      else v+=(Math.random()-0.5)*0.25;
    } else if(type==='spread'){
      v+=(Math.random()-0.5)*(t>0.3&&t<0.62?2.8:0.4);
    } else {
      v+=(Math.random()-0.5)*(t>0.2&&t<0.75?3.2:0.35);
    }
    pts.push(v);
  }
  return pts;
}

function drawSparkline(canvas, pts, color, fill=false) {
  const W=canvas.width, H=canvas.height;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,W,H);
  if(!pts||pts.length<2) return;
  const mn=Math.min(...pts), mx=Math.max(...pts), rng=(mx-mn)||1;
  const xs=pts.map((_,i)=>2+(i/(pts.length-1))*(W-4));
  const ys=pts.map(v=>(H-4)-((v-mn)/rng)*(H*0.8)+(H*0.1));
  if(fill){
    ctx.beginPath();
    ctx.moveTo(xs[0],H); xs.forEach((x,i)=>ctx.lineTo(x,ys[i])); ctx.lineTo(xs[xs.length-1],H); ctx.closePath();
    ctx.fillStyle=color+'1a'; ctx.fill();
  }
  ctx.beginPath(); xs.forEach((x,i)=>i===0?ctx.moveTo(x,ys[i]):ctx.lineTo(x,ys[i]));
  ctx.strokeStyle=color; ctx.lineWidth=fill?2:1.5; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke();
}

// ── RENDER FEATURED ───────────────────────────────────────
function renderFeatured() {
  const ev = RAW_EVENTS[0]; // most dramatic
  const tc = TYPE_CONFIG[ev.type];
  const sc = SEV_CONFIG[ev.sev];

  document.getElementById('f-asset').textContent = ev.asset;
  document.getElementById('f-desc').textContent = ev.desc;
  document.getElementById('f-ai').textContent = ev.ai;
  document.getElementById('f-ts').textContent = ev.ts + ' · ' + ev.ago;
  document.getElementById('featured-card').style.borderLeftColor = tc.color;

  document.getElementById('f-badges').innerHTML =
    makeBadge(tc.label, tc.color, 0.12, 0.3, tc.icon) + ' ' +
    `<span className="badge" style={{background: '${sc.bg}', border: '1px solid ${sc.border}', color: '${sc.color}'}}>${ev.sev}</span>`;

  document.getElementById('f-metrics').innerHTML = ev.m.map(m =>
    `<div className="f-metric"><div className="f-metric-label">${m.l}</div><div className="f-metric-value">${m.v}</div></div>`
  ).join('');

  const canvas = document.getElementById('featured-spark-canvas');
  drawSparkline(canvas, genSparkline(ev.type), tc.color, true);
}

// ── RENDER STATS ──────────────────────────────────────────
function renderStats() {
  document.getElementById('st-total').textContent = STATS.total.toLocaleString();
  document.getElementById('st-crashes').textContent = STATS.crashes.toLocaleString();
  document.getElementById('st-duration').textContent = STATS.avgDuration.toFixed(1) + 's';
  document.getElementById('st-active').textContent = STATS.mostActive;
  document.getElementById('total-pill').textContent = STATS.total.toLocaleString() + ' Events recorded';
}

// ── RENDER EVENT CARDS ────────────────────────────────────
function renderEvents() {
  let data = RAW_EVENTS;
  if (activeFilter) data = data.filter(e => e.type === activeFilter);

  const visible = data.slice(0, visibleCount);
  const list = document.getElementById('events-list');
  const loadMoreBtn = document.getElementById('load-more-btn');

  list.innerHTML = visible.map((ev, i) => {
    const tc = TYPE_CONFIG[ev.type];
    const sc = SEV_CONFIG[ev.sev];
    const sparkId = 'spark-'+ev.id;
    const delay = i * 0.04;

    const metricsHtml = ev.m.map(m =>
      `<div className="event-metric-pill"><span className="metric-name">${m.l}</span>${m.v}</div>`
    ).join('');

    return `<div className="event-card" style={{borderLeftColor: '${tc.color}', animationDelay: '${delay}s'}}
      onmouseenter="this.style.background='${isLight()?'#fafafa':'rgba(255,255,255,0.04)'}'"
      onmouseleave="this.style.background='${isLight()?'#fff':'rgba(255,255,255,0.03)'}'">
      <div className="event-card-inner">
        <div className="event-icon" style={{background: '${tc.color}1a', border: '1px solid ${tc.color}33', color: '${tc.color}'}}>${tc.icon}</div>
        <div className="event-body">
          <div className="event-top">
            <span className="event-asset">${ev.asset}</span>
            <div className="event-badges">
              ${makeBadge(tc.label, tc.color)}
              <span className="badge" style={{background: '${sc.bg}', border: '1px solid ${sc.border}', color: '${sc.color}'}}>${ev.sev}</span>
            </div>
            <span className="event-ts">${ev.ts} · ${ev.ago}</span>
          </div>
          <div className="event-desc">${ev.desc}</div>
          <div className="event-metrics">${metricsHtml}</div>
          <div className="event-ai">
            <div className="event-ai-label">AI Explanation</div>
            <div className="event-ai-text">${ev.ai}</div>
          </div>
        </div>
        <div className="event-right">
          <canvas id="${sparkId}" width="88" height="40"></canvas>
          <button className="replay-btn" onClick="goReplay('${ev.asset}')">
            Replay
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  // draw sparklines after DOM update
  requestAnimationFrame(() => {
    visible.forEach(ev => {
      const c = document.getElementById('spark-'+ev.id);
      if (c) drawSparkline(c, genSparkline(ev.type), TYPE_CONFIG[ev.type].color);
    });
  });

  loadMoreBtn.disabled = visibleCount >= data.length;
  loadMoreBtn.textContent = visibleCount >= data.length ? 'No more events' : 'Load older events';

  if (visible.length === 0) {
    list.innerHTML = `<div className="empty">
      <div className="empty-icon">⏱</div>
      <div className="empty-title">No events recorded yet</div>
      <div className="empty-sub">Market DVR is recording live — events will appear here automatically</div>
    </div>`;
  }
}

// ── FILTER ────────────────────────────────────────────────
function setFilter(type, btn) {
  activeFilter = type;
  visibleCount = 8;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderEvents();
}

function loadMore() {
  visibleCount += 8;
  renderEvents();
}

// ── CLOCK ─────────────────────────────────────────────────
function tick() {
  const now = new Date();
  const ts = now.toTimeString().slice(0,8)+'.'+String(now.getMilliseconds()).padStart(3,'0');
  document.getElementById('rb-ts').textContent = ts + ' UTC';
}
setInterval(tick, 50);

// ── THEME ─────────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-toggle').textContent = light ? '☀️' : '🌙';
  localStorage.setItem('mdvr-theme', light ? 'light' : 'dark');
  renderEvents(); // redraw hover colors
}
if (localStorage.getItem('mdvr-theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// ── INIT ──────────────────────────────────────────────────
renderFeatured();
renderStats();
renderEvents();
tick();

  */
}
    </>
  );
}
