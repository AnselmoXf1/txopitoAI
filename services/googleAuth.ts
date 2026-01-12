/**
 * Google OAuth Service - TXOPITO IA
 * Implementa autenticação com Google usando proxy backend seguro
 */

import { User } from '../types';
import { logger } from '../backend/logger';

// Configurações do Google OAuth
const GOOGLE_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id',
  redirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/google/callback`,
  scope: 'openid email profile',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  // Usar URL completa do backend para evitar problemas de proxy
  proxyUrl: 'http://localhost:3001/api/auth/google'
};

export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

export class GoogleAuthService {
  /**
   * Inicia o fluxo de autenticação OAuth com Google
   */
  static initiateAuth(): void {
    const state = this.generateState();
    const nonce = this.generateNonce();
    
    // Salva no localStorage e faz backup no sessionStorage
    localStorage.setItem('google_oauth_state', state);
    localStorage.setItem('google_oauth_nonce', nonce);
    sessionStorage.setItem('google_oauth_state_backup', state);
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CONFIG.clientId,
      redirect_uri: GOOGLE_CONFIG.redirectUri,
      scope: GOOGLE_CONFIG.scope,
      response_type: 'code',
      state,
      nonce,
      access_type: 'offline',
      prompt: 'consent'
    });
    
    const authUrl = `${GOOGLE_CONFIG.authUrl}?${params.toString()}`;
    
    logger.info('Iniciando autenticação Google', 'GoogleAuth', { authUrl });
    
    console.log('🔐 State salvo:', { 
      state: state.substring(0, 10) + '...',
      localStorage: !!localStorage.getItem('google_oauth_state'),
      sessionStorage: !!sessionStorage.getItem('google_oauth_state_backup')
    });
    
    // Redireciona para Google
    window.location.href = authUrl;
  }

  /**
   * Processa o callback do Google OAuth
   */
  static async handleCallback(code: string, state: string): Promise<User> {
    console.log('🚀 Iniciando processamento do callback Google...', { 
      code: code ? code.substring(0, 10) + '...' : 'null', 
      state: state ? state.substring(0, 10) + '...' : 'null',
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search
    });
    
    // Verifica o state para prevenir CSRF
    const storedState = localStorage.getItem('google_oauth_state');
    console.log('🔐 Verificando state CSRF...', { 
      received: state ? state.substring(0, 10) + '...' : 'null', 
      stored: storedState ? storedState.substring(0, 10) + '...' : 'null',
      match: state === storedState
    });
    
    if (!state) {
      console.error('❌ State não recebido na URL');
      throw new Error('Parâmetro state não encontrado. Verifique a configuração do Google Console.');
    }
    
    if (!storedState) {
      console.error('❌ State não encontrado no localStorage');
      // Tenta recuperar do sessionStorage como fallback
      const sessionState = sessionStorage.getItem('google_oauth_state_backup');
      if (sessionState && sessionState === state) {
        console.log('✅ State recuperado do sessionStorage');
      } else {
        throw new Error('State OAuth não encontrado. Tente fazer login novamente.');
      }
    } else if (state !== storedState) {
      console.error('❌ Estado OAuth inválido - possível CSRF', {
        received: state,
        stored: storedState,
        url: window.location.href
      });
      throw new Error('Estado OAuth inválido. Possível ataque CSRF ou problema de configuração.');
    }
    
    // Remove o state usado (mas mantém backup no sessionStorage)
    if (storedState) {
      sessionStorage.setItem('google_oauth_state_backup', storedState);
    }
    localStorage.removeItem('google_oauth_state');
    localStorage.removeItem('google_oauth_nonce');
    console.log('🧹 State e nonce OAuth removidos do localStorage');
    
    try {
      console.log('📋 Configuração Google:', {
        clientId: GOOGLE_CONFIG.clientId,
        redirectUri: GOOGLE_CONFIG.redirectUri,
        proxyUrl: GOOGLE_CONFIG.proxyUrl
      });

      // Primeiro, testa se o backend está acessível
      console.log('🔍 Testando conectividade com backend...');
      try {
        const healthResponse = await fetch('http://localhost:3001/api/health', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Backend não está respondendo (${healthResponse.status})`);
        }
        
        const healthData = await healthResponse.json();
        console.log('✅ Backend está funcionando:', healthData);
        
      } catch (healthError) {
        console.error('💥 Erro de conectividade com backend:', healthError);
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001.');
      }

      // 1. Troca o código por um access token
      console.log('🔄 Passo 1: Trocando código por token...');
      let accessToken;
      try {
        accessToken = await this.exchangeCodeForToken(code);
        console.log('✅ Token obtido:', { hasToken: !!accessToken, tokenLength: accessToken?.length });
      } catch (tokenError) {
        console.error('💥 Erro específico no token:', tokenError);
        throw new Error(`Falha ao obter token: ${tokenError instanceof Error ? tokenError.message : 'Erro desconhecido'}`);
      }
      
      // 2. Busca dados do usuário
      console.log('👤 Passo 2: Buscando dados do usuário...');
      let googleUser;
      try {
        googleUser = await this.fetchUserData(accessToken);
        console.log('✅ Dados do usuário obtidos:', { id: googleUser.id, email: googleUser.email, name: googleUser.name });
      } catch (userError) {
        console.error('💥 Erro específico nos dados do usuário:', userError);
        throw new Error(`Falha ao buscar dados do usuário: ${userError instanceof Error ? userError.message : 'Erro desconhecido'}`);
      }
      
      // 3. Cria ou atualiza usuário local
      console.log('💾 Passo 3: Criando/atualizando usuário local...');
      let user;
      try {
        user = await this.createOrUpdateUser(googleUser);
        console.log('✅ Usuário criado/atualizado:', { id: user.id, name: user.name, email: user.email });
      } catch (createError) {
        console.error('💥 Erro específico na criação do usuário:', createError);
        throw new Error(`Falha ao criar usuário: ${createError instanceof Error ? createError.message : 'Erro desconhecido'}`);
      }
      
      console.log('✅ Autenticação Google concluída com sucesso!', { 
        userId: user.id, 
        googleId: googleUser.id,
        userName: user.name
      });
      
      return user;
      
    } catch (error) {
      console.error('💥 Erro detalhado na autenticação Google:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error,
        constructor: error?.constructor?.name
      });
      
      // Re-throw com mensagem mais específica se possível
      if (error instanceof Error) {
        throw error; // Mantém a mensagem original mais específica
      } else {
        throw new Error(`Falha na autenticação com Google. Erro desconhecido: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * Troca o código de autorização por um access token via proxy backend
   */
  private static async exchangeCodeForToken(code: string): Promise<string> {
    console.log('🔄 Trocando código por token via proxy backend...', { code: code.substring(0, 10) + '...' });
    
    try {
      const requestBody = {
        code,
        redirect_uri: GOOGLE_CONFIG.redirectUri
      };
      
      console.log('📤 Enviando requisição para proxy:', {
        url: `${GOOGLE_CONFIG.proxyUrl}/token`,
        method: 'POST',
        body: { ...requestBody, code: code.substring(0, 10) + '...' }
      });

      const response = await fetch(`${GOOGLE_CONFIG.proxyUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Resposta do proxy backend:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      // Tenta ler a resposta como JSON
      let responseData;
      try {
        responseData = await response.json();
        console.log('📦 Dados da resposta:', responseData);
      } catch (jsonError) {
        console.error('❌ Erro ao parsear JSON da resposta:', jsonError);
        const textResponse = await response.text();
        console.log('📄 Resposta como texto:', textResponse);
        throw new Error(`Resposta inválida do servidor: ${textResponse.substring(0, 200)}`);
      }

      if (!response.ok) {
        console.error('❌ Erro na resposta do proxy:', responseData);
        
        // Mensagens de erro mais específicas baseadas no status
        if (response.status === 400) {
          if (responseData.details?.includes('invalid_grant')) {
            throw new Error('Código de autorização inválido ou expirado. Tente fazer login novamente.');
          }
          if (responseData.details?.includes('invalid_client')) {
            throw new Error('Credenciais do Google incorretas. Verifique a configuração do servidor.');
          }
          if (responseData.details?.includes('redirect_uri_mismatch')) {
            throw new Error('URL de callback não confere. Verifique a configuração no Google Console.');
          }
          throw new Error(responseData.details || responseData.error || 'Parâmetros OAuth inválidos');
        }
        
        if (response.status === 401) {
          throw new Error('Credenciais não autorizadas. Verifique as configurações do Google Console.');
        }
        
        if (response.status === 403) {
          throw new Error('Acesso negado pelo Google. Verifique as permissões do aplicativo.');
        }
        
        if (response.status === 404) {
          throw new Error('Endpoint não encontrado. Verifique se o backend está configurado corretamente.');
        }
        
        if (response.status >= 500) {
          throw new Error('Erro interno do servidor. Tente novamente em alguns instantes.');
        }
        
        throw new Error(responseData.details || responseData.error || `Erro do servidor: ${response.status} ${response.statusText}`);
      }

      if (!responseData.access_token) {
        console.error('❌ Token de acesso não recebido:', responseData);
        throw new Error('Token de acesso não foi retornado pelo servidor');
      }

      console.log('✅ Token obtido com sucesso via proxy:', {
        hasAccessToken: !!responseData.access_token,
        tokenType: responseData.token_type,
        tokenLength: responseData.access_token?.length
      });
      
      return responseData.access_token;
      
    } catch (error) {
      console.error('💥 Erro ao trocar código por token via proxy:', error);
      
      // Se for erro de rede com o proxy
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão com o servidor. Verifique se o backend está funcionando na porta 3001.');
      }
      
      // Se for erro de timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout na conexão com o servidor. Tente novamente.');
      }
      
      // Re-throw outros erros
      throw error;
    }
  }

  /**
   * Busca dados do usuário no Google via proxy backend
   */
  private static async fetchUserData(accessToken: string): Promise<GoogleUser> {
    console.log('👤 Buscando dados do usuário via proxy...');
    
    try {
      const response = await fetch(`${GOOGLE_CONFIG.proxyUrl}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      console.log('📡 Resposta dos dados do usuário:', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('❌ Erro ao buscar dados do usuário:', errorData);
        throw new Error(errorData.details || errorData.error || `Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('👤 Dados do usuário recebidos:', { 
        id: data.user.id, 
        email: data.user.email, 
        name: data.user.name,
        verified: data.user.verified_email 
      });

      return data.user;
      
    } catch (error) {
      console.error('💥 Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Cria ou atualiza usuário local baseado nos dados do Google
   */
  private static async createOrUpdateUser(googleUser: GoogleUser): Promise<User> {
    console.log('💾 Criando/atualizando usuário local...', {
      googleId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      verified: googleUser.verified_email
    });

    // Verifica se o email está verificado
    if (!googleUser.verified_email) {
      throw new Error('Email não verificado no Google. Verifique seu email e tente novamente.');
    }

    // Verifica se usuário já existe (busca por email OU googleId)
    const existingUsers = this.getStoredUsers();
    
    // Busca por email (prioridade) ou googleId
    let existingUser = existingUsers.find(u => u.email === googleUser.email);
    
    // Se não encontrou por email, busca por googleId
    if (!existingUser) {
      existingUser = existingUsers.find(u => (u as any).googleId === googleUser.id);
    }
    
    // Verifica se há conflito: mesmo email mas googleId diferente
    const emailConflict = existingUsers.find(u => 
      u.email === googleUser.email && 
      (u as any).googleId && 
      (u as any).googleId !== googleUser.id
    );
    
    if (emailConflict) {
      console.warn('⚠️ Conflito detectado: mesmo email com googleId diferente', {
        existingGoogleId: (emailConflict as any).googleId,
        newGoogleId: googleUser.id,
        email: googleUser.email
      });
      
      // Atualiza o usuário existente com o novo googleId (assume que é a mesma pessoa)
      existingUser = emailConflict;
    }

    if (existingUser) {
      console.log('🔄 Atualizando usuário existente...', {
        existingId: existingUser.id,
        existingEmail: existingUser.email,
        newEmail: googleUser.email
      });
      
      // Atualiza usuário existente com dados do Google
      const updatedUser = {
        ...existingUser,
        name: googleUser.name, // Atualiza nome
        email: googleUser.email, // Garante email atualizado
        googleId: googleUser.id, // Atualiza/adiciona googleId
        avatar: googleUser.picture, // Atualiza avatar
        updatedAt: Date.now()
      };

      // Salva usuário atualizado
      const userIndex = existingUsers.findIndex(u => u.id === existingUser!.id);
      existingUsers[userIndex] = updatedUser;
      this.saveUsers(existingUsers);
      
      // Salva como usuário atual com verificação dupla
      localStorage.setItem('txopito_current_user', JSON.stringify(updatedUser));
      
      // Verifica se foi salvo corretamente
      const verification = localStorage.getItem('txopito_current_user');
      if (!verification) {
        console.error('❌ Falha ao salvar usuário no localStorage');
        throw new Error('Erro interno: não foi possível salvar os dados do usuário');
      }
      
      console.log('✅ Usuário existente atualizado e salvo:', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        googleId: updatedUser.googleId,
        savedToStorage: !!verification
      });
      
      return updatedUser;
    } else {
      console.log('🆕 Criando novo usuário...');
      
      // Cria novo usuário
      const newUser: User & { googleId: string; avatar: string } = {
        id: `user_google_${googleUser.id}_${Date.now()}`,
        name: googleUser.name,
        email: googleUser.email,
        xp: 0,
        level: 1,
        preferences: {
          language: googleUser.locale?.startsWith('pt') ? 'pt-BR' : 'en-US',
          theme: 'light',
          notifications: true,
          highContrast: false
        },
        createdAt: Date.now(),
        googleId: googleUser.id,
        avatar: googleUser.picture
      };

      // Verifica novamente se não há duplicata (race condition)
      const finalCheck = this.getStoredUsers().find(u => u.email === googleUser.email);
      if (finalCheck) {
        console.log('🔄 Usuário criado durante o processo, atualizando...');
        return this.createOrUpdateUser(googleUser); // Recursão para atualizar
      }

      // Salva novo usuário
      existingUsers.push(newUser);
      this.saveUsers(existingUsers);
      
      // Salva como usuário atual com verificação dupla
      localStorage.setItem('txopito_current_user', JSON.stringify(newUser));
      
      // Verifica se foi salvo corretamente
      const verification = localStorage.getItem('txopito_current_user');
      if (!verification) {
        console.error('❌ Falha ao salvar novo usuário no localStorage');
        throw new Error('Erro interno: não foi possível salvar os dados do usuário');
      }
      
      console.log('✅ Novo usuário criado e salvo:', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        googleId: newUser.googleId,
        savedToStorage: !!verification
      });
      
      return newUser;
    }
  }

  /**
   * Gera um state aleatório para OAuth
   */
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Gera um nonce aleatório para OAuth
   */
  private static generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
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
      logger.error('Erro ao salvar usuários', 'GoogleAuth', { error });
    }
  }

  /**
   * Verifica se o Google OAuth está configurado
   */
  static isConfigured(): boolean {
    return !!(GOOGLE_CONFIG.clientId && 
              GOOGLE_CONFIG.clientId !== 'your_google_client_id');
  }

  /**
   * Obtém URL de configuração para desenvolvimento
   */
  static getSetupInstructions(): string {
    return `
Para configurar Google OAuth:

1. Vá para https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Ative a Google+ API
4. Vá para "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure:
   - Tipo de aplicativo: Aplicativo da Web
   - Nome: TXOPITO IA
   - Origens JavaScript autorizadas: ${window.location.origin}
   - URIs de redirecionamento autorizados: ${GOOGLE_CONFIG.redirectUri}
6. Adicione as variáveis de ambiente:
   - VITE_GOOGLE_CLIENT_ID=seu_client_id
   - VITE_GOOGLE_CLIENT_SECRET=seu_client_secret
   - VITE_GOOGLE_REDIRECT_URI=${GOOGLE_CONFIG.redirectUri}
    `;
  }
}

export default GoogleAuthService;