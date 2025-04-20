import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Button from '../components/Button';
import PlayerList from '../components/PlayerList';
import RoleSelection from '../components/RoleSelection';
import { Role } from '../types';

const LobbyPage: React.FC = () => {
  const { gameRoom, currentPlayer, leaveRoom, startGame, setReady } = useGame();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  if (!gameRoom || !currentPlayer) {
    return null;
  }
  
  const isHost = currentPlayer.isHost;
  const allPlayersReady = gameRoom.players.every(player => player.isReady);
  const playerCount = gameRoom.players.length;
  const canStartGame = isHost && allPlayersReady && playerCount >= 3;
  
  // Handler for ready button
  const handleReadyToggle = () => {
    // Using the extracted setReady function directly
    setReady(!currentPlayer.isReady);
  };
  
  const handleStartGame = () => {
    if (canStartGame) {
      setShowRoleSelection(true);
    }
  };
  
  const handleRoleSelectionComplete = (selectedRoles: Role[]) => {
    startGame(selectedRoles);
    setShowRoleSelection(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Game Lobby</h1>
          <p className="text-gray-400">
            Room Code: <span className="font-mono bg-gray-800 px-2 py-1 rounded text-yellow-400">{gameRoom.code}</span>
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button variant="danger" onClick={leaveRoom}>
            Leave Game
          </Button>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-full md:w-1/2">
            <PlayerList 
              players={gameRoom.players} 
              currentPlayerId={currentPlayer.id}
              className="mb-6"
            />
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Game Information</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• You need <span className="text-yellow-400">3-10 players</span> to play</li>
                <li>• Each player will be assigned a secret role</li>
                <li>• The game has one night phase and one day phase</li>
                <li>• Discussion happens during the day phase</li>
                <li>• Everyone votes at the end of the day</li>
                <li>• The village wins if they eliminate a werewolf</li>
                <li>• The werewolves win if no werewolf is eliminated</li>
              </ul>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Game Setup</h2>
            
            {isHost ? (
              <div>
                <p className="text-gray-300 mb-4">
                  You are the host. Wait for all players to ready up, then start the game.
                </p>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Players Ready: {gameRoom.players.filter(p => p.isReady).length} / {playerCount}</span>
                    <span>Minimum: 3 players</span>
                  </div>
                  
                  <div className="w-full bg-gray-900 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${allPlayersReady ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${(gameRoom.players.filter(p => p.isReady).length / playerCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Ready button for host */}
                <div className="mb-4">
                  <Button
                    fullWidth
                    variant={currentPlayer.isReady ? 'success' : 'primary'}
                    onClick={handleReadyToggle}
                    className="mb-4"
                  >
                    {currentPlayer.isReady ? 'Ready ✓' : 'Mark as Ready'}
                  </Button>
                </div>
                
                <Button
                  fullWidth
                  disabled={!canStartGame}
                  onClick={handleStartGame}
                >
                  Start Game
                </Button>
                
                {!canStartGame && playerCount < 3 && (
                  <p className="text-red-400 mt-2 text-sm">
                    Need at least 3 players to start
                  </p>
                )}
                
                {!canStartGame && !allPlayersReady && playerCount >= 3 && (
                  <p className="text-yellow-400 mt-2 text-sm">
                    Waiting for all players to ready up
                  </p>
                )}
                
                {!currentPlayer.isReady && (
                  <p className="text-yellow-400 mt-2 text-sm">
                    You need to mark yourself as ready
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">
                  Wait for the host to start the game. You can mark yourself as ready when you're prepared to play.
                </p>
                
                <Button
                  fullWidth
                  variant={currentPlayer.isReady ? 'success' : 'primary'}
                  onClick={handleReadyToggle}
                >
                  {currentPlayer.isReady ? 'Ready ✓' : 'Mark as Ready'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showRoleSelection && (
        <RoleSelection
          playerCount={playerCount}
          onComplete={handleRoleSelectionComplete}
        />
      )}
    </div>
  );
};

export default LobbyPage;