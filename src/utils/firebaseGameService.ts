import { database } from './firebaseConfig';
import { ref, set, push, onValue, off, remove, update, get } from 'firebase/database';
import { GameRoom, Player, Role, NightAction, ChatMessage } from '../types';

class FirebaseGameService {
  // Define the roleToAction mapping at the class level
  private roleToAction: Record<Role, NightAction | null> = {
    'doppelganger': 'doppelganger',
    'werewolf': 'werewolves',
    'minion': 'minion',
    'mason': 'mason',
    'seer': 'seer',
    'robber': 'robber',
    'troublemaker': 'troublemaker',
    'drunk': 'drunk',
    'insomniac': 'insomniac',
    'villager': null,
    'tanner': null,
    'hunter': null
  };

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

  // Kick player (can only be used by host)
  kickPlayer(roomCode: string, playerId: string): Promise<void> {
    console.log("Kicking player from room:", roomCode, "player:", playerId);
    
    // Send a system message that player was kicked
    const kickMessage: ChatMessage = {
      id: Date.now().toString(),
      playerId: "system",
      playerName: "System",
      content: `⛔ A player has been removed from the game by the host.`,
      timestamp: Date.now(),
      isSystemMessage: true
    };

    // First create the system message
    return this.sendChatMessage(roomCode, kickMessage)
      .then(() => {
        // Then update anti-cache parameter to trigger refresh for all players
        return update(ref(database, `rooms/${roomCode}`), {
          antiCache: this.getAntiCacheParam()
        });
      })
      .then(() => {
        // Finally remove the player
        return remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
      })
      .then(() => {
        console.log("Player kicked successfully");
      })
      .catch(error => {
        console.error("Failed to kick player:", error);
        throw error;
      });
  }

  // Start game
  startGame(roomCode: string, selectedRoles: Role[]): Promise<void> {
    console.log("Starting game for room:", roomCode, "with roles:", selectedRoles);
    
    // Default night time is 30 seconds per action
    const nightTimeRemaining = 15; // 15 seconds per player role
    
    // Get room data first to determine the first action with the actual player roles
    return get(ref(database, `rooms/${roomCode}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          throw new Error("Room not found");
        }
        
        // Setup initial game state with TypeScript interface to avoid property errors
        interface InitialGameState {
          phase: string;
          selectedRoles: Role[];
          nightTimeRemaining: number;
          nightActionsCompleted: never[];
          nightStartedAt: number;
          antiCache: string;
          currentNightAction?: NightAction;
          dayTimeRemaining?: number;
          dayStartedAt?: number;
        }
        
        // Setup initial game state
        const initialUpdates: InitialGameState = {
          phase: 'night',
          selectedRoles,
          nightTimeRemaining,
          nightActionsCompleted: [],
          nightStartedAt: Date.now(),
          antiCache: this.getAntiCacheParam()
        };
        
        // During game setup, determine which roles are present
        // Get all the selected roles to determine possible actions
        const potentialActions: NightAction[] = [];
        
        // Add all potential night actions based on selected roles
        for (const role of selectedRoles) {
          const actionForRole = this.roleToAction[role as Role];
          if (actionForRole && !potentialActions.includes(actionForRole)) {
            potentialActions.push(actionForRole);
          }
        }
        
        // Sort the potential actions according to the standard order
        const orderedNightActions: NightAction[] = [
          'doppelganger', 
          'werewolves', 
          'minion', 
          'mason', 
          'seer', 
          'robber', 
          'troublemaker', 
          'drunk', 
          'insomniac'
        ];
        
        // Filter and sort actions based on the standard order
        const sortedPotentialActions = orderedNightActions
          .filter(action => potentialActions.includes(action));
        
        // Set the first action
        if (sortedPotentialActions.length > 0) {
          initialUpdates.currentNightAction = sortedPotentialActions[0];
        } else {
          // No night actions at all, go straight to day phase
          initialUpdates.phase = 'day';
          initialUpdates.dayTimeRemaining = 300;
          initialUpdates.dayStartedAt = Date.now();
        }
        
        // Update the game state
        return update(ref(database, `rooms/${roomCode}`), initialUpdates);
      })
      .then(() => {
        console.log("Game started successfully");
        
        // After starting the game, immediately check if the first night action needs to be skipped
        // because no player has that role
        return get(ref(database, `rooms/${roomCode}`));
      })
      .then((snapshot) => {
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          const currentAction = roomData.currentNightAction;
          
          // If there's a current action and no player has that role, skip it
          if (currentAction && this.wasActionSkippedAutomatically(currentAction, roomData.players)) {
            console.log(`${Date.now()} - First night action ${currentAction} has no players, auto-skipping in 8s...`);
            
            // Mark room as auto-skipping to pause the client timer
            update(ref(database, `rooms/${roomCode}`), {
              isAutoSkipping: true
            });
            
            // 8 second delay for auto-skip with immediate scheduling
            setTimeout(() => {
              console.log(`${Date.now()} - Executing auto-skip for ${currentAction} after 8s wait`);
              this.performNightAction(roomCode, currentAction, { autoSkipped: true })
                .catch(error => console.error("Error in auto-skip:", error));
            }, 8000); // Exactly 8 seconds
          }
        }
      })
      .catch(error => {
        console.error("Failed to start game:", error);
        throw error;
      });
  }

  // Perform night action
  performNightAction(roomCode: string, action: NightAction, actionData: Record<string, unknown>): Promise<void> {
    const actionId = push(ref(database, `rooms/${roomCode}/actions`)).key;
    const startTime = Date.now();
    console.log(`${startTime} - Performing night action:`, action, "with data:", actionData);
    
    // First record the action
    return set(ref(database, `rooms/${roomCode}/actions/${actionId}`), {
      action,
      actionData,
      timestamp: startTime
    })
    .then(() => {
      // Get the current room data to determine next action
      return get(ref(database, `rooms/${roomCode}`));
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        const players = roomData.players || {};
        
        // Define the fixed night action order
        const orderedNightActions: NightAction[] = [
          'doppelganger', 
          'werewolves', 
          'minion', 
          'mason', 
          'seer', 
          'robber', 
          'troublemaker', 
          'drunk', 
          'insomniac'
        ];
        
        // Add this action to completed actions if not already in the list
        const completedActions = roomData.nightActionsCompleted || [];
        if (!completedActions.includes(action)) {
          completedActions.push(action);
        }
        
        // Get all the selected roles to determine possible actions
        const selectedRoles = roomData.selectedRoles || [];
        
        // Process action effects if needed
        const roleUpdates: Record<string, unknown> = {};
        
        // Handle specific action effects
        if (action === 'drunk' && actionData.centerCardId) {
          const drunkPlayerId = Object.keys(players).find(
            id => players[id].originalRole === 'drunk'
          );
          
          if (drunkPlayerId && actionData.centerCardId) {
            const centerCardId = actionData.centerCardId as string;
            const centerCardIndex = roomData.centerCards.findIndex(
              (card: {id: string}) => card.id === centerCardId
            );
            
            if (centerCardIndex !== -1) {
              const drunkCurrentRole = players[drunkPlayerId].currentRole;
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
          const robberPlayerId = Object.keys(players).find(
            id => players[id].originalRole === 'robber'
          );
          
          if (robberPlayerId) {
            // Store the robber result data as a separate entry that will be displayed later
            const targetPlayerId = actionData.targetPlayerId as string;
            const targetPlayer = players[targetPlayerId];
            const robberPlayer = players[robberPlayerId];
            
            // Create a notification for the robber to see when actions are complete
            roleUpdates[`players/${robberPlayerId}/robbedRole`] = {
              targetPlayerId: targetPlayerId,
              targetPlayerName: targetPlayer.name,
              targetRole: targetPlayer.currentRole,
              originalRobberRole: robberPlayer.currentRole,
            };
            
            // Actually swap the roles in the database 
            // This ensures roles are updated before the Insomniac's turn
            const robberCurrentRole = robberPlayer.currentRole;
            const targetCurrentRole = targetPlayer.currentRole;
            
            // Update the target player's role to be the robber's role
            roleUpdates[`players/${targetPlayerId}/currentRole`] = robberCurrentRole;
            
            // Update the robber's current role to be the target's role
            roleUpdates[`players/${robberPlayerId}/currentRole`] = targetCurrentRole;
            
            console.log(`Robber (${robberPlayerId}) swapped roles with ${targetPlayerId}:`, 
              `Robber's new role: ${targetCurrentRole}`,
              `Target's new role: ${robberCurrentRole}`);
          }
        }
        
        // Add Troublemaker special action handling
        if (action === 'troublemaker' && actionData.player1Id && actionData.player2Id) {
          const player1Id = actionData.player1Id as string;
          const player2Id = actionData.player2Id as string;
          
          const player1 = players[player1Id];
          const player2 = players[player2Id];
          
          if (player1 && player2) {
            // Get current roles of both players
            const player1CurrentRole = player1.currentRole;
            const player2CurrentRole = player2.currentRole;
            
            // Swap the roles immediately in the database
            roleUpdates[`players/${player1Id}/currentRole`] = player2CurrentRole;
            roleUpdates[`players/${player2Id}/currentRole`] = player1CurrentRole;
            
            console.log(`Troublemaker swapped roles between ${player1Id} and ${player2Id}:`, 
              `${player1.name}'s new role: ${player2CurrentRole}`,
              `${player2.name}'s new role: ${player1CurrentRole}`);
          }
        }
        
        // Build list of potential actions based on selected roles
        const potentialActions: NightAction[] = [];
        for (const role of selectedRoles) {
          const actionForRole = this.roleToAction[role as Role];
          if (actionForRole && !potentialActions.includes(actionForRole)) {
            potentialActions.push(actionForRole);
          }
        }
        
        // Find the next action to perform by following the fixed order
        let nextAction: NightAction | null = null;
        const currentActionIndex = orderedNightActions.indexOf(action);
        
        // Look for the next action in the order that hasn't been completed yet
        for (let i = currentActionIndex + 1; i < orderedNightActions.length; i++) {
          const nextPossibleAction = orderedNightActions[i];
          if (potentialActions.includes(nextPossibleAction) && !completedActions.includes(nextPossibleAction)) {
            nextAction = nextPossibleAction;
            break;
          }
        }
        
        // Updates to apply
        const updates: Record<string, unknown> = {
          nightActionsCompleted: completedActions,
          antiCache: this.getAntiCacheParam(),
          ...roleUpdates
        };
        
        // Check if the current action was auto-skipped
        const wasSkippedAutomatically = 
          actionData.autoSkipped || 
          this.wasActionSkippedAutomatically(action, roomData.players);
        
        // Create a promise to handle wait time (for auto-skipped roles only)
        const handleNextAction = () => {
          // If there's another action, set it and reset timer
          if (nextAction) {
            console.log(`${Date.now()} - Moving to next night action:`, nextAction);
            updates.currentNightAction = nextAction;
            updates.nightTimeRemaining = 15; // 15 seconds for player roles
            updates.isAutoSkipping = false; // Reset auto-skipping flag
          } 
          // Otherwise, move to day phase
          else {
            console.log(`${Date.now()} - All night actions completed, moving to day phase`);
            updates.phase = 'day';
            updates.currentNightAction = null;
            updates.dayTimeRemaining = 300; // 5 minutes for day phase
            updates.dayStartedAt = Date.now();
            updates.isAutoSkipping = false; // Reset auto-skipping flag
          }
          
          // Apply the updates immediately
          return update(ref(database, `rooms/${roomCode}`), updates);
        };
        
        // For auto-skipped actions, we may need to wait
        if (wasSkippedAutomatically && !actionData.skippedByHost) {
          console.log(`${Date.now()} - No player with role needed for ${action}, simulating 8s wait...`);
          
          // Apply most updates immediately except for the next action
          const initialUpdates = {
            ...updates,
            isAutoSkipping: true  // Keep auto-skipping flag true during wait
          };
          
          // First apply the initial updates
          return update(ref(database, `rooms/${roomCode}`), initialUpdates)
            .then(() => {
              // Then set a timeout to apply the next action after 8 seconds
              return new Promise<void>(resolve => {
                setTimeout(() => {
                  console.log(`${Date.now()} - Auto-skip wait complete for ${action}, now handling next action`);
                  handleNextAction()
                    .then(() => {
                      // Check if next action needs auto-skipping
                      if (nextAction && this.wasActionSkippedAutomatically(nextAction, roomData.players)) {
                        console.log(`${Date.now()} - Next action ${nextAction} has no players, scheduling auto-skip in 8s...`);
                        
                        // Mark as auto-skipping
                        update(ref(database, `rooms/${roomCode}`), { isAutoSkipping: true })
                          .then(() => {
                            // Schedule the next auto-skip with precise timing
                            setTimeout(() => {
                              console.log(`${Date.now()} - Executing scheduled auto-skip for ${nextAction}`);
                              this.performNightAction(roomCode, nextAction, { autoSkipped: true })
                                .catch(error => console.error("Error in scheduled auto-skip:", error));
                            }, 8000); // Exactly 8 seconds
                          });
                      }
                      resolve();
                    })
                    .catch(error => {
                      console.error("Error in auto-skip handling:", error);
                      resolve();
                    });
                }, 8000); // Exactly 8 seconds
              });
            });
        } else {
          // For manual actions, apply updates immediately
          return handleNextAction()
            .then(() => {
              // Check if next action needs auto-skipping
              if (nextAction && this.wasActionSkippedAutomatically(nextAction, roomData.players)) {
                console.log(`${Date.now()} - Next action ${nextAction} has no players, scheduling auto-skip in 8s...`);
                
                // Mark as auto-skipping
                return update(ref(database, `rooms/${roomCode}`), { isAutoSkipping: true })
                  .then(() => {
                    // Schedule the next auto-skip with precise timing
                    setTimeout(() => {
                      console.log(`${Date.now()} - Executing scheduled auto-skip for ${nextAction}`);
                      this.performNightAction(roomCode, nextAction, { autoSkipped: true })
                        .catch(error => console.error("Error in scheduled auto-skip:", error));
                    }, 8000); // Exactly 8 seconds
                  });
              }
              return Promise.resolve();
            });
        }
      }
      
      return Promise.resolve(); // Added to handle the case when snapshot doesn't exist
    })
    .catch(error => {
      console.error("Error in night action:", error);
      throw error;
    });
  }
  
  // Helper to check if an action was skipped automatically because no player has the role
  private wasActionSkippedAutomatically(action: NightAction, players: Record<string, Player>): boolean {
    const roleNeededForAction: Record<NightAction, Role | null> = {
      'doppelganger': 'doppelganger',
      'werewolves': 'werewolf',
      'minion': 'minion',
      'mason': 'mason',
      'seer': 'seer',
      'robber': 'robber',
      'troublemaker': 'troublemaker',
      'drunk': 'drunk',
      'insomniac': 'insomniac'
    };
    
    const neededRole = roleNeededForAction[action];
    if (!neededRole) return false;
    
    // Check if any player has this original role
    return !Object.values(players).some(player => player.originalRole === neededRole);
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
          const centerCards = roomData.centerCards || [];
          
          // Count votes for each player and center card
          const voteCounts: Record<string, number> = {};
          players.forEach(player => {
            if (player.votedFor) {
              voteCounts[player.votedFor] = (voteCounts[player.votedFor] || 0) + 1;
            }
          });
          
          // Determine which players/cards were eliminated (highest vote count)
          const maxVotes = Math.max(...Object.values(voteCounts), 0);
          const eliminatedIds = Object.keys(voteCounts).filter(
            id => voteCounts[id] === maxVotes
          );
          
          // Check for Hunter role among eliminated players
          let hunterVictimId: string | null = null;
          for (const id of eliminatedIds) {
            // Only check actual players, not center cards
            if (!id.startsWith('center-')) {
              const player = players.find(p => p.id === id);
              if (player && player.currentRole === 'hunter') {
                // If hunter is eliminated, find who they voted for
                hunterVictimId = player.votedFor || null;
              }
            }
          }
          
          // Determine winning team
          let winningTeam: 'village' | 'werewolf' | 'tanner' | undefined;
          
          // Tanner check first - if tanner is eliminated, tanner wins
          const tannerWins = eliminatedIds.some(id => {
            if (id.startsWith('center-')) {
              // Check if the center card is a tanner
              const cardIndex = parseInt(id.replace('center-', '')) - 1;
              return centerCards[cardIndex]?.role === 'tanner';
            } else {
              // Check if the player is a tanner
              const player = players.find(p => p.id === id);
              return player && player.currentRole === 'tanner';
            }
          });
          
          if (tannerWins) {
            winningTeam = 'tanner';
          } else {
            // Check if any werewolves are in play
            const anyWerewolfInPlay = players.some(p => p.currentRole === 'werewolf');
            
            // Check if minion is in play
            const minionInPlay = players.some(p => p.currentRole === 'minion');
            
            // Check if any werewolf was eliminated (player or center card)
            const werewolfEliminated = eliminatedIds.some(id => {
              if (id.startsWith('center-')) {
                // Check if the center card is a werewolf
                const cardIndex = parseInt(id.replace('center-', '')) - 1;
                return centerCards[cardIndex]?.role === 'werewolf';
              } else {
                // Check if the player is a werewolf
                const player = players.find(p => p.id === id);
                return player && player.currentRole === 'werewolf';
              }
            });
            
            // Special minion win condition when no werewolves are in play
            if (!anyWerewolfInPlay && minionInPlay) {
              // If no werewolves in play, minion wins if ANY other player (who is not the minion) is voted out
              const anyNonMinionEliminated = eliminatedIds.some(id => {
                if (id.startsWith('center-')) {
                  return false; // Center cards don't count for this win condition
                } else {
                  const player = players.find(p => p.id === id);
                  return player && player.currentRole !== 'minion';
                }
              });
              
              // Minion (werewolf team) wins if any non-minion is eliminated
              // Village wins if no one is eliminated
              winningTeam = anyNonMinionEliminated ? 'werewolf' : 'village';
            } else {
              // Regular werewolf win condition: werewolves win if no werewolf was eliminated
              winningTeam = werewolfEliminated ? 'village' : 'werewolf';
            }
          }
          
          // Update room with results
          return update(ref(database, `rooms/${roomCode}`), {
            phase: 'results',
            winningTeam: winningTeam,
            eliminatedPlayerIds: eliminatedIds,
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