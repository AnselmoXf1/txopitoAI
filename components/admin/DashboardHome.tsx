import React, { useState, useEffect } from 'react';
import { User, ChatSession } from '../../types';
import Icon from '../Icon';
import AdminService, { AdminStats, TopicStats, HourlyStats } from '../../services/adminService';

interface DashboardHomeProps {
  users: User[];
  sessions: ChatSession[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ users, sessions }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topTopics, setTopTopics] = useState<TopicStats[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, [users, sessions]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Carrega estatísticas reais do MongoDB
      const [systemStats, topics, hourly] = await Promise.all([
        AdminService.getSystemStats(),
        AdminService.getTopTopics(),
        AdminService.getHourlyStats()
      ]);
      
      setStats(systemStats);
      setTopTopics(topics);
      setHourlyData(hourly);
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      
      // Fallback para dados calculados localmente
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      const fallbackStats: AdminStats = {
        totalUsers: users.length,
        totalSessions: sessions.length,
        totalMemories: 0,
        activeUsers: users.filter(u => u.updatedAt > now - (7 * 24 * 60 * 60 * 1000)).length,
        newUsersToday: users.filter(u => u.createdAt > oneDayAgo).length,
        interactionsToday: sessions.filter(s => s.createdAt > oneDayAgo).length,
        totalInteractions: sessions.reduce((acc, session) => acc + session.messages.length, 0)
      };
      
      setStats(fallbackStats);
      setTopTopics([]);
      setHourlyData(Array.from({ length: 24 }, (_, i) => ({ hour: i, interactions: 0 })));
      
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Carregando estatísticas...</span>
        </div>
      </div>
    );
  }

  // Cálculos de estatísticas baseados nos dados reais
  const totalUsers = stats.totalUsers;
  const newUsersToday = stats.newUsersToday;
  const totalInteractions = stats.totalInteractions;
  const interactionsToday = stats.interactionsToday;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: string;
    color: string;
  }> = ({ title, value, change, changeType = 'neutral', icon, color }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon name={icon as any} size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Geral</h2>
        <p className="text-gray-600">Visão geral do sistema TXOPITO IA</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Usuários"
          value={totalUsers}
          change={newUsersToday > 0 ? `+${newUsersToday} hoje` : 'Nenhum novo hoje'}
          changeType={newUsersToday > 0 ? "positive" : "neutral"}
          icon="Users"
          color="bg-blue-600"
        />
        <StatCard
          title="Interações Totais"
          value={totalInteractions}
          change={interactionsToday > 0 ? `+${interactionsToday} hoje` : 'Nenhuma hoje'}
          changeType={interactionsToday > 0 ? "positive" : "neutral"}
          icon="MessageSquare"
          color="bg-green-600"
        />
        <StatCard
          title="Sessões Ativas"
          value={stats.totalSessions}
          change="Últimas 24h"
          changeType="neutral"
          icon="Activity"
          color="bg-purple-600"
        />
        <StatCard
          title="Usuários Ativos"
          value={stats.activeUsers}
          change="Últimos 7 dias"
          changeType="positive"
          icon="CheckCircle"
          color="bg-emerald-600"
        />
      </div>

      {/* Alertas */}
      {stats.totalUsers === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Nenhum Dado Encontrado</h3>
              <p className="text-yellow-700 text-sm">
                MongoDB conectado mas sem dados de usuários. Use a aplicação para gerar dados.
              </p>
            </div>
          </div>
        </div>
      )}

      {stats.totalUsers > 0 && stats.totalSessions === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Icon name="Info" size={20} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Dados Parciais</h3>
              <p className="text-blue-700 text-sm">
                Usuários encontrados mas sem sessões de chat. Inicie conversas para ver mais dados.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Interações por Hora */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Interações por Hora (Hoje)
          </h3>
          <div className="h-64 flex items-end justify-between gap-1">
            {hourlyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className="bg-blue-600 rounded-t w-full min-h-[4px] transition-all hover:bg-blue-700"
                  style={{ height: `${(data.interactions / 60) * 100}%` }}
                  title={`${data.hour}h: ${data.interactions} interações`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {data.hour}h
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tópicos Mais Populares */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tópicos Mais Perguntados
          </h3>
          <div className="space-y-3">
            {topTopics.length > 0 ? (
              topTopics.map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      index === 2 ? 'bg-purple-600' :
                      index === 3 ? 'bg-yellow-600' : 'bg-gray-400'
                    }`} />
                    <span className="font-medium text-gray-700">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-purple-600' :
                          index === 3 ? 'bg-yellow-600' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min((topic.count / Math.max(...topTopics.map(t => t.count))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-600 w-8">
                      {topic.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Icon name="MessageSquare" size={32} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Nenhum tópico encontrado</p>
                <p className="text-xs">Inicie conversas para ver estatísticas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h3>
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.slice(0, 5).map((session, index) => {
              const user = users.find(u => u.id === session.userId);
              const time = new Date(session.createdAt).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              
              return (
                <div key={index} className="flex items-center gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-sm text-gray-500 w-12">{time}</span>
                  <span className="text-sm font-medium text-gray-700 w-24">
                    {user?.name || 'Usuário'}
                  </span>
                  <span className="text-sm text-gray-600 flex-1">
                    Iniciou conversa: {session.title}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Clock" size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhuma atividade recente</p>
              <p className="text-xs">As atividades aparecerão aqui quando houver uso da plataforma</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;