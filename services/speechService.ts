/**
 * Serviço de Síntese de Voz - TXOPITO IA
 * Text-to-Speech com vozes naturais em português
 */

export interface SpeechConfig {
  rate: number;        // Velocidade (0.1 - 10)
  pitch: number;       // Tom (0 - 2)
  volume: number;      // Volume (0 - 1)
  voice?: SpeechSynthesisVoice;
  voiceName?: string;  // Nome da voz para persistência
  autoPlay: boolean;   // Auto-reproduzir respostas da IA
}

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  gender: 'male' | 'female' | 'unknown';
  language: string;
  isDefault: boolean;
}

export class SpeechService {
  private static synthesis = window.speechSynthesis;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;
  private static isInitialized = false;
  private static voices: SpeechSynthesisVoice[] = [];
  
  // Configuração padrão
  private static defaultConfig: SpeechConfig = {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    autoPlay: false
  };

  // Configuração atual do usuário
  private static userConfig: SpeechConfig = { ...this.defaultConfig };

  /**
   * Inicializa o serviço de voz
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized || !this.isSupported()) return;

    return new Promise((resolve) => {
      const loadVoices = () => {
        this.voices = this.synthesis.getVoices();
        this.isInitialized = true;
        console.log(`🔊 SpeechService inicializado com ${this.voices.length} vozes`);
        resolve();
      };

      // Algumas vezes as vozes já estão carregadas
      if (this.synthesis.getVoices().length > 0) {
        loadVoices();
      } else {
        // Aguarda o carregamento das vozes
        this.synthesis.onvoiceschanged = loadVoices;
      }
    });
  }

  /**
   * Obtém todas as vozes disponíveis
   */
  static async getVoices(): Promise<SpeechSynthesisVoice[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.voices;
  }

  /**
   * Obtém vozes organizadas por idioma e gênero
   */
  static async getVoiceOptions(language: 'pt-BR' | 'en-US' = 'pt-BR'): Promise<VoiceOption[]> {
    const voices = await this.getVoices();
    const langCode = language.split('-')[0];
    
    return voices
      .filter(voice => voice.lang.toLowerCase().includes(langCode))
      .map(voice => ({
        voice,
        name: this.getVoiceName(voice),
        gender: this.detectGender(voice),
        language: voice.lang,
        isDefault: voice.default
      }))
      .sort((a, b) => {
        // Prioriza vozes padrão e femininas
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        if (a.gender === 'female' && b.gender !== 'female') return -1;
        if (a.gender !== 'female' && b.gender === 'female') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Obtém a melhor voz para o idioma
   */
  static async getBestVoice(language: 'pt-BR' | 'en-US' = 'pt-BR'): Promise<SpeechSynthesisVoice | null> {
    try {
      const voiceOptions = await this.getVoiceOptions(language);
      
      if (voiceOptions.length === 0) {
        console.warn('⚠️ Nenhuma voz encontrada para o idioma:', language);
        return null;
      }
      
      // Prioriza voz feminina moçambicana/lusófona
      const femaleVoice = voiceOptions.find(v => 
        v.gender === 'female' && 
        (v.language.includes('BR') || v.language.includes('pt'))
      );
      
      if (femaleVoice && femaleVoice.voice) {
        console.log('🎤 Usando voz feminina lusófona:', femaleVoice.name);
        return femaleVoice.voice;
      }
      
      // Fallback para qualquer voz feminina
      const anyFemale = voiceOptions.find(v => v.gender === 'female' && v.voice);
      if (anyFemale) {
        console.log('🎤 Usando voz feminina:', anyFemale.name);
        return anyFemale.voice;
      }
      
      // Fallback para voz padrão do idioma
      const defaultVoice = voiceOptions.find(v => v.isDefault && v.voice);
      if (defaultVoice) {
        console.log('🎤 Usando voz padrão:', defaultVoice.name);
        return defaultVoice.voice;
      }
      
      // Última opção: primeira voz disponível
      const firstVoice = voiceOptions.find(v => v.voice);
      if (firstVoice) {
        console.log('🎤 Usando primeira voz disponível:', firstVoice.name);
        return firstVoice.voice;
      }
      
      console.warn('⚠️ Nenhuma voz válida encontrada');
      return null;
      
    } catch (error) {
      console.error('❌ Erro ao obter melhor voz:', error);
      return null;
    }
  }

  /**
   * Fala um texto
   */
  static async speak(
    text: string, 
    language: 'pt-BR' | 'en-US' = 'pt-BR',
    config: Partial<SpeechConfig> = {}
  ): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Text-to-Speech não suportado neste navegador');
    }

    if (!text.trim()) {
      throw new Error('Texto vazio não pode ser falado');
    }

    // Garantir que as vozes estão carregadas
    await this.initialize();

    // Para qualquer fala atual
    this.stop();
    
    // Aguardar um pouco para garantir que a síntese anterior parou
    await new Promise(resolve => setTimeout(resolve, 100));

    const finalConfig = { ...this.userConfig, ...config };
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurações de voz
    utterance.lang = language;
    utterance.rate = Math.max(0.1, Math.min(10, finalConfig.rate));
    utterance.pitch = Math.max(0, Math.min(2, finalConfig.pitch));
    utterance.volume = Math.max(0, Math.min(1, finalConfig.volume));

    // ESTRATÉGIA SEGURA: Sempre buscar voz por nome, nunca usar objeto direto
    let voiceToUse: SpeechSynthesisVoice | null = null;
    
    try {
      const availableVoices = speechSynthesis.getVoices();
      
      // 1. Tentar usar voz pelo nome (mais seguro)
      if (finalConfig.voiceName) {
        voiceToUse = availableVoices.find(v => v.name === finalConfig.voiceName) || null;
        if (voiceToUse) {
          console.log('🎤 Voz encontrada pelo nome salvo:', voiceToUse.name);
        } else {
          console.warn('⚠️ Voz salva não encontrada:', finalConfig.voiceName);
        }
      }
      
      // 2. Se não encontrou por nome, tentar pelo objeto (com validação extra)
      if (!voiceToUse && finalConfig.voice) {
        // Verificação dupla: instanceof E se ainda existe na lista
        if (finalConfig.voice instanceof SpeechSynthesisVoice) {
          const voiceStillExists = availableVoices.find(v => 
            v.name === finalConfig.voice!.name && 
            v.lang === finalConfig.voice!.lang
          );
          
          if (voiceStillExists) {
            voiceToUse = voiceStillExists; // Usar a voz da lista, não a do config
            console.log('🎤 Voz validada pelo objeto:', voiceToUse.name);
          } else {
            console.warn('⚠️ Voz do objeto não existe mais na lista');
          }
        } else {
          console.warn('⚠️ Objeto voice não é instância válida de SpeechSynthesisVoice');
          // Limpar configuração inválida
          this.userConfig.voice = undefined;
          this.userConfig.voiceName = undefined;
        }
      }
      
      // 3. Se ainda não encontrou, buscar melhor voz disponível
      if (!voiceToUse) {
        voiceToUse = await this.getBestVoice(language);
        if (voiceToUse) {
          console.log('🎤 Usando melhor voz encontrada:', voiceToUse.name);
        }
      }
      
      // 4. Atribuir voz apenas se for válida
      if (voiceToUse && voiceToUse instanceof SpeechSynthesisVoice) {
        // Validação final: tentar atribuir em try/catch
        try {
          utterance.voice = voiceToUse;
          console.log('✅ Voz atribuída com sucesso:', voiceToUse.name);
        } catch (assignError) {
          console.error('❌ Erro ao atribuir voz:', assignError);
          // Não atribuir voz, usar padrão do sistema
        }
      } else {
        console.log('ℹ️ Usando voz padrão do sistema');
      }
      
    } catch (error) {
      console.warn('⚠️ Erro na seleção de voz, usando padrão do sistema:', error.message);
      // Limpar configurações problemáticas
      this.userConfig.voice = undefined;
      this.userConfig.voiceName = undefined;
    }

    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        console.log('🔊 Iniciando síntese de voz:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        console.log('✅ Síntese de voz concluída');
        this.currentUtterance = null;
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('❌ Erro na síntese de voz:', event.error);
        this.currentUtterance = null;
        
        // Tratar "interrupted" como caso normal, não como erro fatal
        if (event.error === 'interrupted') {
          console.log('ℹ️ Síntese interrompida pelo usuário ou sistema');
          resolve(); // Resolver normalmente, não rejeitar
        } else {
          reject(new Error(`Erro na síntese de voz: ${event.error}`));
        }
      };

      utterance.onpause = () => {
        console.log('⏸️ Síntese de voz pausada');
      };

      utterance.onresume = () => {
        console.log('▶️ Síntese de voz retomada');
      };

      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Para a fala atual
   */
  static stop(): void {
    try {
      if (this.synthesis.speaking || this.synthesis.pending) {
        this.synthesis.cancel();
      }
      this.currentUtterance = null;
    } catch (error) {
      console.warn('⚠️ Erro ao parar síntese:', error);
      this.currentUtterance = null;
    }
  }

  /**
   * Pausa a fala atual
   */
  static pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Retoma a fala pausada
   */
  static resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Verifica se está falando
   */
  static isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Verifica se está pausado
   */
  static isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Verifica se há fala pendente
   */
  static isPending(): boolean {
    return this.synthesis.pending;
  }

  /**
   * Verifica suporte do navegador
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Obtém configuração atual
   */
  static getConfig(): SpeechConfig {
    return { ...this.userConfig };
  }

  /**
   * Atualiza configuração do usuário
   */
  static updateConfig(config: Partial<SpeechConfig>): void {
    this.userConfig = { ...this.userConfig, ...config };
    
    // Se uma voz foi definida, salvar apenas o nome para persistência
    if (config.voice && config.voice instanceof SpeechSynthesisVoice) {
      this.userConfig.voiceName = config.voice.name;
    }
    
    // Salva no localStorage (sem o objeto voice que não pode ser serializado)
    try {
      const configToSave = { ...this.userConfig };
      delete configToSave.voice; // Remove objeto voice antes de salvar
      localStorage.setItem('txopito_speech_config', JSON.stringify(configToSave));
    } catch (error) {
      console.warn('Não foi possível salvar configuração de voz:', error);
    }
  }

  /**
   * Limpa configurações corrompidas do localStorage
   */
  static cleanCorruptedConfig(): void {
    try {
      const saved = localStorage.getItem('txopito_speech_config');
      if (saved) {
        const config = JSON.parse(saved);
        
        // Se há um objeto voice salvo (que não deveria existir), limpar
        if (config.voice && typeof config.voice === 'object') {
          console.warn('🧹 Limpando configuração corrompida com objeto voice');
          delete config.voice;
          localStorage.setItem('txopito_speech_config', JSON.stringify(config));
        }
        
        // Se há voiceName mas não é string, limpar
        if (config.voiceName && typeof config.voiceName !== 'string') {
          console.warn('🧹 Limpando voiceName inválido');
          delete config.voiceName;
          localStorage.setItem('txopito_speech_config', JSON.stringify(config));
        }
      }
    } catch (error) {
      console.warn('Erro ao limpar configuração corrompida, removendo tudo:', error);
      localStorage.removeItem('txopito_speech_config');
    }
  }

  /**
   * Carrega configuração do localStorage
   */
  static async loadConfig(): Promise<void> {
    try {
      // Primeiro, limpar qualquer configuração corrompida
      this.cleanCorruptedConfig();
      
      const saved = localStorage.getItem('txopito_speech_config');
      if (saved) {
        const config = JSON.parse(saved);
        this.userConfig = { ...this.defaultConfig, ...config };
        
        // Se há um nome de voz salvo, tentar reconstruir a referência
        if (config.voiceName && typeof config.voiceName === 'string') {
          await this.initialize(); // Garantir que vozes estão carregadas
          const voices = await this.getVoices();
          const savedVoice = voices.find(v => v.name === config.voiceName);
          if (savedVoice) {
            this.userConfig.voice = savedVoice;
            console.log('🎤 Voz restaurada do localStorage:', savedVoice.name);
          } else {
            console.warn('⚠️ Voz salva não encontrada:', config.voiceName);
            this.userConfig.voiceName = undefined;
            // Atualizar localStorage sem a voz inválida
            this.updateConfig({});
          }
        }
      }
    } catch (error) {
      console.warn('Não foi possível carregar configuração de voz:', error);
      // Em caso de erro, limpar tudo e usar padrão
      localStorage.removeItem('txopito_speech_config');
      this.userConfig = { ...this.defaultConfig };
    }
  }

  /**
   * Reseta para configuração padrão
   */
  static resetConfig(): void {
    this.userConfig = { ...this.defaultConfig };
    localStorage.removeItem('txopito_speech_config');
  }

  /**
   * Detecta gênero da voz pelo nome
   */
  private static detectGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' {
    const name = voice.name.toLowerCase();
    
    // Nomes femininos comuns
    const femaleKeywords = [
      'female', 'woman', 'feminina', 'mulher',
      'maria', 'ana', 'lucia', 'helena', 'sofia',
      'samantha', 'victoria', 'alice', 'clara',
      'zira', 'hazel', 'karen', 'susan'
    ];
    
    // Nomes masculinos comuns
    const maleKeywords = [
      'male', 'man', 'masculino', 'homem',
      'carlos', 'daniel', 'ricardo', 'felipe',
      'david', 'mark', 'paul', 'alex',
      'diego', 'jorge', 'pedro'
    ];
    
    if (femaleKeywords.some(keyword => name.includes(keyword))) {
      return 'female';
    }
    
    if (maleKeywords.some(keyword => name.includes(keyword))) {
      return 'male';
    }
    
    return 'unknown';
  }

  /**
   * Obtém nome amigável da voz
   */
  private static getVoiceName(voice: SpeechSynthesisVoice): string {
    // Remove prefixos técnicos comuns
    let name = voice.name
      .replace(/^Microsoft\s+/i, '')
      .replace(/^Google\s+/i, '')
      .replace(/^Apple\s+/i, '')
      .replace(/\s+\(.*?\)$/, '') // Remove (Enhanced) etc
      .trim();
    
    // Se o nome ainda é muito técnico, usa um nome genérico
    if (name.length > 30 || /^[A-Z0-9_-]+$/i.test(name)) {
      const gender = this.detectGender(voice);
      const lang = voice.lang.includes('pt') ? 'Português' : 'English';
      
      if (gender === 'female') {
        return `Voz Feminina (${lang})`;
      } else if (gender === 'male') {
        return `Voz Masculina (${lang})`;
      } else {
        return `Voz ${lang}`;
      }
    }
    
    return name;
  }

  /**
   * Testa uma voz com texto de exemplo
   */
  static async testVoice(voice: SpeechSynthesisVoice, language: 'pt-BR' | 'en-US' = 'pt-BR'): Promise<void> {
    const testText = language === 'pt-BR' 
      ? 'Olá! Esta é uma demonstração da minha voz. Como você está hoje?'
      : 'Hello! This is a demonstration of my voice. How are you today?';
    
    await this.speak(testText, language, { voice });
  }
}

// Inicializa o serviço quando o módulo é carregado
if (typeof window !== 'undefined') {
  SpeechService.initialize().then(() => {
    SpeechService.loadConfig();
  });
}

export default SpeechService;