# 🧠 Coworker — Assistente Pessoal Inteligente

> Um copiloto pessoal proativo, unificado e inteligente projetado para centralizar a rotina, finanças, produtividade e automação residencial em um único ecossistema.

---

## 🎯 Visão Geral

O objetivo do projeto é conectar os diferentes pilares da vida diária (compromissos, finanças, afazeres e dispositivos inteligentes) a um cérebro digital capaz de antecipar necessidades, emitir briefings matinais, executar comandos por voz e oferecer clareza operacional para o dia a dia.

---

## Os Quatro Pilares do Coworker

```
                       ┌────────────────────────┐
                       │     RIAN COWORKER      │
                       │   (Núcleo do Agente)   │
                       └───────────┬────────────┘
                                   │
      ┌────────────────┬───────────┴───────────┬────────────────┐
      │                │                       │                │
┌─────▼──────┐  ┌──────▼──────┐         ┌──────▼──────┐  ┌──────▼──────┐
│  AGENDA &  │  │  FINANÇAS   │         │ CASA INTEL. │  │ TAREFAS &   │
│ COMPROMIS. │  │  PESSOAIS   │         │   & ALEXA   │  │ PRODUTIV.   │
└────────────┘  └─────────────┘         └─────────────┘  └─────────────┘
```

1. **Proatividade Contextual**: Em vez de apenas responder quando chamado, o Rian Coworker analisa eventos próximos, metas de gastos e pendências para alertar antes que problemas ocorram (ex: alertar sobre trânsito antes de uma reunião ou lembrar de faturas a vencer).
2. **Memória de Longo Prazo**: O agente preserva preferências, hábitos e contexto histórico por meio de uma base de memória vetorial (RAG), lembrando-se de conversas passadas e diretrizes estabelecidas.
3. **Privacidade e Controle**: Arquitetura projetada para priorizar a soberania dos dados do usuário, suportando tanto provedores de ponta em nuvem (Claude, Gemini, OpenAI) quanto modelos locais executados offline via Ollama.
4. **Multicanalidade**: O assistente poderá ser acessado pelo dashboard web, por comandos de voz nos dispositivos Amazon Echo (Alexa) e futuramente via mensagens diretas no WhatsApp ou Telegram.

---

## 🧩 Módulos do Sistema

### 1. 📅 Agenda Inteligente
- Sincronização bidirecional com o **Google Calendar**.
- Identificação automática de blocos de foco e preparação pré-reunião.
- Notificações de compromissos eminentes com contagem regressiva em tempo real.

### 2. 💰 Finanças Pessoais
- Gestão orçamentária mensal com limites por categorias (Moradia, Mercado, Lazer, Transporte).
- Integração segura planejada via **Open Finance** para leitura automatizada de extratos e cartões.
- Previsões de fechamento de mês e alertas de faturas próximas do vencimento.

### 3. 🏠 Casa Conectada & Alexa
- Hub de controle unificado para iluminação, climatização, eletrônicos e tomadas inteligentes.
- Acionamento rápido de rotinas (*"Bom dia"*, *"Modo Foco"*, *"Cinema em Casa"*, *"Saindo de casa"*).
- Skill customizada da Alexa para alimentar o agente com comandos de voz diretos do ambiente doméstico.

### 4. ✅ Tarefas & Produtividade
- Lista ágil de afazeres diários com priorização e filtros dinâmicos.
- Capacidade de decompor metas complexas em subtarefas executáveis através do assistente.
- Contadores reativos que comunicam o progresso em toda a interface.

### 5. 🔌 Central de Integrações
- Painel para conectar e gerenciar serviços externos:
  - **Google Calendar** (Eventos e lembretes)
  - **Amazon Alexa** (Voz e dispositivos Echo)
  - **Open Finance Brasil** (Bancos e extratos)
  - **WhatsApp / Telegram** (Mensagens e resumos móveis)
  - **Home Assistant** (Automação local e protocolo Zigbee/Matter)

### 6. ⚙️ Base do Sistema & Configurações
- Ajuste fino da personalidade e do tom de comunicação do agente (Conciso, Analítico ou Amigável).
- Seleção dinâmica do modelo LLM orquestrador e chaves de API.
- Configurações de privacidade, persistência local e horários de briefings proativos.

---

## 🛠️ Arquitetura Técnica Prevista

| Camada | Tecnologia Planejada | Função |
| :--- | :--- | :--- |
| **Interface / Frontend** | HTML5, CSS3 Moderno, JavaScript SPA | Dashboard visual limpo, rápido e responsivo, sem dependência de builds pesados |
| **Núcleo do Agente** | Python 3.12+ (FastAPI / LangChain ou Agentes Nativos) | Orquestração do loop de raciocínio, chamadas de ferramentas e prompts do sistema |
| **Modelos de Linguagem** | Claude 3.7 Sonnet / Google Gemini 2.5 / GPT-4o / Ollama | Raciocínio, geração de resumos e processamento de linguagem natural |
| **Banco de Dados Relacional** | SQLite / PostgreSQL | Armazenamento seguro de tarefas, categorias financeiras e histórico de eventos |
| **Memória Semântica (RAG)** | ChromaDB ou LanceDB | Indexação vetorial para armazenamento de preferências e memória contínua |
| **Voz & IoT** | Alexa Skills Kit (ASK) & Home Assistant API | Recepção de comandos por voz e controle dos atuadores domésticos |

---

## 🗺️ Roadmap de Implementação

- [x] **Fase 1: Fundação Visual & Navegação**
  - [x] Extração e adaptação do design mockup original
  - [x] Sistema de design com modo escuro e claro persistente
  - [x] Navegação SPA fluida entre todas as 8 páginas/módulos
  - [x] Interatividades visuais funcionais (tarefas, interruptores, feedback toast)
- [x] **Fase 2 & 3: Mecanismo de Integração com Google Calendar API**
  - [x] Autenticação segura OAuth 2.0 com renovação automática por Refresh Token
  - [x] Endpoints REST locais (`/api/calendar/events`, `/api/calendar/auth`, `/api/calendar/status`, etc.)
  - [x] Sincronização em tempo real da agenda do usuário com o dashboard
  - [x] Modais interativos para criação de eventos com Google Meet e adição rápida em linguagem natural
  - [x] Exclusão e filtros de compromissos por período (Hoje, Amanhã, Semana)
- [ ] **Fase 4: Integração de Casa Inteligente (Alexa)**
  - [ ] Desenvolvimento da Skill Alexa personalizada
  - [ ] Webhook para sincronizar estado de lâmpadas e rotinas
- [ ] **Fase 5: Finanças com Open Finance**
  - [ ] Integração com agregadores de Open Finance
  - [ ] Categorização automática de lançamentos usando inteligência artificial
- [ ] **Fase 6: Agente Proativo & Resumo Matinal**
  - [ ] Agendador de tarefas em segundo plano (Cron/Celery)
  - [ ] Envio automático de briefing diário matinal

---

## 📅 Como Usar a Integração com o Google Calendar

O assistente possui um gateway completo para comunicação bidirecional com a API do Google Calendar.

### 1. Iniciar o Servidor Integrado
No terminal da pasta do projeto, execute:
```bash
node server.js
```
O servidor iniciará em `http://localhost:3001` servindo tanto o frontend quanto os endpoints da API.

### 2. Conectar sua Conta Google
1. Abra `http://localhost:3001` no navegador.
2. Na página **Agenda** ou **Integrações**, clique em **"Configurar / Conta"**.
3. Siga o guia passo a passo em [`COMO-CONFIGURAR-GOOGLE-CALENDAR.md`](file:///C:/Users/vilanova/Desktop/workspace/rian-coworker/integrations/google-calendar/COMO-CONFIGURAR-GOOGLE-CALENDAR.md) para obter seu **Client ID** e **Client Secret** gratuitos no Google Cloud Console.
4. Salve as credenciais e clique em **"Conectar com Google"**.
5. Autorize o acesso à sua conta. A aplicação redirecionará de volta para o Rian Coworker com a agenda sincronizada!

### 3. Criar e Gerenciar Eventos
- **Novo Evento**: Clique no botão "+ Novo evento" para agendar com data, hora, local e geração automática de link para videoconferência no **Google Meet**.
- **Adição Rápida**: Clique em "Adição Rápida" para digitar comandos como *"Almoço com time amanhã às 12h30"* e deixar o Google entender os horários.
- **Sincronização em Tempo Real**: Clique em "Sincronizar agora" para atualizar os compromissos em tempo real.
- **Modo Offline / Demonstração**: Caso o servidor ou credenciais ainda não tenham sido configurados, a interface opera perfeitamente com dados de demonstração interativos.

---

## 📂 Estrutura de Arquivos

```
rian-coworker/
├── index.html                   # Interface SPA completa e navegável
├── style.css                    # Folha de estilo e design system
├── app.js                       # Lógica da aplicação, navegação e cliente da Google Calendar API
├── server.js                    # Servidor local Node.js e API Gateway (/api/calendar/*)
├── integrations/
│   └── google-calendar/
│       ├── google-calendar-service.js          # Serviço OAuth 2.0 e cliente da API Google Calendar
│       ├── config.json                         # Credenciais (Client ID, Client Secret)
│       └── COMO-CONFIGURAR-GOOGLE-CALENDAR.md  # Tutorial passo a passo do Google Cloud Console
└── README.md                    # Documentação geral do projeto
```

