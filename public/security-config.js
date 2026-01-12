/**
 * Configuração de Segurança - TXOPITO IA
 * Script para configurar proteções avançadas
 */

// Configuração de Content Security Policy
const setupCSP = () => {
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' cdn.tailwindcss.com unpkg.com",
    "style-src 'self' 'unsafe-inline' cdn.tailwindcss.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:3001 https://api.gemini.com https://accounts.google.com https://github.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Adicionar meta tag CSP se não existir
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = cspDirectives;
    document.head.appendChild(meta);
    console.log('🛡️ Content Security Policy configurado');
  }
};

// Proteção contra clickjacking
const setupFrameProtection = () => {
  // X-Frame-Options via meta tag
  const frameOptions = document.createElement('meta');
  frameOptions.httpEquiv = 'X-Frame-Options';
  frameOptions.content = 'DENY';
  document.head.appendChild(frameOptions);

  // Verificar se está sendo executado em iframe
  if (window.top !== window.self) {
    console.error('🚨 TENTATIVA DE CLICKJACKING DETECTADA');
    document.body.innerHTML = '<h1 style="color: red; text-align: center; margin-top: 50px;">Acesso negado por segurança</h1>';
    throw new Error('Clickjacking attempt blocked');
  }
};

// Proteção contra XSS
const setupXSSProtection = () => {
  // X-XSS-Protection
  const xssProtection = document.createElement('meta');
  xssProtection.httpEquiv = 'X-XSS-Protection';
  xssProtection.content = '1; mode=block';
  document.head.appendChild(xssProtection);

  // X-Content-Type-Options
  const contentType = document.createElement('meta');
  contentType.httpEquiv = 'X-Content-Type-Options';
  contentType.content = 'nosniff';
  document.head.appendChild(contentType);
};

// Proteção de referrer
const setupReferrerPolicy = () => {
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrer);
};

// Monitoramento de integridade
const setupIntegrityMonitoring = () => {
  // Verificar modificações no DOM crítico
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            
            // Verificar scripts suspeitos
            if (element.tagName === 'SCRIPT') {
              if (!isAllowedScript(element.src || element.textContent)) {
                console.error('🚨 Script suspeito bloqueado:', element);
                element.remove();
              }
            }
            
            // Verificar iframes suspeitos
            if (element.tagName === 'IFRAME') {
              console.warn('⚠️ Iframe detectado:', element.src);
              element.remove();
            }
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('🔍 Monitoramento de integridade ativo');
};

// Verificar se script é permitido
const isAllowedScript = (src) => {
  if (!src) return false;
  
  const allowedDomains = [
    'localhost',
    'txopito-ia.vercel.app',
    'txopito.com',
    'cdn.tailwindcss.com',
    'unpkg.com'
  ];

  return allowedDomains.some(domain => src.includes(domain));
};

// Proteção contra console injection (CORRIGIDO - sem recursão)
const protectConsole = () => {
  // Salvar console original
  window.originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };

  // Bloquear eval apenas se não estiver em desenvolvimento
  if (location.hostname !== 'localhost') {
    window.eval = () => {
      throw new Error('eval() bloqueado por segurança');
    };
  }

  // Bloquear Function constructor apenas se não estiver em desenvolvimento
  if (location.hostname !== 'localhost') {
    const OriginalFunction = window.Function;
    window.Function = () => {
      throw new Error('Function constructor bloqueado por segurança');
    };
    
    // Manter referência para uso interno
    window.OriginalFunction = OriginalFunction;
  }
};

// Configuração de HTTPS
const enforceHTTPS = () => {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    console.warn('⚠️ Redirecionando para HTTPS...');
    location.replace(`https:${location.href.substring(location.protocol.length)}`);
  }
};

// Limpeza de dados sensíveis
const setupDataCleaning = () => {
  // Limpar dados ao fechar aba
  window.addEventListener('beforeunload', () => {
    // Limpar dados temporários
    sessionStorage.removeItem('temp_data');
    
    // Limpar logs de debug
    if (console.clear) {
      console.clear();
    }
  });

  // Limpar dados periodicamente
  setInterval(() => {
    // Limpar cache antigo
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('temp_') || key.startsWith('cache_')) {
        const item = localStorage.getItem(key);
        try {
          const data = JSON.parse(item);
          if (data.expires && Date.now() > data.expires) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Item inválido, remover
          localStorage.removeItem(key);
        }
      }
    });
  }, 5 * 60 * 1000); // A cada 5 minutos
};

// Configuração de rate limiting no frontend
const setupClientRateLimit = () => {
  const requests = new Map();
  const MAX_REQUESTS = 100;
  const WINDOW_MS = 60000; // 1 minuto

  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const url = args[0];
    const now = Date.now();
    
    if (!requests.has(url)) {
      requests.set(url, []);
    }
    
    const urlRequests = requests.get(url);
    const validRequests = urlRequests.filter(time => now - time < WINDOW_MS);
    
    if (validRequests.length >= MAX_REQUESTS) {
      console.warn('⚠️ Rate limit excedido para:', url);
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    
    validRequests.push(now);
    requests.set(url, validRequests);
    
    return originalFetch.apply(window, args);
  };
};

// Inicializar todas as proteções
const initializeSecurity = () => {
  console.log('🛡️ Inicializando sistema de segurança...');
  
  try {
    enforceHTTPS();
    setupCSP();
    setupFrameProtection();
    setupXSSProtection();
    setupReferrerPolicy();
    
    // Desabilitar temporariamente proteções que podem conflitar com React
    if (location.hostname === 'localhost') {
      console.log('🔧 Modo desenvolvimento: proteções reduzidas');
    } else {
      setupIntegrityMonitoring();
      protectConsole();
      setupClientRateLimit();
    }
    
    setupDataCleaning();
    
    console.log('✅ Sistema de segurança ativo');
    
    // Relatório de segurança
    console.log('📊 Proteções ativas:', {
      csp: '✅ Content Security Policy',
      frameProtection: '✅ Anti-Clickjacking',
      xssProtection: '✅ XSS Protection',
      integrityMonitoring: location.hostname !== 'localhost' ? '✅ DOM Monitoring' : '⚠️ Desabilitado (dev)',
      consoleProtection: location.hostname !== 'localhost' ? '✅ Console Protection' : '⚠️ Desabilitado (dev)',
      rateLimiting: location.hostname !== 'localhost' ? '✅ Rate Limiting' : '⚠️ Desabilitado (dev)',
      dataProtection: '✅ Data Cleaning'
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização de segurança:', error);
  }
};

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSecurity);
} else {
  initializeSecurity();
}

// Exportar para uso manual se necessário
window.TxopitoSecurity = {
  initialize: initializeSecurity,
  setupCSP,
  setupFrameProtection,
  setupXSSProtection,
  protectConsole
};

console.log('🛡️ Configuração de segurança carregada');