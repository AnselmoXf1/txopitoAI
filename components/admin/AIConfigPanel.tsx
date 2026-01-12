import React, { useState, useEffect } from 'react';
import { DomainId, DOMAINS } from '../../constants';
import Icon from '../Icon';

interface AIConfig {
  activeModel: string;
  maxInteractionsPerUser: number;
  responseSettings: {
    creativity: number;
    formality: number;
    responseSpeed: 'fast' | 'balanced' | 'thorough';
  };
  autoResponses: Array<{
    id: string;
    trigger: string;
    response: string;
    enabled: boolean;
  }>;
  domainSettings: Record<DomainId, {
    enabled: boolean;
    customPrompt?: string;
  }>;
}

const AIConfigPanel: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>({
    activeModel: 'gemini-1.5-pro',
    maxInteractionsPerUser: 100,
    responseSettings: {
      creativity: 70,
      formality: 50,
      responseSpeed: 'balanced'
    },
    autoResponses: [
      {
        id: '1',
        trigger: 'olá',
        response: 'Olá! Como posso ajudar você hoje?',
        enabled: true
      },
      {
        id: '2',
        trigger: 'obrigado',
        response: 'De nada! Fico feliz em ajudar.',
        enabled: true
      }
    ],
    domainSettings: Object.keys(DOMAINS).reduce((acc, domainId) => ({
      ...acc,
      [domainId]: { enabled: true }
    }), {} as Record<DomainId, { enabled: boolean; customPrompt?: string }>)
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const availableModels = [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Modelo principal, balanceado' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Mais rápido, menos recursos' },
    { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Versão estável anterior' }
  ];

  const updateConfig = (updates: Partial<AIConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateResponseSettings = (updates: Partial<AIConfig['responseSettings']>) => {
    setConfig(prev => ({
      ...prev,
      responseSettings: { ...prev.responseSettings, ...updates }
    }));
    setHasChanges(true);
  };

  const updateDomainSetting = (domainId: DomainId, updates: Partial<AIConfig['domainSettings'][DomainId]>) => {
    setConfig(prev => ({
      ...prev,
      domainSettings: {
        ...prev.domainSettings,
        [domainId]: { ...prev.domainSettings[domainId], ...updates }
      }
    }));
    setHasChanges(true);
  };

  const addAutoResponse = () => {
    const newResponse = {
      id: Date.now().toString(),
      trigger: '',
      response: '',
      enabled: true
    };
    setConfig(prev => ({
      ...prev,
      autoResponses: [...prev.autoResponses, newResponse]
    }));
    setHasChanges(true);
  };

  const updateAutoResponse = (id: string, updates: Partial<AIConfig['autoResponses'][0]>) => {
    setConfig(prev => ({
      ...prev,
      autoResponses: prev.autoResponses.map(ar => 
        ar.id === id ? { ...ar, ...updates } : ar
      )
    }));
    setHasChanges(true);
  };

  const removeAutoResponse = (id: string) => {
    setConfig(prev => ({
      ...prev,
      autoResponses: prev.autoResponses.filter(ar => ar.id !== id)
    }));
    setHasChanges(true);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      // Em um sistema real, isso salvaria no backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula salvamento no localStorage
      localStorage.setItem('txopito_ai_config', JSON.stringify(config));
      
      setHasChanges(false);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const resetConfig = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      // Recarrega configurações padrão
      window.location.reload();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração da IA</h2>
          <p className="text-gray-600">Ajuste o comportamento e parâmetros da inteligência artificial</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetConfig}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Resetar
          </button>
          <button
            onClick={saveConfig}
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded-lg transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Modelo Ativo */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modelo de IA</h3>
        <div className="space-y-3">
          {availableModels.map(model => (
            <label key={model.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={config.activeModel === model.id}
                onChange={(e) => updateConfig({ activeModel: e.target.value })}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{model.name}</div>
                <div className="text-sm text-gray-500">{model.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Limites e Configurações Gerais */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Limites e Configurações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Máximo de Interações por Usuário (por dia)
            </label>
            <input
              type="number"
              value={config.maxInteractionsPerUser}
              onChange={(e) => updateConfig({ maxInteractionsPerUser: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Velocidade de Resposta
            </label>
            <select
              value={config.responseSettings.responseSpeed}
              onChange={(e) => updateResponseSettings({ responseSpeed: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="fast">Rápida (menos detalhada)</option>
              <option value="balanced">Balanceada</option>
              <option value="thorough">Completa (mais detalhada)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Parâmetros de Resposta */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parâmetros de Resposta</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criatividade: {config.responseSettings.creativity}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.responseSettings.creativity}
              onChange={(e) => updateResponseSettings({ creativity: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Conservadora</span>
              <span>Criativa</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formalidade: {config.responseSettings.formality}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={config.responseSettings.formality}
              onChange={(e) => updateResponseSettings({ formality: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Casual</span>
              <span>Formal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configurações por Domínio */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações por Domínio</h3>
        <div className="space-y-4">
          {Object.entries(DOMAINS).map(([domainId, domain]) => (
            <div key={domainId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icon name={domain.icon as any} size={20} className={domain.color} />
                  <span className="font-medium text-gray-900">{domain.name}</span>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.domainSettings[domainId as DomainId]?.enabled ?? true}
                    onChange={(e) => updateDomainSetting(domainId as DomainId, { enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Ativo</span>
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">{domain.description}</p>
              <textarea
                placeholder="Prompt personalizado para este domínio (opcional)"
                value={config.domainSettings[domainId as DomainId]?.customPrompt || ''}
                onChange={(e) => updateDomainSetting(domainId as DomainId, { customPrompt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Respostas Automáticas */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Respostas Automáticas</h3>
          <button
            onClick={addAutoResponse}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="Plus" size={16} />
            Adicionar
          </button>
        </div>
        
        <div className="space-y-3">
          {config.autoResponses.map(autoResponse => (
            <div key={autoResponse.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                checked={autoResponse.enabled}
                onChange={(e) => updateAutoResponse(autoResponse.id, { enabled: e.target.checked })}
              />
              <input
                type="text"
                placeholder="Palavra-chave ou frase"
                value={autoResponse.trigger}
                onChange={(e) => updateAutoResponse(autoResponse.id, { trigger: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Resposta automática"
                value={autoResponse.response}
                onChange={(e) => updateAutoResponse(autoResponse.id, { response: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => removeAutoResponse(autoResponse.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          ))}
        </div>
        
        {config.autoResponses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Icon name="MessageSquare" size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Nenhuma resposta automática configurada</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConfigPanel;