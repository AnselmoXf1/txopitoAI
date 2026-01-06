import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { User, DomainId } from '../types';
import { memoryService } from '../backend/memoryService';

interface MemoryPanelProps {
  user: User;
  currentDomain: DomainId;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ user, currentDomain }) => {
  const [longTermMemory, setLongTermMemory] = useState<any>(null);
  const [mediumTermMemory, setMediumTermMemory] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMemoryData = async () => {
      try {
        setLoading(true);
        
        // Inicializa memória de longo prazo se não existir
        let longTerm = await memoryService.getLongTermMemory(user.id);
        if (!longTerm) {
          longTerm = await memoryService.initializeLongTermMemory(user.id, user.name);
        }
        
        const mediumTerm = await memoryService.getMediumTermMemory(user.id);
        
        setLongTermMemory(longTerm);
        setMediumTermMemory(mediumTerm);
      } catch (error) {
        console.error('Erro ao carregar dados de memória:', error);
        // Em caso de erro, inicializa memória básica
        try {
          const basicMemory = await memoryService.initializeLongTermMemory(user.id, user.name);
          setLongTermMemory(basicMemory);
        } catch (initError) {
          console.error('Erro ao inicializar memória:', initError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadMemoryData();
  }, [user.id, currentDomain]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  const currentLevel = longTermMemory?.knowledgeLevel?.[currentDomain] || 'beginner';
  const learningProgress = mediumTermMemory?.learningProgress?.[currentDomain];
  const frequentTopics = mediumTermMemory?.frequentTopics || {};
  const interests = longTermMemory?.interests || [];

  const levelColors = {
    beginner: 'text-green-600 bg-green-50',
    intermediate: 'text-blue-600 bg-blue-50',
    advanced: 'text-purple-600 bg-purple-50',
    expert: 'text-red-600 bg-red-50'
  };

  const levelLabels = {
    beginner: 'Iniciante',
    intermediate: 'Intermediário', 
    advanced: 'Avançado',
    expert: 'Especialista'
  };

  const handleClearMemory = async () => {
    if (confirm('Tem certeza que deseja limpar sua memória contextual? Esta ação não pode ser desfeita.')) {
      try {
        await memoryService.deleteUserMemory(user.id);
        setLongTermMemory(null);
        setMediumTermMemory(null);
        // Reinicializa memória básica
        await memoryService.initializeLongTermMemory(user.id, user.name);
        window.location.reload(); // Recarrega para atualizar estado
      } catch (error) {
        console.error('Erro ao limpar memória:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Icon name="Brain" size={18} className="text-indigo-500" />
          Perfil de Aprendizado
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
        >
          <Icon name={showDetails ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Nível de Conhecimento */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Nível Atual:</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${levelColors[currentLevel]}`}>
            {levelLabels[currentLevel]}
          </span>
        </div>
      </div>

      {/* Progresso de Aprendizado */}
      {learningProgress && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Foco Atual:</h4>
          <div className="flex flex-wrap gap-1">
            {learningProgress.currentFocus?.slice(0, 3).map((topic: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interesses */}
      {interests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Interesses:</h4>
          <div className="flex flex-wrap gap-1">
            {interests.slice(0, 3).map((interest: string, index: number) => (
              <span
                key={index}
                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {/* Estilo de Comunicação */}
          {longTermMemory?.profile && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Perfil:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Comunicação: <span className="capitalize">{longTermMemory.profile.communicationStyle}</span></div>
                <div>Aprendizado: <span className="capitalize">{longTermMemory.profile.learningStyle}</span></div>
                <div>Respostas: <span className="capitalize">{longTermMemory.profile.responseLength}</span></div>
              </div>
            </div>
          )}

          {/* Tópicos Frequentes */}
          {Object.keys(frequentTopics).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tópicos Frequentes:</h4>
              <div className="space-y-1">
                {Object.entries(frequentTopics)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .slice(0, 3)
                  .map(([topic, count]) => (
                    <div key={topic} className="flex justify-between text-xs">
                      <span className="text-gray-600 truncate">{topic}</span>
                      <span className="text-gray-400 ml-2">{count}x</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Conceitos Aprendidos */}
          {learningProgress?.conceptsLearned?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Conceitos Aprendidos:</h4>
              <div className="text-xs text-gray-600">
                {learningProgress.conceptsLearned.slice(0, 3).join(', ')}
                {learningProgress.conceptsLearned.length > 3 && '...'}
              </div>
            </div>
          )}

          {/* Controles de Memória */}
          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Memória Contextual</span>
              <button
                onClick={handleClearMemory}
                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded transition-colors"
                title="Limpar toda memória"
              >
                Limpar
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {Object.keys(frequentTopics).length} tópicos registrados
            </div>
          </div>
        </div>
      )}

      {/* Indicador de Memória Ativa */}
      <div className="flex items-center justify-center mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Memória contextual ativa</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryPanel;