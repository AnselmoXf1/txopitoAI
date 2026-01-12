import React, { useState, useEffect } from 'react';
import { User, ChatSession, Message } from '../../types';
import { AuthService, ChatService, UserService } from '../../services/browserApi';
import Icon from '../Icon';
import DashboardHome from './DashboardHome';
import ConversationsPanel from './ConversationsPanel';
import UsersPanel from './UsersPanel';
import AIConfigPanel from './AIConfigPanel';
import MonitoringPanel from './MonitoringPanel';
import ReportsPanel from './ReportsPanel';
import { ErrorReportsPanel } from './ErrorReportsPanel';
import OnboardingAnalyticsPanel from './OnboardingAnalyticsPanel';
import AdminService, { AdminStats } from '../../services/adminService';

interface AdminDashboardProps {
  currentUser: User;
  onClose: () => void;
}

type AdminTab = 'home' | 'conversations' | 'users' | 'ai-config' | 'monitoring' | 'reports' | 'error-reports' | 'onboarding';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mongoAvailable, setMongoAvailable] = useState(false);

  // Verifica se o usuário é admin (agora sempre true, pois a autenticação é feita via console)
  const isAdmin = true;

  useEffect(() => {
    if (!isAdmin) return;
    
    loadDashboardData();
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Verifica se MongoDB está disponível
      const mongoStatus = await AdminService.isMongoAvailable();
      setMongoAvailable(mongoStatus);
      
      if (mongoStatus) {
        console.log('📊 Carregando dados reais do MongoDB...');
        
        // Carrega dados reais do MongoDB
        const [systemStats, allUsers, allSessions] = await Promise.all([
          AdminService.getSystemStats(),
          AdminService.getAllUsers(),
          AdminService.getAllSessions()
        ]);
        
        setStats(systemStats);
        setUsers(allUsers);
        setSessions(allSessions);
        
        console.log('✅ Dados do MongoDB carregados:', {
          usuarios: allUsers.length,
          sessoes: allSessions.length,
          estatisticas: systemStats
        });
        
      } else {
        console.warn('⚠️ MongoDB não disponível, usando dados de fallback');
        
        // Fallback para dados locais/simulados
        setStats({
          totalUsers: 0,
          totalSessions: 0,
          totalMemories: 0,
          activeUsers: 0,
          newUsersToday: 0,
          interactionsToday: 0,
          totalInteractions: 0
        });
        setUsers([currentUser]);
        setSessions([]);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      
      // Em caso de erro, usa dados mínimos
      setStats({
        totalUsers: 1,
        totalSessions: 0,
        totalMemories: 0,
        activeUsers: 1,
        newUsersToday: 0,
        interactionsToday: 0,
        totalInteractions: 0
      });
      setUsers([currentUser]);
      setSessions([]);
      setMongoAvailable(false);
      
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <Icon name="AlertTriangle" size={24} />
            <h2 className="text-lg font-semibold">Acesso Negado</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar o painel administrativo.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'home', name: 'Dashboard', icon: 'Home' },
    { id: 'conversations', name: 'Conversas', icon: 'MessageSquare' },
    { id: 'users', name: 'Usuários', icon: 'Users' },
    { id: 'ai-config', name: 'Config IA', icon: 'Settings' },
    { id: 'monitoring', name: 'Monitoramento', icon: 'Activity' },
    { id: 'reports', name: 'Relatórios', icon: 'BarChart3' },
    { id: 'error-reports', name: 'Relatórios de Erro', icon: 'Bug' },
    { id: 'onboarding', name: 'Onboarding', icon: 'UserPlus' }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Carregando dados...</span>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return <DashboardHome users={users} sessions={sessions} />;
      case 'conversations':
        return <ConversationsPanel sessions={sessions} users={users} />;
      case 'users':
        return <UsersPanel users={users} onUsersUpdate={setUsers} />;
      case 'ai-config':
        return <AIConfigPanel />;
      case 'monitoring':
        return <MonitoringPanel />;
      case 'reports':
        return <ReportsPanel users={users} sessions={sessions} />;
      case 'error-reports':
        return <ErrorReportsPanel />;
      case 'onboarding':
        return <OnboardingAnalyticsPanel />;
      default:
        return <DashboardHome users={users} sessions={sessions} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-sm text-gray-500">TXOPITO IA - Gestão do Sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon name={tab.icon as any} size={18} />
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>

            {/* Status do Sistema */}
            <div className="mt-8 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Status do Sistema</h3>
                <button
                  onClick={refreshData}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Atualizar dados"
                >
                  <Icon name="RefreshCw" size={12} className="text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">IA Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${mongoAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    MongoDB {mongoAvailable ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Cache (75%)</span>
                </div>
                {stats && (
                  <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>👥 {stats.totalUsers} usuários</div>
                      <div>💬 {stats.totalSessions} sessões</div>
                      <div>🧠 {stats.totalMemories} memórias</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;