/**
 * AudioPlayer - TXOPITO IA
 * Componente para reproduzir mensagens da IA em áudio
 */

import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import SpeechService from '../services/speechService';

interface AudioPlayerProps {
  text: string;
  language: 'pt' | 'en';
  messageId?: string;
  autoPlay?: boolean;
  showControls?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  language,
  messageId,
  autoPlay = false,
  showControls = true,
  size = 'medium',
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const progressInterval = useRef<NodeJS.Timeout>();
  const hasAutoPlayed = useRef(false);

  // Configurações de tamanho
  const sizeConfig = {
    small: { iconSize: 14, buttonSize: 'p-1', textSize: 'text-xs' },
    medium: { iconSize: 16, buttonSize: 'p-2', textSize: 'text-sm' },
    large: { iconSize: 20, buttonSize: 'p-3', textSize: 'text-base' }
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Auto-play se habilitado e ainda não reproduziu
    if (autoPlay && !hasAutoPlayed.current && text.trim()) {
      hasAutoPlayed.current = true;
      handlePlay();
    }

    return () => {
      // Limpa interval ao desmontar
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [autoPlay, text]);

  useEffect(() => {
    // Monitora mudanças no estado do SpeechService
    const checkSpeechStatus = () => {
      const speaking = SpeechService.isSpeaking();
      const paused = SpeechService.isPaused();
      
      if (!speaking && !paused && isPlaying) {
        // Fala terminou
        setIsPlaying(false);
        setIsPaused(false);
        setProgress(100);
        
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    };

    const interval = setInterval(checkSpeechStatus, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlay = async () => {
    if (!text.trim()) return;

    try {
      setError(null);
      setIsLoading(true);

      // Para qualquer áudio atual se não for este
      if (SpeechService.isSpeaking()) {
        SpeechService.stop();
      }

      const speechLang = language === 'pt' ? 'pt-BR' : 'en-US';
      
      // Estima duração baseada no texto (aproximadamente)
      const estimatedDuration = Math.max(2, text.length * 0.08); // ~80ms por caractere
      setDuration(estimatedDuration);
      setProgress(0);
      
      setIsPlaying(true);
      setIsPaused(false);
      setIsLoading(false);

      // Inicia progresso simulado
      startProgressTracking(estimatedDuration);

      // Inicia síntese de voz
      await SpeechService.speak(text, speechLang);
      
      // Fala concluída
      setIsPlaying(false);
      setProgress(100);
      
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      
      // Verificar se é erro de interrupção (não é erro fatal)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('interrupted')) {
        console.log('ℹ️ Áudio interrompido pelo usuário');
        setIsPlaying(false);
        setIsLoading(false);
        setError(null); // Não mostrar erro para interrupção
      } else {
        setError('Erro na reprodução de áudio');
        setIsPlaying(false);
        setIsLoading(false);
      }
    }
  };

  const handlePause = () => {
    if (isPlaying && !isPaused) {
      SpeechService.pause();
      setIsPaused(true);
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }
  };

  const handleResume = () => {
    if (isPaused) {
      SpeechService.resume();
      setIsPaused(false);
      
      // Retoma o progresso
      const remainingTime = duration * (1 - progress / 100);
      startProgressTracking(remainingTime);
    }
  };

  const handleStop = () => {
    SpeechService.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  };

  const startProgressTracking = (totalDuration: number) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const startTime = Date.now();
    const startProgress = progress;
    
    progressInterval.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newProgress = startProgress + (elapsed / totalDuration) * 100;
      
      if (newProgress >= 100) {
        setProgress(100);
        clearInterval(progressInterval.current!);
      } else {
        setProgress(newProgress);
      }
    }, 100);
  };

  const getMainButton = () => {
    if (isLoading) {
      return (
        <button
          disabled
          className={`${config.buttonSize} rounded-full bg-gray-100 text-gray-400 cursor-not-allowed`}
          title="Carregando..."
        >
          <div className="animate-spin">
            <Icon name="Loader2" size={config.iconSize} />
          </div>
        </button>
      );
    }

    if (isPlaying && !isPaused) {
      return (
        <button
          onClick={handlePause}
          className={`${config.buttonSize} rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors`}
          title="Pausar áudio"
        >
          <Icon name="Pause" size={config.iconSize} />
        </button>
      );
    }

    if (isPaused) {
      return (
        <button
          onClick={handleResume}
          className={`${config.buttonSize} rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors`}
          title="Continuar áudio"
        >
          <Icon name="Play" size={config.iconSize} />
        </button>
      );
    }

    return (
      <button
        onClick={handlePlay}
        className={`${config.buttonSize} rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors`}
        title="Reproduzir áudio"
      >
        <Icon name="Volume2" size={config.iconSize} />
      </button>
    );
  };

  // Não renderiza se não há suporte
  if (!SpeechService.isSupported()) {
    return null;
  }

  // Não renderiza se não há texto
  if (!text.trim()) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão principal */}
      {getMainButton()}

      {/* Controles adicionais */}
      {showControls && (isPlaying || isPaused) && (
        <>
          {/* Botão de parar */}
          <button
            onClick={handleStop}
            className={`${config.buttonSize} rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors`}
            title="Parar áudio"
          >
            <Icon name="Square" size={config.iconSize - 2} />
          </button>

          {/* Barra de progresso */}
          <div className="flex-1 min-w-16">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>

          {/* Tempo */}
          <span className={`${config.textSize} text-gray-500 min-w-8`}>
            {Math.round((progress / 100) * duration)}s
          </span>
        </>
      )}

      {/* Indicador de erro */}
      {error && (
        <span className={`${config.textSize} text-red-500`} title={error}>
          <Icon name="AlertCircle" size={config.iconSize} />
        </span>
      )}

      {/* Indicador de status */}
      {(isPlaying || isPaused) && !showControls && (
        <div className="flex items-center gap-1">
          <div className={`w-1 h-1 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
          <span className={`${config.textSize} text-gray-500`}>
            {isPaused ? 'Pausado' : 'Reproduzindo'}
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;