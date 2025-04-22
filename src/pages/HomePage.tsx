import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import Button from '../components/Button';
import { ArrowRight, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { createRoom, joinRoom, isLoading, error: contextError } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const [localError, setLocalError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Trigger entrance animation
    setAnimateIn(true);
  }, []);
  
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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-indigo-950 to-gray-950 flex flex-col overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[10%] w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-[20%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-[30%] w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Moon icon in the background */}
      <div className="absolute top-12 right-12 text-indigo-300/20">
        <Moon size={120} className="animate-float" />
      </div>
      
      <header className={`pt-12 pb-6 px-4 relative z-10 transition-all duration-1000 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <div className="container mx-auto">
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400 inline-flex items-center justify-center">
              <Moon className="mr-3 text-indigo-400" size={40} />
              One Night Werewolf
            </h1>
            <p className="text-indigo-200/80 mt-3 text-lg max-w-xl mx-auto">
              An online version of the popular social deduction game
            </p>
          </div>
        </div>
      </header>
      
      <main className={`flex-grow flex items-center justify-center p-4 relative z-10 transition-all duration-1000 delay-300 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="w-full max-w-md">
          <div className="backdrop-blur-lg bg-gray-900/50 rounded-2xl p-8 shadow-2xl border border-gray-800/50 
                         hover:shadow-indigo-900/20 hover:border-indigo-800/50 transition-all duration-300">
            <div className="flex mb-6 p-1 bg-gray-800/50 rounded-lg">
              <button
                className={`flex-1 py-3 font-medium rounded-lg transition-all duration-300
                          ${joinMode === 'create'
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg'
                              : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                onClick={() => setJoinMode('create')}
                disabled={isLoading}
              >
                Create Game
              </button>
              <button
                className={`flex-1 py-3 font-medium rounded-lg transition-all duration-300
                          ${joinMode === 'join'
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg'
                              : 'bg-transparent text-gray-400 hover:text-gray-200'}`}
                onClick={() => setJoinMode('join')}
                disabled={isLoading}
              >
                Join Game
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="group">
                <label htmlFor="playerName" className="block text-sm font-medium text-indigo-300 mb-2 transition-colors group-hover:text-white">
                  Your Name
                </label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                            text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                            transition-all duration-300 backdrop-blur-sm"
                  maxLength={20}
                  disabled={isLoading}
                />
              </div>
              
              {joinMode === 'join' && (
                <div className="group animate-fadeIn">
                  <label htmlFor="roomCode" className="block text-sm font-medium text-indigo-300 mb-2 transition-colors group-hover:text-white">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="roomCode"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg
                              text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                              transition-all duration-300 backdrop-blur-sm"
                    maxLength={6}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              {displayError && (
                <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-red-300 text-sm animate-pulse">
                  {displayError}
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight size={18} />}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 
                          transition-all duration-300 shadow-lg hover:shadow-indigo-700/20 py-4 mt-2"
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
          
          <div className={`mt-10 text-center transition-all duration-1000 delay-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <p className="text-indigo-300/80 text-lg font-medium">
              Find the werewolves before dawn!
            </p>
            <p className="mt-2 text-indigo-200/60">
              Need at least 3 players to start a game.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;