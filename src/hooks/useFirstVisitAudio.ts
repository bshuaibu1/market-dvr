import { useEffect, useRef, useState } from 'react';

export function useFirstVisitAudio(audioSrc: string, pageKey: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const key = `market-dvr-audio-visited-${pageKey}`;
    if (localStorage.getItem(key)) return;
    
    setIsVisible(true);
    
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      localStorage.setItem(key, 'true');
      setTimeout(() => setIsVisible(false), 2000);
    });

    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));

    return () => { audio.pause(); };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else { audio.play(); setIsPlaying(true); }
  };

  const dismiss = () => {
    const key = `market-dvr-audio-visited-${pageKey}`;
    audioRef.current?.pause();
    localStorage.setItem(key, 'true');
    setIsVisible(false);
  };

  return { isVisible, isPlaying, progress, toggle, dismiss };
}
