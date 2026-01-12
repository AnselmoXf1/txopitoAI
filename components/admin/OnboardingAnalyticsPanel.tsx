/**
 * Onboarding Analytics Panel - TXOPITO IA
 * Painel administrativo para visualizar dados de onboarding
 */

import React, { useState, useEffect } from 'react';
import { OnboardingService, OnboardingAnalytics } from '../../services/onboardingService';
import Icon from '../Icon';

const OnboardingAnalyticsPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<OnboardingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'discovery' | 'goals' | 'demographics' | 'feedback'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    setLoading(true);
    try {
      const data = OnboardingService.generateAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao carregar analytics de onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const report = OnboardingService.generateOnboardingReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onboarding-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center p-8">
        <Icon name="AlertCircle" size={48} className="text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar dados de onboarding</p>
        <button
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="Users" size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="CheckCircle" size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icon name="Clock" size={24} className="text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(analytics.averageCompletionTime / (1000 * 60))}min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icon name="Star" size={24} className="text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Top Expectativa</p>
              <p className="text-sm font-bold text-gray-900">
                {analytics.topExpectations[0]?.expectation.substring(0, 20) || 'N/A'}...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fontes de Descoberta</h3>
          <div className="space-y-3">
            {Object.entries(analytics.discoverySourceStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([source, count]) => {
                const total = Object.values(analytics.discoverySourceStats).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                return (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Objetivos Principais</h3>
          <div className="space-y-3">
            {Object.entries(analytics.primaryGoalStats)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([goal, count]) => {
                const total = Object.values(analytics.primaryGoalStats).reduce((a, b) => a + b, 0);
                const percentage = ((count / total) * 100).toFixed(1);
                return (
                  <div key={goal} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{goal.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDiscovery = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Como os Usuários Conheceram a Plataforma</h3>
      <div className="space-y-4">
        {Object.entries(analytics.discoverySourceStats)
          .sort(([, a], [, b]) => b - a)
          .map(([source, count]) => {
            const total = Object.values(analytics.discoverySourceStats).reduce((a, b) => a + b, 0);
            const percentage = ((count / total) * 100).toFixed(1);
            
            const sourceLabels: Record<string, string> = {
              'google_search': 'Pesquisa no Google',
              'social_media': 'Redes Sociais',
              'friend_recommendation': 'Indicação de Amigo',
              'advertisement': 'Publicidade/Anúncio',
              'blog_article': 'Artigo/Blog',
              'youtube': 'YouTube/Vídeo',
              'other': 'Outro'
            };
            
            return (
              <div key={source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">{sourceLabels[source] || source}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-16">{count} ({percentage}%)</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Objetivos dos Usuários</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(analytics.primaryGoalStats)
            .sort(([, a], [, b]) => b - a)
            .map(([goal, count]) => {
              const total = Object.values(analytics.primaryGoalStats).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              
              const goalLabels: Record<string, string> = {
                'learning': 'Aprender e Estudar',
                'work_assistance': 'Assistência no Trabalho',
                'research': 'Pesquisa e Investigação',
                'productivity': 'Aumentar Produtividade',
                'entertainment': 'Entretenimento',
                'other': 'Outro'
              };
              
              return (
                <div key={goal} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{goalLabels[goal] || goal}</span>
                    <span className="text-sm font-bold text-gray-600">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">{percentage}% dos usuários</span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Expectativas</h3>
        <div className="space-y-3">
          {analytics.topExpectations.slice(0, 8).map((item, index) => (
            <div key={item.expectation} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-gray-900">{item.expectation}</span>
              </div>
              <span className="text-sm font-bold text-gray-600">{item.count} usuários</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDemographics = () => (
    <div className="space-y-6">
      {Object.keys(analytics.demographicStats.ageRanges).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Faixas Etárias</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(analytics.demographicStats.ageRanges)
              .sort(([, a], [, b]) => b - a)
              .map(([age, count]) => (
                <div key={age} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600">{age} anos</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {Object.keys(analytics.demographicStats.locations).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Localizações Mais Comuns</h3>
          <div className="space-y-2">
            {Object.entries(analytics.demographicStats.locations)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([location, count]) => (
                <div key={location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{location}</span>
                  <span className="text-sm font-bold text-gray-600">{count} usuários</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {Object.keys(analytics.demographicStats.professions).length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Profissões Mais Comuns</h3>
          <div className="space-y-2">
            {Object.entries(analytics.demographicStats.professions)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 10)
              .map(([profession, count]) => (
                <div key={profession} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{profession}</span>
                  <span className="text-sm font-bold text-gray-600">{count} usuários</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Palavras Mais Mencionadas no Feedback</h3>
      {analytics.commonFeedback.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {analytics.commonFeedback.map((word, index) => (
            <span 
              key={word}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              style={{ fontSize: `${Math.max(0.8, 1.2 - (index * 0.05))}rem` }}
            >
              {word}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">Nenhum feedback coletado ainda</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics de Onboarding</h2>
          <p className="text-gray-600">Insights sobre como os usuários conhecem e usam a plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Atualizar
          </button>
          <button
            onClick={downloadReport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon name="Download" size={16} className="mr-2" />
            Baixar Relatório
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: 'BarChart3' },
            { id: 'discovery', label: 'Descoberta', icon: 'Search' },
            { id: 'goals', label: 'Objetivos', icon: 'Target' },
            { id: 'demographics', label: 'Demografia', icon: 'Users' },
            { id: 'feedback', label: 'Feedback', icon: 'MessageSquare' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon as any} size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'discovery' && renderDiscovery()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'demographics' && renderDemographics()}
        {activeTab === 'feedback' && renderFeedback()}
      </div>
    </div>
  );
};

export default OnboardingAnalyticsPanel;