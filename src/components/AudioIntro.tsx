import { useFirstVisitAudio } from '@/hooks/useFirstVisitAudio';

interface AudioIntroProps {
  audioSrc: string;
  pageKey: string;
  label?: string;
}

export default function AudioIntro({ audioSrc, pageKey, label = 'Page intro' }: AudioIntroProps) {
  const { isVisible, isPlaying, progress, toggle, dismiss } = useFirstVisitAudio(audioSrc, pageKey);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '14px',
        background: 'rgba(15, 15, 15, 0.92)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'audioSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        minWidth: '220px',
        maxWidth: '280px',
      }}
    >
      <style>{`
        @keyframes audioSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes audioPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .audio-play-btn:hover { background: rgba(230,0,122,0.2) !important; }
        .audio-dismiss-btn:hover { color: rgba(255,255,255,0.8) !important; }
      `}</style>

      {/* Play/Pause button */}
      <button
        className="audio-play-btn"
        onClick={toggle}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1px solid rgba(230,0,122,0.4)',
          background: 'rgba(230,0,122,0.1)',
          color: '#e6007a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
          animation: isPlaying ? 'audioPulse 1.4s ease-in-out infinite' : 'none',
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="1" width="3" height="10" rx="1" />
            <rect x="7" y="1" width="3" height="10" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3 1.5l7 4.5-7 4.5V1.5z" />
          </svg>
        )}
      </button>

      {/* Text + progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '0.01em',
          marginBottom: '5px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </div>
        {/* Progress bar */}
        <div style={{
          width: '100%',
          height: '2px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '99px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: '#e6007a',
            borderRadius: '99px',
            transition: 'width 0.3s linear',
          }} />
        </div>
      </div>

      {/* Dismiss button */}
      <button
        className="audio-dismiss-btn"
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.3)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'color 0.2s',
        }}
        aria-label="Dismiss"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
