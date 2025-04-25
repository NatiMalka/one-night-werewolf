import React from 'react';
import { Achievement } from '../types';

interface AchievementListProps {
  achievements: Achievement[];
}

const AchievementList: React.FC<AchievementListProps> = ({ achievements }) => {
  // Separate unlocked and locked achievements
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  return (
    <div className="bg-gray-900/60 backdrop-blur-lg rounded-2xl p-6 border border-gray-800/50">
      <h2 className="text-xl font-semibold text-white mb-6">Achievements</h2>
      
      {/* Unlocked achievements */}
      {unlockedAchievements.length > 0 && (
        <>
          <h3 className="text-indigo-400 text-sm font-medium mb-4">Unlocked ({unlockedAchievements.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {unlockedAchievements.map(achievement => (
              <div 
                key={achievement.id} 
                className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl p-4 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-indigo-500 text-xs text-white px-2 py-1 rounded-bl-lg">
                  {achievement.unlockedAt 
                    ? new Date(achievement.unlockedAt).toLocaleDateString() 
                    : 'Unlocked'}
                </div>
                
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{achievement.icon}</span>
                  <div>
                    <h4 className="text-white font-medium">{achievement.name}</h4>
                    <p className="text-indigo-300 text-sm">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Locked achievements */}
      {lockedAchievements.length > 0 && (
        <>
          <h3 className="text-gray-400 text-sm font-medium mb-4">Locked ({lockedAchievements.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lockedAchievements.map(achievement => (
              <div 
                key={achievement.id} 
                className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4 relative overflow-hidden"
              >
                <div className="flex items-center">
                  <span className="text-3xl mr-3 opacity-50">{achievement.icon}</span>
                  <div>
                    <h4 className="text-gray-400 font-medium">{achievement.name}</h4>
                    <p className="text-gray-500 text-sm">{achievement.description}</p>
                  </div>
                </div>
                
                {/* Progress bar for achievements with progress */}
                {achievement.progress !== undefined && achievement.maxProgress !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <div className="bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600/50 h-full"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* No achievements yet */}
      {achievements.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No achievements yet</div>
          <p className="text-gray-400 text-sm">
            Play games to unlock achievements and track your progress
          </p>
        </div>
      )}
    </div>
  );
};

export default AchievementList; 