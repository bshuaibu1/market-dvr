import { useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DVRDevice from '@/components/DVRDevice';
import Footer from '@/components/Footer';
import HeroReplayCard from '@/components/HeroReplayCard';
import FirstVisitCTA from '@/components/FirstVisitCTA';
import { Activity, Search, Share2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useTheme } from '@/components/ThemeProvider';

const features = [
  {
    icon: Activity,
    title: '50ms Resolution',
    description: 'Record price, bid, ask, spread and confidence interval at sub-50ms frequency.',
  },
  {
    icon: Search,
    title: 'Frame Inspector',
    description: 'Pause at any millisecond and inspect every data point in that exact frame.',
  },
  {
    icon: Share2,
    title: 'Share the Moment',
    description: 'Generate a shareable link to any market event that anyone can replay.',
  },
];

const steps = [
  { num: '01', title: 'Connect', desc: 'Pyth Pro streams live data at sub-50ms' },
  { num: '02', title: 'Record', desc: 'Every tick is stored with full microstructure data' },
  { num: '03', title: 'Replay', desc: 'Scrub through any moment like rewinding a video' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }
  }),
};

const particles = Array.from({ length: 40 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 6,
  size: 1.5 + Math.random() * 1,
}));

export default function Index() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const heroRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const px = (e.clientX - cx) / (rect.width / 2);
    const py = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: py * -6, y: px * 6 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      {/* Hero */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex flex-col items-center justify-center px-4 md:px-6 pt-28 md:pt-36 pb-16"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] gradient-orb opacity-40 blur-3xl pointer-events-none" />
        <div
          className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(230,0,122,0.15) 0%, rgba(230,0,122,0.05) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                background: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)',
                willChange: 'transform, opacity',
              }}
              animate={{
                y: [0, -120, -180],
                opacity: [0, 0.15, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="label-caps mb-2 relative z-10"
        >
          Introducing
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-6 relative z-10 w-full flex justify-center"
          style={{
            perspective: 1200,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              transform: `perspective(1200px) rotateX(${8 + tilt.x}deg) rotateY(${-4 + tilt.y}deg)`,
              transition: 'transform 0.1s ease-out',
              willChange: 'transform',
              maxWidth: 320,
            }}
            className="md:!max-w-none"
          >
            <DVRDevice />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="heading-thin text-center mb-4 relative z-10 px-4"
          style={{ fontSize: 'clamp(32px, 8vw, 80px)', fontWeight: 200 }}
        >
          The DVR for Financial Markets
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="text-muted-foreground text-base md:text-lg lg:text-xl text-center max-w-[520px] mb-8 leading-relaxed relative z-10 px-4"
        >
          Record every market crash, pump, and liquidation cascade.
          Replay it frame by frame at 50ms resolution. Share the moment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mb-8 relative z-10 w-full flex justify-center"
          style={{
            transform: 'perspective(800px) rotateX(2deg)',
            willChange: 'transform',
          }}
        >
          <HeroReplayCard />
        </motion.div>

        <FirstVisitCTA />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full sm:w-auto px-4 sm:px-0"
        >
          <Link
            to="/live"
            className="px-6 py-3 rounded-xl text-sm font-medium apple-transition bg-primary text-primary-foreground w-full sm:w-auto text-center min-h-[44px] flex items-center justify-center"
          >
            Watch Live Markets
          </Link>
          <Link
            to="/replay"
            className="px-6 py-3 rounded-xl text-sm font-medium text-foreground apple-transition border border-border w-full sm:w-auto text-center min-h-[44px] flex items-center justify-center"
          >
            Replay an Event
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pt-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              className="surface-1 rounded-2xl p-6 card-hover"
            >
              <f.icon size={24} className="text-muted-foreground mb-4" strokeWidth={1.5} />
              <h3 className="text-foreground text-lg font-light tracking-tight mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 md:px-6 py-24">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="heading-thin text-3xl md:text-4xl text-center mb-16"
        >
          Markets move in milliseconds.<br />Now you can too.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="text-center"
            >
              <div className="text-xs font-medium tabular-nums mb-3 text-primary">{step.num}</div>
              <h3 className="text-foreground text-xl font-light tracking-tight mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
