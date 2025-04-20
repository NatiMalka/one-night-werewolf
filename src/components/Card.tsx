import React from 'react';
import { Role, roleData } from '../utils/gameUtils';

interface CardProps {
  role?: Role;
  isRevealed?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isCenterCard?: boolean;
  label?: string;
}

const Card: React.FC<CardProps> = ({
  role,
  isRevealed = false,
  isSelected = false,
  onClick,
  size = 'md',
  className = '',
  isCenterCard = false,
  label
}) => {
  const sizeClasses = {
    sm: 'w-16 h-24',
    md: 'w-28 h-40',
    lg: 'w-36 h-52'
  };

  const getTeamColor = (role?: Role) => {
    if (!role) return 'bg-gray-800';
    
    const team = roleData[role].team;
    
    if (team === 'werewolf') return 'bg-red-900';
    if (team === 'village') return 'bg-blue-900';
    if (team === 'tanner') return 'bg-amber-900';
    
    return 'bg-gray-800';
  };

  const handleClick = () => {
    if (onClick) onClick();
  };

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
          ${isRevealed ? getTeamColor(role) : 'bg-indigo-900'}
        `}
        onClick={handleClick}
      >
        <div className="h-full w-full flex flex-col items-center justify-center p-2">
          {isRevealed && role ? (
            <>
              <div className="text-center">
                <h3 className="font-bold text-white">
                  {roleData[role].name}
                </h3>
                {size !== 'sm' && (
                  <p className="text-xs mt-1 text-gray-200">
                    {roleData[role].team === 'werewolf' 
                      ? 'Werewolf Team' 
                      : roleData[role].team === 'village'
                        ? 'Village Team'
                        : 'Tanner'}
                  </p>
                )}
              </div>
              
              {size === 'lg' && (
                <p className="text-xs mt-3 text-center text-gray-300">
                  {roleData[role].description}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                {isCenterCard ? (
                  <span className="font-bold">?</span>
                ) : (
                  <span className="font-bold">ONE NIGHT</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;