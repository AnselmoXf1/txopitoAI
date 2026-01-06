# ✅ Checklist Deploy Render - TXOPITO IA

## 📋 Pré-Deploy

- [ ] **Código commitado no GitHub**
  ```bash
  git add .
  git commit -m "Preparação para deploy Render"
  git push origin main
  ```

- [ ] **Chave da API do Gemini disponível**
  - Formato: `AIzaSy...`
  - Será configurada como `VITE_GEMINI_API_KEY`

- [ ] **Arquivos de configuração criados:**
  - [ ] `public/_redirects` ✅
  - [ ] `render.yaml` ✅
  - [ ] `vite.config.ts` otimizado ✅

## 🚀 Deploy no Render

### 1. Criar Conta e Conectar GitHub
- [ ] Acesse [render.com](https://render.com)
- [ ] Faça login com GitHub
- [ ] Autorize acesso aos repositórios

### 2. Criar Static Site
- [ ] Clique em "New +" → "Static Site"
- [ ] Selecione repositório `txopito-ia`
- [ ] Branch: `main`

### 3. Configurações de Build
```
Name: txopito-ia
Build Command: npm install && npm run build
Publish Directory: dist
```

### 4. Variáveis de Ambiente
- [ ] `VITE_GEMINI_API_KEY` = [Sua chave da API]
- [ ] `NODE_VERSION` = 18 (opcional)

### 5. Deploy
- [ ] Clique em "Create Static Site"
- [ ] Aguarde o build (5-10 minutos)
- [ ] Verifique logs em caso de erro

## 🔍 Pós-Deploy

### Verificações
- [ ] **Site carrega corretamente**
- [ ] **Funcionalidades principais funcionam**
- [ ] **API do Gemini conecta**
- [ ] **Rotas SPA funcionam** (teste navegação)

### URL Final
Sua aplicação estará disponível em:
```
https://txopito-ia.onrender.com
```
(ou nome personalizado que você escolher)

## 🐛 Se Algo Der Errado

### Build Falha
1. **Verifique logs no dashboard Render**
2. **Teste build local:**
   ```bash
   npm install
   npm run build
   ```
3. **Problemas comuns:**
   - Dependências em falta
   - Variáveis de ambiente incorretas
   - Erros de TypeScript

### Site Não Carrega
1. **Verifique se `dist` foi gerado**
2. **Confirme `public/_redirects` existe**
3. **Teste com `npm run preview` localmente**

### API Não Funciona
1. **Verifique `VITE_GEMINI_API_KEY` no dashboard**
2. **Confirme que a chave é válida**
3. **Teste API separadamente**

## 🔄 Atualizações Futuras

Para atualizar o site:
1. **Faça alterações no código**
2. **Commit e push:**
   ```bash
   git add .
   git commit -m "Atualização: [descrição]"
   git push origin main
   ```
3. **Render fará deploy automático**

## 📞 Suporte

- **Documentação Render:** [docs.render.com](https://docs.render.com)
- **Status Render:** [status.render.com](https://status.render.com)
- **Logs detalhados:** Dashboard → Seu serviço → Logs

---

**🎉 Pronto! Seu TXOPITO IA estará online em poucos minutos!**