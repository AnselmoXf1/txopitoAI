#!/usr/bin/env node

/**
 * 🔍 TXOPITO IA - Verificador de Variáveis de Ambiente
 * 
 * Este script verifica se todas as variáveis de ambiente necessárias
 * estão configuradas corretamente antes do deploy.
 */

console.log('🔍 Verificando variáveis de ambiente...\n');

// Variáveis obrigatórias
const required = [
  'VITE_GEMINI_API_KEY'
];

// Variáveis opcionais
const optional = [
  'VITE_MONGODB_URI',
  'VITE_MONGODB_DB_NAME',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_NEWS_API_KEY',
  'VITE_WEATHER_API_KEY',
  'VITE_BASE_URL'
];

let hasErrors = false;

// Verificar variáveis obrigatórias
console.log('📋 Variáveis Obrigatórias:');
required.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Configurada`);
    
    // Validações específicas
    if (varName === 'VITE_GEMINI_API_KEY') {
      if (!value.startsWith('AIzaSy')) {
        console.log(`⚠️  ${varName}: Formato pode estar incorreto (deve começar com 'AIzaSy')`);
      }
    }
  } else {
    console.log(`❌ ${varName}: NÃO CONFIGURADA`);
    hasErrors = true;
  }
});

console.log('\n📋 Variáveis Opcionais:');
optional.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: Configurada`);
    
    // Validações específicas
    if (varName === 'VITE_MONGODB_URI' && !value.startsWith('mongodb')) {
      console.log(`⚠️  ${varName}: Formato pode estar incorreto (deve começar com 'mongodb')`);
    }
  } else {
    console.log(`⚪ ${varName}: Não configurada (opcional)`);
  }
});

// Verificar se arquivo .env.local existe
const fs = require('fs');
const path = require('path');

console.log('\n📁 Arquivos de Configuração:');
const envFiles = ['.env.local', '.env', '.env.production'];
envFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}: Encontrado`);
  } else {
    console.log(`⚪ ${file}: Não encontrado`);
  }
});

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRO: Variáveis obrigatórias não configuradas!');
  console.log('\n📝 Para corrigir:');
  console.log('1. Copie .env.example para .env.local');
  console.log('2. Preencha as variáveis obrigatórias');
  console.log('3. Execute este script novamente');
  process.exit(1);
} else {
  console.log('✅ SUCESSO: Todas as variáveis obrigatórias estão configuradas!');
  console.log('\n🚀 Pronto para deploy!');
  
  // Dicas adicionais
  console.log('\n💡 Dicas:');
  console.log('• Para MongoDB: Configure VITE_MONGODB_URI para persistência');
  console.log('• Para Firebase: Configure variáveis Firebase para recursos extras');
  console.log('• Para APIs externas: Configure News/Weather APIs para funcionalidades extras');
}

console.log('\n📚 Documentação completa: GUIA_COMPLETO_DEPLOY.md');
console.log('🔗 Repositório: https://github.com/AnselmoXf1/txopitoAI.git');