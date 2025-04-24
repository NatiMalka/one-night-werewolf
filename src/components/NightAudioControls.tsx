import React, { useEffect, useState } from 'react';
import { useNightNarrator } from '../hooks/useNightNarrator';
import { NightAction } from '../types';
import { useGame } from '../contexts/GameContext';
import { Volume2, Volume1, VolumeX, Play, Pause } from 'lucide-react';

interface NightAudioControlsProps {
  currentNightAction?: NightAction;
  onNarrationEnd?: () => void;
}

export const NightAudioControls: React.FC<NightAudioControlsProps> = ({ 
  currentNightAction,
  onNarrationEnd
}) => {
  const [showDebug, setShowDebug] = useState(false);
  const { enableVoiceNarration } = useGame();
  
  const { 
    isPlaying, 
    playNarration, 
    stopNarration, 
    currentAudioSrc,
    narrationStatus,
    audioAvailable,
    audioElement
  } = useNightNarrator({ 
    currentNightAction, 
    onNarrationEnd
  });

  // Only log when important state changes
  useEffect(() => {
    console.log('🎵 Audio Controls State:', {
      currentNightAction,
      isPlaying,
      audioAvailable,
      narrationStatus
    });
  }, [currentNightAction, isPlaying, audioAvailable, narrationStatus]);

  // Don't show controls if voice narration is disabled
  if (!enableVoiceNarration) return null;

  // Extract the role name from the action for display
  const roleName = currentNightAction 
    ? currentNightAction.charAt(0).toUpperCase() + currentNightAction.slice(1) 
    : '';

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end space-y-2 z-50">
      {/* Modern Audio Player */}
      <div className="bg-gradient-to-r from-indigo-900/90 to-purple-900/90 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-indigo-800/30 p-0.5">
        <div className="bg-gray-900/60 rounded-lg overflow-hidden">
          <div className="flex items-center p-3">
            {/* Role icon and name */}
            <div className="flex items-center mr-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-inner">
                {isPlaying ? (
                  <Volume2 size={18} className="text-white animate-pulse" />
                ) : audioAvailable ? (
                  <Volume1 size={18} className="text-white" />
                ) : (
                  <VolumeX size={18} className="text-gray-300" />
                )}
              </div>
              
              <div className="ml-2">
                <div className="text-gray-300 font-medium leading-tight">
                  {roleName || 'No audio'}
                </div>
                <div className="text-xs text-indigo-400 leading-tight">
                  {isPlaying 
                    ? 'Playing...' 
                    : audioAvailable 
                      ? 'Ready' 
                      : 'Unavailable'}
                </div>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={playNarration}
                disabled={!audioAvailable || isPlaying}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${!audioAvailable || isPlaying
                    ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-md'
                  }`}
              >
                <Play size={16} />
              </button>
              
              <button
                onClick={stopNarration}
                disabled={!isPlaying}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                  ${!isPlaying
                    ? 'bg-gray-800/60 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 shadow-md'
                  }`}
              >
                <Pause size={16} />
              </button>
              
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`w-7 h-7 ml-1 rounded flex items-center justify-center transition-all
                  ${showDebug
                    ? 'bg-blue-800/50 text-blue-300 border border-blue-700/50'
                    : 'bg-gray-800/30 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60'
                  }`}
              >
                <span className="text-xs font-mono">DB</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug Panel (only shown when debug toggle is active) */}
      {showDebug && (
        <div className="bg-gray-900/80 text-xs text-white p-3 rounded-lg shadow-lg max-w-xs border border-gray-700">
          <div className="text-blue-400 font-semibold mb-1">Debug Info</div>
          <div>Phase: {currentNightAction || 'none'}</div>
          <div>Status: {narrationStatus}</div>
          <div>Audio: {audioAvailable ? '✅' : '❌'}</div>
          <div>Source: {currentAudioSrc || 'none'}</div>
          {audioElement && (
            <>
              <div>Ready: {audioElement.readyState}</div>
              <div>Paused: {audioElement.paused ? 'yes' : 'no'}</div>
              {audioElement.error && (
                <div className="text-red-400">Error: {audioElement.error.message}</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}; 