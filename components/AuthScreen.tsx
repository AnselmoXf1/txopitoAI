import React, { useState } from 'react';
import Icon from './Icon';
import TxopitoLogo from './TxopitoLogo';
import FallbackIndicator from './FallbackIndicator';
import { User } from '../types';
import { AuthService } from '../services/browserApi';
import { GitHubAuthService } from '../services/githubAuth';
import { GoogleAuthService } from '../services/googleAuth';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    if (!/[A-Za-z]/.test(pwd)) return "Senha deve conter pelo menos uma letra";
    if (!/[0-9]/.test(pwd)) return "Senha deve conter pelo menos um número";
    return null;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (isRegistering) {
        // Validações de registro
        if (!name || !email || !password || !confirmPassword) {
          throw new Error("Preencha todos os campos.");
        }
        if (!validateEmail(email)) {
          throw new Error("Email inválido.");
        }
        if (password !== confirmPassword) {
          throw new Error("Senhas não coincidem.");
        }
        const passwordError = validatePassword(password);
        if (passwordError) throw new Error(passwordError);
        
        const result = await AuthService.register(name, email, password);
        
        // Login automático após registro
        setSuccess("Conta criada com sucesso! Fazendo login...");
        setTimeout(() => onLogin(result), 1000);
      } else {
        // Login
        if (!email || !password) throw new Error("Preencha email e senha.");
        if (!validateEmail(email)) throw new Error("Email inválido.");
        
        const user = await AuthService.login(email, password);
        setSuccess("Login realizado com sucesso!");
        setTimeout(() => onLogin(user), 500);
      }
    } catch (err: any) {
      const errorMessage = err.message || "Ocorreu um erro. Tente novamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setError(null);
    
    try {
      if (provider === 'Github') {
        // Verifica se GitHub OAuth está configurado
        if (!GitHubAuthService.isConfigured()) {
          throw new Error('GitHub OAuth não está configurado. Configure as variáveis de ambiente primeiro.');
        }
        
        // Inicia fluxo OAuth do GitHub
        GitHubAuthService.initiateAuth();
        return; // A página será redirecionada
      }
      
      if (provider === 'Google') {
        // Verifica se Google OAuth está configurado
        if (!GoogleAuthService.isConfigured()) {
          throw new Error('Google OAuth não está configurado. Configure as variáveis de ambiente primeiro.');
        }
        
        // Inicia fluxo OAuth do Google
        GoogleAuthService.initiateAuth();
        return; // A página será redirecionada
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const switchMode = (mode: 'login' | 'register') => {
    resetForm();
    setIsRegistering(mode === 'register');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-gray-50 relative overflow-hidden font-sans p-2 sm:p-3 md:p-4 auth-container">
      {/* Light Background Pattern */}
      <div className="absolute inset-0 z-0 auth-floating-elements">
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
        {/* Floating Elements - Responsivos */}
        <div className="hidden sm:block absolute top-10 sm:top-20 left-4 sm:left-20 w-16 sm:w-24 md:w-32 h-16 sm:h-24 md:h-32 bg-blue-200 rounded-full opacity-20 animate-float"></div>
        <div className="hidden md:block absolute top-20 md:top-40 right-8 md:right-32 w-12 md:w-24 h-12 md:h-24 bg-purple-200 rounded-full opacity-20 animate-float-delayed"></div>
        <div className="hidden lg:block absolute bottom-16 lg:bottom-32 left-1/4 lg:left-1/3 w-20 lg:w-40 h-20 lg:h-40 bg-cyan-200 rounded-full opacity-20 animate-float-slow"></div>
      </div>

      {/* Clean White Card - SEM SCROLL, tudo visível */}
      <div className="relative z-10 w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-md xl:max-w-lg mx-auto">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 md:p-6 transform transition-all hover:shadow-2xl auth-card">
          
          <div className="text-center mb-4 sm:mb-6">
            <TxopitoLogo 
              size="large" 
              variant="auth" 
              showText={false}
              className="mx-auto mb-2 sm:mb-3"
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 auth-title">
              TXOPITO IA
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm">
              {isRegistering ? 'Criar sua conta' : 'Bem-vindo de volta'}
            </p>
          </div>

          {/* Social Login - Compacto */}
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 auth-social-buttons">
            {/* Google Login Button */}
            <button 
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 transition-all text-gray-700 hover:text-blue-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold group relative disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md auth-social-button auth-button"
            >
              {/* Google SVG Icon */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continuar com Google</span>
              {!GoogleAuthService.isConfigured() && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" title="Configuração necessária"></div>
              )}
            </button>

            {/* GitHub Login Button */}
            <button 
              onClick={() => handleSocialLogin('Github')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 sm:gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-400 transition-all text-gray-700 hover:text-gray-900 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-sm font-semibold group relative disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md auth-social-button auth-button"
            >
              {/* GitHub SVG Icon */}
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continuar com GitHub</span>
              {!GitHubAuthService.isConfigured() && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" title="Configuração necessária"></div>
              )}
            </button>
          </div>

          <div className="relative mb-3 sm:mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-medium">ou continue com email</span>
            </div>
          </div>

          {/* Messages - Compactas */}
          {error && (
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs sm:text-sm text-center">
              <div className="flex items-center justify-center gap-1">
                <Icon name="AlertCircle" size={12} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs sm:text-sm text-center">
              <div className="flex items-center justify-center gap-1">
                <Icon name="CheckCircle" size={12} className="sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words">{success}</span>
              </div>
            </div>
          )}

          {/* Indicador de fallback para login social - Compacto */}
          {error && (error.includes('Google') || error.includes('GitHub')) && (
            <div className="mb-2 sm:mb-3">
              <FallbackIndicator type="social-login" />
            </div>
          )}

          {/* Form - Espaçamento reduzido */}
          <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
            {/* Nome - Apenas no registro */}
            {isRegistering && (
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="User" size={14} className="sm:w-4 sm:h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-100 text-sm auth-input"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="group">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Mail" size={14} className="sm:w-4 sm:h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-100 text-sm auth-input"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="group">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={14} className="sm:w-4 sm:h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-100 text-sm auth-input"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
              {isRegistering && password && (
                <div className="mt-1 text-xs">
                  {validatePassword(password) ? (
                    <span className="text-red-500 flex items-center gap-1">
                      <Icon name="X" size={10} className="flex-shrink-0" />
                      <span className="break-words">{validatePassword(password)}</span>
                    </span>
                  ) : (
                    <span className="text-green-600 flex items-center gap-1">
                      <Icon name="Check" size={10} className="flex-shrink-0" />
                      <span>Senha válida</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar Senha - Apenas no registro */}
            {isRegistering && (
              <div className="group">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="Lock" size={14} className="sm:w-4 sm:h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-gray-100 text-sm auth-input"
                    placeholder="••••••••"
                  />
                </div>
                {confirmPassword && (
                  <div className="mt-1 text-xs">
                    {password === confirmPassword ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Icon name="Check" size={10} className="flex-shrink-0" />
                        <span>Senhas coincidem</span>
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <Icon name="X" size={10} className="flex-shrink-0" />
                        <span>Senhas não coincidem</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 sm:mt-4 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 sm:py-3 px-4 rounded-lg shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm auth-button"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processando...</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  {isRegistering ? 'Criar Conta' : 'Entrar'} 
                  <Icon name="ArrowRight" size={14} className="sm:w-4 sm:h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Links de navegação - Compactos */}
          <div className="mt-3 sm:mt-4 text-center">
            <button
              onClick={() => switchMode(isRegistering ? 'login' : 'register')}
              className="text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium break-words"
            >
              {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Registre-se'}
            </button>
          </div>
        
          <p className="text-center text-gray-400 text-xs mt-3 sm:mt-4 break-words">
            TXOPITO IA © 2025. Assistente Inteligente moçambicano.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;