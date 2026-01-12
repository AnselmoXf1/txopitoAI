/**
 * Onboarding Modal - TXOPITO IA
 * Modal de boas-vindas e coleta de dados de onboarding
 */

import React, { useState } from 'react';
import { OnboardingData, DomainId, User } from '../types';
import { DOMAINS } from '../constants';
import Icon from './Icon';
import TxopitoLogo from './TxopitoLogo';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingModalProps {
  user: User;
  onComplete: (onboardingData: OnboardingData) => void;
  onSkip: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ user, onComplete, onSkip }) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    discoverySource: undefined,
    primaryGoal: undefined,
    primaryInterest: DomainId.PROGRAMMING,
    experienceLevel: undefined,
    expectedUsage: undefined,
    primaryDevice: 'desktop',
    expectations: [],
    completedAt: Date.now()
  });

  const discoveryOptions = [
    { value: 'google_search', label: 'Pesquisa no Google', icon: 'Search' },
    { value: 'social_media', label: 'Redes Sociais', icon: 'Share2' },
    { value: 'friend_recommendation', label: 'Indicação de Amigo', icon: 'Users' },
    { value: 'advertisement', label: 'Publicidade/Anúncio', icon: 'Target' },
    { value: 'blog_article', label: 'Artigo/Blog', icon: 'FileText' },
    { value: 'youtube', label: 'YouTube/Vídeo', icon: 'Play' },
    { value: 'other', label: 'Outro', icon: 'MoreHorizontal' }
  ];

  const goalOptions = [
    { value: 'learning', label: 'Aprender e Estudar', icon: 'BookOpen' },
    { value: 'work_assistance', label: 'Assistência no Trabalho', icon: 'Briefcase' },
    { value: 'research', label: 'Pesquisa e Investigação', icon: 'Search' },
    { value: 'productivity', label: 'Aumentar Produtividade', icon: 'Zap' },
    { value: 'entertainment', label: 'Entretenimento', icon: 'Smile' },
    { value: 'other', label: 'Outro', icon: 'MoreHorizontal' }
  ];

  const experienceOptions = [
    { value: 'beginner', label: 'Iniciante', description: 'Pouca ou nenhuma experiência' },
    { value: 'intermediate', label: 'Intermediário', description: 'Alguma experiência prática' },
    { value: 'advanced', label: 'Avançado', description: 'Experiência significativa' },
    { value: 'expert', label: 'Especialista', description: 'Muito experiente na área' }
  ];

  const usageOptions = [
    { value: 'daily', label: 'Diariamente', icon: 'Calendar' },
    { value: 'weekly', label: 'Semanalmente', icon: 'Calendar' },
    { value: 'monthly', label: 'Mensalmente', icon: 'Calendar' },
    { value: 'occasionally', label: 'Ocasionalmente', icon: 'Clock' }
  ];

  const expectationOptions = [
    'Respostas rápidas e precisas',
    'Explicações detalhadas',
    'Exemplos práticos',
    'Sugestões personalizadas',
    'Acompanhamento do progresso',
    'Interface simples e intuitiva',
    'Suporte em português',
    'Integração com outras ferramentas'
  ];

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExpectationToggle = (expectation: string) => {
    const current = formData.expectations || [];
    const updated = current.includes(expectation)
      ? current.filter(e => e !== expectation)
      : [...current, expectation];
    handleInputChange('expectations', updated);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const completeData: OnboardingData = {
      discoverySource: formData.discoverySource!,
      discoverySourceDetails: formData.discoverySourceDetails,
      primaryGoal: formData.primaryGoal!,
      primaryGoalDetails: formData.primaryGoalDetails,
      primaryInterest: formData.primaryInterest!,
      experienceLevel: formData.experienceLevel!,
      profession: formData.profession,
      expectations: formData.expectations || [],
      expectedUsage: formData.expectedUsage!,
      primaryDevice: formData.primaryDevice!,
      ageRange: formData.ageRange,
      location: formData.location,
      initialFeedback: formData.initialFeedback,
      completedAt: Date.now()
    };
    onComplete(completeData);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!formData.discoverySource;
      case 2: return !!formData.primaryGoal;
      case 3: return !!formData.primaryInterest && !!formData.experienceLevel;
      case 4: return !!formData.expectedUsage;
      case 5: return true; // Opcional
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Como você conheceu o TXOPITO IA?
              </h3>
              <p className="text-gray-600">
                Isso nos ajuda a entender melhor nossos usuários
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {discoveryOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange('discoverySource', option.value)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                    formData.discoverySource === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={option.icon as any} size={20} className="text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base">{option.label}</span>
                </button>
              ))}
            </div>

            {formData.discoverySource === 'other' && (
              <input
                type="text"
                placeholder="Por favor, especifique..."
                value={formData.discoverySourceDetails || ''}
                onChange={(e) => handleInputChange('discoverySourceDetails', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Qual é seu objetivo principal?
              </h3>
              <p className="text-gray-600">
                Isso nos ajuda a personalizar sua experiência
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {goalOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleInputChange('primaryGoal', option.value)}
                  className={`p-3 md:p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                    formData.primaryGoal === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon name={option.icon as any} size={20} className="text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-sm md:text-base">{option.label}</span>
                </button>
              ))}
            </div>

            {formData.primaryGoal === 'other' && (
              <input
                type="text"
                placeholder="Descreva seu objetivo..."
                value={formData.primaryGoalDetails || ''}
                onChange={(e) => handleInputChange('primaryGoalDetails', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Área de Interesse e Experiência
              </h3>
              <p className="text-gray-600">
                Selecione sua área principal e nível de experiência
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Área de Interesse Principal:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(DOMAINS).map(domain => (
                  <button
                    key={domain.id}
                    onClick={() => handleInputChange('primaryInterest', domain.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.primaryInterest === domain.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`p-1 rounded ${domain.bgColor}`}>
                        <Icon name={domain.icon as any} size={16} className={domain.color} />
                      </div>
                      <span className="font-medium text-sm">{domain.name}</span>
                    </div>
                    <p className="text-xs text-gray-600">{domain.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Nível de Experiência:
              </label>
              <div className="space-y-2">
                {experienceOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleInputChange('experienceLevel', option.value)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      formData.experienceLevel === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm md:text-base">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profissão/Área de Atuação (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Desenvolvedor, Estudante, Consultor..."
                value={formData.profession || ''}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Preferências de Uso
              </h3>
              <p className="text-gray-600">
                Como você pretende usar o TXOPITO IA?
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Frequência de Uso:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usageOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleInputChange('expectedUsage', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      formData.expectedUsage === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon name={option.icon as any} size={16} className="text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-sm md:text-base">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                O que você espera do TXOPITO IA? (selecione todas que se aplicam):
              </label>
              <div className="space-y-2">
                {expectationOptions.map(expectation => (
                  <button
                    key={expectation}
                    onClick={() => handleExpectationToggle(expectation)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                      formData.expectations?.includes(expectation)
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.expectations?.includes(expectation)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}>
                      {formData.expectations?.includes(expectation) && (
                        <Icon name="Check" size={12} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm">{expectation}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Informações Adicionais (Opcional)
              </h3>
              <p className="text-gray-600">
                Essas informações nos ajudam a melhorar a plataforma
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixa Etária:
                </label>
                <select
                  value={formData.ageRange || ''}
                  onChange={(e) => handleInputChange('ageRange', e.target.value || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Selecione...</option>
                  <option value="18-24">18-24 anos</option>
                  <option value="25-34">25-34 anos</option>
                  <option value="35-44">35-44 anos</option>
                  <option value="45-54">45-54 anos</option>
                  <option value="55-64">55-64 anos</option>
                  <option value="65+">65+ anos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localização:
                </label>
                <input
                  type="text"
                  placeholder="País/Estado"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback ou Sugestões:
              </label>
              <textarea
                placeholder="Compartilhe suas primeiras impressões ou sugestões..."
                value={formData.initialFeedback || ''}
                onChange={(e) => handleInputChange('initialFeedback', e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white placeholder-gray-500"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TxopitoLogo size="medium" variant="auth" showText={false} />
              <div>
                <h2 className="text-lg md:text-xl font-bold">Bem-vindo, {user.name}! 🎉</h2>
                <p className="text-blue-100 text-sm md:text-base">Vamos personalizar sua experiência</p>
              </div>
            </div>
            <button
              onClick={onSkip}
              className="text-blue-100 hover:text-white transition-colors p-1"
              title="Pular onboarding"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Etapa {currentStep} de {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto max-h-[50vh] md:max-h-[60vh]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 order-2 sm:order-1"
          >
            <Icon name="ChevronLeft" size={16} />
            Anterior
          </button>

          <div className="flex items-center gap-3 order-1 sm:order-2">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Pular
            </button>
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {currentStep === totalSteps ? 'Finalizar' : 'Próximo'}
              {currentStep < totalSteps && <Icon name="ChevronRight" size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;