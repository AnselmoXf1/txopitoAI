/**
 * Backup Service - TXOPITO IA
 * Sistema de backup automático e criptografado
 */

import { securityService } from './securityService';

interface BackupData {
  users: any[];
  sessions: any[];
  settings: any;
  timestamp: number;
  version: string;
  checksum: string;
}

interface BackupMetadata {
  id: string;
  timestamp: number;
  size: number;
  encrypted: boolean;
  location: string;
  checksum: string;
}

export class BackupService {
  private static readonly BACKUP_KEY = 'txopito_backup_key_2026';
  private static readonly MAX_BACKUPS = 10;
  private static backupInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializar sistema de backup automático
   */
  static initialize() {
    console.log('💾 Inicializando sistema de backup...');
    
    // Backup automático a cada 6 horas
    this.backupInterval = setInterval(() => {
      this.createAutomaticBackup();
    }, 6 * 60 * 60 * 1000);

    // Backup inicial
    this.createAutomaticBackup();

    console.log('✅ Sistema de backup ativo');
  }

  /**
   * Criar backup automático
   */
  static async createAutomaticBackup() {
    try {
      console.log('🔄 Criando backup automático...');
      
      const backupId = await this.createBackup();
      
      // Limpar backups antigos
      await this.cleanOldBackups();
      
      console.log(`✅ Backup automático criado: ${backupId}`);
    } catch (error) {
      console.error('❌ Erro no backup automático:', error);
    }
  }

  /**
   * Criar backup completo
   */
  static async createBackup(): Promise<string> {
    try {
      // Coletar dados
      const backupData: BackupData = {
        users: this.getUsers(),
        sessions: this.getSessions(),
        settings: this.getSettings(),
        timestamp: Date.now(),
        version: '1.0.0',
        checksum: ''
      };

      // Gerar checksum
      const dataString = JSON.stringify(backupData);
      backupData.checksum = await this.generateChecksum(dataString);

      // Criptografar dados
      const encryptedData = await this.encryptBackup(JSON.stringify(backupData));

      // Gerar ID único
      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Salvar backup
      await this.saveBackup(backupId, encryptedData);

      // Salvar metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: backupData.timestamp,
        size: encryptedData.length,
        encrypted: true,
        location: 'localStorage',
        checksum: backupData.checksum
      };

      await this.saveBackupMetadata(backupId, metadata);

      console.log('✅ Backup criado com sucesso:', {
        id: backupId,
        size: `${Math.round(encryptedData.length / 1024)}KB`,
        items: {
          users: backupData.users.length,
          sessions: backupData.sessions.length
        }
      });

      return backupId;
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error);
      throw error;
    }
  }

  /**
   * Restaurar backup
   */
  static async restoreBackup(backupId: string): Promise<boolean> {
    try {
      console.log(`🔄 Restaurando backup: ${backupId}`);

      // Carregar backup
      const encryptedData = await this.loadBackup(backupId);
      if (!encryptedData) {
        throw new Error('Backup não encontrado');
      }

      // Descriptografar
      const decryptedData = await this.decryptBackup(encryptedData);
      const backupData: BackupData = JSON.parse(decryptedData);

      // Verificar integridade
      const isValid = await this.verifyBackupIntegrity(backupData);
      if (!isValid) {
        throw new Error('Backup corrompido ou inválido');
      }

      // Fazer backup dos dados atuais antes de restaurar
      const currentBackupId = await this.createBackup();
      console.log(`💾 Backup atual salvo como: ${currentBackupId}`);

      // Restaurar dados
      await this.restoreUsers(backupData.users);
      await this.restoreSessions(backupData.sessions);
      await this.restoreSettings(backupData.settings);

      console.log('✅ Backup restaurado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error);
      return false;
    }
  }

  /**
   * Listar backups disponíveis
   */
  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      const backups: BackupMetadata[] = [];
      const keys = Object.keys(localStorage);

      for (const key of keys) {
        if (key.startsWith('txopito_backup_metadata_')) {
          const metadataStr = localStorage.getItem(key);
          if (metadataStr) {
            const metadata: BackupMetadata = JSON.parse(metadataStr);
            backups.push(metadata);
          }
        }
      }

      // Ordenar por timestamp (mais recente primeiro)
      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Erro ao listar backups:', error);
      return [];
    }
  }

  /**
   * Excluir backup
   */
  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      localStorage.removeItem(`txopito_backup_${backupId}`);
      localStorage.removeItem(`txopito_backup_metadata_${backupId}`);
      
      console.log(`🗑️ Backup excluído: ${backupId}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir backup:', error);
      return false;
    }
  }

  /**
   * Exportar backup para download
   */
  static async exportBackup(backupId: string): Promise<void> {
    try {
      const encryptedData = await this.loadBackup(backupId);
      if (!encryptedData) {
        throw new Error('Backup não encontrado');
      }

      const metadata = await this.loadBackupMetadata(backupId);
      const exportData = {
        id: backupId,
        data: encryptedData,
        metadata: metadata,
        exportedAt: Date.now()
      };

      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `txopito_backup_${backupId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log(`📥 Backup exportado: ${backupId}`);
    } catch (error) {
      console.error('❌ Erro ao exportar backup:', error);
      throw error;
    }
  }

  /**
   * Importar backup de arquivo
   */
  static async importBackup(file: File): Promise<string> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.id || !importData.data || !importData.metadata) {
        throw new Error('Arquivo de backup inválido');
      }

      // Salvar backup importado
      await this.saveBackup(importData.id, importData.data);
      await this.saveBackupMetadata(importData.id, importData.metadata);

      console.log(`📤 Backup importado: ${importData.id}`);
      return importData.id;
    } catch (error) {
      console.error('❌ Erro ao importar backup:', error);
      throw error;
    }
  }

  /**
   * Métodos privados
   */
  private static getUsers(): any[] {
    try {
      const users = localStorage.getItem('txopito_users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private static getSessions(): any[] {
    try {
      const sessions: any[] = [];
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        if (key.startsWith('txopito_session_')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            sessions.push(JSON.parse(sessionData));
          }
        }
      }
      
      return sessions;
    } catch {
      return [];
    }
  }

  private static getSettings(): any {
    try {
      const settings = localStorage.getItem('txopito_settings');
      return settings ? JSON.parse(settings) : {};
    } catch {
      return {};
    }
  }

  private static async encryptBackup(data: string): Promise<string> {
    try {
      return await securityService.encryptSensitiveData(data);
    } catch (error) {
      console.error('Erro na criptografia do backup:', error);
      throw error;
    }
  }

  private static async decryptBackup(encryptedData: string): Promise<string> {
    try {
      return await securityService.decryptSensitiveData(encryptedData);
    } catch (error) {
      console.error('Erro na descriptografia do backup:', error);
      throw error;
    }
  }

  private static async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static async verifyBackupIntegrity(backupData: BackupData): Promise<boolean> {
    try {
      const dataWithoutChecksum = { ...backupData, checksum: '' };
      const dataString = JSON.stringify(dataWithoutChecksum);
      const calculatedChecksum = await this.generateChecksum(dataString);
      
      return calculatedChecksum === backupData.checksum;
    } catch {
      return false;
    }
  }

  private static async saveBackup(backupId: string, data: string): Promise<void> {
    localStorage.setItem(`txopito_backup_${backupId}`, data);
  }

  private static async loadBackup(backupId: string): Promise<string | null> {
    return localStorage.getItem(`txopito_backup_${backupId}`);
  }

  private static async saveBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    localStorage.setItem(`txopito_backup_metadata_${backupId}`, JSON.stringify(metadata));
  }

  private static async loadBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const metadataStr = localStorage.getItem(`txopito_backup_metadata_${backupId}`);
    return metadataStr ? JSON.parse(metadataStr) : null;
  }

  private static async restoreUsers(users: any[]): Promise<void> {
    localStorage.setItem('txopito_users', JSON.stringify(users));
  }

  private static async restoreSessions(sessions: any[]): Promise<void> {
    // Limpar sessões existentes
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith('txopito_session_')) {
        localStorage.removeItem(key);
      }
    }

    // Restaurar sessões
    for (const session of sessions) {
      localStorage.setItem(`txopito_session_${session.id}`, JSON.stringify(session));
    }
  }

  private static async restoreSettings(settings: any): Promise<void> {
    localStorage.setItem('txopito_settings', JSON.stringify(settings));
  }

  private static async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      if (backups.length > this.MAX_BACKUPS) {
        const backupsToDelete = backups.slice(this.MAX_BACKUPS);
        
        for (const backup of backupsToDelete) {
          await this.deleteBackup(backup.id);
        }
        
        console.log(`🧹 ${backupsToDelete.length} backups antigos removidos`);
      }
    } catch (error) {
      console.error('❌ Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Parar sistema de backup
   */
  static stop() {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      console.log('⏹️ Sistema de backup parado');
    }
  }

  /**
   * Obter estatísticas de backup
   */
  static async getBackupStats(): Promise<any> {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        totalBackups: backups.length,
        totalSize: totalSize,
        totalSizeFormatted: `${Math.round(totalSize / 1024)}KB`,
        oldestBackup: backups.length > 0 ? new Date(backups[backups.length - 1].timestamp) : null,
        newestBackup: backups.length > 0 ? new Date(backups[0].timestamp) : null,
        averageSize: backups.length > 0 ? Math.round(totalSize / backups.length) : 0
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return null;
    }
  }
}

// Expor no console para debug
if (typeof window !== 'undefined') {
  (window as any).BackupService = BackupService;
}

export default BackupService;