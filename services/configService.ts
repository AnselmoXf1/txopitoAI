/**
 * Serviço de Configuração - URLs e Endpoints
 * Gerencia URLs do backend baseado no ambiente
 */

export class ConfigService {
  private static instance: ConfigService;
  
  private constructor() {}
  
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
  
  /**
   * URL base do backend
   */
  getBackendUrl(): string {
    // Em produção, usa variável de ambiente
    if (import.meta.env.PROD) {
      return import.meta.env.VITE_BACKEND_URL || 'https://txopito-ia-backend.onrender.com';
    }
    
    // Em desenvolvimento, usa localhost
    return 'http://localhost:3001';
  }
  
  /**
   * URLs dos endpoints da API
   */
  getApiEndpoints() {
    const baseUrl = this.getBackendUrl();
    
    return {
      health: `${baseUrl}/api/health`,
      auth: {
        github: `${baseUrl}/api/auth/github`,
        google: `${baseUrl}/api/auth/google`,
        callback: {
          github: `${baseUrl}/api/auth/github/callback`,
          google: `${baseUrl}/api/auth/google/callback`
        }
      }
    };
  }
  
  /**
   * Configurações OAuth com URLs corretas
   */
  getOAuthConfig() {
    const frontendUrl = import.meta.env.PROD 
      ? window.location.origin 
      : 'http://localhost:3000';
    
    return {
      github: {
        clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
        redirectUri: `${frontendUrl}/auth/github/callback`
      },
      google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirectUri: `${frontendUrl}/auth/google/callback`
      }
    };
  }
  
  /**
   * Verifica se está em produção
   */
  isProduction(): boolean {
    return import.meta.env.PROD;
  }
  
  /**
   * Verifica se backend está disponível
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.getApiEndpoints().health);
      return response.ok;
    } catch (error) {
      console.warn('Backend não disponível:', error);
      return false;
    }
  }
}

// Instância singleton
export const configService = ConfigService.getInstance();