# 🏗️ TXOPITO IA - Documentação do Backend

## 📋 Visão Geral

O backend do TXOPITO IA foi projetado com uma arquitetura **serverless/local-first** que simula um backend robusto usando localStorage como banco de dados. Esta abordagem permite:

- ✅ **Desenvolvimento rápido** sem necessidade de configurar servidores
- ✅ **Persistência de dados** local no navegador
- ✅ **Escalabilidade futura** para backend real
- ✅ **Separação clara** entre lógica de negócio e apresentação

## 🏛️ Arquitetura

```
backend/
├── index.ts          # Ponto de entrada e inicialização
├── config.ts         # Configurações centralizadas
├── database.ts       # Camada de acesso a dados (localStorage)
├── api.ts           # Serviços de negócio (Auth, User, Chat)
├── validators.ts     # Validação e sanitização de dados
├── logger.ts        # Sistema de logging estruturado
├── cache.ts         # Sistema de cache em memória
└── README.md        # Esta documentação
```

## 🔧 Componentes Principais

### 1. **Sistema de Configuração** (`config.ts`)
- Gerencia variáveis de ambiente
- Configurações de gamificação
- Modelos de IA utilizados
- Validação de configuração

### 2. **Sistema de Logging** (`logger.ts`)
- Logs estruturados com níveis (DEBUG, INFO, WARN, ERROR)
- Contexto e dados adicionais
- Exportação de logs para análise
- Configuração automática por ambiente

### 3. **Validação e Sanitização** (`validators.ts`)
- Validação de entrada de dados
- Sanitização contra XSS
- Validação de tipos TypeScript
- Mensagens de erro padronizadas

### 4. **Sistema de Cache** (`cache.ts`)
- Cache em memória com TTL
- Limpeza automática de itens expirados
- Utilitários para cache com fallback
- Estatísticas de uso

### 5. **Camada de Dados** (`database.ts`)
- Abstração do localStorage
- Operações CRUD padronizadas
- Tratamento de erros de serialização
- Backup e recuperação de dados

### 6. **Serviços de Negócio** (`api.ts`)
- **AuthService**: Login, registro, logout
- **UserService**: Gamificação, preferências, estatísticas
- **ChatService**: Sessões, mensagens, histórico

## 🎮 Sistema de Gamificação

### Mecânicas de XP
```typescript
// Configuração padrão
const gamification = {
  xpPerMessage: 10,           // XP por mensagem enviada
  xpPerImageUpload: 25,       // XP por imagem enviada
  xpPerImageGeneration: 50,   // XP por imagem gerada
  baseXpForLevel: 200         // XP base por nível
};

// Cálculo de nível
const xpNeeded = currentLevel * baseXpForLevel;
```

### Sistema de Ranks
- **Estagiário** (Nível 1-4)
- **Júnior** (Nível 5-9)
- **Pleno** (Nível 10-19)
- **Sênior** (Nível 20-49)
- **Especialista** (Nível 50+)

## 🔐 Segurança

### Validação de Entrada
- Sanitização de strings contra XSS
- Validação de tipos e formatos
- Limites de tamanho de dados
- Validação de MIME types para imagens

### Tratamento de Erros
- Logs estruturados de erros
- Mensagens de erro amigáveis
- Fallbacks para falhas de API
- Validação de configuração

## 📊 Monitoramento

### Logs Disponíveis
```typescript
// Exemplos de logs gerados
logger.info('Usuário logado', 'AuthService', { userId: '123' });
logger.warn('Cache miss', 'Cache', { key: 'user_sessions_123' });
logger.error('Falha na API', 'GeminiService', { error: 'timeout' });
```

### Métricas Coletadas
- Número de usuários registrados
- Sessões de chat ativas
- Mensagens por domínio
- Taxa de hit/miss do cache
- Erros de API

## 🚀 Inicialização

```typescript
import { initializeBackend, getSystemStatus } from './backend';

// Inicializa o backend
const success = await initializeBackend();

if (success) {
  console.log('Backend pronto!');
  console.log(getSystemStatus());
} else {
  console.error('Falha na inicialização');
}
```

## 🔄 Migração para Backend Real

O design permite migração fácil para um backend real:

1. **Substituir `database.ts`** por cliente de banco real (MongoDB, PostgreSQL)
2. **Manter `api.ts`** com pequenas adaptações
3. **Adicionar autenticação JWT** no `AuthService`
4. **Implementar rate limiting** e outras proteções
5. **Migrar cache** para Redis ou similar

## 🛠️ Desenvolvimento

### Adicionando Novos Serviços
```typescript
// 1. Criar validadores em validators.ts
export const validateNewEntity = (data: NewEntity): void => {
  // validação aqui
};

// 2. Adicionar ao api.ts
export const NewService = {
  async create(data: NewEntity): Promise<NewEntity> {
    logger.info('Criando nova entidade', 'NewService');
    validateNewEntity(data);
    // lógica aqui
  }
};

// 3. Exportar em index.ts
export { NewService } from './api';
```

### Debugging
```typescript
// Ativar logs de debug
logger.setLevel(LogLevel.DEBUG);

// Ver estatísticas do sistema
console.log(getSystemStatus());

// Limpar cache para testes
cache.clear();
```

## 📈 Performance

### Otimizações Implementadas
- Cache em memória para consultas frequentes
- Sanitização eficiente de strings
- Logs estruturados com contexto
- Limpeza automática de dados expirados

### Monitoramento de Performance
- Tempo de resposta das operações
- Uso de memória do cache
- Frequência de operações de I/O
- Taxa de erro das APIs

---

**Desenvolvido com foco em escalabilidade, segurança e manutenibilidade.**