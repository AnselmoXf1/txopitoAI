/**
 * Serviço de Criptografia para TXOPITO IA
 * Simula bcrypt para hash de senhas (em produção usar bcrypt real)
 */

import { logger } from './logger';

class CryptoService {
  private readonly SALT_ROUNDS = 12;

  /**
   * Simula bcrypt.hash() - Em produção usar: bcrypt.hash(password, saltRounds)
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Simula o processo de hash do bcrypt
      const salt = this.generateSalt();
      const hash = await this.simulateBcryptHash(password, salt);
      
      logger.debug('Senha hasheada com sucesso', 'CryptoService');
      return hash;
    } catch (error) {
      logger.error('Erro ao hashear senha', 'CryptoService', { error: error.message });
      throw new Error('Erro interno de segurança');
    }
  }

  /**
   * Simula bcrypt.compare() - Em produção usar: bcrypt.compare(password, hash)
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    try {
      // Extrai o salt do hash
      const salt = this.extractSaltFromHash(hash);
      
      // Gera hash da senha fornecida com o mesmo salt
      const newHash = await this.simulateBcryptHash(password, salt);
      
      // Compara os hashes
      const isMatch = newHash === hash;
      
      logger.debug('Comparação de senha realizada', 'CryptoService', { isMatch });
      return isMatch;
    } catch (error) {
      logger.error('Erro ao comparar senha', 'CryptoService', { error: error.message });
      return false;
    }
  }

  /**
   * Gera um token seguro para reset de senha
   */
  generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Adiciona timestamp para unicidade
    return token + Date.now().toString(36);
  }

  /**
   * Simula a geração de salt do bcrypt
   */
  private generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./';
    let salt = '$2b$' + this.SALT_ROUNDS.toString().padStart(2, '0') + '$';
    
    for (let i = 0; i < 22; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return salt;
  }

  /**
   * Simula o processo de hash do bcrypt
   */
  private async simulateBcryptHash(password: string, salt: string): Promise<string> {
    // Simula delay do bcrypt (que é intencionalmente lento)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simula hash usando uma combinação de métodos
    let hash = salt;
    
    // Combina senha com salt
    const combined = password + salt;
    
    // Simula múltiplas iterações (como bcrypt faz)
    let result = combined;
    for (let i = 0; i < this.SALT_ROUNDS; i++) {
      result = await this.simpleHash(result + i.toString());
    }
    
    // Adiciona o resultado ao salt para formar o hash final
    hash += result.substring(0, 31);
    
    return hash;
  }

  /**
   * Extrai o salt de um hash bcrypt
   */
  private extractSaltFromHash(hash: string): string {
    // Formato bcrypt: $2b$rounds$salt+hash
    // Extrai: $2b$rounds$salt (primeiros 29 caracteres)
    return hash.substring(0, 29);
  }

  /**
   * Hash simples para simular parte do processo bcrypt
   */
  private async simpleHash(input: string): Promise<string> {
    // Simula um hash usando Web Crypto API (disponível no browser)
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback se Web Crypto não estiver disponível
      return this.fallbackHash(input);
    }
  }

  /**
   * Hash fallback simples
   */
  private fallbackHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Valida força da senha
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Comprimento
    if (password.length >= 8) {
      score += 2;
    } else if (password.length >= 6) {
      score += 1;
    } else {
      feedback.push('Use pelo menos 6 caracteres');
    }

    // Letras minúsculas
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Adicione letras minúsculas');
    }

    // Letras maiúsculas
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Adicione letras maiúsculas');
    }

    // Números
    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Adicione números');
    }

    // Símbolos
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 2;
    } else {
      feedback.push('Adicione símbolos (!@#$%^&*)');
    }

    // Padrões comuns
    if (!/(.)\1{2,}/.test(password)) {
      score += 1;
    } else {
      feedback.push('Evite repetir caracteres');
    }

    const isValid = score >= 4 && password.length >= 6;

    return {
      isValid,
      score: Math.min(score, 8),
      feedback: feedback.length > 0 ? feedback : ['Senha forte!']
    };
  }
}

export const cryptoService = new CryptoService();