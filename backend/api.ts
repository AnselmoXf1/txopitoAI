import { User, ChatSession, UserPreferences } from '../types';
import { db } from './database';
import { mongoService } from './mongoService';
import { logger } from './logger';
import { validateUser, validateChatSession, ValidationError, sanitizers } from './validators';
import { config } from './config';
import { cryptoService } from './cryptoService';

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

// --- AUTH API ---
export const AuthService = {
  async login(email: string, password: string): Promise<User> {
    logger.info('Tentativa de login', 'AuthService', { email });
    
    try {
      // Sanitiza o input
      const sanitizedEmail = sanitizers.sanitizeString(email).toLowerCase();
      
      await delay(600);
      
      // Tenta buscar no MongoDB primeiro
      let user: User | null = null;
      try {
        user = await mongoService.getUserByEmail(sanitizedEmail);
      } catch (error) {
        logger.warn('Erro ao buscar usuário no MongoDB, usando fallback local', 'AuthService', { error });
        // Fallback para armazenamento local
        const users = db.getUsers();
        user = users.find(u => u.email.toLowerCase() === sanitizedEmail) || null;
      }
      
      if (!user) {
        logger.warn('Usuário não encontrado', 'AuthService', { email: sanitizedEmail });
        throw new ValidationError('Email ou senha incorretos.');
      }
      
      // Verifica a senha usando hash
      const storedPasswordHash = user.passwordHash || db.getUserPasswordHash(user.id);
      if (!storedPasswordHash) {
        logger.error('Hash de senha não encontrado', 'AuthService', { userId: user.id });
        throw new ValidationError('Email ou senha incorretos.');
      }
      
      const isPasswordValid = await cryptoService.comparePassword(password, storedPasswordHash);
      if (!isPasswordValid) {
        logger.warn('Senha incorreta', 'AuthService', { email: sanitizedEmail });
        throw new ValidationError('Email ou senha incorretos.');
      }
      
      db.setCurrentUserId(user.id);
      logger.info('Login realizado com sucesso', 'AuthService', { userId: user.id });
      
      return user;
    } catch (error) {
      logger.error('Erro no login', 'AuthService', { email, error: error.message });
      throw error;
    }
  },

  async register(name: string, email: string, password: string): Promise<{ user: User; needsEmailConfirmation: boolean }> {
    logger.info('Tentativa de registro', 'AuthService', { name, email });
    
    try {
      // Sanitiza os inputs
      const sanitizedName = sanitizers.sanitizeString(name);
      const sanitizedEmail = sanitizers.sanitizeString(email);
      
      // Valida os dados
      validateUser({ name: sanitizedName, email: sanitizedEmail });
      
      // Valida força da senha
      const passwordValidation = cryptoService.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Senha fraca: ${passwordValidation.feedback.join(', ')}`);
      }
      
      await delay(800);
      
      // Verifica se email já existe (MongoDB primeiro, depois local)
      let existingUser: User | null = null;
      try {
        existingUser = await mongoService.getUserByEmail(sanitizedEmail.toLowerCase());
      } catch (error) {
        logger.warn('Erro ao verificar usuário no MongoDB, usando fallback local', 'AuthService', { error });
        const users = db.getUsers();
        existingUser = users.find(u => u.email.toLowerCase() === sanitizedEmail.toLowerCase()) || null;
      }
      
      if (existingUser) {
        logger.warn('Tentativa de registro com email existente', 'AuthService', { email: sanitizedEmail });
        throw new ValidationError('Email já cadastrado.');
      }

      // Cria hash da senha
      const passwordHash = await cryptoService.hashPassword(password);

      const newUser: User = {
        id: Date.now().toString(),
        name: sanitizedName,
        email: sanitizedEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedName)}&background=random&color=fff`,
        xp: 0,
        level: 1,
        createdAt: Date.now(),
        passwordHash, // Inclui o hash no objeto do usuário
        preferences: {
          notifications: true,
          highContrast: false,
          theme: 'light'
        }
      };

      // Tenta salvar no MongoDB primeiro
      let savedUser: User;
      try {
        savedUser = await mongoService.saveUser(newUser);
        logger.info('Usuário salvo no MongoDB', 'AuthService', { userId: savedUser.id });
      } catch (error) {
        logger.warn('Erro ao salvar no MongoDB, usando fallback local', 'AuthService', { error });
        // Fallback para armazenamento local
        const users = db.getUsers();
        users.push(newUser);
        db.saveUsers(users);
        db.saveUserPasswordHash(newUser.id, passwordHash);
        savedUser = newUser;
      }
      
      logger.info('Usuário registrado com sucesso', 'AuthService', { userId: savedUser.id });
      
      // Login automático após registro
      db.setCurrentUserId(newUser.id);
      
      return { user: newUser, needsEmailConfirmation: false };
    } catch (error) {
      logger.error('Erro no registro', 'AuthService', { name, email, error: error.message });
      throw error;
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    logger.info('Tentativa de alteração de senha', 'AuthService', { userId });
    
    try {
      // Valida nova senha
      const passwordValidation = cryptoService.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new ValidationError(`Senha fraca: ${passwordValidation.feedback.join(', ')}`);
      }
      
      // Verifica senha atual
      const storedPasswordHash = db.getUserPasswordHash(userId);
      if (!storedPasswordHash) {
        throw new ValidationError('Usuário não encontrado.');
      }
      
      const isCurrentPasswordValid = await cryptoService.comparePassword(currentPassword, storedPasswordHash);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Senha atual incorreta.');
      }
      
      // Gera hash da nova senha
      const newPasswordHash = await cryptoService.hashPassword(newPassword);
      
      // Salva nova senha
      db.saveUserPasswordHash(userId, newPasswordHash);
      
      logger.info('Senha alterada com sucesso', 'AuthService', { userId });
    } catch (error) {
      logger.error('Erro ao alterar senha', 'AuthService', { userId, error: error.message });
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const userId = db.getCurrentUserId();
      if (!userId) return null;

      const users = db.getUsers();
      const user = users.find(u => u.id === userId) || null;
      
      if (user) {
        logger.debug('Usuário atual recuperado', 'AuthService', { userId });
      }
      
      return user;
    } catch (error) {
      logger.error('Erro ao recuperar usuário atual', 'AuthService', { error: error.message });
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      const userId = db.getCurrentUserId();
      db.removeCurrentUserId();
      logger.info('Logout realizado', 'AuthService', { userId });
    } catch (error) {
      logger.error('Erro no logout', 'AuthService', { error: error.message });
      throw error;
    }
  }
};

// --- USER API ---
export const UserService = {
  async addXP(userId: string, amount: number): Promise<{ user: User, leveledUp: boolean }> {
    logger.debug('Adicionando XP ao usuário', 'UserService', { userId, amount });
    
    try {
      const users = db.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        logger.error('Usuário não encontrado para adicionar XP', 'UserService', { userId });
        throw new ValidationError('User not found');
      }

      const user = users[userIndex];
      const oldLevel = user.level;
      
      // XP Logic: Usa configuração centralizada
      const xpForNextLevel = user.level * config.gamification.baseXpForLevel;
      
      user.xp += amount;
      
      let leveledUp = false;
      let levelsGained = 0;
      
      // Permite múltiplos level ups de uma vez
      while (user.xp >= (user.level * config.gamification.baseXpForLevel)) {
        const currentLevelXP = user.level * config.gamification.baseXpForLevel;
        user.xp -= currentLevelXP;
        user.level += 1;
        levelsGained += 1;
        leveledUp = true;
      }

      users[userIndex] = user;
      db.saveUsers(users);
      
      if (leveledUp) {
        logger.info('Usuário subiu de nível!', 'UserService', { 
          userId, 
          oldLevel, 
          newLevel: user.level, 
          levelsGained,
          xpGained: amount 
        });
      } else {
        logger.debug('XP adicionado com sucesso', 'UserService', { userId, amount, currentXP: user.xp });
      }
      
      return { user, leveledUp };
    } catch (error) {
      logger.error('Erro ao adicionar XP', 'UserService', { userId, amount, error: error.message });
      throw error;
    }
  },

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<User> {
    logger.debug('Atualizando preferências do usuário', 'UserService', { userId, prefs });
    
    try {
      const users = db.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        logger.error('Usuário não encontrado para atualizar preferências', 'UserService', { userId });
        throw new ValidationError('User not found');
      }
      
      // Sanitiza as preferências
      const sanitizedPrefs: Partial<UserPreferences> = {
        ...prefs,
        theme: (prefs.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark' // Garante valores válidos
      };
      
      users[userIndex].preferences = { ...users[userIndex].preferences, ...sanitizedPrefs };
      db.saveUsers(users);
      
      logger.info('Preferências atualizadas com sucesso', 'UserService', { userId });
      return users[userIndex];
    } catch (error) {
      logger.error('Erro ao atualizar preferências', 'UserService', { userId, error: error.message });
      throw error;
    }
  },

  // Novo método para obter estatísticas do usuário
  async getUserStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    xpToNextLevel: number;
    rank: string;
    joinedDaysAgo: number;
  }> {
    logger.debug('Obtendo estatísticas do usuário', 'UserService', { userId });
    
    try {
      const users = db.getUsers();
      const user = users.find(u => u.id === userId);
      
      if (!user) {
        throw new ValidationError('User not found');
      }
      
      const sessions = db.getSessions().filter(s => s.userId === userId);
      const totalMessages = sessions.reduce((acc, session) => acc + session.messages.length, 0);
      const xpToNextLevel = (user.level * config.gamification.baseXpForLevel) - user.xp;
      const joinedDaysAgo = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
      
      return {
        totalSessions: sessions.length,
        totalMessages,
        xpToNextLevel,
        rank: getRank(user.level),
        joinedDaysAgo
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas', 'UserService', { userId, error: error.message });
      throw error;
    }
  }
};

// --- CHAT API ---
export const ChatService = {
  async getSessions(userId: string): Promise<ChatSession[]> {
    logger.debug('Recuperando sessões do usuário', 'ChatService', { userId });
    
    try {
      const allSessions = db.getSessions();
      const userSessions = allSessions
        .filter(s => s.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      logger.debug('Sessões recuperadas', 'ChatService', { userId, count: userSessions.length });
      return userSessions;
    } catch (error) {
      logger.error('Erro ao recuperar sessões', 'ChatService', { userId, error: error.message });
      throw error;
    }
  },

  async saveSession(session: ChatSession): Promise<void> {
    logger.debug('Salvando sessão', 'ChatService', { sessionId: session.id });
    
    try {
      // Valida a sessão antes de salvar
      validateChatSession(session);
      
      // Sanitiza o título
      session.title = sanitizers.sanitizeUserInput(session.title);
      
      const allSessions = db.getSessions();
      const index = allSessions.findIndex(s => s.id === session.id);
      
      if (index >= 0) {
        allSessions[index] = session;
        logger.debug('Sessão atualizada', 'ChatService', { sessionId: session.id });
      } else {
        allSessions.push(session);
        logger.info('Nova sessão criada', 'ChatService', { sessionId: session.id, domainId: session.domainId });
      }
      
      db.saveSessions(allSessions);
    } catch (error) {
      logger.error('Erro ao salvar sessão', 'ChatService', { sessionId: session.id, error: error.message });
      throw error;
    }
  },

  async deleteSession(sessionId: string): Promise<void> {
    logger.info('Deletando sessão', 'ChatService', { sessionId });
    
    try {
      const allSessions = db.getSessions();
      const sessionExists = allSessions.some(s => s.id === sessionId);
      
      if (!sessionExists) {
        logger.warn('Tentativa de deletar sessão inexistente', 'ChatService', { sessionId });
        throw new ValidationError('Session not found');
      }
      
      const filtered = allSessions.filter(s => s.id !== sessionId);
      db.saveSessions(filtered);
      
      logger.info('Sessão deletada com sucesso', 'ChatService', { sessionId });
    } catch (error) {
      logger.error('Erro ao deletar sessão', 'ChatService', { sessionId, error: error.message });
      throw error;
    }
  },

  async clearHistory(sessionId: string): Promise<ChatSession | null> {
    logger.info('Limpando histórico da sessão', 'ChatService', { sessionId });
    
    try {
      const allSessions = db.getSessions();
      const index = allSessions.findIndex(s => s.id === sessionId);
      
      if (index >= 0) {
        const messageCount = allSessions[index].messages.length;
        allSessions[index].messages = [];
        db.saveSessions(allSessions);
        
        logger.info('Histórico limpo com sucesso', 'ChatService', { sessionId, messagesRemoved: messageCount });
        return allSessions[index];
      }
      
      logger.warn('Tentativa de limpar histórico de sessão inexistente', 'ChatService', { sessionId });
      return null;
    } catch (error) {
      logger.error('Erro ao limpar histórico', 'ChatService', { sessionId, error: error.message });
      throw error;
    }
  },

  // Novo método para obter estatísticas de chat
  async getChatStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    messagesByDomain: Record<string, number>;
    averageMessagesPerSession: number;
  }> {
    logger.debug('Obtendo estatísticas de chat', 'ChatService', { userId });
    
    try {
      const sessions = await this.getSessions(userId);
      const totalMessages = sessions.reduce((acc, session) => acc + session.messages.length, 0);
      
      const messagesByDomain: Record<string, number> = {};
      sessions.forEach(session => {
        const domain = session.domainId;
        messagesByDomain[domain] = (messagesByDomain[domain] || 0) + session.messages.length;
      });
      
      return {
        totalSessions: sessions.length,
        totalMessages,
        messagesByDomain,
        averageMessagesPerSession: sessions.length > 0 ? Math.round(totalMessages / sessions.length) : 0
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de chat', 'ChatService', { userId, error: error.message });
      throw error;
    }
  }
};