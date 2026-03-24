import { useFirstVisitAudio } from '@/hooks/useFirstVisitAudio';

interface AudioIntroProps {
  audioSrc: string;
  pageKey: string;
  label?: string;
}

export default function AudioIntro({ audioSrc, pageKey, label = 'Page intro' }: AudioIntroProps) {
  const { isVisible, isPlaying, progress, toggle, dismiss } = useFirstVisitAudio(audioSrc, pageKey);

  return (
    <div style={{
      position: 'fixed', bottom: '60px', left: '24px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 14px', borderRadius: '14px',
      background: 'rgba(15,15,15,0.95)',
      border: `1px solid ${isPlaying ? 'rgba(230,0,122,0.5)' : 'rgba(230,0,122,0.25)'}`,
      backdropFilter: 'blur(16px)',
      boxShadow: isPlaying ? '0 0 20px rgba(230,0,122,0.3)' : '0 0 12px rgba(230,0,122,0.15)',
      minWidth: '220px', maxWidth: '280px',
      opacity: isVisible ? 1 : 0,
      pointerEvents: isVisible ? 'auto' : 'none',
      transition: 'all 0.4s ease',
      animation: isVisible && !isPlaying ? 'audioPulseGlow 2s ease-in-out infinite' : 'none',
    }}>
      <style>{`
        @keyframes audioPulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(230,0,122,0.15); }
          50% { box-shadow: 0 0 24px rgba(230,0,122,0.4); }
        }
        @keyframes audioSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <button onClick={toggle} style={{
        width: '36px', height: '36px', borderRadius: '50%',
        border: '1px solid rgba(230,0,122,0.6)',
        background: isPlaying ? 'rgba(230,0,122,0.2)' : 'rgba(230,0,122,0.15)',
        color: '#e6007a', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        transition: 'all 0.2s',
      }}>
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="1"/><rect x="7" y="1" width="3" height="10" rx="1"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.5l7 4.5-7 4.5V1.5z"/></svg>
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }} onClick={toggle} role="button" style={{ flex:1, minWidth:0, cursor: isPlaying ? 'default' : 'pointer' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.95)', marginBottom: '3px' }}>
          {isPlaying ? label : '🎧 Tap to hear intro'}
        </div>
        <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#e6007a', borderRadius: '99px', transition: 'width 0.3s linear' }}/>
        </div>
      </div>

      <button onClick={dismiss} style={{
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
        cursor: 'pointer', padding: '2px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>
      </button>
    </div>
  );
}
