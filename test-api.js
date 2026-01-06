// Teste direto da API do Gemini usando fetch
const apiKey = 'AIzaSyAj6TtZO4KoNIYzHGhIXZLFuuBLSRhoT_Y';

async function testAPI() {
  console.log('🔍 Testando API do Gemini diretamente...\n');
  
  try {
    // Lista modelos disponíveis
    console.log('📋 Listando modelos disponíveis...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`\n📊 Total de modelos: ${data.models?.length || 0}\n`);
    
    if (data.models) {
      // Categoriza modelos
      const chatModels = data.models.filter(m => m.name.includes('gemini'));
      const imageModels = data.models.filter(m => m.name.includes('imagen'));
      
      console.log('💬 MODELOS DE CHAT (Gemini):');
      console.log('='.repeat(50));
      chatModels.forEach(model => {
        console.log(`📝 ${model.name}`);
        console.log(`   Nome: ${model.displayName || 'N/A'}`);
        console.log(`   Versão: ${model.version || 'N/A'}`);
        console.log(`   Descrição: ${model.description || 'Sem descrição'}`);
        console.log('');
      });
      
      console.log('🎨 MODELOS DE IMAGEM (Imagen):');
      console.log('='.repeat(50));
      imageModels.forEach(model => {
        console.log(`🖼️  ${model.name}`);
        console.log(`   Nome: ${model.displayName || 'N/A'}`);
        console.log(`   Versão: ${model.version || 'N/A'}`);
        console.log(`   Descrição: ${model.description || 'Sem descrição'}`);
        console.log('');
      });
      
      // Recomendações
      console.log('💡 RECOMENDAÇÕES PARA TXOPITO IA:');
      console.log('='.repeat(50));
      
      const recommendedChat = chatModels.find(m => m.name.includes('1.5-flash')) || chatModels[0];
      const recommendedImage = imageModels.find(m => m.name.includes('imagen-3')) || imageModels[0];
      
      if (recommendedChat) {
        console.log(`📱 Chat recomendado: ${recommendedChat.name}`);
      }
      if (recommendedImage) {
        console.log(`🎨 Imagem recomendado: ${recommendedImage.name}`);
      }
    }
    
    // Teste simples de chat
    console.log('\n🧪 Testando chat com Gemini 2.5 Flash...');
    const chatResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Olá! Responda em uma frase: Como você pode ajudar estudantes?"
          }]
        }]
      })
    });
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json();
      const text = chatData.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('✅ Resposta do chat:', text || 'Sem resposta');
    } else {
      console.log('❌ Erro no chat:', chatResponse.status, chatResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.message.includes('quota')) {
      console.log('💡 Limite de quota atingido - aguarde ou upgrade da conta');
    } else if (error.message.includes('403')) {
      console.log('💡 API key inválida ou sem permissão');
    } else if (error.message.includes('429')) {
      console.log('💡 Muitas requisições - aguarde um pouco');
    }
  }
}

testAPI();