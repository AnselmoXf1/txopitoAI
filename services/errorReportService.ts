/**
 * Error Report Service - TXOPITO IA
 * Serviço para gerenciar relatórios de erro dos usuários
 */

import { ErrorReport, ErrorType, ErrorPriority, DomainId } from '../constants';

export class ErrorReportService {
  private static readonly STORAGE_KEY = 'txopito_error_reports';

  /**
   * Cria um novo relatório de erro
   */
  static async createReport(reportData: {
    userId: string;
    userEmail?: string;
    type: ErrorType;
    priority: ErrorPriority;
    title: string;
    description: string;
    steps?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    domain?: DomainId;
    sessionId?: string;
    conversationId?: string;
  }): Promise<ErrorReport> {
    const report: ErrorReport = {
      id: this.generateId(),
      ...reportData,
      timestamp: new Date(),
      browserInfo: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      },
      systemInfo: {
        domain: reportData.domain,
        sessionId: reportData.sessionId,
        conversationId: reportData.conversationId
      },
      status: 'open'
    };

    // Salvar no localStorage
    const reports = this.getAllReports();
    reports.push(report);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));

    // Log para admin
    console.log('🐛 Novo relatório de erro criado:', report);

    return report;
  }

  /**
   * Busca todos os relatórios
   */
  static getAllReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const reports = JSON.parse(stored);
      return reports.map((report: any) => ({
        ...report,
        timestamp: new Date(report.timestamp),
        resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : undefined
      }));
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      return [];
    }
  }

  /**
   * Busca relatórios por usuário
   */
  static getReportsByUser(userId: string): ErrorReport[] {
    return this.getAllReports().filter(report => report.userId === userId);
  }

  /**
   * Busca relatórios por status
   */
  static getReportsByStatus(status: ErrorReport['status']): ErrorReport[] {
    return this.getAllReports().filter(report => report.status === status);
  }

  /**
   * Busca relatórios por tipo
   */
  static getReportsByType(type: ErrorType): ErrorReport[] {
    return this.getAllReports().filter(report => report.type === type);
  }

  /**
   * Busca relatórios por prioridade
   */
  static getReportsByPriority(priority: ErrorPriority): ErrorReport[] {
    return this.getAllReports().filter(report => report.priority === priority);
  }

  /**
   * Atualiza status de um relatório (função admin)
   */
  static updateReportStatus(
    reportId: string, 
    status: ErrorReport['status'],
    adminNotes?: string,
    resolvedBy?: string
  ): boolean {
    try {
      const reports = this.getAllReports();
      const reportIndex = reports.findIndex(r => r.id === reportId);
      
      if (reportIndex === -1) return false;

      reports[reportIndex].status = status;
      if (adminNotes) reports[reportIndex].adminNotes = adminNotes;
      if (resolvedBy) reports[reportIndex].resolvedBy = resolvedBy;
      
      if (status === 'resolved' || status === 'closed') {
        reports[reportIndex].resolvedAt = new Date();
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar relatório:', error);
      return false;
    }
  }

  /**
   * Remove um relatório (função admin)
   */
  static deleteReport(reportId: string): boolean {
    try {
      const reports = this.getAllReports();
      const filteredReports = reports.filter(r => r.id !== reportId);
      
      if (filteredReports.length === reports.length) return false;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredReports));
      return true;
    } catch (error) {
      console.error('Erro ao deletar relatório:', error);
      return false;
    }
  }

  /**
   * Estatísticas dos relatórios
   */
  static getReportStats() {
    const reports = this.getAllReports();
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: reports.length,
      open: reports.filter(r => r.status === 'open').length,
      inProgress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      closed: reports.filter(r => r.status === 'closed').length,
      last30Days: reports.filter(r => r.timestamp >= last30Days).length,
      last7Days: reports.filter(r => r.timestamp >= last7Days).length,
      byType: {
        technical: reports.filter(r => r.type === ErrorType.TECHNICAL).length,
        content: reports.filter(r => r.type === ErrorType.CONTENT).length,
        performance: reports.filter(r => r.type === ErrorType.PERFORMANCE).length,
        ui_ux: reports.filter(r => r.type === ErrorType.UI_UX).length,
        other: reports.filter(r => r.type === ErrorType.OTHER).length
      },
      byPriority: {
        low: reports.filter(r => r.priority === ErrorPriority.LOW).length,
        medium: reports.filter(r => r.priority === ErrorPriority.MEDIUM).length,
        high: reports.filter(r => r.priority === ErrorPriority.HIGH).length,
        critical: reports.filter(r => r.priority === ErrorPriority.CRITICAL).length
      }
    };
  }

  /**
   * Exporta relatórios para CSV
   */
  static exportToCSV(): string {
    const reports = this.getAllReports();
    const headers = [
      'ID', 'Data', 'Usuário', 'Email', 'Tipo', 'Prioridade', 'Título', 
      'Descrição', 'Status', 'Domínio', 'Navegador', 'Resolvido Por', 'Data Resolução'
    ];

    const csvContent = [
      headers.join(','),
      ...reports.map(report => [
        report.id,
        report.timestamp.toISOString(),
        report.userId,
        report.userEmail || '',
        report.type,
        report.priority,
        `"${report.title.replace(/"/g, '""')}"`,
        `"${report.description.replace(/"/g, '""')}"`,
        report.status,
        report.systemInfo?.domain || '',
        `"${report.browserInfo.userAgent}"`,
        report.resolvedBy || '',
        report.resolvedAt?.toISOString() || ''
      ].join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Gera ID único para relatório
   */
  private static generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Limpa relatórios antigos (mais de 90 dias)
   */
  static cleanOldReports(): number {
    try {
      const reports = this.getAllReports();
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const filteredReports = reports.filter(report => 
        report.timestamp >= cutoffDate || report.status === 'open' || report.status === 'in_progress'
      );

      const removedCount = reports.length - filteredReports.length;
      
      if (removedCount > 0) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredReports));
        console.log(`🧹 Removidos ${removedCount} relatórios antigos`);
      }

      return removedCount;
    } catch (error) {
      console.error('Erro ao limpar relatórios antigos:', error);
      return 0;
    }
  }
}