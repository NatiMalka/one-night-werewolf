import { database } from './firebaseConfig';
import { ref, set, push, onValue, off, remove, update, get } from 'firebase/database';
import { GameRoom, Player, Role, NightAction, ChatMessage } from '../types';

class FirebaseGameService {
  // Helper method to create an anti-cache parameter
  private getAntiCacheParam(): string {
    return `_nocache=${Date.now()}`;
  }

  // Create/join room
  joinRoom(roomCode: string, player: Player): Promise<void> {
    console.log("FirebaseGameService: Joining room", roomCode, "as", player.name, "isHost:", player.isHost);
    
    if (player.isHost) {
      // Create new game room
      console.log("Creating new room with code:", roomCode);
      const roomData = {
        code: roomCode,
        id: roomCode, // Adding id field
        players: {
          [player.id]: player
        },
        centerCards: [],
        phase: 'lobby',
        nightActionsCompleted: [],
        dayTimeRemaining: 0,
        nightTimeRemaining: 0,
        actionLog: [],
        created: Date.now(),
        antiCache: this.getAntiCacheParam() // Add anti-cache parameter
      };
      
      return set(ref(database, `rooms/${roomCode}`), roomData)
        .then(() => {
          console.log("Room created successfully:", roomCode);
          // Manually trigger an initial room update
          this.manualTriggerRoomUpdate(roomCode);
        })
        .catch(error => {
          console.error("Failed to create room:", error);
          throw error;
        });
    } else {
      // Join existing room
      console.log("Joining existing room:", roomCode);
      const updateData = {
        [player.id]: {
          ...player,
          joinTime: Date.now() // Add timestamp to player join
        }
      };
      
      return update(ref(database, `rooms/${roomCode}/players`), updateData)
      .then(() => {
        console.log("Joined existing room successfully:", roomCode);
        // Also update anti-cache parameter
        return update(ref(database, `rooms/${roomCode}`), {
          antiCache: this.getAntiCacheParam()
        });
      })
      .then(() => {
        // Manually trigger an initial room update
        this.manualTriggerRoomUpdate(roomCode);
      })
      .catch(error => {
        console.error("Failed to join room:", error);
        throw error;
      });
    }
  }

  // Helper method to manually trigger room update
  manualTriggerRoomUpdate(roomCode: string): Promise<void> {
    console.log("Manually triggering room update for:", roomCode);
    return get(ref(database, `rooms/${roomCode}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          console.log("Room data retrieved:", roomData);
          
          // Dispatch a custom event to trigger the update
          const roomUpdateEvent = new CustomEvent('roomUpdate', { 
            detail: { roomCode, roomData } 
          });
          document.dispatchEvent(roomUpdateEvent);
        } else {
          console.log("No room data found for code:", roomCode);
        }
      })
      .catch(error => {
        console.error("Error triggering room update:", error);
      });
  }

  // Leave room
  leaveRoom(roomCode: string, playerId: string): Promise<void> {
    console.log("Leaving room:", roomCode, "player:", playerId);
    
    // First update anti-cache parameter to trigger refresh for other players
    return update(ref(database, `rooms/${roomCode}`), {
      antiCache: this.getAntiCacheParam()
    })
    .then(() => {
      return remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
    })
    .then(() => {
      console.log("Left room successfully");
    })
    .catch(error => {
      console.error("Failed to leave room:", error);
      throw error;
    });
  }

  // Start game
  startGame(roomCode: string, selectedRoles: Role[]): Promise<void> {
    console.log("Starting game for room:", roomCode, "with roles:", selectedRoles);
    
    // Default night timer duration - 60 seconds
    const nightTimeRemaining = 60;
    
    // First night action (werewolves)
    const currentNightAction = 'werewolves';
    
    // Update anti-cache parameter along with game state
    return update(ref(database, `rooms/${roomCode}`), {
      phase: 'night',
      selectedRoles,
      nightTimeRemaining,
      currentNightAction,
      nightActionsCompleted: [],
      nightStartedAt: Date.now(),
      antiCache: this.getAntiCacheParam() // Add anti-cache parameter
    })
    .then(() => {
      console.log("Game started successfully");
    })
    .catch(error => {
      console.error("Failed to start game:", error);
      throw error;
    });
  }

  // Perform night action
  performNightAction(roomCode: string, action: NightAction, actionData: Record<string, unknown>): Promise<void> {
    const actionId = push(ref(database, `rooms/${roomCode}/actions`)).key;
    console.log("Performing night action:", action, "with data:", actionData);
    
    // First record the action
    return set(ref(database, `rooms/${roomCode}/actions/${actionId}`), {
      action,
      actionData,
      timestamp: Date.now()
    })
    .then(() => {
      // Get the current room data to determine next action
      return get(ref(database, `rooms/${roomCode}`));
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        // Add this action to completed actions
        const completedActions = roomData.nightActionsCompleted || [];
        completedActions.push(action);
        
        // Get all the selected roles to determine possible actions
        const selectedRoles = roomData.selectedRoles || [];
        
        // Process action effects if needed
        const roleUpdates: Record<string, unknown> = {};
        
        // Handle specific action effects
        if (action === 'drunk' && actionData.centerCardId) {
          const drunkPlayerId = Object.keys(roomData.players).find(
            id => roomData.players[id].originalRole === 'drunk'
          );
          
          if (drunkPlayerId && actionData.centerCardId) {
            const centerCardId = actionData.centerCardId as string;
            const centerCardIndex = roomData.centerCards.findIndex(
              (card: {id: string}) => card.id === centerCardId
            );
            
            if (centerCardIndex !== -1) {
              const drunkCurrentRole = roomData.players[drunkPlayerId].currentRole;
              const centerCardRole = roomData.centerCards[centerCardIndex].role;
              
              // Update the center card with the drunk's role
              roleUpdates[`centerCards/${centerCardIndex}/role`] = drunkCurrentRole;
              
              // Update the drunk's current role to the center card's role
              roleUpdates[`players/${drunkPlayerId}/currentRole`] = centerCardRole;
              
              console.log("Drunk swapped with center card:", centerCardId, 
                "drunk's new role:", centerCardRole,
                "center card's new role:", drunkCurrentRole);
            }
          }
        }
        
        // Add Robber special action handling
        if (action === 'robber' && actionData.targetPlayerId) {
          // Store the robbed card information in a special field that the robber player can access
          // This will be used to show the card when the next night action starts
          const robberPlayerId = Object.keys(roomData.players).find(
            id => roomData.players[id].originalRole === 'robber'
          );
          
          if (robberPlayerId) {
            // Store the robber result data as a separate entry that will be displayed later
            const targetPlayerId = actionData.targetPlayerId as string;
            const targetPlayer = roomData.players[targetPlayerId];
            const robberPlayer = roomData.players[robberPlayerId];
            
            // Create a notification for the robber to see when actions are complete
            roleUpdates[`players/${robberPlayerId}/robbedRole`] = {
              targetPlayerId: targetPlayerId,
              targetPlayerName: targetPlayer.name,
              targetRole: targetPlayer.currentRole,
              originalRobberRole: robberPlayer.currentRole,
            };
          }
        }
        
        // Determine potential night actions based on selected roles
        const potentialActions: NightAction[] = [];
        
        if (selectedRoles.includes('werewolf')) {
          potentialActions.push('werewolves');
        }
        if (selectedRoles.includes('seer')) {
          potentialActions.push('seer');
        }
        if (selectedRoles.includes('robber')) {
          potentialActions.push('robber');
        }
        if (selectedRoles.includes('troublemaker')) {
          potentialActions.push('troublemaker');
        }
        if (selectedRoles.includes('drunk')) {
          potentialActions.push('drunk');
        }
        if (selectedRoles.includes('insomniac')) {
          potentialActions.push('insomniac');
        }
        
        // Find next action
        let nextAction: NightAction | null = null;
        for (const potentialAction of potentialActions) {
          if (!completedActions.includes(potentialAction)) {
            nextAction = potentialAction;
            break;
          }
        }
        
        // Updates to apply
        const updates: Record<string, unknown> = {
          nightActionsCompleted: completedActions,
          antiCache: this.getAntiCacheParam(),
          ...roleUpdates
        };
        
        // If there's another action, set it and reset timer
        if (nextAction) {
          console.log("Moving to next night action:", nextAction);
          updates.currentNightAction = nextAction;
          updates.nightTimeRemaining = 60; // Reset timer for next action
        } 
        // Otherwise, move to day phase
        else {
          console.log("All night actions completed, moving to day phase");
          updates.phase = 'day';
          updates.currentNightAction = null;
          updates.dayTimeRemaining = 300; // 5 minutes for day phase
          updates.dayStartedAt = Date.now();
        }
        
        // Apply the updates
        return update(ref(database, `rooms/${roomCode}`), updates);
      }
    })
    .catch(error => {
      console.error("Error in night action:", error);
      throw error;
    });
  }

  // Send chat message
  sendChatMessage(roomCode: string, message: ChatMessage): Promise<void> {
    const messageId = message.id || push(ref(database, `rooms/${roomCode}/chat`)).key;
    console.log("Sending chat message:", message);
    
    // Add the message
    return set(ref(database, `rooms/${roomCode}/chat/${messageId}`), message)
    .then(() => {
      // Also update room's anti-cache parameter
      return update(ref(database, `rooms/${roomCode}`), {
        antiCache: this.getAntiCacheParam()
      });
    });
  }

  // Cast vote
  castVote(roomCode: string, playerId: string, votedFor: string): Promise<void> {
    console.log("Casting vote:", playerId, "voted for", votedFor);
    
    // Update the player's vote
    return update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
      votedFor
    })
    .then(() => {
      // Also update room's anti-cache parameter
      return update(ref(database, `rooms/${roomCode}`), {
        antiCache: this.getAntiCacheParam()
      });
    })
    .then(() => {
      // Check if all players have voted
      return get(ref(database, `rooms/${roomCode}`));
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        const players = Object.values(roomData.players) as Player[];
        
        // Check if all players have cast their vote
        const allVoted = players.every(player => player.votedFor);
        
        if (allVoted) {
          console.log("All players have voted, determining results");
          return this.determineGameResults(roomCode);
        }
      }
    })
    .catch(error => {
      console.error("Error casting vote:", error);
      throw error;
    });
  }

  // Move from day phase to voting phase
  startVotingPhase(roomCode: string): Promise<void> {
    console.log("Starting voting phase for room:", roomCode);
    
    return update(ref(database, `rooms/${roomCode}`), {
      phase: 'voting',
      antiCache: this.getAntiCacheParam()
    })
    .then(() => {
      console.log("Voting phase started successfully");
    })
    .catch(error => {
      console.error("Failed to start voting phase:", error);
      throw error;
    });
  }
  
  // Determine game results after all players have voted
  determineGameResults(roomCode: string): Promise<void> {
    console.log("Determining game results for room:", roomCode);
    
    return get(ref(database, `rooms/${roomCode}`))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          const players = Object.values(roomData.players) as Player[];
          
          // Count votes for each player
          const voteCounts: Record<string, number> = {};
          players.forEach(player => {
            if (player.votedFor) {
              voteCounts[player.votedFor] = (voteCounts[player.votedFor] || 0) + 1;
            }
          });
          
          // Determine which players were eliminated (highest vote count)
          const maxVotes = Math.max(...Object.values(voteCounts), 0);
          const eliminatedPlayerIds = Object.keys(voteCounts).filter(
            id => voteCounts[id] === maxVotes
          );
          
          // Check for Hunter role among eliminated
          let hunterVictimId: string | null = null;
          for (const id of eliminatedPlayerIds) {
            const player = players.find(p => p.id === id);
            if (player && player.currentRole === 'hunter') {
              // If hunter is eliminated, find who they voted for
              hunterVictimId = player.votedFor || null;
            }
          }
          
          // Determine winning team
          let winningTeam: 'village' | 'werewolf' | 'tanner' | undefined;
          
          // Tanner check first - if tanner is eliminated, tanner wins
          const tannerWins = eliminatedPlayerIds.some(id => {
            const player = players.find(p => p.id === id);
            return player && player.currentRole === 'tanner';
          });
          
          if (tannerWins) {
            winningTeam = 'tanner';
          } else {
            // Check if any werewolf was eliminated
            const werewolfEliminated = eliminatedPlayerIds.some(id => {
              const player = players.find(p => p.id === id);
              return player && player.currentRole === 'werewolf';
            });
            
            // If any werewolf was eliminated, village wins
            // Otherwise, werewolf team wins
            winningTeam = werewolfEliminated ? 'village' : 'werewolf';
          }
          
          // Update room with results
          return update(ref(database, `rooms/${roomCode}`), {
            phase: 'results',
            winningTeam: winningTeam,
            eliminatedPlayerIds: eliminatedPlayerIds,
            hunterVictimId: hunterVictimId,
            voteCounts: voteCounts,
            antiCache: this.getAntiCacheParam()
          });
        }
      })
      .catch(error => {
        console.error("Error determining game results:", error);
        throw error;
      });
  }

  // Set player ready state
  setReady(roomCode: string, playerId: string, isReady: boolean): Promise<void> {
    console.log("Setting player ready state:", playerId, "ready:", isReady);
    
    // Update player's ready state with timestamp to force refresh
    return update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
      isReady,
      readyStateChangedAt: Date.now() // Add timestamp to force refresh
    })
    .then(() => {
      // Also update room's anti-cache parameter to force update for all
      return update(ref(database, `rooms/${roomCode}`), {
        antiCache: this.getAntiCacheParam(),
        lastPlayerReadyChange: Date.now()
      });
    })
    .catch(error => {
      console.error("Error setting ready state:", error);
      throw error;
    });
  }

  // Listen for room updates
  onRoomUpdate(roomCode: string, callback: (room: GameRoom) => void): () => void {
    console.log("Setting up room update listener for room:", roomCode);
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    // Listen for custom event for immediate updates
    const customUpdateHandler = (event: CustomEvent<{roomCode: string, roomData: Record<string, unknown>}>) => {
      if (event.detail && event.detail.roomCode === roomCode) {
        const roomData = event.detail.roomData;
        if (roomData && roomData.players) {
          // Convert players object to array
          const playersArray = Object.values(roomData.players as Record<string, unknown>);
          
          // Create room object with correct structure
          const room: GameRoom = {
            ...roomData as unknown as GameRoom,
            players: playersArray as Player[]
          };
          
          console.log("Room update from custom event:", room);
          callback(room);
        }
      }
    };
    
    // Type assertion for event listener
    document.addEventListener('roomUpdate', customUpdateHandler as EventListener);
    
    // Firebase listener
    onValue(roomRef, (snapshot) => {
      console.log("Room update from Firebase for:", roomCode);
      const roomData = snapshot.val();
      if (roomData) {
        console.log("Room data received:", roomData);
        // Convert players object to array
        const playersArray = roomData.players ? 
          Object.values(roomData.players) : [];
        
        // Create room object with correct structure
        const room: GameRoom = {
          ...roomData,
          players: playersArray as Player[]
        };
        
        console.log("Processed room data:", room);
        callback(room);
      } else {
        console.log("No room data found");
      }
    }, (error) => {
      console.error("Error in room listener:", error);
    });
    
    // Return unsubscribe function
    return () => {
      off(roomRef);
      document.removeEventListener('roomUpdate', customUpdateHandler as EventListener);
      console.log("Room update listener removed for:", roomCode);
    };
  }

  // Listen for chat updates
  onChatUpdate(roomCode: string, callback: (messages: ChatMessage[]) => void): () => void {
    console.log("Setting up chat update listener for room:", roomCode);
    const chatRef = ref(database, `rooms/${roomCode}/chat`);
    
    onValue(chatRef, (snapshot) => {
      console.log("Chat update received");
      const chatData = snapshot.val();
      if (chatData) {
        const messagesArray = Object.values(chatData) as ChatMessage[];
        console.log("Chat messages:", messagesArray.length);
        callback(messagesArray);
      } else {
        console.log("No chat messages found");
        callback([]);
      }
    }, (error) => {
      console.error("Error in chat listener:", error);
    });
    
    // Return unsubscribe function
    return () => {
      off(chatRef);
      console.log("Chat update listener removed");
    };
  }

  // Generic function to update room data
  updateRoomData(roomCode: string, updates: Record<string, unknown>): Promise<void> {
    console.log("Updating room data for room:", roomCode, "with updates:", updates);
    
    return update(ref(database, `rooms/${roomCode}`), updates)
      .then(() => {
        console.log("Room data updated successfully");
      })
      .catch(error => {
        console.error("Failed to update room data:", error);
        throw error;
      });
  }
}

// Export singleton instance
export default new FirebaseGameService();