/**
 * Security Wrapper - TXOPITO IA
 * Componente que envolve a aplicação com proteções de segurança (versão corrigida)
 */

import React, { useEffect, useState, useRef } from 'react';
import { securityService } from '../services/securityService';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

interface SecurityState {
  isSecure: boolean;
  threats: string[];
  lastCheck: number;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ children }) => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isSecure: true,
    threats: [],
    lastCheck: Date.now(),
  });

  const securityCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const activityMonitor = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Salvar console original para evitar recursão
    (window as any).originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    // Inicializar proteções de segurança
    initializeSecurity();

    // Monitoramento contínuo
    startSecurityMonitoring();

    // Cleanup
    return () => {
      if (securityCheckInterval.current) {
        clearInterval(securityCheckInterval.current);
      }
      if (activityMonitor.current) {
        clearInterval(activityMonitor.current);
      }
    };
  }, []);

  const initializeSecurity = () => {
    const originalConsole = (window as any).originalConsole;
    originalConsole.log('🛡️ Inicializando proteções de segurança...');

    // Verificar integridade da aplicação
    checkApplicationIntegrity();

    // Configurar listeners de segurança
    setupSecurityListeners();

    // Verificar origem
    validateOrigin();

    // Configurar CSP (Content Security Policy)
    setupContentSecurityPolicy();

    originalConsole.log('✅ Proteções de segurança ativadas');
  };

  const checkApplicationIntegrity = () => {
    try {
      // Verificar se scripts maliciosos foram injetados
      const scripts = document.querySelectorAll('script');
      let suspiciousScripts = 0;

      scripts.forEach(script => {
        if (script.src && !isAllowedScript(script.src)) {
          const originalConsole = (window as any).originalConsole;
          originalConsole.warn('⚠️ Script suspeito detectado:', script.src);
          suspiciousScripts++;
        }
      });

      if (suspiciousScripts > 0) {
        securityService.logSuspiciousActivity('suspicious_scripts', 'high');
        setSecurityState(prev => ({
          ...prev,
          threats: [...prev.threats, 'Scripts suspeitos detectados'],
        }));
      }

      // Verificar modificações no DOM
      checkDOMIntegrity();

    } catch (error) {
      const originalConsole = (window as any).originalConsole;
      originalConsole.error('Erro na verificação de integridade:', error);
    }
  };

  const isAllowedScript = (src: string): boolean => {
    const allowedDomains = [
      'localhost',
      'txopito-ia.vercel.app',
      'txopito.com',
      'cdn.tailwindcss.com',
      'esm.sh',
    ];

    return allowedDomains.some(domain => src.includes(domain));
  };

  const checkDOMIntegrity = () => {
    // Verificar se elementos críticos foram modificados
    const criticalElements = [
      'meta[name="viewport"]',
      'title',
      '#root',
    ];

    criticalElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (!element) {
        const originalConsole = (window as any).originalConsole;
        originalConsole.warn('⚠️ Elemento crítico removido:', selector);
        securityService.logSuspiciousActivity('dom_manipulation', 'medium');
      }
    });
  };

  const setupSecurityListeners = () => {
    // Detectar tentativas de abertura de DevTools (sem logs excessivos)
    let devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          // Não logar - DevTools é normal em desenvolvimento
        }
      } else {
        devtools.open = false;
      }
    }, 2000); // Reduzir frequência para 2 segundos

    // Detectar tentativas de debug (sem logs excessivos)
    window.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')) {
        // Não logar em desenvolvimento
        if (process.env.NODE_ENV === 'production') {
          securityService.logSuspiciousActivity('debug_attempt', 'low');
        }
      }
    });

    // Detectar mudanças de foco (possível ataque) - menos frequente
    let focusLost = false;
    window.addEventListener('blur', () => {
      if (!focusLost) {
        focusLost = true;
        setTimeout(() => { focusLost = false; }, 5000);
      }
    });
  };

  const validateOrigin = () => {
    const currentOrigin = window.location.origin;
    
    if (!securityService.validateOrigin(currentOrigin)) {
      const originalConsole = (window as any).originalConsole;
      originalConsole.error('🚨 ORIGEM INVÁLIDA DETECTADA:', currentOrigin);
      securityService.logSuspiciousActivity('invalid_origin', 'high');
      
      // Bloquear aplicação
      setSecurityState(prev => ({
        ...prev,
        isSecure: false,
        threats: [...prev.threats, 'Origem não autorizada'],
      }));
    }
  };

  const setupContentSecurityPolicy = () => {
    // Verificar se CSP está configurado
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    
    if (!cspMeta) {
      const originalConsole = (window as any).originalConsole;
      originalConsole.warn('⚠️ Content Security Policy não configurado');
      
      // Adicionar CSP básico via meta tag
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com esm.sh; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
      document.head.appendChild(meta);
    }
  };

  const startSecurityMonitoring = () => {
    // Verificação periódica de segurança (a cada 60 segundos - menos frequente)
    securityCheckInterval.current = setInterval(() => {
      performSecurityCheck();
    }, 60000);

    // Monitoramento de atividade (a cada 30 segundos - menos frequente)
    activityMonitor.current = setInterval(() => {
      monitorUserActivity();
    }, 30000);
  };

  const performSecurityCheck = () => {
    try {
      // Verificar integridade novamente
      checkApplicationIntegrity();

      // Verificar rate limiting
      const clientId = getClientIdentifier();
      if (!securityService.checkRateLimit(clientId)) {
        const originalConsole = (window as any).originalConsole;
        originalConsole.warn('⚠️ Rate limit excedido');
        setSecurityState(prev => ({
          ...prev,
          threats: [...prev.threats, 'Muitas requisições'],
        }));
      }

      // Atualizar timestamp da última verificação
      setSecurityState(prev => ({
        ...prev,
        lastCheck: Date.now(),
      }));

    } catch (error) {
      const originalConsole = (window as any).originalConsole;
      originalConsole.error('Erro na verificação de segurança:', error);
    }
  };

  const monitorUserActivity = () => {
    // Detectar comportamento anômalo
    const now = Date.now();
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (lastActivity) {
      const timeDiff = now - parseInt(lastActivity);
      
      // Se usuário ficou inativo por muito tempo, verificar sessão
      if (timeDiff > 30 * 60 * 1000) { // 30 minutos
        validateUserSession();
      }
    }
    
    localStorage.setItem('lastActivity', now.toString());
  };

  const validateUserSession = () => {
    const currentUser = localStorage.getItem('txopito_current_user');
    
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        const validation = securityService.validateSession(userData);
        
        if (!validation.isValid) {
          const originalConsole = (window as any).originalConsole;
          originalConsole.warn('⚠️ Sessão inválida detectada:', validation.error);
          securityService.logSuspiciousActivity('invalid_session', 'medium');
          
          // Limpar sessão inválida
          localStorage.removeItem('txopito_current_user');
          window.location.reload();
        }
      } catch (error) {
        const originalConsole = (window as any).originalConsole;
        originalConsole.error('Erro na validação de sessão:', error);
        securityService.logSuspiciousActivity('session_validation_error', 'medium');
      }
    }
  };

  const getClientIdentifier = (): string => {
    return `${navigator.userAgent}_${window.location.hostname}`.substring(0, 100);
  };

  // Renderizar tela de bloqueio se não estiver seguro
  if (!securityState.isSecure) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">🛡️</span>
          </div>
          
          <h1 className="text-2xl font-bold text-red-900 mb-4">
            Acesso Bloqueado
          </h1>
          
          <p className="text-red-700 mb-6">
            Atividade suspeita detectada. Por segurança, o acesso foi temporariamente bloqueado.
          </p>
          
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-red-900 mb-2">Ameaças Detectadas:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {securityState.threats.map((threat, index) => (
                <li key={index}>• {threat}</li>
              ))}
            </ul>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Tentar Novamente
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            Se o problema persistir, entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  // Renderizar aplicação normal com proteções ativas
  return (
    <div className="security-wrapper">
      {children}
    </div>
  );
};

export default SecurityWrapper;