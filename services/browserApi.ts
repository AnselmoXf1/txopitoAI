/**
 * API Browser-Safe - TXOPITO IA
 * Versão das APIs que pode ser usada no frontend sem dependências do MongoDB
 */

import { User, ChatSession, UserPreferences, DomainId } from '../types';
import { logger } from '../backend/logger';
import { config } from '../backend/config';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- GAMIFICATION LOGIC ---
export const getRank = (level: number): string => {
  if (level < 5) return 'Estagiário';
  if (level < 10) return 'Júnior';
  if (level < 20) return 'Pleno';
  if (level < 50) return 'Sênior';
  return 'Especialista';
};

// --- LOCAL STORAGE HELPERS ---
const STORAGE_KEYS = {
  users: 'txopito_users',
  sessions: 'txopito_sessions',
  currentUser: 'txopito_current_user'
};

const getStoredUsers = (): User[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.users);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  } catch (error) {
    logger.error('Erro ao salvar usuários', 'BrowserApi', { error });
  }
};

const getStoredSessions = (): ChatSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.sessions);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveSessions = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
  } catch (error) {
    logger.error('Erro ao salvar sessões', 'BrowserApi', { error });
  }
};

// --- AUTH API ---
export const AuthService = {
  async login(email: string, password: string): Promise<User> {
    logger.info('Tentativa de login (browser)', 'AuthService', { email });
    
    await delay(300);
    
    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('Email ou senha incorretos.');
    }
    
    // Simulação de verificação de senha (em produção, seria hash)
    if (password.length < 3) {
      throw new Error('Email ou senha incorretos.');
    }
    
    // Atualiza último login
    // user.lastLogin = Date.now(); // Removido pois não existe no tipo User
    saveUsers(users);
    
    // Salva usuário atual
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    
    logger.info('Login bem-sucedido (browser)', 'AuthService', { userId: user.id });
    return user;
  },

  async register(name: string, email: string, password: string): Promise<User> {
    logger.info('Tentativa de registro (browser)', 'AuthService', { email, name });
    
    await delay(500);
    
    const users = getStoredUsers();
    
    // Verifica se usuário já existe
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Este email já está cadastrado.');
    }
    
    // Cria novo usuário
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      name,
      xp: 0,
      level: 1,
      preferences: {
        language: 'pt-BR',
        theme: 'light',
        notifications: true,
        highContrast: false
      },
      createdAt: Date.now()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    // Salva usuário atual
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(newUser));
    
    logger.info('Registro bem-sucedido (browser)', 'AuthService', { userId: newUser.id });
    return newUser;
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.currentUser);
      if (!data) return null;
      
      const user = JSON.parse(data);
      
      // Verifica se o usuário tem as propriedades essenciais
      if (!user.id || !user.name || !user.email) {
        console.warn('Usuário corrompido encontrado, removendo...');
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        return null;
      }
      
      // Garante que o usuário tem todas as propriedades necessárias
      const completeUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        level: user.level || 1,
        preferences: {
          notifications: user.preferences?.notifications ?? true,
          highContrast: user.preferences?.highContrast ?? false,
          theme: user.preferences?.theme || 'light'
        },
        createdAt: user.createdAt || Date.now()
      };
      
      return completeUser;
    } catch (error) {
      console.error('Erro ao recuperar usuário atual:', error);
      // Remove dados corrompidos
      localStorage.removeItem(STORAGE_KEYS.currentUser);
      return null;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    logger.info('Logout realizado (browser)', 'AuthService');
  }
};

// --- USER API ---
export const UserService = {
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    logger.info('Atualizando usuário (browser)', 'UserService', { userId });
    
    await delay(200);
    
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }
    
    // Atualiza usuário
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    // Atualiza usuário atual se for o mesmo
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser?.id === userId) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(users[userIndex]));
    }
    
    return users[userIndex];
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    await this.updateUser(userId, { preferences });
  },

  async addXP(userId: string, xp: number): Promise<{ user: User; leveledUp: boolean }> {
    const users = getStoredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      throw new Error('Usuário não encontrado.');
    }
    
    const user = users[userIndex];
    const oldLevel = user.level || 1;
    const newXP = (user.xp || 0) + xp;
    const newLevel = Math.floor(newXP / config.gamification.baseXpForLevel) + 1;
    
    user.xp = newXP;
    user.level = newLevel;
    
    const leveledUp = newLevel > oldLevel;
    
    users[userIndex] = user;
    saveUsers(users);
    
    // Atualiza usuário atual se for o mesmo
    const currentUser = await AuthService.getCurrentUser();
    if (currentUser?.id === userId) {
      localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    }
    
    logger.info('XP adicionado (browser)', 'UserService', { userId, xp, newXP, newLevel, leveledUp });
    return { user, leveledUp };
  }
};

// --- CHAT API ---
export const ChatService = {
  async createSession(userId: string, domainId: string): Promise<ChatSession> {
    logger.info('Criando sessão (browser)', 'ChatService', { userId, domainId });
    
    await delay(100);
    
    const session: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      domainId: domainId as DomainId,
      title: 'Nova Conversa',
      messages: [],
      createdAt: Date.now()
    };
    
    const sessions = getStoredSessions();
    sessions.push(session);
    saveSessions(sessions);
    
    return session;
  },

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    const sessions = getStoredSessions();
    return sessions.filter(s => s.userId === userId);
  },

  async getSessions(userId: string): Promise<ChatSession[]> {
    return this.getUserSessions(userId);
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const sessions = getStoredSessions();
    return sessions.find(s => s.id === sessionId) || null;
  },

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession> {
    const sessions = getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      throw new Error('Sessão não encontrada.');
    }
    
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates
    };
    
    saveSessions(sessions);
    return sessions[sessionIndex];
  },

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = getStoredSessions();
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(filteredSessions);
    
    logger.info('Sessão deletada (browser)', 'ChatService', { sessionId });
  },

  async saveSession(session: ChatSession): Promise<ChatSession> {
    const sessions = getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === session.id);
    
    if (sessionIndex >= 0) {
      sessions[sessionIndex] = session;
    } else {
      sessions.push(session);
    }
    
    saveSessions(sessions);
    logger.info('Sessão salva (browser)', 'ChatService', { sessionId: session.id });
    return session;
  }
};

// --- UTILITY FUNCTIONS ---
export const getSystemStatus = () => {
  return {
    status: 'online',
    version: config.app.version,
    environment: config.app.environment,
    storage: 'localStorage',
    features: {
      auth: true,
      chat: true,
      gamification: true,
      memory: true
    }
  };
};