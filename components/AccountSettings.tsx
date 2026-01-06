import React, { useState } from 'react';
import Icon from './Icon';
import { User } from '../types';
import { AuthService } from '../backend/api';

interface AccountSettingsProps {
  user: User;
  onClose: () => void;
  onUserUpdate: (user: User) => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onClose, onUserUpdate }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 6) return "Senha deve ter pelo menos 6 caracteres";
    if (!/[A-Za-z]/.test(pwd)) return "Senha deve conter pelo menos uma letra";
    if (!/[0-9]/.test(pwd)) return "Senha deve conter pelo menos um número";
    return null;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Preencha todos os campos.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Nova senha e confirmação não coincidem.");
      }

      const passwordError = validatePassword(newPassword);
      if (passwordError) throw new Error(passwordError);

      await AuthService.changePassword(user.id, currentPassword, newPassword);
      
      setSuccess("Senha alterada com sucesso!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
      
    } catch (err: any) {
      setError(err.message || "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Configurações da Conta</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações do Usuário */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={32} className="text-white" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{user.level}</div>
              <div className="text-xs text-blue-600">Nível</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{user.xp}</div>
              <div className="text-xs text-green-600">XP</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-xs text-purple-600">Dias</div>
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Segurança</h4>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Alterar Senha
                </button>
              )}
            </div>

              {isChangingPassword && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      {success}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    {newPassword && (
                      <div className="mt-1 text-xs">
                        {validatePassword(newPassword) ? (
                          <span className="text-red-500">{validatePassword(newPassword)}</span>
                        ) : (
                          <span className="text-green-500">✓ Senha válida</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    {confirmPassword && (
                      <div className="mt-1 text-xs">
                        {newPassword === confirmPassword ? (
                          <span className="text-green-500">✓ Senhas coincidem</span>
                        ) : (
                          <span className="text-red-500">✗ Senhas não coincidem</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Alterando...' : 'Alterar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Informações da Conta */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Desenvolvimento</h4>
            <button
              onClick={() => setShowEmailDebug(true)}
              className="w-full flex items-center justify-between p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon name="Mail" size={20} className="text-blue-600" />
                <div>
                  <div className="font-medium text-gray-800">Debug de Emails</div>
                  <div className="text-sm text-gray-500">Visualizar emails enviados</div>
                </div>
              </div>
              <Icon name="ChevronRight" size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Informações da Conta */}
          <div className="text-xs text-gray-500 space-y-1">
            <div>Conta criada: {new Date(user.createdAt).toLocaleDateString('pt-BR')}</div>
            <div>ID: {user.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;