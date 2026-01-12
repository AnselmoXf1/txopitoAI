import React, { useState } from 'react';
import { User, ChatSession } from '../../types';
import { DOMAINS } from '../../constants';
import Icon from '../Icon';

interface ReportsPanelProps {
  users: User[];
  sessions: ChatSession[];
}

type ReportType = 'usage' | 'engagement' | 'performance' | 'users';
type TimeRange = '7d' | '30d' | '90d' | 'all';

const ReportsPanel: React.FC<ReportsPanelProps> = ({ users, sessions }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('usage');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Função para filtrar dados por período
  const filterByTimeRange = (timestamp: number): boolean => {
    const now = Date.now();
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      'all': Infinity
    };
    return now - timestamp <= ranges[timeRange];
  };

  // Dados filtrados por período
  const filteredSessions = sessions.filter(s => filterByTimeRange(s.createdAt));
  const filteredUsers = users.filter(u => filterByTimeRange(u.createdAt));

  // Cálculos para relatórios
  const usageStats = {
    totalSessions: filteredSessions.length,
    totalMessages: filteredSessions.reduce((acc, s) => acc + s.messages.length, 0),
    avgMessagesPerSession: filteredSessions.length > 0 
      ? (filteredSessions.reduce((acc, s) => acc + s.messages.length, 0) / filteredSessions.length).toFixed(1)
      : '0',
    activeUsers: new Set(filteredSessions.map(s => s.userId)).size
  };

  const domainStats = Object.entries(DOMAINS).map(([domainId, domain]) => {
    const domainSessions = filteredSessions.filter(s => s.domainId === domainId);
    return {
      domain: domain.name,
      sessions: domainSessions.length,
      messages: domainSessions.reduce((acc, s) => acc + s.messages.length, 0),
      percentage: filteredSessions.length > 0 
        ? ((domainSessions.length / filteredSessions.length) * 100).toFixed(1)
        : '0'
    };
  }).sort((a, b) => b.sessions - a.sessions);

  const topUsers = users
    .map(user => {
      const userSessions = filteredSessions.filter(s => s.userId === user.id);
      return {
        ...user,
        sessionsCount: userSessions.length,
        messagesCount: userSessions.reduce((acc, s) => acc + s.messages.length, 0)
      };
    })
    .sort((a, b) => b.messagesCount - a.messagesCount)
    .slice(0, 10);

  // Dados para gráficos (simulados)
  const dailyUsage = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      sessions: Math.floor(Math.random() * 20) + 5,
      users: Math.floor(Math.random() * 15) + 3
    };
  });

  const exportReport = (type: string) => {
    let data: any[] = [];
    let filename = '';
    
    switch (type) {
      case 'usage':
        data = dailyUsage.map(d => ({
          data: d.date,
          sessoes: d.sessions,
          usuarios: d.users
        }));
        filename = 'relatorio_uso';
        break;
      case 'domains':
        data = domainStats.map(d => ({
          dominio: d.domain,
          sessoes: d.sessions,
          mensagens: d.messages,
          percentual: d.percentage + '%'
        }));
        filename = 'relatorio_dominios';
        break;
      case 'users':
        data = topUsers.map(u => ({
          nome: u.name,
          email: u.email,
          sessoes: u.sessionsCount,
          mensagens: u.messagesCount,
          nivel: u.level || 1,
          xp: u.xp || 0
        }));
        filename = 'relatorio_usuarios';
        break;
    }
    
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: string;
  }> = ({ title, value, change, changeType = 'neutral', icon }) => (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
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
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon name={icon as any} size={24} className="text-blue-600" />
        </div>
      </div>
    </div>
  );

  const renderUsageReport = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Sessões"
          value={usageStats.totalSessions}
          change="+12% vs período anterior"
          changeType="positive"
          icon="MessageSquare"
        />
        <StatCard
          title="Total de Mensagens"
          value={usageStats.totalMessages}
          change="+8% vs período anterior"
          changeType="positive"
          icon="Send"
        />
        <StatCard
          title="Usuários Ativos"
          value={usageStats.activeUsers}
          change="+5% vs período anterior"
          changeType="positive"
          icon="Users"
        />
        <StatCard
          title="Média Msg/Sessão"
          value={usageStats.avgMessagesPerSession}
          change="-2% vs período anterior"
          changeType="negative"
          icon="BarChart3"
        />
      </div>

      {/* Gráfico de Uso Diário */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Uso Diário</h3>
          <button
            onClick={() => exportReport('usage')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon name="Download" size={14} />
            Exportar
          </button>
        </div>
        <div className="h-64 flex items-end justify-between gap-1">
          {dailyUsage.slice(-14).map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="flex flex-col items-center gap-1 w-full">
                <div
                  className="bg-blue-600 rounded-t w-full min-h-[4px]"
                  style={{ height: `${(data.sessions / 25) * 100}%` }}
                  title={`${data.date}: ${data.sessions} sessões`}
                />
                <div
                  className="bg-green-600 rounded-t w-full min-h-[4px]"
                  style={{ height: `${(data.users / 20) * 100}%` }}
                  title={`${data.date}: ${data.users} usuários`}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                {data.date}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-600">Sessões</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-600">Usuários</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEngagementReport = () => (
    <div className="space-y-6">
      {/* Domínios Mais Populares */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Engajamento por Domínio</h3>
          <button
            onClick={() => exportReport('domains')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon name="Download" size={14} />
            Exportar
          </button>
        </div>
        <div className="space-y-4">
          {domainStats.map((domain, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  index === 0 ? 'bg-blue-600' :
                  index === 1 ? 'bg-green-600' :
                  index === 2 ? 'bg-purple-600' :
                  index === 3 ? 'bg-yellow-600' : 'bg-gray-400'
                }`} />
                <span className="font-medium text-gray-900">{domain.domain}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{domain.sessions} sessões</p>
                  <p className="text-xs text-gray-500">{domain.messages} mensagens</p>
                </div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      index === 2 ? 'bg-purple-600' :
                      index === 3 ? 'bg-yellow-600' : 'bg-gray-400'
                    }`}
                    style={{ width: `${domain.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600 w-12">
                  {domain.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Usuários */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Usuários Mais Ativos</h3>
          <button
            onClick={() => exportReport('users')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Icon name="Download" size={14} />
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-600">Usuário</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Sessões</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Mensagens</th>
                <th className="text-left py-2 text-sm font-medium text-gray-600">Nível</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-900">{user.sessionsCount}</td>
                  <td className="py-3 text-gray-900">{user.messagesCount}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Nível {user.level || 1}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeReport) {
      case 'usage':
        return renderUsageReport();
      case 'engagement':
        return renderEngagementReport();
      case 'performance':
        return (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Icon name="TrendingUp" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatório de Performance</h3>
            <p className="text-gray-600">Em desenvolvimento - dados de performance detalhados</p>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <Icon name="Users" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatório de Usuários</h3>
            <p className="text-gray-600">Em desenvolvimento - análise detalhada de usuários</p>
          </div>
        );
      default:
        return renderUsageReport();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios e Insights</h2>
          <p className="text-gray-600">Análise detalhada do uso e performance do sistema</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="all">Todo o período</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'usage', name: 'Uso Geral', icon: 'BarChart3' },
          { id: 'engagement', name: 'Engajamento', icon: 'TrendingUp' },
          { id: 'performance', name: 'Performance', icon: 'Zap' },
          { id: 'users', name: 'Usuários', icon: 'Users' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as ReportType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeReport === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon name={tab.icon as any} size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default ReportsPanel;