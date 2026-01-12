/**
 * VoiceVisualizer - TXOPITO IA
 * Visualizador de ondas sonoras durante gravação
 */

import React, { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  className?: string;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isRecording, 
  className = '' 
}) => {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (isRecording) {
      // Simula ondas sonoras com valores aleatórios
      const interval = setInterval(() => {
        const newBars = Array.from({ length: 5 }, () => 
          Math.random() * 100 + 20 // Entre 20% e 120%
        );
        setBars(newBars);
      }, 150);

      return () => clearInterval(interval);
    } else {
      // Para a animação quando não está gravando
      setBars([20, 20, 20, 20, 20]);
    }
  }, [isRecording]);

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={`w-1 rounded-full transition-all duration-150 ${
            isRecording 
              ? 'bg-red-500' 
              : 'bg-gray-300'
          }`}
          style={{ 
            height: `${Math.max(4, height * 0.3)}px`,
            minHeight: '4px',
            maxHeight: '24px'
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;