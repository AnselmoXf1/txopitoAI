/**
 * Serviço de Notícias - TXOPITO IA
 * Mantém o conhecimento atualizado com eventos de 2026
 */

import { logger } from '../backend/logger';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: 'technology' | 'education' | 'science' | 'business' | 'world' | 'africa';
  date: string;
  relevance: 'high' | 'medium' | 'low';
  source: string;
}

interface KnowledgeUpdate {
  topic: string;
  information: string;
  lastUpdated: string;
  category: string;
}

export class NewsService {
  private static instance: NewsService;
  private knowledgeBase: Map<string, KnowledgeUpdate> = new Map();
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 3600000; // 1 hora

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
      NewsService.instance.initializeKnowledgeBase();
    }
    return NewsService.instance;
  }

  private initializeKnowledgeBase(): void {
    // Conhecimento base para 2026
    const baseKnowledge: KnowledgeUpdate[] = [
      {
        topic: 'IA e Tecnologia 2026',
        information: 'Em 2026, a IA generativa está mais integrada ao dia a dia. Modelos como GPT-5 e Gemini Ultra são comuns. Programação assistida por IA é padrão.',
        lastUpdated: '2026-01-05',
        category: 'technology'
      },
      {
        topic: 'Educação Digital 2026',
        information: 'Ensino híbrido é norma. Plataformas de IA personalizam aprendizado. Realidade virtual em salas de aula é comum.',
        lastUpdated: '2026-01-05',
        category: 'education'
      },
      {
        topic: 'Programação 2026',
        information: 'JavaScript continua dominante. Python cresce em IA. Rust ganha espaço. WebAssembly é mainstream. Low-code/no-code expandiu.',
        lastUpdated: '2026-01-05',
        category: 'technology'
      },
      {
        topic: 'África Tecnológica 2026',
        information: 'Moçambique avança em transformação digital. Startups africanas crescem. Conectividade 5G se expande. Fintech lidera inovação.',
        lastUpdated: '2026-01-05',
        category: 'africa'
      },
      {
        topic: 'Sustentabilidade 2026',
        information: 'Energia renovável domina. Carros elétricos são maioria. Agricultura vertical cresce. Economia circular é prioridade.',
        lastUpdated: '2026-01-05',
        category: 'science'
      },
      {
        topic: 'Trabalho Remoto 2026',
        information: 'Híbrido é padrão. Metaverso para reuniões. IA gerencia produtividade. Colaboração global normalizada.',
        lastUpdated: '2026-01-05',
        category: 'business'
      }
    ];

    baseKnowledge.forEach(knowledge => {
      this.knowledgeBase.set(knowledge.topic, knowledge);
    });

    logger.info('Base de conhecimento 2026 inicializada', 'NewsService', {
      topics: baseKnowledge.length
    });
  }

  async getRelevantKnowledge(query: string, category?: string): Promise<KnowledgeUpdate[]> {
    const relevantKnowledge: KnowledgeUpdate[] = [];
    const queryLower = query.toLowerCase();

    for (const [topic, knowledge] of this.knowledgeBase) {
      // Filtra por categoria se especificada
      if (category && knowledge.category !== category) continue;

      // Verifica relevância baseada em palavras-chave
      const topicLower = topic.toLowerCase();
      const infoLower = knowledge.information.toLowerCase();

      if (topicLower.includes(queryLower) || 
          infoLower.includes(queryLower) ||
          this.hasKeywordMatch(queryLower, topicLower) ||
          this.hasKeywordMatch(queryLower, infoLower)) {
        relevantKnowledge.push(knowledge);
      }
    }

    return relevantKnowledge.slice(0, 3); // Máximo 3 itens relevantes
  }

  private hasKeywordMatch(query: string, text: string): boolean {
    const queryWords = query.split(' ').filter(word => word.length > 2);
    return queryWords.some(word => text.includes(word));
  }

  async getContextualKnowledge(domainId: string): Promise<string> {
    let contextualInfo = '';

    switch (domainId) {
      case 'programming':
        const techKnowledge = await this.getRelevantKnowledge('programação tecnologia', 'technology');
        if (techKnowledge.length > 0) {
          contextualInfo = `Contexto 2026: ${techKnowledge[0].information}`;
        }
        break;

      case 'consulting':
        const businessKnowledge = await this.getRelevantKnowledge('negócios trabalho', 'business');
        if (businessKnowledge.length > 0) {
          contextualInfo = `Contexto 2026: ${businessKnowledge[0].information}`;
        }
        break;

      case 'agriculture':
        const sustainabilityKnowledge = await this.getRelevantKnowledge('sustentabilidade agricultura', 'science');
        if (sustainabilityKnowledge.length > 0) {
          contextualInfo = `Contexto 2026: ${sustainabilityKnowledge[0].information}`;
        }
        break;

      default:
        // Conhecimento geral sobre 2026
        contextualInfo = 'Contexto 2026: Vivemos em uma era de IA integrada, trabalho híbrido e sustentabilidade como prioridade global.';
    }

    return contextualInfo;
  }

  // Simula atualizações de conhecimento (em produção, viria de APIs reais)
  async updateKnowledge(): Promise<void> {
    const now = Date.now();
    
    if (now - this.lastUpdate < this.UPDATE_INTERVAL) {
      return; // Não atualiza se ainda não passou o intervalo
    }

    try {
      // Simula novas informações (em produção, buscaria de APIs de notícias)
      const newKnowledge: KnowledgeUpdate[] = [
        {
          topic: 'IA Educacional 2026',
          information: 'Assistentes de IA como TXOPITO estão revolucionando a educação personalizada em África.',
          lastUpdated: new Date().toISOString().split('T')[0],
          category: 'education'
        }
      ];

      newKnowledge.forEach(knowledge => {
        this.knowledgeBase.set(knowledge.topic, knowledge);
      });

      this.lastUpdate = now;
      
      logger.info('Conhecimento atualizado', 'NewsService', {
        newItems: newKnowledge.length,
        totalKnowledge: this.knowledgeBase.size
      });

    } catch (error) {
      logger.error('Erro ao atualizar conhecimento', 'NewsService', { error });
    }
  }

  // Obtém estatísticas do conhecimento
  getKnowledgeStats(): { total: number; byCategory: Record<string, number>; lastUpdate: string } {
    const byCategory: Record<string, number> = {};
    
    for (const knowledge of this.knowledgeBase.values()) {
      byCategory[knowledge.category] = (byCategory[knowledge.category] || 0) + 1;
    }

    return {
      total: this.knowledgeBase.size,
      byCategory,
      lastUpdate: new Date(this.lastUpdate).toLocaleString('pt-BR')
    };
  }

  // Verifica se um tópico está atualizado
  isTopicCurrent(topic: string): boolean {
    const knowledge = this.knowledgeBase.get(topic);
    if (!knowledge) return false;

    const lastUpdate = new Date(knowledge.lastUpdated);
    const now = new Date();
    const daysDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    return daysDiff <= 7; // Considera atual se foi atualizado nos últimos 7 dias
  }
}

// Instância singleton
export const newsService = NewsService.getInstance();

// Funções auxiliares para compatibilidade
export const getCurrentNews = async (category?: string, limit: number = 5): Promise<NewsItem[]> => {
  const service = NewsService.getInstance();
  await service.updateKnowledge();
  
  // Simula notícias baseadas no conhecimento atual
  const mockNews: NewsItem[] = [
    {
      id: '1',
      title: 'IA Generativa Transforma Educação em 2026',
      summary: 'Assistentes educacionais como TXOPITO IA estão revolucionando o aprendizado personalizado.',
      category: 'technology',
      date: new Date().toISOString(),
      relevance: 'high',
      source: 'Tech News Africa'
    },
    {
      id: '2', 
      title: 'Moçambique Lidera Inovação Digital em África',
      summary: 'País se destaca em transformação digital e startups tecnológicas.',
      category: 'africa',
      date: new Date().toISOString(),
      relevance: 'high',
      source: 'África Digital'
    },
    {
      id: '3',
      title: 'Sustentabilidade e Tecnologia Caminham Juntas',
      summary: 'Energia renovável e IA trabalham para um futuro mais verde.',
      category: 'science',
      date: new Date().toISOString(),
      relevance: 'medium',
      source: 'Green Tech Today'
    }
  ];

  return category 
    ? mockNews.filter(news => news.category === category).slice(0, limit)
    : mockNews.slice(0, limit);
};

export const searchNews = async (query: string, limit: number = 5): Promise<NewsItem[]> => {
  const service = NewsService.getInstance();
  const knowledge = await service.getRelevantKnowledge(query);
  
  // Converte conhecimento em formato de notícias
  return knowledge.slice(0, limit).map((k, index) => ({
    id: `search-${index}`,
    title: k.topic,
    summary: k.information,
    category: k.category as any,
    date: k.lastUpdated,
    relevance: 'high' as const,
    source: 'TXOPITO Knowledge Base'
  }));
};

export const formatNewsForChat = (news: NewsItem[]): string => {
  if (news.length === 0) {
    return "📰 **Notícias Atuais**\n\nNão encontrei notícias específicas no momento, mas posso te ajudar com informações sobre tecnologia, educação e outros tópicos atuais de 2026!";
  }

  let formatted = "📰 **Notícias Atuais - 2026**\n\n";
  
  news.forEach((item, index) => {
    const emoji = getNewsEmoji(item.category);
    formatted += `${emoji} **${item.title}**\n`;
    formatted += `${item.summary}\n`;
    formatted += `*Fonte: ${item.source}*\n\n`;
  });

  formatted += "💡 Quer saber mais sobre alguma dessas notícias ou outros tópicos atuais?";
  
  return formatted;
};

const getNewsEmoji = (category: string): string => {
  const emojis: Record<string, string> = {
    'technology': '🚀',
    'education': '📚',
    'science': '🔬',
    'business': '💼',
    'world': '🌍',
    'africa': '🌍'
  };
  return emojis[category] || '📰';
};