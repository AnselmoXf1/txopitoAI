# 🔑 Variáveis de Ambiente para Render

## ⚡ Configuração Rápida

### 1. Variável Obrigatória (Mínimo para funcionar)

```
VITE_GEMINI_API_KEY=AIzaSy...
```
**Como obter:** https://aistudio.google.com → Get API Key

---

### 2. Variáveis Opcionais (Para funcionalidades extras)

#### MongoDB (Para persistência de dados)
```
VITE_MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
VITE_MONGODB_DB_NAME=txopito
```
**Como obter:** https://cloud.mongodb.com → Create Cluster → Connect

#### Firebase (Para recursos extras)
```
VITE_FIREBASE_API_KEY=sua_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projeto-id
VITE_FIREBASE_STORAGE_BUCKET=projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```
**Como obter:** https://console.firebase.google.com → Project Settings

---

## 🚀 Como Adicionar no Render

### Passo a Passo:
1. **Render Dashboard** → Seu site
2. **Environment** (menu lateral)
3. **Add Environment Variable**
4. **Preencher:**
   - **Key:** `VITE_GEMINI_API_KEY`
   - **Value:** `AIzaSy...` (sua chave)
5. **Save Changes**
6. **Redeploy** (se necessário)

### ⚠️ Importante:
- **Todas as variáveis devem começar com `VITE_`**
- **Não use aspas** nos valores
- **Não exponha chaves no código** - sempre use variáveis de ambiente

---

## 🔍 Verificação

### Teste Local (Opcional):
```bash
# Instalar dependências
npm install

# Verificar variáveis
npm run check-env

# Testar build
npm run build
```

### No Render:
- **Logs de Build:** Verificar se não há erros de variáveis
- **Site Funcionando:** Testar chat com IA
- **Console do Navegador:** Verificar se não há erros de API

---

## 📊 Status das Funcionalidades

| Funcionalidade | Variável Necessária | Status |
|----------------|-------------------|---------|
| **Chat com IA** | `VITE_GEMINI_API_KEY` | ✅ Obrigatória |
| **Memória Local** | Nenhuma | ✅ Sempre ativa |
| **Persistência MongoDB** | `VITE_MONGODB_URI` | ⚪ Opcional |
| **Auth Firebase** | `VITE_FIREBASE_*` | ⚪ Opcional |
| **Notícias** | `VITE_NEWS_API_KEY` | ⚪ Opcional |
| **Clima** | `VITE_WEATHER_API_KEY` | ⚪ Opcional |

---

## 🎯 Configuração Mínima (Funcional)

**Para ter o TXOPITO IA funcionando básico:**
```
VITE_GEMINI_API_KEY=AIzaSy...
```

**Isso já permite:**
- ✅ Chat com IA Gemini
- ✅ Sistema de memória (localStorage)
- ✅ Interface multilíngue
- ✅ Todas as funcionalidades principais

---

## 🔄 Próximos Passos

1. **Configure pelo menos `VITE_GEMINI_API_KEY`**
2. **Faça deploy no Render**
3. **Teste a aplicação**
4. **Adicione outras variáveis conforme necessário**

**🚀 Com apenas 1 variável, seu TXOPITO IA já estará 100% funcional!**