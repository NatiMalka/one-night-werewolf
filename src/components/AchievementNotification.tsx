import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';
import { Award, Trophy, Star, X } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
  autoCloseDelay?: number;
}

const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose,
  autoCloseDelay = 6000, // 6 seconds by default
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Play achievement unlock sound when component mounts
    playSound('achievement-unlock');
    
    // Trigger entrance animation after a brief delay
    setTimeout(() => setIsVisible(true), 100);
    
    // Set up auto-close timer
    const timer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);
    
    return () => clearTimeout(timer);
  }, [autoCloseDelay]);

  const handleClose = () => {
    // Trigger exit animation
    setIsLeaving(true);
    
    // Allow animation to complete before removal
    setTimeout(onClose, 500);
  };

  return (
    <div 
      className={`fixed top-16 right-4 transform transition-all duration-500 ease-out z-50
                 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-64 opacity-0'}
                 ${isLeaving ? 'translate-x-64 opacity-0' : ''}`}
    >
      <div className="relative w-80 overflow-hidden">
        {/* Background glowing effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-xl animate-pulse-slow"></div>
        
        {/* Main card */}
        <div className="relative bg-gradient-to-br from-gray-900/95 to-indigo-900/95 backdrop-blur-lg border border-indigo-500/30 rounded-lg shadow-2xl overflow-hidden">
          {/* Animated particles in background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-2 h-2 bg-indigo-400/40 rounded-full top-1/4 left-1/4 animate-float-slow"></div>
            <div className="absolute w-3 h-3 bg-purple-400/30 rounded-full top-3/4 left-1/3 animate-float-medium"></div>
            <div className="absolute w-2 h-2 bg-blue-400/30 rounded-full top-1/2 left-3/4 animate-float-fast"></div>
          </div>
          
          {/* Header with icon */}
          <div className="pt-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-yellow-400" />
              <span className="text-yellow-400 text-sm font-semibold tracking-wide uppercase">Achievement Unlocked</span>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 pt-2">
            <div className="flex items-center gap-4">
              {/* Achievement icon with glow */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-md animate-pulse-slow"></div>
                <div className="relative bg-gradient-to-br from-indigo-600/50 to-purple-700/50 w-16 h-16 rounded-full flex items-center justify-center border border-indigo-400/30 shadow-lg">
                  <span className="text-3xl">{achievement.icon}</span>
                </div>
              </div>
              
              {/* Achievement details */}
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg leading-tight">{achievement.name}</h3>
                <p className="text-indigo-200 text-sm mt-1">{achievement.description}</p>
              </div>
            </div>
            
            {/* Animated progress bar for completed achievement */}
            <div className="mt-3 bg-gray-800/70 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full w-0 animate-progress-fill"
                style={{ animationFillMode: 'forwards' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification; 