/**
 * VoiceInput - TXOPITO IA
 * Componente de entrada por voz (Speech-to-Text)
 */

import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import VoiceVisualizer from './VoiceVisualizer';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  language: 'pt' | 'en';
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  language,
  disabled = false,
  placeholder = "Clique e segure para falar",
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isManualStop = useRef(false);

  useEffect(() => {
    // Verifica suporte do navegador
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      
      // Configurações do reconhecimento
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'pt' ? 'pt-BR' : 'en-US';
      recognition.maxAlternatives = 1;

      // Event handlers
      recognition.onstart = () => {
        console.log('🎤 Reconhecimento de voz iniciado');
        setIsRecording(true);
        setError(null);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;
          
          if (result.isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimText += transcriptText;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          setInterimTranscript('');
          
          // Chama callback com texto final
          const fullText = transcript + finalTranscript;
          if (fullText.trim()) {
            onTranscript(fullText.trim());
          }
        } else {
          setInterimTranscript(interimText);
        }
      };

      recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        
        const errorMessages: { [key: string]: string } = {
          'not-allowed': 'Permissão de microfone negada. Permita o acesso para usar este recurso.',
          'no-speech': 'Nenhuma fala detectada. Tente falar mais alto ou verificar o microfone.',
          'audio-capture': 'Erro no microfone. Verifique se está conectado e funcionando.',
          'network': 'Erro de rede. Verifique sua conexão com a internet.',
          'service-not-allowed': 'Serviço de reconhecimento não permitido.',
          'bad-grammar': 'Erro na gramática de reconhecimento.',
          'language-not-supported': 'Idioma não suportado.'
        };

        const errorMessage = errorMessages[event.error] || `Erro desconhecido: ${event.error}`;
        setError(errorMessage);
        
        if (event.error === 'not-allowed') {
          setPermissionDenied(true);
        }
        
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('🎤 Reconhecimento de voz finalizado');
        setIsRecording(false);
        
        // Se não foi parada manualmente e há texto, reinicia automaticamente
        if (!isManualStop.current && (transcript || interimTranscript)) {
          // Pequeno delay antes de reiniciar
          setTimeout(() => {
            if (!isManualStop.current) {
              startRecording();
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.warn('Speech Recognition não suportado neste navegador');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, transcript, interimTranscript, onTranscript]);

  const startRecording = () => {
    if (!recognitionRef.current || disabled || isRecording) return;

    try {
      isManualStop.current = false;
      recognitionRef.current.start();
      
      // Auto-stop após 30 segundos por segurança
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
      
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setError('Erro ao iniciar gravação. Tente novamente.');
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current || !isRecording) return;

    try {
      isManualStop.current = true;
      recognitionRef.current.stop();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      setError(null);
    } catch (error) {
      setPermissionDenied(true);
      setError('Permissão de microfone necessária para usar este recurso.');
    }
  };

  // Não renderiza se não há suporte
  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Icon name="MicOff" size={16} />
        <span className="text-xs">Voz não suportada</span>
      </div>
    );
  }

  // Se permissão negada, mostra botão para solicitar
  if (permissionDenied) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={requestPermission}
          className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
          title="Permitir acesso ao microfone"
        >
          <Icon name="Mic" size={16} />
          <span>Permitir Microfone</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Botão principal de gravação */}
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={`
          relative p-3 rounded-full transition-all duration-200 shadow-md
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : isRecording 
              ? 'bg-red-500 text-white animate-pulse shadow-lg scale-110' 
              : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:scale-105'
          }
        `}
        title={
          disabled 
            ? 'Microfone desabilitado'
            : isRecording 
              ? 'Clique para parar a gravação' 
              : 'Clique para gravar áudio'
        }
      >
        <Icon 
          name={isRecording ? "Square" : "Mic"} 
          size={20} 
        />
        
        {/* Indicador de gravação */}
        {isRecording && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
        )}
      </button>

      {/* Área de transcript */}
      {(transcript || interimTranscript || isRecording) && (
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 min-h-12">
            {isRecording && !transcript && !interimTranscript && (
              <div className="flex items-center gap-3 text-gray-500">
                <VoiceVisualizer isRecording={true} />
                <span className="text-sm">Ouvindo...</span>
              </div>
            )}
            
            {transcript && (
              <span className="text-gray-900">{transcript}</span>
            )}
            
            {interimTranscript && (
              <span className="text-gray-500 italic">{interimTranscript}</span>
            )}
          </div>
          
          {/* Botão de limpar */}
          {(transcript || interimTranscript) && (
            <button
              onClick={clearTranscript}
              className="mt-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <Icon name="X" size={12} />
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Indicador de status compacto */}
      {!transcript && !interimTranscript && !isRecording && (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-sm">{placeholder}</span>
        </div>
      )}

      {/* Mensagem de erro */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 bg-red-50 px-2 py-1 rounded text-xs">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;