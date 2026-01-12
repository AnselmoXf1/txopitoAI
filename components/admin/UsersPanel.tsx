import React, { useState } from 'react';
import { User } from '../../types';
import Icon from '../Icon';

interface UsersPanelProps {
  users: User[];
  onUsersUpdate: (users: User[]) => void;
}

type UserFilter = 'all' | 'active' | 'inactive';
type UserSort = 'name' | 'email' | 'level' | 'created';

const UsersPanel: React.FC<UsersPanelProps> = ({ users, onUsersUpdate }) => {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [sortBy, setSortBy] = useState<UserSort>('created');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Simula status ativo/inativo baseado na última atividade
  const isUserActive = (user: User): boolean => {
    // Em um sistema real, isso viria de dados de última atividade
    return Math.random() > 0.3; // 70% dos usuários são "ativos"
  };

  // Filtrar e ordenar usuários
  const filteredUsers = users
    .filter(user => {
      // Filtro por status
      if (filter === 'active' && !isUserActive(user)) return false;
      if (filter === 'inactive' && isUserActive(user)) return false;
      
      // Filtro por busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'level':
          return (b.level || 0) - (a.level || 0);
        case 'created':
          return b.createdAt - a.createdAt;
        default:
          return 0;
      }
    });

  const handleSuspendUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Tem certeza que deseja suspender o usuário "${user.name}"?\n\nO usuário será impedido de acessar a plataforma.`)) {
      try {
        console.log('🚫 Suspendendo usuário:', userId);
        
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, suspended: true, suspendedAt: Date.now() }
            : user
        );
        onUsersUpdate(updatedUsers);
        
        // Atualiza no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        // Se for o usuário atual, remove da sessão
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const parsed = JSON.parse(currentUser);
          if (parsed.id === userId) {
            localStorage.removeItem('txopito_current_user');
            console.log('⚠️ Usuário atual suspenso - sessão encerrada');
          }
        }
        
        console.log('✅ Usuário suspenso com sucesso');
        alert('Usuário suspenso com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao suspender usuário:', error);
        alert('Erro ao suspender usuário. Tente novamente.');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Tem certeza que deseja APAGAR permanentemente o usuário "${user.name}"?\n\nEsta ação não pode ser desfeita e removerá:\n- Conta do usuário\n- Todas as conversas\n- Dados de progresso\n- Configurações`)) {
      try {
        console.log('🗑️ Apagando usuário:', userId);
        
        // Remove do array de usuários
        const updatedUsers = users.filter(u => u.id !== userId);
        onUsersUpdate(updatedUsers);
        
        // Remove também do localStorage se for o usuário atual
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const parsed = JSON.parse(currentUser);
          if (parsed.id === userId) {
            localStorage.removeItem('txopito_current_user');
            console.log('⚠️ Usuário atual removido - será necessário fazer login novamente');
          }
        }
        
        // Atualiza lista de usuários no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        // Remove sessões do usuário
        const allSessions = JSON.parse(localStorage.getItem('txopito_sessions') || '[]');
        const filteredSessions = allSessions.filter((session: any) => session.userId !== userId);
        localStorage.setItem('txopito_sessions', JSON.stringify(filteredSessions));
        
        // Remove memórias do usuário
        const memoryKeys = Object.keys(localStorage).filter(key => key.startsWith(`txopito_memory_${userId}`));
        memoryKeys.forEach(key => localStorage.removeItem(key));
        
        console.log('✅ Usuário apagado com sucesso:', {
          usuarioId: userId,
          sessõesRemovidas: allSessions.length - filteredSessions.length,
          memóriasRemovidas: memoryKeys.length
        });
        
        alert('Usuário apagado permanentemente com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao apagar usuário:', error);
        alert('Erro ao apagar usuário. Tente novamente.');
      }
    }
  };

  const handleEditUser = async (user: User) => {
    const newName = prompt('Novo nome:', user.name);
    if (newName && newName !== user.name) {
      try {
        console.log('✏️ Editando usuário:', { id: user.id, novoNome: newName });
        
        const updatedUsers = users.map(u => 
          u.id === user.id 
            ? { ...u, name: newName }
            : u
        );
        onUsersUpdate(updatedUsers);
        
        // Atualiza também no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        // Se for o usuário atual, atualiza também
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const parsed = JSON.parse(currentUser);
          if (parsed.id === user.id) {
            parsed.name = newName;
            localStorage.setItem('txopito_current_user', JSON.stringify(parsed));
            console.log('👤 Nome do usuário atual atualizado');
          }
        }
        
        console.log('✅ Nome do usuário atualizado com sucesso');
        alert('Nome do usuário atualizado com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao editar usuário:', error);
        alert('Erro ao editar usuário. Tente novamente.');
      }
    }
  };

  const handlePromoteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Promover "${user.name}" para o próximo nível?\n\nNível atual: ${user.level || 1}\nNovo nível: ${(user.level || 1) + 1}\n+100 XP de bônus`)) {
      try {
        console.log('⬆️ Promovendo usuário:', { id: userId, nivelAtual: user.level || 1 });
        
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                level: (user.level || 1) + 1,
                xp: (user.xp || 0) + 100 
              }
            : user
        );
        onUsersUpdate(updatedUsers);
        
        // Atualiza no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        // Se for o usuário atual, atualiza também
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const parsed = JSON.parse(currentUser);
          if (parsed.id === userId) {
            parsed.level = (parsed.level || 1) + 1;
            parsed.xp = (parsed.xp || 0) + 100;
            localStorage.setItem('txopito_current_user', JSON.stringify(parsed));
            console.log('👤 Nível do usuário atual atualizado');
          }
        }
        
        console.log('✅ Usuário promovido com sucesso');
        alert(`Usuário promovido para nível ${(user.level || 1) + 1}!`);
        
      } catch (error) {
        console.error('❌ Erro ao promover usuário:', error);
        alert('Erro ao promover usuário. Tente novamente.');
      }
    }
  };

  const handleResetProgress = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Tem certeza que deseja resetar todo o progresso de "${user.name}"?\n\nIsso irá:\n- Resetar XP para 0\n- Resetar nível para 1\n- Manter conta e dados pessoais\n\nProgresso atual: Nível ${user.level || 1}, ${user.xp || 0} XP`)) {
      try {
        console.log('🔄 Resetando progresso do usuário:', { id: userId, nivelAtual: user.level, xpAtual: user.xp });
        
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, level: 1, xp: 0 }
            : user
        );
        onUsersUpdate(updatedUsers);
        
        // Atualiza no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        // Se for o usuário atual, atualiza também
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const parsed = JSON.parse(currentUser);
          if (parsed.id === userId) {
            parsed.level = 1;
            parsed.xp = 0;
            localStorage.setItem('txopito_current_user', JSON.stringify(parsed));
            console.log('👤 Progresso do usuário atual resetado');
          }
        }
        
        console.log('✅ Progresso resetado com sucesso');
        alert('Progresso do usuário resetado com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao resetar progresso:', error);
        alert('Erro ao resetar progresso. Tente novamente.');
      }
    }
  };

  const handleBulkDelete = async () => {
    const inactiveUsers = users.filter(u => !isUserActive(u));
    if (inactiveUsers.length === 0) {
      alert('Não há usuários inativos para remover.');
      return;
    }
    
    if (confirm(`Tem certeza que deseja apagar ${inactiveUsers.length} usuários inativos?\n\nEsta ação não pode ser desfeita!\n\nUsuários que serão removidos:\n${inactiveUsers.map(u => `- ${u.name} (${u.email})`).join('\n')}`)) {
      try {
        console.log('🗑️ Removendo usuários inativos em lote:', inactiveUsers.length);
        
        const activeUsers = users.filter(u => isUserActive(u));
        const removedUserIds = inactiveUsers.map(u => u.id);
        
        onUsersUpdate(activeUsers);
        localStorage.setItem('txopito_users', JSON.stringify(activeUsers));
        
        // Remove sessões dos usuários removidos
        const allSessions = JSON.parse(localStorage.getItem('txopito_sessions') || '[]');
        const filteredSessions = allSessions.filter((session: any) => !removedUserIds.includes(session.userId));
        localStorage.setItem('txopito_sessions', JSON.stringify(filteredSessions));
        
        // Remove memórias dos usuários removidos
        removedUserIds.forEach(userId => {
          const memoryKeys = Object.keys(localStorage).filter(key => key.startsWith(`txopito_memory_${userId}`));
          memoryKeys.forEach(key => localStorage.removeItem(key));
        });
        
        console.log('✅ Usuários inativos removidos:', {
          usuáriosRemovidos: inactiveUsers.length,
          usuáriosAtivos: activeUsers.length,
          sessõesRemovidas: allSessions.length - filteredSessions.length
        });
        
        alert(`${inactiveUsers.length} usuários inativos foram removidos com sucesso!`);
        
      } catch (error) {
        console.error('❌ Erro na remoção em lote:', error);
        alert('Erro ao remover usuários. Tente novamente.');
      }
    }
  };

  const handleCreateTestUser = () => {
    const names = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Ferreira', 'Lucia Almeida'];
    const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomEmail = randomName.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[áàâã]/g, 'a')
      .replace(/[éêë]/g, 'e')
      .replace(/[íîï]/g, 'i')
      .replace(/[óôõ]/g, 'o')
      .replace(/[úûü]/g, 'u')
      .replace(/ç/g, 'c') + 
      Math.floor(Math.random() * 1000) + 
      '@' + domains[Math.floor(Math.random() * domains.length)];
    
    const newUser: User = {
      id: `user_test_${Date.now()}`,
      name: randomName,
      email: randomEmail,
      xp: Math.floor(Math.random() * 500),
      level: Math.floor(Math.random() * 5) + 1,
      preferences: {
        language: 'pt-BR',
        theme: 'light',
        notifications: true,
        highContrast: false
      },
      createdAt: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
      hasCompletedOnboarding: Math.random() > 0.3
    };
    
    const updatedUsers = [...users, newUser];
    onUsersUpdate(updatedUsers);
    localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
    
    console.log('👤 Usuário de teste criado:', {
      nome: newUser.name,
      email: newUser.email,
      nivel: newUser.level,
      xp: newUser.xp
    });
    
    alert(`Usuário de teste "${randomName}" criado com sucesso!`);
  };

  const handleUnsuspendUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Reativar o usuário "${user.name}"?\n\nO usuário poderá acessar a plataforma novamente.`)) {
      try {
        console.log('✅ Reativando usuário:', userId);
        
        const updatedUsers = users.map(user => 
          user.id === userId 
            ? { ...user, suspended: false, suspendedAt: undefined }
            : user
        );
        onUsersUpdate(updatedUsers);
        
        // Atualiza no localStorage
        localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
        
        console.log('✅ Usuário reativado com sucesso');
        alert('Usuário reativado com sucesso!');
        
      } catch (error) {
        console.error('❌ Erro ao reativar usuário:', error);
        alert('Erro ao reativar usuário. Tente novamente.');
      }
    }
  };

  const handleResetPassword = (userId: string) => {
    // Em um sistema real, isso enviaria email de reset
    console.log('Reset de senha para usuário:', userId);
    alert('Email de reset de senha enviado!');
  };

  const exportUsers = () => {
    const data = filteredUsers.map(user => ({
      nome: user.name,
      email: user.email,
      nivel: user.level || 0,
      xp: user.xp || 0,
      status: isUserActive(user) ? 'Ativo' : 'Inativo',
      criado: new Date(user.createdAt).toLocaleString('pt-BR')
    }));
    
    const csv = [
      'Nome,Email,Nível,XP,Status,Criado',
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const UserModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Detalhes do Usuário
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Informações Básicas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Nome</label>
                <p className="font-medium text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Email</label>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Nível</label>
                <p className="font-medium text-gray-900">{user.level || 1}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">XP</label>
                <p className="font-medium text-gray-900">{user.xp || 0}</p>
              </div>
            </div>
          </div>

          {/* Preferências */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Preferências</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Tema</label>
                <p className="font-medium text-gray-900">{user.preferences?.theme || 'light'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600">Notificações</label>
                <p className="font-medium text-gray-900">
                  {user.preferences?.notifications ? 'Ativadas' : 'Desativadas'}
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Estatísticas</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-sm text-blue-600">Sessões</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">48</p>
                <p className="text-sm text-green-600">Mensagens</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">7</p>
                <p className="text-sm text-purple-600">Dias Ativo</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleResetPassword(user.id)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Icon name="Key" size={16} />
              Reset Senha
            </button>
            <button
              onClick={() => handleEditUser(user)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Icon name="Edit" size={16} />
              Editar
            </button>
            <button
              onClick={() => handlePromoteUser(user.id)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Icon name="TrendingUp" size={16} />
              Promover
            </button>
            {(user as any).suspended ? (
              <button
                onClick={() => handleUnsuspendUser(user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Icon name="UserCheck" size={16} />
                Reativar
              </button>
            ) : (
              <button
                onClick={() => handleSuspendUser(user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Icon name="UserX" size={16} />
                Suspender
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usuários</h2>
          <p className="text-gray-600">Gerencie usuários e suas permissões</p>
        </div>
        <button
          onClick={exportUsers}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Icon name="Download" size={16} />
          Exportar
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="Users" size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon name="UserCheck" size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(isUserActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Icon name="UserMinus" size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => !isUserActive(u)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Icon name="UserPlus" size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Novos (7d)</p>
              <p className="text-xl font-bold text-gray-900">
                {users.filter(u => Date.now() - u.createdAt < 7 * 24 * 60 * 60 * 1000).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações em Lote */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações em Lote</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Icon name="Trash2" size={16} />
            Remover Inativos ({users.filter(u => !isUserActive(u)).length})
          </button>
          
          <button
            onClick={handleCreateTestUser}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Icon name="UserPlus" size={16} />
            Criar Usuário Teste
          </button>
          
          <button
            onClick={() => {
              const count = Math.floor(Math.random() * 5) + 3; // 3-7 usuários
              for (let i = 0; i < count; i++) {
                setTimeout(() => handleCreateTestUser(), i * 100);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Icon name="Users" size={16} />
            Criar Múltiplos Testes
          </button>
          
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja resetar o progresso de TODOS os usuários?\n\nEsta ação não pode ser desfeita!')) {
                const updatedUsers = users.map(user => ({ ...user, level: 1, xp: 0 }));
                onUsersUpdate(updatedUsers);
                localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
                alert('Progresso de todos os usuários resetado!');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Icon name="RotateCcw" size={16} />
            Reset Global
          </button>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as UserFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as UserSort)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created">Data de Criação</option>
            <option value="name">Nome</option>
            <option value="email">Email</option>
            <option value="level">Nível</option>
          </select>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nível/XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Icon name="User" size={18} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (user as any).suspended
                          ? 'bg-red-100 text-red-800'
                          : isUserActive(user)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {(user as any).suspended ? 'Suspenso' : isUserActive(user) ? 'Ativo' : 'Inativo'}
                      </span>
                      {user.hasCompletedOnboarding && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          Onboarding ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Nível {user.level || 1} • {user.xp || 0} XP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      title="Ver detalhes"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-green-600 hover:text-green-900"
                      title="Editar usuário"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handlePromoteUser(user.id)}
                      className="text-purple-600 hover:text-purple-900"
                      title="Promover nível"
                    >
                      Promover
                    </button>
                    <button
                      onClick={() => handleResetProgress(user.id)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Resetar progresso"
                    >
                      Reset
                    </button>
                    {(user as any).suspended ? (
                      <button
                        onClick={() => handleUnsuspendUser(user.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Reativar usuário"
                      >
                        Reativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Suspender usuário"
                      >
                        Suspender
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-800 hover:text-red-900 font-bold"
                      title="APAGAR usuário permanentemente"
                    >
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Icon name="Users" size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Usuário */}
      {showUserModal && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

export default UsersPanel;