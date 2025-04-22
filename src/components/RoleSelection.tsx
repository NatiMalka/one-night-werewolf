import React, { useState } from 'react';
import { Role, roleData } from '../utils/gameUtils';
import Button from './Button';

interface RoleSelectionProps {
  playerCount: number;
  onComplete: (selectedRoles: Role[]) => void;
  className?: string;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({
  playerCount,
  onComplete,
  className = ''
}) => {
  const totalCards = playerCount + 3; // 3 center cards
  
  // Initial selections with default recommended roles
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(() => {
    // Default selection based on player count
    const werewolfCount = Math.max(1, Math.floor(playerCount / 4));
    const defaults: Role[] = Array(werewolfCount).fill('werewolf');
    
    // Add villagers
    const villagerCount = Math.max(1, Math.floor(playerCount / 3));
    defaults.push(...Array(villagerCount).fill('villager'));
    
    // Add recommended roles
    const recommendedRoles: Role[] = ['seer', 'robber', 'troublemaker'];
    defaults.push(...recommendedRoles);
    
    // Add more roles to fill
    const additionalRoles: Role[] = ['drunk', 'insomniac', 'mason', 'tanner', 'hunter'];
    let i = 0;
    while (defaults.length < totalCards && i < additionalRoles.length) {
      defaults.push(additionalRoles[i]);
      i++;
    }
    
    return defaults;
  });
  
  const [counts, setCounts] = useState<Record<Role, number>>(() => {
    const initialCounts: Record<Role, number> = {
      werewolf: 0,
      villager: 0,
      seer: 0,
      robber: 0,
      troublemaker: 0,
      drunk: 0,
      insomniac: 0,
      tanner: 0,
      hunter: 0,
      mason: 0
    };
    
    selectedRoles.forEach(role => {
      initialCounts[role]++;
    });
    
    return initialCounts;
  });
  
  const handleRoleChange = (role: Role, change: number) => {
    const newCount = Math.max(0, counts[role] + change);
    const newCounts = { ...counts, [role]: newCount };
    
    let newSelectedRoles: Role[] = [];
    Object.entries(newCounts).forEach(([r, count]) => {
      newSelectedRoles = [...newSelectedRoles, ...Array(count).fill(r)];
    });
    
    setCounts(newCounts);
    setSelectedRoles(newSelectedRoles);
  };
  
  const totalSelected = Object.values(counts).reduce((sum, count) => sum + count, 0);
  
  // Sort roles by team for display
  const sortedRoles = Object.keys(roleData).sort((a, b) => {
    const roleA = a as Role;
    const roleB = b as Role;
    
    // Sort by team first
    if (roleData[roleA].team !== roleData[roleB].team) {
      // Werewolf team first, then village, then tanner
      const teamOrder = { werewolf: 0, village: 1, tanner: 2 };
      return teamOrder[roleData[roleA].team] - teamOrder[roleData[roleB].team];
    }
    
    // Then sort alphabetically
    return roleData[roleA].name.localeCompare(roleData[roleB].name);
  });

  return (
    <div className={`bg-gray-900 rounded-lg shadow-lg p-4 ${className}`}>
      <h2 className="text-xl font-bold text-white mb-3">Select Roles</h2>
      
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Selected: {totalSelected} / {totalCards}</span>
          <span>{playerCount} players + 3 center cards</span>
        </div>
        
        <div className="w-full bg-gray-800 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full ${
              totalSelected === totalCards 
                ? 'bg-green-500' 
                : totalSelected > totalCards 
                  ? 'bg-red-500' 
                  : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min(100, (totalSelected / totalCards) * 100)}%` }}
          ></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
        {sortedRoles.map((roleKey) => {
          const role = roleKey as Role;
          const { name, team, description } = roleData[role];
          
          const teamColors = {
            werewolf: 'border-red-800 bg-red-900 bg-opacity-20',
            village: 'border-blue-800 bg-blue-900 bg-opacity-20',
            tanner: 'border-amber-800 bg-amber-900 bg-opacity-20'
          };
          
          return (
            <div 
              key={role}
              className={`border rounded-lg p-1.5 ${teamColors[team]}`}
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-semibold text-white text-xs">{name}</h3>
                <span className="text-xs px-1 py-0.5 rounded-full bg-opacity-80 text-white
                                ${team === 'werewolf' ? 'bg-red-700' :
                                  team === 'village' ? 'bg-blue-700' : 'bg-amber-700'}">
                  {team.charAt(0).toUpperCase() + team.slice(1)}
                </span>
              </div>
              
              <p className="text-xs text-gray-300 mb-1 line-clamp-2 h-8" title={description}>{description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRoleChange(role, -1)}
                    disabled={counts[role] === 0}
                    className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center
                              disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    -
                  </button>
                  
                  <span className="font-medium text-white w-4 text-center">{counts[role]}</span>
                  
                  <button
                    onClick={() => handleRoleChange(role, 1)}
                    className="w-5 h-5 rounded-full bg-gray-800 text-white flex items-center justify-center
                              hover:bg-gray-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-between mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Reset to default selection
            const initial = {
              werewolf: Math.max(1, Math.floor(playerCount / 4)),
              villager: Math.max(1, Math.floor(playerCount / 3)),
              seer: 1,
              robber: 1,
              troublemaker: 1,
              drunk: totalCards > (playerCount + 2) ? 1 : 0,
              insomniac: totalCards > (playerCount + 3) ? 1 : 0,
              tanner: totalCards > (playerCount + 4) ? 1 : 0,
              hunter: totalCards > (playerCount + 5) ? 1 : 0,
              mason: 0
            };
            
            setCounts(initial);
            
            let newSelectedRoles: Role[] = [];
            Object.entries(initial).forEach(([r, count]) => {
              newSelectedRoles = [...newSelectedRoles, ...Array(count).fill(r as Role)];
            });
            
            setSelectedRoles(newSelectedRoles);
          }}
        >
          Reset
        </Button>
        
        <Button
          disabled={totalSelected !== totalCards}
          onClick={() => onComplete(selectedRoles)}
          className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-base shadow-lg transition-all transform hover:translate-y-[-2px] ${totalSelected === totalCards ? '' : 'opacity-70 cursor-not-allowed'}`}
        >
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Start Game
          </span>
        </Button>
      </div>
      
      {totalSelected === totalCards && (
        <div className="mt-2 bg-green-900/30 border border-green-700/30 rounded-lg p-2 text-center">
          <p className="text-green-400 text-xs flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Ready to start the game!
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelection;