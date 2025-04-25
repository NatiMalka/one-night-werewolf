import { useEffect } from 'react';
import { usePlayerAuth } from '../contexts/PlayerAuthContext';
import { GameRoom, Role, Team } from '../types';
import { PlayerProfile } from '../types';

/**
 * Hook for tracking player stats and achievements during gameplay
 * @param gameRoom Current game room
 * @param playerId Current player ID
 */
const usePlayerStats = (gameRoom: GameRoom | null, playerId: string | null) => {
  const { 
    playerAuth, 
    incrementStat, 
    updateStat, 
    unlockAchievement 
  } = usePlayerAuth();

  // Track game completion
  useEffect(() => {
    if (!gameRoom || !playerId || !playerAuth.isAuthenticated) return;
    
    // If game phase is results, track stats
    if (gameRoom.phase === 'results' && gameRoom.winningTeam) {
      // Find player in game
      const player = gameRoom.players.find(p => p.id === playerId);
      if (!player) return;
      
      // Increment games played stat
      incrementStat('games_played', 1);
      
      // Track overall games played in profile directly
      updatePlayerGamesPlayed();
      
      // Check for first game achievement
      unlockAchievement('first_game').catch(err => console.error('Error unlocking achievement:', err));
      
      // Check if player won
      const playerRole = player.currentRole;
      const winningTeam = gameRoom.winningTeam;
      
      const playerTeam = getTeamForRole(playerRole as Role);
      const playerWon = playerTeam === winningTeam;
      
      if (playerWon) {
        // Increment wins
        incrementStat('games_won', 1);
        updatePlayerGamesWon();
        
        // Check for first win achievement
        unlockAchievement('first_win').catch(err => console.error('Error unlocking achievement:', err));
        
        // Track role-specific wins
        if (playerTeam === 'werewolf') {
          incrementStat('werewolf_wins', 1);
          trackWerewolfMasterProgress();
        } else if (playerTeam === 'village') {
          incrementStat('villager_wins', 1);
          trackVillageHeroProgress();
          
          // Track specific village roles
          if (playerRole === 'seer') {
            trackMindReaderProgress();
          } else if (playerRole === 'robber') {
            trackMasterOfDisguiseProgress();
          } else if (playerRole === 'troublemaker') {
            trackChaosAgentProgress();
          }
        } else if (playerTeam === 'tanner') {
          incrementStat('tanner_wins', 1);
        }
      }
    }
  }, [gameRoom?.phase, gameRoom?.winningTeam]);

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

  // Helper to track werewolf master achievement progress
  const trackWerewolfMasterProgress = async () => {
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
      
      // Update in database
      await updateProfileData({ achievements: updatedAchievements });
    }
  };

  // Helper to track village hero achievement progress
  const trackVillageHeroProgress = async () => {
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
      
      // Update in database
      await updateProfileData({ achievements: updatedAchievements });
    }
  };

  // Helper to track mind reader achievement progress
  const trackMindReaderProgress = async () => {
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
      
      // Update in database
      await updateProfileData({ achievements: updatedAchievements });
    }
  };

  // Helper to track master of disguise achievement progress
  const trackMasterOfDisguiseProgress = async () => {
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
      
      // Update in database
      await updateProfileData({ achievements: updatedAchievements });
    }
  };

  // Helper to track chaos agent achievement progress
  const trackChaosAgentProgress = async () => {
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
      
      // Update in database
      await updateProfileData({ achievements: updatedAchievements });
    }
  };

  // Helper to update games played in profile
  const updatePlayerGamesPlayed = async () => {
    if (!playerAuth.profile) return;
    
    const currentGamesPlayed = playerAuth.profile.gamesPlayed;
    await updateProfileData({ gamesPlayed: currentGamesPlayed + 1 });
  };

  // Helper to update games won in profile
  const updatePlayerGamesWon = async () => {
    if (!playerAuth.profile) return;
    
    const currentGamesWon = playerAuth.profile.gamesWon;
    await updateProfileData({ gamesWon: currentGamesWon + 1 });
  };

  // Helper function to update player profile
  const updateProfileData = async (updates: Partial<PlayerProfile>) => {
    try {
      if (!playerAuth.profile) {
        console.warn("❌ Cannot update profile: No player profile available");
        return;
      }
      
      // Get the correct function from the context
      const { updatePlayerProfile } = usePlayerAuth();
      
      // Update profile through context
      console.log("🔄 Updating player profile with:", updates);
      await updatePlayerProfile(updates);
      console.log("✅ Player profile update successful");
    } catch (error) {
      console.error('❌ Error updating player profile:', error);
    }
  };
};

export default usePlayerStats; 