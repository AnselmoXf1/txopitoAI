import React, { useState, useEffect } from 'react';
import Icon from '../Icon';

interface SystemLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  category: string;
  message: string;
  details?: any;
}

interface SystemMetrics {
  responseTime: number;
  uptime: number;
  memoryUsage: number;
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

const MonitoringPanel: React.FC = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    responseTime: 0,
    uptime: 0,
    memoryUsage: 0,
    activeConnections: 0,
    requestsPerMinute: 0,
    errorRate: 0
  });
  const [selectedLogLevel, setSelectedLogLevel] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simula dados de monitoramento
  useEffect(() => {
    const generateMockLogs = (): SystemLog[] => {
      const categories = ['GeminiService', 'AuthService', 'ChatService', 'MemoryService', 'System'];
      const messages = {
        info: [
          'Usuário logado com sucesso',
          'Nova sessão de chat iniciada',
          'Resposta da IA gerada',
          'Cache atualizado',
          'Backup automático realizado'
        ],
        warning: [
          'Cache em 75% da capacidade',
          'Tempo de resposta acima do normal',
          'Tentativa de login falhada',
          'Rate limit atingido para usuário',
          'Memória em 80% da capacidade'
        ],
        error: [
          'Falha na conexão com API Gemini',
          'Erro ao salvar sessão',
          'Timeout na geração de resposta',
          'Falha no processamento de imagem',
          'Erro interno do servidor'
        ]
      };

      return Array.from({ length: 50 }, (_, i) => {
        const levels: Array<'info' | 'warning' | 'error'> = ['info', 'info', 'info', 'warning', 'error'];
        const level = levels[Math.floor(Math.random() * levels.length)];
        
        return {
          id: `log_${i}`,
          timestamp: Date.now() - (i * 60000) - Math.random() * 300000,
          level,
          category: categories[Math.floor(Math.random() * categories.length)],
          message: messages[level][Math.floor(Math.random() * messages[level].length)],
          details: level === 'error' ? { stack: 'Error stack trace...' } : undefined
        };
      }).sort((a, b) => b.timestamp - a.timestamp);
    };

    const generateMockMetrics = (): SystemMetrics => ({
      responseTime: 150 + Math.random() * 100,
      uptime: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 dias
      memoryUsage: 60 + Math.random() * 20,
      activeConnections: 15 + Math.floor(Math.random() * 10),
      requestsPerMinute: 45 + Math.floor(Math.random() * 20),
      errorRate: Math.random() * 2
    });

    setLogs(generateMockLogs());
    setMetrics(generateMockMetrics());

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      if (autoRefresh) {
        setMetrics(generateMockMetrics());
        // Adiciona novos logs ocasionalmente
        if (Math.random() > 0.7) {
          setLogs(prev => [generateMockLogs()[0], ...prev.slice(0, 49)]);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = logs.filter(log => 
    selectedLogLevel === 'all' || log.level === selectedLogLevel
  );

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return 'AlertCircle';
      case 'warning': return 'AlertTriangle';
      default: return 'Info';
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-blue-600';
    }
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    unit?: string;
    status: 'good' | 'warning' | 'error';
    icon: string;
  }> = ({ title, value, unit, status, icon }) => {
    const statusColors = {
      good: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${statusColors[status]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-2xl font-bold">
              {value}{unit && <span className="text-sm font-normal ml-1">{unit}</span>}
            </p>
          </div>
          <Icon name={icon as any} size={24} className="opacity-60" />
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoramento do Sistema</h2>
          <p className="text-gray-600">Acompanhe a performance e logs em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Icon name="RefreshCw" size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Métricas do Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Tempo de Resposta"
          value={Math.round(metrics.responseTime)}
          unit="ms"
          status={metrics.responseTime > 300 ? 'error' : metrics.responseTime > 200 ? 'warning' : 'good'}
          icon="Clock"
        />
        <MetricCard
          title="Uptime"
          value={formatUptime(metrics.uptime)}
          status="good"
          icon="Activity"
        />
        <MetricCard
          title="Uso de Memória"
          value={Math.round(metrics.memoryUsage)}
          unit="%"
          status={metrics.memoryUsage > 80 ? 'error' : metrics.memoryUsage > 70 ? 'warning' : 'good'}
          icon="HardDrive"
        />
        <MetricCard
          title="Conexões Ativas"
          value={metrics.activeConnections}
          status="good"
          icon="Users"
        />
        <MetricCard
          title="Req/min"
          value={Math.round(metrics.requestsPerMinute)}
          status={metrics.requestsPerMinute > 80 ? 'warning' : 'good'}
          icon="TrendingUp"
        />
        <MetricCard
          title="Taxa de Erro"
          value={metrics.errorRate.toFixed(1)}
          unit="%"
          status={metrics.errorRate > 5 ? 'error' : metrics.errorRate > 2 ? 'warning' : 'good'}
          icon="AlertTriangle"
        />
      </div>

      {/* Gráfico de Performance (Simulado) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance nas Últimas 24h</h3>
        <div className="h-64 flex items-end justify-between gap-1">
          {Array.from({ length: 24 }, (_, i) => {
            const height = 20 + Math.random() * 80;
            const isHigh = height > 70;
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className={`w-full min-h-[4px] rounded-t transition-all ${
                    isHigh ? 'bg-red-500' : height > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${23 - i}h atrás: ${Math.round(height * 5)}ms`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {23 - i}h
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Bom (&lt;250ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Moderado (250-350ms)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Alto (&gt;350ms)</span>
          </div>
        </div>
      </div>

      {/* Logs do Sistema */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Logs do Sistema</h3>
            <div className="flex items-center gap-3">
              <select
                value={selectedLogLevel}
                onChange={(e) => setSelectedLogLevel(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Níveis</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
              <button
                onClick={() => setLogs([])}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="FileText" size={48} className="mx-auto mb-2 text-gray-300" />
              <p>Nenhum log encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <Icon 
                      name={getLogIcon(log.level) as any} 
                      size={16} 
                      className={`mt-0.5 ${getLogColor(log.level)}`} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {log.category}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.level === 'error' ? 'bg-red-100 text-red-800' :
                          log.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{log.message}</p>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer">
                            Ver detalhes
                          </summary>
                          <pre className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringPanel;