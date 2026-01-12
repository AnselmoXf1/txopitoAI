/**
 * Error Report Modal - TXOPITO IA
 * Modal para usuários reportarem erros e problemas
 */

import React, { useState } from 'react';
import Icon from './Icon';
import { ErrorType, ErrorPriority, ERROR_TYPES, ERROR_PRIORITIES, DomainId } from '../constants';
import { ErrorReportService } from '../services/errorReportService';
import { User } from '../types';

interface ErrorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  currentDomain?: DomainId;
  sessionId?: string;
  conversationId?: string;
}

export const ErrorReportModal: React.FC<ErrorReportModalProps> = ({
  isOpen,
  onClose,
  user,
  currentDomain,
  sessionId,
  conversationId
}) => {
  const [formData, setFormData] = useState({
    type: ErrorType.TECHNICAL,
    priority: ErrorPriority.MEDIUM,
    title: '',
    description: '',
    steps: '',
    expectedBehavior: '',
    actualBehavior: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await ErrorReportService.createReport({
        userId: user.id,
        userEmail: user.email,
        type: formData.type,
        priority: formData.priority,
        title: formData.title.trim(),
        description: formData.description.trim(),
        steps: formData.steps.trim() || undefined,
        expectedBehavior: formData.expectedBehavior.trim() || undefined,
        actualBehavior: formData.actualBehavior.trim() || undefined,
        domain: currentDomain,
        sessionId,
        conversationId
      });

      setSubmitted(true);
      
      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          type: ErrorType.TECHNICAL,
          priority: ErrorPriority.MEDIUM,
          title: '',
          description: '',
          steps: '',
          expectedBehavior: '',
          actualBehavior: ''
        });
      }, 2000);

    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={32} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Relatório Enviado!
          </h3>
          <p className="text-gray-600 text-sm">
            Obrigado pelo seu feedback. Nossa equipe analisará o problema reportado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Icon name="Bug" size={20} className="text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Reportar Problema
              </h2>
              <p className="text-sm text-gray-600">
                Nos ajude a melhorar reportando erros e problemas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="X" size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo do Problema *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                {Object.entries(ERROR_TYPES).map(([key, config]) => (
                  <option key={key} value={key} className="text-gray-900">
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                required
              >
                {Object.entries(ERROR_PRIORITIES).map(([key, config]) => (
                  <option key={key} value={key} className="text-gray-900">
                    {config.label} - {config.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Problema *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Erro ao enviar mensagem no domínio de programação"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              required
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.title.length}/100 caracteres
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição Detalhada *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o problema em detalhes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
              required
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/500 caracteres
            </div>
          </div>

          {/* Passos para Reproduzir */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passos para Reproduzir (Opcional)
            </label>
            <textarea
              value={formData.steps}
              onChange={(e) => handleInputChange('steps', e.target.value)}
              placeholder="1. Faça isso...&#10;2. Clique aqui...&#10;3. O erro acontece..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
              maxLength={300}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.steps.length}/300 caracteres
            </div>
          </div>

          {/* Comportamento Esperado vs Atual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comportamento Esperado (Opcional)
              </label>
              <textarea
                value={formData.expectedBehavior}
                onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
                placeholder="O que deveria acontecer..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.expectedBehavior.length}/200 caracteres
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comportamento Atual (Opcional)
              </label>
              <textarea
                value={formData.actualBehavior}
                onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
                placeholder="O que realmente acontece..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.actualBehavior.length}/200 caracteres
              </div>
            </div>
          </div>

          {/* Info do Sistema */}
          {(currentDomain || sessionId) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Informações do Sistema
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                {currentDomain && (
                  <div>Domínio Atual: <span className="font-mono">{currentDomain}</span></div>
                )}
                {sessionId && (
                  <div>ID da Sessão: <span className="font-mono">{sessionId}</span></div>
                )}
                <div>Navegador: <span className="font-mono">{navigator.userAgent.split(' ')[0]}</span></div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} />
                  Enviar Relatório
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};