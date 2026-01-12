/**
 * GitHub OAuth Service - TXOPITO IA
 * Implementa autenticação com GitHub usando proxy backend seguro
 */

import { User } from '../types';
import { logger } from '../backend/logger';
import { configService } from './configService';

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  bio?: string;
  location?: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string;
}

export class GitHubAuthService {
  /**
   * Inicia o fluxo de autenticação OAuth com GitHub
   */
  static initiateAuth(): void {
    const state = this.generateState();
    localStorage.setItem('github_oauth_state', state);
    
    const oauthConfig = configService.getOAuthConfig().github;
    
    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: oauthConfig.redirectUri,
      scope: 'user:email',
      state,
      allow_signup: 'true'
    });
    
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
    
    logger.info('Iniciando autenticação GitHub', 'GitHubAuth', { authUrl });
    
    // Redireciona para GitHub
    window.location.href = authUrl;
  }

  /**
   * Processa o callback do GitHub OAuth
   */
  static async handleCallback(code: string, state: string): Promise<User> {
    console.log('🚀 Iniciando processamento do callback GitHub...', { 
      code: code.substring(0, 10) + '...', 
      state: state.substring(0, 10) + '...' 
    });
    
    // Verifica o state para prevenir CSRF
    const storedState = localStorage.getItem('github_oauth_state');
    console.log('🔐 Verificando state CSRF...', { 
      received: state.substring(0, 10) + '...', 
      stored: storedState?.substring(0, 10) + '...',
      match: state === storedState
    });
    
    if (state !== storedState) {
      console.error('❌ Estado OAuth inválido - possível CSRF');
      throw new Error('Estado OAuth inválido. Possível ataque CSRF.');
    }
    
    // Remove o state usado
    localStorage.removeItem('github_oauth_state');
    console.log('🧹 State OAuth removido do localStorage');
    
    try {
      const endpoints = configService.getApiEndpoints();
      console.log('📋 Configuração GitHub:', {
        backendUrl: configService.getBackendUrl(),
        githubEndpoint: endpoints.auth.github
      });

      // Primeiro, testa se o backend está acessível
      console.log('🔍 Testando conectividade com backend...');
      const isBackendHealthy = await configService.checkBackendHealth();
      
      if (!isBackendHealthy) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      
      console.log('✅ Backend está funcionando');

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
      let githubUser;
      try {
        githubUser = await this.fetchUserData(accessToken);
        console.log('✅ Dados do usuário obtidos:', { id: githubUser.id, login: githubUser.login, name: githubUser.name });
      } catch (userError) {
        console.error('💥 Erro específico nos dados do usuário:', userError);
        throw new Error(`Falha ao buscar dados do usuário: ${userError instanceof Error ? userError.message : 'Erro desconhecido'}`);
      }
      
      // 3. Busca emails do usuário
      console.log('📧 Passo 3: Buscando emails do usuário...');
      let emails;
      try {
        emails = await this.fetchUserEmails(accessToken);
        console.log('✅ Emails obtidos:', { count: emails.length, primaryEmail: emails.find(e => e.primary)?.email });
      } catch (emailError) {
        console.error('💥 Erro específico nos emails:', emailError);
        throw new Error(`Falha ao buscar emails: ${emailError instanceof Error ? emailError.message : 'Erro desconhecido'}`);
      }
      
      // 4. Cria ou atualiza usuário local
      console.log('💾 Passo 4: Criando/atualizando usuário local...');
      let user;
      try {
        user = await this.createOrUpdateUser(githubUser, emails);
        console.log('✅ Usuário criado/atualizado:', { id: user.id, name: user.name, email: user.email });
      } catch (createError) {
        console.error('💥 Erro específico na criação do usuário:', createError);
        throw new Error(`Falha ao criar usuário: ${createError instanceof Error ? createError.message : 'Erro desconhecido'}`);
      }
      
      console.log('✅ Autenticação GitHub concluída com sucesso!', { 
        userId: user.id, 
        githubId: githubUser.id,
        userName: user.name
      });
      
      return user;
      
    } catch (error) {
      console.error('💥 Erro detalhado na autenticação GitHub:', {
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
        throw new Error(`Falha na autenticação com GitHub. Erro desconhecido: ${JSON.stringify(error)}`);
      }
    }
  }

  /**
   * Troca o código de autorização por um access token via proxy backend
   */
  private static async exchangeCodeForToken(code: string): Promise<string> {
    console.log('🔄 Trocando código por token via proxy backend...', { code: code.substring(0, 10) + '...' });
    
    try {
      const endpoints = configService.getApiEndpoints();
      const oauthConfig = configService.getOAuthConfig().github;
      
      const requestBody = {
        code,
        redirect_uri: oauthConfig.redirectUri
      };
      
      console.log('📤 Enviando requisição para proxy:', {
        url: `${endpoints.auth.github}/token`,
        method: 'POST',
        body: { ...requestBody, code: code.substring(0, 10) + '...' }
      });

      const response = await fetch(`${endpoints.auth.github}/token`, {
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
          if (responseData.details?.includes('bad_verification_code')) {
            throw new Error('Código de verificação inválido ou expirado. Tente fazer login novamente.');
          }
          if (responseData.details?.includes('incorrect_client_credentials')) {
            throw new Error('Credenciais do GitHub incorretas. Verifique a configuração do servidor.');
          }
          if (responseData.details?.includes('redirect_uri_mismatch')) {
            throw new Error('URL de callback não confere. Verifique a configuração no GitHub App.');
          }
          throw new Error(responseData.details || responseData.error || 'Parâmetros OAuth inválidos');
        }
        
        if (response.status === 401) {
          throw new Error('Credenciais não autorizadas. Verifique as configurações do GitHub App.');
        }
        
        if (response.status === 403) {
          throw new Error('Acesso negado pelo GitHub. Verifique as permissões do aplicativo.');
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
   * Busca dados do usuário no GitHub via proxy backend
   */
  private static async fetchUserData(accessToken: string): Promise<GitHubUser> {
    console.log('👤 Buscando dados do usuário via proxy...');
    
    try {
      const endpoints = configService.getApiEndpoints();
      
      const response = await fetch(`${endpoints.auth.github}/user`, {
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
        login: data.user.login, 
        name: data.user.name,
        email: data.user.email 
      });

      // Retorna os dados do usuário e emails
      this.cachedEmails = data.emails || [];
      return data.user;
      
    } catch (error) {
      console.error('💥 Erro ao buscar dados do usuário:', error);
      throw error;
    }
  }

  /**
   * Busca emails do usuário (já obtidos junto com os dados do usuário)
   */
  private static cachedEmails: GitHubEmail[] = [];
  
  private static async fetchUserEmails(accessToken: string): Promise<GitHubEmail[]> {
    console.log('📧 Retornando emails já obtidos...');
    return this.cachedEmails;
  }

  /**
   * Cria ou atualiza usuário local baseado nos dados do GitHub
   */
  private static async createOrUpdateUser(githubUser: GitHubUser, emails: GitHubEmail[]): Promise<User> {
    // Determina o email principal
    const primaryEmail = emails.find(e => e.primary && e.verified)?.email || 
                        emails.find(e => e.verified)?.email || 
                        githubUser.email;

    if (!primaryEmail) {
      throw new Error('Não foi possível obter um email verificado do GitHub.');
    }

    console.log('💾 Criando/atualizando usuário local...', {
      githubId: githubUser.id,
      login: githubUser.login,
      email: primaryEmail,
      name: githubUser.name
    });

    // Verifica se usuário já existe (busca por email OU githubId)
    const existingUsers = this.getStoredUsers();
    
    // Busca por email (prioridade) ou githubId
    let existingUser = existingUsers.find(u => u.email === primaryEmail);
    
    // Se não encontrou por email, busca por githubId
    if (!existingUser) {
      existingUser = existingUsers.find(u => (u as any).githubId === githubUser.id);
    }
    
    // Verifica se há conflito: mesmo email mas githubId diferente
    const emailConflict = existingUsers.find(u => 
      u.email === primaryEmail && 
      (u as any).githubId && 
      (u as any).githubId !== githubUser.id
    );
    
    if (emailConflict) {
      console.warn('⚠️ Conflito detectado: mesmo email com githubId diferente', {
        existingGithubId: (emailConflict as any).githubId,
        newGithubId: githubUser.id,
        email: primaryEmail
      });
      
      // Atualiza o usuário existente com o novo githubId (assume que é a mesma pessoa)
      existingUser = emailConflict;
    }

    if (existingUser) {
      console.log('🔄 Atualizando usuário existente...', {
        existingId: existingUser.id,
        existingEmail: existingUser.email,
        newEmail: primaryEmail
      });
      
      // Atualiza usuário existente com dados do GitHub
      const updatedUser = {
        ...existingUser,
        name: githubUser.name || githubUser.login, // Atualiza nome
        email: primaryEmail, // Garante email atualizado
        githubId: githubUser.id, // Atualiza/adiciona githubId
        avatar: githubUser.avatar_url, // Atualiza avatar
        updatedAt: Date.now()
      };

      // Salva usuário atualizado
      const userIndex = existingUsers.findIndex(u => u.id === existingUser!.id);
      existingUsers[userIndex] = updatedUser;
      this.saveUsers(existingUsers);
      
      // Salva como usuário atual
      localStorage.setItem('txopito_current_user', JSON.stringify(updatedUser));
      
      console.log('✅ Usuário existente atualizado e salvo:', {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        githubId: updatedUser.githubId
      });
      
      return updatedUser;
    } else {
      console.log('🆕 Criando novo usuário...');
      
      // Cria novo usuário
      const newUser: User & { githubId: number; avatar: string } = {
        id: `user_github_${githubUser.id}_${Date.now()}`,
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        xp: 0,
        level: 1,
        preferences: {
          language: 'pt-BR',
          theme: 'light',
          notifications: true,
          highContrast: false
        },
        createdAt: Date.now(),
        githubId: githubUser.id,
        avatar: githubUser.avatar_url
      };

      // Verifica novamente se não há duplicata (race condition)
      const finalCheck = this.getStoredUsers().find(u => u.email === primaryEmail);
      if (finalCheck) {
        console.log('🔄 Usuário criado durante o processo, atualizando...');
        return this.createOrUpdateUser(githubUser, emails); // Recursão para atualizar
      }

      // Salva novo usuário
      existingUsers.push(newUser);
      this.saveUsers(existingUsers);
      
      // Salva como usuário atual
      localStorage.setItem('txopito_current_user', JSON.stringify(newUser));
      
      console.log('✅ Novo usuário criado e salvo:', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        githubId: newUser.githubId
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
      logger.error('Erro ao salvar usuários', 'GitHubAuth', { error });
    }
  }

  /**
   * Verifica se o GitHub OAuth está configurado
   */
  static isConfigured(): boolean {
    const oauthConfig = configService.getOAuthConfig().github;
    return !!(oauthConfig.clientId && 
              oauthConfig.clientId !== 'your_github_client_id');
  }

  /**
   * Obtém URL de configuração para desenvolvimento
   */
  static getSetupInstructions(): string {
    const oauthConfig = configService.getOAuthConfig().github;
    
    return `
Para configurar GitHub OAuth:

1. Vá para https://github.com/settings/applications/new
2. Configure:
   - Application name: TXOPITO IA
   - Homepage URL: ${window.location.origin}
   - Authorization callback URL: ${oauthConfig.redirectUri}
3. Adicione as variáveis de ambiente:
   - VITE_GITHUB_CLIENT_ID=seu_client_id
   - VITE_GITHUB_CLIENT_SECRET=seu_client_secret (apenas no backend)
   - VITE_GITHUB_REDIRECT_URI=${oauthConfig.redirectUri}
    `;
  }
}

export default GitHubAuthService;