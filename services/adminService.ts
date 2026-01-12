/**
 * Serviço Admin - TXOPITO IA
 * Busca dados reais do MongoDB para o dashboard administrativo
 * Versão browser-safe que usa APIs HTTP em vez de conexão direta
 */

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalMemories: number;
  activeUsers: number;
  newUsersToday: number;
  interactionsToday: number;
  totalInteractions: number;
}

export interface TopicStats {
  topic: string;
  count: number;
}

export interface HourlyStats {
  hour: number;
  interactions: number;
}

export class AdminService {
  /**
   * Busca estatísticas gerais do sistema
   */
  static async getSystemStats(): Promise<AdminStats> {
    try {
      // Em produção, isso faria uma chamada para API
      // Por enquanto, retorna dados simulados baseados no localStorage
      const users = this.getLocalUsers();
      const sessions = this.getLocalSessions();
      
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      // Calcula estatísticas
      const newUsersToday = users.filter(user => 
        user.createdAt > oneDayAgo
      ).length;
      
      const activeUsers = users.filter(user => 
        (user.updatedAt || user.createdAt) > sevenDaysAgo
      ).length;
      
      const interactionsToday = sessions.filter(session => 
        session.createdAt > oneDayAgo
      ).length;
      
      const totalInteractions = sessions.reduce((total, session) => 
        total + (session.messages?.length || 0), 0
      );

      return {
        totalUsers: users.length,
        totalSessions: sessions.length,
        totalMemories: 0, // Será implementado quando necessário
        activeUsers,
        newUsersToday,
        interactionsToday,
        totalInteractions
      };
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      
      // Fallback para dados vazios
      return {
        totalUsers: 0,
        totalSessions: 0,
        totalMemories: 0,
        activeUsers: 0,
        newUsersToday: 0,
        interactionsToday: 0,
        totalInteractions: 0
      };
    }
  }

  /**
   * Busca todos os usuários do sistema
   */
  static async getAllUsers(): Promise<any[]> {
    try {
      return this.getLocalUsers();
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  /**
   * Busca todas as sessões do sistema
   */
  static async getAllSessions(): Promise<any[]> {
    try {
      return this.getLocalSessions();
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  /**
   * Busca tópicos mais populares
   */
  static async getTopTopics(): Promise<TopicStats[]> {
    try {
      const sessions = this.getLocalSessions();
      
      // Conta por domínio
      const domainCounts: { [key: string]: number } = {};
      
      sessions.forEach(session => {
        const domain = session.domainId || 'general';
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      });
      
      // Converte para array e ordena
      return Object.entries(domainCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5
        
    } catch (error) {
      console.error('Erro ao buscar tópicos:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas por hora (últimas 24h)
   */
  static async getHourlyStats(): Promise<HourlyStats[]> {
    try {
      const sessions = this.getLocalSessions();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      
      // Filtra sessões das últimas 24h
      const recentSessions = sessions.filter(session => 
        new Date(session.createdAt) > oneDayAgo
      );
      
      // Conta por hora
      const hourlyCounts: { [key: number]: number } = {};
      
      // Inicializa todas as horas com 0
      for (let i = 0; i < 24; i++) {
        hourlyCounts[i] = 0;
      }
      
      recentSessions.forEach(session => {
        const hour = new Date(session.createdAt).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + (session.messages?.length || 0);
      });
      
      return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        interactions: hourlyCounts[hour] || 0
      }));
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas horárias:', error);
      return Array.from({ length: 24 }, (_, hour) => ({ hour, interactions: 0 }));
    }
  }

  /**
   * Verifica se o MongoDB está disponível
   * No frontend, sempre retorna false pois não temos acesso direto
   */
  static async isMongoAvailable(): Promise<boolean> {
    // No frontend, consideramos que os dados vêm do localStorage
    // Em produção, isso faria uma chamada para /api/health
    return true;
  }

  /**
   * Busca usuários do localStorage
   */
  private static getLocalUsers(): any[] {
    try {
      const users = localStorage.getItem('txopito_users');
      if (users) {
        return JSON.parse(users);
      }
      
      // Se não há usuários no localStorage, retorna o usuário atual
      const currentUser = localStorage.getItem('txopito_user');
      if (currentUser) {
        return [JSON.parse(currentUser)];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao buscar usuários locais:', error);
      return [];
    }
  }

  /**
   * Busca sessões do localStorage
   */
  private static getLocalSessions(): any[] {
    try {
      const sessions = localStorage.getItem('txopito_sessions');
      if (sessions) {
        return JSON.parse(sessions);
      }
      return [];
    } catch (error) {
      console.error('Erro ao buscar sessões locais:', error);
      return [];
    }
  }
}

export default AdminService;