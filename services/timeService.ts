/**
 * Serviço de Tempo - TXOPITO IA
 * Fornece informações atualizadas de data e hora
 */

import { logger } from '../backend/logger';

interface TimeData {
  datetime: string;
  timezone: string;
  utc_offset: string;
  day_of_week: number;
  day_of_year: number;
  week_number: number;
  unixtime: number;
  dst: boolean;
  abbreviation: string;
}

interface FormattedTimeInfo {
  currentDate: string;
  currentTime: string;
  timezone: string;
  dayOfWeek: string;
  dayOfYear: number;
  weekNumber: number;
  isWeekend: boolean;
  timeOfDay: 'madrugada' | 'manhã' | 'tarde' | 'noite';
  greeting: string;
}

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 
  'Quinta-feira', 'Sexta-feira', 'Sábado'
];

const MOZAMBIQUE_TIMEZONE = 'Africa/Maputo';

export class TimeService {
  private static instance: TimeService;
  private cachedTimeInfo: FormattedTimeInfo | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 60000; // 1 minuto

  static getInstance(): TimeService {
    if (!TimeService.instance) {
      TimeService.instance = new TimeService();
    }
    return TimeService.instance;
  }

  async getCurrentTimeInfo(): Promise<FormattedTimeInfo> {
    const now = Date.now();
    
    // Usa cache se ainda válido
    if (this.cachedTimeInfo && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cachedTimeInfo;
    }

    try {
      const timeData = await this.fetchTimeData();
      this.cachedTimeInfo = this.formatTimeInfo(timeData);
      this.lastFetch = now;
      
      logger.info('Informações de tempo atualizadas', 'TimeService', {
        timezone: timeData.timezone,
        datetime: timeData.datetime
      });
      
      return this.cachedTimeInfo;
    } catch (error) {
      logger.error('Erro ao buscar informações de tempo', 'TimeService', { error });
      
      // Fallback para horário local
      return this.getFallbackTimeInfo();
    }
  }

  private async fetchTimeData(): Promise<TimeData> {
    const response = await fetch(`http://worldtimeapi.org/api/timezone/${MOZAMBIQUE_TIMEZONE}`);
    
    if (!response.ok) {
      throw new Error(`Erro na API de tempo: ${response.status}`);
    }
    
    return await response.json();
  }

  private formatTimeInfo(timeData: TimeData): FormattedTimeInfo {
    const date = new Date(timeData.datetime);
    const hour = date.getHours();
    
    return {
      currentDate: date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      currentTime: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timezone: timeData.timezone,
      dayOfWeek: DAYS_OF_WEEK[timeData.day_of_week],
      dayOfYear: timeData.day_of_year,
      weekNumber: timeData.week_number,
      isWeekend: timeData.day_of_week === 0 || timeData.day_of_week === 6,
      timeOfDay: this.getTimeOfDay(hour),
      greeting: this.getGreeting(hour)
    };
  }

  private getTimeOfDay(hour: number): 'madrugada' | 'manhã' | 'tarde' | 'noite' {
    if (hour >= 0 && hour < 6) return 'madrugada';
    if (hour >= 6 && hour < 12) return 'manhã';
    if (hour >= 12 && hour < 18) return 'tarde';
    return 'noite';
  }

  private getGreeting(hour: number): string {
    if (hour >= 0 && hour < 6) return 'Boa madrugada';
    if (hour >= 6 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  private getFallbackTimeInfo(): FormattedTimeInfo {
    const now = new Date();
    const hour = now.getHours();
    
    return {
      currentDate: now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      currentTime: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timezone: 'Local',
      dayOfWeek: DAYS_OF_WEEK[now.getDay()],
      dayOfYear: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000),
      weekNumber: Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
      timeOfDay: this.getTimeOfDay(hour),
      greeting: this.getGreeting(hour)
    };
  }

  // Método para obter contexto temporal para o TXOPITO
  async getContextualTimeInfo(): Promise<string> {
    const timeInfo = await this.getCurrentTimeInfo();
    
    let context = `Hoje é ${timeInfo.currentDate}, ${timeInfo.currentTime}`;
    
    if (timeInfo.isWeekend) {
      context += ' (fim de semana)';
    }
    
    // Adiciona contexto baseado no horário
    switch (timeInfo.timeOfDay) {
      case 'madrugada':
        context += '. É bem tarde! Espero que esteja tudo bem.';
        break;
      case 'manhã':
        context += '. Bom dia! Como posso ajudar hoje?';
        break;
      case 'tarde':
        context += '. Boa tarde! Em que posso ser útil?';
        break;
      case 'noite':
        context += '. Boa noite! Estudando até tarde?';
        break;
    }
    
    return context;
  }

  // Verifica se é um horário apropriado para estudar
  async isGoodStudyTime(): Promise<{ isGood: boolean; reason: string }> {
    const timeInfo = await this.getCurrentTimeInfo();
    const hour = new Date().getHours();
    
    if (hour >= 0 && hour < 6) {
      return {
        isGood: false,
        reason: 'É muito tarde! Que tal descansar e estudar amanhã com a mente fresca?'
      };
    }
    
    if (hour >= 6 && hour < 10) {
      return {
        isGood: true,
        reason: 'Ótimo horário para estudar! A mente está fresca pela manhã.'
      };
    }
    
    if (hour >= 10 && hour < 14) {
      return {
        isGood: true,
        reason: 'Bom horário para aprender! Você está no pico de produtividade.'
      };
    }
    
    if (hour >= 14 && hour < 18) {
      return {
        isGood: true,
        reason: 'Tarde produtiva para estudos! Vamos aproveitar.'
      };
    }
    
    if (hour >= 18 && hour < 22) {
      return {
        isGood: true,
        reason: 'Noite boa para estudar! Momento de foco e concentração.'
      };
    }
    
    return {
      isGood: false,
      reason: 'Está ficando tarde! Que tal uma pausa? Estudar descansado é mais eficiente.'
    };
  }
}

// Instância singleton
export const timeService = TimeService.getInstance();