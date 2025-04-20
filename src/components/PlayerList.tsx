import React from 'react';
import { Player } from '../types';
import Avatar from './Avatar';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  showRoles?: boolean;
  votingEnabled?: boolean;
  onVote?: (playerId: string) => void;
  voteCounts?: Record<string, number>;
  className?: string;
}

const PlayerList: React.FC<PlayerListProps> = ({
  players,
  currentPlayerId,
  showRoles = false,
  votingEnabled = false,
  onVote,
  voteCounts = {},
  className = ''
}) => {
  return (
    <div className={`bg-gray-900 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Players ({players.length})</h2>
      </div>
      
      <ul className="divide-y divide-gray-800">
        {players.map((player) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const voteCount = voteCounts[player.id] || 0;
          
          return (
            <li 
              key={player.id} 
              className={`px-4 py-3 flex items-center justify-between
                ${isCurrentPlayer ? 'bg-gray-800 bg-opacity-50' : ''}
              `}
            >
              <div className="flex items-center space-x-3">
                <Avatar 
                  name={player.name} 
                  image={player.avatar}
                  status={player.isConnected ? 'online' : 'offline'}
                />
                
                <div>
                  <div className="flex items-center">
                    <span className="text-white font-medium">
                      {player.name}
                    </span>
                    
                    {player.isHost && (
                      <span className="ml-2 text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded">
                        Host
                      </span>
                    )}
                    
                    {isCurrentPlayer && (
                      <span className="ml-2 text-xs bg-blue-600 text-blue-100 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  
                  {showRoles && player.currentRole && (
                    <span className="text-xs text-gray-400">
                      Role: {player.currentRole.charAt(0).toUpperCase() + player.currentRole.slice(1)}
                    </span>
                  )}
                  
                  {!player.isConnected && (
                    <span className="text-xs text-gray-500">Disconnected</span>
                  )}
                  
                  {voteCount > 0 && (
                    <span className="text-xs text-gray-400">
                      Votes: {voteCount}
                    </span>
                  )}
                </div>
              </div>
              
              {votingEnabled && player.id !== currentPlayerId && onVote && (
                <button
                  onClick={() => onVote(player.id)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded
                            transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Vote
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayerList;