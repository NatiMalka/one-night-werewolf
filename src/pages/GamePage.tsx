import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import Card from '../components/Card';
import Button from '../components/Button';
import PlayerList from '../components/PlayerList';
import ChatBox from '../components/ChatBox';
import Timer from '../components/Timer';
import Modal from '../components/Modal';
import { Role } from '../types';
import { roleData } from '../utils/gameUtils';
import { ArrowLeft } from 'lucide-react';

const GamePage: React.FC = () => {
  const { 
    gameRoom, 
    currentPlayer, 
    chatMessages, 
    playerVotes,
    performNightAction, 
    sendChatMessage, 
    votePlayer,
    playAgain,
    leaveRoom,
    skipCurrentNightAction,
    startVotingPhase
  } = useGame();
  
  // Add comment to address unused variables that will be needed for future implementation
  // These state variables will be used in the future to implement the specific role actions
  // They're declared upfront to ensure consistency across the component
  const [seerSelection, setSeerSelection] = useState<{ type: 'player' | 'center', targets: string[] }>({
    type: 'player',
    targets: []
  });
  
  const [robberTarget, setRobberTarget] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [troublemakerTargets, setTroublemakerTargets] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [drunkTarget, setDrunkTarget] = useState<string>('');
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Show role modal automatically when game starts
  useEffect(() => {
    if (gameRoom?.phase === 'night' && currentPlayer?.originalRole) {
      setShowRoleModal(true);
    }
  }, [gameRoom?.phase, currentPlayer?.originalRole]);
  
  if (!gameRoom || !currentPlayer) {
    return null;
  }
  
  // Redirect to lobby page if game phase is lobby
  useEffect(() => {
    if (gameRoom.phase === 'lobby') {
      window.location.href = `/room/${gameRoom.code}`;
    }
  }, [gameRoom.phase, gameRoom.code]);
  
  // Get current player's role information
  const currentRole = currentPlayer.currentRole || 'villager';
  const originalRole = currentPlayer.originalRole || 'villager';
  
  // Check if player can perform the current night action
  const canPerformAction = 
    gameRoom.phase === 'night' && 
    gameRoom.currentNightAction && 
    originalRole && 
    roleData[originalRole as Role].nightAction === gameRoom.currentNightAction;
  
  // Handle night action submission
  const handleNightActionSubmit = () => {
    if (!gameRoom.currentNightAction) return;
    
    switch (gameRoom.currentNightAction) {
      case 'werewolves':
        performNightAction('werewolves', {});
        break;
        
      case 'seer':
        if (seerSelection.type === 'player' && seerSelection.targets.length === 1) {
          performNightAction('seer', { 
            targetType: 'player', 
            targetId: seerSelection.targets[0] 
          });
        } else if (seerSelection.type === 'center' && seerSelection.targets.length === 2) {
          performNightAction('seer', { 
            targetType: 'center', 
            targetIds: seerSelection.targets 
          });
        }
        break;
        
      case 'robber':
        if (robberTarget) {
          // Get the player's current role for action data
          const targetPlayer = gameRoom.players.find(p => p.id === robberTarget);
          const targetRole = targetPlayer?.currentRole || 'villager';
          
          performNightAction('robber', { 
            targetPlayerId: robberTarget,
            targetPlayerName: targetPlayer?.name,
            targetRole,
            originalRobberRole: currentRole 
          });
        }
        break;
        
      case 'troublemaker':
        if (troublemakerTargets.length === 2) {
          performNightAction('troublemaker', { 
            player1Id: troublemakerTargets[0], 
            player2Id: troublemakerTargets[1] 
          });
        }
        break;
        
      case 'drunk':
        if (drunkTarget) {
          performNightAction('drunk', { centerCardId: drunkTarget });
        }
        break;
        
      case 'insomniac':
        performNightAction('insomniac', {});
        break;
    }
    
    setShowActionModal(false);
  };
  
  // Render for Night Phase
  const renderNightPhase = () => {
    // Check if current player is the host
    const isHost = currentPlayer.isHost;
    
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <h2 className="text-2xl font-bold text-white mb-6">Night Phase</h2>
        
        <div className="mb-6">
          <Timer 
            key={`night-timer-${gameRoom.nightTimeRemaining || 60}`}
            seconds={gameRoom.nightTimeRemaining || 60} 
            large 
            onComplete={() => {
              if (gameRoom.currentNightAction) {
                // If player can perform the action but hasn't done so, auto-submit
                if (canPerformAction && gameRoom.currentNightAction) {
                  // Auto-submit with empty data
                  performNightAction(gameRoom.currentNightAction, {});
                  setShowActionModal(false);
                }
                // For players who can't perform this action, we still need to send a skip
                else if (!canPerformAction) {
                  performNightAction(gameRoom.currentNightAction, {});
                }
              }
            }} 
          />
        </div>
        
        <div className="bg-gray-900 rounded-lg p-6 max-w-md mb-6 text-center">
          <h3 className="text-xl font-semibold text-white mb-3">
            {gameRoom.currentNightAction 
              ? `${gameRoom.currentNightAction.charAt(0).toUpperCase() + gameRoom.currentNightAction.slice(1)} Wake Up!`
              : 'Waiting for next action...'}
          </h3>
          
          <p className="text-gray-400 mb-4">
            {canPerformAction 
              ? "It's your turn to perform your role's action"
              : "Please wait while other players perform their actions"}
          </p>
          
          {canPerformAction && (
            <Button onClick={() => setShowActionModal(true)}>
              Perform Action
            </Button>
          )}

          {/* Host-only skip button */}
          {isHost && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-500 mb-2">Host Controls</p>
              <p className="text-xs text-gray-400 mb-3">
                As host, you can skip the current role's timer and move immediately 
                to the next role or to the day phase.
              </p>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => {
                  const currentRole = gameRoom.currentNightAction
                    ? gameRoom.currentNightAction.charAt(0).toUpperCase() + gameRoom.currentNightAction.slice(1)
                    : 'current';
                  
                  const isConfirmed = window.confirm(
                    `Are you sure you want to skip the ${currentRole} timer? This will move the game to the next role immediately.`
                  );
                  
                  if (isConfirmed) {
                    skipCurrentNightAction();
                  }
                }}
              >
                Skip {gameRoom.currentNightAction 
                  ? `${gameRoom.currentNightAction.charAt(0).toUpperCase()}${gameRoom.currentNightAction.slice(1)}` 
                  : 'Current'} Timer
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <Button variant="ghost" onClick={() => setShowRoleModal(true)}>
            View Your Role
          </Button>
        </div>
      </div>
    );
  };
  
  // Render for Day Phase
  const renderDayPhase = () => {
    return (
      <div className="container mx-auto px-4 max-w-5xl py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Day Phase - Discussion</h2>
          <Timer 
            key={`day-timer-${gameRoom.dayTimeRemaining || 300}`}
            seconds={gameRoom.dayTimeRemaining || 300} 
            onComplete={() => {
              // Timer will be handled by server, but we can show UI change
              console.log("Day phase timer complete");
            }} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ChatBox 
              messages={chatMessages}
              onSendMessage={sendChatMessage}
              className="h-[calc(100vh-200px)]"
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <PlayerList 
              players={gameRoom.players}
              currentPlayerId={currentPlayer.id}
            />
            
            <div className="bg-gray-900 rounded-lg p-4">
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => setShowRoleModal(true)}
              >
                View Your Role
              </Button>
            </div>
            
            {currentPlayer.isHost && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-3">Host Controls</h3>
                <p className="text-xs text-gray-400 mb-3">
                  When everyone has finished discussing, start the voting phase.
                </p>
                <Button 
                  fullWidth 
                  onClick={() => {
                    const isConfirmed = window.confirm(
                      "Are you sure you want to end the discussion and move to the voting phase? All players will need to vote for who they think is the werewolf."
                    );
                    
                    if (isConfirmed) {
                      startVotingPhase();
                    }
                  }}
                >
                  Start Voting
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Render for Voting Phase
  const renderVotingPhase = () => {
    const hasVoted = gameRoom.players.some(
      player => player.id === currentPlayer.id && player.votedFor
    );
    
    // Count how many players have voted
    const playersVoted = gameRoom.players.filter(player => player.votedFor).length;
    const totalPlayers = gameRoom.players.length;
    
    return (
      <div className="container mx-auto px-4 max-w-5xl py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Voting Phase</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gray-900 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Vote for the Werewolf
              </h3>
              
              <div className="bg-gray-800 px-3 py-1 rounded text-gray-300 text-sm">
                {playersVoted} of {totalPlayers} voted
              </div>
            </div>
            
            <p className="text-gray-400 mb-6">
              {hasVoted 
                ? "You've cast your vote. Wait for other players to vote."
                : "Select a player you think is a werewolf. Choose carefully!"}
            </p>
            
            <PlayerList 
              players={gameRoom.players}
              currentPlayerId={currentPlayer.id}
              votingEnabled={!hasVoted}
              onVote={votePlayer}
              voteCounts={playerVotes}
            />
            
            {playerVotes && Object.keys(playerVotes).length > 0 && (
              <div className="mt-6 bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Current Votes</h4>
                <ul className="space-y-2">
                  {gameRoom.players.filter(p => p.votedFor).map(player => {
                    const votedForPlayer = gameRoom.players.find(p => p.id === player.votedFor);
                    return (
                      <li key={player.id} className="flex items-center text-sm">
                        <span className="text-indigo-400 font-medium">{player.name}</span>
                        <span className="text-gray-500 mx-2">voted for</span>
                        <span className="text-red-400 font-medium">{votedForPlayer?.name || 'Unknown'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="font-semibold text-white mb-3">Game Info</h3>
              
              <div className="text-sm text-gray-400 space-y-2">
                <p>• Village Team wins if a werewolf is eliminated</p>
                <p>• Werewolf Team wins if no werewolf is eliminated</p>
                <p>• The Tanner wins if they are eliminated</p>
                <p>• If the Hunter is eliminated, their target is also eliminated</p>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-yellow-300 mb-2">When everyone has voted:</p>
                <p className="text-xs text-gray-400">
                  The player(s) with the most votes will be eliminated.
                  The winners will be determined based on who was eliminated.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => setShowRoleModal(true)}
              >
                View Your Role
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render for Results Phase
  const renderResultsPhase = () => {
    // Find eliminated players
    const eliminatedIds = gameRoom.eliminatedPlayerIds || [];
    const eliminatedPlayers = gameRoom.players.filter(player => 
      eliminatedIds.includes(player.id)
    );
    
    // Find hunter victim if any
    const hunterVictim = gameRoom.hunterVictimId 
      ? gameRoom.players.find(player => player.id === gameRoom.hunterVictimId)
      : null;
    
    return (
      <div className="container mx-auto px-4 max-w-5xl py-6">
        <h2 className="text-2xl font-bold text-white mb-6">Game Results</h2>
        
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-indigo-400 mb-2">
              {gameRoom.winningTeam === 'werewolf' && 'Werewolves Win!'}
              {gameRoom.winningTeam === 'village' && 'Villagers Win!'}
              {gameRoom.winningTeam === 'tanner' && 'Tanner Wins!'}
              {!gameRoom.winningTeam && 'Game Over'}
            </h3>
            
            <p className="text-gray-400">
              {gameRoom.winningTeam === 'werewolf' && 'No werewolf was eliminated. The werewolves have infiltrated the village!'}
              {gameRoom.winningTeam === 'village' && 'A werewolf was eliminated. The village is safe!'}
              {gameRoom.winningTeam === 'tanner' && 'The Tanner was eliminated. Their wish for death has been fulfilled!'}
            </p>
          </div>
          
          {eliminatedPlayers.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-white mb-3">Eliminated Players</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {eliminatedPlayers.map(player => (
                  <div key={player.id} className="bg-gray-700 p-3 rounded-lg text-center">
                    <p className="text-white font-medium mb-1">{player.name}</p>
                    <Card 
                      role={player.currentRole || 'villager'}
                      isRevealed={true}
                      size="sm"
                      className="mx-auto mb-2"
                    />
                    <p className="text-sm text-red-400">
                      {player.currentRole ? player.currentRole.charAt(0).toUpperCase() + player.currentRole.slice(1) : 'Villager'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Votes: {gameRoom.voteCounts ? gameRoom.voteCounts[player.id] || 0 : 0}
                    </p>
                  </div>
                ))}
              </div>
              
              {hunterVictim && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <p className="text-yellow-400 mb-2">
                    <span className="font-semibold">Hunter Effect:</span> {hunterVictim.name} was also eliminated!
                  </p>
                  <div className="flex items-center gap-3">
                    <Card 
                      role={hunterVictim.currentRole || 'villager'}
                      isRevealed={true}
                      size="sm"
                    />
                    <span className="text-gray-300">
                      {hunterVictim.name} ({hunterVictim.currentRole ? hunterVictim.currentRole.charAt(0).toUpperCase() + hunterVictim.currentRole.slice(1) : 'Villager'})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mb-6">
            <h4 className="font-semibold text-white mb-3">Final Roles</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {gameRoom.players.map(player => {
                const voteCount = gameRoom.voteCounts ? gameRoom.voteCounts[player.id] || 0 : 0;
                const eliminatedIds = gameRoom.eliminatedPlayerIds || [];
                const isEliminated = eliminatedIds.includes(player.id) || player.id === gameRoom.hunterVictimId;
                
                return (
                  <div 
                    key={player.id} 
                    className={`bg-gray-800 p-3 rounded-lg text-center ${isEliminated ? 'border border-red-700' : ''}`}
                  >
                    <p className="text-white font-medium mb-1">{player.name}</p>
                    <Card 
                      role={player.currentRole || 'villager'}
                      isRevealed={true}
                      size="sm"
                      className="mx-auto mb-2"
                    />
                    <p className={`text-sm ${
                      player.currentRole === 'werewolf' ? 'text-red-400' : 
                      player.currentRole === 'tanner' ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {player.currentRole ? player.currentRole.charAt(0).toUpperCase() + player.currentRole.slice(1) : 'Villager'}
                    </p>
                    
                    {player.originalRole !== player.currentRole && (
                      <p className="text-xs text-gray-400 mt-1">
                        Started as: {player.originalRole ? player.originalRole.charAt(0).toUpperCase() + player.originalRole.slice(1) : 'Villager'}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-400 mt-1">
                      Votes: {voteCount}
                    </p>
                    
                    {player.votedFor && (
                      <p className="text-xs text-gray-400 mt-1">
                        Voted for: {gameRoom.players.find(p => p.id === player.votedFor)?.name || 'Unknown'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button onClick={playAgain}>
              Play Again
            </Button>
            
            <Button variant="secondary" onClick={leaveRoom}>
              Leave Game
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderGamePhase = () => {
    switch (gameRoom.phase) {
      case 'lobby':
        return (
          <div className="flex flex-col items-center justify-center py-10">
            <h2 className="text-2xl font-bold text-white mb-6">Returning to Lobby...</h2>
            <p className="text-gray-400">Please wait while we redirect you...</p>
          </div>
        );
      case 'night':
        return renderNightPhase();
      case 'day':
        return renderDayPhase();
      case 'voting':
        return renderVotingPhase();
      case 'results':
        return renderResultsPhase();
      default:
        return null;
    }
  };
  
  // Role modal content
  const renderRoleModal = () => {
    // Ensure we have valid role data even if there's a type mismatch
    const roleToShow = currentRole as Role;
    const { name, team, description } = roleData[roleToShow];
    
    // Check if the role has changed since the start of the game
    const roleChanged = originalRole && originalRole !== currentRole;
    
    return (
      <Modal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title="Your Role"
        size="lg"
      >
        <div className="flex flex-col items-center">
          <Card 
            role={roleToShow}
            isRevealed={true}
            size="lg"
            className="mb-4"
          />
          
          <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
          
          <p className="text-sm text-gray-400 mb-4">
            {team === 'werewolf' ? 'Werewolf Team' : 
             team === 'village' ? 'Village Team' : 'Tanner (Independent)'}
          </p>
          
          <p className="text-gray-300 text-center mb-4">{description}</p>
          
          {roleChanged && (
            <div className="bg-gray-800 p-4 rounded-lg w-full mb-4">
              <p className="text-yellow-400 text-sm mb-1">Role Change</p>
              <p className="text-gray-300">
                Your original role was <span className="font-semibold">{roleData[originalRole as Role].name}</span> but it changed during the night!
              </p>
              {gameRoom.phase === 'results' && (
                <p className="text-gray-400 mt-2 text-sm">
                  In One Night Werewolf, your role can change during the night due to other players' actions.
                </p>
              )}
            </div>
          )}
          
          {gameRoom.phase === 'night' && roleData[roleToShow].nightAction && (
            <div className="bg-indigo-900/50 p-4 rounded-lg w-full mb-4">
              <p className="text-indigo-300 font-semibold mb-1">Night Action</p>
              <p className="text-gray-300">
                You'll be woken up to perform your {roleData[roleToShow].nightAction} action when it's your turn.
              </p>
            </div>
          )}
          
          <Button onClick={() => setShowRoleModal(false)}>
            Close
          </Button>
        </div>
      </Modal>
    );
  };
  
  // Night action modal content
  const renderActionModal = () => {
    if (!gameRoom.currentNightAction || !originalRole) return null;
    
    const action = gameRoom.currentNightAction;
    
    // Content based on role
    let actionContent;
    
    switch (action) {
      case 'werewolves': {
        // Show other werewolves
        const otherWerewolves = gameRoom.players.filter(
          p => p.id !== currentPlayer.id && p.originalRole === 'werewolf'
        );
        
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              Look for other werewolves. If you're the only werewolf, you may look at one card in the center.
            </p>
            
            {otherWerewolves.length > 0 ? (
              <div>
                <h4 className="font-semibold text-white mb-2">Other Werewolves:</h4>
                <ul className="bg-gray-800 rounded-lg p-3 mb-4">
                  {otherWerewolves.map(player => (
                    <li key={player.id} className="text-red-400">
                      {player.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-lg p-3 mb-4">
                <p className="text-yellow-400">You are the only werewolf!</p>
              </div>
            )}
          </div>
        );
        break;
      }
      
      case 'seer': {
        // Determine if selection has been made
        const hasSelectedTarget = 
          (seerSelection.type === 'player' && seerSelection.targets.length === 1) || 
          (seerSelection.type === 'center' && seerSelection.targets.length === 2);
        
        // Get selected player or center cards based on current selection
        const selectedPlayer = seerSelection.type === 'player' && seerSelection.targets.length === 1 
          ? gameRoom.players.find(p => p.id === seerSelection.targets[0])
          : null;
          
        const selectedCenterCards = seerSelection.type === 'center' && seerSelection.targets.length === 2
          ? seerSelection.targets.map(id => {
              const index = parseInt(id.replace('center-', '')) - 1;
              return gameRoom.centerCards[index];
            })
          : [];
        
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              As the Seer, you can look at either one player's role or two center cards.
            </p>
            
            {!hasSelectedTarget ? (
              <div>
                <div className="mb-4">
                  <h4 className="font-semibold text-white mb-2">What would you like to see?</h4>
                  <div className="flex gap-2 mb-4">
                    <Button 
                      variant={seerSelection.type === 'player' ? 'primary' : 'secondary'}
                      onClick={() => setSeerSelection({ type: 'player', targets: [] })}
                    >
                      One Player
                    </Button>
                    <Button 
                      variant={seerSelection.type === 'center' ? 'primary' : 'secondary'}
                      onClick={() => setSeerSelection({ type: 'center', targets: [] })}
                    >
                      Two Center Cards
                    </Button>
                  </div>
                </div>
                
                {seerSelection.type === 'player' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Select a player:</h4>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {gameRoom.players
                        .filter(p => p.id !== currentPlayer.id)
                        .map(player => (
                          <Button 
                            key={player.id}
                            size="sm"
                            variant={seerSelection.targets.includes(player.id) ? 'primary' : 'secondary'}
                            onClick={() => setSeerSelection({
                              type: 'player',
                              targets: [player.id]
                            })}
                          >
                            {player.name}
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {seerSelection.type === 'center' && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Select two center cards:</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {gameRoom.centerCards.map((card, index) => (
                        <Button 
                          key={`center-${index + 1}`}
                          size="sm"
                          variant={seerSelection.targets.includes(`center-${index + 1}`) ? 'primary' : 'secondary'}
                          onClick={() => {
                            // Toggle selection, maintaining max of 2 cards
                            const cardId = `center-${index + 1}`;
                            let newTargets = [...seerSelection.targets];
                            
                            if (newTargets.includes(cardId)) {
                              newTargets = newTargets.filter(id => id !== cardId);
                            } else if (newTargets.length < 2) {
                              newTargets.push(cardId);
                            }
                            
                            setSeerSelection({
                              type: 'center',
                              targets: newTargets
                            });
                          }}
                          disabled={!seerSelection.targets.includes(`center-${index + 1}`) && seerSelection.targets.length >= 2}
                        >
                          Card {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h4 className="font-semibold text-white mb-2">You see:</h4>
                
                {selectedPlayer && (
                  <div className="bg-gray-800 p-4 rounded-lg mb-4">
                    <p className="text-gray-300 mb-2">{selectedPlayer.name} is:</p>
                    <div className="flex justify-center mb-2">
                      <Card 
                        role={selectedPlayer.currentRole || 'villager'} 
                        isRevealed={true}
                        size="md"
                      />
                    </div>
                    <p className="text-center font-semibold text-indigo-400">
                      {selectedPlayer.currentRole ? selectedPlayer.currentRole.charAt(0).toUpperCase() + selectedPlayer.currentRole.slice(1) : 'Villager'}
                    </p>
                  </div>
                )}
                
                {seerSelection.type === 'center' && selectedCenterCards.length === 2 && (
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-300 mb-2">The center cards are:</p>
                    <div className="flex justify-center gap-4 mb-2">
                      {selectedCenterCards.map((card, index) => (
                        <div key={index} className="text-center">
                          <Card 
                            role={card.role} 
                            isRevealed={true}
                            size="md"
                            className="mb-2"
                          />
                          <p className="font-semibold text-indigo-400">
                            {card.role.charAt(0).toUpperCase() + card.role.slice(1)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-yellow-400 mt-4 text-sm">
                  Remember this information! It might be crucial for the village.
                </p>
              </div>
            )}
          </div>
        );
        break;
      }
      
      case 'troublemaker': {
        // Determine if two players have been selected
        const hasSelectedPlayers = troublemakerTargets.length === 2;
        
        // Get the selected players
        const selectedPlayers = gameRoom.players.filter(
          p => troublemakerTargets.includes(p.id)
        );
        
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              As the Troublemaker, you may exchange the roles of two other players without looking at them.
            </p>
            
            {!hasSelectedPlayers ? (
              <div>
                <h4 className="font-semibold text-white mb-2">Select two players to swap roles:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {gameRoom.players
                    .filter(p => p.id !== currentPlayer.id)
                    .map(player => (
                      <Button 
                        key={player.id}
                        size="sm"
                        variant={troublemakerTargets.includes(player.id) ? 'primary' : 'secondary'}
                        onClick={() => {
                          // Toggle selection, maintaining max of 2 players
                          let newTargets = [...troublemakerTargets];
                          
                          if (newTargets.includes(player.id)) {
                            newTargets = newTargets.filter(id => id !== player.id);
                          } else if (newTargets.length < 2) {
                            newTargets.push(player.id);
                          }
                          
                          setTroublemakerTargets(newTargets);
                        }}
                        disabled={!troublemakerTargets.includes(player.id) && troublemakerTargets.length >= 2}
                      >
                        {player.name}
                      </Button>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-white mb-2">You've selected:</h4>
                  <div className="flex flex-col gap-2">
                    {selectedPlayers.map(player => (
                      <div key={player.id} className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-indigo-400">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-800 rounded-full p-3">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </div>
                
                <p className="text-gray-300 text-center">
                  These players' roles will be swapped without you knowing what they are.
                </p>
                
                <div className="mt-4">
                  <Button 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => setTroublemakerTargets([])}
                  >
                    Change Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        break;
      }
      
      case 'robber': {
        // Determine if a player has been selected
        const hasSelectedPlayer = !!robberTarget;
        
        // Get the selected player
        const selectedPlayer = hasSelectedPlayer
          ? gameRoom.players.find(p => p.id === robberTarget)
          : null;
        
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              As the Robber, you may exchange your card with another player's card and then view your new card.
              After the swap, you'll play as your new role for the rest of the game.
            </p>
            
            {!hasSelectedPlayer ? (
              <div>
                <h4 className="font-semibold text-white mb-2">Select a player to rob:</h4>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {gameRoom.players
                    .filter(p => p.id !== currentPlayer.id) // Cannot rob yourself
                    .map(player => (
                      <Button 
                        key={player.id}
                        size="sm"
                        variant={robberTarget === player.id ? 'primary' : 'secondary'}
                        onClick={() => setRobberTarget(player.id)}
                      >
                        {player.name}
                      </Button>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-gray-800 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-white mb-2">You've robbed:</h4>
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                      {selectedPlayer?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-indigo-400">{selectedPlayer?.name}</span>
                  </div>
                  
                  <div className="flex justify-center gap-8 mt-4 mb-4">
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-2">Your Original Role</p>
                      <Card 
                        role={originalRole} 
                        isRevealed={true}
                        size="md"
                        className="mb-2"
                      />
                      <p className="font-semibold text-indigo-400">
                        {originalRole.charAt(0).toUpperCase() + originalRole.slice(1)}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="rounded-full bg-gray-700 p-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-2">Their Original Role</p>
                      <Card 
                        role={selectedPlayer?.currentRole || 'villager'} 
                        isRevealed={true}
                        size="md"
                        className="mb-2"
                      />
                      <p className="font-semibold text-indigo-400">
                        {selectedPlayer?.currentRole 
                          ? selectedPlayer.currentRole.charAt(0).toUpperCase() + selectedPlayer.currentRole.slice(1) 
                          : 'Villager'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="text-center">
                      <h4 className="font-semibold text-yellow-400 mb-3">Your Roles Have Been Swapped!</h4>
                      <p className="text-gray-300 mb-3">Your new role is:</p>
                      <div className="flex justify-center">
                        <Card 
                          role={selectedPlayer?.currentRole || 'villager'} 
                          isRevealed={true}
                          size="lg"
                          className="mb-2"
                        />
                      </div>
                      <p className="font-semibold text-lg text-indigo-400">
                        {selectedPlayer?.currentRole 
                          ? selectedPlayer.currentRole.charAt(0).toUpperCase() + selectedPlayer.currentRole.slice(1) 
                          : 'Villager'}
                      </p>
                      
                      <p className="text-yellow-400 mt-4 text-sm">
                        Remember your new role! The other player won't know their role has changed.
                      </p>
                      <p className="text-gray-400 mt-2 text-sm">
                        You're now part of the {selectedPlayer?.currentRole === 'werewolf' ? 'Werewolf' : 'Village'} team
                        and will win or lose with them.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="secondary" 
                    fullWidth 
                    onClick={() => setRobberTarget('')}
                  >
                    Change Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        break;
      }
      
      case 'drunk': {
        // Determine if a center card has been selected
        const hasSelectedCard = !!drunkTarget;
        
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              As the Drunk, you may exchange your card with one from the center without looking at it.
              You won't see your new card until the end of the game.
            </p>
            
            {!hasSelectedCard ? (
              <div>
                <h4 className="font-semibold text-white mb-2">Select a center card to swap with:</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {gameRoom.centerCards.map((card, index) => (
                    <div 
                      key={card.id}
                      className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors
                        ${drunkTarget === card.id ? 'bg-indigo-900/50 border border-indigo-600' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'}`}
                      onClick={() => setDrunkTarget(card.id)}
                    >
                      <Card 
                        role="unknown" 
                        isRevealed={false}
                        size="md"
                      />
                      <p className="mt-2 text-center font-medium text-gray-300">Center {index + 1}</p>
                    </div>
                  ))}
                </div>
                <p className="text-yellow-400 text-sm mt-2">
                  Note: You won't see what card you're getting. You'll still play as the Drunk for this game,
                  but your actual role at the end will be whatever card you select.
                </p>
              </div>
            ) : (
              <div className="bg-indigo-900/30 border border-indigo-700 rounded-lg p-4 mb-4">
                <p className="text-indigo-300 font-semibold mb-2">
                  You've selected a center card to swap with!
                </p>
                <p className="text-gray-300">
                  Your card will be swapped with the selected center card. Remember that you won't
                  see what your new role is, and for game purposes, you're still considered to be the Drunk.
                </p>
                <div className="mt-3">
                  <Button 
                    variant="secondary"
                    size="sm"
                    fullWidth 
                    onClick={() => setDrunkTarget('')}
                  >
                    Change Selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
        break;
      }
      
      case 'insomniac': {
        // Show a view of the player's current role
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              As the Insomniac, you wake up at the end of the night to check if your role has changed.
            </p>
            
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <p className="text-gray-300 mb-2">Your current role is:</p>
              <div className="flex justify-center mb-2">
                <Card 
                  role={currentRole} 
                  isRevealed={true}
                  size="md"
                />
              </div>
              <p className="font-semibold text-indigo-400">
                {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
              </p>
              
              {originalRole !== currentRole && (
                <p className="text-yellow-400 mt-4">
                  Your role has changed from {originalRole.charAt(0).toUpperCase() + originalRole.slice(1)}!
                </p>
              )}
            </div>
          </div>
        );
        break;
      }
      
      default:
        actionContent = (
          <div>
            <p className="text-gray-300 mb-4">
              Perform your role's action.
            </p>
          </div>
        );
    }
    
    return (
      <Modal
        isOpen={showActionModal}
        onClose={() => setShowActionModal(false)}
        title={`${action.charAt(0).toUpperCase() + action.slice(1)} Action`}
        size="lg"
      >
        <div>
          {actionContent}
          
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowActionModal(false)}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleNightActionSubmit}
              disabled={
                (action === 'seer' && 
                !(
                  (seerSelection.type === 'player' && seerSelection.targets.length === 1) || 
                  (seerSelection.type === 'center' && seerSelection.targets.length === 2)
                )) ||
                (action === 'troublemaker' && troublemakerTargets.length !== 2) ||
                (action === 'robber' && !robberTarget) ||
                (action === 'drunk' && !drunkTarget)
              }
            >
              Submit
            </Button>
          </div>
        </div>
      </Modal>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              className="mr-2 text-gray-400 hover:text-white"
              onClick={() => setShowRoleModal(true)}
            >
              <Card role={currentRole} size="sm" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-white">One Night Werewolf</h1>
              <p className="text-sm text-gray-400">Room: {gameRoom.code}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {gameRoom.phase !== 'lobby' && (
              <div className="bg-gray-800 px-3 py-1 rounded-lg text-gray-300 text-sm">
                Phase: {gameRoom.phase.charAt(0).toUpperCase() + gameRoom.phase.slice(1)}
              </div>
            )}
            
            <Button 
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft size={16} />}
              onClick={leaveRoom}
            >
              Leave
            </Button>
          </div>
        </div>
      </header>
      
      <main>
        {renderGamePhase()}
        {renderRoleModal()}
        {renderActionModal()}
      </main>
    </div>
  );
};

export default GamePage;