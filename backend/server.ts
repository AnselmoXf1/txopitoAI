/**
 * Servidor Backend - TXOPITO IA
 * Servidor Express para proxy OAuth e APIs seguras
 */

import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './authRoutes.js';
import { logger } from './logger.js';

// Configuração ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente
config({ path: path.join(__dirname, '.env') });
config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://127.0.0.1:3000',
    // URLs de produção (atualize com suas URLs reais)
    process.env.FRONTEND_URL,
    'https://txopito-ia.vercel.app',
    'https://txopito-ia.netlify.app'
  ].filter(Boolean), // Remove valores undefined
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logs de requisições
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, 'Server', { 
    ip: req.ip,
    userAgent: req.get('User-Agent')?.substring(0, 50) 
  });
  next();
});

// Rotas de autenticação
app.use('/api/auth', authRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      github_oauth: !!(process.env.VITE_GITHUB_CLIENT_ID && process.env.VITE_GITHUB_CLIENT_SECRET),
      google_oauth: !!(process.env.VITE_GOOGLE_CLIENT_ID && process.env.VITE_GOOGLE_CLIENT_SECRET)
    }
  });
});

// Servir arquivos estáticos do frontend (se necessário)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Middleware de erro
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro no servidor', 'Server', { 
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor TXOPITO IA iniciado`, 'Server', { 
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    github_configured: !!(process.env.VITE_GITHUB_CLIENT_ID && process.env.VITE_GITHUB_CLIENT_SECRET),
    google_configured: !!(process.env.VITE_GOOGLE_CLIENT_ID && process.env.VITE_GOOGLE_CLIENT_SECRET)
  });
  
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 GitHub OAuth: ${process.env.VITE_GITHUB_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`🔐 Google OAuth: ${process.env.VITE_GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ Não configurado'}`);
});

export default app;