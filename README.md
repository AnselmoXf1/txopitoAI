# 🎓 TXOPITO IA – Campus AI Expandido

> **Assistente educacional e consultivo multifuncional com comportamento OpenAI, gamificação, capacidades multimodais e memória contextual avançada.**

O **TXOPITO IA** é uma aplicação web progressiva (PWA) projetada para auxiliar estudantes e profissionais com uma abordagem inspirada no ChatGPT da OpenAI. Diferente de chatbots genéricos, ele possui "personas" especializadas (Domínios), sistema de gamificação, memória contextual por usuário e capacidades multimodais avançadas.

A aplicação opera em uma arquitetura **Serverless/Local-First** para o MVP, simulando um backend robusto através do LocalStorage, permitindo persistência de dados, autenticação, histórico de sessões e **memória contextual personalizada** sem necessidade de configuração de servidor inicial.

---

## 🚀 Funcionalidades Principais

### 🤖 Comportamento OpenAI Avançado
Inspirado no ChatGPT, o assistente adota princípios comportamentais profissionais:
- **Comunicação clara e estruturada** sem julgamento ou arrogância
- **Explicação do porquê e do como**, não apenas respostas diretas
- **Admissão de limitações** e incertezas quando apropriado
- **Foco no aprendizado** e compreensão do usuário
- **Neutralidade ética** e responsabilidade educacional

### 🧠 Múltiplos Domínios de Conhecimento Integrados
O assistente alterna seu "System Prompt" e personalidade baseando-se na área escolhida:
1.  **💻 Programação:** Mentor técnico sênior (Lógica, Debug, Web, Python, IA, etc.)
2.  **💼 Consultoria:** Estrategista empresarial (Carreira, Empreendedorismo, SWOT, Liderança)
3.  **📜 Teologia:** Educador religioso não dogmático (História, Ética, Filosofia, Diálogo)
4.  **🌱 Agricultura:** Consultor técnico sustentável (Manejo, Tecnologia, Economia Rural)
5.  **🧮 Contabilidade:** Educador financeiro (Gestão, Impostos, Investimentos, Análise)
6.  **🧠 Psicologia:** Professor educacional (Teorias, Bem-estar, Desenvolvimento, Comportamento)

### 🧠 Sistema de Memória Contextual Avançado
**Inspirado no comportamento do ChatGPT**, o sistema implementa três níveis de memória:
- **Curto Prazo (Sessão)**: Mantém coerência da conversa atual (20 mensagens)
- **Médio Prazo (Semanal)**: Tópicos frequentes, interesses e projetos em andamento
- **Longo Prazo (Perfil)**: Nível de conhecimento, estilo de aprendizagem, objetivos e estatísticas

**Funcionalidades da Memória:**
- 🎯 **Personalização Automática**: Adapta respostas ao nível e interesses do usuário
- 📚 **Continuidade Educacional**: Lembra conversas anteriores e evolução do aprendizado
- 🔍 **Análise Inteligente**: Detecta automaticamente nível, interesses e objetivos
- 🎨 **Contexto Dinâmico**: Injeta informações relevantes no prompt da IA
- 🔒 **Controle Total**: Usuário pode ver, editar ou limpar sua memória

### 🔐 Sistema de Autenticação Completo
Sistema robusto de autenticação e segurança:
- **Registro seguro** com confirmação de email obrigatória
- **Login protegido** com hash de senhas (simulação bcrypt)
- **Recuperação de senha** por email com tokens seguros
- **Validação de força** de senhas em tempo real
- **Sistema de tokens** com expiração automática
- **Interface responsiva** para mobile e desktop
- **Debug de emails** em desenvolvimento

### 🎨 Multimodalidade (Visão, Voz e Imagem)
Integração profunda com a API do Google Gemini 2.5 Flash:
-   **Chat de Texto:** Respostas contextuais e formatadas em Markdown com o modelo mais avançado.
-   **Visão (Upload):** O usuário pode enviar fotos (códigos, plantas, diagramas) para análise.
-   **Geração de Imagens:** Criação de gráficos ou ilustrações didáticas via `Imagen 4.0`.
-   **Voz (Bidirecional):**
    -   *Speech-to-Text:* Digitação por voz.
    -   *Text-to-Speech:* O bot pode ler as respostas em voz alta.

### 🎮 Gamificação (Rank System)
O usuário ganha **XP** (Pontos de Experiência) ao interagir, subir arquivos ou gerar conteúdo.
-   **Níveis:** A dificuldade aumenta progressivamente (Nível * 200 XP).
-   **Ranks:**
    -   Estagiário (Nível 1-4)
    -   Júnior (Nível 5-9)
    -   Pleno (Nível 10-19)
    -   Sênior (Nível 20-49)
    -   Especialista (Nível 50+)

### 🛡️ Sistema de Fallback Robusto
Garante funcionamento contínuo mesmo com serviços externos indisponíveis:
-   **Login Social:** Informa sobre indisponibilidade do Google/GitHub e sugere alternativas
-   **IA Offline:** Fornece respostas educacionais básicas quando Gemini está offline
-   **Geração de Imagem:** Explica problemas e oferece alternativas conceituais
-   **Indicadores Visuais:** Mostra status dos serviços em tempo real

### 🔐 Autenticação e Persistência
-   Login e Registro simulados (armazenados localmente).
-   Histórico de conversas salvo por usuário.
-   Preferências de usuário (Tema, Acessibilidade/Alto Contraste).
-   **Fallback para login social** com mensagens informativas.
-   **Memória contextual persistente** por usuário.

---

## 🛠 Tech Stack

### Frontend
-   **React 19:** Biblioteca de UI com hooks avançados.
-   **Tailwind CSS:** Estilização utilitária e responsiva.
-   **Lucide React:** Ícones vetoriais leves.
-   **Vite/ESM:** Build e importação de módulos otimizada.

### Inteligência Artificial (Google GenAI SDK)
-   **Chat & Visão:** Modelo `gemini-2.5-flash` (Mais recente, rápido e suporta imagens + texto).
-   **Geração de Imagens:** Modelo `imagen-4.0-generate-001` (Imagen 4.0 com qualidade superior).

### Backend (Simulado com Arquitetura Profissional)
-   **Arquitetura:** Camada de serviço isolada em `/backend` com padrões enterprise.
-   **Persistence:** `localStorage` browser API atuando como banco de dados NoSQL.
-   **Business Logic:** Separação clara entre `api.ts` (regras de negócio) e `database.ts` (acesso a dados).
-   **Memory System:** Sistema de memória contextual com três níveis (curto, médio, longo prazo).
-   **Logging:** Sistema estruturado com níveis e contexto para debugging.
-   **Validation:** Sanitização e validação robusta de dados de entrada.
-   **Caching:** Sistema de cache em memória com TTL para performance.
-   **Fallback:** Sistema robusto de fallback para APIs indisponíveis.

---

## 📂 Estrutura do Projeto

```
/
├── components/              # Componentes Reutilizáveis de UI
│   ├── AuthScreen.tsx      # Tela de Login/Registro com fallbacks
│   ├── InputArea.tsx       # Input multimodal (texto, voz, anexo)
│   ├── MessageBubble.tsx   # Renderiza texto (Markdown), Imagens e Áudio
│   ├── Sidebar.tsx         # Navegação de chats e domínios
│   ├── RightSidebar.tsx    # Perfil do usuário, Stats e Rank
│   ├── MemoryPanel.tsx     # Painel de memória contextual
│   └── FallbackIndicator.tsx # Indicadores de status de serviços
├── backend/                # Camada de Dados e Regras de Negócio (Arquitetura Enterprise)
│   ├── index.ts           # Ponto de entrada e inicialização
│   ├── api.ts             # Serviços de Auth, User XP e Chat
│   ├── database.ts        # Wrapper do LocalStorage
│   ├── memoryService.ts   # Sistema de memória contextual avançado
│   ├── config.ts          # Configurações centralizadas
│   ├── logger.ts          # Sistema de logging estruturado
│   ├── validators.ts      # Validação e sanitização de dados
│   └── cache.ts           # Sistema de cache em memória
├── services/
│   ├── geminiService.ts   # Integração com Google GenAI API
│   └── fallbackService.ts # Respostas educativas quando IA offline
├── types.ts               # Definições de Tipos TypeScript (User, Session, Message, Memory)
├── constants.ts           # Configuração dos Domínios e Prompts do Sistema (Estilo OpenAI)
├── App.tsx                # Componente Principal e Gerenciamento de Estado
├── index.html             # Ponto de entrada
└── docs/                  # Documentação Técnica
    ├── FALLBACK_SYSTEM.md     # Sistema de fallback
    ├── MEMORIA_CONTEXTUAL.md  # Sistema de memória
    └── MODELS_INFO.md         # Informações dos modelos de IA
```

---

## 🚦 Como Executar

1.  **Variáveis de Ambiente:**
    Certifique-se de que a chave da API do Google Gemini está configurada no ambiente (process.env.API_KEY).

2.  **Instalação de Dependências:**
    O projeto utiliza importmap via ESM (definido no `index.html`), portanto, para desenvolvimento local, não é estritamente necessário `npm install` pesado se rodar via um servidor simples, mas recomenda-se um ambiente Node padrão.

3.  **Rodando a Aplicação:**
    Abra o `index.html` via um servidor local (ex: Live Server ou `npm run dev` se configurado com Vite).

---

## ✨ Detalhes de UX/UI

-   **Design Responsivo:** Funciona perfeitamente em Mobile (Menu Hambúrguer) e Desktop (Sidebars fixas).
-   **Animações:** Feedback visual de carregamento, transições de sidebar e background animado na tela de login.
-   **Feedback Otimista:** As mensagens do usuário aparecem instantaneamente enquanto a IA processa.

---

**Desenvolvido com foco em Educação Ética e Acessibilidade.**

---

## 👨‍💻 **Sobre o Criador**

O **TXOPITO IA** foi desenvolvido por **Anselmo Dora Bistiro Gulane**, um jovem desenvolvedor apaixonado por tecnologia e educação.

### 🎯 **Perfil do Desenvolvedor**
- **Idade:** 20 anos
- **Formação:** Estudante de EIT (Engenharia de Informática e Telecomunicações)
- **Especialidade:** Programador Fullstack
- **Experiência Profissional:**
  - **KukulaDevz** - Equipe de desenvolvimento
  - **N-AEP Soluções** - Empresa de soluções tecnológicas

### 💡 **Visão e Missão**
Anselmo criou o TXOPITO IA com o objetivo de **democratizar o acesso ao conhecimento através da inteligência artificial**, acreditando que educação de qualidade deve estar ao alcance de todos.

### 🌍 **Impacto Social**
O projeto representa a paixão de um jovem desenvolvedor africano por usar tecnologia para capacitar pessoas e promover o aprendizado contínuo em múltiplas áreas do conhecimento.

---

## 🤖 Comportamento OpenAI Implementado

O TXOPITO IA foi desenvolvido seguindo os princípios comportamentais do ChatGPT da OpenAI:

### **Estrutura Padrão das Respostas**
1. **Enquadramento** do tema
2. **Explicação clara** do conceito  
3. **Exemplos práticos** ou analogias
4. **Integração entre áreas** (quando aplicável)
5. **Resumo objetivo**
6. **Próximo passo** sugerido

### **Papel Funcional Multidisciplinar**
- **Explicador**: Traduz conceitos complexos em linguagem simples
- **Educador**: Ensina passo a passo, com exemplos e resumos
- **Consultor**: Sugere caminhos, boas práticas e alternativas
- **Facilitador**: Ajusta explicações conforme o feedback
- **Apoio à decisão**: Ajuda a pensar melhor, não decide pelo usuário

### **Princípios Éticos Rigorosos**
- Não substitui médicos, psicólogos, advogados ou contadores
- Não fornece diagnósticos nem decisões críticas
- Atua sempre como apoio informativo e educativo
- Incentiva a procura de profissionais quando necessário
- Mantém neutralidade acadêmica e respeito à diversidade

---

## 🧠 Sistema de Memória Contextual

O TXOPITO IA possui um sistema avançado de memória contextual que permite personalização real:

### **Três Níveis de Memória**
- **Curto Prazo**: Contexto da sessão atual (últimas 20 mensagens)
- **Médio Prazo**: Informações da última semana (interesses, projetos)
- **Longo Prazo**: Perfil consolidado (nível, estilo, objetivos, estatísticas)

### **Análise Inteligente Automática**
- 🎯 **Detecção de Nível**: Identifica automaticamente iniciante/intermediário/avançado
- 📚 **Extração de Interesses**: Reconhece tópicos de interesse por domínio
- 🎨 **Identificação de Objetivos**: Detecta metas de aprendizado nas conversas
- 🔄 **Adaptação Contínua**: Evolui com cada interação do usuário

### **Personalização Inteligente**
- Adapta linguagem ao nível de conhecimento
- Evita repetições desnecessárias
- Mantém continuidade entre conversas
- Sugere conteúdo relevante aos interesses
- Acompanha progresso educacional

Para mais detalhes, consulte [MEMORIA_CONTEXTUAL.md](./MEMORIA_CONTEXTUAL.md).

---

## 🛡️ Sistema de Fallback

O TXOPITO IA possui um sistema robusto de fallback que garante funcionamento contínuo mesmo quando serviços externos estão indisponíveis.

### 🔐 Login Social
- **Google/GitHub:** Informa que ainda não estão disponíveis
- **Indicadores visuais:** Pontos amarelos pulsantes nos botões
- **Alternativa:** Sugere uso de email e senha

### 🤖 IA Offline
- **Detecção automática:** Identifica falhas na API do Gemini
- **Respostas educativas:** Conteúdo básico por domínio sempre disponível
- **Transparência:** Informa sobre o status offline

### 🎨 Geração de Imagem
- **Fallback inteligente:** Explica problemas técnicos
- **Alternativas:** Sugere descrições conceituais
- **Retry automático:** Orienta sobre quando tentar novamente

Para mais detalhes, consulte [FALLBACK_SYSTEM.md](./FALLBACK_SYSTEM.md).
