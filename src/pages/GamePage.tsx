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
import { ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';

// Add styles for the vote animations
const voteAnimationStyles = `
@keyframes floatUp {
  0% { transform: translateY(100%); opacity: 0; }
  10% { opacity: 0.8; }
  90% { opacity: 0.6; }
  100% { transform: translateY(-500%); opacity: 0; }
}

@keyframes floatUpSlow {
  0% { transform: translateY(100%); opacity: 0; }
  15% { opacity: 0.5; }
  85% { opacity: 0.3; }
  100% { transform: translateY(-400%); opacity: 0; }
}

.vote-particles-1::before,
.vote-particles-1::after,
.vote-particles-2::before,
.vote-particles-2::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(147, 51, 234, 0.7) 0%, rgba(79, 70, 229, 0.3) 70%);
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
  animation: floatUp 15s infinite linear;
}

.vote-particles-1::before { left: 10%; animation-delay: 0s; }
.vote-particles-1::after { left: 30%; animation-delay: 3s; }
.vote-particles-2::before { left: 60%; animation-delay: 6s; }
.vote-particles-2::after { left: 80%; animation-delay: 9s; }

.vote-particles-1::before,
.vote-particles-1::after,
.vote-particles-2::before,
.vote-particles-2::after {
  filter: blur(1px);
}

.vote-particles-1::before { width: 12px; height: 12px; }
.vote-particles-1::after { width: 8px; height: 8px; animation-duration: 18s; }
.vote-particles-2::before { width: 10px; height: 10px; animation-duration: 22s; }
.vote-particles-2::after { width: 14px; height: 14px; animation-duration: 25s; }

/* Additional particles */
.vote-particles-1::before { box-shadow: 0 0 15px rgba(147, 51, 234, 0.7); }
.vote-particles-2::after { box-shadow: 0 0 18px rgba(79, 70, 229, 0.6); }

/* Add more particles */
.vote-particles-1, .vote-particles-2 {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.vote-particles-1::before { left: 15%; animation-delay: 1s; }
.vote-particles-1::after { left: 35%; animation-delay: 4s; }
.vote-particles-2::before { left: 55%; animation-delay: 7s; }
.vote-particles-2::after { left: 75%; animation-delay: 10s; }

/* Create pseudo elements for more particles */
.vote-particles-1 span,
.vote-particles-2 span {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.7) 0%, rgba(139, 92, 246, 0.3) 70%);
  box-shadow: 0 0 12px rgba(192, 132, 252, 0.6);
  animation: floatUpSlow 20s infinite linear;
}

.vote-particles-1 span:nth-child(1) { left: 22%; animation-delay: 2s; width: 7px; height: 7px; }
.vote-particles-1 span:nth-child(2) { left: 45%; animation-delay: 5s; width: 9px; height: 9px; }
.vote-particles-2 span:nth-child(1) { left: 67%; animation-delay: 8s; width: 11px; height: 11px; }
.vote-particles-2 span:nth-child(2) { left: 89%; animation-delay: 11s; width: 6px; height: 6px; }
`;

// Add a Toast notification component
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-indigo-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-md animate-fadeIn">
      <CheckCircle className="text-green-400" size={20} />
      <div className="flex-1">{message}</div>
      <button 
        onClick={onClose} 
        className="text-gray-300 hover:text-white"
      >
        &times;
      </button>
    </div>
  );
};

// Add a Confirmation Modal component
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-900/30 p-2 rounded-full">
            <AlertTriangle className="text-yellow-500" size={24} />
          </div>
          <p className="text-gray-300">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

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
  const [roleShownAtNightStart, setRoleShownAtNightStart] = useState(false);
  
  // Add toast notification state
  const [toast, setToast] = useState<string | null>(null);
  
  // Add confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Show role modal automatically when night phase begins
  useEffect(() => {
    if (gameRoom?.phase === 'night' && currentPlayer?.originalRole && !roleShownAtNightStart) {
      setShowRoleModal(true);
      setRoleShownAtNightStart(true);
      
      // Set a timer to auto-close the role modal after 5 seconds for regular players, 10 seconds for host
      const displayTime = currentPlayer?.isHost ? 10000 : 5000;
      const timer = setTimeout(() => {
        setShowRoleModal(false);
      }, displayTime);
      
      return () => clearTimeout(timer);
    }
    
    // Reset the flag when game phase changes
    if (gameRoom?.phase !== 'night') {
      setRoleShownAtNightStart(false);
    }
  }, [gameRoom?.phase, currentPlayer?.originalRole, roleShownAtNightStart, currentPlayer?.isHost]);
  
  // Inject CSS styles for vote animations when component mounts
  useEffect(() => {
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.type = 'text/css';
    styleEl.id = 'vote-animation-styles';
    styleEl.innerHTML = voteAnimationStyles;
    
    // Only add the styles if they don't already exist
    if (!document.getElementById('vote-animation-styles')) {
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // Clean up style element when component unmounts
      const existingStyle = document.getElementById('vote-animation-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  
  // Redirect to lobby page if game phase is lobby
  useEffect(() => {
    // Only redirect if we have a gameRoom and it's in lobby phase
    if (gameRoom?.phase === 'lobby') {
      window.location.href = `/room/${gameRoom.code}`;
    }
  }, [gameRoom?.phase, gameRoom?.code]);
  
  if (!gameRoom || !currentPlayer) {
    return null;
  }
  
  // Get current player's role information
  const currentRole = currentPlayer.currentRole || 'villager';
  const originalRole = currentPlayer.originalRole || 'villager';
  
  // Check if player can perform the current night action
  const canPerformAction = 
    gameRoom.phase === 'night' && 
    gameRoom.currentNightAction && 
    originalRole && 
    roleData[originalRole as Role].nightAction === gameRoom.currentNightAction;
    
  // Check if the role allows player to view their card during the night
  const canViewRoleDuringNight = 
    originalRole === 'seer' || 
    originalRole === 'robber' || 
    originalRole === 'troublemaker' || 
    originalRole === 'insomniac' ||
    currentPlayer.isHost;
  
  // Helper function to show confirmation modals
  const showConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };
  
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
          
          // Show a custom toast notification instead of browser alert
          setToast(`You've successfully robbed ${targetPlayer?.name}! You'll be able to see your new role later by clicking on "View Your Role".`);
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
      <div className="container mx-auto px-4 py-8">
        {/* Header with mystical moon background and timer */}
        <div className="relative mb-8 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" 
               style={{ backgroundImage: "url('/images/night-sky.jpg')" }}></div>
          
          {/* Animated stars */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="stars-1"></div>
            <div className="stars-2"></div>
            <div className="stars-3"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex justify-between items-center p-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3">🌙</span>
                Night Phase
              </h2>
              <p className="text-purple-200 mt-1">The village sleeps while secret roles are performed</p>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-900/70 backdrop-blur-sm px-6 py-4 rounded-lg shadow-inner border border-purple-700/30">
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
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Current Action Panel */}
          <div className="md:col-span-2">
            <div className="bg-gradient-to-br from-indigo-900/80 to-gray-900 rounded-xl shadow-2xl overflow-hidden border border-indigo-900/30">
              <div className="relative">
                {/* Decorative top element */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                
                <div className="p-8 text-center">
                  <div className="mb-6 flex justify-center">
                    <div className={`transform transition-all duration-1000 ${gameRoom.currentNightAction ? 'scale-100 opacity-100' : 'scale-95 opacity-70'}`}>
                      <div className="relative w-32 h-32 flex items-center justify-center mb-4 mx-auto">
                        <div className="absolute inset-0 bg-purple-900/30 rounded-full animate-pulse-slow"></div>
                        <div className="absolute inset-2 bg-indigo-900/40 rounded-full animate-pulse-slow animation-delay-300"></div>
                        <div className="relative z-10 text-5xl">
                          {gameRoom.currentNightAction === 'werewolves' && '🐺'}
                          {gameRoom.currentNightAction === 'seer' && '👁️'}
                          {gameRoom.currentNightAction === 'robber' && '🔄'}
                          {gameRoom.currentNightAction === 'troublemaker' && '👥'}
                          {gameRoom.currentNightAction === 'drunk' && '🍺'}
                          {gameRoom.currentNightAction === 'insomniac' && '😴'}
                          {!gameRoom.currentNightAction && '💤'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-white mb-4 tracking-wider">
                    {gameRoom.currentNightAction 
                      ? `${gameRoom.currentNightAction.charAt(0).toUpperCase() + gameRoom.currentNightAction.slice(1)} Wake Up!`
                      : 'Everyone is asleep...'}
                  </h3>
                  
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-5 max-w-xl mx-auto border border-indigo-800/30">
                    <p className="text-xl text-gray-300 mb-6">
                      {canPerformAction 
                        ? "It's your turn to perform your role's action"
                        : "Please wait while other players perform their actions"}
                    </p>
                    
                    {canPerformAction ? (
                      <Button 
                        onClick={() => setShowActionModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 text-lg rounded-lg transition-all transform hover:translate-y-[-2px] shadow-lg hover:shadow-xl"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Perform Action
                        </span>
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div className="inline-flex items-center px-4 py-2 bg-gray-800 text-gray-400 rounded-lg">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Waiting for other players...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Controls Column */}
          <div className="space-y-6">
            {/* View Role Button */}
            {(gameRoom.phase === 'results' || (gameRoom.phase === 'night' && canViewRoleDuringNight)) && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-purple-800/30 p-6">
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => setShowRoleModal(true)}
                  className="bg-purple-900/50 hover:bg-purple-800/70 text-white border border-purple-700/50 shadow-inner py-4 text-lg"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Your Role
                  </span>
                </Button>
              </div>
            )}
            
            {/* Night Sequence Visualization */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30">
              <div className="px-5 py-4 border-b border-indigo-800/30 bg-indigo-900/30">
                <h3 className="font-bold text-white flex items-center">
                  <span className="mr-2">🌠</span> Night Sequence
                </h3>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {['werewolves', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac'].map((role, index) => {
                    // Determine if this role has already gone, is current, or is upcoming
                    const isCurrent = gameRoom.currentNightAction === role;
                    const hasGone = !gameRoom.currentNightAction 
                      ? false 
                      : ['werewolves', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac']
                          .indexOf(gameRoom.currentNightAction) > index;
                    
                    return (
                      <div 
                        key={role}
                        className={`flex items-center p-2 rounded-lg
                          ${isCurrent ? 'bg-indigo-900/40 border border-indigo-700/50' : ''}
                          ${hasGone ? 'opacity-60' : ''}
                        `}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3
                          ${isCurrent ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400'}
                          ${hasGone ? 'bg-gray-900 text-gray-600' : ''}
                        `}>
                          {hasGone && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>}
                          {isCurrent && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                          {!hasGone && !isCurrent && index + 1}
                        </div>
                        <span className={`
                          ${isCurrent ? 'text-indigo-300 font-medium' : 'text-gray-400'}
                          ${hasGone ? 'text-gray-500 line-through' : ''}
                        `}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Host Controls - Only shown to host */}
            {isHost && (
              <div className="bg-gradient-to-br from-purple-900/80 to-gray-900 rounded-xl shadow-xl overflow-hidden border border-purple-900/30">
                <div className="px-5 py-4 border-b border-purple-800/30">
                  <h3 className="font-bold text-white flex items-center">
                    <span className="mr-2">👑</span> Host Controls
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-300 mb-4 text-sm">
                    As host, you can skip the current role's timer and move immediately 
                    to the next role or to the day phase.
                  </p>
                  <Button 
                    fullWidth 
                    onClick={() => {
                      const currentRole = gameRoom.currentNightAction
                        ? gameRoom.currentNightAction.charAt(0).toUpperCase() + gameRoom.currentNightAction.slice(1)
                        : 'current';
                      
                      showConfirmation(
                        `Skip ${currentRole} Timer`,
                        `Are you sure you want to skip the ${currentRole} timer? This will move the game to the next role immediately.`,
                        skipCurrentNightAction
                      );
                    }}
                    className="bg-purple-700 hover:bg-purple-600 transition-all transform hover:translate-y-[-2px] shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                      </svg>
                      Skip {gameRoom.currentNightAction 
                        ? `${gameRoom.currentNightAction.charAt(0).toUpperCase()}${gameRoom.currentNightAction.slice(1)}` 
                        : 'Current'} Timer
                    </span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Game Tips Box */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-900/30">
              <div className="px-5 py-4 border-b border-blue-800/30 bg-blue-900/30">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">💡</span> Night Phase Tips
                </h3>
              </div>
              <div className="p-5">
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Each role wakes up in a specific order</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Some roles can view or swap cards</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Your original role might change during the night</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-400 mr-2">•</span>
                    <span>Remember what you learn for the day discussion!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render for Day Phase
  const renderDayPhase = () => {
    return (
      <div className="container mx-auto px-4 py-6">
        {/* Header with moon/night background and timer */}
        <div className="relative mb-8 bg-gradient-to-r from-indigo-900/80 to-blue-900/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-20"
               style={{ backgroundImage: "url('/images/night-sky.jpg')" }}></div>
          <div className="relative z-10 flex justify-between items-center p-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3">🌞</span>
                Day Phase
              </h2>
              <p className="text-blue-200 mt-1">Discuss with other players to deduce the werewolf</p>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-900/60 backdrop-blur-sm px-4 py-3 rounded-lg">
                <Timer 
                  key={`day-timer-${gameRoom.dayTimeRemaining || 300}`}
                  seconds={gameRoom.dayTimeRemaining || 300} 
                  large
                  onComplete={() => {
                    console.log("Day phase timer complete");
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Section - Takes up more space */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30 flex-1">
              <ChatBox 
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                className="h-[550px]" 
              />
            </div>
          </div>
          
          {/* Players & Controls Section */}
          <div className="lg:col-span-1 space-y-5">
            {/* Player List Panel */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30">
              <PlayerList 
                players={gameRoom.players}
                currentPlayerId={currentPlayer.id}
                className="border-none"
              />
            </div>
            
            {/* View Role Button - Only for host */}
            {currentPlayer.isHost && (
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-blue-900/30 p-5">
                <Button 
                  variant="ghost" 
                  fullWidth 
                  onClick={() => setShowRoleModal(true)}
                  className="bg-blue-900/50 hover:bg-blue-800/70 text-white border border-blue-700/50 shadow-inner py-3"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Your Role (Host Only)
                  </span>
                </Button>
              </div>
            )}
            
            {/* Host Controls - Only shown to host */}
            {currentPlayer.isHost && (
              <div className="bg-gradient-to-br from-purple-900/80 to-gray-900 rounded-xl shadow-xl overflow-hidden border border-purple-900/30">
                <div className="px-5 py-4 border-b border-purple-800/30">
                  <h3 className="font-bold text-white flex items-center">
                    <span className="mr-2">👑</span> Host Controls
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-300 mb-4 text-sm">
                    When everyone has finished discussing, start the voting phase to determine who gets eliminated.
                  </p>
                  <Button 
                    fullWidth 
                    onClick={() => {
                      showConfirmation(
                        "Start Voting Phase",
                        "Are you sure you want to end the discussion and move to the voting phase? All players will need to vote for who they think is the werewolf.",
                        startVotingPhase
                      );
                    }}
                    className="bg-purple-700 hover:bg-purple-600 transition-all transform hover:translate-y-[-2px] shadow-lg"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Start Voting
                    </span>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Game Info Box */}
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30 p-5">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <span className="mr-2">ℹ️</span> Game Tips
              </h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2">•</span>
                  <span>Discuss what role you claim to have</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2">•</span>
                  <span>Consider if anyone's story doesn't add up</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-400 mr-2">•</span>
                  <span>Remember roles might have changed during the night</span>
                </li>
              </ul>
            </div>
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
    
    // Handle vote function with toast notification
    const handleVote = (targetId: string) => {
      // Check if voting for player or center card
      const isPlayerVote = !targetId.startsWith('center-');
      
      // Get the target name (player name or center card number)
      let targetName = "Unknown";
      if (isPlayerVote) {
        const targetPlayer = gameRoom.players.find(p => p.id === targetId);
        targetName = targetPlayer?.name || "Unknown";
      } else {
        const centerIndex = parseInt(targetId.replace('center-', ''));
        targetName = `Center Card ${centerIndex}`;
      }
      
      // Show confirmation modal before voting
      showConfirmation(
        "Confirm Your Vote",
        `Are you sure you want to vote for ${targetName}? You cannot change your vote once submitted.`,
        async () => {
          await votePlayer(targetId);
          // Show toast notification after voting
          setToast(`You voted for ${targetName}. Waiting for other players to vote.`);
        }
      );
    };
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header with voting animation background */}
        <div className="relative mb-8 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 rounded-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" 
               style={{ backgroundImage: "url('/images/night-sky.jpg')" }}></div>
          
          {/* Animated vote particles */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="vote-particles-1">
              <span></span>
              <span></span>
            </div>
            <div className="vote-particles-2">
              <span></span>
              <span></span>
            </div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center p-6">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center">
                <span className="mr-3">🗳️</span>
                Voting Phase
              </h2>
              <p className="text-purple-200 mt-1">Select a player you think is a werewolf</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center">
              {/* Vote progress indicator */}
              <div className="bg-gray-900/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-inner border border-purple-700/30 flex items-center">
                <div className="mr-3">
                  <div className="text-sm text-gray-400 mb-1">Votes Cast</div>
                  <div className="relative w-full bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(playersVoted / totalPlayers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white">{playersVoted}/{totalPlayers}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Vote Selection Panel - Takes up more space */}
          <div className="md:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/90 to-indigo-900/80 rounded-xl shadow-2xl overflow-hidden border border-indigo-900/30">
              <div className="px-6 py-4 border-b border-indigo-800/40 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <span className="mr-2">🐺</span> Vote for the Werewolf
                </h3>
                
                {hasVoted && (
                  <div className="bg-green-900/60 text-green-300 text-sm px-3 py-1 rounded-full border border-green-700/40">
                    <span className="flex items-center">
                      <CheckCircle size={14} className="mr-1" /> Vote Cast
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <p className="text-gray-300 mb-6">
                  {hasVoted 
                    ? "You've cast your vote. Wait for other players to vote."
                    : "Select a player or center card you think is a werewolf. Choose carefully!"}
                </p>
                
                {/* Center cards section */}
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center">
                    <span className="mr-2">🃏</span> Center Cards
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {gameRoom.centerCards.map((card, index) => {
                      const cardId = `center-${index + 1}`;
                      const isVotedFor = currentPlayer.votedFor === cardId;
                      const voteCount = playerVotes ? playerVotes[cardId] || 0 : 0;
                      
                      return (
                        <div 
                          key={cardId}
                          className={`relative group rounded-lg overflow-hidden transition-all duration-300 transform ${
                            hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-103 hover:-translate-y-1'
                          } ${
                            isVotedFor 
                              ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500/70 shadow-lg shadow-purple-500/20' 
                              : 'bg-gray-800/80 border border-gray-700/50 hover:border-indigo-700/70'
                          }`}
                          onClick={() => !hasVoted && handleVote(cardId)}
                        >
                          {/* Glowing effect on hover */}
                          <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 ${hasVoted ? 'hidden' : ''}`}></div>
                          
                          <div className="flex items-center p-4">
                            <div className="mr-3">
                              <Card 
                                isCenterCard={true}
                                size="sm"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="text-lg font-semibold text-white mb-1">Center {index + 1}</div>
                              
                              {gameRoom.phase === 'voting' && voteCount > 0 && (
                                <div className="flex items-center">
                                  <div className="text-sm bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">
                                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {!hasVoted ? (
                              <div className="w-8 h-8 rounded-full bg-gray-700/70 flex items-center justify-center border border-gray-600/50 group-hover:bg-indigo-800 group-hover:border-indigo-600 transition-colors">
                                <CheckCircle size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                              </div>
                            ) : isVotedFor ? (
                              <div className="w-8 h-8 rounded-full bg-green-900/70 flex items-center justify-center border border-green-600/70">
                                <CheckCircle size={16} className="text-green-300" />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Players section */}
                <h4 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center">
                  <span className="mr-2">👤</span> Players
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {gameRoom.players.map(player => {
                    // Skip current player as they can't vote for themselves
                    if (player.id === currentPlayer.id) return null;
                    
                    const isVotedFor = currentPlayer.votedFor === player.id;
                    const voteCount = playerVotes ? playerVotes[player.id] || 0 : 0;
                    
                    return (
                      <div 
                        key={player.id}
                        className={`relative group rounded-lg overflow-hidden transition-all duration-300 transform ${
                          hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-103 hover:-translate-y-1'
                        } ${
                          isVotedFor 
                            ? 'bg-gradient-to-br from-purple-900 to-indigo-900 border-2 border-purple-500/70 shadow-lg shadow-purple-500/20' 
                            : 'bg-gray-800/80 border border-gray-700/50 hover:border-indigo-700/70'
                        }`}
                        onClick={() => !hasVoted && handleVote(player.id)}
                      >
                        {/* Glowing effect on hover */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 ${hasVoted ? 'hidden' : ''}`}></div>
                        
                        <div className="flex items-center p-4">
                          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-3 border-2 border-gray-600 overflow-hidden">
                            <div className="text-xl font-bold text-white">{player.name.charAt(0).toUpperCase()}</div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-white mb-1">{player.name}</div>
                            
                            {gameRoom.phase === 'voting' && voteCount > 0 && (
                              <div className="flex items-center">
                                <div className="text-sm bg-red-900/40 text-red-300 px-2 py-0.5 rounded-full">
                                  {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {!hasVoted ? (
                            <div className="w-8 h-8 rounded-full bg-gray-700/70 flex items-center justify-center border border-gray-600/50 group-hover:bg-indigo-800 group-hover:border-indigo-600 transition-colors">
                              <CheckCircle size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                          ) : isVotedFor ? (
                            <div className="w-8 h-8 rounded-full bg-green-900/70 flex items-center justify-center border border-green-600/70">
                              <CheckCircle size={16} className="text-green-300" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {playerVotes && Object.keys(playerVotes).length > 0 && (
                  <div className="mt-8 bg-gray-800/70 backdrop-blur rounded-lg p-5 border border-indigo-900/30">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">📊</span> Live Vote Results
                    </h4>
                    
                    <div className="space-y-4">
                      {/* Center cards votes */}
                      {gameRoom.centerCards.map((card, index) => {
                        const cardId = `center-${index + 1}`;
                        const voteCount = playerVotes[cardId] || 0;
                        const percentage = totalPlayers > 0 ? (voteCount / totalPlayers) * 100 : 0;
                        
                        if (voteCount === 0) return null; // Only show cards that have votes
                        
                        return (
                          <div key={cardId} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-indigo-300 font-medium flex items-center">
                                <span className="mr-2">🃏</span>
                                Center Card {index + 1}
                              </span>
                              <span className="text-gray-400">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                            </div>
                            <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Divider if both center cards and players have votes */}
                      {gameRoom.centerCards.some((_, index) => playerVotes[`center-${index + 1}`] > 0) && 
                       gameRoom.players.some(player => playerVotes[player.id] > 0) && (
                        <div className="border-t border-gray-700 my-3"></div>
                      )}
                      
                      {/* Player votes */}
                      {gameRoom.players.map(player => {
                        const voteCount = playerVotes[player.id] || 0;
                        const percentage = totalPlayers > 0 ? (voteCount / totalPlayers) * 100 : 0;
                        
                        if (voteCount === 0) return null; // Only show players that have votes
                        
                        return (
                          <div key={player.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-white font-medium flex items-center">
                                <span className="mr-2">👤</span>
                                {player.name}
                              </span>
                              <span className="text-gray-400">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                            </div>
                            <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Show a message if no votes have been cast yet */}
                      {!Object.values(playerVotes).some(count => count > 0) && (
                        <p className="text-gray-400 text-center py-2">No votes cast yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Game Info & Controls Column */}
          <div className="space-y-6">
            {/* Vote Status Panel */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30">
              <div className="bg-gradient-to-r from-indigo-900/40 to-indigo-800/30 px-5 py-4 border-b border-indigo-800/30">
                <h3 className="font-bold text-white flex items-center">
                  <span className="mr-2">⏱️</span> Voting Status
                </h3>
              </div>
              
              <div className="p-5">
                <div className="flex flex-col gap-1">
                  {gameRoom.players.map(player => {
                    const hasPlayerVoted = !!player.votedFor;
                    
                    return (
                      <div 
                        key={player.id} 
                        className={`flex items-center p-2 rounded-lg ${
                          hasPlayerVoted ? 'bg-green-900/20' : 'bg-gray-800/50'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          hasPlayerVoted ? 'bg-green-500' : 'bg-gray-600'
                        }`}></div>
                        
                        <span className="text-gray-300 flex-1">{player.name}</span>
                        
                        <span className={`text-sm ${
                          hasPlayerVoted ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {hasPlayerVoted ? 'Voted' : 'Waiting...'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-5 pt-4 border-t border-gray-700">
                  <p className="text-yellow-300 text-sm">
                    When everyone has voted:
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    The player(s) with the most votes will be eliminated.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Game Info Box */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-purple-900/30">
              <div className="bg-gradient-to-r from-purple-900/40 to-indigo-800/30 px-5 py-4 border-b border-purple-800/30">
                <h3 className="font-bold text-white flex items-center">
                  <span className="mr-2">ℹ️</span> Game Info
                </h3>
              </div>
              
              <div className="p-5 space-y-3">
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-blue-400">
                    🏠
                  </div>
                  <div>
                    <p className="text-blue-400 font-medium">Village Team</p>
                    <p className="text-gray-400">Wins if a werewolf is eliminated</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-red-900/40 border border-red-700/40 flex items-center justify-center text-red-400">
                    🐺
                  </div>
                  <div>
                    <p className="text-red-400 font-medium">Werewolf Team</p>
                    <p className="text-gray-400">Wins if no werewolf is eliminated</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-amber-400">
                    ⚰️
                  </div>
                  <div>
                    <p className="text-amber-400 font-medium">The Tanner</p>
                    <p className="text-gray-400">Wins if they are eliminated</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start text-sm">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-green-900/40 border border-green-700/40 flex items-center justify-center text-green-400">
                    🏹
                  </div>
                  <div>
                    <p className="text-green-400 font-medium">The Hunter</p>
                    <p className="text-gray-400">If eliminated, their target is also eliminated</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* View Role Button */}
            <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-900/30 p-5">
              <Button 
                variant="ghost" 
                fullWidth 
                onClick={() => setShowRoleModal(true)}
                className="bg-indigo-900/50 hover:bg-indigo-800/70 text-white border border-indigo-700/50 shadow-inner py-3"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Your Role
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render for Results Phase
  const renderResultsPhase = () => {
    // Find eliminated players and center cards
    const eliminatedIds = gameRoom.eliminatedPlayerIds || [];
    
    // Separate player IDs from center card IDs
    const eliminatedPlayerIds = eliminatedIds.filter(id => !id.startsWith('center-'));
    const eliminatedCenterCardIds = eliminatedIds.filter(id => id.startsWith('center-'));
    
    const eliminatedPlayers = gameRoom.players.filter(player => 
      eliminatedPlayerIds.includes(player.id)
    );
    
    const eliminatedCenterCards = eliminatedCenterCardIds.map(id => {
      const index = parseInt(id.replace('center-', '')) - 1;
      return {
        id,
        card: gameRoom.centerCards[index],
        index: index + 1
      };
    });
    
    // Find hunter victim if any
    const hunterVictim = gameRoom.hunterVictimId 
      ? gameRoom.players.find(player => player.id === gameRoom.hunterVictimId)
      : null;
    
    // Determine winner background gradients
    const winnerBackgroundClass = gameRoom.winningTeam === 'werewolf' 
      ? 'bg-gradient-to-br from-red-900/80 to-gray-900' 
      : gameRoom.winningTeam === 'village' 
        ? 'bg-gradient-to-br from-blue-900/80 to-gray-900' 
        : gameRoom.winningTeam === 'tanner'
          ? 'bg-gradient-to-br from-amber-900/80 to-gray-900'
          : 'bg-gray-900';
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Winner Banner */}
        <div className={`${winnerBackgroundClass} rounded-xl p-8 mb-10 shadow-2xl text-center`}>
          <h2 className={`text-5xl font-bold mb-4 ${
            gameRoom.winningTeam === 'werewolf' ? 'text-red-400' : 
            gameRoom.winningTeam === 'village' ? 'text-blue-400' : 
            gameRoom.winningTeam === 'tanner' ? 'text-amber-400' : 'text-white'
          }`}>
            {gameRoom.winningTeam === 'werewolf' && '🐺 Werewolves Win!'}
            {gameRoom.winningTeam === 'village' && '🏠 Villagers Win!'}
            {gameRoom.winningTeam === 'tanner' && '⚰️ Tanner Wins!'}
            {!gameRoom.winningTeam && 'Game Over'}
          </h2>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {gameRoom.winningTeam === 'werewolf' && 'No werewolf was eliminated. The werewolves have infiltrated the village!'}
            {gameRoom.winningTeam === 'village' && 'A werewolf was eliminated. The village is safe!'}
            {gameRoom.winningTeam === 'tanner' && 'The Tanner was eliminated. Their wish for death has been fulfilled!'}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Eliminated Section */}
          <div className="md:col-span-1">
            {/* Eliminated Players Section */}
            {eliminatedPlayers.length > 0 && (
              <div className="bg-gray-800/80 rounded-xl shadow-xl overflow-hidden mb-8">
                <div className="bg-red-900/30 px-6 py-4 border-b border-red-900/50">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-2">☠️</span> Eliminated Players
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {eliminatedPlayers.map(player => (
                      <div key={player.id} className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                        <div className="w-[120px] flex-shrink-0">
                          <Card 
                            role={player.currentRole || 'villager'}
                            isRevealed={true}
                            size="md"
                            hideDescription={true}
                          />
                        </div>
                        
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-1">{player.name}</h4>
                          <p className={`text-lg font-medium ${
                            player.currentRole === 'werewolf' ? 'text-red-400' : 
                            player.currentRole === 'tanner' ? 'text-amber-400' :
                            'text-blue-400'
                          }`}>
                            {player.currentRole ? player.currentRole.charAt(0).toUpperCase() + player.currentRole.slice(1) : 'Villager'}
                          </p>
                          
                          {player.originalRole !== player.currentRole && (
                            <p className="text-sm text-gray-400 mt-1">
                              Started as: {player.originalRole ? player.originalRole.charAt(0).toUpperCase() + player.originalRole.slice(1) : 'Villager'}
                            </p>
                          )}
                          
                          <div className="mt-2 flex items-center gap-2">
                            <span className="bg-red-900/50 text-red-200 text-sm px-2 py-1 rounded">
                              {gameRoom.voteCounts ? gameRoom.voteCounts[player.id] || 0 : 0} votes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {hunterVictim && (
                    <div className="mt-6 bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                      <p className="text-yellow-400 mb-3 font-semibold flex items-center">
                        <span className="mr-2">🏹</span> Hunter's Last Shot
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-[100px] flex-shrink-0">
                          <Card 
                            role={hunterVictim.currentRole || 'villager'}
                            isRevealed={true}
                            size="md"
                            hideDescription={true}
                          />
                        </div>
                        <div>
                          <p className="text-white font-medium">{hunterVictim.name}</p>
                          <p className="text-sm text-gray-300">
                            {hunterVictim.currentRole ? hunterVictim.currentRole.charAt(0).toUpperCase() + hunterVictim.currentRole.slice(1) : 'Villager'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Eliminated Center Cards Section */}
            {eliminatedCenterCards.length > 0 && (
              <div className="bg-gray-800/80 rounded-xl shadow-xl overflow-hidden mb-8">
                <div className="bg-purple-900/30 px-6 py-4 border-b border-purple-900/50">
                  <h3 className="text-2xl font-bold text-white flex items-center">
                    <span className="mr-2">🃏</span> Eliminated Center Cards
                  </h3>
                </div>
                
                <div className="p-6">
                  <div className="space-y-6">
                    {eliminatedCenterCards.map(({ id, card, index }) => (
                      <div key={id} className="flex items-center gap-4 bg-gray-700/50 p-4 rounded-lg border border-gray-600/50">
                        <div className="w-[120px] flex-shrink-0">
                          <Card 
                            role={card.role}
                            isRevealed={true}
                            size="md"
                            hideDescription={true}
                          />
                        </div>
                        
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-1">Center Card {index}</h4>
                          <p className={`text-lg font-medium ${
                            card.role === 'werewolf' ? 'text-red-400' : 
                            card.role === 'tanner' ? 'text-amber-400' :
                            'text-blue-400'
                          }`}>
                            {card.role.charAt(0).toUpperCase() + card.role.slice(1)}
                          </p>
                          
                          <div className="mt-2 flex items-center gap-2">
                            <span className="bg-red-900/50 text-red-200 text-sm px-2 py-1 rounded">
                              {gameRoom.voteCounts ? gameRoom.voteCounts[id] || 0 : 0} votes
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Final Roles Section */}
          <div className="md:col-span-2">
            <div className="bg-gray-800/80 rounded-xl shadow-xl overflow-hidden mb-8">
              <div className="bg-indigo-900/30 px-6 py-4 border-b border-indigo-900/50">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <span className="mr-2">🎭</span> Final Roles
                </h3>
              </div>
              
              <div className="p-6">
                {/* Players Final Roles */}
                <h4 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center">
                  <span className="mr-2">👥</span> Players
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                  {gameRoom.players.map(player => {
                    const voteCount = gameRoom.voteCounts ? gameRoom.voteCounts[player.id] || 0 : 0;
                    const eliminatedIds = gameRoom.eliminatedPlayerIds || [];
                    const isEliminated = eliminatedIds.includes(player.id) || player.id === gameRoom.hunterVictimId;
                    
                    // Border colors based on role team
                    const teamBorderClass = player.currentRole === 'werewolf' 
                      ? 'border-red-700/70' 
                      : player.currentRole === 'tanner' 
                        ? 'border-amber-700/70' 
                        : 'border-blue-700/70';
                    
                    // Background based on elimination status
                    const bgClass = isEliminated 
                      ? 'bg-gray-700/70 border-2 border-red-700/70' 
                      : `bg-gray-700/30 border ${teamBorderClass}`;
                    
                    return (
                      <div 
                        key={player.id} 
                        className={`rounded-lg overflow-hidden ${bgClass} transition-all hover:shadow-lg`}
                      >
                        <div className={`p-1 ${
                          player.currentRole === 'werewolf' ? 'bg-gradient-to-r from-red-900 to-gray-800' : 
                          player.currentRole === 'tanner' ? 'bg-gradient-to-r from-amber-900 to-gray-800' :
                          'bg-gradient-to-r from-blue-900 to-gray-800'
                        }`}>
                          <div className="bg-gray-800 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                              {isEliminated && (
                                <span className="bg-red-900/70 text-white text-xs px-2 py-1 rounded-full">
                                  Eliminated
                                </span>
                              )}
                            </div>
                            
                            <div className="flex justify-center mb-3">
                              <Card 
                                role={player.currentRole || 'villager'}
                                isRevealed={true}
                                size="md"
                                hideDescription={true}
                                className="mx-auto transform hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            
                            <p className={`text-center font-semibold ${
                              player.currentRole === 'werewolf' ? 'text-red-400' : 
                              player.currentRole === 'tanner' ? 'text-amber-400' :
                              'text-blue-400'
                            }`}>
                              {player.currentRole ? player.currentRole.charAt(0).toUpperCase() + player.currentRole.slice(1) : 'Villager'}
                            </p>
                            
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                              {player.originalRole !== player.currentRole && (
                                <p className="text-sm text-gray-400 flex justify-between">
                                  <span>Started as:</span>
                                  <span className="font-medium">{player.originalRole ? player.originalRole.charAt(0).toUpperCase() + player.originalRole.slice(1) : 'Villager'}</span>
                                </p>
                              )}
                              
                              <p className="text-sm text-gray-400 flex justify-between">
                                <span>Votes received:</span>
                                <span className="font-medium">{voteCount}</span>
                              </p>
                              
                              {player.votedFor && (
                                <p className="text-sm text-gray-400 flex justify-between">
                                  <span>Voted for:</span>
                                  <span className="font-medium truncate max-w-[120px]">
                                    {player.votedFor.startsWith('center-') 
                                      ? `Center ${parseInt(player.votedFor.replace('center-', ''))}` 
                                      : gameRoom.players.find(p => p.id === player.votedFor)?.name}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Center Cards Final Roles */}
                <h4 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center">
                  <span className="mr-2">🃏</span> Center Cards
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {gameRoom.centerCards.map((card, index) => {
                    const cardId = `center-${index + 1}`;
                    const voteCount = gameRoom.voteCounts ? gameRoom.voteCounts[cardId] || 0 : 0;
                    const eliminatedIds = gameRoom.eliminatedPlayerIds || [];
                    const isEliminated = eliminatedIds.includes(cardId);
                    
                    // Border colors based on role team
                    const teamBorderClass = card.role === 'werewolf' 
                      ? 'border-red-700/70' 
                      : card.role === 'tanner' 
                        ? 'border-amber-700/70' 
                        : 'border-blue-700/70';
                    
                    // Background based on elimination status
                    const bgClass = isEliminated 
                      ? 'bg-gray-700/70 border-2 border-red-700/70' 
                      : `bg-gray-700/30 border ${teamBorderClass}`;
                    
                    return (
                      <div 
                        key={cardId} 
                        className={`rounded-lg overflow-hidden ${bgClass} transition-all hover:shadow-lg`}
                      >
                        <div className={`p-1 ${
                          card.role === 'werewolf' ? 'bg-gradient-to-r from-red-900 to-gray-800' : 
                          card.role === 'tanner' ? 'bg-gradient-to-r from-amber-900 to-gray-800' :
                          'bg-gradient-to-r from-blue-900 to-gray-800'
                        }`}>
                          <div className="bg-gray-800 p-4 rounded-md">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-semibold text-white">Center Card {index + 1}</h4>
                              {isEliminated && (
                                <span className="bg-red-900/70 text-white text-xs px-2 py-1 rounded-full">
                                  Eliminated
                                </span>
                              )}
                            </div>
                            
                            <div className="flex justify-center mb-3">
                              <Card 
                                role={card.role}
                                isRevealed={true}
                                size="md"
                                hideDescription={true}
                                className="mx-auto transform hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            
                            <p className={`text-center font-semibold ${
                              card.role === 'werewolf' ? 'text-red-400' : 
                              card.role === 'tanner' ? 'text-amber-400' :
                              'text-blue-400'
                            }`}>
                              {card.role.charAt(0).toUpperCase() + card.role.slice(1)}
                            </p>
                            
                            <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                              <p className="text-sm text-gray-400 flex justify-between">
                                <span>Votes received:</span>
                                <span className="font-medium">{voteCount}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-10 flex justify-center gap-6">
          <Button 
            size="lg" 
            onClick={() => {
              if (currentPlayer.isHost) {
                playAgain();
              } else {
                setToast("Waiting for the host to start a new game. Only the host can restart the game.");
              }
            }}
            className="px-8 py-3 text-lg"
          >
            {currentPlayer.isHost ? "Play Again" : "Ready for Next Game"}
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg"
            onClick={leaveRoom}
            className="px-8 py-3 text-lg"
          >
            Leave Game
          </Button>
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
        size="2xl"
      >
        <div className="flex flex-col md:flex-row items-start gap-8 py-4">
          {/* Card section - much larger card filling the left side */}
          <div className="flex flex-col items-center md:w-1/3 my-4">
            <div className="h-[500px] w-[350px] flex items-center justify-center mx-auto">
              <Card 
                role={roleToShow}
                isRevealed={true}
                size="lg"
                className="w-full h-full"
              />
            </div>
          </div>
          
          {/* Role details section */}
          <div className="flex-1 flex flex-col md:w-2/3 md:pl-8 mt-8 md:mt-16">
            <h3 className="text-3xl font-bold text-white mb-3">{name}</h3>
            
            <p className="text-lg text-gray-400 mb-5">
              {team === 'werewolf' ? 'Werewolf Team' : 
               team === 'village' ? 'Village Team' : 'Tanner (Independent)'}
            </p>
            
            <p className="text-gray-300 text-xl mb-8 leading-relaxed">{description}</p>
            
            {gameRoom.phase === 'night' && roleShownAtNightStart && (
              <div className="bg-yellow-900/40 p-5 border border-yellow-700/30 rounded-lg w-full mb-6">
                <p className="text-yellow-300 font-semibold flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Remember Your Role
                </p>
                <p className="text-gray-300">
                  Memorize your role now! In One Night Werewolf, you only see your role at the beginning of the night.
                </p>
                {!canViewRoleDuringNight && !currentPlayer.isHost && (
                  <p className="text-yellow-400 mt-2 text-sm">
                    This window will close automatically, and you won't be able to see your role again until the results phase.
                  </p>
                )}
                {canViewRoleDuringNight && !currentPlayer.isHost && (
                  <p className="text-yellow-400 mt-2 text-sm">
                    Since you have a special role, you'll be able to view your card again during the night phase.
                  </p>
                )}
                {currentPlayer.isHost && (
                  <p className="text-yellow-400 mt-2 text-sm">
                    As the host, you can view your role at any time during the night phase.
                  </p>
                )}
              </div>
            )}
            
            {gameRoom.phase === 'day' && currentPlayer.isHost && (
              <div className="bg-blue-900/40 p-5 border border-blue-700/30 rounded-lg w-full mb-6">
                <p className="text-blue-300 font-semibold flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Host View
                </p>
                <p className="text-gray-300">
                  As the host, you can view roles during the day phase. Regular players only see their roles at the beginning of the night and during the results phase.
                </p>
              </div>
            )}
            
            {gameRoom.phase === 'results' && currentPlayer.isHost && (
              <div className="bg-blue-900/40 p-5 border border-blue-700/30 rounded-lg w-full mb-6">
                <p className="text-blue-300 font-semibold flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Host View
                </p>
                <p className="text-gray-300">
                  As the host, you can see your final role. All players can now see their final roles during the results phase.
                </p>
              </div>
            )}
            
            {originalRole === 'robber' && currentPlayer.robbedRole && (
              <div className="bg-gray-800 p-5 rounded-lg w-full mb-6">
                <p className="text-yellow-400 text-md mb-2">Robber Result</p>
                <p className="text-gray-300 mb-4">
                  You robbed <span className="font-semibold">{currentPlayer.robbedRole.targetPlayerName}</span> and took their role.
                </p>
                
                <div className="flex justify-center gap-8 mt-4 mb-4">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">Your Original Role</p>
                    <Card 
                      role="robber" 
                      isRevealed={true}
                      size="md"
                      hideDescription={true}
                      className="mb-2"
                    />
                    <p className="font-semibold text-indigo-400">
                      Robber
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
                    <p className="text-sm text-gray-500 mb-2">Your New Role</p>
                    <Card 
                      role={currentPlayer.robbedRole.targetRole || 'villager'} 
                      isRevealed={true}
                      size="md"
                      hideDescription={true}
                      className="mb-2"
                    />
                    <p className="font-semibold text-indigo-400">
                      {currentPlayer.robbedRole.targetRole 
                        ? currentPlayer.robbedRole.targetRole.charAt(0).toUpperCase() + currentPlayer.robbedRole.targetRole.slice(1) 
                        : 'Villager'}
                    </p>
                  </div>
                </div>
                
                <p className="text-yellow-400 mt-2 text-sm text-center">
                  Remember your new role! The other player won't know their role has changed.
                </p>
              </div>
            )}
            
            {roleChanged && (
              <div className="bg-gray-800 p-5 rounded-lg w-full mb-6">
                <p className="text-yellow-400 text-md mb-2">Role Change</p>
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
              <div className="bg-indigo-900/50 p-5 rounded-lg w-full mb-6">
                <p className="text-indigo-300 font-semibold mb-2">Night Action</p>
                <p className="text-gray-300">
                  You'll be woken up to perform your {roleData[roleToShow].nightAction} action when it's your turn.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center mt-10">
          <Button size="lg" onClick={() => setShowRoleModal(false)}>
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
                        hideDescription={true}
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
                            hideDescription={true}
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
            
            {hasSelectedPlayer && (
              <div className="mt-4 bg-indigo-900/30 border border-indigo-700 rounded-lg p-4">
                <p className="text-indigo-300 font-semibold mb-2">
                  You've selected {selectedPlayer?.name} to rob
                </p>
                <p className="text-gray-300">
                  When you click Submit, your card will be swapped with {selectedPlayer?.name}'s card.
                  You'll then see your new role, but {selectedPlayer?.name} won't know their role has changed.
                </p>
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
                        role="villager" 
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
              disabled={(() => {
                // Determine if the submit button should be disabled based on the current action
                if (action === 'seer') {
                  return !(
                    (seerSelection.type === 'player' && seerSelection.targets.length === 1) || 
                    (seerSelection.type === 'center' && seerSelection.targets.length === 2)
                  );
                }
                if (action === 'troublemaker') {
                  return troublemakerTargets.length !== 2;
                }
                if (action === 'robber') {
                  return !robberTarget;
                }
                if (action === 'drunk') {
                  return !drunkTarget;
                }
                return false;
              })()}
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
        {toast && (
          <Toast 
            message={toast} 
            onClose={() => setToast(null)} 
          />
        )}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
          onConfirm={() => {
            confirmModal.onConfirm();
            setConfirmModal({ ...confirmModal, isOpen: false });
          }}
          title={confirmModal.title}
          message={confirmModal.message}
        />
      </main>
    </div>
  );
};

export default GamePage;