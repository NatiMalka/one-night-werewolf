import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User,
  signInWithRedirect,
  signInWithPopup,
  GoogleAuthProvider,
  getRedirectResult
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  off 
} from 'firebase/database';
import { auth, database } from '../utils/firebaseConfig';
import { PlayerAuth, PlayerProfile, Achievement, Stat } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PlayerAuthContextProps {
  playerAuth: PlayerAuth;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<PlayerProfile | void>;
  signOut: () => Promise<void>;
  signInAsGuest: (displayName: string) => Promise<PlayerProfile>;
  signInWithGoogle: () => Promise<void>;
  updatePlayerProfile: (updates: Partial<PlayerProfile>) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  updateStat: (statId: string, value: number) => Promise<void>;
  incrementStat: (statId: string, incrementBy: number) => Promise<void>;
}

const PlayerAuthContext = createContext<PlayerAuthContextProps | undefined>(undefined);

export const usePlayerAuth = () => {
  const context = useContext(PlayerAuthContext);
  if (!context) {
    throw new Error('usePlayerAuth must be used within a PlayerAuthProvider');
  }
  return context;
};

interface PlayerAuthProviderProps {
  children: ReactNode;
}

// Initial achievements
const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_game',
    name: 'Rookie',
    description: 'Play your first game',
    icon: '🎮',
    isUnlocked: false
  },
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    icon: '🏆',
    isUnlocked: false
  },
  {
    id: 'werewolf_master',
    name: 'Werewolf Master',
    description: 'Win 5 games as a Werewolf',
    icon: '🐺',
    isUnlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'village_hero',
    name: 'Village Hero',
    description: 'Win 10 games as a Villager',
    icon: '🏠',
    isUnlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'mind_reader',
    name: 'Mind Reader',
    description: 'Win 3 games as the Seer',
    icon: '🔮',
    isUnlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'master_of_disguise',
    name: 'Master of Disguise',
    description: 'Win 3 games as the Robber',
    icon: '🎭',
    isUnlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'chaos_agent',
    name: 'Chaos Agent',
    description: 'Win 3 games as the Troublemaker',
    icon: '🌪️',
    isUnlocked: false,
    progress: 0,
    maxProgress: 3
  }
];

// Initial stats
const DEFAULT_STATS: Stat[] = [
  {
    id: 'games_played',
    name: 'Games Played',
    value: 0,
    icon: '🎲'
  },
  {
    id: 'games_won',
    name: 'Games Won',
    value: 0,
    icon: '🏆'
  },
  {
    id: 'werewolf_wins',
    name: 'Werewolf Wins',
    value: 0,
    icon: '🐺'
  },
  {
    id: 'villager_wins',
    name: 'Villager Wins',
    value: 0,
    icon: '🏠'
  },
  {
    id: 'tanner_wins',
    name: 'Tanner Wins',
    value: 0,
    icon: '🎭'
  }
];

export const PlayerAuthProvider: React.FC<PlayerAuthProviderProps> = ({ children }) => {
  const [playerAuth, setPlayerAuth] = useState<PlayerAuth>({
    isAuthenticated: false,
    isLoading: true,
    profile: null,
    error: null
  });

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          // Get profile from database
          const profileSnapshot = await get(ref(database, `profiles/${user.uid}`));
          
          if (profileSnapshot.exists()) {
            // Profile exists, update it with user data
            const profileData = profileSnapshot.val() as PlayerProfile;
            setPlayerAuth({
              isAuthenticated: true,
              isLoading: false,
              profile: profileData,
              error: null
            });
            
            // Set up listener for real-time profile updates
            const profileRef = ref(database, `profiles/${user.uid}`);
            onValue(profileRef, (snapshot) => {
              if (snapshot.exists()) {
                setPlayerAuth(prev => ({
                  ...prev,
                  profile: snapshot.val() as PlayerProfile
                }));
              }
            });
          } else {
            // Profile doesn't exist, create one
            const newProfile: PlayerProfile = createDefaultProfile(user);
            await set(ref(database, `profiles/${user.uid}`), newProfile);
            
            setPlayerAuth({
              isAuthenticated: true,
              isLoading: false,
              profile: newProfile,
              error: null
            });
          }
        } catch (error) {
          console.error('Error loading player profile:', error);
          setPlayerAuth({
            isAuthenticated: true,
            isLoading: false,
            profile: null,
            error: 'Failed to load profile'
          });
        }
      } else {
        // User is signed out
        setPlayerAuth({
          isAuthenticated: false,
          isLoading: false,
          profile: null,
          error: null
        });
      }
    });

    // Clean up the listener
    return () => unsubscribe();
  }, []);

  const createDefaultProfile = (user: User): PlayerProfile => {
    return {
      id: user.uid,
      displayName: user.displayName || 'Player',
      email: user.email || undefined,
      avatar: user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: DEFAULT_STATS,
      achievements: DEFAULT_ACHIEVEMENTS,
      gamesPlayed: 0,
      gamesWon: 0,
      badges: [],
      customization: {
        theme: 'default'
      }
    };
  };

  // Check for redirect result on component mount
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log('Signed in via redirect:', result.user);
        }
      } catch (error) {
        console.error('Error with redirect sign-in:', error);
      }
    };
    
    checkRedirectResult();
  }, []);

  // Add Google sign-in function
  const signInWithGoogle = async () => {
    try {
      setPlayerAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      const provider = new GoogleAuthProvider();
      
      console.log("🔄 Starting Google sign-in with popup");
      
      // Use popup for Google sign-in
      try {
        const result = await signInWithPopup(auth, provider);
        
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const user = result.user;
        
        console.log("✅ Google sign-in successful for:", user.displayName);
        
        // Check if user profile exists
        const profileSnapshot = await get(ref(database, `profiles/${user.uid}`));
        
        if (!profileSnapshot.exists()) {
          // Create new profile for this Google user
          console.log("🔄 Creating new profile for Google user");
          const newProfile: PlayerProfile = createDefaultProfile(user);
          await set(ref(database, `profiles/${user.uid}`), newProfile);
        } else {
          console.log("✅ Existing profile found for Google user");
        }
        
        // Auth state will be updated by the auth state listener
      } catch (googleError: any) {
        console.error("❌ Google popup sign-in error:", googleError);
        
        if (googleError.code === 'auth/popup-blocked') {
          console.log("⚠️ Popup was blocked. Falling back to guest mode.");
          const guestName = 'Guest';
          return signInAsGuest(guestName);
        }
        
        // If CORS or network error, try guest mode
        if (googleError.code === 'auth/network-request-failed' || 
            googleError.message?.includes('CORS')) {
          localStorage.setItem('auth_cors_error', 'true');
          console.log("⚠️ Network/CORS error with Google sign-in. Falling back to guest mode.");
          const guestName = 'Guest';
          return signInAsGuest(guestName);
        }
        
        throw googleError;
      }
    } catch (error: any) {
      console.error('❌ Error starting Google sign-in:', error);
      setPlayerAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign in with Google'
      }));
      throw error;
    }
  };

  // Update sign-in method to use redirect if we've had CORS issues
  const signIn = async (email: string, password: string) => {
    try {
      setPlayerAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Force clean slate by clearing any previous errors
      localStorage.removeItem('auth_cors_error');
      console.log("🔐 Starting sign-in attempt with email:", email);
      
      // Try to sign in with email and password
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("✅ Sign-in successful!");
        // Auth state will be updated by the auth state listener
      } catch (authError: any) {
        console.error('❌ Error signing in with Firebase Auth:', authError);
        
        // If network or CORS error, suggest guest mode and remember that we had issues
        if (authError.code === 'auth/network-request-failed' || 
            authError.message?.includes('CORS')) {
          localStorage.setItem('auth_cors_error', 'true');
          throw new Error('Network error. Firebase authentication is currently unavailable. Try using Guest Mode instead.');
        }
        
        throw authError;
      }
    } catch (error: any) {
      console.error('❌ Error signing in:', error);
      setPlayerAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign in'
      }));
      throw error;
    }
  };

  // Update sign-up method with similar CORS handling
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setPlayerAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Clear any previous CORS errors to start fresh
      localStorage.removeItem('auth_cors_error');
      console.log("📝 Starting sign-up process for:", displayName);
      
      // Try to create user with email and password
      try {
        console.log("🔄 Creating user with Firebase Auth");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        console.log("🔄 Updating user profile with display name");
        await updateProfile(user, {
          displayName
        });
        
        // Create user profile in database
        const newProfile: PlayerProfile = createDefaultProfile({
          ...user,
          displayName
        });
        
        console.log("🔄 Saving new profile to database");
        await set(ref(database, `profiles/${user.uid}`), newProfile);
        
        // Update auth state
        console.log("✅ Sign-up successful!");
        setPlayerAuth({
          isAuthenticated: true,
          isLoading: false,
          profile: newProfile,
          error: null
        });
      } catch (authError: any) {
        console.error('❌ Error signing up with Firebase Auth:', authError);
        
        // If network or CORS error, fall back to guest mode
        if (authError.code === 'auth/network-request-failed' || 
            authError.message?.includes('CORS')) {
          localStorage.setItem('auth_cors_error', 'true');
          console.log('🔄 Network/CORS error, falling back to guest mode');
          return signInAsGuest(displayName);
        }
        
        throw authError;
      }
    } catch (error: any) {
      console.error('❌ Error signing up:', error);
      setPlayerAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign up'
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setPlayerAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Remove profile listener
      if (playerAuth.profile) {
        const profileRef = ref(database, `profiles/${playerAuth.profile.id}`);
        off(profileRef);
      }
      
      // Sign out from Firebase
      await firebaseSignOut(auth);
      
      // Auth state will be updated by the auth state listener
    } catch (error: any) {
      console.error('Error signing out:', error);
      setPlayerAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to sign out'
      }));
      throw error;
    }
  };

  // Add guest mode sign-in function
  const signInAsGuest = async (displayName: string) => {
    try {
      setPlayerAuth(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Create a local guest profile with a unique ID
      const guestId = `guest-${uuidv4()}`;
      
      // Make a deep copy of the default values to avoid reference issues
      const defaultStats = JSON.parse(JSON.stringify(DEFAULT_STATS));
      const defaultAchievements = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS));
      
      console.log('Creating guest profile with stats:', defaultStats);
      console.log('Creating guest profile with achievements:', defaultAchievements);
      
      const guestProfile: PlayerProfile = {
        id: guestId,
        displayName: displayName || 'Guest',
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${guestId}`,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        stats: defaultStats,
        achievements: defaultAchievements,
        gamesPlayed: 0,
        gamesWon: 0,
        badges: [],
        customization: {
          theme: 'default'
        }
      };
      
      console.log('Created guest profile:', guestProfile);
      
      // Save guest profile to local storage
      localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
      
      // Update auth state
      setPlayerAuth({
        isAuthenticated: true,
        isLoading: false,
        profile: guestProfile,
        error: null
      });
      
      return guestProfile;
    } catch (error: any) {
      console.error('Error creating guest profile:', error);
      setPlayerAuth(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to create guest profile'
      }));
      throw error;
    }
  };

  // Check for guest profile on load
  useEffect(() => {
    const guestProfileJson = localStorage.getItem('guestProfile');
    
    if (guestProfileJson && !playerAuth.isAuthenticated && !playerAuth.isLoading) {
      try {
        const guestProfile = JSON.parse(guestProfileJson) as PlayerProfile;
        
        // Validate and fix missing properties if needed
        if (!guestProfile.badges) {
          console.log('Fixing missing badges array in guest profile');
          guestProfile.badges = [];
        }
        
        if (!guestProfile.stats) {
          console.log('Fixing missing stats array in guest profile');
          guestProfile.stats = DEFAULT_STATS;
        }
        
        if (!guestProfile.achievements) {
          console.log('Fixing missing achievements array in guest profile');
          guestProfile.achievements = DEFAULT_ACHIEVEMENTS;
        }
        
        if (!guestProfile.customization) {
          console.log('Fixing missing customization in guest profile');
          guestProfile.customization = { theme: 'default' };
        }
        
        // Update last login time
        guestProfile.lastLoginAt = Date.now();
        localStorage.setItem('guestProfile', JSON.stringify(guestProfile));
        
        console.log('Loaded guest profile:', guestProfile);
        
        setPlayerAuth({
          isAuthenticated: true,
          isLoading: false,
          profile: guestProfile,
          error: null
        });
      } catch (error) {
        console.error('Error parsing guest profile:', error);
        localStorage.removeItem('guestProfile');
      }
    }
  }, []);

  // Guest profile helper functions
  const updateGuestProfile = async (updates: Partial<PlayerProfile>) => {
    try {
      if (!playerAuth.profile || !playerAuth.isAuthenticated) return;
      
      // Check if this is a guest profile
      if (playerAuth.profile.id.startsWith('guest-')) {
        // Update profile in state
        const updatedProfile = {
          ...playerAuth.profile,
          ...updates
        };
        
        // Save to localStorage
        localStorage.setItem('guestProfile', JSON.stringify(updatedProfile));
        
        // Update state
        setPlayerAuth(prev => ({
          ...prev,
          profile: updatedProfile
        }));
        
        return;
      }
      
      // Regular Firebase update for non-guest users
      const profileRef = ref(database, `profiles/${playerAuth.profile.id}`);
      await update(profileRef, updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Override the updatePlayerProfile function to handle both guest and Firebase users
  const updatePlayerProfile = async (updates: Partial<PlayerProfile>) => {
    return playerAuth.profile?.id.startsWith('guest-')
      ? updateGuestProfile(updates)
      : updateFirebaseProfile(updates);
  };

  // Rename the original function
  const updateFirebaseProfile = async (updates: Partial<PlayerProfile>) => {
    if (!playerAuth.isAuthenticated || !playerAuth.profile) {
      throw new Error('User is not authenticated');
    }
    
    try {
      const profileRef = ref(database, `profiles/${playerAuth.profile.id}`);
      await update(profileRef, updates);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    if (!playerAuth.isAuthenticated || !playerAuth.profile) {
      throw new Error('User is not authenticated');
    }
    
    try {
      const achievementIndex = playerAuth.profile.achievements.findIndex(a => a.id === achievementId);
      
      if (achievementIndex === -1) {
        throw new Error('Achievement not found');
      }
      
      const achievement = playerAuth.profile.achievements[achievementIndex];
      
      if (achievement.isUnlocked) {
        return; // Already unlocked
      }
      
      // Create updated achievements array
      const updatedAchievements = [...playerAuth.profile.achievements];
      updatedAchievements[achievementIndex] = {
        ...achievement,
        isUnlocked: true,
        unlockedAt: Date.now()
      };
      
      // Update in database
      const achievementsRef = ref(database, `profiles/${playerAuth.profile.id}/achievements`);
      await set(achievementsRef, updatedAchievements);
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  };

  const updateStat = async (statId: string, value: number) => {
    if (!playerAuth.isAuthenticated || !playerAuth.profile) {
      throw new Error('User is not authenticated');
    }
    
    try {
      const statIndex = playerAuth.profile.stats.findIndex(s => s.id === statId);
      
      if (statIndex === -1) {
        throw new Error('Stat not found');
      }
      
      // Create updated stats array
      const updatedStats = [...playerAuth.profile.stats];
      updatedStats[statIndex] = {
        ...updatedStats[statIndex],
        value
      };
      
      // Update in database
      const statsRef = ref(database, `profiles/${playerAuth.profile.id}/stats`);
      await set(statsRef, updatedStats);
    } catch (error) {
      console.error('Error updating stat:', error);
      throw error;
    }
  };

  const incrementStat = async (statId: string, incrementBy: number = 1) => {
    if (!playerAuth.isAuthenticated || !playerAuth.profile) {
      throw new Error('User is not authenticated');
    }
    
    try {
      const statIndex = playerAuth.profile.stats.findIndex(s => s.id === statId);
      
      if (statIndex === -1) {
        throw new Error('Stat not found');
      }
      
      const currentValue = playerAuth.profile.stats[statIndex].value;
      const newValue = currentValue + incrementBy;
      
      // Create updated stats array
      const updatedStats = [...playerAuth.profile.stats];
      updatedStats[statIndex] = {
        ...updatedStats[statIndex],
        value: newValue
      };
      
      // Update in database
      const statsRef = ref(database, `profiles/${playerAuth.profile.id}/stats`);
      await set(statsRef, updatedStats);
    } catch (error) {
      console.error('Error incrementing stat:', error);
      throw error;
    }
  };

  return (
    <PlayerAuthContext.Provider
      value={{
        playerAuth,
        signIn,
        signUp,
        signOut,
        signInAsGuest,
        signInWithGoogle,
        updatePlayerProfile,
        unlockAchievement,
        updateStat,
        incrementStat
      }}
    >
      {children}
    </PlayerAuthContext.Provider>
  );
};

export default PlayerAuthContext; 