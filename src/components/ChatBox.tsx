import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import Avatar from './Avatar';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  disabled = false,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className={`flex flex-col bg-gray-900 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Discussion</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No messages yet. Start the discussion!
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`mb-3 ${msg.isSystemMessage ? 'text-center italic text-gray-500' : ''}`}
            >
              {!msg.isSystemMessage ? (
                <div className="flex items-start">
                  <Avatar name={msg.playerName} size="sm" className="mr-2 flex-shrink-0" />
                  <div>
                    <div className="flex items-baseline">
                      <span className="font-medium text-indigo-400 mr-2">{msg.playerName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-300 break-words">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm my-2">{msg.content}</p>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-2 border-t border-gray-700 flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Chat disabled during this phase" : "Type your message..."}
          disabled={disabled}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-l-md px-3 py-2 text-white 
                    placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-r-md 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:bg-indigo-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;