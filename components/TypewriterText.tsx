/**
 * TypewriterText Component - TXOPITO IA
 * Componente que simula digitação gradual de texto
 */

import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // caracteres por segundo
  delay?: number; // delay inicial em ms
  onComplete?: () => void;
  className?: string;
  children?: (displayText: string, isComplete: boolean) => React.ReactNode;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 50, // 50 caracteres por segundo (bem rápido)
  delay = 0,
  onComplete,
  className = '',
  children
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset quando o texto muda
    setDisplayText('');
    setIsComplete(false);
    setCurrentIndex(0);

    // Limpar timers existentes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Se não há texto, marcar como completo
    if (!text.trim()) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Delay inicial
    timeoutRef.current = setTimeout(() => {
      const baseIntervalTime = 1000 / speed; // ms por caractere base
      let currentDelay = 0;

      const typeNextChar = () => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          
          if (nextIndex >= text.length) {
            // Texto completo
            setIsComplete(true);
            onComplete?.();
            return prevIndex;
          }

          // Calcular delay para o próximo caractere baseado na pontuação
          const currentChar = text[prevIndex];
          const nextChar = text[nextIndex];
          
          let nextDelay = baseIntervalTime;
          
          // Pausas mais longas em pontuações
          if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
            nextDelay = baseIntervalTime * 4; // Pausa longa após frases
          } else if (currentChar === ',' || currentChar === ';' || currentChar === ':') {
            nextDelay = baseIntervalTime * 2; // Pausa média após vírgulas
          } else if (currentChar === '\n') {
            nextDelay = baseIntervalTime * 3; // Pausa para quebras de linha
          } else if (currentChar === ' ' && (nextChar === '\n' || nextChar === ' ')) {
            nextDelay = baseIntervalTime * 1.5; // Pausa pequena em espaços duplos
          }

          // Agendar próximo caractere
          timeoutRef.current = setTimeout(typeNextChar, nextDelay);
          
          return nextIndex;
        });
      };

      // Iniciar digitação
      typeNextChar();
    }, delay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete]);

  useEffect(() => {
    setDisplayText(text.slice(0, currentIndex));
  }, [currentIndex, text]);

  // Se children é fornecido, usar render prop
  if (children) {
    return <>{children(displayText, isComplete)}</>;
  }

  // Renderização padrão
  return (
    <span className={className}>
      {displayText}
      {!isComplete && (
        <span className="animate-pulse text-blue-500 ml-1">|</span>
      )}
    </span>
  );
};

// Hook personalizado para controle mais avançado
export const useTypewriter = (
  text: string,
  options: {
    speed?: number;
    delay?: number;
    autoStart?: boolean;
  } = {}
) => {
  const { speed = 50, delay = 0, autoStart = true } = options;
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isActive, setIsActive] = useState(autoStart);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => setIsActive(true);
  const stop = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  const reset = () => {
    stop();
    setDisplayText('');
    setIsComplete(false);
    setCurrentIndex(0);
  };
  const complete = () => {
    stop();
    setDisplayText(text);
    setIsComplete(true);
    setCurrentIndex(text.length);
  };

  useEffect(() => {
    if (!isActive || !text.trim()) {
      if (!text.trim()) {
        setIsComplete(true);
      }
      return;
    }

    // Reset
    setDisplayText('');
    setIsComplete(false);
    setCurrentIndex(0);

    // Delay inicial
    timeoutRef.current = setTimeout(() => {
      const intervalTime = 1000 / speed;

      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          
          if (nextIndex >= text.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            setIsComplete(true);
            setIsActive(false);
            return prevIndex;
          }
          
          return nextIndex;
        });
      }, intervalTime);
    }, delay);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [text, speed, delay, isActive]);

  useEffect(() => {
    setDisplayText(text.slice(0, currentIndex));
  }, [currentIndex, text]);

  return {
    displayText,
    isComplete,
    isActive,
    start,
    stop,
    reset,
    complete
  };
};

export default TypewriterText;