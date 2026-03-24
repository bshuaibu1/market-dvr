import React from 'react';
import './replay.css';

export default function ReplayView() {
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
    <a className="nav-link active" href="replay.html">Replay</a>
    <a className="nav-link" href="#">Events</a>
  </div>
  <div className="nav-right">
    <button className="theme-btn" id="theme-toggle" onClick="toggleTheme()">🌙</button>
  </div>
</nav>

<div className="app">

  {/*  MAIN CHART AREA  */}
  <div className="main">

    {/*  TOOLBAR  */}
    <div className="toolbar">
      <select className="asset-select" id="asset-sel" onChange="changeAsset(this.value)">
        <option>BTC/USD</option><option>ETH/USD</option><option>SOL/USD</option>
        <option>BNB/USD</option><option>WIF/USD</option><option>BONK/USD</option>
        <option>XAU/USD</option><option>XAG/USD</option><option>WTI/USD</option>
        <option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option>
      </select>

      <span className="toolbar-label">Replay</span>

      <button className="btn-pill" id="btn-live" onClick="toggleLive()">
        <span className="pill-dot" id="live-dot" style={{background: 'var(--muted)'}}></span>
        LIVE
      </button>

      <button className="btn-pill compare" id="btn-compare" onClick="toggleCompare()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
        Compare
      </button>

      {/*  compare asset selector — shown when compare is active  */}
      <span id="compare-vs" style={{display: 'none', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)'}}>
        vs
        <select className="asset-select" id="compare-asset-sel" onChange="changeCompareAsset(this.value)">
          <option>ETH/USD</option><option>BTC/USD</option><option>SOL/USD</option>
          <option>BNB/USD</option><option>XAU/USD</option><option>EUR/USD</option>
        </select>
      </span>

      <button className="btn-pill" id="btn-shortcuts" onClick="toggleShortcuts()" style={{display: 'none'}} title="Keyboard shortcuts">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>
        Shortcuts
      </button>

      <button className="btn-share" onClick="alert('Share link copied!')" style={{marginLeft: 'auto'}}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        Share
      </button>
    </div>

    {/*  OVERLAY TOGGLES + TIMEFRAMES  */}
    <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexShrink: '0', flexWrap: 'wrap'}}>
      {/*  normal overlay row (hidden when compare active)  */}
      <div className="overlay-row" id="overlay-row">
        <button className="overlay-btn" id="ov-bid" onClick="toggleOverlay('bid')">
          <span className="dot" style={{background: 'var(--blue)'}}></span>Bid
        </button>
        <button className="overlay-btn" id="ov-ask" onClick="toggleOverlay('ask')">
          <span className="dot" style={{background: 'var(--red)'}}></span>Ask
        </button>
        <button className="overlay-btn" id="ov-conf" onClick="toggleOverlay('conf')">
          <span className="dot" style={{background: 'var(--accent)'}}></span>Confidence
        </button>
      </div>
      {/*  compare legend row (shown when compare active)  */}
      <div className="overlay-row" id="compare-legend" style={{display: 'none'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'}}>
          <span style={{display: 'inline-block', width: '14px', height: '2px', borderRadius: '1px', background: 'var(--fg)'}}></span>
          <span style={{color: 'var(--fg)', fontWeight: '500'}} id="legend-sym1">BTC/USD</span>
          <span style={{fontFamily: '\'JetBrains Mono\',monospace', fontSize: '11px', fontWeight: '500'}} id="legend-pct1">+0.00%</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginLeft: '12px'}}>
          <span style={{display: 'inline-block', width: '14px', height: '2px', borderRadius: '1px', background: 'var(--blue)'}}></span>
          <span style={{color: 'var(--blue)', fontWeight: '500'}} id="legend-sym2">ETH/USD</span>
          <span style={{fontFamily: '\'JetBrains Mono\',monospace', fontSize: '11px', fontWeight: '500'}} id="legend-pct2">+0.00%</span>
        </div>
      </div>

      <div className="tf-row">
        <div className="tf-track" id="tf-track">
          <button className="tf-btn" onClick="setTf('50ms',this)">50ms</button>
          <button className="tf-btn" onClick="setTf('200ms',this)">200ms</button>
          <button className="tf-btn active" onClick="setTf('1s',this)">1s</button>
          <button className="tf-btn" onClick="setTf('5s',this)">5s</button>
          <button className="tf-btn" onClick="setTf('30s',this)">30s</button>
          <button className="tf-btn" onClick="setTf('1m',this)">1m</button>
          <button className="tf-btn" onClick="setTf('5m',this)">5m</button>
          <button className="tf-btn" onClick="setTf('15m',this)">15m</button>
          <button className="tf-btn" onClick="setTf('1h',this)">1h</button>
        </div>
        <span className="pyth-badge" id="pyth-badge" style={{display: 'none'}}>★ Pyth Pro Only</span>
      </div>
    </div>

    {/*  PRICE HEADLINE  */}
    <div className="price-head">
      <span className="price-val" id="price-val">$97,412.00</span>
      <span className="price-delta up" id="price-delta">+0.00</span>
      <span className="price-ts" id="price-ts">Frame time: —</span>
    </div>

    {/*  MAIN CHART  */}
    <div className="chart-wrap" id="chart-wrap">
      <canvas id="main-chart"></canvas>
    </div>

    {/*  SPREAD CHART  */}
    <div className="spread-wrap" id="spread-wrap">
      <div className="spread-label">
        Spread Width
        <span className="spread-val" id="spread-val">—</span>
      </div>
      <canvas id="spread-chart"></canvas>
    </div>

    {/*  SHOCK PROPAGATION  */}
    <div id="shock-wrap" style={{flexShrink: '0', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 14px'}}>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px'}}>
        <span style={{fontSize: '9px', fontWeight: '500', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)'}}>Shock Propagation</span>
        <span style={{fontSize: '10px', fontFamily: '\'JetBrains Mono\',monospace', color: 'var(--muted)'}} id="shock-source">Source: BTC/USD</span>
      </div>
      <div id="shock-bars" style={{display: 'flex', flexDirection: 'column', gap: '4px'}}></div>
    </div>

    {/*  SCRUBBER  */}
    <div className="scrubber-area">
      <div className="scrubber-markers" id="marker-row"></div>
      <input type="range" className="scrubber" id="scrubber" min="0" max="499" value="0"
        onInput="scrubTo(+this.value)" />
    </div>

    {/*  PLAYBACK BAR  */}
    <div className="playback-bar">
      <button className="pb-btn" onClick="stepBack()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>
      </button>
      <button className="pb-play" id="pb-play" onClick="togglePlay()">
        <svg id="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <svg id="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="white" style={{display: 'none'}}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      </button>
      <button className="pb-btn" onClick="stepForward()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
      </button>

      <div className="pb-divider"></div>

      <div className="speed-btns">
        <button className="speed-btn" onClick="setSpeed(0.25,this)">0.25×</button>
        <button className="speed-btn" onClick="setSpeed(0.5,this)">0.5×</button>
        <button className="speed-btn active" onClick="setSpeed(1,this)">1×</button>
        <button className="speed-btn" onClick="setSpeed(2,this)">2×</button>
        <button className="speed-btn" onClick="setSpeed(4,this)">4×</button>
      </div>
    </div>

  </div>

  {/*  INSPECTOR PANEL  */}
  <div className="inspector">
    <div className="inspector-tabs">
      <button className="ins-tab active" id="tab-inspector" onClick="setInsTab('inspector')">Frame Inspector</button>
      <button className="ins-tab autopsy" id="tab-autopsy" onClick="setInsTab('autopsy')">Autopsy</button>
    </div>

    {/*  INSPECTOR BODY  */}
    <div className="inspector-body" id="inspector-body">
      {/*  populated by JS  */}
    </div>
  </div>

</div>

{/*  SHORTCUTS MODAL  */}
<div className="modal-backdrop" id="shortcuts-modal" style={{display: 'none'}} onClick="if(event.target===this)toggleShortcuts()">
  <div className="modal-box">
    <div className="modal-title">Keyboard Shortcuts</div>
    <div className="shortcut-row"><span className="shortcut-action">Play / Pause</span><span className="shortcut-key"><span className="kbd">Space</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Step back 10 frames</span><span className="shortcut-key"><span className="kbd">←</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Step forward 10 frames</span><span className="shortcut-key"><span className="kbd">→</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Step back 100 frames</span><span className="shortcut-key"><span className="kbd">⇧</span><span className="kbd">←</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Step forward 100 frames</span><span className="shortcut-key"><span className="kbd">⇧</span><span className="kbd">→</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Jump to start</span><span className="shortcut-key"><span className="kbd">Home</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Jump to end</span><span className="shortcut-key"><span className="kbd">End</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Speed 0.25×</span><span className="shortcut-key"><span className="kbd">1</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Speed 0.5×</span><span className="shortcut-key"><span className="kbd">2</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Speed 1×</span><span className="shortcut-key"><span className="kbd">3</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Speed 2×</span><span className="shortcut-key"><span className="kbd">4</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Speed 4×</span><span className="shortcut-key"><span className="kbd">5</span></span></div>
    <div className="shortcut-row"><span className="shortcut-action">Close modal</span><span className="shortcut-key"><span className="kbd">Esc</span></span></div>
  </div>
</div>

{
  /* TODO: Move this logic to a React Effect or Helper */
  /*

// ── DATA GENERATION ───────────────────────────────────────
const ASSET_PRICES = {
  'BTC/USD':97412,'ETH/USD':3841,'SOL/USD':188.4,'BNB/USD':612.3,
  'WIF/USD':2.184,'BONK/USD':0.0000328,'XAU/USD':2341.8,'XAG/USD':27.84,
  'WTI/USD':81.24,'EUR/USD':1.08742,'GBP/USD':1.27384,'USD/JPY':149.84,
};

function genTicks(basePrice, n=500) {
  const ticks = [];
  let p = basePrice;
  const now = Date.now() * 1000 - n * 50000; // us
  for (let i=0; i<n; i++) {
    const j = (Math.random()-0.498)*0.0022;
    p = p*(1+j);
    const spread = p * (0.00003 + Math.random()*0.00008);
    const conf = p * (0.0001 + Math.random()*0.0002);
    ticks.push({
      i, price:p,
      bid: p - spread/2,
      ask: p + spread/2,
      spread,
      conf,
      confNorm: Math.max(0.88, Math.min(0.999, 1 - conf/p)),
      ts: now + i*50000,
    });
  }
  // inject 3 events
  const e1 = Math.floor(n*0.22), e2 = Math.floor(n*0.51), e3 = Math.floor(n*0.74);
  for (let k=0; k<8; k++) {
    ticks[e1+k].price *= (1 - 0.003 - k*0.0005);
    ticks[e2+k].spread *= (6 + k);
    ticks[e3+k].confNorm *= (0.88 - k*0.01);
  }
  return ticks;
}

// ── STATE ─────────────────────────────────────────────────
let asset = 'BTC/USD';
let compareAsset = 'ETH/USD';
let ticks = genTicks(ASSET_PRICES[asset]);
let compareTicks = genTicks(ASSET_PRICES[compareAsset]);
let frame = 60;
let playing = false;
let speed = 1;
let playTimer = null;
let overlays = { bid:false, ask:false, conf:false };
let insTab = 'inspector';
let isLive = false;
let compareMode = false;
let showShortcutsModal = false;

// pre-compute event markers
let markers = [];
function computeMarkers() {
  const n = ticks.length;
  // max spread
  const maxSpIdx = ticks.reduce((bi,t,i)=> t.spread > ticks[bi].spread ? i : bi, 0);
  // min conf
  const minCfIdx = ticks.reduce((bi,t,i)=> t.confNorm < ticks[bi].confNorm ? i : bi, 0);
  // peak vol (biggest price jump)
  let peakVolIdx=1, peakVolDelta=0;
  for (let i=1;i<ticks.length;i++) {
    const d=Math.abs(ticks[i].price-ticks[i-1].price);
    if(d>peakVolDelta){peakVolDelta=d;peakVolIdx=i;}
  }
  // synthetic events
  const ev1=Math.floor(n*0.22), ev2=Math.floor(n*0.51), ev3=Math.floor(n*0.74);
  markers = [
    { frame:ev1, label:'Volatility Spike', color:'#ff453a', type:'event' },
    { frame:ev2, label:'Spread Spike',     color:'#ffd60a', type:'event' },
    { frame:ev3, label:'Conf Drop',        color:'#bf5af2', type:'event' },
    { frame:maxSpIdx, label:'Max Spread',  color:'#f97316', type:'ai' },
    { frame:minCfIdx, label:'Max Conf Exp',color:'#9333ea', type:'ai' },
    { frame:peakVolIdx,label:'Peak Vol',   color:isLight()?'#1d1d1f':'#f5f5f7', type:'ai' },
  ];
}
computeMarkers();

// ── HELPERS ───────────────────────────────────────────────
function isLight() { return document.body.classList.contains('light'); }
function fmtPrice(p) {
  if (p >= 10000) return '$'+p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  if (p >= 100)   return '$'+p.toFixed(2);
  if (p >= 1)     return '$'+p.toFixed(4);
  if (p >= 0.001) return '$'+p.toFixed(6);
  return '$'+p.toFixed(9);
}
function fmtSpread(s) {
  if (!isFinite(s)) return '—';
  if (s === 0) return '$0.00';
  const a = Math.abs(s);
  if (a < 0.0001) return '$'+s.toFixed(8);
  if (a < 0.01)   return '$'+s.toFixed(6);
  if (a < 1)      return '$'+s.toFixed(4);
  return '$'+s.toFixed(2);
}
function fmtTs(us) {
  if (!us) return '—';
  const d = new Date(us/1000);
  return d.toLocaleString();
}

// ── CHART DRAWING ─────────────────────────────────────────
function drawChart() {
  const wrap = document.getElementById('chart-wrap');
  const canvas = document.getElementById('main-chart');
  const dpr = window.devicePixelRatio || 1;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const light = isLight();
  const pad = { t:16, r:52, b:8, l:8 };
  const cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;

  // bg
  ctx.clearRect(0,0,W,H);

  const prices = ticks.map(t=>t.price);
  const mn = Math.min(...prices), mx = Math.max(...prices);
  const rng = (mx-mn)||1;
  const pMin = mn - rng*0.08, pMax = mx + rng*0.08;
  const pRng = pMax - pMin;

  function px(i) { return pad.l + (i/(ticks.length-1))*cW; }
  function py(p) { return pad.t + ((pMax-p)/pRng)*cH; }

  // grid lines
  const gridColor = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)';
  const lblColor  = light ? 'rgba(0,0,0,0.28)'  : 'rgba(255,255,255,0.28)';
  ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
  [0.2, 0.4, 0.6, 0.8].forEach(f => {
    const y = pad.t + f*cH;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke();
    const val = pMax - f*pRng;
    ctx.fillStyle = lblColor; ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'left'; ctx.fillText(fmtPrice(val), W-pad.r+5, y+3);
  });

  // confidence band
  if (overlays.conf) {
    ctx.beginPath();
    ticks.forEach((t,i) => {
      const x=px(i), y=py(t.price+t.conf);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    for (let i=ticks.length-1;i>=0;i--) {
      ctx.lineTo(px(i), py(ticks[i].price-ticks[i].conf));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(230,0,122,0.07)'; ctx.fill();
  }

  // bid / ask lines
  if (overlays.bid) {
    ctx.beginPath(); ctx.strokeStyle = light ? '#0055d4' : '#0a84ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ticks.forEach((t,i)=>{ const x=px(i),y=py(t.bid); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  if (overlays.ask) {
    ctx.beginPath(); ctx.strokeStyle = light ? '#cc2200' : '#ff453a'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
    ticks.forEach((t,i)=>{ const x=px(i),y=py(t.ask); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  if (compareMode) {
    // normalized % lines
    const base1 = ticks[0].price || 1;
    const base2 = compareTicks[0]?.price || 1;
    const allPcts = [
      ...ticks.map(t=>((t.price-base1)/base1)*100),
      ...compareTicks.map(t=>((t.price-base2)/base2)*100),
    ].filter(isFinite);
    const cMin = Math.min(...allPcts), cMax = Math.max(...allPcts);
    const cRng = (cMax-cMin)||0.1;
    const cpMin = cMin - cRng*0.08, cpMax = cMax + cRng*0.08;
    const cpRng = cpMax - cpMin;
    const cpY = p => pad.t + ((cpMax-p)/cpRng)*cH;

    // y-axis labels for % mode
    [0.2,0.5,0.8].forEach(f => {
      const val = cpMax - f*cpRng;
      ctx.fillStyle = lblColor; ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left'; ctx.fillText((val>=0?'+':'')+val.toFixed(2)+'%', W-pad.r+5, pad.t+f*cH+3);
    });

    // zero line
    const zy = cpY(0);
    if (zy > pad.t && zy < pad.t+cH) {
      ctx.beginPath(); ctx.moveTo(pad.l,zy); ctx.lineTo(W-pad.r,zy);
      ctx.strokeStyle = light?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.07)';
      ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
    }

    // compare line
    ctx.beginPath();
    compareTicks.forEach((t,i)=>{ const x=px(i),y=cpY(((t.price-base2)/base2)*100); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle='#0a84ff'; ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.stroke();

    // primary line
    ctx.beginPath();
    ticks.forEach((t,i)=>{ const x=px(i),y=cpY(((t.price-base1)/base1)*100); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle=light?'#1d1d1f':'#ffffff'; ctx.lineWidth=1.5; ctx.lineJoin='round'; ctx.stroke();

    // update legend pcts
    const curPct1 = (((ticks[frame]?.price||base1)-base1)/base1*100).toFixed(2);
    const curPct2 = (((compareTicks[Math.min(frame,compareTicks.length-1)]?.price||base2)-base2)/base2*100).toFixed(2);
    const l1=document.getElementById('legend-pct1'), l2=document.getElementById('legend-pct2');
    if(l1){ l1.textContent=(+curPct1>=0?'+':'')+curPct1+'%'; l1.style.color=+curPct1>=0?'var(--green)':'var(--red)'; }
    if(l2){ l2.textContent=(+curPct2>=0?'+':'')+curPct2+'%'; l2.style.color=+curPct2>=0?'var(--green)':'var(--red)'; }
  } else {
    // price area fill
    ctx.beginPath();
    ticks.forEach((t,i)=>{ const x=px(i),y=py(t.price); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.lineTo(px(ticks.length-1), pad.t+cH);
    ctx.lineTo(pad.l, pad.t+cH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t+cH);
    grad.addColorStop(0, light ? 'rgba(29,29,31,0.1)' : 'rgba(255,255,255,0.06)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad; ctx.fill();

    // price line
    ctx.beginPath();
    ticks.forEach((t,i)=>{ const x=px(i),y=py(t.price); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    ctx.strokeStyle = light ? '#1d1d1f' : '#ffffff'; ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }

  // event markers on chart
  markers.forEach(m => {
    if (m.frame >= ticks.length) return;
    const x = px(m.frame), y = py(ticks[m.frame].price);
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2);
    ctx.fillStyle = m.color; ctx.fill();
    ctx.strokeStyle = light?'rgba(0,0,0,0.15)':'rgba(255,255,255,0.15)'; ctx.lineWidth=1; ctx.stroke();
  });

  // playhead
  const fx = px(frame);
  ctx.beginPath(); ctx.moveTo(fx, pad.t); ctx.lineTo(fx, pad.t+cH);
  ctx.strokeStyle = 'rgba(230,0,122,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.stroke(); ctx.setLineDash([]);

  // playhead dot
  if (frame < ticks.length) {
    const fy = py(ticks[frame].price);
    ctx.beginPath(); ctx.arc(fx, fy, 5, 0, Math.PI*2);
    ctx.fillStyle = '#e6007a'; ctx.fill();
    ctx.strokeStyle = light?'#fff':'var(--bg)'; ctx.lineWidth=2; ctx.stroke();
  }
}

function drawSpread() {
  const wrap = document.getElementById('spread-wrap');
  const canvas = document.getElementById('spread-chart');
  const dpr = window.devicePixelRatio || 1;
  const W = wrap.clientWidth, H = wrap.clientHeight;
  canvas.width = W*dpr; canvas.height = H*dpr;
  canvas.style.width = W+'px'; canvas.style.height = H+'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { t:22, r:8, b:4, l:8 };
  const cW = W-pad.l-pad.r, cH = H-pad.t-pad.b;
  ctx.clearRect(0,0,W,H);

  const spreads = ticks.map(t=>t.spread).filter(isFinite);
  const maxS = Math.max(...spreads) || 1;

  // fill area
  ctx.beginPath();
  ticks.forEach((t,i) => {
    const x = pad.l + (i/(ticks.length-1))*cW;
    const y = pad.t + (1 - t.spread/maxS)*cH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.lineTo(pad.l+cW, pad.t+cH); ctx.lineTo(pad.l, pad.t+cH); ctx.closePath();
  ctx.fillStyle = 'rgba(230,0,122,0.12)'; ctx.fill();

  // line
  ctx.beginPath();
  ticks.forEach((t,i) => {
    const x = pad.l + (i/(ticks.length-1))*cW;
    const y = pad.t + (1 - t.spread/maxS)*cH;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.strokeStyle = '#e6007a'; ctx.lineWidth = 1.2;
  ctx.lineJoin = 'round'; ctx.stroke();

  // playhead
  const fx = pad.l + (frame/(ticks.length-1))*cW;
  ctx.beginPath(); ctx.moveTo(fx,pad.t); ctx.lineTo(fx,pad.t+cH);
  ctx.strokeStyle='rgba(230,0,122,0.35)'; ctx.lineWidth=1; ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]);
}

// ── MARKERS IN SCRUBBER ───────────────────────────────────
function renderScrubberMarkers() {
  const row = document.getElementById('marker-row');
  const n = ticks.length;
  row.innerHTML = markers.map(m => {
    const pct = n>1 ? (m.frame/(n-1))*100 : 0;
    return `<div className="marker" style={{left: '${pct}%', background: '${m.color}', ${m.type==='ai'?'opacity: '0.7\':\'\'}'}}
      title="${m.label}" onClick="scrubTo(${m.frame})"></div>`;
  }).join('');
}

// ── INSPECTOR ─────────────────────────────────────────────
function renderInspector() {
  const body = document.getElementById('inspector-body');
  const t = ticks[frame] || ticks[0];
  const prev = ticks[Math.max(0,frame-1)] || t;
  const delta = t.price - prev.price;

  if (insTab === 'inspector') {
    // Compare mode: two-column layout
    if (compareMode) {
      const ct = compareTicks[Math.min(frame, compareTicks.length-1)] || compareTicks[0];
      const base1 = ticks[0].price||1, base2 = compareTicks[0]?.price||1;
      const pct1 = (((t.price-base1)/base1)*100).toFixed(3);
      const pct2 = (((ct.price-base2)/base2)*100).toFixed(3);
      const rows1 = [
        {l:'Price', v:fmtPrice(t.price)}, {l:'Bid', v:fmtPrice(t.bid)},
        {l:'Ask', v:fmtPrice(t.ask)}, {l:'Spread', v:fmtSpread(t.spread)},
        {l:'Conf', v:(t.confNorm*100).toFixed(1)+'%'}, {l:'Time', v:fmtTs(t.ts)},
      ];
      const rows2 = [
        {l:'Price', v:fmtPrice(ct.price)}, {l:'Bid', v:fmtPrice(ct.bid)},
        {l:'Ask', v:fmtPrice(ct.ask)}, {l:'Spread', v:fmtSpread(ct.spread)},
        {l:'Conf', v:(ct.confNorm*100).toFixed(1)+'%'}, {l:'Time', v:fmtTs(ct.ts)},
      ];
      const colRow = (r) => `<div className="ins-row"><div className="ins-label">${r.l}</div><div className="ins-value small" style={{fontFamily: '\'JetBrains Mono\',monospace'}}>${r.v}</div></div>`;
      body.innerHTML = `<div className="compare-cols">
        <div>
          <div className="compare-col-header" style={{color: 'var(--fg)'}}>${asset} <span style={{color: '${+pct1>=0?\'var(--green)\':\'var(--red)\'}', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '10px'}}>${+pct1>=0?'+':''}${pct1}%</span></div>
          ${rows1.map(colRow).join('')}
        </div>
        <div>
          <div className="compare-col-header" style={{color: 'var(--blue)'}}>${compareAsset} <span style={{color: '${+pct2>=0?\'var(--green)\':\'var(--red)\'}', fontFamily: '\'JetBrains Mono\',monospace', fontSize: '10px'}}>${+pct2>=0?'+':''}${pct2}%</span></div>
          ${rows2.map(colRow).join('')}
        </div>
      </div>`;
      return;
    }

    const rows = [
      { label:'Price',      value: fmtPrice(t.price), delta: delta, mono:true },
      { label:'Bid',        value: fmtPrice(t.bid),   mono:true },
      { label:'Ask',        value: fmtPrice(t.ask),   mono:true },
      { label:'Spread',     value: fmtSpread(t.spread), mono:true },
      { label:'Confidence', value: (t.confNorm*100).toFixed(2)+'%', mono:true },
      { label:'Frame Time', value: fmtTs(t.ts), small:true },
      { label:'Frame',      value: `${frame} / ${ticks.length-1}`, mono:true },
    ];

    const evChips = markers.filter(m=>m.type==='event').map(m =>
      `<button className="ev-chip" onClick="scrubTo(${m.frame})">
        <span className="ev-dot" style={{background: '${m.color}'}}></span>${m.label}
      </button>`
    ).join('');

    const aiRows = markers.filter(m=>m.type==='ai').map(m =>
      `<button className="ai-marker-btn" onClick="scrubTo(${m.frame})">
        <span className="ai-marker-diamond" style={{background: '${m.color}'}}></span>
        <span className="ai-marker-label">${m.label}</span>
        <span className="ai-marker-frame">#${m.frame}</span>
      </button>`
    ).join('');

    body.innerHTML = rows.map(r => {
      const deltaHtml = r.delta !== undefined
        ? `<span className="ins-delta ${r.delta>=0?'up':'down'}">${r.delta>=0?'+':''}${r.delta.toFixed(2)}</span>` : '';
      return `<div className="ins-row">
        <div className="ins-label">${r.label}</div>
        <div className="ins-value${r.small?' small':''}">
          <span${r.mono?' style={{fontFamily: 'JetBrains Mono,monospace'}}':''}>${r.value}</span>
          ${deltaHtml}
        </div>
      </div>`;
    }).join('') +
    `<div className="ins-section-title">Timeline Events</div>
     <div style={{display: 'flex', flexWrap: 'wrap', gap: '5px'}}>${evChips||'<span style={{fontSize: '11px', color: 'var(--muted)'}}>No events in range</span>'}</div>
     <div className="ins-section-title">AI Markers</div>
     ${aiRows}`;

  } else {
    // autopsy tab
    const t0 = ticks[0], tn = ticks[ticks.length-1];
    const priceDelta = tn.price - t0.price;
    const priceDeltaPct = (priceDelta/t0.price)*100;
    const maxSp = Math.max(...ticks.map(t=>t.spread));
    const minCf = Math.min(...ticks.map(t=>t.confNorm))*100;

    body.innerHTML = `
      <span className="autopsy-event-badge">Volatility Spike · ${asset}</span>
      <div className="autopsy-metric">
        <div className="autopsy-metric-label">Event Type</div>
        <div className="autopsy-metric-value">Volatility Spike</div>
      </div>
      <div className="autopsy-metric">
        <div className="autopsy-metric-label">Price Move</div>
        <div className="autopsy-metric-value" style={{color: '${priceDeltaPct>=0?\'var(--green)\':\'var(--red)\'}'}}>${priceDeltaPct>=0?'+':''}${priceDeltaPct.toFixed(3)}%</div>
      </div>
      <div className="autopsy-metric">
        <div className="autopsy-metric-label">Max Spread</div>
        <div className="autopsy-metric-value">${fmtSpread(maxSp)}</div>
      </div>
      <div className="autopsy-metric">
        <div className="autopsy-metric-label">Min Confidence</div>
        <div className="autopsy-metric-value">${minCf.toFixed(2)}%</div>
      </div>
      <div className="autopsy-metric">
        <div className="autopsy-metric-label">Duration</div>
        <div className="autopsy-metric-value">${(ticks.length*50/1000).toFixed(1)}s window</div>
      </div>
      <div className="ai-block">
        <div className="ai-block-title">AI Explanation</div>
        <div className="ai-block-text">
          A rapid intra-tick price dislocation was detected across the ${asset} feed.
          The spread widened ${(maxSp/ticks[0].spread).toFixed(1)}× above its baseline, suggesting a brief
          liquidity gap. Confidence intervals expanded simultaneously, indicating
          Pyth aggregators detected significant source divergence. Recovery
          occurred within ~${Math.floor(Math.random()*200+80)}ms.
        </div>
      </div>`;
  }
}

// ── SHOCK PROPAGATION ─────────────────────────────────────
const CORRELATED = ['ETH/USD','SOL/USD','BNB/USD','XAU/USD','EUR/USD'];
function renderShock() {
  const src = document.getElementById('shock-source');
  if (src) src.textContent = 'Source: '+asset;
  const bars = document.getElementById('shock-bars');
  if (!bars) return;
  const pct = frame/(ticks.length-1);
  bars.innerHTML = CORRELATED.filter(s=>s!==asset).map(sym => {
    const seed = sym.charCodeAt(0)+sym.charCodeAt(1);
    const baseCorr = 0.3 + (seed%10)*0.06;
    const corr = Math.min(0.99, baseCorr + pct*0.2 + (Math.random()-0.5)*0.08);
    const lag = Math.round(20 + (seed%5)*15);
    const impact = (corr*100).toFixed(0);
    const barColor = corr > 0.7 ? 'var(--red)' : corr > 0.5 ? 'var(--yellow)' : 'var(--green)';
    const light = isLight();
    return `<div style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 0'}}>
      <span style={{fontSize: '11px', fontWeight: '500', color: 'var(--fg)', width: '72px', flexShrink: '0'}}>${sym}</span>
      <div style={{flex: '1', height: '4px', borderRadius: '99px', background: 'var(--btn-bg)', overflow: 'hidden'}}>
        <div style={{height: '100%', borderRadius: '99px', width: '${corr*100}%', background: '${barColor}', transition: 'width 0.4s ease'}}></div>
      </div>
      <span style={{fontSize: '10px', fontFamily: '\'JetBrains Mono\',monospace', color: '${barColor}', width: '32px', textAlign: 'right'}}>${impact}%</span>
      <span style={{fontSize: '9px', color: 'var(--muted)', fontFamily: '\'JetBrains Mono\',monospace', whiteSpace: 'nowrap'}}>${lag}ms lag</span>
    </div>`;
  }).join('');
}

// ── UPDATE UI ─────────────────────────────────────────────
function updatePriceHead() {
  const t = ticks[frame] || ticks[0];
  const prev = ticks[Math.max(0,frame-1)] || t;
  const delta = t.price - prev.price;

  document.getElementById('price-val').textContent = fmtPrice(t.price);
  const dd = document.getElementById('price-delta');
  dd.textContent = (delta>=0?'+':'')+delta.toFixed(2);
  dd.className = 'price-delta '+(delta>=0?'up':'down');
  document.getElementById('price-ts').textContent = 'Frame time: '+fmtTs(t.ts);
  document.getElementById('spread-val').textContent = fmtSpread(t.spread);
}

function updateScrubber() {
  const s = document.getElementById('scrubber');
  const pct = ticks.length>1 ? (frame/(ticks.length-1))*100 : 0;
  s.style.setProperty('--pct', pct+'%');
  s.value = frame;
}

function render() {
  drawChart();
  if (!compareMode) drawSpread();
  updatePriceHead();
  updateScrubber();
  renderShock();
  renderInspector();
}

// ── CONTROLS ─────────────────────────────────────────────
function scrubTo(f) {
  frame = Math.max(0, Math.min(ticks.length-1, f));
  if (isLive && frame < ticks.length-5) setLive(false);
  render();
}

function togglePlay() {
  playing = !playing;
  document.getElementById('play-icon').style.display = playing?'none':'block';
  document.getElementById('pause-icon').style.display = playing?'block':'none';
  if (playing) startPlay(); else stopPlay();
}
function startPlay() {
  const ms = Math.round(50/speed);
  playTimer = setInterval(()=> {
    if (frame >= ticks.length-1) { playing=false; stopPlay(); return; }
    frame++;
    render();
  }, ms);
}
function stopPlay() { clearInterval(playTimer); }

function stepBack()    { scrubTo(frame-10); }
function stepForward() { scrubTo(frame+10); }

function setSpeed(s, btn) {
  speed = s;
  document.querySelectorAll('.speed-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  if (playing) { stopPlay(); startPlay(); }
}

function setTf(tf, btn) {
  document.querySelectorAll('.tf-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('pyth-badge').style.display = (tf==='50ms'||tf==='200ms')?'flex':'none';
}

function toggleOverlay(key) {
  overlays[key] = !overlays[key];
  document.getElementById('ov-'+key).classList.toggle('on', overlays[key]);
  drawChart();
}

function toggleLive() {
  isLive = !isLive;
  setLive(isLive);
}
function setLive(val) {
  isLive = val;
  const btn = document.getElementById('btn-live');
  const dot = document.getElementById('live-dot');
  btn.classList.toggle('active', val);
  dot.style.background = val ? 'var(--accent)' : 'var(--muted)';
  if (val) {
    if (playing) { stopPlay(); playing=false; }
    frame = ticks.length-1; render();
  }
}

function toggleCompare() {
  compareMode = !compareMode;
  document.getElementById('btn-compare').classList.toggle('active', compareMode);
  document.getElementById('compare-vs').style.display = compareMode ? 'flex' : 'none';
  document.getElementById('overlay-row').style.display = compareMode ? 'none' : 'flex';
  document.getElementById('compare-legend').style.display = compareMode ? 'flex' : 'none';
  document.getElementById('spread-wrap').style.display = compareMode ? 'none' : '';
  document.getElementById('legend-sym1').textContent = asset;
  document.getElementById('legend-sym2').textContent = compareAsset;
  render();
}

function changeCompareAsset(sym) {
  compareAsset = sym;
  compareTicks = genTicks(ASSET_PRICES[sym] || 100);
  computeMarkers();
  renderScrubberMarkers();
  document.getElementById('legend-sym2').textContent = sym;
  render();
}

function toggleShortcuts() {
  showShortcutsModal = !showShortcutsModal;
  document.getElementById('shortcuts-modal').style.display = showShortcutsModal ? 'flex' : 'none';
}

function changeAsset(sym) {
  asset = sym;
  const base = ASSET_PRICES[sym] || 100;
  ticks = genTicks(base);
  frame = 60;
  computeMarkers();
  renderScrubberMarkers();
  render();
}

function setInsTab(tab) {
  insTab = tab;
  document.getElementById('tab-inspector').classList.toggle('active', tab==='inspector');
  document.getElementById('tab-autopsy').classList.toggle('active', tab==='autopsy');
  renderInspector();
}

// ── KEYBOARD ─────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return;
  if (e.code==='Space') { e.preventDefault(); togglePlay(); }
  if (e.code==='ArrowLeft') { e.preventDefault(); scrubTo(frame-(e.shiftKey?100:10)); }
  if (e.code==='ArrowRight'){ e.preventDefault(); scrubTo(frame+(e.shiftKey?100:10)); }
  if (e.code==='Home')   scrubTo(0);
  if (e.code==='End')    scrubTo(ticks.length-1);
  if (e.code==='Escape' && showShortcutsModal) toggleShortcuts();
  const spk = {'1':0.25,'2':0.5,'3':1,'4':2,'5':4};
  if (spk[e.key]) {
    speed=spk[e.key];
    document.querySelectorAll('.speed-btn').forEach((b,i)=>b.classList.toggle('active',i===Object.keys(spk).indexOf(e.key)));
    if(playing){stopPlay();startPlay();}
  }
});

// ── RESIZE ───────────────────────────────────────────────
const resizeObs = new ResizeObserver(()=>{ drawChart(); drawSpread(); });
resizeObs.observe(document.getElementById('chart-wrap'));
resizeObs.observe(document.getElementById('spread-wrap'));

// show shortcuts btn
document.getElementById('btn-shortcuts').style.display = 'flex';

// ── THEME ────────────────────────────────────────────────
function toggleTheme() {
  const light = document.body.classList.toggle('light');
  document.getElementById('theme-toggle').textContent = light ? '☀️' : '🌙';
  localStorage.setItem('mdvr-theme', light ? 'light' : 'dark');
  computeMarkers();
  renderScrubberMarkers();
  render();
}
if (localStorage.getItem('mdvr-theme') === 'light') {
  document.body.classList.add('light');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// ── INIT ─────────────────────────────────────────────────
renderScrubberMarkers();
render();

  */
}
    </>
  );
}
