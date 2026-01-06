// Teste simples da API do Gemini
import { GoogleGenAI } from "@google/genai";

const apiKey = 'AIzaSyAj6TtZO4KoNIYzHGhIXZLFuuBLSRhoT_Y';

async function testGemini() {
  console.log('🧪 Testando conexão com Gemini API...');
  
  try {
    const genAI = new GoogleGenAI({ apiKey });
    
    // Teste básico de chat
    console.log('📝 Testando chat com Gemini 2.5 Flash...');
    const chat = genAI.chats.create({
      model: 'gemini-2.0-flash-exp', // Modelo mais recente
      config: {
        systemInstruction: "Você é o TXOPITO IA, um assistente educacional. Responda de forma breve e educativa."
      }
    });
    
    const result = await chat.sendMessage({ 
      message: "Olá! Como você funciona?" 
    });
    
    console.log('✅ Resposta do chat:', result.text);
    
    // Teste de geração de imagem
    console.log('\n🎨 Testando geração de imagem...');
    const imageResult = await genAI.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'Um robô amigável ensinando matemática para crianças',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      }
    });
    
    if (imageResult.generatedImages?.[0]?.image?.imageBytes) {
      console.log('✅ Imagem gerada com sucesso! Tamanho:', imageResult.generatedImages[0].image.imageBytes.length, 'bytes');
    } else {
      console.log('❌ Falha na geração de imagem');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    
    if (error.message.includes('API_KEY')) {
      console.log('💡 Verifique se a API key está correta');
    } else if (error.message.includes('quota')) {
      console.log('💡 Limite de quota atingido');
    } else if (error.message.includes('safety')) {
      console.log('💡 Conteúdo rejeitado por políticas de segurança');
    }
  }
}

testGemini();