/**
 * Keyboard Shortcuts Hook - TXOPITO IA
 * Sistema de atalhos de teclado para melhorar produtividade
 */

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  category: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Não executar atalhos se estiver digitando em um input
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.contentEditable === 'true'
    ) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
};

// Atalhos padrão do TXOPITO IA
export const getDefaultShortcuts = (actions: {
  newChat: () => void;
  toggleSidebar: () => void;
  toggleRightSidebar: () => void;
  focusInput: () => void;
  clearChat: () => void;
  exportChat: () => void;
  showHelp: () => void;
  switchDomain: (direction: 'next' | 'prev') => void;
}): KeyboardShortcut[] => [
  {
    key: 'n',
    ctrlKey: true,
    action: actions.newChat,
    description: 'Novo chat',
    category: 'Navegação'
  },
  {
    key: 'b',
    ctrlKey: true,
    action: actions.toggleSidebar,
    description: 'Alternar sidebar esquerda',
    category: 'Interface'
  },
  {
    key: 'r',
    ctrlKey: true,
    action: actions.toggleRightSidebar,
    description: 'Alternar sidebar direita',
    category: 'Interface'
  },
  {
    key: '/',
    ctrlKey: true,
    action: actions.focusInput,
    description: 'Focar no campo de entrada',
    category: 'Navegação'
  },
  {
    key: 'k',
    ctrlKey: true,
    action: actions.clearChat,
    description: 'Limpar chat atual',
    category: 'Chat'
  },
  {
    key: 'e',
    ctrlKey: true,
    action: actions.exportChat,
    description: 'Exportar chat',
    category: 'Chat'
  },
  {
    key: '?',
    ctrlKey: true,
    action: actions.showHelp,
    description: 'Mostrar ajuda',
    category: 'Ajuda'
  },
  {
    key: 'Tab',
    action: () => actions.switchDomain('next'),
    description: 'Próximo domínio',
    category: 'Navegação'
  },
  {
    key: 'Tab',
    shiftKey: true,
    action: () => actions.switchDomain('prev'),
    description: 'Domínio anterior',
    category: 'Navegação'
  },
  {
    key: 'Escape',
    action: () => {
      // Fechar modais ou sidebars abertas
      const openModal = document.querySelector('[role="dialog"]');
      if (openModal) {
        const closeButton = openModal.querySelector('[aria-label="Close"], [aria-label="Fechar"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }
    },
    description: 'Fechar modal/sidebar',
    category: 'Interface'
  }
];

// Componente de ajuda para atalhos
export const KeyboardShortcutsHelp: React.FC<{ 
  shortcuts: KeyboardShortcut[];
  isOpen: boolean;
  onClose: () => void;
}> = ({ shortcuts, isOpen, onClose }) => {
  if (!isOpen) return null;

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    if (shortcut.metaKey) keys.push('Cmd');
    keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key);
    return keys.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              ⌨️ Atalhos de Teclado
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-200 text-gray-800 text-sm font-mono rounded border">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Dica:</strong> Pressione <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Ctrl + ?</kbd> a qualquer momento para ver esta ajuda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default useKeyboardShortcuts;