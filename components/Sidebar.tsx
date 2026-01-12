import React from 'react';
import { DOMAINS } from '../constants';
import { DomainId, ChatSession, User } from '../types';
import Icon from './Icon';
import TxopitoLogo from './TxopitoLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDomain: DomainId;
  onSelectDomain: (id: DomainId) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  user?: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  selectedDomain,
  onSelectDomain,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  user,
  onLogout
}) => {
  const domainList = Object.values(DOMAINS);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container - Dark Theme */}
      <aside 
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-white/10 text-slate-300
          transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
          md:relative md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
          <TxopitoLogo 
            size="medium" 
            variant="sidebar" 
            showText={true}
          />
          <button onClick={onClose} className="md:hidden text-slate-500 hover:text-white transition-colors">
            <Icon name="X" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 px-4 rounded-xl font-semibold transition-all shadow-md transform active:scale-95"
          >
            <Icon name="MessageSquarePlus" size={18} />
            Novo Chat
          </button>
        </div>

        {/* Domains Section */}
        <div className="px-3 pt-2 pb-2">
          <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Módulos</h3>
          <div className="space-y-1">
            {domainList.map((domain) => (
              <button
                key={domain.id}
                onClick={() => {
                  onSelectDomain(domain.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all border border-transparent
                  ${selectedDomain === domain.id 
                    ? `bg-white/10 text-white border-white/5 shadow-inner` 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}
                `}
              >
                <span className={`${selectedDomain === domain.id ? domain.color : 'text-slate-500'} transition-colors`}>
                  <Icon name={domain.icon} size={18} />
                </span>
                {domain.name}
              </button>
            ))}
          </div>
        </div>

        {/* History Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-4">Recentes</h3>
          <div className="space-y-1">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-600 italic px-4 py-2">Sem histórico</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`
                    w-full text-left truncate px-3 py-2 text-sm rounded-lg transition-colors
                    ${currentSessionId === session.id 
                      ? 'bg-white/10 text-white' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                  `}
                >
                  {session.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* User Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 mt-auto">
          {user && (
            <div className="flex items-center gap-3">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                alt={user.name}
                className="w-10 h-10 rounded-full border border-white/10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
                title="Sair"
              >
                <Icon name="LogOut" size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;