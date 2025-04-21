import React from 'react';
import { Role } from '../types';
import { roleData } from '../utils/gameUtils';

interface CardProps {
  role?: Role;
  isRevealed?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isCenterCard?: boolean;
  label?: string;
  hideDescription?: boolean;
}

const Card: React.FC<CardProps> = ({
  role,
  isRevealed = false,
  isSelected = false,
  onClick,
  size = 'md',
  className = '',
  isCenterCard = false,
  label,
  hideDescription = false
}) => {
  // Default sizes, but these can be overridden by className
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-28 h-40',
    lg: 'w-full h-full max-w-xs'
  };

  const getTeamColor = (role?: Role) => {
    if (!role) return 'bg-gray-800';
    
    const team = roleData[role].team;
    
    if (team === 'werewolf') return 'bg-red-900';
    if (team === 'village') return 'bg-blue-900';
    if (team === 'tanner') return 'bg-amber-900';
    
    return 'bg-gray-800';
  };
  
  const getTeamGradient = (role?: Role) => {
    if (!role) return 'bg-gradient-to-b from-gray-800 to-gray-900';
    
    const team = roleData[role].team;
    
    if (team === 'werewolf') return 'bg-gradient-to-b from-red-800 to-red-950';
    if (team === 'village') return 'bg-gradient-to-b from-blue-800 to-blue-950';
    if (team === 'tanner') return 'bg-gradient-to-b from-amber-800 to-amber-950';
    
    return 'bg-gradient-to-b from-gray-800 to-gray-900';
  };

  const handleClick = () => {
    if (onClick) onClick();
  };
  
  // Determine if we should show the werewolf image
  const showWerewolfImage = isRevealed && role === 'werewolf';
  
  // Determine if we should show the seer image
  const showSeerImage = isRevealed && role === 'seer';
  
  // Determine if we should show the robber image
  const showRobberImage = isRevealed && role === 'robber';
  
  // Determine if we should show the drunk image
  const showDrunkImage = isRevealed && role === 'drunk';
  
  // Special treatments for different roles
  const hasSpecialBackground = isRevealed && (role === 'werewolf' || role === 'seer' || role === 'robber' || role === 'drunk');
  
  // Determine if this is a large card (either by size prop or className containing scale)
  const isLargeCard = size === 'lg';

  return (
    <div className={`relative ${className}`}>
      {label && (
        <div className="absolute -top-6 left-0 right-0 text-center text-sm text-gray-400">
          {label}
        </div>
      )}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-lg overflow-hidden 
          shadow-lg 
          transition-all duration-300
          ${isSelected ? 'ring-4 ring-yellow-400 transform scale-105' : ''}
          ${onClick ? 'cursor-pointer hover:shadow-xl hover:transform hover:scale-105' : ''}
          ${isRevealed ? getTeamGradient(role) : 'bg-gradient-to-b from-indigo-800 to-indigo-950'}
          relative
        `}
        onClick={handleClick}
        style={hasSpecialBackground ? { 
          boxShadow: role === 'werewolf' ? 
            '0 0 30px rgba(220, 38, 38, 0.6), 0 0 60px rgba(220, 38, 38, 0.3)' :
            role === 'seer' ?
              '0 0 30px rgba(79, 70, 229, 0.6), 0 0 60px rgba(79, 70, 229, 0.3)' :
              role === 'robber' ?
                '0 0 30px rgba(14, 165, 233, 0.6), 0 0 60px rgba(14, 165, 233, 0.3)' :
                '0 0 30px rgba(234, 179, 8, 0.6), 0 0 60px rgba(234, 179, 8, 0.3)', 
          border: role === 'werewolf' ?
            '1px solid rgba(220, 38, 38, 0.5)' : 
            role === 'seer' ?
              '1px solid rgba(79, 70, 229, 0.5)' :
              role === 'robber' ?
                '1px solid rgba(14, 165, 233, 0.5)' :
                '1px solid rgba(234, 179, 8, 0.5)'
        } : {}}
      >
        {/* Card Back Pattern */}
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-3/4 h-3/4 border-4 border-indigo-700 rounded-full" />
            <div className="absolute w-1/2 h-1/2 border-4 border-indigo-700 rounded-full" />
          </div>
        )}
        
        {/* Werewolf Image */}
        {showWerewolfImage && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/werewolf.jpg" 
              alt="Werewolf" 
              className="absolute w-full h-full object-contain opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-red-950 via-red-950/30 to-transparent" />
          </div>
        )}

        {/* Seer Image */}
        {showSeerImage && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/seer.jpg" 
              alt="Seer" 
              className="absolute w-full h-full object-contain opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-950/30 to-transparent" />
          </div>
        )}

        {/* Robber Image */}
        {showRobberImage && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/Robber.jpg" 
              alt="Robber" 
              className="absolute w-full h-full object-contain opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-950/30 to-transparent" />
          </div>
        )}

        {/* Drunk Image */}
        {showDrunkImage && (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
              src="/images/drunk.png" 
              alt="Drunk" 
              className="absolute w-full h-full object-contain opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-amber-950/30 to-transparent" />
          </div>
        )}

        <div className="h-full w-full flex flex-col justify-between p-2 relative z-10">
          {isRevealed && role ? (
            <>
              {/* Top section with role icon/symbol */}
              <div className="flex justify-between items-start">
                <div className={`${isLargeCard ? 'w-12 h-12 text-xl' : 'w-6 h-6 text-xs'} rounded-full ${getTeamColor(role)} flex items-center justify-center text-white font-bold border-2 border-white/50 shadow-lg`}>
                  {role === 'werewolf' ? 'W' : 
                   role === 'seer' ? 'S' : 
                   role === 'robber' ? 'R' : 
                   role === 'troublemaker' ? 'T' : 
                   role === 'drunk' ? 'D' : 
                   role === 'insomniac' ? 'I' : 
                   role === 'hunter' ? 'H' : 
                   role === 'mason' ? 'M' : 
                   role === 'tanner' ? 'T' : 'V'}
                </div>
                
                {size !== 'sm' && (
                  <div className={`${isLargeCard ? 'text-base px-3 py-2' : 'text-xs px-2 py-1'} text-white/90 font-semibold rounded-md bg-black/40 backdrop-blur-sm shadow-md`}>
                    {roleData[role].team.charAt(0).toUpperCase() + roleData[role].team.slice(1)}
                  </div>
                )}
              </div>
              
              {/* Middle section - empty for small cards or with description for large cards */}
              {size === 'lg' && !showWerewolfImage && !showSeerImage && !showRobberImage && !showDrunkImage && (
                <div className="flex-1 flex items-center justify-center text-center">
                  <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                    {/* Role icon could go here */}
                    <span className="text-white text-5xl font-bold">
                      {role.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Bottom section with role name */}
              <div className={`text-center ${(showWerewolfImage || showSeerImage || showRobberImage || showDrunkImage) ? 'bg-black/60 -mx-2 -mb-2 px-3 py-3 rounded-b-lg backdrop-blur-md' : ''}`}>
                <h3 className={`font-bold text-white ${isLargeCard ? 'text-3xl mb-2' : 'text-base'}`}>
                  {roleData[role].name}
                </h3>
                
                {!hideDescription && ((size === 'lg' && !showWerewolfImage && !showSeerImage && !showRobberImage && !showDrunkImage) || showWerewolfImage || showSeerImage || showRobberImage || showDrunkImage) && (
                  <p className={`${isLargeCard ? 'text-base leading-snug' : 'text-xs'} mt-1 text-center text-gray-300`}>
                    {roleData[role].description}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                {isCenterCard ? (
                  <span className="text-3xl font-bold">?</span>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className={`font-bold ${isLargeCard ? 'text-4xl' : 'text-xl'}`}>ONE</div>
                    <div className="w-20 h-1 bg-indigo-500 opacity-70 rounded-full"></div>
                    <div className={`font-bold ${isLargeCard ? 'text-4xl' : 'text-xl'}`}>NIGHT</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Add a dramatic inner border for special roles when the card is large */}
        {isRevealed && role === 'werewolf' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-red-500/70 rounded-lg"></div>
        )}
        {isRevealed && role === 'seer' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-indigo-500/70 rounded-lg"></div>
        )}
        {isRevealed && role === 'robber' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-sky-500/70 rounded-lg"></div>
        )}
        {isRevealed && role === 'drunk' && (
          <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/70 rounded-lg"></div>
        )}
      </div>
    </div>
  );
};

export default Card;