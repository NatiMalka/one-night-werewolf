import React, { useState, useEffect } from 'react';
import { 
  SoundCategory, 
  loadSoundSettings, 
  setMasterVolume,
  setCategoryVolume,
  toggleCategoryMute,
  toggleMasterMute,
  playButtonClickSound, 
  playToggleOnSound, 
  playToggleOffSound
} from '../utils/soundEffects';

interface SoundSettingsProps {
  className?: string;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ className = '' }) => {
  // Load initial settings
  const [settings, setSettings] = useState(loadSoundSettings());
  
  // Update local state when settings change
  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(loadSoundSettings());
    };
    
    // Listen for settings changes from other components
    window.addEventListener('soundSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('soundSettingsChanged', handleSettingsChange);
    };
  }, []);
  
  // Handle master volume change
  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
    setSettings(prevSettings => ({
      ...prevSettings,
      masterVolume: newVolume
    }));
  };
  
  // Handle category volume change
  const handleCategoryVolumeChange = (category: SoundCategory, volume: number) => {
    setCategoryVolume(category, volume);
    setSettings(prevSettings => ({
      ...prevSettings,
      categoryVolumes: {
        ...prevSettings.categoryVolumes,
        [category]: volume
      }
    }));
  };
  
  // Handle master mute toggle
  const handleMasterMuteToggle = () => {
    if (settings.masterMuted) {
      playToggleOnSound();
    } else {
      playToggleOffSound();
    }
    
    toggleMasterMute();
    setSettings(prevSettings => ({
      ...prevSettings,
      masterMuted: !prevSettings.masterMuted
    }));
  };
  
  // Handle category mute toggle
  const handleCategoryMuteToggle = (category: SoundCategory) => {
    const isMuted = settings.mutedCategories[category];
    
    if (isMuted) {
      playToggleOnSound();
    } else {
      playToggleOffSound();
    }
    
    toggleCategoryMute(category);
    setSettings(prevSettings => ({
      ...prevSettings,
      mutedCategories: {
        ...prevSettings.mutedCategories,
        [category]: !prevSettings.mutedCategories[category]
      }
    }));
  };
  
  return (
    <div className={`bg-gray-900/70 backdrop-blur-sm rounded-lg p-5 ${className}`}>
      <h3 className="text-white text-lg font-semibold mb-4">Sound Settings</h3>
      
      {/* Master Volume */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="master-volume" className="text-white flex items-center">
            <button
              onClick={handleMasterMuteToggle}
              className="mr-2 text-gray-300 hover:text-white focus:outline-none"
            >
              {settings.masterMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            Master Volume
          </label>
          <span className="text-white">{Math.round(settings.masterVolume * 100)}%</span>
        </div>
        <input
          id="master-volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={settings.masterVolume}
          onChange={handleMasterVolumeChange}
          className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
        />
      </div>
      
      {/* Category Volumes */}
      <div className="space-y-4">
        {/* UI Sounds */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="ui-volume" className="text-white flex items-center">
              <button
                onClick={() => handleCategoryMuteToggle(SoundCategory.UI)}
                className="mr-2 text-gray-300 hover:text-white focus:outline-none"
              >
                {settings.mutedCategories[SoundCategory.UI] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V5a1 1 0 011-1v-.5z" />
                    <path d="M3.8 6.5h-.3a2 2 0 00-2 2v1a2 2 0 002 2h.3a2 2 0 002-2v-1a2 2 0 00-2-2zm12.7 0h-.3a2 2 0 00-2 2v1a2 2 0 002 2h.3a2 2 0 002-2v-1a2 2 0 00-2-2z" />
                  </svg>
                )}
              </button>
              UI Sounds
            </label>
            <span className="text-white">{Math.round(settings.categoryVolumes[SoundCategory.UI] * 100)}%</span>
          </div>
          <input
            id="ui-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.categoryVolumes[SoundCategory.UI]}
            onChange={(e) => handleCategoryVolumeChange(SoundCategory.UI, parseFloat(e.target.value))}
            className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
          />
        </div>
        
        {/* Game Sounds */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="game-volume" className="text-white flex items-center">
              <button
                onClick={() => handleCategoryMuteToggle(SoundCategory.GAME)}
                className="mr-2 text-gray-300 hover:text-white focus:outline-none"
              >
                {settings.mutedCategories[SoundCategory.GAME] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                )}
              </button>
              Game Sounds
            </label>
            <span className="text-white">{Math.round(settings.categoryVolumes[SoundCategory.GAME] * 100)}%</span>
          </div>
          <input
            id="game-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.categoryVolumes[SoundCategory.GAME]}
            onChange={(e) => handleCategoryVolumeChange(SoundCategory.GAME, parseFloat(e.target.value))}
            className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
          />
        </div>
        
        {/* Voice Narration */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="voice-volume" className="text-white flex items-center">
              <button
                onClick={() => handleCategoryMuteToggle(SoundCategory.VOICE)}
                className="mr-2 text-gray-300 hover:text-white focus:outline-none"
              >
                {settings.mutedCategories[SoundCategory.VOICE] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              Voice Narration
            </label>
            <span className="text-white">{Math.round(settings.categoryVolumes[SoundCategory.VOICE] * 100)}%</span>
          </div>
          <input
            id="voice-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.categoryVolumes[SoundCategory.VOICE]}
            onChange={(e) => handleCategoryVolumeChange(SoundCategory.VOICE, parseFloat(e.target.value))}
            className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
          />
        </div>
        
        {/* Ambient Sounds */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="ambient-volume" className="text-white flex items-center">
              <button
                onClick={() => handleCategoryMuteToggle(SoundCategory.AMBIENT)}
                className="mr-2 text-gray-300 hover:text-white focus:outline-none"
              >
                {settings.mutedCategories[SoundCategory.AMBIENT] ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              Ambient Sounds
            </label>
            <span className="text-white">{Math.round(settings.categoryVolumes[SoundCategory.AMBIENT] * 100)}%</span>
          </div>
          <input
            id="ambient-volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.categoryVolumes[SoundCategory.AMBIENT]}
            onChange={(e) => handleCategoryVolumeChange(SoundCategory.AMBIENT, parseFloat(e.target.value))}
            className="w-full bg-gray-700 rounded-lg appearance-none h-2 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SoundSettings; 