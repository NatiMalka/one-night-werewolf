import { useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { usePlayerAuth } from '../contexts/PlayerAuthContext';
import { GamePhase, Role, Team, PlayerProfile } from '../types';

/**
 * Hook that connects game results to player profiles
 * to track stats and achievements
 */
const useGameProfileIntegration = () => {
  const { gameRoom, currentPlayer } = useGame();
  const { playerAuth, incrementStat, updateStat, unlockAchievement, updatePlayerProfile } = usePlayerAuth();
  
  // Track when a game ends
  useEffect(() => {
    if (!gameRoom || !currentPlayer || !playerAuth.isAuthenticated || !playerAuth.profile) return;
    
    // Check if game just ended
    if (gameRoom.phase === 'results' && gameRoom.winningTeam) {
      console.log('Game ended, updating player profile');
      
      // Increment games played stat
      incrementStat('games_played', 1).catch(err => 
        console.error('Error updating games played:', err)
      );
      
      // Update total games played in profile
      const updatedGamesPlayed = playerAuth.profile.gamesPlayed + 1;
      updateProfile({ gamesPlayed: updatedGamesPlayed });
      
      // Check for first game achievement
      unlockAchievement('first_game').catch(err => 
        console.error('Error unlocking achievement:', err)
      );
      
      // Get player's final role and team
      const playerRole = currentPlayer.currentRole as Role | null;
      if (!playerRole) return;
      
      const winningTeam = gameRoom.winningTeam;
      const playerTeam = getTeamForRole(playerRole);
      
      // Check if player won
      const playerWon = playerTeam === winningTeam;
      
      if (playerWon) {
        // Update win stats
        incrementStat('games_won', 1).catch(err => 
          console.error('Error updating games won:', err)
        );
        
        // Update total games won in profile
        const updatedGamesWon = playerAuth.profile.gamesWon + 1;
        updateProfile({ gamesWon: updatedGamesWon });
        
        // Check for first win achievement
        unlockAchievement('first_win').catch(err => 
          console.error('Error unlocking achievement:', err)
        );
        
        // Track team-specific wins
        if (playerTeam === 'werewolf') {
          incrementStat('werewolf_wins', 1).catch(err => 
            console.error('Error updating werewolf wins:', err)
          );
          updateWerewolfMasterProgress();
        } else if (playerTeam === 'village') {
          incrementStat('villager_wins', 1).catch(err => 
            console.error('Error updating villager wins:', err)
          );
          updateVillageHeroProgress();
          
          // Role-specific achievements
          if (playerRole === 'seer') {
            updateMindReaderProgress();
          } else if (playerRole === 'robber') {
            updateMasterOfDisguiseProgress();
          } else if (playerRole === 'troublemaker') {
            updateChaosAgentProgress();
          }
        } else if (playerTeam === 'tanner') {
          incrementStat('tanner_wins', 1).catch(err => 
            console.error('Error updating tanner wins:', err)
          );
        }
        
        // Check if player has a favorite role or if this role should become the favorite
        updateFavoriteRole(playerRole);
      }
    }
  }, [gameRoom?.phase]);
  
  // Helper to get team for a role
  const getTeamForRole = (role: Role): Team => {
    if (role === 'werewolf' || role === 'minion') {
      return 'werewolf';
    } else if (role === 'tanner') {
      return 'tanner';
    } else {
      return 'village';
    }
  };
  
  // Helper to update werewolf master achievement progress
  const updateWerewolfMasterProgress = async () => {
    if (!playerAuth.profile) return;
    
    const achievement = playerAuth.profile.achievements.find(a => a.id === 'werewolf_master');
    if (!achievement || achievement.isUnlocked) return;
    
    const newProgress = (achievement.progress || 0) + 1;
    
    if (newProgress >= (achievement.maxProgress || 5)) {
      await unlockAchievement('werewolf_master');
    } else {
      // Update achievement progress
      const updatedAchievements = playerAuth.profile.achievements.map(a => {
        if (a.id === 'werewolf_master') {
          return { ...a, progress: newProgress };
        }
        return a;
      });
      
      // Update in profile
      updateProfile({ achievements: updatedAchievements });
    }
  };
  
  // Helper to update village hero achievement progress
  const updateVillageHeroProgress = async () => {
    if (!playerAuth.profile) return;
    
    const achievement = playerAuth.profile.achievements.find(a => a.id === 'village_hero');
    if (!achievement || achievement.isUnlocked) return;
    
    const newProgress = (achievement.progress || 0) + 1;
    
    if (newProgress >= (achievement.maxProgress || 10)) {
      await unlockAchievement('village_hero');
    } else {
      // Update achievement progress
      const updatedAchievements = playerAuth.profile.achievements.map(a => {
        if (a.id === 'village_hero') {
          return { ...a, progress: newProgress };
        }
        return a;
      });
      
      // Update in profile
      updateProfile({ achievements: updatedAchievements });
    }
  };
  
  // Helper to update mind reader achievement progress
  const updateMindReaderProgress = async () => {
    if (!playerAuth.profile) return;
    
    const achievement = playerAuth.profile.achievements.find(a => a.id === 'mind_reader');
    if (!achievement || achievement.isUnlocked) return;
    
    const newProgress = (achievement.progress || 0) + 1;
    
    if (newProgress >= (achievement.maxProgress || 3)) {
      await unlockAchievement('mind_reader');
    } else {
      // Update achievement progress
      const updatedAchievements = playerAuth.profile.achievements.map(a => {
        if (a.id === 'mind_reader') {
          return { ...a, progress: newProgress };
        }
        return a;
      });
      
      // Update in profile
      updateProfile({ achievements: updatedAchievements });
    }
  };
  
  // Helper to update master of disguise achievement progress
  const updateMasterOfDisguiseProgress = async () => {
    if (!playerAuth.profile) return;
    
    const achievement = playerAuth.profile.achievements.find(a => a.id === 'master_of_disguise');
    if (!achievement || achievement.isUnlocked) return;
    
    const newProgress = (achievement.progress || 0) + 1;
    
    if (newProgress >= (achievement.maxProgress || 3)) {
      await unlockAchievement('master_of_disguise');
    } else {
      // Update achievement progress
      const updatedAchievements = playerAuth.profile.achievements.map(a => {
        if (a.id === 'master_of_disguise') {
          return { ...a, progress: newProgress };
        }
        return a;
      });
      
      // Update in profile
      updateProfile({ achievements: updatedAchievements });
    }
  };
  
  // Helper to update chaos agent achievement progress
  const updateChaosAgentProgress = async () => {
    if (!playerAuth.profile) return;
    
    const achievement = playerAuth.profile.achievements.find(a => a.id === 'chaos_agent');
    if (!achievement || achievement.isUnlocked) return;
    
    const newProgress = (achievement.progress || 0) + 1;
    
    if (newProgress >= (achievement.maxProgress || 3)) {
      await unlockAchievement('chaos_agent');
    } else {
      // Update achievement progress
      const updatedAchievements = playerAuth.profile.achievements.map(a => {
        if (a.id === 'chaos_agent') {
          return { ...a, progress: newProgress };
        }
        return a;
      });
      
      // Update in profile
      updateProfile({ achievements: updatedAchievements });
    }
  };
  
  // Helper to update favorite role
  const updateFavoriteRole = (currentRole: Role) => {
    if (!playerAuth.profile) return;
    
    // Get role play counts - would need role tracking in profile
    // For now, just set the current role as favorite if none exists
    if (!playerAuth.profile.favoriteRole) {
      updateProfile({ favoriteRole: currentRole });
    }
  };
  
  // Helper to update player profile
  const updateProfile = async (updates: Partial<PlayerProfile>) => {
    try {
      if (!playerAuth.profile || !playerAuth.isAuthenticated) {
        console.warn("❌ Cannot update profile: No authenticated player profile");
        return;
      }
      
      console.log("🔄 Updating player profile with:", updates);
      
      // Make sure we're calling the function from context, not recursively
      await updatePlayerProfile(updates);
      
      console.log("✅ Player profile updated successfully");
    } catch (error) {
      console.error('❌ Error updating player profile:', error);
    }
  };
};

export default useGameProfileIntegration; 