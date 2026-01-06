/**
 * Ponto de entrada principal do backend
 * Inicializa todos os serviços e configurações
 */

import { logger } from './logger';
import { config, validateConfig } from './config';
import { cache } from './cache';
import { testConnection } from '../services/geminiService';

// Exporta todos os serviços
export { AuthService, UserService, ChatService, getRank } from './api';
export { db } from './database';
export { logger } from './logger';
export { config } from './config';
export { cache, withCache, cacheKeys } from './cache';
export { validators, sanitizers, ValidationError } from './validators';

// Importa dependências necessárias
import { db } from './database';

// Função de inicialização do backend
export const initializeBackend = async (): Promise<boolean> => {
  logger.info('🚀 Inicializando TXOPITO IA Backend', 'Backend');
  
  try {
    // 1. Valida configuração
    if (!validateConfig()) {
      logger.error('❌ Falha na validação da configuração', 'Backend');
      return false;
    }

    // 2. Testa conectividade com Gemini (opcional, não bloqueia)
    try {
      const geminiConnected = await testConnection();
      if (geminiConnected) {
        logger.info('✅ Conexão com Gemini API estabelecida', 'Backend');
      } else {
        logger.warn('⚠️ Falha na conexão com Gemini API - funcionalidades de IA podem não funcionar', 'Backend');
      }
    } catch (error) {
      logger.warn('⚠️ Não foi possível testar conexão com Gemini API', 'Backend', { error: error.message });
    }

    // 3. Inicializa cache
    cache.clear(); // Limpa cache anterior se houver
    logger.info('✅ Sistema de cache inicializado', 'Backend');

    // 4. Verifica integridade do banco de dados local
    try {
      const users = db.getUsers();
      const sessions = db.getSessions();
      logger.info('✅ Banco de dados local carregado', 'Backend', { 
        users: users.length, 
        sessions: sessions.length 
      });
    } catch (error) {
      logger.error('❌ Erro ao carregar banco de dados local', 'Backend', { error: error.message });
      return false;
    }

    // 5. Log de configurações (sem dados sensíveis)
    logger.info('📋 Configurações carregadas', 'Backend', {
      appName: config.app.name,
      environment: config.app.environment,
      chatModel: config.gemini.models.chat,
      imageModel: config.gemini.models.imageGeneration,
      hasApiKey: !!config.gemini.apiKey
    });

    logger.info('🎉 Backend inicializado com sucesso!', 'Backend');
    return true;

  } catch (error) {
    logger.error('💥 Falha crítica na inicialização do backend', 'Backend', { error: error.message });
    return false;
  }
};

// Função para obter status do sistema
export const getSystemStatus = () => {
  return {
    backend: {
      initialized: true,
      version: config.app.version,
      environment: config.app.environment
    },
    database: {
      users: db.getUsers().length,
      sessions: db.getSessions().length
    },
    cache: cache.getStats(),
    gemini: {
      configured: !!config.gemini.apiKey,
      models: config.gemini.models
    }
  };
};

// Função para reset completo do sistema (desenvolvimento)
export const resetSystem = () => {
  if (config.app.environment !== 'development') {
    throw new Error('Reset só é permitido em ambiente de desenvolvimento');
  }

  logger.warn('🔄 Executando reset completo do sistema', 'Backend');
  
  // Limpa localStorage
  localStorage.clear();
  
  // Limpa cache
  cache.clear();
  
  logger.info('✅ Sistema resetado com sucesso', 'Backend');
};