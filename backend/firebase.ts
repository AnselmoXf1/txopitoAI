/**
 * Configuração do Firebase para TXOPITO IA
 * Banco de dados na nuvem usando Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { logger } from './logger';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAj6TtZO4KoNIYzHGhIXZLFuuBLSRhoT_Y",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "txopito-ia.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "txopito-ia",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "txopito-ia.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firestore
export const db = getFirestore(app);

// Inicializa Auth
export const auth = getAuth(app);

// Conecta ao emulador em desenvolvimento (opcional)
if (process.env.NODE_ENV === 'development' && process.env.USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    logger.info('Conectado ao emulador do Firestore', 'Firebase');
  } catch (error) {
    logger.warn('Não foi possível conectar ao emulador', 'Firebase', { error: error.message });
  }
}

logger.info('Firebase inicializado com sucesso', 'Firebase', {
  projectId: firebaseConfig.projectId,
  environment: process.env.NODE_ENV
});

export default app;