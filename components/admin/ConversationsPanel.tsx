import React, { useState } from 'react';
import { ChatSession, User, Message, Role } from '../../types';
import Icon from '../Icon';

interface ConversationsPanelProps {
  sessions: ChatSession[];
  users: User[];
}

type FilterType = 'all' | 'complete' | 'incomplete' | 'error';
type SortType = 'date' | 'user' | 'messages';

const ConversationsPanel: React.FC<ConversationsPanelProps> = ({ sessions, users }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  // Função para obter nome do usuário
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Usuário Desconhecido';
  };

  // Função para determinar status da conversa
  const getSessionStatus = (session: ChatSession): 'complete' | 'incomplete' | 'error' => {
    if (session.messages.length === 0) return 'incomplete';
    
    const lastMessage = session.messages[session.messages.length - 1];
    if (lastMessage.role === Role.USER) return 'incomplete';
    
    // Simula detecção de erro baseado no conteúdo
    if (lastMessage.text.includes('erro') || lastMessage.text.includes('falha')) {
      return 'error';
    }
    
    return 'complete';
  };

  // Filtrar e ordenar sessões
  const filteredSessions = sessions
    .filter(session => {
      // Filtro por status
      if (filter !== 'all') {
        const status = getSessionStatus(session);
        if (status !== filter) return false;
      }
      
      // Filtro por busca
      if (searchTerm) {
        const userName = getUserName(session.userId).toLowerCase();
        const sessionTitle = session.title.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return userName.includes(searchLower) || sessionTitle.includes(searchLower);
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.createdAt - a.createdAt;
        case 'user':
          return getUserName(a.userId).localeCompare(getUserName(b.userId));
        case 'messages':
          return b.messages.length - a.messages.length;
        default:
          return 0;
      }
    });

  const exportConversations = () => {
    const data = filteredSessions.map(session => ({
      id: session.id,
      usuario: getUserName(session.userId),
      titulo: session.title,
      dominio: session.domainId,
      mensagens: session.messages.length,
      status: getSessionStatus(session),
      criado: new Date(session.createdAt).toLocaleString('pt-BR')
    }));
    
    const csv = [
      'ID,Usuário,Título,Domínio,Mensagens,Status,Criado',
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversas_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const StatusBadge: React.FC<{ status: 'complete' | 'incomplete' | 'error' }> = ({ status }) => {
    const config = {
      complete: { color: 'bg-green-100 text-green-800', text: 'Completa' },
      incomplete: { color: 'bg-yellow-100 text-yellow-800', text: 'Incompleta' },
      error: { color: 'bg-red-100 text-red-800', text: 'Erro' }
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status].color}`}>
        {config[status].text}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Conversas</h2>
          <p className="text-gray-600">Gerencie e analise as interações dos usuários</p>
        </div>
        <button
          onClick={exportConversations}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon name="Download" size={16} />
          Exportar
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Busca */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por usuário ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filtro por Status */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="complete">Completas</option>
            <option value="incomplete">Incompletas</option>
            <option value="error">Com Erro</option>
          </select>

          {/* Ordenação */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Data</option>
            <option value="user">Usuário</option>
            <option value="messages">Nº Mensagens</option>
          </select>
        </div>
      </div>

      {/* Lista de Conversas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domínio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mensagens
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon name="User" size={16} className="text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserName(session.userId)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {session.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {session.domainId}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.messages.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={getSessionStatus(session)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedSession(session)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Ver
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <Icon name="MessageSquare" size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Conversa */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Conversa: {selectedSession.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {getUserName(selectedSession.userId)} • {new Date(selectedSession.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {selectedSession.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === Role.USER ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.role === Role.USER
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === Role.USER ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationsPanel;