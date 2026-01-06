import React, { useState } from 'react';
import Icon from './Icon';
import FallbackIndicator from './FallbackIndicator';
import { User } from '../types';
import { AuthService } from '../backend/api';

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
        setTimeout(() => onLogin(result.user), 1000);
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
      // Simula delay de tentativa de conexão
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mostra erro informativo
      throw new Error(`Login com ${provider} ainda não está disponível. Use email e senha por enquanto.`);
      
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 relative overflow-hidden font-sans">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-violet-900 via-slate-900 to-black animate-gradient-xy"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glass Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]">
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
              TXOPITO IA
            </h1>
            <p className="text-slate-300 text-sm">
              {isRegistering ? 'Criar Conta' : 'Campus AI Expandido'}
            </p>
          </div>

          {/* Social Login */}
          <div className="flex gap-3 mb-6">
            <button 
              onClick={() => handleSocialLogin('Google')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white py-2.5 rounded-xl text-sm font-medium group relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Chrome" size={18} className="text-rose-400 group-hover:scale-110 transition-transform" />
              <span>Google</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white/20 animate-pulse" title="Em breve"></div>
            </button>
            <button 
              onClick={() => handleSocialLogin('Github')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white py-2.5 rounded-xl text-sm font-medium group relative disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="Github" size={18} className="text-white group-hover:scale-110 transition-transform" />
              <span>GitHub</span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-white/20 animate-pulse" title="Em breve"></div>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-slate-500">ou continue com email</span>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
              {success}
            </div>
          )}

          {/* Indicador de fallback para login social */}
          {error && (error.includes('Google') || error.includes('GitHub')) && (
            <div className="mb-4">
              <FallbackIndicator type="social-login" />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome - Apenas no registro */}
            {isRegistering && (
              <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Nome Completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="User" size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="group">
              <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Mail" size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="group">
              <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon name="Lock" size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
              {isRegistering && password && (
                <div className="mt-1 text-xs text-slate-400">
                  {validatePassword(password) || "✓ Senha válida"}
                </div>
              )}
            </div>

            {/* Confirmar Senha - Apenas no registro */}
            {isRegistering && (
              <div className="group">
                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="Lock" size={16} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {confirmPassword && (
                  <div className="mt-1 text-xs">
                    {password === confirmPassword ? (
                      <span className="text-green-400">✓ Senhas coincidem</span>
                    ) : (
                      <span className="text-red-400">✗ Senhas não coincidem</span>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span className="flex items-center gap-2">
                  {isRegistering ? 'Criar Conta' : 'Entrar'} 
                  <Icon name="ChevronRight" size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Links de navegação */}
          <div className="mt-6 text-center">
            <button
              onClick={() => switchMode(isRegistering ? 'login' : 'register')}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Registre-se'}
            </button>
          </div>
        
          <p className="text-center text-white/20 text-xs mt-8">
            Campus AI © 2025. Educação Ética e Segura.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;