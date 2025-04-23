import { Role, Team, Player, GameRoom, NightAction, CenterCard } from '../types';

// Defining role characteristics
export const roleData: Record<Role, { 
  name: string;
  team: Team;
  description: string;
  nightOrder?: number;
  nightAction?: NightAction;
}> = {
  doppelganger: {
    name: 'Doppelgänger',
    team: 'village',
    description: 'Look at another player\'s card and assume that role.',
    nightOrder: 1,
    nightAction: 'doppelganger'
  },
  werewolf: {
    name: 'Werewolf',
    team: 'werewolf',
    description: 'Wake at night to see other werewolves. Win if no werewolf is voted out.',
    nightOrder: 2,
    nightAction: 'werewolves'
  },
  minion: {
    name: 'Minion',
    team: 'werewolf',
    description: 'Wake at night to see who the werewolves are. You win when they win.',
    nightOrder: 3,
    nightAction: 'minion'
  },
  mason: {
    name: 'Mason',
    team: 'village',
    description: 'Wake to see other masons.',
    nightOrder: 4,
    nightAction: 'mason'
  },
  seer: {
    name: 'Seer',
    team: 'village',
    description: 'Look at one player\'s role or two center cards during the night.',
    nightOrder: 5,
    nightAction: 'seer'
  },
  robber: {
    name: 'Robber',
    team: 'village',
    description: 'Swap roles with another player without seeing it.',
    nightOrder: 6,
    nightAction: 'robber'
  },
  troublemaker: {
    name: 'Troublemaker',
    team: 'village',
    description: 'Switch two other players\' roles without looking at them.',
    nightOrder: 7,
    nightAction: 'troublemaker'
  },
  drunk: {
    name: 'Drunk',
    team: 'village',
    description: 'Exchange your card with a center card without looking at it.',
    nightOrder: 8,
    nightAction: 'drunk'
  },
  insomniac: {
    name: 'Insomniac',
    team: 'village',
    description: 'Wake at the end of night to see your final role.',
    nightOrder: 9,
    nightAction: 'insomniac'
  },
  villager: {
    name: 'Villager',
    team: 'village',
    description: 'No special abilities. Win if at least one werewolf is eliminated.'
  },
  tanner: {
    name: 'Tanner',
    team: 'tanner',
    description: 'You win if you get voted out (you hate your job).'
  },
  hunter: {
    name: 'Hunter',
    team: 'village',
    description: 'If killed, you also kill the player you voted for.'
  }
};

// Generate a unique 6-digit room code
export const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Assign roles to players and center cards
export const assignRoles = (
  players: Player[], 
  selectedRoles: Role[]
): { updatedPlayers: Player[], centerCards: { id: string, role: Role }[] } => {
  // Create a copy of the selected roles
  const roles = [...selectedRoles];
  
  // Shuffle the roles
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  
  // Assign first roles to players
  const updatedPlayers = players.map((player, index) => ({
    ...player,
    originalRole: roles[index],
    currentRole: roles[index]
  }));
  
  // Remaining roles go to center
  const centerCards = roles.slice(players.length).map((role, index) => ({
    id: `center-${index + 1}`,
    role
  }));
  
  return { updatedPlayers, centerCards };
};

// Deal roles for a new game
export const dealRoles = (
  players: Player[],
  selectedRoles: Role[]
): { players: Player[], centerCards: { id: string, role: Role }[] } => {
  const result = assignRoles(players, selectedRoles);
  return {
    players: result.updatedPlayers,
    centerCards: result.centerCards
  };
};

// Get players with a specific role
export const getPlayersByRole = (players: Player[], role: Role): Player[] => {
  return players.filter(player => player.currentRole === role);
};

// Check if the village team won
export const didVillageWin = (players: Player[], voteCounts: Record<string, number>, centerCards?: CenterCard[]): boolean => {
  // Find the player(s) with the most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const votedOutIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
  
  // Check if any voted out player or center card is a werewolf
  for (const id of votedOutIds) {
    if (id.startsWith('center-') && centerCards) {
      // Check center cards
      const centerIndex = parseInt(id.replace('center-', '')) - 1;
      if (centerIndex >= 0 && centerIndex < centerCards.length) {
        if (centerCards[centerIndex].role === 'werewolf') {
          return true;
        }
      }
    } else {
      // Check players
      const player = players.find(p => p.id === id);
      if (player && player.currentRole === 'werewolf') {
        return true;
      }
    }
  }
  
  return false;
};

// Check if the werewolf team won
export const didWerewolfWin = (players: Player[], voteCounts: Record<string, number>, centerCards?: CenterCard[]): boolean => {
  // Find the player(s) with the most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const votedOutIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
  
  // Check if no werewolf was voted out (neither player nor center card)
  for (const id of votedOutIds) {
    if (id.startsWith('center-') && centerCards) {
      // Check center cards
      const centerIndex = parseInt(id.replace('center-', '')) - 1;
      if (centerIndex >= 0 && centerIndex < centerCards.length) {
        if (centerCards[centerIndex].role === 'werewolf') {
          return false; // A werewolf center card was found, werewolves lose
        }
      }
    } else {
      // Check players
      const player = players.find(p => p.id === id);
      if (player && player.currentRole === 'werewolf') {
        return false; // A werewolf player was found, werewolves lose
      }
    }
  }
  
  return true;
};

// Check if the tanner won
export const didTannerWin = (players: Player[], voteCounts: Record<string, number>, centerCards?: CenterCard[]): boolean => {
  // Find the player(s) with the most votes
  const maxVotes = Math.max(...Object.values(voteCounts));
  const votedOutIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
  
  // Check if any tanner was voted out (player or center card)
  for (const id of votedOutIds) {
    if (id.startsWith('center-') && centerCards) {
      // Check center cards
      const centerIndex = parseInt(id.replace('center-', '')) - 1;
      if (centerIndex >= 0 && centerIndex < centerCards.length) {
        if (centerCards[centerIndex].role === 'tanner') {
          return true;
        }
      }
    } else {
      // Check players
      const player = players.find(p => p.id === id);
      if (player && player.currentRole === 'tanner') {
        return true;
      }
    }
  }
  
  return false;
};

// Get next night action
export const getNextNightAction = (room: GameRoom): NightAction | undefined => {
  const nightActions: NightAction[] = [
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
  
  // Filter actions based on player roles
  const availableActions = nightActions.filter(action => {
    const roleWithAction = Object.keys(roleData).find(
      role => roleData[role as Role].nightAction === action
    ) as Role | undefined;
    
    if (!roleWithAction) return false;
    
    return room.players.some(player => player.originalRole === roleWithAction);
  });
  
  // Remove completed actions
  const remainingActions = availableActions.filter(
    action => !room.nightActionsCompleted.includes(action)
  );
  
  // Sort by night order
  remainingActions.sort((a, b) => {
    const roleA = Object.keys(roleData).find(
      role => roleData[role as Role].nightAction === a
    ) as Role;
    
    const roleB = Object.keys(roleData).find(
      role => roleData[role as Role].nightAction === b
    ) as Role;
    
    return (roleData[roleA].nightOrder || 0) - (roleData[roleB].nightOrder || 0);
  });
  
  return remainingActions[0];
};

// Get the determined winning team
export const determineWinningTeam = (
  players: Player[], 
  voteCounts: Record<string, number>,
  centerCards?: CenterCard[]
): Team | undefined => {
  if (didTannerWin(players, voteCounts, centerCards)) {
    return 'tanner';
  } else if (didVillageWin(players, voteCounts, centerCards)) {
    return 'village';
  } else if (didWerewolfWin(players, voteCounts, centerCards)) {
    return 'werewolf';
  }
  
  return undefined;
};

// Check if the hunter's ability should activate
export const shouldHunterKill = (
  players: Player[], 
  voteCounts: Record<string, number>
): Player | undefined => {
  // Find the hunter if they were voted out
  const maxVotes = Math.max(...Object.values(voteCounts));
  const votedOutIds = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);
  
  for (const id of votedOutIds) {
    const player = players.find(p => p.id === id);
    if (player && player.currentRole === 'hunter') {
      // Find who the hunter voted for
      const targetPlayer = players.find(p => p.id === player.votedFor);
      return targetPlayer;
    }
  }
  
  return undefined;
};