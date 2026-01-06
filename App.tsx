import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import MessageBubble from './components/MessageBubble';
import InputArea from './components/InputArea';
import AuthScreen from './components/AuthScreen';
import LanguageSelector from './components/LanguageSelector';
import Icon from './components/Icon';
import { DOMAINS } from './constants';
import { DomainId, ChatSession, Message, Role, User, UserPreferences, Attachment } from './types';
import { streamResponse, generateImage } from './services/geminiService';
import { AuthService, UserService, ChatService } from './backend/api';
import { memoryService } from './backend/memoryService';
import { timeService } from './services/timeService';
import { newsService } from './services/newsService';
import { useLanguage } from './contexts/LanguageContext';

const App: React.FC = () => {
  const { t } = useLanguage();
  // State
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<DomainId>(DomainId.PROGRAMMING);
  const [isLoading, setIsLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  
  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize App (Check auth)
  useEffect(() => {
    const initApp = async () => {
      try {
        // Verifica se há usuário logado
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Inicializa memória de longo prazo se não existir
          const longTermMemory = await memoryService.getLongTermMemory(currentUser.id);
          if (!longTermMemory) {
            await memoryService.initializeLongTermMemory(currentUser.id, currentUser.name);
          }
          
          await loadUserSessions(currentUser.id);
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setAppLoading(false);
      }
    };
    initApp();
  }, []);

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
    if (!currentSessionId || !user) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
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
      const { user: updatedUser, leveledUp } = await UserService.addXP(user.id, xpAmount);
      setUser(updatedUser);
      if (leveledUp) console.log(`Level Up: ${updatedUser.level}`);
    } catch (e) { console.error(e); }

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
          O usuário se chama: ${user.name}. Nível: ${user.level}.
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
        }
      }

    } catch (error) {
      console.error("Error generating response", error);
      // Error handling logic similar to before
    } finally {
      setIsLoading(false);
    }
  };

  if (appLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const currentSession = getCurrentSession();
  const activeDomain = currentSession ? DOMAINS[currentSession.domainId] : DOMAINS[selectedDomain];

  return (
    <div className={`flex h-screen overflow-hidden font-sans text-slate-900 ${user.preferences.highContrast ? 'contrast-125' : ''} ${user.preferences.theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50'}`}>
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

      <div className="flex-1 flex flex-col h-screen relative w-full bg-white/50 min-w-0">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 p-2 md:p-4 flex items-center justify-between flex-shrink-0 z-10 shadow-sm h-12 md:h-16">
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
              <h2 className="font-bold text-slate-800 text-sm md:text-lg leading-tight truncate">{activeDomain.name}</h2>
              <p className="text-xs text-gray-500 hidden sm:block font-medium truncate">{activeDomain.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Mobile info - show Campus AI and language selector */}
            <div className="md:hidden flex items-center gap-1">
              <LanguageSelector />
              <span className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 text-xs font-bold px-2 py-1 rounded-full border border-blue-100/50">
                {t('campusAI')}
              </span>
            </div>
            {/* Desktop info */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSelector />
              <span className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100/50">
                {t('campusAI')}
              </span>
            </div>
            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="lg:hidden p-1.5 md:p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Icon name="Settings" size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-2 md:p-6 scroll-smooth bg-slate-50/50 min-h-0">
          <div className="max-w-3xl mx-auto h-full">
            {!currentSession || currentSession.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                {/* Simple ChatGPT-like interface */}
                <div className="max-w-2xl mx-auto">
                  <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 mb-8">
                    {t('whatCanIHelp')}
                  </h1>
                  
                  {/* Quick action buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                    <button 
                      onClick={() => handleSendMessage(`${t('explainBasicConcept')} ${activeDomain.name.toLowerCase()}`, null, false)} 
                      className="group p-4 bg-white border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Icon name="BookOpen" size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{t('explainConcepts')}</div>
                          <div className="text-sm text-slate-500">{t('learnAbout')} {activeDomain.name.toLowerCase()}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('createEducationalImage'), null, true)} 
                      className="group p-4 bg-white border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Icon name="Image" size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{t('createImage')}</div>
                          <div className="text-sm text-slate-500">{t('generateVisualContent')}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('helpSolvePracticalProblem'), null, false)} 
                      className="group p-4 bg-white border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Icon name="Settings" size={16} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{t('solveProblems')}</div>
                          <div className="text-sm text-slate-500">{t('getPracticalHelp')}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => handleSendMessage(t('learnSomethingNew'), null, false)} 
                      className="group p-4 bg-white border border-gray-200 rounded-xl text-left hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Icon name="Zap" size={16} className="text-orange-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{t('discoverNewThings')}</div>
                          <div className="text-sm text-slate-500">{t('exploreInterestingTopics')}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4 h-full flex flex-col">
                <div className="flex-1 space-y-6">
                  {currentSession.messages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      color={activeDomain.color}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Icon name="Bot" size={18} className={activeDomain.color} />
                      </div>
                      <div className="bg-white border border-gray-100 py-3 px-5 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                      </div>
                    </div>
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
    </div>
  );
};

export default App;