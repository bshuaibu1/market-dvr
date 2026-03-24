import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import AudioIntro from '@/components/AudioIntro';
import '@/styles/index-page.css';

const WC_WORDS = ['millisecond.', 'crash.', 'pump.', 'spike.', 'tick.', 'moment.'];

const Index = () => {
  const { theme, toggleTheme } = useTheme();

  // ── Nav tab state ──────────────────────────────────────────────────────────
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const expTabsRef = useRef<HTMLDivElement>(null);

  // ── Event filter state ─────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // ── Word cycler ────────────────────────────────────────────────────────────
  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const currentRef = useRef<number>(0);
  // wcClasses holds the CSS class ('wc-below' | 'wc-active' | 'wc-exit') per word
  const [wcClasses, setWcClasses] = useState<string[]>(
    WC_WORDS.map((_, i) => (i === 0 ? 'wc-active' : 'wc-below'))
  );

  // ── Tab click-outside dismiss ──────────────────────────────────────────────
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (expTabsRef.current && !expTabsRef.current.contains(e.target as Node)) {
        setActiveTabIndex(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ── Word cycler interval ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const prev = currentRef.current;
      const next = (prev + 1) % WC_WORDS.length;
      currentRef.current = next;

      setWcClasses(cls => {
        const updated = [...cls];
        updated[prev] = 'wc-exit';
        updated[next] = 'wc-active';
        return updated;
      });

      // After the exit transition completes, reset to wc-below for reuse
      const span = spanRefs.current[prev];
      if (span) {
        const onEnd = () => {
          setWcClasses(cls => {
            const updated = [...cls];
            // Only reset if still wc-exit (not reactivated in the meantime)
            if (updated[prev] === 'wc-exit') updated[prev] = 'wc-below';
            return updated;
          });
          span.removeEventListener('transitionend', onEnd);
        };
        span.addEventListener('transitionend', onEnd);
      }
    }, 1600);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const selectTab = (index: number) => {
    setActiveTabIndex(prev => (prev === index ? null : index));
  };

  const filterEvents = (type: string) => {
    setActiveFilter(type);
  };

  const isHidden = (cardType: string) =>
    activeFilter !== 'all' && activeFilter !== cardType;

  return (
    <>
      <AudioIntro audioSrc="/audio/homepageaudio.mp3" pageKey="home" label="Welcome to Market DVR" />
      {/* ── NAV ──────────────────────────────────────── */}
      <nav>
        <div className="nav-logo">
          <div className="nav-dot"></div>
          <span className="nav-name">Market DVR</span>
        </div>
        <div className="nav-links">
          {/* Expandable tab nav */}
          <div className="exp-tabs" ref={expTabsRef}>
            <button
              className={`exp-tab${activeTabIndex === 0 ? ' active' : ''}`}
              data-index="0"
              onClick={() => selectTab(0)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9"/>
              </svg>
              <span className="exp-label">Home</span>
            </button>
            <button
              className={`exp-tab${activeTabIndex === 1 ? ' active' : ''}`}
              data-index="1"
              onClick={() => selectTab(1)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span className="exp-label">Live</span>
            </button>
            <button
              className={`exp-tab${activeTabIndex === 2 ? ' active' : ''}`}
              data-index="2"
              onClick={() => selectTab(2)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8"/>
              </svg>
              <span className="exp-label">Replay</span>
            </button>
            <div className="exp-sep"></div>
            <button
              className={`exp-tab${activeTabIndex === 3 ? ' active' : ''}`}
              data-index="3"
              onClick={() => selectTab(3)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              <span className="exp-label">Events</span>
            </button>
            <button
              className={`exp-tab${activeTabIndex === 4 ? ' active' : ''}`}
              data-index="4"
              onClick={() => selectTab(4)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
              <span className="exp-label">Heatmap</span>
            </button>
          </div>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'var(--dvr-btn-bg)', color: 'var(--fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s, color 0.2s', fontSize: 15,
            }}
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>
          <Link to="/live" className="nav-cta">
            <span className="nav-cta-dot"></span>
            Watch Live
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-video-bg">
          <video autoPlay muted loop playsInline src="/marketdvr.mp4"></video>
        </div>
        <div className="hero-left">
          <div className="badge">
            <div className="badge-dot"></div>
            <span className="badge-text">Now recording mainnet</span>
          </div>

          <h1>
            Record every<br />
            <span className="word-cycler" id="word-cycler">
              <span className="wc-sizer">millisecond.</span>
              {WC_WORDS.map((word, i) => (
                <span
                  key={word}
                  className={`wc-word ${wcClasses[i]}`}
                  ref={el => { spanRefs.current[i] = el; }}
                >
                  {word}
                </span>
              ))}
            </span>
          </h1>

          <p className="hero-body">
            Flash crashes, spread spikes, liquidation cascades — they happen in milliseconds. By the time a candle forms, the event is already hidden. Market DVR captures every frame.
          </p>

          <div className="ctas">
            <Link to="/live" className="cta-primary">
              <span className="cta-primary-dot"></span>
              Watch Live Markets
            </Link>
            <Link to="/replay" className="cta-secondary">Replay an Event</Link>
          </div>

          <div className="hero-stats">
            <div>
              <div className="stat-label">Resolution</div>
              <div className="stat-value">&lt; 50ms</div>
            </div>
            <div>
              <div className="stat-label">Assets tracked</div>
              <div className="stat-value">47</div>
            </div>
            <div>
              <div className="stat-label">Events recorded</div>
              <div className="stat-value">2.3M+</div>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="dvr-panel">
            {/* Header */}
            <div className="dvr-header">
              <div className="dvr-live">
                <div className="dvr-live-dot"></div>
                <span className="dvr-live-text">LIVE · BTC/USD</span>
              </div>
              <span className="dvr-ts">14:23:07.482</span>
            </div>

            {/* Price */}
            <div className="dvr-price-block">
              <div className="dvr-price">$67,284.51</div>
              <div className="dvr-sub">+2.31% · Spread $1.54 · Conf 99.2%</div>
            </div>

            {/* Chart */}
            <div className="dvr-chart">
              <svg viewBox="0 0 360 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(230,0,122,0.28)"/>
                    <stop offset="100%" stopColor="rgba(230,0,122,0)"/>
                  </linearGradient>
                </defs>
                {/* event zone */}
                <rect x="168" y="0" width="62" height="80" fill="rgba(230,0,122,0.05)"/>
                {/* area */}
                <path d="M0 48 Q18 40 36 45 Q54 50 72 43 Q90 36 108 40 Q126 44 144 37 Q162 30 180 22 Q198 14 216 28 Q234 42 252 38 Q270 34 288 44 Q306 50 324 46 Q342 42 360 46 L360 80 L0 80 Z" fill="url(#g)"/>
                {/* line */}
                <path className="wave-line" d="M0 48 Q18 40 36 45 Q54 50 72 43 Q90 36 108 40 Q126 44 144 37 Q162 30 180 22 Q198 14 216 28 Q234 42 252 38 Q270 34 288 44 Q306 50 324 46 Q342 42 360 46"
                  fill="none" stroke="rgba(230,0,122,0.78)" strokeWidth="1.5"/>
                {/* playhead */}
                <line x1="265" y1="0" x2="265" y2="80" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeDasharray="3 3"/>
              </svg>
            </div>

            {/* Controls */}
            <div className="dvr-controls">
              <div className="scrubber-track">
                <div className="scrubber-fill"></div>
                <div className="scrubber-thumb"></div>
              </div>
              <div className="dvr-btns">
                <button className="dvr-btn">
                  <svg viewBox="0 0 12 12"><path d="M2 2h1.5v8H2zm1.5 4L10 8.5V3.5z"/></svg>
                </button>
                <button className="dvr-btn dvr-play">
                  <svg viewBox="0 0 12 12"><path d="M3 2.5l7 3.5-7 3.5z"/></svg>
                </button>
                <div className="dvr-rec">
                  <div className="dvr-rec-dot"></div>
                  <span className="dvr-rec-text">REC</span>
                </div>
                <button className="dvr-btn">
                  <svg viewBox="0 0 12 12"><path d="M8.5 2h1.5v8H8.5zm-1.5 4L2 3.5v5z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────── */}
      <div className="marquee-strip">
        <div className="marquee-inner">
          {/* set 1 */}
          <div className="ticker-item"><span className="ticker-sym">BTC/USD</span><span className="ticker-price">$67,284.51</span><span className="ticker-chg up">+2.31%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">ETH/USD</span><span className="ticker-price">$3,841.72</span><span className="ticker-chg dn">-0.87%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">SOL/USD</span><span className="ticker-price">$189.43</span><span className="ticker-chg up">+5.14%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">BNB/USD</span><span className="ticker-price">$524.18</span><span className="ticker-chg up">+0.93%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">AVAX/USD</span><span className="ticker-price">$38.92</span><span className="ticker-chg dn">-1.24%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">LINK/USD</span><span className="ticker-price">$14.87</span><span className="ticker-chg up">+3.47%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">ARB/USD</span><span className="ticker-price">$1.23</span><span className="ticker-chg up">+7.81%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">OP/USD</span><span className="ticker-price">$2.94</span><span className="ticker-chg dn">-0.44%</span><span className="ticker-sep">·</span></div>
          {/* set 2 (duplicate for seamless loop) */}
          <div className="ticker-item"><span className="ticker-sym">BTC/USD</span><span className="ticker-price">$67,284.51</span><span className="ticker-chg up">+2.31%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">ETH/USD</span><span className="ticker-price">$3,841.72</span><span className="ticker-chg dn">-0.87%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">SOL/USD</span><span className="ticker-price">$189.43</span><span className="ticker-chg up">+5.14%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">BNB/USD</span><span className="ticker-price">$524.18</span><span className="ticker-chg up">+0.93%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">AVAX/USD</span><span className="ticker-price">$38.92</span><span className="ticker-chg dn">-1.24%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">LINK/USD</span><span className="ticker-price">$14.87</span><span className="ticker-chg up">+3.47%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">ARB/USD</span><span className="ticker-price">$1.23</span><span className="ticker-chg up">+7.81%</span><span className="ticker-sep">·</span></div>
          <div className="ticker-item"><span className="ticker-sym">OP/USD</span><span className="ticker-price">$2.94</span><span className="ticker-chg dn">-0.44%</span><span className="ticker-sep">·</span></div>
        </div>
      </div>

      {/* ── FEATURES BENTO ────────────────────────────── */}
      <section className="features">
        <div className="section-label">Capabilities</div>
        <h2 className="section-h2">Built for what happens between candles.</h2>

        <div className="bento">
          {/* Large card: 2-col span */}
          <div className="card card-lg">
            <div className="card-tag">50ms resolution</div>
            <h3>Sub-millisecond precision</h3>
            <p>Record price, bid, ask, spread and confidence interval at sub-50ms frequency from Pyth Pro Lazer feeds. No candle chart can show you this.</p>
            <div className="wave-deco">
              <svg viewBox="0 0 400 48" preserveAspectRatio="none">
                <path className="wave-line" d="M0 24 Q20 10 40 18 Q60 26 80 16 Q100 6 120 12 Q140 18 160 8 Q180 -2 200 12 Q220 26 240 18 Q260 10 280 20 Q300 30 320 18 Q340 6 360 14 Q380 22 400 18"
                  fill="none" stroke="rgba(230,0,122,0.9)" strokeWidth="1.5"/>
              </svg>
            </div>
          </div>

          {/* Tall card: 2-row span */}
          <div className="card card-tall">
            <div className="card-tag-dim">Frame inspector</div>
            <h3>Pause at any moment</h3>
            <p>Inspect every data point in that exact frame — price, spread, confidence, bid/ask depth.</p>
            <div className="inspector-mock">
              <div className="inspector-row"><span className="inspector-lbl">Price</span><span className="inspector-val">$67,284.51</span></div>
              <div className="inspector-row"><span className="inspector-lbl">Bid</span><span className="inspector-val">$67,283.74</span></div>
              <div className="inspector-row"><span className="inspector-lbl">Ask</span><span className="inspector-val">$67,285.28</span></div>
              <div className="inspector-row"><span className="inspector-lbl">Spread</span><span className="inspector-val">$1.54</span></div>
              <div className="inspector-row"><span className="inspector-lbl">Confidence</span><span className="inspector-val">99.2%</span></div>
              <div className="inspector-row"><span className="inspector-lbl">Timestamp</span><span className="inspector-val">14:23:07.482</span></div>
            </div>
          </div>

          {/* Small card 1 */}
          <div className="card card-sm">
            <div className="card-tag-dim">Shareable links</div>
            <h3>Share the moment</h3>
            <p>Generate a link to any market event. Anyone can replay the exact millisecond — no account needed.</p>
          </div>

          {/* Small card 2 */}
          <div className="card card-sm">
            <div className="card-tag-dim">Live capture</div>
            <h3>Record as it happens</h3>
            <p>Stream directly from Pyth Pro. Every tick stored with full microstructure data in real time.</p>
          </div>
        </div>
      </section>

      {/* ── RECENT EVENTS (hidden section, kept for parity) */}
      <section className="events-section" id="events" style={{ display: 'none' }}>
        <div className="max-container">
          <div className="events-header">
            <div>
              <div className="section-label">Live feed</div>
              <h2 className="section-h2" style={{ marginBottom: 0 }}>Recent market events</h2>
            </div>
            <div className="events-filters">
              <button className={`ef-btn${activeFilter === 'all' ? ' ef-active' : ''}`} data-filter="all" onClick={() => filterEvents('all')}>
                <span className="ef-icon">⬡</span> All
              </button>
              <button className={`ef-btn${activeFilter === 'crash' ? ' ef-active' : ''}`} data-filter="crash" onClick={() => filterEvents('crash')}>
                <span className="ef-icon ef-crash">▼</span> Crash
              </button>
              <button className={`ef-btn${activeFilter === 'pump' ? ' ef-active' : ''}`} data-filter="pump" onClick={() => filterEvents('pump')}>
                <span className="ef-icon ef-pump">▲</span> Pump
              </button>
              <div className="ef-sep"></div>
              <button className={`ef-btn${activeFilter === 'spread' ? ' ef-active' : ''}`} data-filter="spread" onClick={() => filterEvents('spread')}>
                <span className="ef-icon ef-spread">↔</span> Spread Spike
              </button>
              <button className={`ef-btn${activeFilter === 'confidence' ? ' ef-active' : ''}`} data-filter="confidence" onClick={() => filterEvents('confidence')}>
                <span className="ef-icon ef-conf">◈</span> Confidence Drop
              </button>
            </div>
          </div>

          <div className="events-grid">
            {/* crash */}
            <div className={`ev-card${isHidden('crash') ? ' hidden' : ''}`} data-type="crash">
              <div className="ev-top">
                <div className="ev-badge ev-badge-crash">▼ CRASH</div>
                <div className="ev-asset">BTC/USD</div>
                <div className="ev-sev ev-sev-high">HIGH</div>
              </div>
              <div className="ev-desc">Price dropped 4.71% during a sharp volatility window at sub-50ms resolution.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 10 Q15 9 30 11 Q45 12 55 8 Q65 4 70 22 Q75 40 85 35 Q100 30 120 32" fill="none" stroke="#ff453a" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">PRICE MOVE</span><span className="ev-mval ev-neg">-4.71%</span></div>
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">847ms</span></div>
                <div className="ev-metric"><span className="ev-mlbl">CONFIDENCE</span><span className="ev-mval">97.3%</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">14:23:07.482</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>

            {/* pump */}
            <div className={`ev-card${isHidden('pump') ? ' hidden' : ''}`} data-type="pump">
              <div className="ev-top">
                <div className="ev-badge ev-badge-pump">▲ PUMP</div>
                <div className="ev-asset">SOL/USD</div>
                <div className="ev-sev ev-sev-med">MED</div>
              </div>
              <div className="ev-desc">Price surged 6.23% during a sharp volatility window.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 32 Q15 31 30 30 Q45 29 55 28 Q65 26 70 14 Q75 4 85 6 Q100 8 120 10" fill="none" stroke="#32d74b" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">PRICE MOVE</span><span className="ev-mval ev-pos">+6.23%</span></div>
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">1.2s</span></div>
                <div className="ev-metric"><span className="ev-mlbl">CLOSE</span><span className="ev-mval">$193.41</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">13:51:44.109</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>

            {/* spread */}
            <div className={`ev-card${isHidden('spread') ? ' hidden' : ''}`} data-type="spread">
              <div className="ev-top">
                <div className="ev-badge ev-badge-spread">↔ SPREAD SPIKE</div>
                <div className="ev-asset">ETH/USD</div>
                <div className="ev-sev ev-sev-high">HIGH</div>
              </div>
              <div className="ev-desc">Bid/ask spread expanded 8.4× beyond normal baseline during liquidity withdrawal.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 20 Q20 20 35 19 Q50 18 60 6 Q70 2 80 4 Q90 8 100 16 Q110 22 120 21" fill="none" stroke="#ffd60a" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">MAX SPREAD</span><span className="ev-mval">$14.82</span></div>
                <div className="ev-metric"><span className="ev-mlbl">MULTIPLIER</span><span className="ev-mval">8.4×</span></div>
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">312ms</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">09:17:22.841</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>

            {/* crash */}
            <div className={`ev-card${isHidden('crash') ? ' hidden' : ''}`} data-type="crash">
              <div className="ev-top">
                <div className="ev-badge ev-badge-crash">▼ CRASH</div>
                <div className="ev-asset">AVAX/USD</div>
                <div className="ev-sev ev-sev-med">MED</div>
              </div>
              <div className="ev-desc">Price dropped 2.84% in a 623ms volatility window with spread widening.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 8 Q20 9 40 10 Q55 11 65 18 Q75 28 85 33 Q100 36 120 34" fill="none" stroke="#ff453a" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">PRICE MOVE</span><span className="ev-mval ev-neg">-2.84%</span></div>
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">623ms</span></div>
                <div className="ev-metric"><span className="ev-mlbl">CLOSE</span><span className="ev-mval">$37.21</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">11:04:58.317</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>

            {/* confidence */}
            <div className={`ev-card${isHidden('confidence') ? ' hidden' : ''}`} data-type="confidence">
              <div className="ev-top">
                <div className="ev-badge ev-badge-conf">◈ CONFIDENCE DROP</div>
                <div className="ev-asset">BNB/USD</div>
                <div className="ev-sev ev-sev-low">LOW</div>
              </div>
              <div className="ev-desc">Confidence interval expanded materially, suggesting unusual feed disagreement.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 20 Q15 18 30 22 Q45 26 55 14 Q65 4 75 10 Q85 18 100 20 Q110 21 120 20" fill="none" stroke="#bf5af2" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">489ms</span></div>
                <div className="ev-metric"><span className="ev-mlbl">PRICE MOVE</span><span className="ev-mval ev-neg">-0.31%</span></div>
                <div className="ev-metric"><span className="ev-mlbl">SIGNAL</span><span className="ev-mval">Feed mismatch</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">16:38:01.774</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>

            {/* pump */}
            <div className={`ev-card${isHidden('pump') ? ' hidden' : ''}`} data-type="pump">
              <div className="ev-top">
                <div className="ev-badge ev-badge-pump">▲ PUMP</div>
                <div className="ev-asset">WIF/USD</div>
                <div className="ev-sev ev-sev-high">HIGH</div>
              </div>
              <div className="ev-desc">Price surged 12.47% during a 934ms window, highest move in 24h session.</div>
              <div className="ev-spark">
                <svg viewBox="0 0 120 40" preserveAspectRatio="none">
                  <path d="M0 36 Q20 35 38 33 Q52 30 60 20 Q68 10 75 3 Q85 5 95 8 Q108 12 120 14" fill="none" stroke="#32d74b" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="ev-metrics">
                <div className="ev-metric"><span className="ev-mlbl">PRICE MOVE</span><span className="ev-mval ev-pos">+12.47%</span></div>
                <div className="ev-metric"><span className="ev-mlbl">DURATION</span><span className="ev-mval">934ms</span></div>
                <div className="ev-metric"><span className="ev-mlbl">CLOSE</span><span className="ev-mval">$3.18</span></div>
              </div>
              <div className="ev-foot">
                <span className="ev-ts">08:42:19.053</span>
                <a href="#" className="ev-replay">Replay →</a>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a href="#" className="cta-secondary" style={{ display: 'inline-flex' }}>Browse all events →</a>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section className="how">
        <div className="how-grid">
          <div className="how-left">
            <div className="section-label">How it works</div>
            <h2>
              Markets move<br />
              in milliseconds.<br />
              <span className="dim">Now you can too.</span>
            </h2>
          </div>
          <div className="steps">
            <div>
              <div className="step-num">01</div>
              <div className="step-title">Connect</div>
              <p className="step-desc">Pyth Pro streams live data at sub-50ms intervals directly from the Lazer network</p>
            </div>
            <div>
              <div className="step-num">02</div>
              <div className="step-title">Record</div>
              <p className="step-desc">Every tick is captured with price, bid, ask, spread, and confidence interval</p>
            </div>
            <div>
              <div className="step-num">03</div>
              <div className="step-title">Replay</div>
              <p className="step-desc">Scrub through any moment like rewinding a DVR. Share the exact frame with anyone</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA CLOSER ────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-grid">
          <h2>
            The crash happened<br />
            <span className="dim">at 14:23:07.482.</span><br />
            What triggered it?
          </h2>
          <div className="cta-stack">
            <Link to="/live" className="cta-btn-primary">Start Recording</Link>
            <Link to="/events" className="cta-btn-secondary">Browse Recorded Events</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer>
        <div className="footer-logo">
          <div className="nav-dot"></div>
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em' }}>Market DVR</span>
        </div>
        <div className="footer-links">
          <Link to="/live">Live</Link>
          <Link to="/replay">Replay</Link>
          <Link to="/heatmap">Heatmap</Link>
        </div>
        <span className="footer-copy">Built on Pyth Pro Lazer</span>
      </footer>
    </>
  );
};

export default Index;
