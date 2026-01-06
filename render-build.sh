#!/bin/bash

# Script de build otimizado para Render
echo "🚀 Iniciando build para Render..."

# Limpar cache anterior
echo "🧹 Limpando cache..."
rm -rf node_modules/.vite
rm -rf dist

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production=false

# Verificar se as variáveis de ambiente estão definidas
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$VITE_GEMINI_API_KEY" ]; then
    echo "⚠️  VITE_GEMINI_API_KEY não definida"
else
    echo "✅ VITE_GEMINI_API_KEY configurada"
fi

# Build da aplicação
echo "🔨 Executando build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em /dist"
    ls -la dist/
else
    echo "❌ Erro no build - pasta dist não foi criada"
    exit 1
fi

echo "🎉 Deploy pronto para o Render!"