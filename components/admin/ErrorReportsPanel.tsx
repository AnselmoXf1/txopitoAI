/**
 * Error Reports Panel - TXOPITO IA Admin
 * Painel administrativo para gerenciar relatórios de erro
 */

import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { ErrorReport, ErrorType, ErrorPriority, ERROR_TYPES, ERROR_PRIORITIES } from '../../constants';
import { ErrorReportService } from '../../services/errorReportService';

export const ErrorReportsPanel: React.FC = () => {
  const [reports, setReports] = useState<ErrorReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, statusFilter, typeFilter, priorityFilter, searchTerm]);

  const loadReports = () => {
    setLoading(true);
    try {
      const allReports = ErrorReportService.getAllReports();
      const reportStats = ErrorReportService.getReportStats();
      
      setReports(allReports);
      setStats(reportStats);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    // Filtro por prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    // Busca por texto
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(term) ||
        report.description.toLowerCase().includes(term) ||
        report.userId.toLowerCase().includes(term) ||
        (report.userEmail && report.userEmail.toLowerCase().includes(term))
      );
    }

    // Ordenar por data (mais recentes primeiro)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setFilteredReports(filtered);
  };

  const updateReportStatus = async (reportId: string, status: ErrorReport['status'], adminNotes?: string) => {
    const success = ErrorReportService.updateReportStatus(reportId, status, adminNotes, 'admin');
    if (success) {
      loadReports();
      if (selectedReport && selectedReport.id === reportId) {
        const updatedReport = ErrorReportService.getAllReports().find(r => r.id === reportId);
        setSelectedReport(updatedReport || null);
      }
    }
  };

  const deleteReport = async (reportId: string) => {
    if (confirm('Tem certeza que deseja deletar este relatório?')) {
      const success = ErrorReportService.deleteReport(reportId);
      if (success) {
        loadReports();
        if (selectedReport && selectedReport.id === reportId) {
          setSelectedReport(null);
        }
      }
    }
  };

  const exportReports = () => {
    const csvContent = ErrorReportService.exportToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `error_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: ErrorReport['status']) => {
    const colors = {
      open: 'text-red-600 bg-red-100',
      in_progress: 'text-yellow-600 bg-yellow-100',
      resolved: 'text-green-600 bg-green-100',
      closed: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.open;
  };

  const getStatusLabel = (status: ErrorReport['status']) => {
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Progresso',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600">Carregando relatórios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Erro</h2>
          <p className="text-gray-600">Gerencie e acompanhe problemas reportados pelos usuários</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportReports}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Icon name="Download" size={16} />
            Exportar CSV
          </button>
          <button
            onClick={loadReports}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Icon name="RefreshCw" size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <div className="text-sm text-gray-600">Abertos</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">Em Progresso</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600">Resolvidos</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.last7Days}</div>
            <div className="text-sm text-gray-600">Últimos 7 dias</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{stats.byPriority.critical}</div>
            <div className="text-sm text-gray-600">Críticos</div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="open">Abertos</option>
              <option value="in_progress">Em Progresso</option>
              <option value="resolved">Resolvidos</option>
              <option value="closed">Fechados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {Object.entries(ERROR_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              {Object.entries(ERROR_PRIORITIES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Título, descrição, usuário..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Relatórios */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="FileText" size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório encontrado</h3>
            <p className="text-gray-600">
              {reports.length === 0 
                ? 'Ainda não há relatórios de erro.' 
                : 'Tente ajustar os filtros para encontrar relatórios.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relatório
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {report.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {report.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{report.userId}</div>
                      {report.userEmail && (
                        <div className="text-sm text-gray-500">{report.userEmail}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 ${ERROR_TYPES[report.type].color}`}>
                        <Icon name={ERROR_TYPES[report.type].icon as any} size={16} />
                        <span className="text-sm">{ERROR_TYPES[report.type].label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ERROR_PRIORITIES[report.priority].color} ${ERROR_PRIORITIES[report.priority].bgColor}`}>
                        {ERROR_PRIORITIES[report.priority].label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {getStatusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.timestamp.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Ver detalhes"
                        >
                          <Icon name="Eye" size={16} />
                        </button>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Deletar"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={updateReportStatus}
        />
      )}
    </div>
  );
};

// Modal de Detalhes do Relatório
interface ReportDetailModalProps {
  report: ErrorReport;
  onClose: () => void;
  onUpdateStatus: (reportId: string, status: ErrorReport['status'], adminNotes?: string) => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose, onUpdateStatus }) => {
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [newStatus, setNewStatus] = useState(report.status);

  const handleSave = () => {
    onUpdateStatus(report.id, newStatus, adminNotes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Detalhes do Relatório</h3>
            <p className="text-sm text-gray-600">ID: {report.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Informações Básicas</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Título:</strong> {report.title}</div>
                <div><strong>Usuário:</strong> {report.userId}</div>
                {report.userEmail && <div><strong>Email:</strong> {report.userEmail}</div>}
                <div><strong>Data:</strong> {report.timestamp.toLocaleString('pt-BR')}</div>
                <div><strong>Tipo:</strong> {ERROR_TYPES[report.type].label}</div>
                <div><strong>Prioridade:</strong> {ERROR_PRIORITIES[report.priority].label}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Sistema</h4>
              <div className="space-y-2 text-sm">
                {report.systemInfo?.domain && (
                  <div><strong>Domínio:</strong> {report.systemInfo.domain}</div>
                )}
                {report.systemInfo?.sessionId && (
                  <div><strong>Sessão:</strong> {report.systemInfo.sessionId}</div>
                )}
                <div><strong>URL:</strong> {report.browserInfo.url}</div>
                <div><strong>Viewport:</strong> {report.browserInfo.viewport}</div>
                <div><strong>Navegador:</strong> {report.browserInfo.userAgent.split(' ')[0]}</div>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Descrição</h4>
            <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap">
              {report.description}
            </div>
          </div>

          {/* Passos, Comportamento Esperado e Atual */}
          {(report.steps || report.expectedBehavior || report.actualBehavior) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.steps && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Passos para Reproduzir</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {report.steps}
                  </div>
                </div>
              )}
              {report.expectedBehavior && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comportamento Esperado</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {report.expectedBehavior}
                  </div>
                </div>
              )}
              {report.actualBehavior && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Comportamento Atual</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {report.actualBehavior}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status e Notas Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ErrorReport['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="open">Aberto</option>
                <option value="in_progress">Em Progresso</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas do Admin
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione notas sobre a resolução..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Info de Resolução */}
          {report.resolvedAt && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Informações de Resolução</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div><strong>Resolvido em:</strong> {report.resolvedAt.toLocaleString('pt-BR')}</div>
                {report.resolvedBy && <div><strong>Resolvido por:</strong> {report.resolvedBy}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};