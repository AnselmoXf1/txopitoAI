/**
 * GitHub OAuth Callback Handler - TXOPITO IA
 * Processa o retorno da autenticação GitHub
 */

import React, { useEffect, useState } from 'react';
import { GitHubAuthService } from '../services/githubAuth';
import { User } from '../types';
import Icon from './Icon';
import TxopitoLogo from './TxopitoLogo';

interface GitHubCallbackProps {
  onSuccess: (user: User) => void;
  onError: (error: string) => void;
}

const GitHubCallback: React.FC<GitHubCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processando autenticação GitHub...');

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extrai parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Verifica se houve erro no GitHub
        if (error) {
          throw new Error(errorDescription || `GitHub OAuth Error: ${error}`);
        }

        // Verifica se temos o código de autorização
        if (!code || !state) {
          throw new Error('Parâmetros OAuth inválidos. Código ou state ausente.');
        }

        setMessage('Validando com GitHub...');

        // Processa a autenticação
        const user = await GitHubAuthService.handleCallback(code, state);

        setStatus('success');
        setMessage('Autenticação bem-sucedida! Redirecionando...');

        // Aguarda um pouco para mostrar a mensagem de sucesso
        setTimeout(() => {
          onSuccess(user);
        }, 1500);

      } catch (err: any) {
        console.error('Erro no callback GitHub:', err);
        setStatus('error');
        
        // Mensagens de erro mais específicas e amigáveis
        let errorMessage = 'Erro na autenticação com GitHub';
        
        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          
          if (message.includes('código de verificação inválido') || message.includes('incorrect or expired')) {
            errorMessage = 'Código de autenticação expirado. Tente fazer login novamente.';
          } else if (message.includes('credenciais') || message.includes('client_credentials')) {
            errorMessage = 'Erro de configuração do servidor. Contate o administrador.';
          } else if (message.includes('callback') || message.includes('redirect_uri')) {
            errorMessage = 'Erro de configuração da URL. Contate o administrador.';
          } else if (message.includes('conexão') || message.includes('servidor') || message.includes('backend')) {
            errorMessage = 'Servidor temporariamente indisponível. Tente novamente.';
          } else if (message.includes('csrf') || message.includes('state')) {
            errorMessage = 'Erro de segurança. Tente fazer login novamente.';
          } else if (message.includes('email')) {
            errorMessage = 'Não foi possível obter seu email do GitHub. Verifique suas configurações de privacidade.';
          } else if (message.includes('token')) {
            errorMessage = 'Erro ao obter autorização do GitHub. Tente novamente.';
          } else if (err.message && err.message !== 'Erro na autenticação com GitHub') {
            // Se temos uma mensagem específica, usa ela
            errorMessage = err.message;
          }
        }
        
        setMessage(errorMessage);
        
        // Chama callback de erro após um delay
        setTimeout(() => {
          onError(errorMessage);
        }, 2000);
      }
    };

    processCallback();
  }, [onSuccess, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />;
      case 'success':
        return <Icon name="CheckCircle" size={32} className="text-green-500" />;
      case 'error':
        return <Icon name="XCircle" size={32} className="text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Callback Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          
          {/* Logo */}
          <TxopitoLogo 
            size="large" 
            variant="auth" 
            showText={false}
            className="mx-auto mb-6"
          />

          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            GitHub OAuth
          </h1>

          {/* Status Message */}
          <p className={`text-sm mb-6 ${getStatusColor()}`}>
            {message}
          </p>

          {/* GitHub Info */}
          <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
            <Icon name="Github" size={16} />
            <span>Autenticação segura via GitHub</span>
          </div>

          {/* Error Actions */}
          {status === 'error' && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Voltar ao Login
              </button>
              <button
                onClick={() => GitHubAuthService.initiateAuth()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-gray-400 text-xs mt-8">
            TXOPITO IA © 2025. Assistente Inteligente moçambicano.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GitHubCallback;