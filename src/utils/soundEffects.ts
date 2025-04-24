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
  }
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

// Play sound with given settings
export async function playSound(
  url: string, 
  category: SoundCategory, 
  options: { 
    volume?: number, 
    loop?: boolean,
    rate?: number,
    detune?: number
  } = {}
): Promise<{ stop: () => void }> {
  try {
    // Check if master muted
    if (currentSettings.masterMuted) {
      return { stop: () => {} };
    }
    
    // Check if category muted
    if (currentSettings.mutedCategories[category]) {
      return { stop: () => {} };
    }
    
    const context = initializeAudioContext();
    const buffer = await loadAudio(url);
    
    // Create source and gain nodes
    const source = context.createBufferSource();
    const gainNode = context.createGain();
    
    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Set buffer and options
    source.buffer = buffer;
    if (options.loop !== undefined) source.loop = options.loop;
    if (options.rate !== undefined) source.playbackRate.value = options.rate;
    if (options.detune !== undefined) source.detune.value = options.detune;
    
    // Calculate volume
    const masterVolume = currentSettings.masterVolume;
    const categoryVolume = currentSettings.categoryVolumes[category];
    const specificVolume = options.volume !== undefined ? options.volume : 1;
    const finalVolume = masterVolume * categoryVolume * specificVolume;
    
    // Set volume
    gainNode.gain.value = finalVolume;
    
    // Start playback
    source.start(0);
    
    // Return stop function
    return {
      stop: () => {
        try {
          source.stop();
        } catch (err) {
          // Ignore errors when stopping (might already be stopped)
        }
      }
    };
  } catch (error) {
    console.error(`Error playing sound ${url}:`, error);
    return { stop: () => {} };
  }
}

// Convenience functions for common UI sounds
export async function playButtonClickSound(): Promise<void> {
  await playSound('/sounds/ui/button-click.mp3', SoundCategory.UI);
}

export async function playToggleOnSound(): Promise<void> {
  await playSound('/sounds/ui/toggle-on.mp3', SoundCategory.UI);
}

export async function playToggleOffSound(): Promise<void> {
  await playSound('/sounds/ui/toggle-off.mp3', SoundCategory.UI);
}

export async function playAlertSound(): Promise<void> {
  await playSound('/sounds/ui/alert.mp3', SoundCategory.UI, { volume: 0.6 });
}

export async function playErrorSound(): Promise<void> {
  await playSound('/sounds/ui/error.mp3', SoundCategory.UI, { volume: 0.6 });
}

export async function playSuccessSound(): Promise<void> {
  await playSound('/sounds/ui/success.mp3', SoundCategory.UI, { volume: 0.6 });
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

// Preload a sound
const preloadSound = (effect: SoundEffect): HTMLAudioElement => {
  if (!soundCache[effect.src]) {
    const audio = new Audio(effect.src);
    audio.volume = 0; // Set to 0 during preload
    audio.load();
    soundCache[effect.src] = audio;
  }
  return soundCache[effect.src];
};

// Preload all sounds
export const preloadAllSounds = () => {
  Object.values(SOUND_EFFECTS).forEach(effect => {
    preloadSound(effect);
  });
};

// Update the volume based on settings
const getEffectiveVolume = (effect: SoundEffect): number => {
  const { masterVolume, categoryVolumes, mutedCategories, masterMuted } = currentSettings;
  
  if (masterMuted || mutedCategories[effect.category]) {
    return 0;
  }
  
  return effect.volume * masterVolume * categoryVolumes[effect.category];
};

/**
 * Play a sound effect
 * @param effect The sound effect to play
 * @returns A promise that resolves when the sound finishes playing
 */
export const playSoundEffect = async (effect: SoundEffect): Promise<void> => {
  // Don't play sound if we're muted
  if (currentSettings.masterMuted || currentSettings.mutedCategories[effect.category]) {
    return;
  }
  
  try {
    // Get or load the audio element
    const audio = soundCache[effect.src] || preloadSound(effect);
    
    // Create a new audio element for concurrent sounds (like rapid button clicks)
    const soundInstance = new Audio(effect.src);
    soundInstance.volume = getEffectiveVolume(effect);
    
    // Play the sound
    return new Promise((resolve) => {
      soundInstance.play();
      soundInstance.onended = () => resolve();
    });
  } catch (error) {
    console.error('Failed to play sound effect:', error);
  }
};

// Convenience methods for common sounds
export const playButtonClickSoundEffect = () => playSoundEffect(SOUND_EFFECTS.BUTTON_CLICK);
export const playToggleOnSoundEffect = () => playSoundEffect(SOUND_EFFECTS.TOGGLE_ON);
export const playToggleOffSoundEffect = () => playSoundEffect(SOUND_EFFECTS.TOGGLE_OFF);
export const playErrorSoundEffect = () => playSoundEffect(SOUND_EFFECTS.ERROR);
export const playSuccessSoundEffect = () => playSoundEffect(SOUND_EFFECTS.SUCCESS); 