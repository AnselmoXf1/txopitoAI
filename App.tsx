import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import InputArea from './components/InputArea';
import AuthScreen from './components/AuthScreen';
import GitHubCallback from './components/GitHubCallback';
import GoogleCallback from './components/GoogleCallback';
import LanguageSelector from './components/LanguageSelector';
import AdminDashboard from './components/admin/AdminDashboard';
import OnboardingModal from './components/OnboardingModal';
import SecurityWrapper from './components/SecurityWrapper';
import Icon from './components/Icon';
import { DOMAINS } from './constants';
import { DomainId, ChatSession, Message, Role, User, UserPreferences, Attachment, OnboardingData } from './types';
import { streamResponse, generateImage } from './services/geminiService';
import { AuthService, UserService, ChatService } from './services/browserApi';
import { memoryService } from './backend/memoryService';
import { timeService } from './services/timeService';
import { newsService } from './services/newsService';
import { OnboardingService } from './services/onboardingService';
import { securityService } from './services/securityService';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const { t } = useLanguage();
  
  // Verifica se é callback do GitHub ou Google
  const isGitHubCallback = window.location.pathname === '/auth/github/callback';
  const isGoogleCallback = window.location.pathname === '/auth/google/callback';
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainId>(DomainId.PROGRAMMING);
  const [isLoading, setIsLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize App (Check auth)
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('🚀 Inicializando app - verificando usuário logado...');
        
        // Verifica se há usuário logado
        const currentUser = await AuthService.getCurrentUser();
        console.log('👤 Usuário encontrado:', currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email
        } : 'Nenhum usuário logado');
        
        if (currentUser) {
          setUser(currentUser);
          
          // Verifica se deve mostrar onboarding
          console.log('🎯 Verificando necessidade de onboarding...');
          if (OnboardingService.shouldShowOnboarding(currentUser)) {
            console.log('✅ Onboarding será exibido');
            setShowOnboarding(true);
          } else {
            console.log('❌ Onboarding não será exibido');
          }
          
          // Inicializa memória de longo prazo se não existir
          try {
            const longTermMemory = await memoryService.getLongTermMemory(currentUser.id);
            if (!longTermMemory) {
              await memoryService.initializeLongTermMemory(currentUser.id, currentUser.name);
            }
          } catch (memError) {
            console.warn('⚠️ Erro ao inicializar memória (não crítico):', memError);
          }
          
          await loadUserSessions(currentUser.id);
        }
      } catch (err) {
        console.error("❌ Falha ao restaurar sessão:", err);
        
        // Tenta recuperar usuário do localStorage como fallback
        try {
          const fallbackUser = localStorage.getItem('txopito_current_user');
          if (fallbackUser) {
            const parsedUser = JSON.parse(fallbackUser);
            console.log('🔄 Recuperando usuário do localStorage:', parsedUser.name);
            setUser(parsedUser);
            await loadUserSessions(parsedUser.id);
          }
        } catch (fallbackError) {
          console.error('❌ Falha no fallback do usuário:', fallbackError);
        }
      } finally {
        setAppLoading(false);
      }
    };
    initApp();
  }, []);

  // Sistema de autenticação admin secreto
  useEffect(() => {
    // Função para autenticação admin via console
    const adminAuth = (username: string, password: string) => {
      // Credenciais hardcoded para segurança (em produção, usar hash)
      const validCredentials = {
        'txopito_admin': 'Tx0p1t0@2026!',
        'root_admin': 'R00t#Adm1n$',
        'super_admin': 'Sup3r@Adm1n!'
      };

      if (validCredentials[username as keyof typeof validCredentials] === password) {
        setIsAdminAuthenticated(true);
        console.log('%c🛡️ ACESSO ADMINISTRATIVO CONCEDIDO', 'color: #10b981; font-weight: bold; font-size: 14px;');
        console.log('%cUse txopito.openAdmin() para abrir o dashboard', 'color: #3b82f6; font-size: 12px;');
        return true;
      } else {
        console.log('%c❌ CREDENCIAIS INVÁLIDAS', 'color: #ef4444; font-weight: bold;');
        return false;
      }
    };

    // Função para abrir dashboard (só funciona se autenticado)
    const openAdmin = () => {
      if (isAdminAuthenticated) {
        setShowAdminDashboard(true);
        console.log('%c📊 Dashboard administrativo aberto', 'color: #8b5cf6; font-weight: bold;');
      } else {
        console.log('%c🔒 Acesso negado. Use txopito.auth("username", "password") primeiro', 'color: #ef4444; font-weight: bold;');
      }
    };

    // Função para logout admin
    const adminLogout = () => {
      setIsAdminAuthenticated(false);
      setShowAdminDashboard(false);
      console.log('%c🚪 Sessão administrativa encerrada', 'color: #f59e0b; font-weight: bold;');
    };

    // Função de ajuda
    const showHelp = () => {
      console.log('%c🔧 TXOPITO IA - COMANDOS ADMINISTRATIVOS', 'color: #1f2937; font-weight: bold; font-size: 16px; background: #f3f4f6; padding: 8px;');
      console.log('%c┌─────────────────────────────────────────────────────────┐', 'color: #6b7280;');
      console.log('%c│  ADMIN:                                                 │', 'color: #6b7280;');
      console.log('%c│  txopito.auth("username", "password")  - Fazer login    │', 'color: #6b7280;');
      console.log('%c│  txopito.openAdmin()                   - Abrir dashboard│', 'color: #6b7280;');
      console.log('%c│  txopito.logout()                      - Fazer logout   │', 'color: #6b7280;');
      console.log('%c│                                                         │', 'color: #6b7280;');
      console.log('%c│  ONBOARDING:                                            │', 'color: #6b7280;');
      console.log('%c│  txopito.forceOnboarding()             - Forçar modal   │', 'color: #6b7280;');
      console.log('%c│  txopito.checkOnboarding()             - Verificar status│', 'color: #6b7280;');
      console.log('%c│  txopito.resetOnboarding()             - Resetar dados  │', 'color: #6b7280;');
      console.log('%c│  txopito.debugOnboarding()             - Debug avançado │', 'color: #6b7280;');
      console.log('%c│                                                         │', 'color: #6b7280;');
      console.log('%c│  txopito.help()                        - Mostrar ajuda  │', 'color: #6b7280;');
      console.log('%c└─────────────────────────────────────────────────────────┘', 'color: #6b7280;');
      console.log('%c💡 Credenciais disponíveis: txopito_admin, root_admin, super_admin', 'color: #3b82f6; font-style: italic;');
    };

    // Expõe as funções no objeto global window
    (window as any).txopito = {
      auth: adminAuth,
      openAdmin: openAdmin,
      logout: adminLogout,
      help: showHelp,
      version: '1.0.0',
      // Funções de debug para onboarding
      forceOnboarding: () => {
        if (user) {
          console.log('🔧 Forçando exibição do onboarding...');
          setShowOnboarding(true);
        } else {
          console.log('❌ Nenhum usuário logado');
        }
      },
      checkOnboarding: () => {
        if (user) {
          const shouldShow = OnboardingService.shouldShowOnboarding(user);
          console.log('🔍 Status detalhado do onboarding:', {
            userId: user.id,
            name: user.name,
            email: user.email,
            createdAt: new Date(user.createdAt).toLocaleString(),
            hoursAgo: Math.round((Date.now() - user.createdAt) / (1000 * 60 * 60)),
            hasCompleted: user.hasCompletedOnboarding,
            hasData: !!user.onboarding,
            isNewUser: (Date.now() - user.createdAt) < (24 * 60 * 60 * 1000),
            shouldShow: shouldShow,
            currentOnboardingState: showOnboarding
          });
          return shouldShow;
        } else {
          console.log('❌ Nenhum usuário logado');
          return false;
        }
      },
      resetOnboarding: () => {
        if (user) {
          console.log('🔄 Resetando onboarding do usuário...');
          const updatedUser = {
            ...user,
            hasCompletedOnboarding: false,
            onboarding: undefined
          };
          setUser(updatedUser);
          localStorage.setItem('txopito_current_user', JSON.stringify(updatedUser));
          
          // Atualiza também na lista de usuários
          const users = JSON.parse(localStorage.getItem('txopito_users') || '[]');
          const updatedUsers = users.map((u: User) => 
            u.id === user.id ? updatedUser : u
          );
          localStorage.setItem('txopito_users', JSON.stringify(updatedUsers));
          
          console.log('✅ Onboarding resetado. Use txopito.forceOnboarding() para exibir.');
        } else {
          console.log('❌ Nenhum usuário logado');
        }
      },
      // Nova função de debug avançado
      debugOnboarding: () => {
        if (user) {
          console.log('%c🔍 DEBUG AVANÇADO - ONBOARDING', 'color: #1f2937; font-weight: bold; font-size: 16px; background: #f3f4f6; padding: 8px;');
          
          const now = Date.now();
          const userAge = now - user.createdAt;
          const hoursAgo = Math.round(userAge / (1000 * 60 * 60));
          const isNewUser = userAge < (24 * 60 * 60 * 1000);
          
          console.log('📊 Dados do usuário:');
          console.table({
            'ID': user.id,
            'Nome': user.name,
            'Email': user.email,
            'Criado em': new Date(user.createdAt).toLocaleString(),
            'Horas atrás': hoursAgo,
            'É novo (< 24h)': isNewUser,
            'Onboarding completo': user.hasCompletedOnboarding || false,
            'Tem dados onboarding': !!user.onboarding,
            'Estado modal': showOnboarding
          });
          
          console.log('🧮 Cálculos:');
          console.log(`  Timestamp atual: ${now}`);
          console.log(`  Timestamp criação: ${user.createdAt}`);
          console.log(`  Diferença (ms): ${userAge}`);
          console.log(`  Diferença (horas): ${hoursAgo}`);
          console.log(`  Limite 24h (ms): ${24 * 60 * 60 * 1000}`);
          console.log(`  É usuário novo: ${isNewUser}`);
          
          const shouldShow = OnboardingService.shouldShowOnboarding(user);
          console.log(`🎯 Resultado final: ${shouldShow ? 'DEVE MOSTRAR' : 'NÃO DEVE MOSTRAR'} onboarding`);
          
          if (!shouldShow) {
            console.log('❓ Motivos para não mostrar:');
            if (user.hasCompletedOnboarding) console.log('  - Onboarding já foi completado');
            if (user.onboarding) console.log('  - Usuário já tem dados de onboarding');
            if (!isNewUser) console.log('  - Usuário não é novo (> 24h)');
          }
          
          return {
            user,
            shouldShow,
            isNewUser,
            hoursAgo,
            currentState: showOnboarding
          };
        } else {
          console.log('❌ Nenhum usuário logado para debug');
          return null;
        }
      }
    };

    // Mensagem inicial no console (apenas uma vez)
    if (!(window as any).txopitoInitialized) {
      console.log('%c🚀 TXOPITO IA', 'color: #1f2937; font-weight: bold; font-size: 20px;');
      console.log('%c⚡ Sistema carregado com sucesso', 'color: #10b981; font-weight: bold;');
      console.log('%c🔒 Para acesso administrativo, digite: txopito.help()', 'color: #6b7280; font-style: italic;');
      (window as any).txopitoInitialized = true;
    }

    // Cleanup function
    return () => {
      // Remove as funções quando o componente for desmontado
      if ((window as any).txopito) {
        delete (window as any).txopito;
      }
    };
  }, [isAdminAuthenticated]);

  // Auto-logout admin após 30 minutos de inatividade
  useEffect(() => {
    if (isAdminAuthenticated) {
      const timeout = setTimeout(() => {
        setIsAdminAuthenticated(false);
        setShowAdminDashboard(false);
        console.log('%c⏰ Sessão administrativa expirou por inatividade', 'color: #f59e0b; font-weight: bold;');
      }, 30 * 60 * 1000); // 30 minutos

      return () => clearTimeout(timeout);
    }
  }, [isAdminAuthenticated]);

  // Verificação adicional para recuperar usuário perdido
  useEffect(() => {
    const checkUserRecovery = async () => {
      if (!user && !appLoading) {
        console.log("Usuário perdido detectado, tentando recuperar...");
        try {
          const recoveredUser = await AuthService.getCurrentUser();
          if (recoveredUser) {
            console.log("Usuário recuperado com sucesso:", recoveredUser.name);
            setUser(recoveredUser);
          }
        } catch (err) {
          console.error("Falha na recuperação do usuário:", err);
        }
      }
    };
    
    // Verifica a cada 1 segundo se o usuário foi perdido
    const interval = setInterval(checkUserRecovery, 1000);
    
    return () => clearInterval(interval);
  }, [user, appLoading]);

  // Debug: Log do estado do usuário
  useEffect(() => {
    console.log('Estado do usuário mudou:', user ? `${user.name} (${user.id})` : 'null');
  }, [user]);

  // Save sessions to backend whenever they change
  useEffect(() => {
    if (currentSessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        ChatService.saveSession(session).catch(console.error);
      }
    }
  }, [sessions, currentSessionId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, currentSessionId, isLoading]);

  const loadUserSessions = async (userId: string) => {
    const loadedSessions = await ChatService.getSessions(userId);
    setSessions(loadedSessions);
    if (loadedSessions.length > 0) {
      setCurrentSessionId(loadedSessions[0].id);
      setSelectedDomain(loadedSessions[0].domainId);
    } else {
      createNewSession(DomainId.PROGRAMMING, userId);
    }
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    await loadUserSessions(loggedInUser.id);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  const createNewSession = (domainId: DomainId, userId: string = user?.id || '') => {
    if (!userId) return;
    
    const domain = DOMAINS[domainId];
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `${domain.name} - Novo Chat`,
      domainId: domainId,
      messages: [], // Start with empty messages for clean interface
      createdAt: Date.now(),
      userId: userId
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setSelectedDomain(domainId);
    ChatService.saveSession(newSession);
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  const handleDomainSwitch = (domainId: DomainId) => {
    setSelectedDomain(domainId);
    const current = getCurrentSession();
    
    if (current && current.messages.length === 0) {
      // If current chat is empty, just switch its domain
      const updatedSession = { ...current, domainId };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? updatedSession : s));
      ChatService.saveSession(updatedSession);
    } else {
      if (user) createNewSession(domainId, user.id);
    }
  };

  const handleClearChat = async () => {
    if (currentSessionId) {
      if (confirm('Tem certeza que deseja apagar todas as mensagens desta conversa?')) {
        await ChatService.clearHistory(currentSessionId);
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId ? { ...s, messages: [] } : s
        ));
      }
    }
  };

  const handleUpdatePreferences = async (prefs: Partial<UserPreferences>) => {
    if (!user) return;
    try {
      const updatedUser = await UserService.updatePreferences(user.id, prefs);
      setUser(updatedUser);
    } catch (e) {
      console.error("Failed to update preferences", e);
    }
  };

  const handleExportChat = () => {
    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const content = currentSession.messages
      .map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role === Role.USER ? user?.name : 'TXOPITO'}: ${m.text} ${m.generatedImage ? '[Imagem Gerada]' : ''}`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `txopito-chat-${currentSession.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- MAIN SEND LOGIC ---
  const handleSendMessage = async (text: string, attachment: Attachment | null, isImageGeneration: boolean) => {
    if (!currentSessionId || !user) {
      console.error('Usuário ou sessão não encontrados');
      return;
    }

    // Validação de segurança da mensagem
    const validation = securityService.validateAndSanitizeInput(text, 5000);
    if (!validation.isValid) {
      console.error('❌ Mensagem rejeitada por segurança:', validation.error);
      alert('Mensagem contém conteúdo não permitido. Tente novamente.');
      return;
    }

    // Rate limiting
    const clientId = `${user.id}_${Date.now()}`;
    if (!securityService.checkRateLimit(clientId, 30, 60000)) { // 30 mensagens por minuto
      console.warn('⚠️ Rate limit excedido');
      alert('Muitas mensagens enviadas. Aguarde um momento.');
      return;
    }

    const sanitizedMessage = validation.sanitized;

    const currentSession = getCurrentSession();
    if (!currentSession) {
      console.error('Sessão atual não encontrada');
      return;
    }

    // Backup do usuário para recuperação em caso de erro
    const userBackup = { ...user };

    try {
      // 1. Add User Message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: Role.USER,
        text: sanitizedMessage,
        attachment: attachment || undefined,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: [...s.messages, userMessage],
              title: s.messages.length === 0 ? text.slice(0, 30) + '...' : s.title 
            } 
          : s
      ));

      // 2. Analisa mensagem para memória contextual
      try {
        await memoryService.analyzeAndStoreMessage(user.id, text, currentSession.domainId);
      } catch (e) {
        console.error('Erro na análise de memória:', e);
      }

      // 3. Award XP
      try {
        const xpAmount = 10 + Math.floor(text.length / 5) + (attachment ? 20 : 0);
        const result = await UserService.addXP(user.id, xpAmount);
        setUser(result.user);
        if (result.leveledUp) console.log(`Level Up: ${result.user?.level || 1}`);
      } catch (e) { 
        console.error('Erro ao adicionar XP:', e);
        // Não deixa o erro quebrar o fluxo - continua sem atualizar XP
      }
    } catch (e) { 
      console.error('Erro ao adicionar XP:', e);
      // Não deixa o erro quebrar o fluxo - continua sem atualizar XP
    }

    setIsLoading(true);

    try {
      const domainConfig = DOMAINS[currentSession.domainId];
      const aiMessageId = (Date.now() + 1).toString();

      // Placeholder message for AI
      setSessions(prev => prev.map(s => {
         if (s.id !== currentSessionId) return s;
         return {
           ...s,
           messages: [...s.messages, {
             id: aiMessageId,
             role: Role.MODEL,
             text: '', // Will stream or fill later
             timestamp: Date.now()
           }]
         };
      }));

      if (isImageGeneration) {
        // --- IMAGE GENERATION MODE ---
        try {
          const base64Image = await generateImage(text, currentSession.domainId);
          
          setSessions(prev => prev.map(s => {
            if (s.id !== currentSessionId) return s;
            const updatedMessages = s.messages.map(m => 
              m.id === aiMessageId ? { 
                ...m, 
                text: `Aqui está a imagem que criei baseada em: "${text}"`,
                generatedImage: base64Image 
              } : m
            );
            return { ...s, messages: updatedMessages };
          }));
        } catch (err: any) {
          setSessions(prev => prev.map(s => {
            if (s.id !== currentSessionId) return s;
            const updatedMessages = s.messages.map(m => 
              m.id === aiMessageId ? { 
                ...m, 
                text: err.message || "Desculpe, não consegui gerar a imagem neste momento. Tente novamente." 
              } : m
            );
            return { ...s, messages: updatedMessages };
          }));
        }

      } else {
        // --- TEXT/MULTIMODAL CHAT MODE ---
        
        // Gera contexto personalizado da memória
        let contextualPrompt = '';
        try {
          contextualPrompt = await memoryService.generateContextualPrompt(user.id, currentSession.domainId);
        } catch (e) {
          console.error('Erro ao gerar contexto:', e);
        }
        
        // Adiciona contexto temporal e de conhecimento atualizado
        let temporalContext = '';
        let knowledgeContext = '';
        try {
          const timeInfo = await timeService.getContextualTimeInfo();
          temporalContext = `\nContexto Temporal: ${timeInfo}`;
          
          const currentKnowledge = await newsService.getContextualKnowledge(currentSession.domainId);
          if (currentKnowledge) {
            knowledgeContext = `\n${currentKnowledge}`;
          }
        } catch (e) {
          console.error('Erro ao obter contexto temporal/conhecimento:', e);
        }
        
        const personalizedPrompt = `
          ${domainConfig.systemPrompt}
          ${contextualPrompt}
          ${temporalContext}
          ${knowledgeContext}
          O usuário se chama: ${user?.name || 'Usuário'}. Nível: ${user?.level || 1}.
          ${attachment ? 'O usuário enviou uma imagem. Analise-a detalhadamente e responda no contexto da área.' : ''}
        `;

        try {
          await streamResponse(
            personalizedPrompt,
            currentSession.messages, // Pass full history (includes attachments now)
            text,
            attachment,
            (chunkedText) => {
              setSessions(prev => prev.map(s => {
                if (s.id !== currentSessionId) return s;
                const updatedMessages = s.messages.map(m => 
                  m.id === aiMessageId ? { ...m, text: chunkedText } : m
                );
                return { ...s, messages: updatedMessages };
              }));
            },
            currentSession.domainId // Passa o domainId para fallback
          );

        } catch (err: any) {
          // Se chegou aqui, o fallback já foi usado ou houve erro crítico
          console.error("Erro crítico no chat:", err);
          
          // Adiciona mensagem de erro para o usuário
          setSessions(prev => prev.map(s => {
            if (s.id !== currentSessionId) return s;
            const updatedMessages = s.messages.map(m => 
              m.id === aiMessageId ? { 
                ...m, 
                text: "Desculpe, ocorreu um erro inesperado. Tente novamente em alguns instantes." 
              } : m
            );
            return { ...s, messages: updatedMessages };
          }));
        }
      }

    } catch (error) {
      console.error("Erro geral no envio da mensagem:", error);
      
      // Recupera o usuário do backup se foi perdido
      if (!user && userBackup) {
        console.log("Recuperando usuário do backup...");
        setUser(userBackup);
      }
      
      // Remove mensagem de loading se houver erro
      setSessions(prev => prev.map(s => {
        if (s.id !== currentSessionId) return s;
        return {
          ...s,
          messages: s.messages.filter(m => m.text !== '' || m.generatedImage) // Remove mensagens vazias
        };
      }));
      
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers para GitHub OAuth
  const handleGitHubSuccess = (githubUser: User) => {
    console.log('✅ GitHub OAuth Success - Recebido:', {
      id: githubUser.id,
      name: githubUser.name,
      email: githubUser.email
    });
    
    // Salva usuário no localStorage
    localStorage.setItem('txopito_current_user', JSON.stringify(githubUser));
    console.log('💾 Usuário GitHub salvo no localStorage');
    
    setUser(githubUser);
    console.log('👤 Usuário GitHub definido no estado');
    
    // Verifica se deve mostrar onboarding para usuários novos do GitHub
    console.log('🎯 Verificando onboarding para usuário GitHub...');
    console.log('📊 Dados do usuário GitHub para onboarding:', {
      id: githubUser.id,
      name: githubUser.name,
      email: githubUser.email,
      createdAt: githubUser.createdAt,
      hasCompletedOnboarding: githubUser.hasCompletedOnboarding,
      hasOnboardingData: !!githubUser.onboarding,
      hoursAgo: Math.round((Date.now() - githubUser.createdAt) / (1000 * 60 * 60))
    });
    
    const shouldShow = OnboardingService.shouldShowOnboarding(githubUser);
    console.log(`🎯 Resultado da verificação GitHub: ${shouldShow ? 'MOSTRAR' : 'NÃO MOSTRAR'} onboarding`);
    
    if (shouldShow) {
      console.log('✅ Onboarding será exibido para usuário GitHub');
      // Aguarda um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        console.log('🚀 Exibindo onboarding GitHub após delay...');
        setShowOnboarding(true);
      }, 100);
    } else {
      console.log('❌ Onboarding NÃO será exibido - usuário GitHub não atende aos critérios');
    }
    
    // Limpa a URL removendo os parâmetros OAuth
    window.history.replaceState({}, document.title, window.location.pathname);
    console.log('🧹 Autenticação GitHub concluída com sucesso');
  };

  const handleGitHubError = (error: string) => {
    console.error('Erro GitHub OAuth:', error);
    // Redireciona de volta para a tela de login
    window.history.replaceState({}, document.title, '/');
    // Força reload para mostrar tela de login
    window.location.reload();
  };

  // Handlers para Google OAuth
  const handleGoogleSuccess = async (googleUser: User) => {
    console.log('✅ Google OAuth Success - Recebido:', {
      id: googleUser.id,
      name: googleUser.name,
      email: googleUser.email
    });
    
    try {
      // 1. Salva usuário no localStorage
      localStorage.setItem('txopito_current_user', JSON.stringify(googleUser));
      console.log('💾 Usuário salvo no localStorage');
      
      // 2. Define o usuário no estado
      setUser(googleUser);
      console.log('👤 Usuário definido no estado');
      
      // 3. Verifica se deve mostrar onboarding (para usuários novos do OAuth)
      console.log('🎯 Verificando onboarding para usuário OAuth...');
      console.log('📊 Dados do usuário para onboarding:', {
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        createdAt: googleUser.createdAt,
        hasCompletedOnboarding: googleUser.hasCompletedOnboarding,
        hasOnboardingData: !!googleUser.onboarding,
        hoursAgo: Math.round((Date.now() - googleUser.createdAt) / (1000 * 60 * 60))
      });
      
      const shouldShow = OnboardingService.shouldShowOnboarding(googleUser);
      console.log(`🎯 Resultado da verificação: ${shouldShow ? 'MOSTRAR' : 'NÃO MOSTRAR'} onboarding`);
      
      if (shouldShow) {
        console.log('✅ Onboarding será exibido para usuário OAuth');
        // Aguarda um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          console.log('🚀 Exibindo onboarding após delay...');
          setShowOnboarding(true);
        }, 100);
      } else {
        console.log('❌ Onboarding NÃO será exibido - usuário não atende aos critérios');
      }
      
      // 4. Carrega sessões do usuário
      await loadUserSessions(googleUser.id);
      console.log('📋 Sessões carregadas');
      
      // 5. Limpa a URL
      window.history.replaceState({}, document.title, '/');
      console.log('🧹 Autenticação Google concluída com sucesso');
      
    } catch (error) {
      console.error('❌ Erro no handleGoogleSuccess:', error);
      // Fallback: salva usuário e força reload
      localStorage.setItem('txopito_current_user', JSON.stringify(googleUser));
      window.location.href = '/';
    }
  };

  const handleGoogleError = (error: string) => {
    console.error('❌ Erro Google OAuth:', error);
    // Limpa qualquer estado de usuário
    setUser(null);
    localStorage.removeItem('txopito_current_user');
    
    // Redireciona de volta para a tela de login
    window.history.replaceState({}, document.title, '/');
    
    // Força reload para mostrar tela de login
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Handlers para Onboarding
  const handleOnboardingComplete = async (onboardingData: OnboardingData) => {
    if (!user) return;
    
    try {
      await OnboardingService.saveOnboardingData(user.id, onboardingData);
      
      // Atualiza o usuário local
      const updatedUser = {
        ...user,
        onboarding: onboardingData,
        hasCompletedOnboarding: true
      };
      setUser(updatedUser);
      setShowOnboarding(false);
      
      console.log('✅ Onboarding concluído:', {
        userId: user.id,
        discoverySource: onboardingData.discoverySource,
        primaryGoal: onboardingData.primaryGoal
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar onboarding:', error);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    console.log('⏭️ Onboarding pulado pelo usuário');
  };

  if (appLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Renderiza callback do GitHub se necessário
  if (isGitHubCallback) {
    return (
      <GitHubCallback 
        onSuccess={handleGitHubSuccess}
        onError={handleGitHubError}
      />
    );
  }

  // Renderiza callback do Google se necessário
  if (isGoogleCallback) {
    return (
      <GoogleCallback 
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const currentSession = getCurrentSession();
  const activeDomain = currentSession ? DOMAINS[currentSession.domainId] : DOMAINS[selectedDomain];

  return (
    <SecurityWrapper>
      <div className={`flex h-screen overflow-hidden font-sans ${user?.preferences?.highContrast ? 'contrast-125' : ''} bg-gray-900 text-white`}>
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedDomain={activeDomain.id}
        onSelectDomain={handleDomainSwitch}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={() => createNewSession(activeDomain.id, user.id)}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col h-screen relative w-full bg-white min-w-0">
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 p-2 md:p-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm h-12 md:h-16">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <Icon name="Menu" size={18} />
            </button>
            <div className={`p-1.5 md:p-2 rounded-xl shadow-sm ${activeDomain.bgColor} flex-shrink-0`}>
              <Icon name={activeDomain.icon} className={activeDomain.color} size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-800 text-sm md:text-lg leading-tight truncate">{activeDomain.name}</h2>
              <p className="text-xs text-gray-500 hidden sm:block font-medium truncate">{activeDomain.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Mobile info - show Campus AI and language selector */}
            <div className="md:hidden flex items-center gap-1">
              <LanguageSelector />
              <span className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 text-xs font-bold px-2 py-1 rounded-full border border-blue-200/50">
                {t('campusAI')}
              </span>
            </div>
            {/* Desktop info */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSelector />
              <span className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200/50">
                {t('campusAI')}
              </span>
            </div>
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="p-1.5 md:p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Configurações"
            >
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 scroll-smooth bg-white min-h-0">
          <div className="max-w-3xl mx-auto h-full">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                {/* Simple ChatGPT-like interface */}
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-3xl md:text-4xl font-semibold text-black mb-8">
                    {t('whatCanIHelp')}
                  </h1>
                  
                  {/* Quick action buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <button 
                      onClick={() => handleSendMessage(`${t('explainBasicConcept')} ${activeDomain.name.toLowerCase()}`, null, false)} 
                      className="group p-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon name="BookOpen" size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-black">{t('explainConcepts')}</div>
                          <div className="text-sm text-gray-600">{t('learnAbout')} {activeDomain.name.toLowerCase()}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('createEducationalImage'), null, true)} 
                      className="group p-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Icon name="Image" size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-black">{t('createImage')}</div>
                          <div className="text-sm text-gray-600">{t('generateVisualContent')}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('helpSolvePracticalProblem'), null, false)} 
                      className="group p-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Icon name="Settings" size={16} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-black">{t('solveProblems')}</div>
                          <div className="text-sm text-gray-600">{t('getPracticalHelp')}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('learnSomethingNew'), null, false)} 
                      className="group p-4 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Icon name="Zap" size={16} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-black">{t('discoverNewThings')}</div>
                          <div className="text-sm text-gray-600">{t('exploreInterestingTopics')}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4 h-full flex flex-col">
                <div className="flex-1 space-y-6">
                  {currentSession.messages.map((msg, index) => {
                    // Identifica se é a última mensagem da IA
                    const isLatestAIMessage = msg.role === Role.ASSISTANT && 
                      index === currentSession.messages.length - 1;
                    
                    return (
                      <MessageBubble 
                        key={msg.id} 
                        message={msg} 
                        color={activeDomain.color}
                        isLatest={isLatestAIMessage}
                      />
                    );
                  })}
                  {isLoading && (
                    <TypingIndicator color={activeDomain.color} />
                  )}
                </div>
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <InputArea 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            placeholder={`${t('askAbout')} ${activeDomain.name}...`}
          />
        </div>
      </div>

      <RightSidebar 
        isOpen={isRightSidebarOpen}
        onClose={() => setIsRightSidebarOpen(false)}
        user={user}
        activeDomain={activeDomain}
        currentSession={currentSession}
        onClearChat={handleClearChat}
        onExportChat={handleExportChat}
        onUpdatePreferences={handleUpdatePreferences}
      />
      
      {/* Admin Dashboard Modal */}
      {showAdminDashboard && isAdminAuthenticated && user && (
        <AdminDashboard
          currentUser={user}
          onClose={() => setShowAdminDashboard(false)}
        />
      )}
      
      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
    </SecurityWrapper>
  );
};

export default App;