/**
 * Onboarding Service - TXOPITO IA
 * Gerencia dados de onboarding e analytics de usuários
 */

import { OnboardingData, User } from '../types';

export interface OnboardingAnalytics {
  totalUsers: number;
  completionRate: number;
  discoverySourceStats: Record<string, number>;
  primaryGoalStats: Record<string, number>;
  experienceLevelStats: Record<string, number>;
  expectedUsageStats: Record<string, number>;
  topExpectations: Array<{ expectation: string; count: number }>;
  demographicStats: {
    ageRanges: Record<string, number>;
    locations: Record<string, number>;
    professions: Record<string, number>;
  };
  averageCompletionTime: number;
  commonFeedback: string[];
}

export class OnboardingService {
  /**
   * Salva dados de onboarding do usuário
   */
  static async saveOnboardingData(userId: string, onboardingData: OnboardingData): Promise<void> {
    try {
      // Atualiza o usuário com os dados de onboarding
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex >= 0) {
        users[userIndex] = {
          ...users[userIndex],
          onboarding: onboardingData,
          hasCompletedOnboarding: true
        };
        
        this.saveUsers(users);
        
        // Atualiza também o usuário atual no localStorage
        const currentUser = localStorage.getItem('txopito_current_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.id === userId) {
            user.onboarding = onboardingData;
            user.hasCompletedOnboarding = true;
            localStorage.setItem('txopito_current_user', JSON.stringify(user));
          }
        }
        
        console.log('✅ Dados de onboarding salvos:', {
          userId,
          discoverySource: onboardingData.discoverySource,
          primaryGoal: onboardingData.primaryGoal,
          primaryInterest: onboardingData.primaryInterest
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar dados de onboarding:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuário precisa completar o onboarding
   */
  static shouldShowOnboarding(user: User): boolean {
    // Mostra onboarding se:
    // 1. Usuário não completou onboarding E
    // 2. Não tem dados de onboarding E
    // 3. (É um usuário novo OU nunca viu o onboarding)
    
    const hasCompleted = user.hasCompletedOnboarding;
    const hasOnboardingData = !!user.onboarding;
    const isNewUser = (Date.now() - user.createdAt) < (24 * 60 * 60 * 1000); // 24 horas (mais flexível)
    
    // Log para debug
    console.log('🔍 Verificando onboarding:', {
      userId: user.id,
      name: user.name,
      hasCompleted,
      hasOnboardingData,
      isNewUser,
      createdAt: new Date(user.createdAt).toLocaleString(),
      hoursAgo: Math.round((Date.now() - user.createdAt) / (1000 * 60 * 60))
    });
    
    // Mostra onboarding se não completou E não tem dados E é usuário novo
    const shouldShow = !hasCompleted && !hasOnboardingData && isNewUser;
    
    console.log(`${shouldShow ? '✅' : '❌'} Onboarding será ${shouldShow ? 'exibido' : 'ocultado'}`);
    
    return shouldShow;
  }

  /**
   * Gera analytics dos dados de onboarding
   */
  static generateAnalytics(): OnboardingAnalytics {
    const users = this.getStoredUsers();
    const usersWithOnboarding = users.filter(u => u.onboarding);
    const totalUsers = users.length;
    const completedOnboarding = usersWithOnboarding.length;
    
    // Estatísticas de fonte de descoberta
    const discoverySourceStats: Record<string, number> = {};
    usersWithOnboarding.forEach(user => {
      const source = user.onboarding!.discoverySource;
      discoverySourceStats[source] = (discoverySourceStats[source] || 0) + 1;
    });

    // Estatísticas de objetivo principal
    const primaryGoalStats: Record<string, number> = {};
    usersWithOnboarding.forEach(user => {
      const goal = user.onboarding!.primaryGoal;
      primaryGoalStats[goal] = (primaryGoalStats[goal] || 0) + 1;
    });

    // Estatísticas de nível de experiência
    const experienceLevelStats: Record<string, number> = {};
    usersWithOnboarding.forEach(user => {
      const level = user.onboarding!.experienceLevel;
      experienceLevelStats[level] = (experienceLevelStats[level] || 0) + 1;
    });

    // Estatísticas de uso esperado
    const expectedUsageStats: Record<string, number> = {};
    usersWithOnboarding.forEach(user => {
      const usage = user.onboarding!.expectedUsage;
      expectedUsageStats[usage] = (expectedUsageStats[usage] || 0) + 1;
    });

    // Top expectativas
    const expectationCounts: Record<string, number> = {};
    usersWithOnboarding.forEach(user => {
      user.onboarding!.expectations.forEach(expectation => {
        expectationCounts[expectation] = (expectationCounts[expectation] || 0) + 1;
      });
    });
    
    const topExpectations = Object.entries(expectationCounts)
      .map(([expectation, count]) => ({ expectation, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Estatísticas demográficas
    const ageRanges: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const professions: Record<string, number> = {};
    
    usersWithOnboarding.forEach(user => {
      const onboarding = user.onboarding!;
      
      if (onboarding.ageRange) {
        ageRanges[onboarding.ageRange] = (ageRanges[onboarding.ageRange] || 0) + 1;
      }
      
      if (onboarding.location) {
        locations[onboarding.location] = (locations[onboarding.location] || 0) + 1;
      }
      
      if (onboarding.profession) {
        professions[onboarding.profession] = (professions[onboarding.profession] || 0) + 1;
      }
    });

    // Feedback comum (palavras mais frequentes)
    const feedbackTexts = usersWithOnboarding
      .map(u => u.onboarding!.initialFeedback)
      .filter(Boolean) as string[];
    
    const commonFeedback = this.extractCommonPhrases(feedbackTexts);

    // Tempo médio de conclusão (estimativa baseada em timestamps)
    const completionTimes = usersWithOnboarding
      .map(u => u.onboarding!.completedAt - u.createdAt)
      .filter(time => time > 0 && time < 24 * 60 * 60 * 1000); // Máximo 24h
    
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    return {
      totalUsers,
      completionRate: totalUsers > 0 ? (completedOnboarding / totalUsers) * 100 : 0,
      discoverySourceStats,
      primaryGoalStats,
      experienceLevelStats,
      expectedUsageStats,
      topExpectations,
      demographicStats: {
        ageRanges,
        locations,
        professions
      },
      averageCompletionTime,
      commonFeedback
    };
  }

  /**
   * Extrai frases comuns do feedback
   */
  private static extractCommonPhrases(feedbackTexts: string[]): string[] {
    if (feedbackTexts.length === 0) return [];
    
    // Combina todos os textos
    const allText = feedbackTexts.join(' ').toLowerCase();
    
    // Remove pontuação e divide em palavras
    const words = allText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3); // Apenas palavras com mais de 3 caracteres
    
    // Conta frequência das palavras
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Retorna as 10 palavras mais comuns
    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Gera relatório de onboarding para admin
   */
  static generateOnboardingReport(): string {
    const analytics = this.generateAnalytics();
    
    let report = '# 📊 RELATÓRIO DE ONBOARDING - TXOPITO IA\n\n';
    
    // Resumo geral
    report += '## 📈 Resumo Geral\n\n';
    report += `- **Total de usuários:** ${analytics.totalUsers}\n`;
    report += `- **Taxa de conclusão:** ${analytics.completionRate.toFixed(1)}%\n`;
    report += `- **Tempo médio de conclusão:** ${this.formatDuration(analytics.averageCompletionTime)}\n\n`;
    
    // Como conheceram a plataforma
    report += '## 🔍 Como Conheceram a Plataforma\n\n';
    Object.entries(analytics.discoverySourceStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([source, count]) => {
        const percentage = ((count / Object.values(analytics.discoverySourceStats).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
        report += `- **${this.formatDiscoverySource(source)}:** ${count} usuários (${percentage}%)\n`;
      });
    
    // Objetivos principais
    report += '\n## 🎯 Objetivos Principais\n\n';
    Object.entries(analytics.primaryGoalStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([goal, count]) => {
        const percentage = ((count / Object.values(analytics.primaryGoalStats).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
        report += `- **${this.formatPrimaryGoal(goal)}:** ${count} usuários (${percentage}%)\n`;
      });
    
    // Níveis de experiência
    report += '\n## 📚 Níveis de Experiência\n\n';
    Object.entries(analytics.experienceLevelStats)
      .sort(([, a], [, b]) => b - a)
      .forEach(([level, count]) => {
        const percentage = ((count / Object.values(analytics.experienceLevelStats).reduce((a, b) => a + b, 0)) * 100).toFixed(1);
        report += `- **${this.formatExperienceLevel(level)}:** ${count} usuários (${percentage}%)\n`;
      });
    
    // Expectativas mais comuns
    report += '\n## ⭐ Expectativas Mais Comuns\n\n';
    analytics.topExpectations.slice(0, 5).forEach((item, index) => {
      report += `${index + 1}. **${item.expectation}** - ${item.count} usuários\n`;
    });
    
    // Demografia
    if (Object.keys(analytics.demographicStats.ageRanges).length > 0) {
      report += '\n## 👥 Demografia\n\n';
      
      if (Object.keys(analytics.demographicStats.ageRanges).length > 0) {
        report += '### Faixas Etárias\n';
        Object.entries(analytics.demographicStats.ageRanges)
          .sort(([, a], [, b]) => b - a)
          .forEach(([age, count]) => {
            report += `- **${age}:** ${count} usuários\n`;
          });
        report += '\n';
      }
      
      if (Object.keys(analytics.demographicStats.locations).length > 0) {
        report += '### Localizações Mais Comuns\n';
        Object.entries(analytics.demographicStats.locations)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .forEach(([location, count]) => {
            report += `- **${location}:** ${count} usuários\n`;
          });
        report += '\n';
      }
    }
    
    // Feedback comum
    if (analytics.commonFeedback.length > 0) {
      report += '## 💬 Palavras Mais Mencionadas no Feedback\n\n';
      analytics.commonFeedback.forEach((word, index) => {
        report += `${index + 1}. ${word}\n`;
      });
    }
    
    return report;
  }

  /**
   * Formatadores de texto
   */
  private static formatDiscoverySource(source: string): string {
    const map: Record<string, string> = {
      'google_search': 'Pesquisa no Google',
      'social_media': 'Redes Sociais',
      'friend_recommendation': 'Indicação de Amigo',
      'advertisement': 'Publicidade/Anúncio',
      'blog_article': 'Artigo/Blog',
      'youtube': 'YouTube/Vídeo',
      'other': 'Outro'
    };
    return map[source] || source;
  }

  private static formatPrimaryGoal(goal: string): string {
    const map: Record<string, string> = {
      'learning': 'Aprender e Estudar',
      'work_assistance': 'Assistência no Trabalho',
      'research': 'Pesquisa e Investigação',
      'productivity': 'Aumentar Produtividade',
      'entertainment': 'Entretenimento',
      'other': 'Outro'
    };
    return map[goal] || goal;
  }

  private static formatExperienceLevel(level: string): string {
    const map: Record<string, string> = {
      'beginner': 'Iniciante',
      'intermediate': 'Intermediário',
      'advanced': 'Avançado',
      'expert': 'Especialista'
    };
    return map[level] || level;
  }

  private static formatDuration(ms: number): string {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}min`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Helpers para localStorage
   */
  private static getStoredUsers(): User[] {
    try {
      const data = localStorage.getItem('txopito_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static saveUsers(users: User[]): void {
    try {
      localStorage.setItem('txopito_users', JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
    }
  }
}

// Expõe no console para debug
if (typeof window !== 'undefined') {
  (window as any).OnboardingService = OnboardingService;
}

export default OnboardingService;