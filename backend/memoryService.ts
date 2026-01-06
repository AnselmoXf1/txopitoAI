/**
 * Sistema de Memória Contextual - TXOPITO IA
 * Implementa memória por usuário seguindo a especificação conceitual
 */

import { logger } from './logger';
import { cache, withCache } from './cache';

// Tipos de memória
export interface ShortTermMemory {
  sessionId: string;
  messages: string[];
  topics: string[];
  context: string;
  timestamp: number;
}

export interface MediumTermMemory {
  userId: string;
  frequentTopics: Record<string, number>; // tópico -> frequência
  ongoingProjects: ProjectMemory[];
  learningProgress: Record<string, LearningProgress>; // domínio -> progresso
  lastUpdated: number;
}

export interface LongTermMemory {
  userId: string;
  profile: UserProfile;
  preferences: UserPreferences;
  interests: string[];
  knowledgeLevel: Record<string, KnowledgeLevel>; // domínio -> nível
  goals: string[];
  createdAt: number;
  lastUpdated: number;
}

export interface ProjectMemory {
  id: string;
  title: string;
  domain: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  lastActivity: number;
  keyPoints: string[];
}

export interface LearningProgress {
  domain: string;
  conceptsLearned: string[];
  currentFocus: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastSession: number;
}

export interface UserProfile {
  name: string;
  primaryInterests: string[];
  communicationStyle: 'formal' | 'casual' | 'technical';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  responseLength: 'brief' | 'detailed' | 'comprehensive';
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: boolean;
  memoryEnabled: boolean;
  dataRetention: number; // dias
}

export enum KnowledgeLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

class MemoryService {
  private readonly STORAGE_KEYS = {
    shortTerm: (sessionId: string) => `memory_short_${sessionId}`,
    mediumTerm: (userId: string) => `memory_medium_${userId}`,
    longTerm: (userId: string) => `memory_long_${userId}`
  };

  // === MEMÓRIA DE CURTO PRAZO (SESSÃO) ===
  
  async getShortTermMemory(sessionId: string): Promise<ShortTermMemory | null> {
    logger.debug('Recuperando memória de curto prazo', 'MemoryService', { sessionId });
    
    try {
      const key = this.STORAGE_KEYS.shortTerm(sessionId);
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      const memory: ShortTermMemory = JSON.parse(data);
      
      // Verifica se não expirou (máximo 24 horas)
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas
      if (Date.now() - memory.timestamp > maxAge) {
        this.clearShortTermMemory(sessionId);
        return null;
      }
      
      return memory;
    } catch (error) {
      logger.error('Erro ao recuperar memória de curto prazo', 'MemoryService', { sessionId, error });
      return null;
    }
  }

  async updateShortTermMemory(sessionId: string, messages: string[], topics: string[]): Promise<void> {
    logger.debug('Atualizando memória de curto prazo', 'MemoryService', { sessionId, topicsCount: topics.length });
    
    try {
      const memory: ShortTermMemory = {
        sessionId,
        messages: messages.slice(-10), // Mantém apenas as últimas 10 mensagens
        topics: [...new Set(topics)], // Remove duplicatas
        context: this.generateContext(messages, topics),
        timestamp: Date.now()
      };
      
      const key = this.STORAGE_KEYS.shortTerm(sessionId);
      localStorage.setItem(key, JSON.stringify(memory));
      
      // Atualiza cache
      cache.set(key, memory, 60 * 60 * 1000); // 1 hora no cache
      
    } catch (error) {
      logger.error('Erro ao atualizar memória de curto prazo', 'MemoryService', { sessionId, error });
    }
  }

  async clearShortTermMemory(sessionId: string): Promise<void> {
    const key = this.STORAGE_KEYS.shortTerm(sessionId);
    localStorage.removeItem(key);
    cache.delete(key);
    logger.debug('Memória de curto prazo limpa', 'MemoryService', { sessionId });
  }

  // === MEMÓRIA DE MÉDIO PRAZO (HISTÓRICO) ===
  
  async getMediumTermMemory(userId: string): Promise<MediumTermMemory | null> {
    logger.debug('Recuperando memória de médio prazo', 'MemoryService', { userId });
    
    return withCache(
      this.STORAGE_KEYS.mediumTerm(userId),
      async () => {
        const data = localStorage.getItem(this.STORAGE_KEYS.mediumTerm(userId));
        return data ? JSON.parse(data) : null;
      },
      30 * 60 * 1000 // 30 minutos no cache
    );
  }

  async updateMediumTermMemory(userId: string, topics: string[], domain: string): Promise<void> {
    logger.debug('Atualizando memória de médio prazo', 'MemoryService', { userId, domain });
    
    try {
      let memory = await this.getMediumTermMemory(userId);
      
      if (!memory) {
        memory = {
          userId,
          frequentTopics: {},
          ongoingProjects: [],
          learningProgress: {},
          lastUpdated: Date.now()
        };
      }
      
      // Atualiza tópicos frequentes
      topics.forEach(topic => {
        memory!.frequentTopics[topic] = (memory!.frequentTopics[topic] || 0) + 1;
      });
      
      // Atualiza progresso de aprendizado
      if (!memory.learningProgress[domain]) {
        memory.learningProgress[domain] = {
          domain,
          conceptsLearned: [],
          currentFocus: topics,
          difficulty: 'beginner',
          lastSession: Date.now()
        };
      } else {
        memory.learningProgress[domain].currentFocus = topics;
        memory.learningProgress[domain].lastSession = Date.now();
      }
      
      memory.lastUpdated = Date.now();
      
      const key = this.STORAGE_KEYS.mediumTerm(userId);
      localStorage.setItem(key, JSON.stringify(memory));
      cache.delete(key); // Remove do cache para forçar atualização
      
    } catch (error) {
      logger.error('Erro ao atualizar memória de médio prazo', 'MemoryService', { userId, error });
    }
  }

  // === MEMÓRIA DE LONGO PRAZO (PERFIL) ===
  
  async getLongTermMemory(userId: string): Promise<LongTermMemory | null> {
    logger.debug('Recuperando memória de longo prazo', 'MemoryService', { userId });
    
    return withCache(
      this.STORAGE_KEYS.longTerm(userId),
      async () => {
        const data = localStorage.getItem(this.STORAGE_KEYS.longTerm(userId));
        return data ? JSON.parse(data) : null;
      },
      60 * 60 * 1000 // 1 hora no cache
    );
  }

  async initializeLongTermMemory(userId: string, name: string): Promise<LongTermMemory> {
    logger.info('Inicializando memória de longo prazo', 'MemoryService', { userId, name });
    
    const memory: LongTermMemory = {
      userId,
      profile: {
        name,
        primaryInterests: [],
        communicationStyle: 'casual',
        learningStyle: 'mixed',
        responseLength: 'detailed'
      },
      preferences: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: true,
        memoryEnabled: true,
        dataRetention: 365 // 1 ano
      },
      interests: [],
      knowledgeLevel: {},
      goals: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    const key = this.STORAGE_KEYS.longTerm(userId);
    localStorage.setItem(key, JSON.stringify(memory));
    
    return memory;
  }

  async updateLongTermMemory(userId: string, updates: Partial<LongTermMemory>): Promise<void> {
    logger.debug('Atualizando memória de longo prazo', 'MemoryService', { userId });
    
    try {
      let memory = await this.getLongTermMemory(userId);
      
      if (!memory) {
        logger.warn('Memória de longo prazo não encontrada, inicializando', 'MemoryService', { userId });
        return;
      }
      
      // Merge das atualizações
      memory = { ...memory, ...updates, lastUpdated: Date.now() };
      
      const key = this.STORAGE_KEYS.longTerm(userId);
      localStorage.setItem(key, JSON.stringify(memory));
      cache.delete(key); // Remove do cache para forçar atualização
      
    } catch (error) {
      logger.error('Erro ao atualizar memória de longo prazo', 'MemoryService', { userId, error });
    }
  }

  // === ANÁLISE E CONTEXTO ===
  
  async generatePersonalizedContext(userId: string, sessionId: string, currentDomain: string): Promise<string> {
    logger.debug('Gerando contexto personalizado', 'MemoryService', { userId, sessionId, currentDomain });
    
    try {
      const [shortTerm, mediumTerm, longTerm] = await Promise.all([
        this.getShortTermMemory(sessionId),
        this.getMediumTermMemory(userId),
        this.getLongTermMemory(userId)
      ]);
      
      let context = '';
      
      // Contexto do perfil do usuário
      if (longTerm) {
        context += `PERFIL DO USUÁRIO:\n`;
        context += `- Nome: ${longTerm.profile.name}\n`;
        context += `- Estilo de comunicação: ${longTerm.profile.communicationStyle}\n`;
        context += `- Estilo de aprendizado: ${longTerm.profile.learningStyle}\n`;
        context += `- Nível de resposta preferido: ${longTerm.profile.responseLength}\n`;
        
        if (longTerm.knowledgeLevel[currentDomain]) {
          context += `- Nível de conhecimento em ${currentDomain}: ${longTerm.knowledgeLevel[currentDomain]}\n`;
        }
        
        if (longTerm.goals.length > 0) {
          context += `- Objetivos: ${longTerm.goals.join(', ')}\n`;
        }
      }
      
      // Contexto de progresso de aprendizado
      if (mediumTerm?.learningProgress[currentDomain]) {
        const progress = mediumTerm.learningProgress[currentDomain];
        context += `\nPROGRESSO DE APRENDIZADO:\n`;
        context += `- Foco atual: ${progress.currentFocus.join(', ')}\n`;
        context += `- Dificuldade: ${progress.difficulty}\n`;
        
        if (progress.conceptsLearned.length > 0) {
          context += `- Conceitos já aprendidos: ${progress.conceptsLearned.slice(-5).join(', ')}\n`;
        }
      }
      
      // Contexto da sessão atual
      if (shortTerm) {
        context += `\nCONTEXTO DA SESSÃO:\n`;
        context += `- Tópicos discutidos: ${shortTerm.topics.join(', ')}\n`;
        context += `- Contexto: ${shortTerm.context}\n`;
      }
      
      // Tópicos frequentes
      if (mediumTerm) {
        const topTopics = Object.entries(mediumTerm.frequentTopics)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([topic]) => topic);
        
        if (topTopics.length > 0) {
          context += `\nTÓPICOS DE INTERESSE: ${topTopics.join(', ')}\n`;
        }
      }
      
      return context;
      
    } catch (error) {
      logger.error('Erro ao gerar contexto personalizado', 'MemoryService', { userId, error });
      return '';
    }
  }

  // === UTILITÁRIOS ===
  
  private generateContext(messages: string[], topics: string[]): string {
    const recentMessages = messages.slice(-3).join(' ');
    const mainTopics = topics.slice(0, 3).join(', ');
    return `Discussão recente sobre: ${mainTopics}. Contexto: ${recentMessages.substring(0, 200)}...`;
  }

  async extractTopicsFromMessage(message: string): Promise<string[]> {
    // Extração simples de tópicos baseada em palavras-chave
    const keywords = message.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['para', 'como', 'onde', 'quando', 'porque', 'qual', 'quem'].includes(word));
    
    return [...new Set(keywords)].slice(0, 5);
  }

  async shouldUpdateMemory(userId: string, message: string): Promise<boolean> {
    // Decide se a mensagem é significativa o suficiente para atualizar a memória
    const minLength = 10;
    const hasQuestions = /\?/.test(message);
    const hasKeywords = /\b(aprender|entender|explicar|ajudar|projeto|problema)\b/i.test(message);
    
    return message.length >= minLength && (hasQuestions || hasKeywords);
  }

  // === INTEGRAÇÃO COM CHAT ===
  
  async analyzeAndStoreMessage(userId: string, message: string, domainId: string): Promise<void> {
    logger.debug('Analisando mensagem para memória', 'MemoryService', { userId, domainId });
    
    try {
      // Verifica se deve atualizar memória
      const shouldUpdate = await this.shouldUpdateMemory(userId, message);
      if (!shouldUpdate) return;
      
      // Extrai tópicos da mensagem
      const topics = await this.extractTopicsFromMessage(message);
      
      // Atualiza memória de médio prazo
      await this.updateMediumTermMemory(userId, topics, domainId);
      
    } catch (error) {
      logger.error('Erro ao analisar mensagem', 'MemoryService', { userId, error });
    }
  }

  async generateContextualPrompt(userId: string, domainId: string): Promise<string> {
    logger.debug('Gerando prompt contextual', 'MemoryService', { userId, domainId });
    
    try {
      const [mediumTerm, longTerm] = await Promise.all([
        this.getMediumTermMemory(userId),
        this.getLongTermMemory(userId)
      ]);
      
      let contextualPrompt = '\n\n## CONTEXTO PERSONALIZADO:\n';
      
      // Informações do perfil
      if (longTerm) {
        contextualPrompt += `- Usuário: ${longTerm.profile.name}\n`;
        contextualPrompt += `- Estilo de comunicação preferido: ${longTerm.profile.communicationStyle}\n`;
        contextualPrompt += `- Estilo de aprendizado: ${longTerm.profile.learningStyle}\n`;
        contextualPrompt += `- Nível de resposta: ${longTerm.profile.responseLength}\n`;
        
        if (longTerm.knowledgeLevel[domainId]) {
          contextualPrompt += `- Nível de conhecimento em ${domainId}: ${longTerm.knowledgeLevel[domainId]}\n`;
        }
        
        if (longTerm.interests.length > 0) {
          contextualPrompt += `- Interesses principais: ${longTerm.interests.slice(0, 3).join(', ')}\n`;
        }
      }
      
      // Progresso de aprendizado
      if (mediumTerm?.learningProgress[domainId]) {
        const progress = mediumTerm.learningProgress[domainId];
        contextualPrompt += `- Foco atual de aprendizado: ${progress.currentFocus.slice(0, 3).join(', ')}\n`;
        contextualPrompt += `- Nível de dificuldade: ${progress.difficulty}\n`;
      }
      
      // Tópicos frequentes
      if (mediumTerm) {
        const topTopics = Object.entries(mediumTerm.frequentTopics)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([topic]) => topic);
        
        if (topTopics.length > 0) {
          contextualPrompt += `- Tópicos de interesse recorrentes: ${topTopics.join(', ')}\n`;
        }
      }
      
      contextualPrompt += '\nAdapte sua resposta considerando essas informações do usuário.\n';
      
      return contextualPrompt;
      
    } catch (error) {
      logger.error('Erro ao gerar prompt contextual', 'MemoryService', { userId, error });
      return '';
    }
  }
  
  async cleanupExpiredMemories(): Promise<void> {
    logger.info('Iniciando limpeza de memórias expiradas', 'MemoryService');
    
    try {
      const keys = Object.keys(localStorage);
      let cleaned = 0;
      
      for (const key of keys) {
        if (key.startsWith('memory_short_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const memory = JSON.parse(data);
            const maxAge = 24 * 60 * 60 * 1000; // 24 horas
            
            if (Date.now() - memory.timestamp > maxAge) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        }
      }
      
      logger.info('Limpeza concluída', 'MemoryService', { memoriesRemoved: cleaned });
      
    } catch (error) {
      logger.error('Erro na limpeza de memórias', 'MemoryService', { error });
    }
  }

  async exportUserMemory(userId: string): Promise<object> {
    const [mediumTerm, longTerm] = await Promise.all([
      this.getMediumTermMemory(userId),
      this.getLongTermMemory(userId)
    ]);
    
    return {
      userId,
      exportedAt: Date.now(),
      mediumTermMemory: mediumTerm,
      longTermMemory: longTerm
    };
  }

  async deleteUserMemory(userId: string): Promise<void> {
    logger.warn('Deletando toda memória do usuário', 'MemoryService', { userId });
    
    localStorage.removeItem(this.STORAGE_KEYS.mediumTerm(userId));
    localStorage.removeItem(this.STORAGE_KEYS.longTerm(userId));
    
    // Remove do cache
    cache.delete(this.STORAGE_KEYS.mediumTerm(userId));
    cache.delete(this.STORAGE_KEYS.longTerm(userId));
  }
}

// Instância singleton
export const memoryService = new MemoryService();

// Limpeza automática a cada hora
setInterval(() => {
  memoryService.cleanupExpiredMemories();
}, 60 * 60 * 1000);