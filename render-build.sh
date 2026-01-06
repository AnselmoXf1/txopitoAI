#!/bin/bash

# Script de build otimizado para Render
echo "🚀 Iniciando build para Render..."

# Verificar versão do Node
echo "📋 Node.js version: $(node --version)"
echo "📋 NPM version: $(npm --version)"

# Limpar cache anterior
echo "🧹 Limpando cache..."
rm -rf node_modules/.vite
rm -rf dist

# Instalar dependências com npm ci (mais rápido e confiável)
echo "📦 Instalando dependências..."
npm ci --production=false --silent

# Verificar se Vite foi instalado
echo "🔍 Verificando instalação do Vite..."
if [ -f "node_modules/.bin/vite" ]; then
    echo "✅ Vite encontrado em node_modules/.bin/vite"
else
    echo "❌ Vite não encontrado, tentando instalar..."
    npm install vite --save-dev
fi

# Verificar se as variáveis de ambiente estão definidas
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$VITE_GEMINI_API_KEY" ]; then
    echo "⚠️  VITE_GEMINI_API_KEY não definida"
else
    echo "✅ VITE_GEMINI_API_KEY configurada"
fi

# Build da aplicação usando npx para garantir que encontre o vite
echo "🔨 Executando build..."
npx vite build

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