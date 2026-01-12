/**
 * Reports Panel - TXOPITO IA
 * Painel para gerar relatórios e estatísticas do usuário
 */

import React, { useState, useEffect } from 'react';
import { User, ChatSession } from '../types';
import Icon from './Icon';
import { ChatService, UserService } from '../services/browserApi';

interface ReportsPanelProps {
  user: User;
  currentSession?: ChatSession;
  onClose: () => void;
}

interface UserStats {
  totalSessions: number;
  totalMessages: number;
  totalXP: number;
  averageMessagesPerSession: number;
  mostUsedDomain: string;
  studyStreak: number;
  totalStudyTime: number; // em minutos
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ user, currentSession, onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<'overview' | 'detailed' | 'export'>('overview');

  useEffect(() => {
    loadUserStats();
  }, [user.id]);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      const sessions = await ChatService.getSessions(user.id);
      
      const totalSessions = sessions.length;
      const totalMessages = sessions.reduce((acc, session) => acc + session.messages.length, 0);
      const averageMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;
      
      // Calcula domínio mais usado
      const domainCount: Record<string, number> = {};
      sessions.forEach(session => {
        domainCount[session.domainId] = (domainCount[session.domainId] || 0) + 1;
      });
      const mostUsedDomain = Object.keys(domainCount).reduce((a, b) => 
        domainCount[a] > domainCount[b] ? a : b, 'PROGRAMMING'
      );

      // Calcula streak de estudo (dias consecutivos)
      const studyDates = sessions.map(s => new Date(s.createdAt).toDateString()).sort();
      const uniqueDates = [...new Set(studyDates)];
      let studyStreak = 0;
      const today = new Date().toDateString();
      
      for (let i = uniqueDates.length - 1; i >= 0; i--) {
        const date = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((new Date(today).getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === studyStreak) {
          studyStreak++;
        } else {
          break;
        }
      }

      // Estima tempo de estudo (baseado no número de mensagens)
      const totalStudyTime = Math.round(totalMessages * 2.5); // ~2.5 min por mensagem

      setStats({
        totalSessions,
        totalMessages,
        totalXP: user.xp || 0,
        averageMessagesPerSession,
        mostUsedDomain,
        studyStreak,
        totalStudyTime
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDetailedReport = () => {
    if (!stats) return '';

    const report = `
# RELATÓRIO DETALHADO - TXOPITO IA
**Usuário:** ${user.name}
**Data:** ${new Date().toLocaleDateString('pt-BR')}
**Nível:** ${user.level || 1}

## 📊 ESTATÍSTICAS GERAIS
- **Total de Sessões:** ${stats.totalSessions}
- **Total de Mensagens:** ${stats.totalMessages}
- **XP Total:** ${stats.totalXP}
- **Média de Mensagens por Sessão:** ${stats.averageMessagesPerSession}
- **Domínio Mais Usado:** ${stats.mostUsedDomain}
- **Sequência de Estudo:** ${stats.studyStreak} dias
- **Tempo Total de Estudo:** ${Math.floor(stats.totalStudyTime / 60)}h ${stats.totalStudyTime % 60}min

## 🎯 ANÁLISE DE DESEMPENHO
- **Engajamento:** ${stats.averageMessagesPerSession > 10 ? 'Alto' : stats.averageMessagesPerSession > 5 ? 'Médio' : 'Baixo'}
- **Consistência:** ${stats.studyStreak > 7 ? 'Excelente' : stats.studyStreak > 3 ? 'Boa' : 'Pode melhorar'}
- **Progresso:** ${user.level && user.level > 5 ? 'Avançado' : user.level && user.level > 2 ? 'Intermediário' : 'Iniciante'}

## 💡 RECOMENDAÇÕES
${stats.studyStreak < 3 ? '- Tente manter uma rotina diária de estudos\n' : ''}
${stats.averageMessagesPerSession < 5 ? '- Explore mais tópicos em cada sessão\n' : ''}
${stats.totalSessions < 10 ? '- Continue praticando para desenvolver suas habilidades\n' : ''}

---
Relatório gerado automaticamente pelo TXOPITO IA
    `.trim();

    return report;
  };

  const exportReport = (type: 'txt' | 'json') => {
    if (!stats) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (type === 'json') {
      content = JSON.stringify({
        user: {
          name: user.name,
          level: user.level,
          xp: user.xp
        },
        stats,
        generatedAt: new Date().toISOString()
      }, null, 2);
      filename = `txopito-report-${user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      mimeType = 'application/json';
    } else {
      content = generateDetailedReport();
      filename = `txopito-report-${user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon name="BarChart3" size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Relatórios e Estatísticas</h2>
                <p className="text-sm text-gray-600">Análise do seu progresso no TXOPITO IA</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icon name="X" size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setSelectedReport('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReport === 'overview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setSelectedReport('detailed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReport === 'detailed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Relatório Detalhado
            </button>
            <button
              onClick={() => setSelectedReport('export')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReport === 'export' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Exportar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {selectedReport === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                  <div className="text-sm text-blue-700">Sessões</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
                  <div className="text-sm text-green-700">Mensagens</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalXP}</div>
                  <div className="text-sm text-purple-700">XP Total</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="text-2xl font-bold text-orange-600">{stats.studyStreak}</div>
                  <div className="text-sm text-orange-700">Dias Seguidos</div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">Engajamento</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Média por Sessão</span>
                      <span>{stats.averageMessagesPerSession} mensagens</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((stats.averageMessagesPerSession / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-3">Tempo de Estudo</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Estimado</span>
                      <span>{Math.floor(stats.totalStudyTime / 60)}h {stats.totalStudyTime % 60}min</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((stats.totalStudyTime / 600) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'detailed' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                  {generateDetailedReport()}
                </pre>
              </div>
            </div>
          )}

          {selectedReport === 'export' && (
            <div className="space-y-6">
              <div className="text-center">
                <Icon name="Download" size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Exportar Relatórios</h3>
                <p className="text-gray-600">Baixe seus dados e estatísticas em diferentes formatos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => exportReport('txt')}
                  className="p-6 border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-xl transition-colors group"
                >
                  <Icon name="FileText" size={32} className="text-gray-400 group-hover:text-blue-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Relatório Completo (.txt)</h4>
                  <p className="text-sm text-gray-600">Relatório detalhado em formato texto</p>
                </button>

                <button
                  onClick={() => exportReport('json')}
                  className="p-6 border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl transition-colors group"
                >
                  <Icon name="Code" size={32} className="text-gray-400 group-hover:text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Dados Estruturados (.json)</h4>
                  <p className="text-sm text-gray-600">Dados em formato JSON para análise</p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPanel;