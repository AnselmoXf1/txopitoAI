/**
 * Script de Teste - Conexão MongoDB
 * Testa a conectividade com o cluster txopitoAdmin
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'txopito_ia_db';

async function testConnection() {
  console.log('🔄 Testando conexão com MongoDB Atlas...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI não configurada no .env.local');
    process.exit(1);
  }

  if (MONGODB_URI.includes('<txopitoAdmin>')) {
    console.error('❌ Substitua <txopitoAdmin> pela senha real no MONGODB_URI');
    process.exit(1);
  }

  let client;
  
  try {
    console.log('📡 Conectando ao cluster txopitoAdmin...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testa o banco de dados
    const db = client.db(MONGODB_DB_NAME);
    console.log(`📊 Banco de dados: ${MONGODB_DB_NAME}`);
    
    // Lista coleções existentes
    const collections = await db.listCollections().toArray();
    console.log(`📁 Coleções encontradas: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('   Coleções:');
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    // Testa operação básica
    const testCollection = db.collection('connection_test');
    const testDoc = {
      timestamp: new Date(),
      message: 'Teste de conexão TXOPITO IA',
      version: '1.0'
    };
    
    console.log('\n🧪 Testando operação de escrita...');
    const insertResult = await testCollection.insertOne(testDoc);
    console.log(`✅ Documento inserido com ID: ${insertResult.insertedId}`);
    
    // Testa operação de leitura
    console.log('📖 Testando operação de leitura...');
    const foundDoc = await testCollection.findOne({ _id: insertResult.insertedId });
    console.log(`✅ Documento encontrado: ${foundDoc.message}`);
    
    // Remove documento de teste
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('🗑️ Documento de teste removido');
    
    // Testa ping
    console.log('\n🏓 Testando ping...');
    const pingResult = await db.admin().ping();
    console.log('✅ Ping bem-sucedido:', pingResult);
    
    console.log('\n🎉 Todos os testes passaram! MongoDB está pronto para uso.');
    
  } catch (error) {
    console.error('\n❌ Erro na conexão:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('💡 Dica: Verifique se a senha está correta no MONGODB_URI');
    } else if (error.message.includes('network')) {
      console.error('💡 Dica: Verifique sua conexão com a internet');
    } else if (error.message.includes('timeout')) {
      console.error('💡 Dica: O cluster pode estar pausado ou indisponível');
    }
    
    process.exit(1);
    
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executa o teste
testConnection().catch(console.error);