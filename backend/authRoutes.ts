/**
 * Rotas de Autenticação - TXOPITO IA
 * Proxy seguro para GitHub OAuth
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import fetch from 'node-fetch';
import { logger } from './logger';

// Configuração ES modules e dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
config({ path: path.join(__dirname, '.env') });
config({ path: path.join(__dirname, '../.env.local') });

const router = express.Router();

// Configuração GitHub OAuth (servidor)
const GITHUB_CONFIG = {
  clientId: process.env.VITE_GITHUB_CLIENT_ID,
  clientSecret: process.env.VITE_GITHUB_CLIENT_SECRET,
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiUrl: 'https://api.github.com'
};

// Configuração Google OAuth (servidor)
const GOOGLE_CONFIG = {
  clientId: process.env.VITE_GOOGLE_CLIENT_ID,
  clientSecret: process.env.VITE_GOOGLE_CLIENT_SECRET,
  tokenUrl: 'https://oauth2.googleapis.com/token',
  apiUrl: 'https://www.googleapis.com/oauth2/v2/userinfo'
};

// Debug: Log das variáveis carregadas
console.log('🔧 AuthRoutes - Variáveis carregadas:', {
  github: {
    clientId: GITHUB_CONFIG.clientId ? `${GITHUB_CONFIG.clientId.substring(0, 10)}...` : 'NÃO DEFINIDO',
    hasClientSecret: !!GITHUB_CONFIG.clientSecret,
  },
  google: {
    clientId: GOOGLE_CONFIG.clientId ? `${GOOGLE_CONFIG.clientId.substring(0, 10)}...` : 'NÃO DEFINIDO',
    hasClientSecret: !!GOOGLE_CONFIG.clientSecret,
  }
});

/**
 * POST /api/auth/github/token
 * Troca código OAuth por access token (proxy seguro)
 */
router.post('/github/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código OAuth é obrigatório' });
    }

    logger.info('Processando troca de código GitHub', 'AuthRoutes', { 
      code: code.substring(0, 10) + '...',
      redirect_uri 
    });

    // Troca código por token no servidor (seguro)
    const tokenResponse = await fetch(GITHUB_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CONFIG.clientId!,
        client_secret: GITHUB_CONFIG.clientSecret!,
        code,
        redirect_uri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Erro ao obter token GitHub', 'AuthRoutes', { 
        status: tokenResponse.status, 
        error: errorText 
      });
      return res.status(tokenResponse.status).json({ 
        error: 'Erro ao obter token do GitHub',
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('Erro OAuth GitHub', 'AuthRoutes', tokenData);
      return res.status(400).json({
        error: 'GitHub OAuth Error',
        details: tokenData.error_description || tokenData.error
      });
    }

    if (!tokenData.access_token) {
      logger.error('Token não recebido', 'AuthRoutes', tokenData);
      return res.status(500).json({ 
        error: 'Token de acesso não foi retornado pelo GitHub' 
      });
    }

    logger.info('Token GitHub obtido com sucesso', 'AuthRoutes');

    // Retorna apenas o access_token (não expõe outros dados)
    res.json({ 
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer'
    });

  } catch (error) {
    logger.error('Erro no proxy GitHub OAuth', 'AuthRoutes', { error });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/auth/github/user
 * Busca dados do usuário GitHub (proxy seguro)
 */
router.get('/github/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização é obrigatório' });
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer "

    logger.info('Buscando dados do usuário GitHub', 'AuthRoutes');

    // Busca dados do usuário
    const userResponse = await fetch(`${GITHUB_CONFIG.apiUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TXOPITO-IA'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      logger.error('Erro ao buscar usuário GitHub', 'AuthRoutes', { 
        status: userResponse.status, 
        error: errorText 
      });
      return res.status(userResponse.status).json({ 
        error: 'Erro ao buscar dados do usuário',
        details: errorText
      });
    }

    const userData = await userResponse.json();

    // Busca emails do usuário
    const emailsResponse = await fetch(`${GITHUB_CONFIG.apiUrl}/user/emails`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'TXOPITO-IA'
      }
    });

    let emails = [];
    if (emailsResponse.ok) {
      emails = await emailsResponse.json();
    } else {
      logger.warn('Não foi possível buscar emails do GitHub', 'AuthRoutes');
    }

    logger.info('Dados do usuário GitHub obtidos', 'AuthRoutes', { 
      userId: userData.id, 
      login: userData.login 
    });

    // Retorna dados do usuário + emails
    res.json({
      user: userData,
      emails: emails
    });

  } catch (error) {
    logger.error('Erro ao buscar usuário GitHub', 'AuthRoutes', { error });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/auth/github/config
 * Verifica se GitHub OAuth está configurado
 */
router.get('/github/config', (req, res) => {
  const isConfigured = !!(GITHUB_CONFIG.clientId && GITHUB_CONFIG.clientSecret);
  
  res.json({
    configured: isConfigured,
    clientId: GITHUB_CONFIG.clientId || null,
    hasClientSecret: !!GITHUB_CONFIG.clientSecret
  });
});

// ==================== GOOGLE OAUTH ROUTES ====================

/**
 * POST /api/auth/google/token
 * Troca código OAuth por access token (proxy seguro)
 */
router.post('/google/token', async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código OAuth é obrigatório' });
    }

    logger.info('Processando troca de código Google', 'AuthRoutes', { 
      code: code.substring(0, 10) + '...',
      redirect_uri 
    });

    // Troca código por token no servidor (seguro)
    const tokenResponse = await fetch(GOOGLE_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.clientId!,
        client_secret: GOOGLE_CONFIG.clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      logger.error('Erro ao obter token Google', 'AuthRoutes', { 
        status: tokenResponse.status, 
        error: errorText 
      });
      return res.status(tokenResponse.status).json({ 
        error: 'Erro ao obter token do Google',
        details: errorText
      });
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      logger.error('Erro OAuth Google', 'AuthRoutes', tokenData);
      return res.status(400).json({
        error: 'Google OAuth Error',
        details: tokenData.error_description || tokenData.error
      });
    }

    if (!tokenData.access_token) {
      logger.error('Token não recebido', 'AuthRoutes', tokenData);
      return res.status(500).json({ 
        error: 'Token de acesso não foi retornado pelo Google' 
      });
    }

    logger.info('Token Google obtido com sucesso', 'AuthRoutes');

    // Retorna apenas o access_token (não expõe outros dados)
    res.json({ 
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer'
    });

  } catch (error) {
    logger.error('Erro no proxy Google OAuth', 'AuthRoutes', { error });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/auth/google/user
 * Busca dados do usuário Google (proxy seguro)
 */
router.get('/google/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autorização é obrigatório' });
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer "

    logger.info('Buscando dados do usuário Google', 'AuthRoutes');

    // Busca dados do usuário
    const userResponse = await fetch(`${GOOGLE_CONFIG.apiUrl}?access_token=${accessToken}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TXOPITO-IA'
      }
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      logger.error('Erro ao buscar usuário Google', 'AuthRoutes', { 
        status: userResponse.status, 
        error: errorText 
      });
      return res.status(userResponse.status).json({ 
        error: 'Erro ao buscar dados do usuário',
        details: errorText
      });
    }

    const userData = await userResponse.json();

    logger.info('Dados do usuário Google obtidos', 'AuthRoutes', { 
      userId: userData.id, 
      email: userData.email 
    });

    // Retorna dados do usuário
    res.json({
      user: userData
    });

  } catch (error) {
    logger.error('Erro ao buscar usuário Google', 'AuthRoutes', { error });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * GET /api/auth/google/config
 * Verifica se Google OAuth está configurado
 */
router.get('/google/config', (req, res) => {
  const isConfigured = !!(GOOGLE_CONFIG.clientId && GOOGLE_CONFIG.clientSecret);
  
  res.json({
    configured: isConfigured,
    clientId: GOOGLE_CONFIG.clientId || null,
    hasClientSecret: !!GOOGLE_CONFIG.clientSecret
  });
});

export default router;