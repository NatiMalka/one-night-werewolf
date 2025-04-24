import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Preload audio files for night narration
const preloadAudio = () => {
  const audioFiles = [
    '/voice/Werewolves.wav',
    '/voice/Minion.wav',
    '/voice/Seer.wav',
    '/voice/Robber.wav',
    '/voice/Troublemaker.wav',
    '/voice/Drunk.wav',
    '/voice/Insomniac.wav',
    '/voice/Mason.wav',
    '/voice/Doppelganger.wav'
  ];
  
  audioFiles.forEach(file => {
    const audio = new Audio();
    audio.src = file;
    // Just load it, don't play
    audio.load();
  });
};

// Try to preload audio files
try {
  preloadAudio();
} catch (error) {
  console.error('Error preloading audio files:', error);
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(<App />); 