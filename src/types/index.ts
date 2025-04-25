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
  | 'mason'
  | 'doppelganger'
  | 'minion';

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
  | 'insomniac'
  | 'doppelganger'
  | 'minion'
  | 'mason';

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
  selectedRoles: Role[];
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

export type Stat = {
  id: string;
  name: string;
  value: number;
  icon: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: number;
};

export type PlayerProfile = {
  id: string;
  displayName: string;
  email?: string;
  avatar: string;
  createdAt: number;
  lastLoginAt: number;
  stats: Stat[];
  achievements: Achievement[];
  gamesPlayed: number;
  gamesWon: number;
  favoriteRole?: Role;
  badges: string[];
  customization: {
    theme: string;
    avatarFrame?: string;
    nameColor?: string;
  };
};

export type PlayerAuth = {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: PlayerProfile | null;
  error: string | null;
};