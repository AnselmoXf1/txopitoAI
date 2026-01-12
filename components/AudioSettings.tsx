/**
 * AudioSettings - TXOPITO IA
 * Configurações avançadas de áudio e voz
 */

import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import SpeechService, { SpeechConfig, VoiceOption } from '../services/speechService';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'pt' | 'en';
}

const AudioSettings: React.FC<AudioSettingsProps> = ({ isOpen, onClose, language }) => {
  const [config, setConfig] = useState<SpeechConfig>(SpeechService.getConfig());
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVoices();
    }
  }, [isOpen, language]);

  const loadVoices = async () => {
    try {
      setIsLoading(true);
      const speechLang = language === 'pt' ? 'pt-BR' : 'en-US';
      const voiceOptions = await SpeechService.getVoiceOptions(speechLang);
      setVoices(voiceOptions);
    } catch (error) {
      console.error('Erro ao carregar vozes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (key: keyof SpeechConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    SpeechService.updateConfig(newConfig);
  };

  const handleVoiceSelect = (voice: SpeechSynthesisVoice) => {
    handleConfigChange('voice', voice);
  };

  const testVoice = async (voice: SpeechSynthesisVoice) => {
    try {
      setTestingVoice(voice.name);
      const speechLang = language === 'pt' ? 'pt-BR' : 'en-US';
      await SpeechService.testVoice(voice, speechLang);
    } catch (error) {
      console.error('Erro ao testar voz:', error);
    } finally {
      setTestingVoice(null);
    }
  };

  const resetToDefaults = () => {
    SpeechService.resetConfig();
    setConfig(SpeechService.getConfig());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Icon name="Volume2" size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Configurações de Áudio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Auto-play */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoPlay}
                onChange={(e) => handleConfigChange('autoPlay', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-gray-900">Auto-reproduzir respostas</span>
                <p className="text-sm text-gray-600">
                  Reproduz automaticamente as respostas da IA em áudio
                </p>
              </div>
            </label>
          </div>

          {/* Controles de velocidade, tom e volume */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Velocidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Velocidade: {config.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.rate}
                onChange={(e) => handleConfigChange('rate', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Lenta</span>
                <span>Normal</span>
                <span>Rápida</span>
              </div>
            </div>

            {/* Tom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tom: {config.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.pitch}
                onChange={(e) => handleConfigChange('pitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Grave</span>
                <span>Normal</span>
                <span>Agudo</span>
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {Math.round(config.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.volume}
                onChange={(e) => handleConfigChange('volume', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Mudo</span>
                <span>Médio</span>
                <span>Alto</span>
              </div>
            </div>
          </div>

          {/* Seleção de voz */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Selecionar Voz ({language === 'pt' ? 'Português' : 'English'})
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Carregando vozes...</span>
              </div>
            ) : voices.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {voices.map((voiceOption, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      config.voice?.name === voiceOption.voice.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleVoiceSelect(voiceOption.voice)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        config.voice?.name === voiceOption.voice.name
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`} />
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {voiceOption.name}
                          </span>
                          
                          {/* Badge de gênero */}
                          {voiceOption.gender !== 'unknown' && (
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              voiceOption.gender === 'female'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {voiceOption.gender === 'female' ? '♀' : '♂'}
                            </span>
                          )}
                          
                          {/* Badge padrão */}
                          {voiceOption.isDefault && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              Padrão
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          {voiceOption.language}
                        </p>
                      </div>
                    </div>

                    {/* Botão de teste */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        testVoice(voiceOption.voice);
                      }}
                      disabled={testingVoice === voiceOption.voice.name}
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                      title="Testar voz"
                    >
                      {testingVoice === voiceOption.voice.name ? (
                        <div className="animate-spin">
                          <Icon name="Loader2" size={16} />
                        </div>
                      ) : (
                        <Icon name="Play" size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon name="VolumeX" size={32} className="mx-auto mb-2 text-gray-300" />
                <p>Nenhuma voz disponível para este idioma</p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              onClick={resetToDefaults}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Restaurar Padrões
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;