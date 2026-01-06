# 🚀 Guia de Deploy - TXOPITO IA

## Opções de Deploy Recomendadas

### 1. **Vercel** (Recomendado - Mais Fácil)

#### Pré-requisitos:
- Conta no GitHub
- Conta na Vercel (gratuita)

#### Passos:
1. **Suba o código para o GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/txopito-ia.git
   git push -u origin main
   ```

2. **Deploy na Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Conecte sua conta GitHub
   - Clique em "New Project"
   - Selecione o repositório `txopito-ia`
   - Configure as variáveis de ambiente:
     - `GEMINI_API_KEY`: Sua chave da API do Gemini
     - `MONGODB_URI`: String de conexão do MongoDB (se usando)
   - Clique em "Deploy"

#### Vantagens:
- Deploy automático a cada push
- HTTPS gratuito
- CDN global
- Zero configuração

---

### 2. **Netlify** (Alternativa Excelente)

#### Passos:
1. **Build local (se as dependências funcionarem):**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Arraste a pasta `dist` para o deploy
   - Ou conecte com GitHub (similar à Vercel)

#### Configuração de Variáveis:
- Site Settings → Environment Variables
- Adicione `GEMINI_API_KEY`

---

### 3. **GitHub Pages** (Gratuito)

#### Configuração:
1. **Instale gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Adicione ao package.json:**
   ```json
   {
     "homepage": "https://SEU_USUARIO.github.io/txopito-ia",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

---

### 4. **Railway** (Para Full-Stack)

Se você quiser hospedar também o backend:

1. **Conecte com GitHub**
2. **Configure variáveis de ambiente**
3. **Deploy automático**

---

## 🔧 Preparação para Deploy

### 1. Verificar Variáveis de Ambiente

Crie um arquivo `.env.production`:

```env
VITE_GEMINI_API_KEY=sua_chave_aqui
VITE_MONGODB_URI=sua_string_mongodb_aqui
```

### 2. Otimizar Build

Adicione ao `vite.config.ts`:

```typescript
export default defineConfig(({ mode }) => {
  return {
    // ... configuração existente
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            gemini: ['@google/genai']
          }
        }
      }
    }
  };
});
```

### 3. Configurar Redirects (para SPAs)

Crie `public/_redirects` (Netlify) ou `vercel.json` (Vercel):

**Para Netlify (`public/_redirects`):**
```
/*    /index.html   200
```

**Para Vercel (`vercel.json`):**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🚀 Deploy Rápido (Sem instalar dependências localmente)

### Opção 1: GitHub Codespaces
1. Abra o repositório no GitHub
2. Clique em "Code" → "Codespaces" → "Create codespace"
3. Execute no terminal do Codespace:
   ```bash
   npm install
   npm run build
   ```
4. Baixe a pasta `dist` e faça upload manual

### Opção 2: Replit
1. Importe o projeto no Replit
2. Execute `npm install && npm run build`
3. Deploy direto do Replit

---

## 📋 Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Código commitado no Git
- [ ] Build testado (se possível)
- [ ] Redirects configurados para SPA
- [ ] API keys seguras (não expostas no código)

---

## 🔍 Troubleshooting

### Erro de Build:
- Use GitHub Actions ou Codespaces para build
- Verifique se todas as variáveis estão definidas

### Erro 404 em rotas:
- Configure redirects para SPA
- Verifique se o roteamento está correto

### API não funciona:
- Verifique CORS
- Confirme variáveis de ambiente
- Teste endpoints separadamente

---

## 💡 Recomendação Final

**Para deploy imediato:** Use Vercel ou Netlify conectando diretamente com GitHub. Eles farão o build automaticamente e resolverão os problemas de dependências que estamos enfrentando localmente.

O deploy em produção geralmente resolve problemas de dependências que ocorrem em ambientes de desenvolvimento Windows.