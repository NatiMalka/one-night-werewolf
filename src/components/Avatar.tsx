import React from 'react';

interface AvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  name, 
  image, 
  size = 'md', 
  status,
  className = ''
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400'
  };

  return (
    <div className={`relative ${className}`}>
      {image ? (
        <img
          src={image}
          alt={`${name}'s avatar`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-700`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-indigo-800 flex items-center justify-center text-white font-medium border-2 border-gray-700`}
        >
          {getInitials(name)}
        </div>
      )}
      
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ${
            statusClasses[status]
          } ring-2 ring-white w-3 h-3`}
        />
      )}
    </div>
  );
};

export default Avatar;