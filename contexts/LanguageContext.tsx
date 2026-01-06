import React, { createContext, useContext, useState, useEffect } from 'react';
import { TranslationKey, Translations } from '../types/i18n';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traduções
const translations: Record<Language, Translations> = {
  pt: {
    // Interface principal
    'whatCanIHelp': 'O que posso ajudar?',
    'explainConcepts': 'Explicar conceitos',
    'createImage': 'Criar imagem',
    'solveProblems': 'Resolver problemas',
    'discoverNewThings': 'Descobrir novidades',
    'learnAbout': 'Aprender sobre',
    'generateVisualContent': 'Gerar conteúdo visual',
    'getPracticalHelp': 'Obter ajuda prática',
    'exploreInterestingTopics': 'Explorar tópicos interessantes',
    
    // Domínios
    'programming': 'Programação',
    'consulting': 'Consultoria',
    'theology': 'Teologia',
    'agriculture': 'Agricultura',
    'accounting': 'Contabilidade',
    'psychology': 'Psicologia',
    
    // Descrições dos domínios
    'programmingDesc': 'Lógica, código e debug',
    'consultingDesc': 'Negócios e carreira',
    'theologyDesc': 'Religião e ética',
    'agricultureDesc': 'Cultivo e manejo',
    'accountingDesc': 'Finanças e impostos',
    'psychologyDesc': 'Comportamento humano',
    
    // Mensagens padrão
    'explainBasicConcept': 'Explique um conceito básico de',
    'createEducationalImage': 'Crie uma imagem educativa sobre este tópico',
    'helpSolvePracticalProblem': 'Me ajude a resolver um problema prático',
    'learnSomethingNew': 'Quero aprender algo novo e interessante',
    
    // Interface
    'newChat': 'Novo Chat',
    'campusAI': 'Campus AI',
    'askAbout': 'Pergunte algo sobre',
    'logout': 'Sair',
    'settings': 'Configurações',
    'language': 'Idioma',
  },
  en: {
    // Interface principal
    'whatCanIHelp': 'What can I help with?',
    'explainConcepts': 'Explain concepts',
    'createImage': 'Create image',
    'solveProblems': 'Solve problems',
    'discoverNewThings': 'Discover new things',
    'learnAbout': 'Learn about',
    'generateVisualContent': 'Generate visual content',
    'getPracticalHelp': 'Get practical help',
    'exploreInterestingTopics': 'Explore interesting topics',
    
    // Domínios
    'programming': 'Programming',
    'consulting': 'Consulting',
    'theology': 'Theology',
    'agriculture': 'Agriculture',
    'accounting': 'Accounting',
    'psychology': 'Psychology',
    
    // Descrições dos domínios
    'programmingDesc': 'Logic, code and debug',
    'consultingDesc': 'Business and career',
    'theologyDesc': 'Religion and ethics',
    'agricultureDesc': 'Cultivation and management',
    'accountingDesc': 'Finance and taxes',
    'psychologyDesc': 'Human behavior',
    
    // Mensagens padrão
    'explainBasicConcept': 'Explain a basic concept of',
    'createEducationalImage': 'Create an educational image about this topic',
    'helpSolvePracticalProblem': 'Help me solve a practical problem',
    'learnSomethingNew': 'I want to learn something new and interesting',
    
    // Interface
    'newChat': 'New Chat',
    'campusAI': 'Campus AI',
    'askAbout': 'Ask about',
    'logout': 'Logout',
    'settings': 'Settings',
    'language': 'Language',
  }
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Tenta recuperar idioma salvo ou usa português como padrão
    const saved = localStorage.getItem('txopito-language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    // Salva idioma no localStorage
    localStorage.setItem('txopito-language', language);
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};