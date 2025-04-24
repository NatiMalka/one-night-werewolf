import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import Button from '../components/Button';
import PlayerList from '../components/PlayerList';
import RoleSelection from '../components/RoleSelection';
import Modal from '../components/Modal';
import { Role } from '../types';
import { AlertTriangle, Check } from 'lucide-react';

const LobbyPage: React.FC = () => {
  const { gameRoom, currentPlayer, leaveRoom, startGame, setReady, kickPlayer } = useGame();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  // Add state for kick confirmation modal
  const [kickConfirmation, setKickConfirmation] = useState<{
    isOpen: boolean;
    playerId: string;
    playerName: string;
  }>({
    isOpen: false,
    playerId: '',
    playerName: '',
  });
  
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
  
  // Handler for kick player button
  const handleKickPlayer = (playerId: string) => {
    const playerToKick = gameRoom.players.find(p => p.id === playerId);
    if (playerToKick) {
      setKickConfirmation({
        isOpen: true,
        playerId: playerId,
        playerName: playerToKick.name,
      });
    }
  };
  
  // Handler for confirming kick
  const confirmKickPlayer = async () => {
    try {
      await kickPlayer(kickConfirmation.playerId);
      setKickConfirmation({
        isOpen: false,
        playerId: '',
        playerName: '',
      });
    } catch (error) {
      console.error("Failed to kick player:", error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header with stylized background */}
      <div className="relative mb-8 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" 
             style={{ backgroundImage: "url('/images/night-sky.jpg')" }}></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between p-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
              <span className="mr-3">🐺</span> Game Lobby
            </h1>
            <div className="bg-gray-900/60 backdrop-blur-sm px-3 py-2 rounded-lg inline-flex items-center">
              <span className="text-gray-400 mr-2">Room Code:</span>
              <span className="font-mono text-yellow-400 font-bold tracking-wider">{gameRoom.code}</span>
              <button 
                className="ml-3 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
                onClick={() => navigator.clipboard.writeText(gameRoom.code)}
                title="Copy code"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button 
              variant="danger" 
              onClick={leaveRoom}
              className="px-4 py-2 flex items-center shadow-lg hover:shadow-xl transition-all transform hover:translate-y-[-2px]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Leave Game
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Players and Info */}
        <div className="space-y-6">
          {/* Players Panel */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30">
            <PlayerList 
              players={gameRoom.players} 
              currentPlayerId={currentPlayer.id}
              isHost={isHost}
              onKick={handleKickPlayer}
              showKickButton={isHost && gameRoom.phase === 'lobby'}
              showReadyStatus={true}
            />
          </div>
          
          {/* Game Info Panel */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30">
            <div className="px-5 py-4 border-b border-indigo-800/30 bg-indigo-900/30">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">📜</span> Game Rules
              </h3>
            </div>
            <div className="p-5">
              <ul className="text-gray-300 space-y-3">
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>You need <span className="text-yellow-400 font-medium">3-10 players</span> to play</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>Each player will be assigned a <span className="text-blue-400 font-medium">secret role</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>The game has one <span className="text-purple-400 font-medium">night phase</span> and one <span className="text-yellow-400 font-medium">day phase</span></span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>Discussion happens during the day phase</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>Everyone votes at the end of the day</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>The <span className="text-blue-400 font-medium">village wins</span> if they eliminate a werewolf</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2 mt-1">•</span>
                  <span>The <span className="text-red-400 font-medium">werewolves win</span> if no werewolf is eliminated</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Right Column - Game Setup */}
        <div className="space-y-6">
          {/* Game Setup Panel */}
          <div className="bg-gradient-to-br from-purple-900/80 to-gray-900 rounded-xl shadow-xl overflow-hidden border border-purple-900/30">
            <div className="px-5 py-4 border-b border-purple-800/30">
              <h3 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">🎮</span> Game Setup
              </h3>
            </div>
            <div className="p-5">
              {isHost ? (
                <div className="space-y-5">
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-purple-800/30">
                    <p className="text-blue-300 font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Host Controls
                    </p>
                    <p className="text-gray-300">
                      You are the host. Wait for all players to ready up, then start the game.
                    </p>
                    {canStartGame && (
                      <p className="text-green-400 mt-2 text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Ready to start! Click the Start Game button when you're ready.
                      </p>
                    )}
                  </div>
                  
                  {/* Game Settings */}
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-purple-800/30">
                    <p className="text-blue-300 font-medium mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Game Settings
                    </p>
                    
                    <VoiceNarrationToggle />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Players Ready: {gameRoom.players.filter(p => p.isReady).length} / {playerCount}
                      </span>
                      <span className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Minimum: 3 players
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-900 rounded-full h-3 mb-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${allPlayersReady ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-yellow-500 to-amber-400'}`}
                        style={{ width: `${(gameRoom.players.filter(p => p.isReady).length / playerCount) * 100}%` }}
                      ></div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-400 mb-2">Player Status:</p>
                      <div className="flex flex-wrap gap-2">
                        {gameRoom.players.map(player => (
                          <div 
                            key={player.id}
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center transition-all duration-300
                              ${player.isReady 
                                ? 'bg-green-900/30 text-green-400 border border-green-700 shadow-inner shadow-green-900/30' 
                                : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                          >
                            {player.isReady && <Check size={14} className="mr-1.5" />}
                            {player.name}
                            {player.id === currentPlayer.id && (
                              <span className="ml-1.5 text-xs bg-blue-900/70 text-blue-300 px-1.5 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                            {player.isHost && (
                              <span className="ml-1.5 text-xs bg-yellow-900/70 text-yellow-300 px-1.5 py-0.5 rounded-full">
                                Host
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Ready button for host */}
                  <div className="space-y-4">
                    <Button
                      fullWidth
                      variant={currentPlayer.isReady ? 'success' : 'primary'}
                      onClick={handleReadyToggle}
                      className={`py-3 text-lg transition-all duration-300 ${currentPlayer.isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      <span className="flex items-center justify-center">
                        {currentPlayer.isReady ? (
                          <>
                            <Check size={20} className="mr-2" />
                            Ready to Play
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mark as Ready
                          </>
                        )}
                      </span>
                    </Button>
                    
                    <Button
                      fullWidth
                      disabled={!canStartGame}
                      onClick={handleStartGame}
                      className={`py-3 text-lg transition-all transform ${canStartGame ? 'hover:translate-y-[-2px] shadow-lg hover:shadow-xl bg-purple-600 hover:bg-purple-700' : 'opacity-70 cursor-not-allowed'}`}
                    >
                      <span className="flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Game
                      </span>
                    </Button>
                    
                    {canStartGame && (
                      <div className="bg-purple-900/30 border border-purple-700/30 rounded-lg p-3 text-center">
                        <p className="text-purple-300 text-sm flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Clicking Start Game will open role selection
                        </p>
                      </div>
                    )}
                    
                    {!canStartGame && playerCount < 3 && (
                      <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-3 text-center">
                        <p className="text-red-400 text-sm flex items-center justify-center">
                          <AlertTriangle size={16} className="mr-2" />
                          Need at least 3 players to start
                        </p>
                      </div>
                    )}
                    
                    {!canStartGame && !allPlayersReady && playerCount >= 3 && (
                      <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3 text-center">
                        <p className="text-yellow-400 text-sm flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Waiting for all players to ready up
                        </p>
                      </div>
                    )}
                    
                    {!currentPlayer.isReady && (
                      <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-3 text-center">
                        <p className="text-yellow-400 text-sm flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          You need to mark yourself as ready
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-purple-800/30">
                    <p className="text-purple-300 mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Waiting for Host
                    </p>
                    <p className="text-gray-300">
                      Wait for the host to start the game. You can mark yourself as ready when you're prepared to play.
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-400 mb-2">Other Players:</p>
                    <div className="flex flex-wrap gap-2">
                      {gameRoom.players.filter(p => p.id !== currentPlayer.id).map(player => (
                        <div 
                          key={player.id}
                          className={`px-3 py-1.5 rounded-full text-sm flex items-center
                            ${player.isReady 
                              ? 'bg-green-900/30 text-green-400 border border-green-700' 
                              : 'bg-gray-800 text-gray-400 border border-gray-700'}`}
                        >
                          {player.isReady && <Check size={14} className="mr-1.5" />}
                          {player.name}
                          {player.isHost && (
                            <span className="ml-1.5 text-xs bg-yellow-900/70 text-yellow-300 px-1.5 py-0.5 rounded-full">
                              Host
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    fullWidth
                    variant={currentPlayer.isReady ? 'success' : 'primary'}
                    onClick={handleReadyToggle}
                    className={`py-3 text-lg transition-all duration-300 ${currentPlayer.isReady ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <span className="flex items-center justify-center">
                      {currentPlayer.isReady ? (
                        <>
                          <Check size={20} className="mr-2" />
                          Ready to Play
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mark as Ready
                        </>
                      )}
                    </span>
                  </Button>
                  
                  {currentPlayer.isReady && (
                    <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-3 text-center">
                      <p className="text-green-400 text-sm flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Waiting for the host to start the game
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Game Tip Panel */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-900/30">
            <div className="px-5 py-4 border-b border-blue-800/30 bg-blue-900/30">
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="mr-2">💡</span> Quick Tip
              </h3>
            </div>
            <div className="p-5">
              <p className="text-gray-300">
                One Night Werewolf is all about deception and deduction. Listen carefully to what other players claim about their roles, as roles might change during the night phase!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Role Selection Modal */}
      <Modal
        isOpen={showRoleSelection}
        onClose={() => setShowRoleSelection(false)}
        title="Select Game Roles"
        size="xl"
      >
        <div className="mb-4">
          <div className="bg-indigo-900/30 border border-indigo-700/30 rounded-lg p-3 mb-4">
            <p className="text-indigo-300 font-medium flex items-center mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select Roles
            </p>
            <p className="text-gray-300 text-sm">
              Choose {playerCount} player cards + 3 center cards, then click "Start Game".
            </p>
          </div>
          
          <RoleSelection
            playerCount={playerCount}
            onComplete={handleRoleSelectionComplete}
          />
        </div>
      </Modal>
      
      {/* Kick confirmation modal */}
      <Modal
        isOpen={kickConfirmation.isOpen}
        onClose={() => setKickConfirmation({ ...kickConfirmation, isOpen: false })}
        title="Kick Player"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-900/30 p-2 rounded-full">
              <AlertTriangle className="text-yellow-500" size={24} />
            </div>
            <p className="text-gray-300">
              Are you sure you want to kick <span className="font-semibold text-white">{kickConfirmation.playerName}</span> from the game? This action cannot be undone.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 mt-2">
            <Button 
              variant="secondary"
              onClick={() => setKickConfirmation({ ...kickConfirmation, isOpen: false })}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmKickPlayer}
            >
              Kick Player
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const VoiceNarrationToggle = () => {
  const { enableVoiceNarration, setEnableVoiceNarration } = useGame();
  
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-gray-300">Voice Narration</span>
          <div className="relative group">
            <div className="w-4 h-4 bg-gray-700 text-gray-400 rounded-full flex items-center justify-center text-xs cursor-help">?</div>
            <div className="hidden group-hover:block absolute left-full ml-2 top-0 bg-gray-800 text-xs text-gray-300 p-2 rounded shadow-lg w-48 z-10">
              Enable voice narration for night actions. Audio files must be in the /voice folder.
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setEnableVoiceNarration(!enableVoiceNarration)}
          className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
            enableVoiceNarration ? 'bg-indigo-600' : 'bg-gray-700'
          }`}
        >
          <span 
            className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
              enableVoiceNarration ? 'translate-x-6' : 'translate-x-1'
            }`} 
          />
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-1">
        {enableVoiceNarration 
          ? 'Night actions will be narrated with audio' 
          : 'No audio narration will be played'}
      </p>
    </div>
  );
};

export default LobbyPage;