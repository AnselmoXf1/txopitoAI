# 🚀 Guia Completo de Deploy - TXOPITO IA
## Todas as Variáveis de Ambiente e Configurações

---

## 📋 Pré-requisitos

### 1. Contas Necessárias
- [ ] **GitHub** (gratuito) - para hospedar código
- [ ] **Render** (gratuito) - para deploy da aplicação
- [ ] **Google AI Studio** (gratuito) - para API do Gemini
- [ ] **MongoDB Atlas** (gratuito) - para banco de dados
- [ ] **Firebase** (opcional) - para recursos extras

---

## 🔑 Configuração das APIs

### 1. Google Gemini API

#### Passo 1: Obter Chave da API
1. **Acesse:** [aistudio.google.com](https://aistudio.google.com)
2. **Faça login** com sua conta Google
3. **Clique em "Get API Key"**
4. **Crie um novo projeto** ou selecione existente
5. **Copie a chave** (formato: `AIzaSy...`)

#### Passo 2: Testar a API
```bash
# Teste rápido (opcional)
curl -H 'Content-Type: application/json' \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=SUA_CHAVE_AQUI'
```

### 2. MongoDB Atlas

#### Passo 1: Criar Cluster
1. **Acesse:** [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Crie conta gratuita**
3. **Crie novo cluster:**
   - Escolha **M0 Sandbox** (gratuito)
   - Região: **AWS / us-east-1** (mais próxima)
   - Nome: `txopito-cluster`

#### Passo 2: Configurar Acesso
1. **Database Access:**
   - Crie usuário: `txopito-user`
   - Senha: **Gere senha segura** (anote!)
   - Privilégios: `Atlas admin`

2. **Network Access:**
   - Adicione IP: `0.0.0.0/0` (acesso de qualquer lugar)
   - Ou IPs específicos do Render se preferir

#### Passo 3: Obter String de Conexão
1. **Clique em "Connect"**
2. **Escolha "Connect your application"**
3. **Copie a string** (formato: `mongodb+srv://...`)
4. **Substitua `<password>` pela senha real**

Exemplo:
```
mongodb+srv://txopito-user:SUA_SENHA@txopito-cluster.abc123.mongodb.net/txopito?retryWrites=true&w=majority
```

### 3. Firebase (Opcional)

#### Se quiser usar Firebase:
1. **Acesse:** [console.firebase.google.com](https://console.firebase.google.com)
2. **Crie novo projeto:** `txopito-ia`
3. **Ative Authentication** (opcional)
4. **Ative Firestore** (opcional)
5. **Obtenha configuração:**
   - Project Settings → General → Your apps
   - Copie o objeto `firebaseConfig`

---

## 🌐 Deploy no Render

### Passo 1: Preparar Repositório
✅ **Já feito!** Seu código está em: https://github.com/AnselmoXf1/txopitoAI.git

### Passo 2: Acessar Render
1. **Acesse:** [render.com](https://render.com)
2. **Clique em "Get Started for Free"**
3. **Conecte com GitHub**
4. **Autorize acesso** aos repositórios

### Passo 3: Criar Static Site
1. **Dashboard → "New +"**
2. **Selecione "Static Site"**
3. **Conecte repositório:**
   - Repository: `AnselmoXf1/txopitoAI`
   - Branch: `main`

### Passo 4: Configurações de Build
```
Name: txopito-ia
Build Command: npm install && npm run build
Publish Directory: dist
Auto-Deploy: Yes
```

### Passo 5: Variáveis de Ambiente

#### Variáveis Obrigatórias:
```
VITE_GEMINI_API_KEY=AIzaSy... (sua chave do Gemini)
```

#### Variáveis Opcionais (MongoDB):
```
VITE_MONGODB_URI=mongodb+srv://txopito-user:senha@txopito-cluster.abc123.mongodb.net/txopito?retryWrites=true&w=majority
VITE_MONGODB_DB_NAME=txopito
```

#### Variáveis Opcionais (Firebase):
```
VITE_FIREBASE_API_KEY=sua_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=txopito-ia.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=txopito-ia
VITE_FIREBASE_STORAGE_BUCKET=txopito-ia.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

#### Como Adicionar no Render:
1. **Na página de configuração do site**
2. **Seção "Environment"**
3. **Clique "Add Environment Variable"**
4. **Adicione uma por vez:**
   - Key: `VITE_GEMINI_API_KEY`
   - Value: `AIzaSy...` (sua chave)
5. **Repita para outras variáveis**

### Passo 6: Deploy
1. **Clique "Create Static Site"**
2. **Aguarde build** (5-15 minutos)
3. **Monitore logs** na aba "Logs"

---

## 🔍 Monitoramento e Verificação

### Durante o Build
**Logs esperados:**
```
==> Cloning from https://github.com/AnselmoXf1/txopitoAI
==> Installing dependencies with npm...
==> Running build command 'npm install && npm run build'
✓ Build completed successfully
==> Uploading build...
==> Deploy live at https://txopito-ia.onrender.com
```

### Após Deploy - Checklist
- [ ] **Site carrega** sem erros 404
- [ ] **Chat funciona** (teste enviar mensagem)
- [ ] **API Gemini conecta** (resposta da IA)
- [ ] **Navegação funciona** (não dá 404 ao navegar)
- [ ] **Responsivo** (teste no celular)

### Teste das Funcionalidades
1. **Teste básico:**
   - Envie: "Olá, como você está?"
   - Deve receber resposta da IA

2. **Teste memória:**
   - Envie: "Meu nome é João"
   - Depois: "Qual é o meu nome?"
   - Deve lembrar "João"

3. **Teste idiomas:**
   - Mude idioma no seletor
   - Interface deve traduzir

---

## 🐛 Troubleshooting

### Build Falha
**Erro comum:** `Transform failed`
- **Solução:** Já corrigido no último commit

**Erro:** `VITE_GEMINI_API_KEY is not defined`
- **Solução:** Verifique se variável foi adicionada corretamente

### Site Carrega mas Chat Não Funciona
**Problema:** API key inválida
- **Verificar:** Console do navegador (F12)
- **Solução:** Confirmar chave do Gemini

**Problema:** CORS error
- **Solução:** Já configurado no código

### Erro 404 ao Navegar
**Problema:** SPA routing
- **Solução:** Arquivo `_redirects` já configurado

### MongoDB Não Conecta
**Problema:** String de conexão
- **Verificar:** Senha correta na string
- **Verificar:** IP liberado no Atlas
- **Solução:** Testar string localmente primeiro

---

## 🔄 Atualizações Futuras

### Para Atualizar o Site:
```bash
# Fazer alterações no código
git add .
git commit -m "Descrição da alteração"
git push origin main
```
**Render fará deploy automático!**

### Para Adicionar Novas Variáveis:
1. **Render Dashboard → Seu site**
2. **Environment → Add Environment Variable**
3. **Redeploy** (se necessário)

---

## 📊 Resumo das URLs e Credenciais

### URLs Importantes:
- **Repositório:** https://github.com/AnselmoXf1/txopitoAI.git
- **Site Deploy:** https://txopito-ia.onrender.com (após deploy)
- **Render Dashboard:** https://dashboard.render.com
- **Google AI Studio:** https://aistudio.google.com
- **MongoDB Atlas:** https://cloud.mongodb.com

### Credenciais para Anotar:
```
✅ GitHub: AnselmoXf1/txopitoAI
✅ Gemini API Key: AIzaSy... 
⏳ MongoDB User: txopito-user
⏳ MongoDB Password: [sua senha]
⏳ MongoDB URI: mongodb+srv://...
⏳ Render Site: https://txopito-ia.onrender.com
```

---

## 🎯 Checklist Final

### Antes do Deploy:
- [ ] Chave Gemini obtida e testada
- [ ] MongoDB cluster criado (se usando)
- [ ] Usuário MongoDB criado
- [ ] String de conexão MongoDB obtida
- [ ] Render account criado
- [ ] Repositório GitHub conectado

### Durante Deploy:
- [ ] Static Site criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] Build command configurado
- [ ] Deploy iniciado

### Após Deploy:
- [ ] Site acessível na URL fornecida
- [ ] Chat funcionando
- [ ] API Gemini respondendo
- [ ] Navegação sem erros 404
- [ ] Responsivo em mobile

---

## 🚀 Resultado Final

Após seguir todos os passos, você terá:

✅ **Aplicação web completa** rodando 24/7
✅ **Chat com IA** usando Gemini
✅ **Sistema de memória** funcional
✅ **Interface multilíngue** (PT/EN/ES)
✅ **Deploy automático** a cada update
✅ **HTTPS gratuito** e CDN global
✅ **Banco de dados** MongoDB (opcional)
✅ **Monitoramento** via logs do Render

**🎉 Seu TXOPITO IA estará online e funcional!**