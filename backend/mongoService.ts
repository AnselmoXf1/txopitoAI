/**
 * Serviço MongoDB - TXOPITO IA
 * Gerencia conexão e operações com MongoDB Atlas
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { logger } from './logger';
import { User, ChatSession, Message } from '../types';

interface MongoConfig {
  uri: string;
  dbName: string;
}

interface UserDocument extends Omit<User, 'id'> {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionDocument extends Omit<ChatSession, 'id'> {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryDocument {
  _id?: ObjectId;
  userId: string;
  domainId: string;
  memories: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class MongoService {
  private static instance: MongoService;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private config: MongoConfig;
  private isConnected = false;

  private constructor() {
    this.config = {
      uri: process.env.MONGODB_URI || '',
      dbName: process.env.MONGODB_DB_NAME || 'txopito_ia_db'
    };
  }

  static getInstance(): MongoService {
    if (!MongoService.instance) {
      MongoService.instance = new MongoService();
    }
    return MongoService.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      if (!this.config.uri) {
        throw new Error('MONGODB_URI não configurada');
      }

      // Remove <db_password> placeholder se existir
      if (this.config.uri.includes('<db_password>')) {
        throw new Error('Configure a senha do MongoDB na variável MONGODB_URI');
      }

      this.client = new MongoClient(this.config.uri);
      await this.client.connect();
      this.db = this.client.db(this.config.dbName);
      this.isConnected = true;

      logger.info('Conectado ao MongoDB Atlas', 'MongoService', {
        database: this.config.dbName
      });

      // Criar índices necessários
      await this.createIndexes();

    } catch (error) {
      logger.error('Erro ao conectar com MongoDB', 'MongoService', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      logger.info('Desconectado do MongoDB', 'MongoService');
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Índices para usuários
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      
      // Índices para sessões
      await this.db.collection('sessions').createIndex({ userId: 1 });
      await this.db.collection('sessions').createIndex({ createdAt: -1 });
      
      // Índices para memórias
      await this.db.collection('memories').createIndex({ userId: 1, domainId: 1 });

      logger.info('Índices MongoDB criados', 'MongoService');
    } catch (error) {
      logger.warn('Erro ao criar índices', 'MongoService', { error });
    }
  }

  private getCollection<T = any>(name: string): Collection<T> {
    if (!this.db) {
      throw new Error('MongoDB não conectado');
    }
    return this.db.collection<T>(name);
  }

  // === OPERAÇÕES DE USUÁRIO ===

  async saveUser(user: User): Promise<User> {
    await this.connect();
    
    const userDoc: UserDocument = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const collection = this.getCollection<UserDocument>('users');
    
    try {
      const result = await collection.insertOne(userDoc);
      
      logger.info('Usuário salvo no MongoDB', 'MongoService', {
        userId: result.insertedId.toString(),
        email: user.email
      });

      return {
        ...user,
        id: result.insertedId.toString()
      };
    } catch (error: any) {
      if (error.code === 11000) { // Duplicate key error
        throw new Error('Email já cadastrado');
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    await this.connect();
    
    const collection = this.getCollection<UserDocument>('users');
    const userDoc = await collection.findOne({ email });
    
    if (!userDoc) return null;

    return {
      id: userDoc._id!.toString(),
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      level: userDoc.level,
      xp: userDoc.xp,
      preferences: userDoc.preferences,
      passwordHash: userDoc.passwordHash
    };
  }

  async getUserById(id: string): Promise<User | null> {
    await this.connect();
    
    const collection = this.getCollection<UserDocument>('users');
    const userDoc = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!userDoc) return null;

    return {
      id: userDoc._id!.toString(),
      name: userDoc.name,
      email: userDoc.email,
      avatar: userDoc.avatar,
      level: userDoc.level,
      xp: userDoc.xp,
      preferences: userDoc.preferences,
      passwordHash: userDoc.passwordHash
    };
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await this.connect();
    
    const collection = this.getCollection<UserDocument>('users');
    
    const updateDoc = {
      ...updates,
      updatedAt: new Date()
    };
    delete updateDoc.id; // Remove id do update

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: result._id!.toString(),
      name: result.name,
      email: result.email,
      avatar: result.avatar,
      level: result.level,
      xp: result.xp,
      preferences: result.preferences,
      passwordHash: result.passwordHash
    };
  }

  // === OPERAÇÕES DE SESSÃO ===

  async saveSession(session: ChatSession): Promise<void> {
    await this.connect();
    
    const collection = this.getCollection<SessionDocument>('sessions');
    
    const sessionDoc: SessionDocument = {
      ...session,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.replaceOne(
      { id: session.id },
      sessionDoc,
      { upsert: true }
    );

    logger.info('Sessão salva no MongoDB', 'MongoService', {
      sessionId: session.id,
      userId: session.userId
    });
  }

  async getUserSessions(userId: string): Promise<ChatSession[]> {
    await this.connect();
    
    const collection = this.getCollection<SessionDocument>('sessions');
    const sessions = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return sessions.map(session => ({
      id: session.id,
      title: session.title,
      domainId: session.domainId,
      messages: session.messages,
      createdAt: session.createdAt.getTime(),
      userId: session.userId
    }));
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.connect();
    
    const collection = this.getCollection<SessionDocument>('sessions');
    await collection.deleteOne({ id: sessionId });

    logger.info('Sessão deletada do MongoDB', 'MongoService', { sessionId });
  }

  // === OPERAÇÕES DE MEMÓRIA ===

  async saveMemory(userId: string, domainId: string, memories: any[]): Promise<void> {
    await this.connect();
    
    const collection = this.getCollection<MemoryDocument>('memories');
    
    const memoryDoc: MemoryDocument = {
      userId,
      domainId,
      memories,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await collection.replaceOne(
      { userId, domainId },
      memoryDoc,
      { upsert: true }
    );

    logger.info('Memória salva no MongoDB', 'MongoService', {
      userId,
      domainId,
      memoriesCount: memories.length
    });
  }

  async getMemory(userId: string, domainId: string): Promise<any[] | null> {
    await this.connect();
    
    const collection = this.getCollection<MemoryDocument>('memories');
    const memoryDoc = await collection.findOne({ userId, domainId });
    
    return memoryDoc ? memoryDoc.memories : null;
  }

  // === OPERAÇÕES DE ESTATÍSTICAS ===

  async getStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalMemories: number;
    activeUsers: number;
  }> {
    await this.connect();
    
    const [totalUsers, totalSessions, totalMemories, activeUsers] = await Promise.all([
      this.getCollection('users').countDocuments(),
      this.getCollection('sessions').countDocuments(),
      this.getCollection('memories').countDocuments(),
      this.getCollection('sessions').countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Últimos 7 dias
      })
    ]);

    return {
      totalUsers,
      totalSessions,
      totalMemories,
      activeUsers
    };
  }

  // === HEALTH CHECK ===

  async healthCheck(): Promise<boolean> {
    try {
      await this.connect();
      await this.db!.admin().ping();
      return true;
    } catch (error) {
      logger.error('Health check MongoDB falhou', 'MongoService', { error });
      return false;
    }
  }
}

// Instância singleton
export const mongoService = MongoService.getInstance();