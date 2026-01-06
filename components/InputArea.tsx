import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';
import { Attachment } from '../types';

interface InputAreaProps {
  onSend: (text: string, attachment: Attachment | null, isImageGeneration: boolean) => void;
  isLoading: boolean;
  placeholder?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ onSend, isLoading, placeholder }) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Setup Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for this demo
        alert("Imagem muito grande. Máximo 4MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setAttachment({
          type: 'image',
          content: base64String,
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Seu navegador não suporta reconhecimento de voz.");
      }
    }
  };

  const handleSend = () => {
    if ((text.trim() || attachment) && !isLoading) {
      onSend(text, attachment, isImageMode);
      setText('');
      setAttachment(null);
      setIsImageMode(false);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border-t border-gray-100 p-2 md:p-4">
      <div className={`max-w-3xl mx-auto flex flex-col gap-1 md:gap-2 bg-gray-50/50 border transition-all duration-300 shadow-inner rounded-2xl md:rounded-3xl p-1.5 md:p-2 ${isImageMode ? 'border-purple-300 ring-2 ring-purple-100' : 'border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100'}`}>
        
        {/* Preview Area */}
        {attachment && (
          <div className="relative inline-block w-16 h-16 md:w-20 md:h-20 m-1 md:m-2 group">
            <img 
              src={`data:${attachment.mimeType};base64,${attachment.content}`} 
              alt="Preview" 
              className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm"
            />
            <button 
              onClick={() => setAttachment(null)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 md:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Icon name="X" size={10} />
            </button>
          </div>
        )}

        {/* Controls and Input */}
        <div className="flex items-end gap-1 md:gap-2">
          {/* Tools */}
          <div className="flex items-center gap-0.5 md:gap-1 pb-1 md:pb-2 pl-0.5 md:pl-1">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 md:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="Anexar Imagem"
              disabled={isImageMode} // Disable upload in generation mode for simplicity
            >
              <Icon name="Paperclip" size={16} />
            </button>
            <button 
              onClick={() => setIsImageMode(!isImageMode)}
              className={`p-1.5 md:p-2 rounded-full transition-colors ${isImageMode ? 'text-purple-600 bg-purple-100' : 'text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`}
              title="Gerar Imagem com IA"
              disabled={!!attachment} // Disable generation if uploading
            >
              <Icon name="Wand2" size={16} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isImageMode ? "Descreva a imagem que deseja gerar..." : (placeholder || "Digite sua mensagem...")}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 md:py-3 px-1 md:px-2 text-sm md:text-base max-h-[120px] md:max-h-[200px] overflow-y-auto text-slate-800 placeholder-slate-400 outline-none"
          />
          
          <div className="flex items-center gap-0.5 md:gap-1 pb-0.5">
            <button 
              onClick={toggleListening}
              className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-200'}`}
            >
              <Icon name={isListening ? "MicOff" : "Mic"} size={16} />
            </button>

            <button
              onClick={handleSend}
              disabled={(!text.trim() && !attachment) || isLoading}
              className={`
                p-2 md:p-3 rounded-xl md:rounded-2xl flex-shrink-0 transition-all duration-300
                ${(text.trim() || attachment) && !isLoading 
                  ? (isImageMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:scale-105')
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              <Icon name={isImageMode ? "Wand2" : "Send"} size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="text-center text-[9px] md:text-[10px] text-gray-400 mt-1 md:mt-2 font-medium flex items-center justify-center gap-1 md:gap-2">
        <span>TXOPITO IA v2.5</span>
        {isImageMode && <span className="text-purple-500 font-bold">• Modo Criativo Ativado</span>}
      </div>
    </div>
  );
};

export default InputArea;