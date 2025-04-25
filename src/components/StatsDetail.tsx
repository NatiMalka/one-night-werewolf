import React from 'react';
import { Stat, PlayerProfile, Role } from '../types';
import { LineChart, PieChart, DollarSign } from 'lucide-react';

interface StatsDetailProps {
  profile: PlayerProfile;
}

const StatsDetail: React.FC<StatsDetailProps> = ({ profile }) => {
  const calculateWinRate = (): number => {
    if (profile.gamesPlayed === 0) return 0;
    return Math.round((profile.gamesWon / profile.gamesPlayed) * 100);
  };

  const getRolePlayCount = (role: Role): number => {
    // This would need to be added to the player profile to track accurately
    // For now, we'll just return a placeholder value
    return 0;
  };

  return (
    <div className="bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Player Statistics</h2>
        <div className="flex space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-400">
            <LineChart size={18} />
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="text-indigo-400 text-sm font-medium mb-1">Games</div>
          <div className="text-white text-2xl font-bold">{profile.gamesPlayed}</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="text-indigo-400 text-sm font-medium mb-1">Wins</div>
          <div className="text-white text-2xl font-bold">{profile.gamesWon}</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="text-indigo-400 text-sm font-medium mb-1">Win Rate</div>
          <div className="text-white text-2xl font-bold">{calculateWinRate()}%</div>
        </div>
        <div className="bg-gray-800/30 rounded-xl p-4">
          <div className="text-indigo-400 text-sm font-medium mb-1">Achievements</div>
          <div className="text-white text-2xl font-bold">
            {profile.achievements.filter(a => a.isUnlocked).length}/{profile.achievements.length}
          </div>
        </div>
      </div>
      
      {/* Detailed stats */}
      <div className="mb-6">
        <h3 className="text-indigo-400 text-sm font-medium mb-3 flex items-center">
          <DollarSign size={16} className="mr-1" />
          All Stats
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {profile.stats.map(stat => (
            <div key={stat.id} className="flex items-center justify-between bg-gray-800/20 rounded-lg p-3">
              <div className="flex items-center">
                <span className="text-xl mr-2">{stat.icon}</span>
                <span className="text-white">{stat.name}</span>
              </div>
              <span className="text-indigo-300 font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Role stats */}
      <div>
        <h3 className="text-indigo-400 text-sm font-medium mb-3 flex items-center">
          <PieChart size={16} className="mr-1" />
          Roles Played
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {['werewolf', 'villager', 'seer', 'robber', 'troublemaker', 'drunk'].map((role) => (
            <div key={role} className="bg-gray-800/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-white capitalize">{role}</span>
                <span className="text-indigo-300 font-medium">{getRolePlayCount(role as Role)}</span>
              </div>
              {/* Role win rate would ideally be shown here */}
            </div>
          ))}
        </div>
        
        {/* Placeholder for when no role stats are available */}
        {profile.gamesPlayed === 0 && (
          <div className="text-center py-4 text-gray-500 italic text-sm">
            Play more games to see your role statistics
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsDetail; 