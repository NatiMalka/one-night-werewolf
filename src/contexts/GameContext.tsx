import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import firebaseGameService from '../utils/firebaseGameService';
import { GameRoom, Player, Role, ChatMessage, NightAction } from '../types';
import { dealRoles } from '../utils/gameUtils';

interface GameContextProps {
  gameRoom: GameRoom | null;
  currentPlayer: Player | null;
  chatMessages: ChatMessage[];
  playerVotes: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  enableVoiceNarration: boolean;
  setEnableVoiceNarration: (enabled: boolean) => void;
  createRoom: (playerName: string) => Promise<string>;
  joinRoom: (roomCode: string, playerName: string) => Promise<void>;
  leaveRoom: () => void;
  startGame: (selectedRoles: Role[]) => Promise<void>;
  performNightAction: (action: NightAction, actionData: Record<string, unknown>) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  votePlayer: (targetId: string) => Promise<void>;
  setReady: (isReady: boolean) => Promise<void>;
  playAgain: () => Promise<void>;
  skipCurrentNightAction: () => Promise<void>;
  startVotingPhase: () => Promise<void>;
  kickPlayer: (playerId: string) => Promise<void>;
}

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [playerVotes, setPlayerVotes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [enableVoiceNarration, setEnableVoiceNarration] = useState<boolean>(
    // Default to true, but respect saved preference
    localStorage.getItem('enableVoiceNarration') !== 'false'
  );
  
  // Save voice narration preference when it changes
  useEffect(() => {
    localStorage.setItem('enableVoiceNarration', String(enableVoiceNarration));
  }, [enableVoiceNarration]);
  
  const navigate = useNavigate();
  
  // Load room from URL parameter
  useEffect(() => {
    const loadRoomFromURL = async () => {
      // Extract room code from URL path
      const pathParts = window.location.pathname.split('/');
      const roomCodeIndex = pathParts.findIndex(part => part === 'room') + 1;
      const roomCode = roomCodeIndex > 0 && roomCodeIndex < pathParts.length 
        ? pathParts[roomCodeIndex]
        : null;
      
      console.log("GameContext: Getting room code from URL path:", roomCode);
      
      if (!roomCode) {
        // Not in a room, no need to load anything
        setIsLoading(false);
        return;
      }
      
      // Get stored player ID for this room
      const storedPlayerId = localStorage.getItem(`player_${roomCode}`);
      console.log("GameContext: Found stored player ID?", !!storedPlayerId, "for room", roomCode);
      
      if (roomCode && storedPlayerId) {
        // Attempt to reconnect to room
        try {
          setIsLoading(true);
          setError(null);
          
          // Set up room listener
          const unsubscribe = firebaseGameService.onRoomUpdate(roomCode, (updatedRoom) => {
            console.log("Room update received:", updatedRoom);
            setGameRoom(updatedRoom);
            
            // Find current player
            const player = updatedRoom.players.find(p => p.id === storedPlayerId);
            if (player) {
              console.log("Found player in room:", player.name);
              setCurrentPlayer(player);
            } else {
              // Player no longer exists in room
              console.log("Player not found in room, redirecting to home");
              localStorage.removeItem(`player_${roomCode}`);
              setError("You are no longer a player in this room");
              navigate('/');
            }
            
            setIsLoading(false);
          });
          
          // Set up chat listener
          const chatUnsubscribe = firebaseGameService.onChatUpdate(roomCode, (messages) => {
            setChatMessages(messages.sort((a, b) => a.timestamp - b.timestamp));
          });
          
          // Clean up when component unmounts
          return () => {
            unsubscribe();
            chatUnsubscribe();
          };
          
        } catch (error) {
          console.error("Error reconnecting to room:", error);
          setError("Failed to reconnect to game room");
          setIsLoading(false);
        }
      } else if (roomCode) {
        // We have a room code but no stored player ID
        // This is likely direct navigation to a room URL
        console.log("No stored player for room:", roomCode);
        setError("You're not a player in this room");
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    };
    
    loadRoomFromURL();
    // Listen for URL changes to reload the room
    window.addEventListener('popstate', loadRoomFromURL);
    
    return () => {
      window.removeEventListener('popstate', loadRoomFromURL);
    };
  }, [navigate]);
  
  // Process votes whenever game room updates
  useEffect(() => {
    if (gameRoom && gameRoom.phase === 'voting') {
      const votes: Record<string, number> = {};
      
      // Count votes for each player
      gameRoom.players.forEach(player => {
        if (player.votedFor) {
          votes[player.votedFor] = (votes[player.votedFor] || 0) + 1;
        }
      });
      
      setPlayerVotes(votes);
    }
  }, [gameRoom]);
  
  // Handle night timer
  useEffect(() => {
    if (gameRoom?.phase === 'night' && gameRoom.nightTimeRemaining > 0) {
      // Don't update timer if auto-skipping is in progress
      if (gameRoom.isAutoSkipping) {
        console.log("Timer paused - auto-skipping in progress");
        return;
      }
      
      console.log(`Setting up night timer for ${gameRoom.currentNightAction} with ${gameRoom.nightTimeRemaining} seconds`);
      
      // Set up timer to update every second
      const timer = setInterval(() => {
        setGameRoom(prevRoom => {
          if (!prevRoom) return null;
          
          // Don't update timer if auto-skipping flag has been set
          if (prevRoom.isAutoSkipping) {
            console.log("Auto-skipping detected, pausing timer");
            return prevRoom;
          }
          
          const newTimeRemaining = Math.max(0, prevRoom.nightTimeRemaining - 1);
          
          // If timer reaches 0, just keep it at 0 and wait for server update
          // Do not trigger any game progression actions on the client
          if (newTimeRemaining === 0) {
            console.log("Night timer reached 0 - waiting for server update");
            // No action needed - server will handle this with random timing
          }
          
          return {
            ...prevRoom,
            nightTimeRemaining: newTimeRemaining
          };
        });
      }, 1000);
      
      return () => {
        console.log("Cleaning up night timer");
        clearInterval(timer);
      };
    }
  }, [gameRoom?.phase, gameRoom?.nightTimeRemaining, gameRoom?.isAutoSkipping, gameRoom?.currentNightAction]);
  
  // Handle day timer
  useEffect(() => {
    if (gameRoom?.phase === 'day' && gameRoom.dayTimeRemaining > 0) {
      // Set up timer to update every second
      const timer = setInterval(() => {
        setGameRoom(prevRoom => {
          if (!prevRoom) return null;
          
          const newTimeRemaining = Math.max(0, prevRoom.dayTimeRemaining - 1);
          
          // If timer reaches 0, move to voting phase
          if (newTimeRemaining === 0) {
            // This will be handled by Firebase functions
            console.log("Day timer reached 0");
          }
          
          return {
            ...prevRoom,
            dayTimeRemaining: newTimeRemaining
          };
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameRoom?.phase, gameRoom?.dayTimeRemaining]);
  
  // Create a new game room
  const createRoom = async (playerName: string): Promise<string> => {
    try {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const playerId = uuidv4();
      
      const player: Player = {
        id: playerId,
        name: playerName,
        isHost: true,
        isReady: false,
        originalRole: null,
        currentRole: null,
        votedFor: null,
        isConnected: true,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerId}`
      };
      
      await firebaseGameService.joinRoom(roomCode, player);
      
      // Store player ID for reconnection
      localStorage.setItem(`player_${roomCode}`, playerId);
      
      return roomCode;
    } catch (error) {
      console.error("Error creating room:", error);
      setError("Failed to create game room");
      throw error;
    }
  };
  
  // Join an existing game room
  const joinRoom = async (roomCode: string, playerName: string): Promise<void> => {
    try {
      const playerId = uuidv4();
      
      const player: Player = {
        id: playerId,
        name: playerName,
        isHost: false,
        isReady: false,
        originalRole: null,
        currentRole: null,
        votedFor: null,
        isConnected: true,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${playerId}`
      };
      
      await firebaseGameService.joinRoom(roomCode, player);
      
      // Store player ID for reconnection
      localStorage.setItem(`player_${roomCode}`, playerId);
      
    } catch (error) {
      console.error("Error joining room:", error);
      setError("Failed to join game room");
      throw error;
    }
  };
  
  // Leave the current game room
  const leaveRoom = async () => {
    if (gameRoom && currentPlayer) {
      try {
        await firebaseGameService.leaveRoom(gameRoom.code, currentPlayer.id);
        localStorage.removeItem(`player_${gameRoom.code}`);
        navigate('/');
      } catch (error) {
        console.error("Error leaving room:", error);
        setError("Failed to leave game room");
      }
    } else {
      navigate('/');
    }
  };
  
  // Start the game with selected roles
  const startGame = async (selectedRoles: Role[]): Promise<void> => {
    if (!gameRoom) return;
    
    try {
      console.log("Starting game with selected roles:", selectedRoles);
      
      // Deal roles to players
      const { players: playersWithRoles, centerCards } = dealRoles(
        gameRoom.players,
        selectedRoles
      );
      
      console.log("Roles assigned:", playersWithRoles);
      
      // Create a mapping of player IDs to roles for Firebase
      const playerRolesUpdate: Record<string, unknown> = {};
      playersWithRoles.forEach(player => {
        // Create an entry for each player with their role
        playerRolesUpdate[`players/${player.id}/originalRole`] = player.originalRole;
        playerRolesUpdate[`players/${player.id}/currentRole`] = player.currentRole;
      });
      
      // Update local players with roles for immediate UI update
      const updatedPlayers = gameRoom.players.map(player => {
        const assignedPlayer = playersWithRoles.find(p => p.id === player.id);
        return {
          ...player,
          originalRole: assignedPlayer?.originalRole || null,
          currentRole: assignedPlayer?.currentRole || null
        };
      });
      
      // Optimistically update UI
      setGameRoom(prev => prev ? {
        ...prev,
        players: updatedPlayers,
        centerCards
      } : null);
      
      // First start the game on the server
      await firebaseGameService.startGame(gameRoom.code, selectedRoles);
      
      // Then update player roles in Firebase
      const updates: Record<string, unknown> = {
        ...playerRolesUpdate,
        centerCards: centerCards,
        antiCache: Date.now().toString()
      };
      
      console.log("Updating Firebase with roles:", updates);
      await firebaseGameService.updateRoomData(gameRoom.code, updates);
      
    } catch (error) {
      console.error("Error starting game:", error);
      setError("Failed to start game");
      throw error;
    }
  };
  
  // Perform a night action
  const performNightAction = async (action: NightAction, actionData: Record<string, unknown> = {}): Promise<void> => {
    if (!gameRoom || !gameRoom.code) {
      setError("No active game room");
      return;
    }

    try {
      console.log(`Performing night action: ${action} with data:`, actionData);
      await firebaseGameService.performNightAction(gameRoom.code, action, actionData);
      console.log(`Night action ${action} completed successfully`);
    } catch (error) {
      console.error("Error performing night action:", error);
      setError("Failed to perform night action");
      throw error;
    }
  };
  
  // Send a chat message
  const sendChatMessage = async (messageText: string): Promise<void> => {
    if (!gameRoom || !currentPlayer) return;
    
    try {
      const message: ChatMessage = {
        id: uuidv4(),
        playerId: currentPlayer.id,
        playerName: currentPlayer.name,
        content: messageText,
        timestamp: Date.now(),
        isSystemMessage: false
      };
      
      await firebaseGameService.sendChatMessage(gameRoom.code, message);
    } catch (error) {
      console.error("Error sending chat message:", error);
      setError("Failed to send message");
      throw error;
    }
  };
  
  // Vote for a player or center card
  const votePlayer = async (targetId: string): Promise<void> => {
    if (!gameRoom || !currentPlayer) return;
    
    try {
      // targetId can be either a player ID or a center card ID (e.g., "center-1")
      await firebaseGameService.castVote(gameRoom.code, currentPlayer.id, targetId);
    } catch (error) {
      console.error("Error voting for target:", error);
      setError("Failed to cast vote");
      throw error;
    }
  };
  
  // Set player ready state
  const setReady = async (isReady: boolean): Promise<void> => {
    if (!gameRoom || !currentPlayer) return;
    
    try {
      await firebaseGameService.setReady(gameRoom.code, currentPlayer.id, isReady);
    } catch (error) {
      console.error("Error setting ready state:", error);
      setError("Failed to set ready state");
      throw error;
    }
  };
  
  // Play again with same players
  const playAgain = async (): Promise<void> => {
    if (!gameRoom || !currentPlayer || !currentPlayer.isHost) return;
    
    try {
      console.log("Restarting game with same players");
      
      // Create player updates - reset roles and ready states
      const playerUpdates: Record<string, unknown> = {};
      gameRoom.players.forEach(player => {
        playerUpdates[`players/${player.id}/isReady`] = false;
        playerUpdates[`players/${player.id}/originalRole`] = null;
        playerUpdates[`players/${player.id}/currentRole`] = null;
        playerUpdates[`players/${player.id}/votedFor`] = null;
      });
      
      // Reset the entire game state in Firebase
      await firebaseGameService.updateRoomData(gameRoom.code, {
        phase: 'lobby',
        ...playerUpdates,
        centerCards: [],
        nightActionsCompleted: [],
        currentNightAction: null,
        winningTeam: null,
        eliminatedPlayerIds: null,
        hunterVictimId: null,
        voteCounts: null,
        antiCache: Date.now().toString()
      });
      
      // Send a system message to chat
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        playerId: "system",
        playerName: "System",
        content: `🔄 ${currentPlayer.name} has started a new game with the same players.`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      await firebaseGameService.sendChatMessage(gameRoom.code, systemMessage);
      
      // Optimistically update local state
      setGameRoom(prev => prev ? {
        ...prev,
        phase: 'lobby',
        players: prev.players.map(p => ({
          ...p,
          isReady: false,
          originalRole: null,
          currentRole: null,
          votedFor: null
        })),
        centerCards: [],
        nightActionsCompleted: [],
        winningTeam: undefined,
        eliminatedPlayerIds: undefined,
        hunterVictimId: undefined,
        voteCounts: undefined
      } : null);
      
    } catch (error) {
      console.error("Error restarting game:", error);
      setError("Failed to restart game");
      throw error;
    }
  };
  
  // Skip the current night action (host only)
  const skipCurrentNightAction = async (): Promise<void> => {
    if (!gameRoom || !currentPlayer || !currentPlayer.isHost || gameRoom.phase !== 'night') return;
    
    try {
      // Get the current night action
      const action = gameRoom.currentNightAction;
      if (!action) return;
      
      // Perform an empty action to move to the next phase
      await firebaseGameService.performNightAction(gameRoom.code, action, { skippedByHost: true });
    } catch (error) {
      console.error("Error skipping night action:", error);
      setError("Failed to skip night action");
      throw error;
    }
  };
  
  // Start the voting phase (host only)
  const startVotingPhase = async (): Promise<void> => {
    if (!gameRoom || !currentPlayer || !currentPlayer.isHost || gameRoom.phase !== 'day') return;
    
    try {
      await firebaseGameService.startVotingPhase(gameRoom.code);
    } catch (error) {
      console.error("Error starting voting phase:", error);
      setError("Failed to start voting phase");
      throw error;
    }
  };
  
  // Add the kickPlayer function
  const kickPlayer = async (playerId: string): Promise<void> => {
    if (!gameRoom || !currentPlayer || !currentPlayer.isHost) return;
    
    try {
      // Only host can kick players
      if (!currentPlayer.isHost) {
        throw new Error("Only the host can kick players");
      }
      
      // Cannot kick yourself
      if (playerId === currentPlayer.id) {
        throw new Error("You cannot kick yourself");
      }
      
      await firebaseGameService.kickPlayer(gameRoom.code, playerId);
      
      // Send a system message to chat
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        playerId: "system",
        playerName: "System",
        content: `A player has been removed from the game by the host.`,
        timestamp: Date.now(),
        isSystemMessage: true
      };
      await firebaseGameService.sendChatMessage(gameRoom.code, systemMessage);
      
    } catch (error) {
      console.error("Error kicking player:", error);
      setError("Failed to kick player");
      throw error;
    }
  };
  
  const value = {
    gameRoom,
    currentPlayer,
    chatMessages,
    playerVotes,
    isLoading,
    error,
    enableVoiceNarration,
    setEnableVoiceNarration,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    performNightAction,
    sendChatMessage,
    votePlayer,
    setReady,
    playAgain,
    skipCurrentNightAction,
    startVotingPhase,
    kickPlayer
  };
  
  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;