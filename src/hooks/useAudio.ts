import { useCallback, useRef, useState, useEffect } from 'react';

type AudioStatus = 'idle' | 'playing' | 'paused' | 'ended';

interface UseAudioProps {
  src?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export const useAudio = ({ src, autoPlay = false, onEnded }: UseAudioProps = {}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const autoPlayAttempted = useRef<boolean>(false);

  // Create handlers that we can reference later for removal
  const handlePlay = () => {
    console.log("🎵 Audio playback started");
    setStatus('playing');
  };
  
  const handlePause = () => {
    console.log("🎵 Audio playback paused");
    setStatus('paused');
  };
  
  const handleEnded = () => {
    console.log("🎵 Audio playback ended");
    setStatus('ended');
    if (onEnded) onEnded();
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log("🎵 Audio metadata loaded, duration:", audioRef.current.duration);
      setDuration(audioRef.current.duration);
      
      // Try to play automatically if autoPlay is true and hasn't been attempted yet for this src
      if (autoPlay && !autoPlayAttempted.current && audioRef.current.paused) {
        autoPlayAttempted.current = true;
        console.log("🎵 Auto-playing audio after metadata loaded");
        
        // Use a small timeout to ensure metadata is fully processed
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.error("🎵 Auto-play failed:", error);
            });
          }
        }, 100);
      }
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      console.log("🎵 Created new Audio element");
    }
    
    // Set up event listeners
    const audio = audioRef.current;
    
    // Remove any existing event listeners first
    const cleanup = () => {
      if (audio) {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('canplay', () => console.log("🎵 Audio can play now"));
        audio.removeEventListener('error', (e) => console.error("🎵 Audio error:", e));
      }
    };
    
    cleanup(); // Clean up any existing listeners
    
    // Add new event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('canplay', () => console.log("🎵 Audio can play now"));
    audio.addEventListener('error', (e) => console.error("🎵 Audio error:", e));
    
    // Clean up on unmount
    return cleanup;
  }, [onEnded]);

  // Update source if it changes
  useEffect(() => {
    if (audioRef.current && src) {
      // Reset autoplay attempt flag when src changes
      autoPlayAttempted.current = false;
      
      console.log(`🎵 Setting audio source to: ${src}`);
      
      // Only set new src if it's different
      const fullSrc = new URL(src, window.location.href).href;
      if (audioRef.current.src !== fullSrc) {
        // Make sure we stop any current playback before changing source
        if (!audioRef.current.paused) {
          try {
            audioRef.current.pause();
          } catch (error) {
            console.error("🎵 Error pausing before source change:", error);
          }
        }
        
        // Clear any previous src first
        audioRef.current.src = '';
        
        // Set new source and load immediately
        audioRef.current.src = src;
        setStatus('idle');
        
        // Load the audio and attempt autoplay if enabled
        try {
          audioRef.current.load();
          console.log("🎵 Audio loading started");
          
          if (autoPlay) {
            console.log("🎵 Attempting immediate auto-play...");
            audioRef.current.play().catch(error => {
              console.error("🎵 Initial auto-play failed:", error);
              // We'll try again when metadata is loaded
            });
          }
        } catch (error) {
          console.error("🎵 Error loading audio:", error);
        }
      }
    }
  }, [src, autoPlay]);

  // Stop playing audio when autoPlay changes to false
  useEffect(() => {
    if (audioRef.current && !autoPlay && !audioRef.current.paused) {
      console.log("🎵 Auto-play was disabled, stopping audio");
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setStatus('idle');
    }
  }, [autoPlay]);

  const play = useCallback(() => {
    if (audioRef.current) {
      console.log("🎵 Manual play requested");
      // Add a small guard to make sure we don't try to play if already playing
      if (audioRef.current.paused) {
        audioRef.current.play().catch(error => {
          console.error("🎵 Audio play failed:", error);
        });
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      console.log("🎵 Manual pause requested");
      audioRef.current.pause();
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      console.log("🎵 Manual stop requested");
      const wasPlaying = !audioRef.current.paused;
      
      if (wasPlaying) {
        audioRef.current.pause();
      }
      
      audioRef.current.currentTime = 0;
      setStatus('idle');
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return {
    audioRef,
    status,
    duration,
    currentTime,
    play,
    pause,
    stop,
    seek
  };
}; 