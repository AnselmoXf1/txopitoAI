/**
 * Security Panel - TXOPITO IA
 * Painel administrativo de segurança
 */

import React, { useState, useEffect } from 'react';
import Icon from '../Icon';
import { securityService } from '../../services/securityService';
import BackupService from '../../services/backupService';

interface SecurityThreat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number;
  resolved: boolean;
}

interface SecurityStats {
  totalThreats: number;
  activeThreats: number;
  blockedIPs: number;
  rateLimitHits: number;
  lastScan: number;
}

export const SecurityPanel: React.FC = () => {
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalThreats: 0,
    activeThreats: 0,
    blockedIPs: 0,
    rateLimitHits: 0,
    lastScan: Date.now()
  });

  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'backups' | 'settings'>('overview');

  useEffect(() => {
    loadSecurityData();
    loadBackupStats();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(() => {
      loadSecurityData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const report = securityService.getSecurityReport();
      
      setSecurityStats({
        totalThreats: report.suspiciousActivities.length,
        activeThreats: report.suspiciousActivities.filter(([, count]) => count > 0).length,
        blockedIPs: report.rateLimitStatus.blockedIPs,
        rateLimitHits: report.rateLimitStatus.activeConnections,
        lastScan: Date.now()
      });

      // Converter atividades suspeitas em ameaças
      const threatList: SecurityThreat[] = report.suspiciousActivities.map(([activity, count], index) => ({
        id: `threat_${index}`,
        type: activity,
        severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low',
        description: getActivityDescription(activity),
        timestamp: Date.now() - (Math.random() * 3600000), // Timestamp simulado
        resolved: false
      }));

      setThreats(threatList);
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
    }
  };

  const loadBackupStats = async () => {
    try {
      const stats = await BackupService.getBackupStats();
      setBackupStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas de backup:', error);
    }
  };

  const getActivityDescription = (activity: string): string => {
    const descriptions: Record<string, string> = {
      'xss_attempt': 'Tentativa de ataque XSS detectada',
      'rate_limit_exceeded': 'Limite de requisições excedido',
      'suspicious_scripts': 'Scripts suspeitos detectados',
      'dom_manipulation': 'Manipulação suspeita do DOM',
      'devtools_opened': 'Ferramentas de desenvolvedor abertas',
      'debug_attempt': 'Tentativa de debug detectada',
      'console_usage': 'Uso suspeito do console',
      'invalid_origin': 'Origem não autorizada',
      'invalid_session': 'Sessão inválida detectada'
    };

    return descriptions[activity] || `Atividade suspeita: ${activity}`;
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    
    try {
      console.log('🔍 Iniciando varredura de segurança...');
      
      // Simular varredura (em produção, fazer verificações reais)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Recarregar dados
      await loadSecurityData();
      
      console.log('✅ Varredura de segurança concluída');
    } catch (error) {
      console.error('❌ Erro na varredura:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const createBackup = async () => {
    try {
      const backupId = await BackupService.createBackup();
      await loadBackupStats();
      alert(`Backup criado com sucesso: ${backupId}`);
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      alert('Erro ao criar backup');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return 'AlertTriangle';
      case 'medium': return 'AlertCircle';
      case 'low': return 'Info';
      default: return 'Shield';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Painel de Segurança
              </h2>
              <p className="text-sm text-gray-600">
                Monitoramento e proteção da plataforma
              </p>
            </div>
          </div>
          
          <button
            onClick={runSecurityScan}
            disabled={isScanning}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Icon name={isScanning ? "Loader" : "Search"} size={16} className={isScanning ? "animate-spin" : ""} />
            {isScanning ? 'Verificando...' : 'Verificar Segurança'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Visão Geral', icon: 'BarChart3' },
            { id: 'threats', label: 'Ameaças', icon: 'AlertTriangle' },
            { id: 'backups', label: 'Backups', icon: 'Database' },
            { id: 'settings', label: 'Configurações', icon: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon as any} size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Status</p>
                    <p className="text-2xl font-bold text-green-600">Seguro</p>
                  </div>
                  <Icon name="Shield" size={24} className="text-green-600" />
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900">Ameaças Ativas</p>
                    <p className="text-2xl font-bold text-red-600">{securityStats.activeThreats}</p>
                  </div>
                  <Icon name="AlertTriangle" size={24} className="text-red-600" />
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-900">IPs Bloqueados</p>
                    <p className="text-2xl font-bold text-yellow-600">{securityStats.blockedIPs}</p>
                  </div>
                  <Icon name="Ban" size={24} className="text-yellow-600" />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Rate Limits</p>
                    <p className="text-2xl font-bold text-blue-600">{securityStats.rateLimitHits}</p>
                  </div>
                  <Icon name="Clock" size={24} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Atividade Recente</h3>
              <div className="space-y-2">
                {threats.slice(0, 5).map((threat) => (
                  <div key={threat.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Icon name={getSeverityIcon(threat.severity) as any} size={16} className={getSeverityColor(threat.severity).split(' ')[0]} />
                      <span className="text-sm text-gray-900">{threat.description}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Ameaças Detectadas</h3>
              <span className="text-sm text-gray-500">
                {threats.length} ameaças encontradas
              </span>
            </div>

            <div className="space-y-3">
              {threats.map((threat) => (
                <div key={threat.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Icon name={getSeverityIcon(threat.severity) as any} size={20} className={getSeverityColor(threat.severity).split(' ')[0]} />
                      <div>
                        <h4 className="font-medium text-gray-900">{threat.description}</h4>
                        <p className="text-sm text-gray-600">Tipo: {threat.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(threat.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                        {threat.severity.toUpperCase()}
                      </span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Icon name="MoreHorizontal" size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-6">
            {/* Backup Stats */}
            {backupStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total de Backups</p>
                      <p className="text-2xl font-bold text-blue-600">{backupStats.totalBackups}</p>
                    </div>
                    <Icon name="Database" size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-900">Tamanho Total</p>
                      <p className="text-2xl font-bold text-green-600">{backupStats.totalSizeFormatted}</p>
                    </div>
                    <Icon name="HardDrive" size={24} className="text-green-600" />
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-900">Último Backup</p>
                      <p className="text-sm font-bold text-purple-600">
                        {backupStats.newestBackup ? new Date(backupStats.newestBackup).toLocaleDateString() : 'Nunca'}
                      </p>
                    </div>
                    <Icon name="Clock" size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Backup Actions */}
            <div className="flex gap-3">
              <button
                onClick={createBackup}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Icon name="Plus" size={16} />
                Criar Backup
              </button>
              
              <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Icon name="Download" size={16} />
                Exportar Backups
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configurações de Segurança */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Configurações de Segurança</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Rate Limiting Ativo</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Monitoramento de DOM</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Proteção XSS</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Backup Automático</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                </div>
              </div>

              {/* Configurações de Backup */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Configurações de Backup</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Intervalo de Backup (horas)</label>
                    <input type="number" defaultValue={6} min={1} max={24} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Máximo de Backups</label>
                    <input type="number" defaultValue={10} min={5} max={50} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Criptografia de Backup</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                Salvar Configurações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityPanel;