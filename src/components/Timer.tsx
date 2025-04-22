import React, { useState, useEffect } from 'react';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  large?: boolean;
  paused?: boolean;
  className?: string;
  completeText?: string;
}

const Timer: React.FC<TimerProps> = ({
  seconds,
  onComplete,
  large = false,
  paused = false,
  className = '',
  completeText
}) => {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isComplete, setIsComplete] = useState(false);
  
  // Reset timer when seconds prop changes
  useEffect(() => {
    setTimeLeft(seconds);
    setIsComplete(seconds <= 0);
  }, [seconds]);
  
  useEffect(() => {
    if (paused) return;
    
    if (timeLeft <= 0) {
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(prev => {
        const newValue = prev - 1;
        // Check if timer just reached zero
        if (newValue === 0) {
          setIsComplete(true);
          if (onComplete) {
            // Schedule onComplete to run in the next frame
            setTimeout(onComplete, 0);
          }
        }
        return newValue;
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft, onComplete, paused]);
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculate percentage for the circular progress
  const percentage = (timeLeft / seconds) * 100;
  
  // Determine color based on time left
  const getColor = () => {
    if (isComplete && completeText) return 'text-purple-500';
    if (timeLeft > seconds * 0.66) return 'text-green-500';
    if (timeLeft > seconds * 0.33) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${large ? 'w-24 h-24' : 'w-16 h-16'}`}>
        <svg 
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="transparent" 
            stroke="#1f2937" 
            strokeWidth="8"
          />
          
          {/* Progress circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="transparent" 
            stroke="currentColor" 
            strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray="282.7"
            strokeDashoffset={isComplete ? 0 : 282.7 - (percentage * 282.7 / 100)}
            className={getColor()}
          />
        </svg>
        
        <div className={`
          absolute inset-0 flex items-center justify-center
          font-mono font-bold ${getColor()}
          ${large ? 'text-2xl' : 'text-xl'}
        `}>
          {isComplete && completeText ? (
            <div className="text-center text-xs font-medium">
              {completeText}
            </div>
          ) : (
            formatTime(timeLeft)
          )}
        </div>
      </div>
    </div>
  );
};

export default Timer;