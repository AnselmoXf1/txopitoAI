/**
 * Typing Indicator Component - TXOPITO IA
 * Indicador visual de que a IA está "digitando"
 */

import React from 'react';
import Icon from './Icon';

interface TypingIndicatorProps {
  color?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  color = 'text-blue-600',
  className = ''
}) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
        <Icon name="Bot" size={18} className={color} />
      </div>

      {/* Typing Animation */}
      <div className="flex flex-col items-start">
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">TXOPITO está digitando...</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-[10px] text-gray-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;