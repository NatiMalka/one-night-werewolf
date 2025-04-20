import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import LobbyPage from './LobbyPage';
import GamePage from './GamePage';
import LoadingScreen from '../components/LoadingScreen';

const RoomPage: React.FC = () => {
  const { roomCode: paramRoomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { gameRoom, currentPlayer, isLoading, error } = useGame();
  const [connecting, setConnecting] = useState(true);
  
  // Extract room code from URL in case useParams fails
  const getRoomCodeFromURL = (): string | null => {
    const pathParts = window.location.pathname.split('/');
    const roomCodeIndex = pathParts.findIndex(part => part === 'room') + 1;
    return roomCodeIndex > 0 && roomCodeIndex < pathParts.length 
      ? pathParts[roomCodeIndex]
      : null;
  };
  
  // Get room code from either params or URL directly
  const roomCode = paramRoomCode || getRoomCodeFromURL();
  
  useEffect(() => {
    if (!roomCode) {
      console.log("No room code found in URL, redirecting to home");
      navigate('/');
      return;
    }
    
    console.log("RoomPage mounted with roomCode:", roomCode);
    
    // Check if we have a stored player ID for this room
    const playerId = localStorage.getItem(`player_${roomCode}`);
    if (!playerId) {
      console.log("No stored player ID found for room", roomCode);
      navigate('/');
      return;
    }
    
    // Wait a short time to allow GameContext to connect
    const timer = setTimeout(() => {
      setConnecting(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [roomCode, navigate]);
  
  // Still in the initial connection phase
  if (connecting || isLoading) {
    return <LoadingScreen message={`Connecting to game room ${roomCode}...`} />;
  }
  
  // Show error if there was a problem
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            className="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Make sure we have a valid game room and player
  if (!gameRoom || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md text-center">
          <p className="text-gray-300 mb-4">Game room not found or you're not a player.</p>
          <button 
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-4 rounded"
            onClick={() => navigate('/')}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // If in lobby phase, show the lobby page
  if (gameRoom.phase === 'lobby') {
    return <LobbyPage />;
  }
  
  // For any other game phase, show the game page
  return <GamePage />;
};

export default RoomPage; 