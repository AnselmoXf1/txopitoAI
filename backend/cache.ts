/**
 * Sistema de cache em memória
 * Melhora a performance evitando operações repetitivas
 */

import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };
    
    this.cache.set(key, entry);
    logger.debug('Item adicionado ao cache', 'Cache', { key, ttl: entry.ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      logger.debug('Cache miss', 'Cache', { key });
      return null;
    }

    // Verifica se o item expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug('Item do cache expirado', 'Cache', { key });
      return null;
    }

    logger.debug('Cache hit', 'Cache', { key });
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Verifica se não expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Item removido do cache', 'Cache', { key });
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info('Cache limpo', 'Cache', { itemsRemoved: size });
  }

  // Remove itens expirados
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info('Limpeza automática do cache', 'Cache', { itemsRemoved: removed });
    }

    return removed;
  }

  // Estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instância singleton do cache
export const cache = new MemoryCache();

// Limpeza automática a cada 10 minutos
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Utilitários para cache específico
export const cacheKeys = {
  userSessions: (userId: string) => `user_sessions_${userId}`,
  userStats: (userId: string) => `user_stats_${userId}`,
  chatStats: (userId: string) => `chat_stats_${userId}`,
  domainConfig: (domainId: string) => `domain_config_${domainId}`
};

// Função helper para cache com fallback
export const withCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Tenta buscar do cache primeiro
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Se não está no cache, executa a função e armazena o resultado
  try {
    const result = await fetchFn();
    cache.set(key, result, ttl);
    return result;
  } catch (error) {
    logger.error('Erro ao executar função com cache', 'Cache', { key, error: error.message });
    throw error;
  }
};