import { motion } from 'framer-motion';

export default function DVRDevice() {
  return (
    <div className="relative w-[340px] h-[220px] mx-auto">
      {/* Glow underneath */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[400px] h-[120px] gradient-orb blur-2xl opacity-60" />
      
      {/* Device body */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full h-full"
      >
        {/* Main chassis */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #1a1a1a 0%, #0f0f0f 50%, #1a1a1a 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          {/* Top edge highlight */}
          <div className="absolute top-0 left-4 right-4 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
          
          {/* Screen area */}
          <div className="absolute top-5 left-5 right-[140px] bottom-5 rounded-xl overflow-hidden" style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* Mini chart on screen */}
            <svg viewBox="0 0 180 120" className="w-full h-full p-3">
              {/* Grid lines */}
              {[0,1,2,3].map(i => (
                <line key={i} x1="0" y1={30*i+15} x2="180" y2={30*i+15} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              ))}
              {/* Price line */}
              <polyline
                fill="none"
                stroke="#f5f5f7"
                strokeWidth="1.5"
                points="5,80 20,75 35,78 50,60 65,55 75,70 80,85 90,90 100,65 110,50 125,45 135,48 150,42 165,38 175,40"
              />
              {/* Confidence band */}
              <polygon
                fill="rgba(230,0,122,0.08)"
                points="5,76 20,71 35,74 50,55 65,50 75,65 80,80 90,85 100,60 110,45 125,40 135,43 150,37 165,33 175,35 175,45 165,43 150,47 135,53 125,50 110,55 100,70 90,95 80,90 75,75 65,60 50,65 35,82 20,79 5,84"
              />
              {/* Price label */}
              <text x="140" y="32" fill="#f5f5f7" fontSize="8" fontFamily="Inter">$83,421</text>
              <text x="5" y="12" fill="#86868b" fontSize="6" fontFamily="Inter">BTC/USD</text>
            </svg>
          </div>

          {/* Right control panel */}
          <div className="absolute top-5 right-5 bottom-5 w-[110px] flex flex-col items-center justify-between py-3">
            {/* REC button */}
            <motion.div
              animate={{ boxShadow: ['0 0 10px rgba(230,0,122,0.4)', '0 0 25px rgba(230,0,122,0.7)', '0 0 10px rgba(230,0,122,0.4)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle, #e6007a 30%, #b3005f 100%)', border: '2px solid rgba(255,255,255,0.15)' }}
            >
              <span className="text-[8px] font-bold tracking-wider" style={{ color: '#fff' }}>REC</span>
            </motion.div>
            
            {/* Status indicators */}
            <div className="flex flex-col gap-2 items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-positive" />
                <span className="text-[8px] text-muted-foreground">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#e6007a' }} />
                <span className="text-[8px] text-muted-foreground">6 FEEDS</span>
              </div>
            </div>

            {/* Volume knob */}
            <div className="w-8 h-8 rounded-full" style={{
              background: 'conic-gradient(from 180deg, #333 0%, #1a1a1a 50%, #333 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
              <div className="w-0.5 h-3 bg-muted-foreground rounded-full mx-auto mt-1" />
            </div>
          </div>

          {/* Bottom ventilation lines */}
          <div className="absolute bottom-2 left-8 flex gap-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
