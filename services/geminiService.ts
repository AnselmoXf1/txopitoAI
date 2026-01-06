import { GoogleGenAI } from "@google/genai";
import { Message, Role, Attachment, DomainId } from '../types';
import { config, validateConfig } from '../backend/config';
import { logger } from '../backend/logger';
import { validateMessage, sanitizers } from '../backend/validators';
import { getFallbackResponse, getConnectionErrorMessage, isAboutSocialLogin, getSocialLoginFallback, isAboutCreation, getCreationResponse, isSocialEngineeringAttempt, getSocialEngineeringResponse } from './fallbackService';
import { timeService } from './timeService';
import { newsService } from './newsService';
import { getCurrentTime } from './timeService';
import { getCurrentNews, searchNews, formatNewsForChat } from './newsService';

// Validação inicial da configuração
if (!validateConfig()) {
  throw new Error('Configuração inválida do Gemini Service');
}

// Verifica se uma mensagem é sobre notícias
const isAboutNews = (message: string): boolean => {
  const newsKeywords = [
    'notícias', 'noticias', 'news', 'acontecimentos', 'eventos',
    'atualidades', 'últimas notícias', 'o que está acontecendo',
    'novidades', 'informações atuais', 'hoje', 'agora',
    'mundo', 'brasil', 'moçambique', 'áfrica', 'tecnologia',
    'política', 'economia', 'esportes'
  ];
  
  const lowerMessage = message.toLowerCase();
  return newsKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Extrai categoria de notícias da mensagem
const extractNewsCategory = (message: string): string | undefined => {
  const categories = {
    'tecnologia': ['tecnologia', 'tech', 'ia', 'inteligência artificial', 'programação'],
    'business': ['negócios', 'economia', 'empresas', 'mercado'],
    'sports': ['esportes', 'futebol', 'desporto'],
    'politics': ['política', 'governo', 'eleições'],
    'local': ['moçambique', 'maputo', 'áfrica', 'local']
  };
  
  const lowerMessage = message.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return category;
    }
  }
  
  return undefined;
};

const createAIClient = () => {
  if (!config.gemini.apiKey) {
    logger.error('API Key do Gemini não configurada', 'GeminiService');
    throw new Error("API_KEY is missing. Configure GEMINI_API_KEY in .env.local");
  }
  return new GoogleGenAI({ apiKey: config.gemini.apiKey });
};
  if (!config.gemini.apiKey) {
    logger.error('API Key do Gemini não configurada', 'GeminiService');
    throw new Error("API_KEY is missing. Configure GEMINI_API_KEY in .env.local");
  }
  return new GoogleGenAI({ apiKey: config.gemini.apiKey });
};

// --- CHAT WITH VISION ---
export const streamResponse = async (
  systemInstruction: string,
  history: Message[],
  newMessage: string,
  attachment: Attachment | null,
  onChunk: (text: string) => void,
  domainId?: DomainId
): Promise<string> => {
  logger.info('Iniciando stream de resposta', 'GeminiService', { 
    hasAttachment: !!attachment, 
    historyLength: history.length,
    messageLength: newMessage.length 
  });

  try {
    // Verifica tentativas de engenharia social
    if (isSocialEngineeringAttempt(newMessage)) {
      logger.warn('Tentativa de engenharia social detectada', 'GeminiService', { message: newMessage });
      const socialEngineeringResponse = getSocialEngineeringResponse();
      onChunk(socialEngineeringResponse.text);
      return socialEngineeringResponse.text;
    }

    // Verifica se é uma pergunta sobre notícias
    if (isAboutNews(newMessage)) {
      logger.info('Detectada pergunta sobre notícias, buscando informações atuais', 'GeminiService');
      try {
        const category = extractNewsCategory(newMessage);
        const news = await getCurrentNews(category, 5);
        const formattedNews = formatNewsForChat(news);
        onChunk(formattedNews);
        return formattedNews;
      } catch (error) {
        logger.error('Erro ao buscar notícias', 'GeminiService', { error });
        const fallbackMessage = "Ops, não consegui buscar as notícias mais recentes no momento! 😅\n\nMas posso te ajudar com outras coisas. O que você gostaria de aprender?";
        onChunk(fallbackMessage);
        return fallbackMessage;
      }
    }

    // Verifica se é uma pergunta sobre login social
    if (isAboutSocialLogin(newMessage)) {
      logger.info('Detectada pergunta sobre login social, usando fallback', 'GeminiService');
      const fallbackResponse = getSocialLoginFallback();
      onChunk(fallbackResponse.text);
      return fallbackResponse.text;
    }

    // Verifica se é uma pergunta sobre a criação do TXOPITO IA
    if (isAboutCreation(newMessage)) {
      logger.info('Detectada pergunta sobre criação, usando resposta especial', 'GeminiService');
      const creationResponse = getCreationResponse();
      onChunk(creationResponse.text);
      return creationResponse.text;
    }

    const ai = createAIClient();
    
    // Sanitiza a mensagem
    const sanitizedMessage = sanitizers.sanitizeUserInput(newMessage);
    
    // Valida a mensagem
    validateMessage({ text: sanitizedMessage, attachment });
    
    // Format history for Gemini
    const formattedHistory = history.map(msg => {
      const parts: any[] = [];
      
      if (msg.attachment) {
        parts.push({
          inlineData: {
            mimeType: msg.attachment.mimeType,
            data: msg.attachment.content
          }
        });
      }
      
      if (msg.text) {
        parts.push({ text: sanitizers.sanitizeUserInput(msg.text) });
      }

      return {
        role: msg.role,
        parts: parts,
      };
    });

    // Prepare new message contents
    let messageParts: any[] = [];
    if (attachment) {
      messageParts = [
        {
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.content
          }
        },
        { text: sanitizedMessage }
      ];
    } else {
      messageParts = [{ text: sanitizedMessage }];
    }

    const chat = ai.chats.create({
      model: config.gemini.models.chat,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } 
      },
      history: formattedHistory
    });

    let fullText = '';
    let chunkCount = 0;

    try {
      let resultStream;
      
      if (attachment) {
        logger.debug('Enviando mensagem com anexo', 'GeminiService');
        resultStream = await chat.sendMessageStream({ message: messageParts });
      } else {
        logger.debug('Enviando mensagem de texto', 'GeminiService');
        resultStream = await chat.sendMessageStream({ message: sanitizedMessage });
      }
      
      for await (const chunk of resultStream) {
        const chunkText = chunk.text; 
        if (chunkText) {
          fullText += chunkText;
          chunkCount++;
          onChunk(fullText);
        }
      }
      
      logger.info('Stream concluído com sucesso', 'GeminiService', { 
        responseLength: fullText.length,
        chunksReceived: chunkCount 
      });
      
    } catch (streamError) {
      logger.error('Erro no streaming', 'GeminiService', { 
        error: streamError.message,
        hasAttachment: !!attachment 
      });
      
      // Usa fallback em caso de erro de streaming
      if (domainId) {
        logger.info('Usando fallback devido a erro de streaming', 'GeminiService');
        const fallbackResponse = getFallbackResponse(domainId, sanitizedMessage);
        onChunk(fallbackResponse.text);
        return fallbackResponse.text;
      }
      
      throw new Error(`Erro na comunicação com a IA: ${streamError.message}`);
    }

    return fullText;
    
  } catch (error) {
    logger.error('Erro geral no streamResponse', 'GeminiService', { 
      error: error.message,
      hasAttachment: !!attachment 
    });
    
    // Usa fallback em caso de erro geral
    if (domainId) {
      logger.info('Usando fallback devido a erro geral', 'GeminiService');
      const fallbackResponse = getFallbackResponse(domainId, newMessage);
      onChunk(fallbackResponse.text);
      return fallbackResponse.text;
    }
    
    throw error;
  }
};

// --- IMAGE GENERATION ---
export const generateImage = async (prompt: string, domainId?: DomainId): Promise<string> => {
  logger.info('Iniciando geração de imagem', 'GeminiService', { promptLength: prompt.length });
  
  try {
    const ai = createAIClient();
    
    // Sanitiza o prompt
    const sanitizedPrompt = sanitizers.sanitizeUserInput(prompt);
    
    if (sanitizedPrompt.length < 5) {
      throw new Error('Prompt muito curto para geração de imagem');
    }
    
    logger.debug('Enviando requisição para Imagen', 'GeminiService', { prompt: sanitizedPrompt });
    
    const response = await ai.models.generateImages({
      model: config.gemini.models.imageGeneration,
      prompt: sanitizedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      }
    });

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      logger.info('Imagem gerada com sucesso', 'GeminiService');
      return response.generatedImages[0].image.imageBytes;
    }
    
    logger.error('Resposta da API não contém imagem', 'GeminiService', { response });
    throw new Error("Falha na geração da imagem - resposta vazia");
    
  } catch (error) {
    logger.error('Erro na geração de imagem', 'GeminiService', { 
      error: error.message,
      promptLength: prompt.length 
    });
    
    // Melhora a mensagem de erro para o usuário
    if (error.message.includes('quota')) {
      throw new Error('Limite de geração de imagens atingido. Tente novamente mais tarde.');
    } else if (error.message.includes('safety')) {
      throw new Error('Prompt rejeitado por políticas de segurança. Tente reformular sua solicitação.');
    }
    
    // Em caso de erro, retorna uma mensagem explicativa em vez de uma imagem
    throw new Error(`🎨 **Geração de imagem temporariamente indisponível**

Não consegui gerar a imagem "${prompt}" no momento devido a problemas técnicos.

**🔧 O que aconteceu:**
- Serviços de IA estão instáveis
- Possível limite de uso atingido
- Problemas de conectividade

**💡 Alternativas:**
- Tente novamente em alguns minutos
- Use prompts mais simples
- Descreva a imagem que você quer e eu posso te ajudar com o conceito

**🚀 Em breve:**
Estou trabalhando para restabelecer a conexão com os serviços de geração de imagem!`);
  }
};

// --- UTILITY FUNCTIONS ---
export const getModelInfo = () => {
  return {
    chatModel: config.gemini.models.chat,
    imageModel: config.gemini.models.imageGeneration,
    apiKeyConfigured: !!config.gemini.apiKey
  };
};

// Função para testar a conectividade com a API
export const testConnection = async (): Promise<boolean> => {
  logger.info('Testando conexão com Gemini API', 'GeminiService');
  
  try {
    const ai = createAIClient();
    
    // Teste simples com uma mensagem básica
    const chat = ai.chats.create({
      model: config.gemini.models.chat,
      config: {
        systemInstruction: "Responda apenas 'OK'",
      }
    });
    
    const result = await chat.sendMessage({ message: "teste" });
    
    logger.info('Teste de conexão bem-sucedido', 'GeminiService');
    return true;
    
  } catch (error) {
    logger.error('Falha no teste de conexão', 'GeminiService', { error: error.message });
    return false;
  }
};