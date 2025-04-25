/**
 * Sound Effects Utility
 * Manages the loading and playing of game sound effects
 */

// Preload and cache sounds for better performance
const soundCache: Record<string, HTMLAudioElement> = {};

// Sound categories
export enum SoundCategory {
  UI = 'ui',
  GAME = 'game',
  AMBIENT = 'ambient',
  VOICE = 'voice'
}

// Sound effect configuration with metadata
export interface SoundEffect {
  src: string;
  volume: number;
  category: SoundCategory;
}

// Define all sound effects used in the game
export const SOUND_EFFECTS = {
  // UI sounds
  BUTTON_CLICK: {
    src: '/sounds/ui/button-click.mp3',
    volume: 0.5,
    category: SoundCategory.UI
  },
  TOGGLE_ON: {
    src: '/sounds/ui/toggle-on.mp3',
    volume: 0.5,
    category: SoundCategory.UI
  },
  TOGGLE_OFF: {
    src: '/sounds/ui/toggle-off.mp3',
    volume: 0.5,
    category: SoundCategory.UI
  },
  ERROR: {
    src: '/sounds/ui/error.mp3',
    volume: 0.6,
    category: SoundCategory.UI
  },
  SUCCESS: {
    src: '/sounds/ui/success.mp3',
    volume: 0.6,
    category: SoundCategory.UI
  },
  ACHIEVEMENT_UNLOCK: {
    src: '/sounds/Achievements.mp3',
    volume: 0.7,
    category: SoundCategory.GAME
  },
  GAME_START: {
    src: '/sounds/game-start.mp3',
    volume: 0.7,
    category: SoundCategory.GAME
  },
  GAME_END: {
    src: '/sounds/game-end.mp3',
    volume: 0.7,
    category: SoundCategory.GAME
  }
};

// Sound ID mapping for backward compatibility
const SOUND_ID_MAPPING: Record<string, keyof typeof SOUND_EFFECTS> = {
  'achievement-unlock': 'ACHIEVEMENT_UNLOCK',
  'game-start': 'GAME_START',
  'game-end': 'GAME_END'
};

// Interface for sound settings
export interface SoundSettings {
  masterVolume: number;
  masterMuted: boolean;
  categoryVolumes: Record<SoundCategory, number>;
  mutedCategories: Record<SoundCategory, boolean>;
}

// Default settings
const DEFAULT_SETTINGS: SoundSettings = {
  masterVolume: 0.7,
  masterMuted: false,
  categoryVolumes: {
    [SoundCategory.UI]: 0.8,
    [SoundCategory.GAME]: 0.8, 
    [SoundCategory.VOICE]: 1.0,
    [SoundCategory.AMBIENT]: 0.5
  },
  mutedCategories: {
    [SoundCategory.UI]: false,
    [SoundCategory.GAME]: false,
    [SoundCategory.VOICE]: false,
    [SoundCategory.AMBIENT]: false
  }
};

// Local storage key
const STORAGE_KEY = 'one-night-werewolf-sound-settings';

// Load settings from localStorage or use defaults
export function loadSoundSettings(): SoundSettings {
  try {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (err) {
    console.error('Error loading sound settings:', err);
  }
  
  return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
function saveSettings(settings: SoundSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch event so other components can update
    window.dispatchEvent(new Event('soundSettingsChanged'));
  } catch (err) {
    console.error('Error saving sound settings:', err);
  }
}

// Get current settings
let currentSettings = loadSoundSettings();

// Set master volume
export function setMasterVolume(volume: number): void {
  currentSettings.masterVolume = volume;
  saveSettings(currentSettings);
}

// Toggle master mute
export function toggleMasterMute(): void {
  currentSettings.masterMuted = !currentSettings.masterMuted;
  saveSettings(currentSettings);
}

// Set category volume
export function setCategoryVolume(category: SoundCategory, volume: number): void {
  currentSettings.categoryVolumes[category] = volume;
  saveSettings(currentSettings);
}

// Toggle category mute
export function toggleCategoryMute(category: SoundCategory): void {
  currentSettings.mutedCategories[category] = !currentSettings.mutedCategories[category];
  saveSettings(currentSettings);
}

// Reset to defaults
export function resetSoundSettings(): void {
  currentSettings = { ...DEFAULT_SETTINGS };
  saveSettings(currentSettings);
}

// Audio Context
let audioContext: AudioContext | null = null;

// Initialize audio context (must be called after user interaction)
function initializeAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Cache for loaded audio buffers
const audioCache: Record<string, AudioBuffer> = {};

// Load audio file
async function loadAudio(url: string): Promise<AudioBuffer> {
  if (audioCache[url]) {
    return audioCache[url];
  }
  
  try {
    const context = initializeAudioContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    audioCache[url] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Error loading audio file ${url}:`, error);
    throw error;
  }
}

// Sounds cache for HTML Audio elements
const sounds: Record<string, HTMLAudioElement> = {};

/**
 * Plays a sound effect
 * @param soundId - The ID of the sound to play
 * @param volume - Optional volume (0.0 to 1.0)
 */
export const playSound = (soundId: string, volume = 0.5): void => {
  try {
    // Handle kebab-case sound IDs for backward compatibility
    const effectKey = SOUND_ID_MAPPING[soundId] || soundId as keyof typeof SOUND_EFFECTS;
    const effect = SOUND_EFFECTS[effectKey];
    
    if (!effect) {
      console.warn(`Sound "${soundId}" is not defined`);
      return;
    }
    
    if (!sounds[soundId]) {
      // Create and cache the audio element for this sound
      sounds[soundId] = new Audio(typeof effect === 'string' ? effect : effect.src);
    }
    
    // Reset the audio to the beginning (in case it's already playing)
    sounds[soundId].currentTime = 0;
    
    // Set volume and play
    const effectVolume = typeof effect === 'object' ? effect.volume : 0.5;
    const category = typeof effect === 'object' ? effect.category : SoundCategory.UI;
    
    // Calculate effective volume
    const masterVolume = currentSettings.masterVolume;
    const categoryVolume = currentSettings.categoryVolumes[category];
    const finalVolume = masterVolume * categoryVolume * effectVolume * volume;
    
    // Check if sound should be muted
    if (currentSettings.masterMuted || currentSettings.mutedCategories[category]) {
      return;
    }
    
    sounds[soundId].volume = finalVolume;
    sounds[soundId].play().catch(error => {
      // Browsers may block autoplay, so we catch the error
      console.warn(`Failed to play sound "${soundId}":`, error);
    });
  } catch (error) {
    console.warn(`Error playing sound "${soundId}":`, error);
  }
};

/**
 * Preloads a sound for immediate playback later
 * @param soundId - The ID of the sound to preload
 */
export const preloadSound = (soundId: string): void => {
  try {
    // Handle kebab-case sound IDs for backward compatibility
    const effectKey = SOUND_ID_MAPPING[soundId] || soundId as keyof typeof SOUND_EFFECTS;
    const effect = SOUND_EFFECTS[effectKey];
    
    if (!effect) {
      console.warn(`Cannot preload: Sound "${soundId}" is not defined`);
      return;
    }
    
    if (!sounds[soundId]) {
      sounds[soundId] = new Audio(typeof effect === 'string' ? effect : effect.src);
      sounds[soundId].load();
    }
  } catch (error) {
    console.warn(`Error preloading sound "${soundId}":`, error);
  }
};

/**
 * Preloads all sounds for immediate playback
 */
export const preloadAllSounds = (): void => {
  // Preload all sounds using their key names
  Object.keys(SOUND_EFFECTS).forEach(key => {
    const effect = SOUND_EFFECTS[key as keyof typeof SOUND_EFFECTS];
    if (!sounds[key]) {
      sounds[key] = new Audio(typeof effect === 'string' ? effect : effect.src);
      sounds[key].load();
    }
  });
  
  // Also preload any kebab-case aliases
  Object.keys(SOUND_ID_MAPPING).forEach(alias => {
    if (!sounds[alias]) {
      const mappedKey = SOUND_ID_MAPPING[alias];
      const effect = SOUND_EFFECTS[mappedKey];
      sounds[alias] = new Audio(typeof effect === 'string' ? effect : effect.src);
      sounds[alias].load();
    }
  });
};

// Convenience functions for common UI sounds
export function playButtonClickSound(): Promise<void> {
  playSound('BUTTON_CLICK');
  return Promise.resolve();
}

export function playToggleOnSound(): Promise<void> {
  playSound('TOGGLE_ON');
  return Promise.resolve();
}

export function playToggleOffSound(): Promise<void> {
  playSound('TOGGLE_OFF');
  return Promise.resolve();
}

export function playAlertSound(): Promise<void> {
  playSound('ERROR', 0.6);
  return Promise.resolve();
}

export function playErrorSound(): Promise<void> {
  playSound('ERROR', 0.6);
  return Promise.resolve();
}

export function playSuccessSound(): Promise<void> {
  playSound('SUCCESS', 0.6);
  return Promise.resolve();
}

// Listen for settings changes from other tabs/windows
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEY) {
    try {
      currentSettings = JSON.parse(event.newValue || JSON.stringify(DEFAULT_SETTINGS));
      window.dispatchEvent(new Event('soundSettingsChanged'));
    } catch (err) {
      console.error('Error parsing sound settings from storage event:', err);
    }
  }
}); 