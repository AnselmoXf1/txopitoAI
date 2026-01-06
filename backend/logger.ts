/**
 * Sistema de logging centralizado
 * Fornece logs estruturados para debugging e monitoramento
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite de logs em memória
  private currentLevel = LogLevel.INFO;

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    if (level < this.currentLevel) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      data
    };

    this.logs.push(entry);
    
    // Limita o número de logs em memória
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output com formatação
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelColors = ['🔍', '📝', '⚠️', '❌'];
    const contextStr = context ? `[${context}]` : '';
    
    console.log(
      `${levelColors[level]} ${levelNames[level]} ${contextStr} ${message}`,
      data ? data : ''
    );
  }

  debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  // Métodos para análise de logs
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  getLogsByContext(context: string): LogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  clearLogs() {
    this.logs = [];
  }

  // Exporta logs para análise
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Instância singleton do logger
export const logger = new Logger();

// Configuração inicial baseada no ambiente
if (process.env.NODE_ENV === 'development') {
  logger.setLevel(LogLevel.DEBUG);
} else {
  logger.setLevel(LogLevel.INFO);
}