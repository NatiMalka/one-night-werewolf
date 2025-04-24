import { useState, useEffect, useCallback, useRef } from 'react';
import { NightAction } from '../types';
import { useAudio } from './useAudio';
import { useGame } from '../contexts/GameContext';

interface UseNightNarratorProps {
  currentNightAction?: NightAction;
  onNarrationEnd?: () => void;
}

export const useNightNarrator = ({ 
  currentNightAction, 
  onNarrationEnd
}: UseNightNarratorProps) => {
  const [audioSrc, setAudioSrc] = useState<string>('');
  const [audioAvailable, setAudioAvailable] = useState<boolean>(false);
  const prevActionRef = useRef<NightAction | undefined>(undefined);
  const attemptedPlayRef = useRef<boolean>(false);
  const { enableVoiceNarration } = useGame();
  
  const { 
    audioRef,
    play, 
    stop,
    status
  } = useAudio({ 
    src: audioSrc, 
    autoPlay: !!audioSrc && audioAvailable && enableVoiceNarration,
    onEnded: onNarrationEnd
  });
  
  // Reset the attempted play ref when the action changes
  useEffect(() => {
    if (currentNightAction !== prevActionRef.current) {
      attemptedPlayRef.current = false;
      prevActionRef.current = currentNightAction;
    }
  }, [currentNightAction]);

  // Force play for all night actions after a delay
  useEffect(() => {
    if (currentNightAction && 
        !attemptedPlayRef.current && 
        audioAvailable && 
        enableVoiceNarration) {  // Only auto-play if voice narration is enabled
      
      console.log(`🎵 ${currentNightAction} phase detected, preparing auto-play`);
      attemptedPlayRef.current = true;
      
      // Wait for a brief moment before attempting to play
      const timer = setTimeout(() => {
        console.log(`🎵 Attempting ${currentNightAction} auto-play now...`);
        play();
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [currentNightAction, audioAvailable, play, enableVoiceNarration]);

  // Get the audio file path for a night action
  const getAudioForAction = useCallback((action: NightAction): string => {
    // Convert the action name to title case for the file name
    // e.g., 'werewolves' -> 'Werewolves.wav'
    const fileName = action.charAt(0).toUpperCase() + action.slice(1) + '.wav';
    const audioPath = `/voice/${fileName}`;
    return audioPath;
  }, []);

  // Update audio source when night action changes
  useEffect(() => {
    if (currentNightAction && enableVoiceNarration) { // Only set audio source if voice narration is enabled
      try {
        const audioPath = getAudioForAction(currentNightAction);
        console.log(`Setting audio source for ${currentNightAction} to ${audioPath}`);
        setAudioSrc(audioPath);
        setAudioAvailable(true); // Assume audio is available and let the Audio element handle errors
      } catch (error) {
        console.error("Error setting audio source:", error);
        setAudioSrc('');
        setAudioAvailable(false);
      }
    } else {
      setAudioSrc('');
      setAudioAvailable(false);
    }
  }, [currentNightAction, getAudioForAction, enableVoiceNarration]);

  // Method to play narration manually
  const playNarration = useCallback(() => {
    if (audioSrc && audioAvailable && enableVoiceNarration) { // Only play if voice narration is enabled
      console.log(`Manually playing narration: ${audioSrc}`);
      play();
    } else if (audioSrc && !enableVoiceNarration) {
      console.log('Voice narration is disabled, not playing audio');
    } else if (audioSrc) {
      console.warn(`Cannot play audio ${audioSrc} - file not available`);
    }
  }, [audioSrc, audioAvailable, play, enableVoiceNarration]);

  // Method to stop narration
  const stopNarration = useCallback(() => {
    console.log("Stopping narration");
    stop();
  }, [stop]);

  return {
    isPlaying: status === 'playing',
    playNarration,
    stopNarration,
    currentAudioSrc: audioSrc,
    narrationStatus: status,
    audioAvailable: audioAvailable && enableVoiceNarration, // Only consider audio available if voice narration is enabled
    audioElement: audioRef.current
  };
}; 