/**
 * Security Service - TXOPITO IA
 * Sistema completo de proteção contra ataques
 */

// Implementação prática dos serviços de segurança

export class SecurityService {
  private static instance: SecurityService;
  private rateLimitMap = new Map<string, number[]>();
  private blockedIPs = new Set<string>();
  private suspiciousActivities = new Map<string, number>();

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Validação e sanitização de entrada
   */
  validateAndSanitizeInput(input: string, maxLength: number = 1000): { isValid: boolean; sanitized: string; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, sanitized: '', error: 'Input inválido' };
    }

    // Padrões perigosos
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /('|(\\')|(;)|(\\;)|(\-\-)|(\#)|(\*)|(\%27)|(\%3B)|(\%23)|(\%2A))/gi,
    ];

    // Verificar padrões perigosos
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        this.logSuspiciousActivity('xss_attempt', 'high');
        return { isValid: false, sanitized: '', error: 'Conteúdo suspeito detectado' };
      }
    }

    // Sanitizar
    let sanitized = input
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();

    // Verificar tamanho
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return { isValid: true, sanitized };
  }

  /**
   * Rate limiting
   */
  checkRateLimit(identifier: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!this.rateLimitMap.has(identifier)) {
      this.rateLimitMap.set(identifier, []);
    }

    const requests = this.rateLimitMap.get(identifier)!;
    
    // Remove requests antigas
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      this.logSuspiciousActivity('rate_limit_exceeded', 'medium');
      return false;
    }

    validRequests.push(now);
    this.rateLimitMap.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Criptografia de dados sensíveis
   */
  async encryptSensitiveData(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      // Gerar IV aleatório
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Chave derivada (em produção, usar uma chave mais segura)
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('txopito_secure_key_2026_v1'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('txopito_salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Criptografar
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      // Combinar IV + dados criptografados
      const result = new Uint8Array(iv.length + encrypted.byteLength);
      result.set(iv);
      result.set(new Uint8Array(encrypted), iv.length);
      
      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Erro na criptografia:', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografia de dados
   */
  async decryptSensitiveData(encryptedData: string): Promise<string> {
    try {
      const data = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      const encoder = new TextEncoder();
      
      // Mesma chave usada na criptografia
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('txopito_secure_key_2026_v1'),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('txopito_salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Descriptografar
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Erro na descriptografia:', error);
      throw new Error('Falha na descriptografia');
    }
  }

  /**
   * Validação de sessão segura
   */
  validateSession(sessionData: any): { isValid: boolean; error?: string } {
    if (!sessionData) {
      return { isValid: false, error: 'Sessão não encontrada' };
    }

    // Verificar expiração
    const now = Date.now();
    if (sessionData.expiresAt && sessionData.expiresAt < now) {
      return { isValid: false, error: 'Sessão expirada' };
    }

    // Verificar integridade
    if (!sessionData.userId || !sessionData.createdAt) {
      return { isValid: false, error: 'Dados de sessão inválidos' };
    }

    // Verificar se a sessão não é muito antiga (máximo 7 dias)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    if (now - sessionData.createdAt > maxAge) {
      return { isValid: false, error: 'Sessão muito antiga' };
    }

    return { isValid: true };
  }

  /**
   * Log de atividades suspeitas
   */
  logSuspiciousActivity(activity: string, severity: 'low' | 'medium' | 'high') {
    const count = this.suspiciousActivities.get(activity) || 0;
    this.suspiciousActivities.set(activity, count + 1);

    const logData = {
      activity,
      severity,
      count: count + 1,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Log baseado na severidade - usar console original para evitar recursão
    const originalConsole = (window as any).originalConsole || console;
    if (severity === 'high') {
      originalConsole.error('🚨 ATIVIDADE SUSPEITA CRÍTICA:', logData);
    } else if (severity === 'medium') {
      originalConsole.warn('⚠️ Atividade suspeita:', logData);
    } else {
      originalConsole.log('ℹ️ Atividade monitorada:', logData);
    }

    // Bloquear se muitas atividades críticas
    if (severity === 'high' && count >= 3) {
      this.blockCurrentSession();
    }

    // Enviar para servidor se disponível
    this.sendSecurityLog(logData);
  }

  /**
   * Bloquear sessão atual
   */
  blockCurrentSession() {
    console.error('🔒 SESSÃO BLOQUEADA POR ATIVIDADE SUSPEITA');
    
    // Limpar dados locais
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirecionar para tela de bloqueio
    window.location.href = '/blocked';
  }

  /**
   * Sanitizar dados para logs
   */
  sanitizeForLogs(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'auth'];
    const sanitized = { ...data };

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeForLogs(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Validar origem da requisição
   */
  validateOrigin(origin: string): boolean {
    const allowedOrigins = [
      'https://txopito-ia.vercel.app',
      'https://txopito.com',
      'http://localhost:3000', // Apenas em desenvolvimento
    ];

    return allowedOrigins.includes(origin);
  }

  /**
   * Gerar token CSRF
   */
  generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Enviar log de segurança para servidor
   */
  private async sendSecurityLog(logData: any) {
    try {
      // Implementar envio para servidor de monitoramento
      // fetch('/api/security/log', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(this.sanitizeForLogs(logData))
      // });
    } catch (error) {
      console.error('Erro ao enviar log de segurança:', error);
    }
  }

  /**
   * Verificar integridade dos dados
   */
  verifyDataIntegrity(data: any, expectedHash?: string): boolean {
    if (!expectedHash) return true;

    try {
      const dataString = JSON.stringify(data);
      const hash = this.generateHash(dataString);
      return hash === expectedHash;
    } catch (error) {
      console.error('Erro na verificação de integridade:', error);
      return false;
    }
  }

  /**
   * Gerar hash para verificação de integridade
   */
  private generateHash(data: string): string {
    // Implementação simples de hash (em produção, usar crypto.subtle)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Relatório de segurança
   */
  getSecurityReport(): any {
    return {
      rateLimitStatus: {
        activeConnections: this.rateLimitMap.size,
        blockedIPs: this.blockedIPs.size,
      },
      suspiciousActivities: Array.from(this.suspiciousActivities.entries()),
      timestamp: new Date().toISOString(),
      securityLevel: this.calculateSecurityLevel(),
    };
  }

  /**
   * Calcular nível de segurança atual
   */
  private calculateSecurityLevel(): 'low' | 'medium' | 'high' {
    const totalSuspicious = Array.from(this.suspiciousActivities.values())
      .reduce((sum, count) => sum + count, 0);

    if (totalSuspicious > 10) return 'low';
    if (totalSuspicious > 5) return 'medium';
    return 'high';
  }
}

// Instância global
export const securityService = SecurityService.getInstance();

// Expor no console para debug (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  (window as any).securityService = securityService;
}

export default SecurityService;