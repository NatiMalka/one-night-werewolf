import React from 'react';
import { PlayerProfile } from '../types';
import { Edit, Award, LogOut } from 'lucide-react';
import { usePlayerAuth } from '../contexts/PlayerAuthContext';

interface ProfileCardProps {
  profile: PlayerProfile;
  onEditClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onEditClick }) => {
  const { signOut } = usePlayerAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Add safety checks for undefined properties
  const badges = profile?.badges || [];
  const stats = profile?.stats || [];
  const achievements = profile?.achievements || [];
  const customization = profile?.customization || {};

  return (
    <div className="bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-800/50 
                   hover:shadow-indigo-900/20 hover:border-indigo-800/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Player Profile</h2>
        <div className="flex space-x-2">
          {onEditClick && (
            <button 
              onClick={onEditClick}
              className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400 hover:bg-indigo-600/50 hover:text-white transition-colors"
            >
              <Edit size={18} />
            </button>
          )}
          <button 
            onClick={handleSignOut}
            className="p-1.5 rounded-lg bg-gray-700/30 text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={profile?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=default'} 
              alt={profile?.displayName || 'Player'} 
              className="w-24 h-24 rounded-full object-cover border-4 border-indigo-800/50"
            />
            {customization.avatarFrame && (
              <div className="absolute inset-0 border-4 rounded-full pointer-events-none"
                   style={{ borderColor: customization.avatarFrame }}></div>
            )}
          </div>
          <h3 className="mt-3 text-lg font-medium" 
              style={{ color: customization.nameColor || 'white' }}>
            {profile?.displayName || 'Player'}
          </h3>
          
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex mt-2 space-x-1">
              {badges.map((badge, index) => (
                <span key={index} className="text-lg" title={badge}>{badge}</span>
              ))}
            </div>
          )}
        </div>
        
        {/* Stats */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="text-indigo-400 text-sm font-medium mb-1">Games Played</div>
              <div className="text-white text-2xl font-bold">{profile?.gamesPlayed || 0}</div>
            </div>
            <div className="bg-gray-800/30 rounded-xl p-4">
              <div className="text-indigo-400 text-sm font-medium mb-1">Wins</div>
              <div className="text-white text-2xl font-bold">{profile?.gamesWon || 0}</div>
            </div>
            
            {profile?.favoriteRole && (
              <div className="bg-gray-800/30 rounded-xl p-4 col-span-2">
                <div className="text-indigo-400 text-sm font-medium mb-1">Favorite Role</div>
                <div className="text-white text-lg font-bold capitalize">{profile.favoriteRole}</div>
              </div>
            )}
          </div>
          
          {/* Top Stats */}
          <div className="mt-4">
            <h4 className="text-indigo-400 text-sm font-medium mb-2">Stats</h4>
            <div className="space-y-2">
              {stats.slice(0, 3).map(stat => (
                <div key={stat.id} className="flex items-center justify-between bg-gray-800/20 rounded-lg p-2 px-3">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{stat.icon}</span>
                    <span className="text-white">{stat.name}</span>
                  </div>
                  <span className="text-indigo-300 font-medium">{stat.value}</span>
                </div>
              ))}
              
              {stats.length > 3 && (
                <button className="text-indigo-400 hover:text-indigo-300 text-sm w-full text-center mt-1">
                  View all stats
                </button>
              )}
            </div>
          </div>
          
          {/* Recent Achievements */}
          <div className="mt-4">
            <div className="flex items-center">
              <Award size={16} className="text-indigo-400 mr-1" />
              <h4 className="text-indigo-400 text-sm font-medium">Recent Achievements</h4>
            </div>
            
            <div className="mt-2 space-y-2">
              {achievements
                .filter(a => a.isUnlocked)
                .slice(0, 2)
                .map(achievement => (
                  <div key={achievement.id} className="flex items-center bg-gray-800/20 rounded-lg p-2 px-3">
                    <span className="text-lg mr-2">{achievement.icon}</span>
                    <div>
                      <div className="text-white text-sm font-medium">{achievement.name}</div>
                      <div className="text-gray-400 text-xs">{achievement.description}</div>
                    </div>
                  </div>
                ))}
              
              {achievements.filter(a => a.isUnlocked).length === 0 && (
                <div className="text-gray-500 text-sm italic">No achievements unlocked yet</div>
              )}
              
              {achievements.filter(a => a.isUnlocked).length > 2 && (
                <button className="text-indigo-400 hover:text-indigo-300 text-sm w-full text-center mt-1">
                  View all achievements
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 