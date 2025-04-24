import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import { setupConsoleAntiCheat } from './utils/antiCheat';

function App() {
  const [consoleOpened, setConsoleOpened] = useState(false);

  // Setup console filter to prevent cheating via console
  useEffect(() => {
    // Set up anti-cheat measures
    const cleanup = setupConsoleAntiCheat(() => setConsoleOpened(true));
    
    // Return cleanup function
    return cleanup;
  }, []);

  // Add listener for paste events to clear false warnings
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // If we detect a paste operation, check if it's likely a room code
      // Room codes are typically 6-8 characters
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && pastedText.length >= 6 && pastedText.length <= 8) {
        // Clear the console warning after a short delay
        setTimeout(() => setConsoleOpened(false), 100);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);
  
  // Auto-dismiss console warning to avoid disrupting gameplay
  useEffect(() => {
    if (consoleOpened) {
      // Check if we're in a game page and dismiss faster (1.5s vs 3s)
      const isGamePage = window.location.pathname.includes('/room/');
      const dismissTime = isGamePage ? 1500 : 3000;
      
      // Check if audio is playing - if so, dismiss immediately
      const audioElements = document.querySelectorAll('audio');
      let isAudioPlaying = false;
      audioElements.forEach(audio => {
        if (!audio.paused) {
          isAudioPlaying = true;
        }
      });
      
      // If audio is playing, dismiss almost immediately
      if (isAudioPlaying) {
        setTimeout(() => setConsoleOpened(false), 200);
        return;
      }
      
      const timer = setTimeout(() => {
        setConsoleOpened(false);
      }, dismissTime);
      return () => clearTimeout(timer);
    }
  }, [consoleOpened]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {consoleOpened && (
        <div className="fixed top-0 left-0 right-0 bg-red-800/90 text-white py-1 px-4 text-center z-50 text-sm backdrop-blur-sm">
          ⚠️ Anti-cheat warning: Developer console detected. Copying/pasting room codes is allowed.
        </div>
      )}
      <BrowserRouter>
        <GameProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/room/:roomCode" element={<RoomPage />} />
            {/* Catch-all route to redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </GameProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;