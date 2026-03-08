import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DVRDevice from '@/components/DVRDevice';
import Footer from '@/components/Footer';
import { Activity, Search, Share2 } from 'lucide-react';

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

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        {/* Background orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[600px] gradient-orb opacity-40 blur-3xl pointer-events-none" />

        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="label-caps mb-4"
        >
          Introducing
        </motion.span>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-16"
        >
          <DVRDevice />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="heading-thin text-center mb-6"
          style={{ fontSize: 'clamp(48px, 6vw, 80px)', fontWeight: 200 }}
        >
          The DVR for Financial Markets
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="text-muted-foreground text-lg md:text-xl text-center max-w-[520px] mb-10 leading-relaxed"
        >
          Record every market crash, pump, and liquidation cascade.
          Replay it frame by frame at 50ms resolution. Share the moment.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center gap-3"
        >
          <Link
            to="/live"
            className="px-6 py-3 rounded-xl text-sm font-medium apple-transition"
            style={{ background: '#e6007a', color: '#fff' }}
          >
            Watch Live Markets
          </Link>
          <Link
            to="/replay"
            className="px-6 py-3 rounded-xl text-sm font-medium text-foreground apple-transition"
            style={{ border: '1px solid rgba(255,255,255,0.2)' }}
          >
            Replay an Event
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-24">
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
      <section className="max-w-4xl mx-auto px-6 py-24">
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
              <div className="text-xs font-medium tabular-nums mb-3" style={{ color: '#e6007a' }}>{step.num}</div>
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
