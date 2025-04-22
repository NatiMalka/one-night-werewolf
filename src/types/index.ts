export type Role = 
  | 'werewolf' 
  | 'villager' 
  | 'seer' 
  | 'robber' 
  | 'troublemaker' 
  | 'drunk' 
  | 'insomniac' 
  | 'tanner' 
  | 'hunter' 
  | 'mason';

export type Team = 'village' | 'werewolf' | 'tanner';

export type GamePhase = 
  | 'lobby' 
  | 'night' 
  | 'day' 
  | 'voting' 
  | 'results';

export type NightAction = 
  | 'werewolves' 
  | 'seer' 
  | 'robber' 
  | 'troublemaker' 
  | 'drunk' 
  | 'insomniac';

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  originalRole?: Role | null;
  currentRole?: Role | null;
  isConnected: boolean;
  avatar: string;
  votedFor?: string | null;
  robbedRole?: {
    targetPlayerId: string;
    targetPlayerName: string;
    targetRole: Role;
    originalRobberRole: Role;
  };
};

export type CenterCard = {
  id: string;
  role: Role;
};

export type GameRoom = {
  id: string;
  code: string;
  players: Player[];
  centerCards: CenterCard[];
  phase: GamePhase;
  currentNightAction?: NightAction;
  nightActionsCompleted: NightAction[];
  dayTimeRemaining: number;
  nightTimeRemaining: number;
  actionLog: string[];
  winningTeam?: Team;
  created: number;
  eliminatedPlayerIds?: string[];
  hunterVictimId?: string;
  voteCounts?: Record<string, number>;
  isAutoSkipping?: boolean;
};

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  timestamp: number;
  isSystemMessage: boolean;
};

export type ActionResult = {
  success: boolean;
  message: string;
};