/**
 * Serviço de Banco de Dados na Nuvem para TXOPITO IA
 * Usa Firebase Firestore para armazenamento persistente
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { logger } from './logger';
import { User, ChatSession } from '../types';

class CloudDatabase {
  private readonly COLLECTIONS = {
    USERS: 'users',
    SESSIONS: 'sessions',
    MEMORIES: 'memories',
    USER_PASSWORDS: 'user_passwords'
  };

  // === USUÁRIOS ===

  /**
   * Salva um usuário no Firestore
   */
  async saveUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, this.COLLECTIONS.USERS, user.id), {
        ...user,
        createdAt: user.createdAt ? Timestamp.fromMillis(user.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      logger.info('Usuário salvo na nuvem', 'CloudDatabase', { userId: user.id });
    } catch (error) {
      logger.error('Erro ao salvar usuário', 'CloudDatabase', { userId: user.id, error: error.message });
      throw error;
    }
  }

  /**
   * Busca um usuário por ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTIONS.USERS, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      const data = userDoc.data();
      const user: User = {
        ...data,
        id: userDoc.id,
        createdAt: data.createdAt?.toMillis() || Date.now()
      } as User;

      logger.debug('Usuário recuperado da nuvem', 'CloudDatabase', { userId });
      return user;
    } catch (error) {
      logger.error('Erro ao buscar usuário', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Busca um usuário por email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.USERS),
        where('email', '==', email.toLowerCase()),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const userDoc = querySnapshot.docs[0];
      const data = userDoc.data();
      
      const user: User = {
        ...data,
        id: userDoc.id,
        createdAt: data.createdAt?.toMillis() || Date.now()
      } as User;

      logger.debug('Usuário encontrado por email', 'CloudDatabase', { email });
      return user;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email', 'CloudDatabase', { email, error: error.message });
      throw error;
    }
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTIONS.USERS, userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      logger.info('Usuário atualizado na nuvem', 'CloudDatabase', { userId });
    } catch (error) {
      logger.error('Erro ao atualizar usuário', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  // === SENHAS ===

  /**
   * Salva hash da senha do usuário
   */
  async saveUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
    try {
      await setDoc(doc(db, this.COLLECTIONS.USER_PASSWORDS, userId), {
        userId,
        passwordHash,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      logger.info('Hash de senha salvo na nuvem', 'CloudDatabase', { userId });
    } catch (error) {
      logger.error('Erro ao salvar hash de senha', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Recupera hash da senha do usuário
   */
  async getUserPasswordHash(userId: string): Promise<string | null> {
    try {
      const passwordDoc = await getDoc(doc(db, this.COLLECTIONS.USER_PASSWORDS, userId));
      
      if (!passwordDoc.exists()) {
        return null;
      }

      const data = passwordDoc.data();
      return data.passwordHash || null;
    } catch (error) {
      logger.error('Erro ao buscar hash de senha', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  // === SESSÕES DE CHAT ===

  /**
   * Salva uma sessão de chat
   */
  async saveSession(session: ChatSession): Promise<void> {
    try {
      await setDoc(doc(db, this.COLLECTIONS.SESSIONS, session.id), {
        ...session,
        createdAt: session.createdAt ? Timestamp.fromMillis(session.createdAt) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Converte timestamps das mensagens
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: Timestamp.fromMillis(msg.timestamp)
        }))
      });
      
      logger.debug('Sessão salva na nuvem', 'CloudDatabase', { sessionId: session.id });
    } catch (error) {
      logger.error('Erro ao salvar sessão', 'CloudDatabase', { sessionId: session.id, error: error.message });
      throw error;
    }
  }

  /**
   * Busca sessões de um usuário
   */
  async getUserSessions(userId: string): Promise<ChatSession[]> {
    try {
      const q = query(
        collection(db, this.COLLECTIONS.SESSIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const sessions: ChatSession[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis() || Date.now(),
          // Converte timestamps das mensagens de volta
          messages: data.messages?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp?.toMillis() || Date.now()
          })) || []
        } as ChatSession;
      });

      logger.debug('Sessões recuperadas da nuvem', 'CloudDatabase', { userId, count: sessions.length });
      return sessions;
    } catch (error) {
      logger.error('Erro ao buscar sessões', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Deleta uma sessão
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTIONS.SESSIONS, sessionId));
      logger.info('Sessão deletada da nuvem', 'CloudDatabase', { sessionId });
    } catch (error) {
      logger.error('Erro ao deletar sessão', 'CloudDatabase', { sessionId, error: error.message });
      throw error;
    }
  }

  // === MEMÓRIAS ===

  /**
   * Salva memória de longo prazo
   */
  async saveLongTermMemory(userId: string, memory: any): Promise<void> {
    try {
      await setDoc(doc(db, this.COLLECTIONS.MEMORIES, userId), {
        userId,
        ...memory,
        updatedAt: serverTimestamp()
      });
      
      logger.debug('Memória salva na nuvem', 'CloudDatabase', { userId });
    } catch (error) {
      logger.error('Erro ao salvar memória', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Recupera memória de longo prazo
   */
  async getLongTermMemory(userId: string): Promise<any | null> {
    try {
      const memoryDoc = await getDoc(doc(db, this.COLLECTIONS.MEMORIES, userId));
      
      if (!memoryDoc.exists()) {
        return null;
      }

      const data = memoryDoc.data();
      return {
        ...data,
        updatedAt: data.updatedAt?.toMillis() || Date.now()
      };
    } catch (error) {
      logger.error('Erro ao buscar memória', 'CloudDatabase', { userId, error: error.message });
      throw error;
    }
  }

  // === UTILITÁRIOS ===

  /**
   * Verifica conectividade com o Firestore
   */
  async testConnection(): Promise<boolean> {
    try {
      // Tenta fazer uma operação simples
      const testDoc = doc(db, 'test', 'connection');
      await setDoc(testDoc, { 
        timestamp: serverTimestamp(),
        test: true 
      });
      await deleteDoc(testDoc);
      
      logger.info('Conexão com Firestore testada com sucesso', 'CloudDatabase');
      return true;
    } catch (error) {
      logger.error('Erro na conexão com Firestore', 'CloudDatabase', { error: error.message });
      return false;
    }
  }

  /**
   * Obtém estatísticas do banco
   */
  async getDatabaseStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalMemories: number;
  }> {
    try {
      const [usersSnapshot, sessionsSnapshot, memoriesSnapshot] = await Promise.all([
        getDocs(collection(db, this.COLLECTIONS.USERS)),
        getDocs(collection(db, this.COLLECTIONS.SESSIONS)),
        getDocs(collection(db, this.COLLECTIONS.MEMORIES))
      ]);

      const stats = {
        totalUsers: usersSnapshot.size,
        totalSessions: sessionsSnapshot.size,
        totalMemories: memoriesSnapshot.size
      };

      logger.info('Estatísticas do banco obtidas', 'CloudDatabase', stats);
      return stats;
    } catch (error) {
      logger.error('Erro ao obter estatísticas', 'CloudDatabase', { error: error.message });
      throw error;
    }
  }
}

export const cloudDb = new CloudDatabase();