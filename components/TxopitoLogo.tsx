/**
 * TxopitoLogo Component - TXOPITO IA
 * Logo reutilizável da plataforma
 */

import React from 'react';
import Icon from './Icon';

interface TxopitoLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'auth' | 'sidebar' | 'minimal';
  showText?: boolean;
  className?: string;
}

export const TxopitoLogo: React.FC<TxopitoLogoProps> = ({
  size = 'medium',
  variant = 'default',
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    small: {
      container: 'w-6 h-6',
      icon: 16,
      text: 'text-sm'
    },
    medium: {
      container: 'w-8 h-8',
      icon: 20,
      text: 'text-lg'
    },
    large: {
      container: 'w-12 h-12 sm:w-14 md:w-16 sm:h-14 md:h-16',
      icon: 24,
      text: 'text-xl sm:text-2xl md:text-3xl'
    }
  };

  const variantClasses = {
    default: {
      container: 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20',
      icon: 'text-white',
      text: 'text-gray-900 font-bold'
    },
    auth: {
      container: 'bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-lg',
      icon: 'text-white',
      text: 'text-gray-900 font-bold'
    },
    sidebar: {
      container: 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20',
      icon: 'text-white',
      text: 'text-white font-bold tracking-tight'
    },
    minimal: {
      container: 'bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md',
      icon: 'text-white',
      text: 'text-gray-700 font-semibold'
    }
  };

  const currentSize = sizeClasses[size];
  const currentVariant = variantClasses[variant];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${currentSize.container} ${currentVariant.container} flex items-center justify-center`}>
        <Icon name="Brain" size={currentSize.icon} className={currentVariant.icon} />
      </div>
      {showText && (
        <span className={`${currentSize.text} ${currentVariant.text}`}>
          TXOPITO
        </span>
      )}
    </div>
  );
};

export default TxopitoLogo;