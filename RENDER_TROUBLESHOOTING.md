# 🔧 Troubleshooting - Render Deploy

## ❌ Erro Atual: "vite: not found"

### 🔍 Diagnóstico
O erro indica que o Vite não está sendo encontrado durante o build no Render. Isso acontece porque:
1. As dependências não foram instaladas corretamente
2. O comando de build não está encontrando o executável do Vite
3. Pode haver conflito entre npm/yarn

### ✅ Soluções Implementadas

#### 1. Comando de Build Atualizado
**Antes:**
```bash
npm install && npm run build
```

**Agora:**
```bash
npm ci && npx vite build
```

**Por que funciona melhor:**
- `npm ci` é mais rápido e confiável que `npm install`
- `npx vite build` garante que encontra o Vite mesmo se não estiver no PATH

#### 2. Scripts Alternativos no package.json
```json
{
  "scripts": {
    "build": "vite build",
    "build:safe": "npx vite build",
    "build:render": "npm ci && npx vite build"
  }
}
```

### 🚀 Como Aplicar a Correção no Render

#### Opção 1: Atualizar Build Command (Recomendado)
1. **Render Dashboard** → Seu site
2. **Settings** → **Build & Deploy**
3. **Build Command:** Alterar para:
   ```bash
   npm ci && npx vite build
   ```
4. **Save Changes**
5. **Manual Deploy** ou aguardar próximo commit

#### Opção 2: Usar render.yaml (Automático)
O arquivo `render.yaml` já foi atualizado com o comando correto. O Render deve usar automaticamente.

#### Opção 3: Forçar Reinstalação
Se ainda não funcionar, tente:
```bash
npm cache clean --force && npm ci && npx vite build
```

### 🔍 Verificações Adicionais

#### 1. Verificar Node.js Version
**No Render:**
- Deve usar Node.js 18+ (configurado no package.json)
- Verificar logs: "Using Node.js version X.X.X"

#### 2. Verificar Dependências
**Vite deve estar em devDependencies:**
```json
{
  "devDependencies": {
    "vite": "^6.2.0"
  }
}
```

#### 3. Verificar Variáveis de Ambiente
**Mínimo necessário:**
```
VITE_GEMINI_API_KEY=AIzaSy...
```

### 📊 Logs Esperados (Sucesso)

```bash
==> Cloning from https://github.com/AnselmoXf1/txopitoAI
==> Installing dependencies with npm...
==> Using Node.js version 18.x.x
==> Running build command 'npm ci && npx vite build'
npm ci: dependencies installed
vite v6.x.x building for production...
✓ XX modules transformed.
dist/index.html                  X.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB │ gzip: XX.XX kB
✓ built in XXXXms
==> Build completed successfully
==> Deploy live at https://txopito-ia.onrender.com
```

### 🐛 Outros Erros Comuns

#### "Transform failed with 1 error"
- **Causa:** Erro de sintaxe no código
- **Solução:** Já corrigido (geminiService.ts)

#### "VITE_GEMINI_API_KEY is not defined"
- **Causa:** Variável de ambiente não configurada
- **Solução:** Adicionar no Render Dashboard

#### "Module not found"
- **Causa:** Dependência em falta
- **Solução:** Verificar package.json e npm ci

### 🔄 Próximos Passos

1. **Aguardar deploy automático** (se render.yaml foi detectado)
2. **Ou atualizar Build Command manualmente** no dashboard
3. **Monitorar logs** para confirmar sucesso
4. **Testar aplicação** após deploy

### 📞 Se Ainda Não Funcionar

#### Opções de Fallback:
1. **Usar Vercel** (alternativa mais simples)
2. **Usar Netlify** (drag & drop do build local)
3. **Build local** e upload manual

#### Comando para Build Local:
```bash
npm install
npm run build
# Upload pasta 'dist' manualmente
```

---

## ✅ Status Atual

- [x] Erro de sintaxe corrigido
- [x] Comando de build otimizado
- [x] Scripts alternativos adicionados
- [x] render.yaml atualizado
- [ ] **Aguardando novo deploy no Render**

**🎯 O próximo deploy deve funcionar com as correções implementadas!**