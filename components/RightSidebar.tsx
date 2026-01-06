import React from 'react';
import { User, ChatSession, DomainConfig, UserPreferences } from '../types';
import Icon from './Icon';
import MemoryPanel from './MemoryPanel';
import LanguageSelector from './LanguageSelector';
import { getRank } from '../backend/api';
import { useLanguage } from '../contexts/LanguageContext';

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  activeDomain: DomainConfig;
  currentSession?: ChatSession;
  onClearChat: () => void;
  onExportChat: () => void;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onOpenMemory?: () => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  user,
  activeDomain,
  currentSession,
  onClearChat,
  onExportChat,
  onUpdatePreferences,
  onOpenMemory
}) => {
  const { t } = useLanguage();
  // Level Calculation for UI
  const xpNeeded = user.level * 200;
  const progress = (user.xp / xpNeeded) * 100;
  const rank = getRank(user.level);

  const stats = {
    messages: currentSession?.messages.length || 0,
    tokens: Math.round((currentSession?.messages.reduce((acc, m) => acc + m.text.length, 0) || 0) / 4),
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside 
        className={`
          fixed top-0 right-0 bottom-0 z-50 w-80 bg-white border-l border-gray-200 shadow-2xl lg:shadow-none
          transform transition-transform duration-300 ease-in-out flex flex-col
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Icon name="Settings" size={18} className="text-gray-400" />
            {t('settings')}
          </h2>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <Icon name="X" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* User Profile Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-4 text-white shadow-lg shadow-slate-200 relative overflow-hidden">
             {/* decorative circle */}
             <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-14 h-14 rounded-full border-2 border-white/20 object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight truncate max-w-[140px]">{user.name}</h3>
                <span className="text-xs font-bold text-cyan-300 bg-white/10 px-2 py-0.5 rounded-full inline-block mt-1 border border-white/5">
                  {rank}
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Nível {user.level}</span>
                <span>{user.xp} / {xpNeeded} XP</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Continue estudando para alcançar o cargo de {getRank(user.level + 5)}
              </p>
            </div>
          </div>

          {/* Context Stats */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Icon name="Zap" size={14} />
              Sessão Atual
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Mensagens</div>
                <div className="text-xl font-bold text-slate-700">{stats.messages}</div>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">Tokens</div>
                <div className="text-xl font-bold text-slate-700">{stats.tokens}</div>
              </div>
            </div>
          </div>

          {/* Memory Panel */}
          <MemoryPanel user={user} currentDomain={activeDomain.id} />

          {/* Quick Actions */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ações Rápidas</h3>
            <div className="space-y-2">
              {/* Botão de Memória Contextual */}
              {onOpenMemory && (
                <button 
                  onClick={onOpenMemory}
                  className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-purple-400 hover:shadow-sm rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Icon name="Brain" size={18} />
                    </div>
                    <div className="text-left">
                      <span className="block text-sm font-semibold text-slate-700">Memória Contextual</span>
                      <span className="block text-[10px] text-gray-400">Gerenciar perfil e preferências</span>
                    </div>
                  </div>
                </button>
              )}

              <button 
                onClick={onExportChat}
                disabled={!currentSession || currentSession.messages.length === 0}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-blue-400 hover:shadow-sm rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Icon name="Download" size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-slate-700">Exportar Conversa</span>
                    <span className="block text-[10px] text-gray-400">Salvar como .txt</span>
                  </div>
                </div>
              </button>

              <button 
                onClick={onClearChat}
                disabled={!currentSession || currentSession.messages.length === 0}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-red-400 hover:shadow-sm rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                    <Icon name="Trash2" size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-semibold text-slate-700">Limpar Histórico</span>
                    <span className="block text-[10px] text-gray-400">Apagar mensagens atuais</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Settings Toggles */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('settings')}</h3>
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="Globe" size={16} />
                  <span>{t('language')}</span>
                </div>
                <LanguageSelector className="scale-75" />
              </div>
              <div className="w-full h-px bg-gray-200"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="Bell" size={16} />
                  <span>Notificações</span>
                </div>
                <button 
                  onClick={() => onUpdatePreferences({ notifications: !user.preferences.notifications })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences.notifications ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${user.preferences.notifications ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
              <div className="w-full h-px bg-gray-200"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Icon name="Sun" size={16} />
                  <span>Alto Contraste</span>
                </div>
                <button 
                  onClick={() => onUpdatePreferences({ highContrast: !user.preferences.highContrast })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${user.preferences.highContrast ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${user.preferences.highContrast ? 'left-6' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
          </div>

          {/* Help Box */}
          <div className={`rounded-xl p-4 ${activeDomain.bgColor} border border-transparent`}>
            <div className="flex items-start gap-3">
              <Icon name="HelpCircle" size={20} className={activeDomain.color} />
              <div>
                <h4 className={`text-sm font-bold ${activeDomain.color} mb-1`}>Dica do {activeDomain.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ganhe XP fazendo perguntas e explorando novos tópicos. Suba de nível para desbloquear conquistas.
                </p>
              </div>
            </div>
          </div>

        </div>
        
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-[10px] text-gray-400">Backend v2.1 • Build 2025</p>
        </div>
      </aside>
    </>
  );
};

export default RightSidebar;