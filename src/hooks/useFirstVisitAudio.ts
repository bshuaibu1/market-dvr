import { useEffect, useRef, useState } from 'react';

export function useFirstVisitAudio(audioSrc: string, pageKey: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const storageKey = `market-dvr-audio-visited-${pageKey}`;

  useEffect(() => {
    const hasVisited = localStorage.getItem(storageKey);
    if (hasVisited) return;

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setProgress(100);
      localStorage.setItem(storageKey, 'true');
      setTimeout(() => setIsVisible(false), 2000);
    });

    // Small delay so the page loads first
    const timer = setTimeout(() => {
      setIsVisible(true);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked — show UI so user can manually play
        setIsPlaying(false);
      });
    }, 800);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.src = '';
    };
  }, [audioSrc, pageKey, storageKey]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const dismiss = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  return { isVisible, isPlaying, progress, duration, toggle, dismiss };
}
