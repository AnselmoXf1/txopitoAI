/**
 * Sistema de validação de dados
 * Garante integridade e segurança dos dados do sistema
 */

import { User, Message, ChatSession, DomainId, Attachment } from '../types';
import { logger } from './logger';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  // Validação de email
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validação de nome de usuário
  userName: (name: string): boolean => {
    return name.length >= 2 && name.length <= 50 && /^[a-zA-ZÀ-ÿ\s]+$/.test(name);
  },

  // Validação de domínio
  domainId: (domainId: string): boolean => {
    return Object.values(DomainId).includes(domainId as DomainId);
  },

  // Validação de attachment
  attachment: (attachment: Attachment): boolean => {
    if (!attachment.content || !attachment.mimeType) return false;
    
    // Verifica se é uma imagem válida
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validMimeTypes.includes(attachment.mimeType)) return false;

    // Verifica se o base64 é válido
    try {
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(attachment.content);
    } catch {
      return false;
    }
  },

  // Validação de mensagem
  message: (text: string): boolean => {
    return text.length > 0 && text.length <= 10000; // Limite de 10k caracteres
  }
};

export const validateUser = (userData: Partial<User>): void => {
  logger.debug('Validando dados do usuário', 'Validator');

  if (!userData.name || !validators.userName(userData.name)) {
    throw new ValidationError('Nome deve ter entre 2-50 caracteres e conter apenas letras', 'name');
  }

  if (!userData.email || !validators.email(userData.email)) {
    throw new ValidationError('Email inválido', 'email');
  }

  logger.debug('Usuário validado com sucesso', 'Validator');
};

export const validateMessage = (messageData: Partial<Message>): void => {
  logger.debug('Validando mensagem', 'Validator');

  if (!messageData.text || !validators.message(messageData.text)) {
    throw new ValidationError('Mensagem deve ter entre 1-10000 caracteres', 'text');
  }

  if (messageData.attachment && !validators.attachment(messageData.attachment)) {
    throw new ValidationError('Anexo inválido', 'attachment');
  }

  logger.debug('Mensagem validada com sucesso', 'Validator');
};

export const validateChatSession = (sessionData: Partial<ChatSession>): void => {
  logger.debug('Validando sessão de chat', 'Validator');

  if (!sessionData.title || sessionData.title.length === 0 || sessionData.title.length > 100) {
    throw new ValidationError('Título deve ter entre 1-100 caracteres', 'title');
  }

  if (!sessionData.domainId || !validators.domainId(sessionData.domainId)) {
    throw new ValidationError('Domínio inválido', 'domainId');
  }

  if (!sessionData.userId) {
    throw new ValidationError('ID do usuário é obrigatório', 'userId');
  }

  logger.debug('Sessão validada com sucesso', 'Validator');
};

// Sanitização de dados
export const sanitizers = {
  // Remove caracteres perigosos de strings
  sanitizeString: (str: string): string => {
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .trim();
  },

  // Limita o tamanho de strings
  limitString: (str: string, maxLength: number): string => {
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  },

  // Sanitiza dados do usuário
  sanitizeUserInput: (input: string): string => {
    return sanitizers.limitString(sanitizers.sanitizeString(input), 10000);
  }
};