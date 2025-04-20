import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
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