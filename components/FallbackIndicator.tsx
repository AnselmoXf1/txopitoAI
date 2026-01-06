import React from 'react';
import Icon from './Icon';

interface FallbackIndicatorProps {
  type: 'social-login' | 'ai-offline' | 'image-generation';
  className?: string;
}

const FallbackIndicator: React.FC<FallbackIndicatorProps> = ({ type, className = '' }) => {
  const getConfig = () => {
    switch (type) {
      case 'social-login':
        return {
          icon: 'AlertCircle',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Login Social Indisponível',
          message: 'Use email e senha por enquanto'
        };
      case 'ai-offline':
        return {
          icon: 'Wifi',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'IA em Modo Offline',
          message: 'Respostas básicas disponíveis'
        };
      case 'image-generation':
        return {
          icon: 'ImageOff',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Geração de Imagem Indisponível',
          message: 'Tente novamente em alguns minutos'
        };
      default:
        return {
          icon: 'AlertTriangle',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          title: 'Serviço Indisponível',
          message: 'Funcionalidade temporariamente offline'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon 
        name={config.icon as any} 
        size={16} 
        className={`${config.color} animate-pulse`} 
      />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${config.color}`}>
          {config.title}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {config.message}
        </p>
      </div>
    </div>
  );
};

export default FallbackIndicator;