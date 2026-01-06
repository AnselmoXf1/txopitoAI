/**
 * Sistema de Memória Contextual por Utilizador
 * Implementa memória de curto, médio e longo prazo conforme especificação
 */

import { logger } from './logger';
import { db } from './database';
import { DomainId } from '../types';

// Tipos de memória
export interface ShortTermMemory {
  sessionId: string;
  userId: string;
  context: string[];
  topics: string[];
  lastInteraction: number;
}

export interface MediumTermMemory {
  userId: string;
  frequentTopics: Record<string, number>;
  ongoingProjects: ProjectMemory[];
  preferredDomains: Record<DomainId, number>;
  learningProgress: Record<string, LearningProgress>;
  lastUpdated: number;
}

export interface LongTermMemory {
  userId: string;
  profile: UserProfile;
  preferences: UserPreferences;
  knowledgeLevel: Record<DomainId, KnowledgeLevel>;
  interests: string[];
  goals: string[];
  communicationStyle: CommunicationStyle;
  createdAt: number;
  lastUpdated: number;
}

export interface ProjectMemory {
  id: string;
  title: string;
  domain: DomainId;
  description: string;
  status: 'active' | 'paused' | 'completed';
  keyPoints: string[];
  nextSteps: string[];
  createdAt: number;
  lastUpdated: number;
}

export interface LearningProgress {
  topic: string;
  domain: DomainId;
  level: 'beginner' | 'intermediate' | 'advanced';
  concepts: string[];
  lastStudied: number;
}

export interface UserProfile {
  name: string;
  occupation?: string;
  educationLevel?: 'basic' | 'intermediate' | 'higher' | 'postgraduate';
  primaryInterests: string[];
  learningGoals: string[];
}

export interface UserPreferences {
  explanationStyle: 'simple' | 'detailed' | 'technical';
  examplePreference: 'practical' | 'theoretical' | 'mixed';
  feedbackFrequency: 'high' | 'medium' | 'low';
  reminderPreference: boolean;
}

export interface CommunicationStyle {
  formalityLevel: 'formal' | 'casual' | 'mixed';
  responseLength: 'concise' | 'moderate' | 'detailed';
  useAnalogies: boolean;
  preferStructured: boolean;
}

export interface KnowledgeLevel {
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-100
  lastAssessed: number;
  keyStrengths: string[];
  areasForImprovement: string[];
}

class MemoryService {
  private shortTermCache = new Map<string, ShortTermMemory>();
  private mediumTermCache = new Map<string, MediumTermMemory>();
  private longTermCache = new Map<string, LongTermMemory>();

  // Chaves para localStorage
  private getShortTermKey(sessionId: string) { return `memory_short_${sessionId}`; }
  private getMediumTermKey(userId: string) { return `memory_medium_${userId}`; }
  private getLongTermKey(userId: string) { return `memory_long_${userId}`; }

  // === MEMÓRIA DE CURTO PRAZO (Sessão) ===
  
  getShortTermMemory(sessionId: string, userId: string): ShortTermMemory {
    const cached = this.shortTermCache.get(sessionId);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(this.getShortTermKey(sessionId));
      if (stored) {
        const memory = JSON.parse(stored);
        this.shortTermCache.set(sessionId, memory);
        return memory;
      }
    } catch (error) {
      logger.error('Erro ao carregar memória de curto prazo', 'Memory', { sessionId, error });
    }

    // Cria nova memória de sessão
    const newMemory: ShortTermMemory = {
      sessionId,
      userId,
      context: [],
      topics: [],
      lastInteraction: Date.now()
    };

    this.saveShortTermMemory(newMemory);
    return newMemory;
  }

  saveShortTermMemory(memory: ShortTermMemory): void {
    try {
      memory.lastInteraction = Date.now();
      localStorage.setItem(this.getShortTermKey(memory.sessionId), JSON.stringify(memory));
      this.shortTermCache.set(memory.sessionId, memory);
      
      logger.debug('Memória de curto prazo salva', 'Memory', { 
        sessionId: memory.sessionId,
        contextSize: memory.context.length 
      });
    } catch (error) {
      logger.error('Erro ao salvar memória de curto prazo', 'Memory', { error });
    }
  }

  addToShortTermContext(sessionId: string, userId: string, context: string, topic?: string): void {
    const memory = this.getShortTermMemory(sessionId, userId);
    
    // Adiciona contexto (máximo 10 itens)
    memory.context.push(context);
    if (memory.context.length > 10) {
      memory.context = memory.context.slice(-10);
    }

    // Adiciona tópico se fornecido
    if (topic && !memory.topics.includes(topic)) {
      memory.topics.push(topic);
      if (memory.topics.length > 5) {
        memory.topics = memory.topics.slice(-5);
      }
    }

    this.saveShortTermMemory(memory);
  }

  // === MEMÓRIA DE MÉDIO PRAZO (Histórico) ===

  getMediumTermMemory(userId: string): MediumTermMemory {
    const cached = this.mediumTermCache.get(userId);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(this.getMediumTermKey(userId));
      if (stored) {
        const memory = JSON.parse(stored);
        this.mediumTermCache.set(userId, memory);
        return memory;
      }
    } catch (error) {
      logger.error('Erro ao carregar memória de médio prazo', 'Memory', { userId, error });
    }

    // Cria nova memória de médio prazo
    const newMemory: MediumTermMemory = {
      userId,
      frequentTopics: {},
      ongoingProjects: [],
      preferredDomains: {} as Record<DomainId, number>,
      learningProgress: {},
      lastUpdated: Date.now()
    };

    this.saveMediumTermMemory(newMemory);
    return newMemory;
  }

  saveMediumTermMemory(memory: MediumTermMemory): void {
    try {
      memory.lastUpdated = Date.now();
      localStorage.setItem(this.getMediumTermKey(memory.userId), JSON.stringify(memory));
      this.mediumTermCache.set(memory.userId, memory);
      
      logger.debug('Memória de médio prazo salva', 'Memory', { 
        userId: memory.userId,
        topicsCount: Object.keys(memory.frequentTopics).length 
      });
    } catch (error) {
      logger.error('Erro ao salvar memória de médio prazo', 'Memory', { error });
    }
  }

  addTopicFrequency(userId: string, topic: string, domain: DomainId): void {
    const memory = this.getMediumTermMemory(userId);
    
    // Incrementa frequência do tópico
    memory.frequentTopics[topic] = (memory.frequentTopics[topic] || 0) + 1;
    
    // Incrementa preferência de domínio
    memory.preferredDomains[domain] = (memory.preferredDomains[domain] || 0) + 1;
    
    this.saveMediumTermMemory(memory);
  }

  addProject(userId: string, project: Omit<ProjectMemory, 'id' | 'createdAt' | 'lastUpdated'>): string {
    const memory = this.getMediumTermMemory(userId);
    
    const newProject: ProjectMemory = {
      ...project,
      id: Date.now().toString(),
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };
    
    memory.ongoingProjects.push(newProject);
    this.saveMediumTermMemory(memory);
    
    logger.info('Projeto adicionado à memória', 'Memory', { userId, projectId: newProject.id });
    return newProject.id;
  }

  // === MEMÓRIA DE LONGO PRAZO (Perfil) ===

  getLongTermMemory(userId: string): LongTermMemory {
    const cached = this.longTermCache.get(userId);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(this.getLongTermKey(userId));
      if (stored) {
        const memory = JSON.parse(stored);
        this.longTermCache.set(userId, memory);
        return memory;
      }
    } catch (error) {
      logger.error('Erro ao carregar memória de longo prazo', 'Memory', { userId, error });
    }

    // Cria nova memória de longo prazo
    const newMemory: LongTermMemory = {
      userId,
      profile: {
        name: '',
        primaryInterests: [],
        learningGoals: []
      },
      preferences: {
        explanationStyle: 'detailed',
        examplePreference: 'practical',
        feedbackFrequency: 'medium',
        reminderPreference: true
      },
      knowledgeLevel: {} as Record<DomainId, KnowledgeLevel>,
      interests: [],
      goals: [],
      communicationStyle: {
        formalityLevel: 'mixed',
        responseLength: 'moderate',
        useAnalogies: true,
        preferStructured: true
      },
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.saveLongTermMemory(newMemory);
    return newMemory;
  }

  saveLongTermMemory(memory: LongTermMemory): void {
    try {
      memory.lastUpdated = Date.now();
      localStorage.setItem(this.getLongTermKey(memory.userId), JSON.stringify(memory));
      this.longTermCache.set(memory.userId, memory);
      
      logger.debug('Memória de longo prazo salva', 'Memory', { 
        userId: memory.userId,
        interestsCount: memory.interests.length 
      });
    } catch (error) {
      logger.error('Erro ao salvar memória de longo prazo', 'Memory', { error });
    }
  }

  updateKnowledgeLevel(userId: string, domain: DomainId, assessment: Partial<KnowledgeLevel>): void {
    const memory = this.getLongTermMemory(userId);
    
    const current = memory.knowledgeLevel[domain] || {
      level: 'novice',
      confidence: 0,
      lastAssessed: 0,
      keyStrengths: [],
      areasForImprovement: []
    };

    memory.knowledgeLevel[domain] = {
      ...current,
      ...assessment,
      lastAssessed: Date.now()
    };

    this.saveLongTermMemory(memory);
    
    logger.info('Nível de conhecimento atualizado', 'Memory', { 
      userId, 
      domain, 
      level: memory.knowledgeLevel[domain].level 
    });
  }

  // === GERAÇÃO DE CONTEXTO PARA IA ===

  generateContextForAI(sessionId: string, userId: string, domain: DomainId): string {
    const shortTerm = this.getShortTermMemory(sessionId, userId);
    const mediumTerm = this.getMediumTermMemory(userId);
    const longTerm = this.getLongTermMemory(userId);

    const contextParts: string[] = [];

    // Informações do perfil
    if (longTerm.profile.name) {
      contextParts.push(`O utilizador chama-se ${longTerm.profile.name}.`);
    }

    // Nível de conhecimento no domínio
    const knowledge = longTerm.knowledgeLevel[domain];
    if (knowledge) {
      contextParts.push(`Nível de conhecimento em ${domain}: ${knowledge.level} (confiança: ${knowledge.confidence}%).`);
      
      if (knowledge.keyStrengths.length > 0) {
        contextParts.push(`Pontos fortes: ${knowledge.keyStrengths.join(', ')}.`);
      }
    }

    // Preferências de comunicação
    const prefs = longTerm.preferences;
    contextParts.push(`Prefere explicações ${prefs.explanationStyle} com exemplos ${prefs.examplePreference}.`);

    // Tópicos frequentes
    const frequentTopics = Object.entries(mediumTerm.frequentTopics)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
    
    if (frequentTopics.length > 0) {
      contextParts.push(`Tópicos de interesse recente: ${frequentTopics.join(', ')}.`);
    }

    // Contexto da sessão atual
    if (shortTerm.context.length > 0) {
      const recentContext = shortTerm.context.slice(-3).join(' ');
      contextParts.push(`Contexto da conversa: ${recentContext}`);
    }

    // Projetos em andamento
    const activeProjects = mediumTerm.ongoingProjects
      .filter(p => p.status === 'active' && p.domain === domain)
      .slice(0, 2);
    
    if (activeProjects.length > 0) {
      const projectTitles = activeProjects.map(p => p.title).join(', ');
      contextParts.push(`Projetos em andamento: ${projectTitles}.`);
    }

    const context = contextParts.join(' ');
    
    logger.debug('Contexto gerado para IA', 'Memory', { 
      userId, 
      domain, 
      contextLength: context.length 
    });

    return context;
  }

  // === LIMPEZA E MANUTENÇÃO ===

  clearUserMemory(userId: string): void {
    try {
      // Remove do cache
      this.longTermCache.delete(userId);
      this.mediumTermCache.delete(userId);
      
      // Remove do localStorage
      localStorage.removeItem(this.getLongTermKey(userId));
      localStorage.removeItem(this.getMediumTermKey(userId));
      
      // Remove sessões do usuário
      const sessions = db.getSessions().filter(s => s.userId === userId);
      sessions.forEach(session => {
        this.shortTermCache.delete(session.id);
        localStorage.removeItem(this.getShortTermKey(session.id));
      });
      
      logger.info('Memória do usuário limpa', 'Memory', { userId });
    } catch (error) {
      logger.error('Erro ao limpar memória do usuário', 'Memory', { userId, error });
    }
  }

  getMemoryStats(userId: string) {
    const shortTermSessions = Array.from(this.shortTermCache.values())
      .filter(m => m.userId === userId).length;
    
    const mediumTerm = this.getMediumTermMemory(userId);
    const longTerm = this.getLongTermMemory(userId);

    return {
      shortTermSessions,
      mediumTermTopics: Object.keys(mediumTerm.frequentTopics).length,
      longTermInterests: longTerm.interests.length,
      knowledgeDomains: Object.keys(longTerm.knowledgeLevel).length,
      ongoingProjects: mediumTerm.ongoingProjects.length
    };
  }
}

// Instância singleton
export const memoryService = new MemoryService();