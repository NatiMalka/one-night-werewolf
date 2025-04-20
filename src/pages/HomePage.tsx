import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Button from '../components/Button';
import { ArrowRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { createRoom, joinRoom, isLoading, error: contextError } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const [localError, setLocalError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    
    if (joinMode === 'join' && !roomCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }
    
    try {
      if (joinMode === 'create') {
        console.log("Creating room from HomePage");
        const createdRoomCode = await createRoom(playerName.trim());
        console.log("Room created with code:", createdRoomCode);
        // Navigate to the newly created room
        navigate(`/room/${createdRoomCode}`);
      } else {
        console.log("Joining room from HomePage:", roomCode);
        await joinRoom(roomCode.trim(), playerName.trim());
        // Navigate to the joined room
        navigate(`/room/${roomCode.trim()}`);
      }
    } catch (error) {
      console.error("Error in room creation/joining:", error);
      setLocalError("Failed to create or join room. Please try again.");
    }
  };
  
  // Display either local validation errors or context errors from Firebase
  const displayError = localError || contextError;
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <Users className="mr-2" />
            One Night Werewolf
          </h1>
          <p className="text-gray-400 mt-1">
            An online version of the popular social deduction game
          </p>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 rounded-xl p-6 md:p-8 shadow-xl max-w-md mx-auto border border-gray-800">
            <div className="flex mb-6">
              <button
                className={`flex-1 py-2 font-medium rounded-l-lg transition-colors
                          ${joinMode === 'create'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setJoinMode('create')}
                disabled={isLoading}
              >
                Create Game
              </button>
              <button
                className={`flex-1 py-2 font-medium rounded-r-lg transition-colors
                          ${joinMode === 'join'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setJoinMode('join')}
                disabled={isLoading}
              >
                Join Game
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="playerName" className="block text-sm font-medium text-gray-400 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                            text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={20}
                  disabled={isLoading}
                />
              </div>
              
              {joinMode === 'join' && (
                <div className="mb-4">
                  <label htmlFor="roomCode" className="block text-sm font-medium text-gray-400 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                              text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {displayError && (
                <div className="mb-4 text-red-500 text-sm">
                  {displayError}
                </div>
              )}
              
              <Button
                type="submit"
                fullWidth
                rightIcon={<ArrowRight size={18} />}
                disabled={isLoading}
              >
                {isLoading 
                  ? 'Loading...' 
                  : joinMode === 'create' 
                    ? 'Create Game' 
                    : 'Join Game'
                }
              </Button>
            </form>
          </div>
          
          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>
              One Night Werewolf: Find the werewolves before dawn!
            </p>
            <p className="mt-2">
              Need at least 3 players to start a game.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;