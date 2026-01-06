// Lista todos os modelos disponíveis na API do Gemini
import { GoogleGenAI } from "@google/genai";

const apiKey = 'AIzaSyAj6TtZO4KoNIYzHGhIXZLFuuBLSRhoT_Y';

async function listModels() {
  console.log('🔍 Listando modelos disponíveis na API do Gemini...\n');
  
  try {
    const genAI = new GoogleGenAI({ apiKey });
    
    // Lista todos os modelos
    const models = await genAI.models.list();
    
    console.log(`📊 Total de modelos encontrados: ${models.length}\n`);
    
    // Categoriza os modelos
    const chatModels = [];
    const imageModels = [];
    const otherModels = [];
    
    models.forEach(model => {
      const name = model.name;
      const displayName = model.displayName || name;
      const description = model.description || 'Sem descrição';
      
      if (name.includes('gemini')) {
        chatModels.push({ name, displayName, description });
      } else if (name.includes('imagen')) {
        imageModels.push({ name, displayName, description });
      } else {
        otherModels.push({ name, displayName, description });
      }
    });
    
    // Exibe modelos de chat
    if (chatModels.length > 0) {
      console.log('💬 MODELOS DE CHAT (Gemini):');
      console.log('=' .repeat(50));
      chatModels.forEach(model => {
        console.log(`📝 ${model.name}`);
        console.log(`   Nome: ${model.displayName}`);
        console.log(`   Descrição: ${model.description}`);
        console.log('');
      });
    }
    
    // Exibe modelos de imagem
    if (imageModels.length > 0) {
      console.log('🎨 MODELOS DE GERAÇÃO DE IMAGEM (Imagen):');
      console.log('=' .repeat(50));
      imageModels.forEach(model => {
        console.log(`🖼️  ${model.name}`);
        console.log(`   Nome: ${model.displayName}`);
        console.log(`   Descrição: ${model.description}`);
        console.log('');
      });
    }
    
    // Exibe outros modelos
    if (otherModels.length > 0) {
      console.log('🔧 OUTROS MODELOS:');
      console.log('=' .repeat(50));
      otherModels.forEach(model => {
        console.log(`⚙️  ${model.name}`);
        console.log(`   Nome: ${model.displayName}`);
        console.log(`   Descrição: ${model.description}`);
        console.log('');
      });
    }
    
    // Recomendações
    console.log('💡 RECOMENDAÇÕES PARA TXOPITO IA:');
    console.log('=' .repeat(50));
    console.log('📱 Para Chat: gemini-1.5-flash (rápido e eficiente)');
    console.log('🎨 Para Imagens: imagen-3.0-generate-001 (melhor qualidade)');
    console.log('⚡ Alternativa Chat: gemini-1.5-pro (mais avançado, mas mais lento)');
    
  } catch (error) {
    console.error('❌ Erro ao listar modelos:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Verifique se a API key está correta');
    } else if (error.message.includes('quota')) {
      console.log('💡 Limite de quota atingido - tente novamente mais tarde');
    } else if (error.message.includes('permission')) {
      console.log('💡 Sem permissão para acessar alguns modelos');
    }
  }
}

listModels();