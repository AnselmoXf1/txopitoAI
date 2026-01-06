# 🚀 Deploy no Render - TXOPITO IA

## Por que Render?
- Build automático a partir do GitHub
- HTTPS gratuito
- Suporte nativo para Node.js e React
- Variáveis de ambiente seguras
- Logs detalhados de build
- Plano gratuito generoso

## 📋 Pré-requisitos

1. **Conta no GitHub** (para conectar o repositório)
2. **Conta no Render** (gratuita em render.com)
3. **Chave da API do Gemini**

## 🔧 Configuração do Projeto

### 1. Configurar Scripts de Build

Já temos os scripts necessários no `package.json`:
- `build`: Para gerar os arquivos de produção
- `preview`: Para testar o build localmente

### 2. Configurar Variáveis de Ambiente

O Render usará estas variáveis durante o build:
- `VITE_GEMINI_API_KEY`: Sua chave da API do Gemini
- `NODE_VERSION`: Versão do Node.js (opcional, padrão é LTS)

## 🚀 Passos para Deploy

### Passo 1: Preparar o Repositório GitHub

```bash
# Se ainda não tem git inicializado
git init

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "Preparação para deploy no Render"

# Criar repositório no GitHub e conectar
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/txopito-ia.git
git push -u origin main
```

### Passo 2: Configurar no Render

1. **Acesse [render.com](https://render.com)**
2. **Faça login/cadastro**
3. **Clique em "New +" → "Static Site"**
4. **Conecte sua conta GitHub**
5. **Selecione o repositório `txopito-ia`**

### Passo 3: Configurações do Deploy

**Build & Deploy Settings:**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`
- **Branch:** `main`

**Environment Variables:**
- **Key:** `VITE_GEMINI_API_KEY`
- **Value:** [Sua chave da API do Gemini]

### Passo 4: Deploy Automático

O Render irá:
1. Clonar seu repositório
2. Instalar dependências (`npm install`)
3. Executar o build (`npm run build`)
4. Servir os arquivos da pasta `dist`

## ⚙️ Configurações Avançadas

### Auto-Deploy
- ✅ Ativado por padrão
- Cada push para `main` triggera novo deploy
- Builds são executados em ambiente Linux (resolve problemas do Windows)

### Headers Personalizados
Se precisar de headers específicos, crie `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

### Redirects para SPA
Já configuramos o arquivo `public/_redirects` que o Render reconhece automaticamente.

## 🔍 Monitoramento

### Logs de Build
- Acesse o dashboard do Render
- Clique no seu serviço
- Vá em "Logs" para ver o progresso do build

### Logs de Deploy
- Veja se há erros durante o build
- Monitore o tempo de build
- Verifique se as variáveis de ambiente estão sendo carregadas

## 🐛 Troubleshooting

### Build Falha
```bash
# Comandos que o Render executa:
npm install
npm run build
```

**Soluções:**
- Verifique se `package.json` está correto
- Confirme se todas as dependências estão listadas
- Teste localmente: `npm run build`

### Variáveis de Ambiente
- Certifique-se que começam com `VITE_`
- Não use aspas nos valores
- Redeploye após alterar variáveis

### Erro 404 em Rotas
- Confirme que `public/_redirects` existe
- Conteúdo: `/*    /index.html   200`

## 📊 Exemplo de Configuração Completa

**Nome do Serviço:** `txopito-ia`
**Repositório:** `https://github.com/SEU_USUARIO/txopito-ia`
**Branch:** `main`
**Build Command:** `npm install && npm run build`
**Publish Directory:** `dist`

**Environment Variables:**
```
VITE_GEMINI_API_KEY=AIzaSy...
NODE_VERSION=18
```

## 🎯 Vantagens do Render vs Outras Plataformas

| Recurso | Render | Vercel | Netlify |
|---------|--------|--------|---------|
| Build automático | ✅ | ✅ | ✅ |
| Plano gratuito | ✅ | ✅ | ✅ |
| Logs detalhados | ✅ | ⚠️ | ⚠️ |
| Suporte Node.js | ✅ | ✅ | ✅ |
| Sem vendor lock-in | ✅ | ⚠️ | ⚠️ |

## 🚀 Deploy Imediato

**Comando rápido para subir tudo:**

```bash
# Clone ou navegue até o projeto
cd txopito-ia

# Commit e push (se necessário)
git add .
git commit -m "Deploy para Render"
git push origin main

# Acesse render.com e configure conforme acima
```

## 📱 Após o Deploy

1. **Teste a aplicação** na URL fornecida pelo Render
2. **Configure domínio customizado** (opcional)
3. **Monitore performance** no dashboard
4. **Configure notificações** de deploy

## 🔄 Atualizações Futuras

Qualquer push para o branch `main` irá automaticamente:
1. Triggerar novo build
2. Executar testes (se configurados)
3. Fazer deploy da nova versão
4. Notificar sobre o status

---

**URL do seu projeto será algo como:**
`https://txopito-ia.onrender.com`