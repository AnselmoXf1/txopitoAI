/**
 * Security Middleware - TXOPITO IA Backend
 * Middleware de segurança para proteger APIs
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const validator = require('validator');

// Rate limiting configurável
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Muitas requisições. Tente novamente em alguns minutos.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`🚨 Rate limit excedido: ${req.ip} - ${req.path}`);
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Rate limits específicos
const rateLimits = {
  // Geral - 100 requests por 15 minutos
  general: createRateLimit(15 * 60 * 1000, 100),
  
  // Login - 5 tentativas por 15 minutos
  auth: createRateLimit(15 * 60 * 1000, 5),
  
  // Chat - 30 mensagens por minuto
  chat: createRateLimit(60 * 1000, 30),
  
  // Admin - 20 requests por 5 minutos
  admin: createRateLimit(5 * 60 * 1000, 20)
};

// Configuração CORS segura
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://txopito-ia.vercel.app',
      'https://txopito.com',
      'http://localhost:3000', // Apenas em desenvolvimento
    ];
    
    // Permitir requests sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚨 Origem bloqueada: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 horas
};

// Validação de entrada
const validateInput = (req, res, next) => {
  // Sanitizar todos os strings no body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Validar parâmetros da URL
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        if (!validator.isAlphanumeric(value.replace(/[-_]/g, ''))) {
          return res.status(400).json({
            error: 'Parâmetro inválido',
            parameter: key
          });
        }
      }
    }
  }
  
  next();
};

// Sanitizar objeto recursivamente
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Remover caracteres perigosos
      sanitized[key] = validator.escape(value)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    console.warn(`🚨 Token inválido: ${req.ip}`);
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware de logging de segurança
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log da requisição
  console.log(`📡 ${req.method} ${req.path} - ${req.ip} - ${req.get('User-Agent')}`);
  
  // Detectar atividades suspeitas
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/gi, // XSS
    /union.*select/gi, // SQL injection
    /exec\(/gi, // Code injection
  ];
  
  const fullUrl = req.originalUrl || req.url;
  const body = JSON.stringify(req.body || {});
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(fullUrl) || pattern.test(body)) {
      console.error(`🚨 ATIVIDADE SUSPEITA DETECTADA: ${req.ip} - ${req.path}`);
      console.error(`   Pattern: ${pattern}`);
      console.error(`   URL: ${fullUrl}`);
      console.error(`   Body: ${body.substring(0, 200)}`);
      
      return res.status(400).json({
        error: 'Requisição suspeita bloqueada',
        code: 'SUSPICIOUS_ACTIVITY'
      });
    }
  }
  
  // Log do tempo de resposta
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`✅ ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Middleware de proteção contra ataques de força bruta
const bruteForceProtection = () => {
  const attempts = new Map();
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos
  const MAX_ATTEMPTS = 5;
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 0, lastAttempt: now, blockedUntil: 0 });
    }
    
    const userAttempts = attempts.get(key);
    
    // Verificar se ainda está bloqueado
    if (userAttempts.blockedUntil > now) {
      const remainingTime = Math.ceil((userAttempts.blockedUntil - now) / 1000);
      return res.status(429).json({
        error: 'IP temporariamente bloqueado',
        retryAfter: remainingTime
      });
    }
    
    // Reset contador se passou tempo suficiente
    if (now - userAttempts.lastAttempt > BLOCK_DURATION) {
      userAttempts.count = 0;
    }
    
    // Incrementar tentativas em caso de erro
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        userAttempts.count++;
        userAttempts.lastAttempt = now;
        
        if (userAttempts.count >= MAX_ATTEMPTS) {
          userAttempts.blockedUntil = now + BLOCK_DURATION;
          console.warn(`🔒 IP bloqueado por força bruta: ${key}`);
        }
        
        attempts.set(key, userAttempts);
      }
    });
    
    next();
  };
};

// Middleware de validação de Content-Type
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type deve ser application/json'
      });
    }
  }
  
  next();
};

// Configuração do Helmet para headers de segurança
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.gemini.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Desabilitar para compatibilidade
});

// Middleware de monitoramento de performance
const performanceMonitor = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log requests lentos
    if (duration > 1000) { // Mais de 1 segundo
      console.warn(`⚠️ Request lento: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    }
    
    // Log requests com erro
    if (res.statusCode >= 400) {
      console.error(`❌ Error: ${req.method} ${req.path} - ${res.statusCode} - ${duration.toFixed(2)}ms`);
    }
  });
  
  next();
};

// Exportar middlewares
module.exports = {
  rateLimits,
  corsOptions,
  validateInput,
  authenticateToken,
  securityLogger,
  bruteForceProtection,
  validateContentType,
  helmetConfig,
  performanceMonitor,
  
  // Função para aplicar todos os middlewares de segurança
  applySecurityMiddlewares: (app) => {
    console.log('🛡️ Aplicando middlewares de segurança...');
    
    // Headers de segurança
    app.use(helmetConfig);
    
    // CORS
    app.use(cors(corsOptions));
    
    // Rate limiting geral
    app.use(rateLimits.general);
    
    // Logging e monitoramento
    app.use(securityLogger);
    app.use(performanceMonitor);
    
    // Validações
    app.use(validateContentType);
    app.use(validateInput);
    
    // Proteção contra força bruta
    app.use(bruteForceProtection());
    
    console.log('✅ Middlewares de segurança aplicados');
  }
};