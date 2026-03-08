import { motion } from 'framer-motion';

export default function DVRDevice() {
  return (
    <div className="relative w-[304px] h-[192px] md:w-[380px] md:h-[240px] mx-auto" style={{ maxWidth: '100%' }}>
      {/* Animated gradient orb behind device */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[500px] h-[400px] md:h-[500px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(230,0,122,0.08) 0%, transparent 70%)' }}
      />

      {/* Soft pink/purple glow underneath */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[260px] md:w-[320px] h-[80px]" style={{
        background: 'radial-gradient(ellipse at center, rgba(230,0,122,0.25) 0%, rgba(120,0,200,0.08) 50%, transparent 80%)',
        filter: 'blur(20px)',
      }} />

      {/* Device body */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full h-full"
        style={{ perspective: '800px' }}
      >
        {/* 3D chassis with depth */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'linear-gradient(160deg, #222 0%, #111 30%, #0a0a0a 60%, #151515 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: `
            0 30px 80px rgba(0,0,0,0.9),
            0 15px 40px rgba(0,0,0,0.7),
            0 2px 8px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.3)
          `,
        }}>
          {/* Top metallic edge reflection */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, transparent 95%)',
          }} />

          {/* Left metallic edge */}
          <div className="absolute top-4 left-0 bottom-4 w-[1px]" style={{
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 70%, transparent)',
          }} />

          {/* Screen area */}
          <div className="absolute top-4 left-4 right-[120px] bottom-4 md:top-6 md:left-6 md:right-[150px] md:bottom-6 rounded-xl overflow-hidden" style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          }}>
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
            }} />
            <svg viewBox="0 0 180 120" className="w-full h-full p-3 relative z-10">
              {[0,1,2,3].map(i => (
                <line key={i} x1="0" y1={30*i+15} x2="180" y2={30*i+15} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              ))}
              <polyline
                fill="none"
                stroke="#f5f5f7"
                strokeWidth="1.5"
                points="5,80 20,75 35,78 50,60 65,55 75,70 80,85 90,90 100,65 110,50 125,45 135,48 150,42 165,38 175,40"
              />
              <polygon
                fill="rgba(230,0,122,0.08)"
                points="5,76 20,71 35,74 50,55 65,50 75,65 80,80 90,85 100,60 110,45 125,40 135,43 150,37 165,33 175,35 175,45 165,43 150,47 135,53 125,50 110,55 100,70 90,95 80,90 75,75 65,60 50,65 35,82 20,79 5,84"
              />
              <text x="140" y="32" fill="#f5f5f7" fontSize="8" fontFamily="Inter">$83,421</text>
              <text x="5" y="12" fill="#86868b" fontSize="6" fontFamily="Inter">BTC/USD</text>
            </svg>
          </div>

          {/* Right control panel */}
          <div className="absolute top-4 right-3 bottom-4 w-[90px] md:top-6 md:right-5 md:bottom-6 md:w-[115px] flex flex-col items-center justify-between py-2 md:py-3">
            <motion.div
              animate={{ boxShadow: ['0 0 12px rgba(230,0,122,0.3)', '0 0 30px rgba(230,0,122,0.7)', '0 0 12px rgba(230,0,122,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #e6007a 20%, #b3005f 100%)',
                border: '2px solid rgba(255,255,255,0.18)',
                boxShadow: '0 0 15px rgba(230,0,122,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              <span className="text-[7px] md:text-[8px] font-bold tracking-wider text-white">REC</span>
            </motion.div>

            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-positive" />
                <span className="text-[7px] md:text-[8px] text-muted-foreground">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e6007a' }} />
                <span className="text-[7px] md:text-[8px] text-muted-foreground">6 FEEDS</span>
              </div>
            </div>

            <div className="w-7 h-7 md:w-9 md:h-9 rounded-full" style={{
              background: 'conic-gradient(from 180deg, #333 0%, #1a1a1a 50%, #333 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 6px rgba(0,0,0,0.4)',
            }}>
              <div className="w-0.5 h-2.5 md:h-3 bg-muted-foreground rounded-full mx-auto mt-1 md:mt-1.5" />
            </div>
          </div>

          {/* Bottom ventilation lines */}
          <div className="absolute bottom-2.5 left-8 flex gap-1.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>

          <div className="absolute -bottom-1 left-2 right-2 h-2 rounded-b-2xl" style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.3), transparent)',
            filter: 'blur(2px)',
          }} />
        </div>
      </motion.div>
    </div>
  );
}
