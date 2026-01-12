/**
 * User Duplication Service - TXOPITO IA
 * Gerencia e previne contas duplicadas com mesmo email
 */

import { User } from '../types';

export interface DuplicationReport {
  hasDuplicates: boolean;
  duplicateGroups: {
    email: string;
    users: User[];
    providers: string[];
  }[];
  totalUsers: number;
  uniqueEmails: number;
}

export class UserDuplicationService {
  /**
   * Verifica se há contas duplicadas no sistema
   */
  static checkForDuplicates(): DuplicationReport {
    const users = this.getStoredUsers();
    const emailGroups = new Map<string, User[]>();
    
    // Agrupa usuários por email
    users.forEach(user => {
      if (user.email) {
        const email = user.email.toLowerCase();
        if (!emailGroups.has(email)) {
          emailGroups.set(email, []);
        }
        emailGroups.get(email)!.push(user);
      }
    });
    
    // Identifica grupos com duplicatas
    const duplicateGroups = Array.from(emailGroups.entries())
      .filter(([email, users]) => users.length > 1)
      .map(([email, users]) => ({
        email,
        users,
        providers: users.map(u => this.getUserProvider(u))
      }));
    
    return {
      hasDuplicates: duplicateGroups.length > 0,
      duplicateGroups,
      totalUsers: users.length,
      uniqueEmails: emailGroups.size
    };
  }
  
  /**
   * Identifica o provedor de autenticação do usuário
   */
  private static getUserProvider(user: User): string {
    if ((user as any).googleId) return 'Google';
    if ((user as any).githubId) return 'GitHub';
    return 'Local';
  }
  
  /**
   * Mescla contas duplicadas mantendo a mais recente
   */
  static mergeDuplicateAccounts(email: string): User | null {
    const users = this.getStoredUsers();
    const duplicates = users.filter(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (duplicates.length <= 1) {
      console.log('Nenhuma duplicata encontrada para:', email);
      return null;
    }
    
    console.log(`🔄 Mesclando ${duplicates.length} contas duplicadas para:`, email);
    
    // Ordena por data de criação (mais recente primeiro)
    duplicates.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    const primaryUser = duplicates[0];
    const secondaryUsers = duplicates.slice(1);
    
    // Mescla dados dos usuários secundários no primário
    const mergedUser: User = {
      ...primaryUser,
      // Mantém o XP mais alto
      xp: Math.max(primaryUser.xp || 0, ...secondaryUsers.map(u => u.xp || 0)),
      // Mantém o nível mais alto
      level: Math.max(primaryUser.level || 1, ...secondaryUsers.map(u => u.level || 1)),
      // Preserva IDs de provedores
      ...(primaryUser as any).googleId ? {} : { googleId: secondaryUsers.find(u => (u as any).googleId)?.(u as any).googleId },
      ...(primaryUser as any).githubId ? {} : { githubId: secondaryUsers.find(u => (u as any).githubId)?.(u as any).githubId },
      // Atualiza timestamp
      updatedAt: Date.now()
    };
    
    // Remove usuários duplicados
    const filteredUsers = users.filter(u => !secondaryUsers.some(s => s.id === u.id));
    
    // Atualiza o usuário primário
    const primaryIndex = filteredUsers.findIndex(u => u.id === primaryUser.id);
    if (primaryIndex >= 0) {
      filteredUsers[primaryIndex] = mergedUser;
    }
    
    // Salva a lista atualizada
    this.saveUsers(filteredUsers);
    
    console.log('✅ Contas mescladas com sucesso:', {
      primaryId: mergedUser.id,
      removedIds: secondaryUsers.map(u => u.id),
      finalXP: mergedUser.xp,
      finalLevel: mergedUser.level
    });
    
    return mergedUser;
  }
  
  /**
   * Remove todas as contas duplicadas automaticamente
   */
  static cleanupAllDuplicates(): {
    cleaned: number;
    mergedAccounts: string[];
  } {
    const report = this.checkForDuplicates();
    const mergedAccounts: string[] = [];
    
    if (!report.hasDuplicates) {
      console.log('✅ Nenhuma conta duplicada encontrada');
      return { cleaned: 0, mergedAccounts: [] };
    }
    
    console.log(`🧹 Limpando ${report.duplicateGroups.length} grupos de contas duplicadas...`);
    
    let totalCleaned = 0;
    
    report.duplicateGroups.forEach(group => {
      const merged = this.mergeDuplicateAccounts(group.email);
      if (merged) {
        mergedAccounts.push(group.email);
        totalCleaned += group.users.length - 1; // -1 porque mantemos uma conta
      }
    });
    
    console.log(`✅ Limpeza concluída: ${totalCleaned} contas duplicadas removidas`);
    
    return {
      cleaned: totalCleaned,
      mergedAccounts
    };
  }
  
  /**
   * Gera relatório detalhado de duplicatas
   */
  static generateDuplicationReport(): string {
    const report = this.checkForDuplicates();
    
    let output = '# 📊 RELATÓRIO DE CONTAS DUPLICADAS - TXOPITO IA\n\n';
    output += `**Total de usuários:** ${report.totalUsers}\n`;
    output += `**Emails únicos:** ${report.uniqueEmails}\n`;
    output += `**Contas duplicadas:** ${report.hasDuplicates ? 'SIM' : 'NÃO'}\n\n`;
    
    if (report.hasDuplicates) {
      output += `## 🔍 Grupos Duplicados (${report.duplicateGroups.length})\n\n`;
      
      report.duplicateGroups.forEach((group, index) => {
        output += `### ${index + 1}. ${group.email}\n`;
        output += `**Provedores:** ${group.providers.join(', ')}\n`;
        output += `**Contas:** ${group.users.length}\n\n`;
        
        group.users.forEach((user, userIndex) => {
          const provider = this.getUserProvider(user);
          output += `- **${userIndex + 1}.** ${user.name} (${provider})\n`;
          output += `  - ID: ${user.id}\n`;
          output += `  - XP: ${user.xp || 0} | Nível: ${user.level || 1}\n`;
          output += `  - Criado: ${new Date(user.createdAt || 0).toLocaleString()}\n\n`;
        });
      });
      
      output += '## 🛠️ Ações Recomendadas\n\n';
      output += '1. Execute `UserDuplicationService.cleanupAllDuplicates()` para mesclar automaticamente\n';
      output += '2. Ou mescle manualmente com `UserDuplicationService.mergeDuplicateAccounts(email)`\n';
    } else {
      output += '✅ **Nenhuma conta duplicada encontrada!**\n';
    }
    
    return output;
  }
  
  /**
   * Helpers para localStorage
   */
  private static getStoredUsers(): User[] {
    try {
      const data = localStorage.getItem('txopito_users');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  private static saveUsers(users: User[]): void {
    try {
      localStorage.setItem('txopito_users', JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
    }
  }
}

// Expõe no console para debug
if (typeof window !== 'undefined') {
  (window as any).UserDuplicationService = UserDuplicationService;
}

export default UserDuplicationService;