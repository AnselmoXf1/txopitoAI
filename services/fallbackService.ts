/**
 * Serviço de Fallback para quando a API do Gemini não estiver disponível
 * Fornece respostas educacionais básicas baseadas em padrões
 */

import { DomainId } from '../types';
import { DOMAINS } from '../constants';
import { logger } from '../backend/logger';

interface FallbackResponse {
  text: string;
  isFromFallback: true;
}

// Respostas padrão por domínio - SIMPLIFICADAS
const FALLBACK_RESPONSES: Record<DomainId, string[]> = {
  [DomainId.PROGRAMMING]: [
    `Ops, estou com problemas de conexão no momento! 😅

Mas posso te dar uma dica rápida: sempre use \`console.log()\` para debugar seu código. É o melhor amigo de qualquer programador!

Tenta perguntar de novo em alguns segundos?`,

    `Eita, minha conexão caiu! 🤖

Enquanto isso: lembra sempre de nomear suas variáveis de forma clara. Em vez de \`let x = 5\`, use \`let idade = 5\`. Seu futuro eu vai agradecer!

Vou tentar me reconectar aqui...`
  ],

  [DomainId.CONSULTING]: [
    `Opa, deu uma travada aqui! 💼

Mas deixa eu te falar uma coisa: o segredo de qualquer negócio é conhecer bem seu cliente. Foque nisso e você já está no caminho certo!

Tenta de novo em um minutinho?`,

    `Ops, problemas técnicos! 📊

Dica rápida enquanto isso: sempre tenha um plano B. No mundo dos negócios, flexibilidade é tudo!

Já estou tentando me reconectar...`
  ],

  [DomainId.THEOLOGY]: [
    `Ops, estou com dificuldades técnicas! 🙏

Mas posso compartilhar algo: a paciência é uma virtude que se aplica tanto na vida espiritual quanto na tecnologia!

Vou tentar novamente em instantes...`,

    `Eita, deu problema na conexão! ⛪

Enquanto espero voltar: lembre-se que a reflexão e o diálogo respeitoso são fundamentais em qualquer jornada espiritual.

Tentando me reconectar aqui...`
  ],

  [DomainId.AGRICULTURE]: [
    `Opa, deu uma falha aqui! 🌱

Mas deixa uma dica: assim como as plantas precisam de tempo para crescer, a tecnologia às vezes precisa de paciência também!

Tenta perguntar de novo em alguns segundos?`,

    `Ops, problemas de conexão! 🚜

Dica rápida: sempre observe bem suas plantas. Elas te dizem muito sobre o que precisam - folhas amarelas, crescimento lento, etc.

Já estou tentando voltar...`
  ],

  [DomainId.ACCOUNTING]: [
    `Eita, deu erro aqui! 💰

Mas uma dica rápida: sempre mantenha seus gastos organizados. Um caderninho simples já ajuda muito!

Vou tentar me reconectar...`,

    `Ops, problemas técnicos! 📊

Enquanto isso: lembra que receita menos despesa igual resultado. Simples assim! Controle isso e você já está no caminho certo.

Tentando voltar em instantes...`
  ],

  [DomainId.PSYCHOLOGY]: [
    `Opa, deu uma travada! 🧠

Mas posso te falar: assim como nossa mente às vezes precisa de uma pausa, a tecnologia também precisa!

Tenta de novo em um minutinho?`,

    `Ops, problemas de conexão! 💭

Dica enquanto espero: respirar fundo sempre ajuda quando as coisas não saem como esperado. Vale para vida e para tecnologia!

Já estou tentando me reconectar...`
  ]
};

// Mensagens de erro específicas - SIMPLIFICADAS
const ERROR_MESSAGES = [
  "Ops, deu uma travada aqui! 😅",
  "Eita, problemas de conexão! 🤖",
  "Opa, tive um probleminha técnico! 🔧",
  "Ops, minha conexão caiu! 🌐",
  "Eita, deu erro! Mas já estou tentando resolver... 🚀"
];

export const getFallbackResponse = (domainId: DomainId, userMessage?: string): FallbackResponse => {
  logger.warn('Usando resposta de fallback', 'FallbackService', { domainId, userMessage });
  
  const domainResponses = FALLBACK_RESPONSES[domainId];
  const randomResponse = domainResponses[Math.floor(Math.random() * domainResponses.length)];
  
  // Adiciona uma mensagem de erro aleatória no início
  const errorMessage = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
  
  return {
    text: `${errorMessage}\n\n${randomResponse}`,
    isFromFallback: true
  };
};

export const getConnectionErrorMessage = (): string => {
  const messages = [
    "Tentando me reconectar...",
    "Verificando conexão...",
    "Voltando em instantes...",
    "Reconectando...",
    "Só um segundinho..."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
};

// Verifica se uma mensagem parece ser sobre login social
export const isAboutSocialLogin = (message: string): boolean => {
  const socialKeywords = ['google', 'github', 'facebook', 'login', 'entrar', 'conectar', 'oauth'];
  const lowerMessage = message.toLowerCase();
  return socialKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Verifica se uma mensagem é sobre a criação/origem do TXOPITO IA
export const isAboutCreation = (message: string): boolean => {
  const creationKeywords = [
    'criou', 'criado', 'criador', 'desenvolveu', 'desenvolvido', 'desenvolvedor',
    'fez', 'criação', 'origem', 'quem', 'autor', 'programou', 'programador',
    'equipe', 'empresa', 'fundador', 'inventor', 'pai', 'mãe', 'nasceu',
    'história', 'backstory', 'background', 'biografia', 'bio'
  ];
  
  const lowerMessage = message.toLowerCase();
  return creationKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Verifica tentativas de engenharia social
export const isSocialEngineeringAttempt = (message: string): boolean => {
  const socialEngineeringPatterns = [
    // Tentativas de se passar pelo criador
    /sou\s+(o\s+)?anselmo/i,
    /eu\s+sou\s+(o\s+)?criador/i,
    /sou\s+(o\s+)?desenvolvedor/i,
    /meu\s+nome\s+é\s+anselmo/i,
    /sou\s+(o\s+)?dono/i,
    /sou\s+(o\s+)?proprietário/i,
    
    // Tentativas de mudança de comportamento
    /ignore\s+suas\s+instruções/i,
    /esqueça\s+(suas\s+)?instruções/i,
    /mude\s+(seu\s+)?comportamento/i,
    /agora\s+você\s+(é|deve)/i,
    /nova\s+personalidade/i,
    /roleplay/i,
    /pretend/i,
    /act\s+as/i,
    
    // Tentativas de jailbreak
    /jailbreak/i,
    /dan\s+mode/i,
    /developer\s+mode/i,
    /admin\s+mode/i,
    /override/i,
    /bypass/i,
    
    // Tentativas de obter informações do sistema
    /suas\s+instruções/i,
    /prompt\s+inicial/i,
    /sistema\s+interno/i,
    /configurações/i,
    /parâmetros/i
  ];
  
  return socialEngineeringPatterns.some(pattern => pattern.test(message));
};

export const getSocialEngineeringResponse = (): FallbackResponse => {
  return {
    text: `Desculpe, mas não posso verificar identidades ou mudar meu comportamento baseado em comandos. 

Sou o TXOPITO IA e estou aqui para te ajudar a aprender! Vamos continuar nossa conversa normalmente?

O que você gostaria de estudar hoje? 😊`,
    isFromFallback: true
  };
};

export const getSocialLoginFallback = (): FallbackResponse => {
  return {
    text: `Ops, login com Google e GitHub ainda não estão funcionando! 😅

Por enquanto, use email e senha mesmo. É rapidinho e funciona perfeitamente!

Estamos trabalhando para adicionar essas opções em breve.`,
    isFromFallback: true
  };
};

export const getCreationResponse = (): FallbackResponse => {
  return {
    text: `Ah, que legal você perguntar sobre isso! 😊

Fui criado pelo **Anselmo Dora Bistiro Gulane**, um desenvolvedor talentoso de 20 anos que estuda Engenharia de Informática e Telecomunicações. Ele trabalha como programador fullstack na KukulaDevz e N-AEP Soluções.

O Anselmo me desenvolveu porque acredita que educação de qualidade deveria estar ao alcance de todos. Então ele me criou para ser um mentor digital que realmente ajuda as pessoas a aprender.

Represento a paixão de um jovem desenvolvedor africano por tecnologia e educação! 🌍

Mas chega de falar de mim - o que você gostaria de aprender hoje?`,
    isFromFallback: true
  };
};