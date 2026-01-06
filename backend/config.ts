/**
 * Configuração centralizada do sistema
 * Gerencia variáveis de ambiente e configurações globais
 */

export interface AppConfig {
  gemini: {
    apiKey: string;
    models: {
      chat: string;
      imageGeneration: string;
    };
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production';
  };
  gamification: {
    xpPerMessage: number;
    xpPerImageUpload: number;
    xpPerImageGeneration: number;
    baseXpForLevel: number;
  };
}

// Função para carregar configurações do ambiente
const loadConfig = (): AppConfig => {
  // Tenta carregar a API key de diferentes fontes
  const apiKey = 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    (typeof window !== 'undefined' && (window as any).VITE_GEMINI_API_KEY) || 
    '';

  if (!apiKey) {
    console.warn('⚠️ API Key do Gemini não encontrada. Configure GEMINI_API_KEY no .env.local');
  }

  return {
    gemini: {
      apiKey,
      models: {
        chat: 'gemini-2.5-flash', // Modelo mais recente e estável (Gemini 2.5 Flash)
        imageGeneration: 'imagen-4.0-generate-001' // Imagen 4.0 mais recente
      }
    },
    app: {
      name: 'TXOPITO IA',
      version: '1.0.0',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    },
    gamification: {
      xpPerMessage: 10,
      xpPerImageUpload: 25,
      xpPerImageGeneration: 50,
      baseXpForLevel: 200 // Level * baseXpForLevel = XP needed
    }
  };
};

export const config = loadConfig();

// Validação de configuração
export const validateConfig = (): boolean => {
  if (!config.gemini.apiKey) {
    console.error('❌ Configuração inválida: API Key do Gemini é obrigatória');
    return false;
  }
  
  console.log('✅ Configuração validada com sucesso');
  return true;
};