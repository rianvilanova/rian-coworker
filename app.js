/**
 * Rian Coworker - Application Logic & Multi-Account Google Calendar Integration
 * 
 * Suporte a navegação SPA, temas, interatividades de tarefas, IoT
 * e gerenciamento unificado de MÚLTIPLAS CONTAS do Google Calendar (OAuth2, agregação e criação por conta).
 */

(function () {
  'use strict';

  // Helper para datas relativas de demonstração
  const getRelativeMockDate = (dayOffset, h, m) => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  // --- Estado Global da Aplicação ---
  const state = {
    theme: localStorage.getItem('rian_theme') || 'dark',
    currentPage: 'inicio',
    tasks: [
      { id: 't1', title: 'Pagar fatura do cartão', meta: 'Vence dia 20', category: 'Finanças', done: false, priority: true },
      { id: 't2', title: 'Marcar consulta no dentista', meta: 'Esta semana', category: 'Saúde', done: false, priority: false },
      { id: 't3', title: 'Definir a arquitetura do núcleo do agente', meta: 'Projeto Rian', category: 'Trabalho', done: true, priority: true },
      { id: 't4', title: 'Revisar assinaturas mensais', meta: 'Finanças', category: 'Finanças', done: false, priority: false },
      { id: 't5', title: 'Comprar presente de aniversário', meta: 'Sábado que vem', category: 'Pessoal', done: false, priority: false }
    ],
    devices: [
      { id: 'luz', name: 'Luz da sala', room: 'Sala de Estar', meta: 'Echo Dot · Sala', on: true },
      { id: 'ar', name: 'Ar-condicionado', room: 'Quarto', meta: 'Quarto', on: false },
      { id: 'cafe', name: 'Tomada da cafeteira', room: 'Cozinha', meta: 'Cozinha', on: false },
      { id: 'tv', name: 'Smart TV 55"', room: 'Sala de Estar', meta: 'Sala', on: false },
      { id: 'mesa', name: 'Lâmpada da mesa', room: 'Escritório', meta: 'Echo Show · Escritório', on: true },
      { id: 'som', name: 'Som Ambiente', room: 'Sala de Estar', meta: 'Spotify Connect', on: false }
    ],
    taskFilter: 'todas',
    deviceFilter: 'todos',
    
    // Estado da Integração com Google Calendar (Multi-Contas)
    calendar: {
      connected: false,
      configured: false,
      accounts: [],
      primaryEmail: null,
      accountFilter: 'all',
      periodFilter: 'hoje',
      viewMode: 'month',
      currentDate: new Date(),
      syncing: false,
      lastSync: null,
      events: [
        {
          id: 'mock_1',
          title: 'Revisão semanal com time',
          time: '10:30',
          meta: 'Foco e Alinhamento · Google Meet',
          start: getRelativeMockDate(0, 10, 30),
          end: getRelativeMockDate(0, 11, 30),
          location: 'Google Meet',
          meetLink: 'https://meet.google.com/abc-defg-hij',
          description: 'Alinhamento semanal com a equipe sobre os entregáveis da sprint e bloqueios técnicos.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: true
        },
        {
          id: 'mock_2',
          title: 'Almoço com a família',
          time: '12:30',
          meta: 'Restaurante Central · Presencial',
          start: getRelativeMockDate(0, 12, 30),
          end: getRelativeMockDate(0, 14, 0),
          location: 'Restaurante Central',
          description: 'Almoço em família para celebrar o final de semana.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_3',
          title: 'Sessão de estudo do projeto Rian',
          time: '15:00',
          meta: 'Em casa · Bloco de 2 horas',
          start: getRelativeMockDate(0, 15, 0),
          end: getRelativeMockDate(0, 17, 0),
          location: 'Escritório',
          description: 'Desenvolvimento e refatoração da arquitetura do assistente e integrações IoT.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_4',
          title: 'Academia & Treino',
          time: '19:30',
          meta: 'SmartFit · Rotina diária',
          start: getRelativeMockDate(0, 19, 30),
          end: getRelativeMockDate(0, 21, 0),
          location: 'SmartFit',
          description: 'Treino de musculação e cárdio.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_5',
          title: 'Call com Cliente Parceiro',
          time: '11:00',
          meta: 'Google Meet · Apresentação',
          start: getRelativeMockDate(1, 11, 0),
          end: getRelativeMockDate(1, 12, 0),
          location: 'Google Meet',
          meetLink: 'https://meet.google.com/xyz-uvwx-rst',
          description: 'Demonstração dos novos módulos integrados e roadmap da versão 2.0.',
          accountEmail: 'rian.trabalho@gmail.com',
          accountName: 'Rian Trabalho',
          accountColor: '#6fbf8f',
          accountLabel: 'Trabalho',
          isNext: false
        },
        {
          id: 'mock_6',
          title: 'Consulta Médica de Rotina',
          time: '16:00',
          meta: 'Clínica São Bento · Presencial',
          start: getRelativeMockDate(1, 16, 0),
          end: getRelativeMockDate(1, 17, 0),
          location: 'Clínica São Bento, Sala 304',
          description: 'Exames periódicos e avaliação de rotina.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_7',
          title: 'Daily & Planejamento da Semana',
          time: '09:00',
          meta: 'Discord · Voz',
          start: getRelativeMockDate(-1, 9, 0),
          end: getRelativeMockDate(-1, 10, 0),
          location: 'Discord',
          description: 'Definição das metas e prioridades para a semana.',
          accountEmail: 'rian.trabalho@gmail.com',
          accountName: 'Rian Trabalho',
          accountColor: '#6fbf8f',
          accountLabel: 'Trabalho',
          isNext: false
        },
        {
          id: 'mock_8',
          title: 'Workshop de Inteligência Artificial',
          time: '14:00',
          meta: 'Google Meet · Evento Tech',
          start: getRelativeMockDate(3, 14, 0),
          end: getRelativeMockDate(3, 16, 30),
          location: 'Google Meet',
          meetLink: 'https://meet.google.com/ai-workshop-2026',
          description: 'Oficina prática sobre agentes autônomos e arquiteturas com LLMs.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_9',
          title: 'Revisão Financeira & Investimentos',
          time: '10:00',
          meta: 'Home Office · Planejamento',
          start: getRelativeMockDate(5, 10, 0),
          end: getRelativeMockDate(5, 11, 30),
          location: 'Home Office',
          description: 'Acompanhamento do fechamento de contas e metas mensais.',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
          isNext: false
        },
        {
          id: 'mock_10',
          title: 'Jantar com a Equipe',
          time: '18:30',
          meta: 'Restaurante Fasano · Confraternização',
          start: getRelativeMockDate(7, 18, 30),
          end: getRelativeMockDate(7, 21, 0),
          location: 'Restaurante Fasano',
          description: 'Encontro de alinhamento e comemoração do fechamento do ciclo.',
          accountEmail: 'rian.trabalho@gmail.com',
          accountName: 'Rian Trabalho',
          accountColor: '#6fbf8f',
          accountLabel: 'Trabalho',
          isNext: false
        }
      ]
    }
  };

  // Mapeamento de títulos de páginas para Breadcrumb
  const pageTitles = {
    inicio: 'Início',
    agenda: 'Agenda',
    financas: 'Finanças',
    casa: 'Casa e Alexa',
    tarefas: 'Tarefas',
    integracoes: 'Integrações',
    roadmap: 'Base do sistema',
    configuracoes: 'Configurações'
  };

  // --- Notificações Toast ---
  function showToast(message, icon = '✓') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span style="color: var(--accent); font-weight: 600">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- Controle de Modais ---
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');

      if (modalId === 'modal-new-event') {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 15);
        now.setSeconds(0, 0);
        const end = new Date(now.getTime() + 60 * 60 * 1000);

        const toIsoLocal = (d) => {
          const pad = n => String(n).padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        const startInput = document.getElementById('event-start');
        const endInput = document.getElementById('event-end');
        if (startInput && !startInput.value) startInput.value = toIsoLocal(now);
        if (endInput && !endInput.value) endInput.value = toIsoLocal(end);
      }
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // --- Gerenciamento de Tema ---
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('rian_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const isDark = theme === 'dark';
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', isDark ? 'Mudar para o modo claro' : 'Mudar para o modo escuro');
      themeBtn.innerHTML = isDark
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>
           <span>Modo claro</span>`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path></svg>
           <span>Modo escuro</span>`;
    }
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  }

  // --- Navegação entre Páginas ---
  function navigateTo(pageId) {
    if (!pageTitles[pageId]) {
      pageId = 'inicio';
    }

    state.currentPage = pageId;

    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.dataset.page === pageId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    document.querySelectorAll('.page-view').forEach(view => {
      if (view.id === `page-${pageId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) {
      breadcrumbCurrent.textContent = pageTitles[pageId];
    }

    document.title = `${pageTitles[pageId]} · Rian Coworker`;

    if (window.location.hash.split('?')[0] !== `#${pageId}`) {
      window.history.pushState(null, '', `#${pageId}`);
    }

    closeMobileSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHashNavigation() {
    const rawHash = window.location.hash.replace('#', '').trim();
    const cleanHash = rawHash.split('?')[0];

    const urlParams = new URLSearchParams(window.location.search || (rawHash.includes('?') ? rawHash.slice(rawHash.indexOf('?')) : ''));
    if (urlParams.get('auth') === 'success') {
      showToast('Conta Google conectada com sucesso ao Rian Coworker!', '🎉');
      checkGoogleCalendarStatus();
    } else if (urlParams.get('error') || urlParams.get('auth') === 'error') {
      const msg = urlParams.get('msg') || urlParams.get('error');
      showToast(`Falha na autenticação Google: ${msg}`, '⚠️');
    }

    if (cleanHash && pageTitles[cleanHash]) {
      navigateTo(cleanHash);
    } else {
      navigateTo('inicio');
    }
  }

  // --- Controle de Menu Mobile ---
  function toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar && overlay) {
      const isOpen = sidebar.classList.contains('open');
      if (isOpen) {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      } else {
        sidebar.classList.add('open');
        overlay.classList.add('active');
      }
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  }

  // ========================================================
  // INTEGRAÇÃO COM GOOGLE CALENDAR API (MÚLTIPLAS CONTAS)
  // ========================================================

  /**
   * Consulta o status das contas conectadas no backend
   */
  async function checkGoogleCalendarStatus() {
    try {
      const res = await fetch('/api/calendar/status');
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();

      state.calendar.connected = data.connected;
      state.calendar.configured = data.configured;
      state.calendar.accounts = data.accounts || [];
      state.calendar.primaryEmail = data.primaryEmail || null;

      renderAccountsUI();
      updateCalendarStatusUI();

      if (data.connected && state.calendar.accounts.length > 0) {
        syncGoogleCalendar(false);
      }
    } catch {
      // Backend offline ou rodando via file://
      state.calendar.connected = false;
      state.calendar.configured = false;
      state.calendar.accounts = [
        {
          email: 'rianvlnv@gmail.com',
          name: 'Rian Vilanova',
          color: '#6EA1FF',
          label: 'Principal',
          isPrimary: true
        }
      ];
      state.calendar.primaryEmail = 'rianvlnv@gmail.com';
      renderAccountsUI();
      updateCalendarStatusUI();
    }
  }

  /**
   * Renderiza os seletores e listas de contas Google em todos os módulos
   */
  function renderAccountsUI() {
    const accounts = state.calendar.accounts || [];
    const accountsBar = document.getElementById('calendar-accounts-bar');
    const selectEventAccount = document.getElementById('event-account');
    const selectQuickAccount = document.getElementById('quick-add-account');
    const modalAccountsList = document.getElementById('modal-accounts-list');
    const modalAccountsCount = document.getElementById('modal-cal-accounts-count');
    const integrationsAccountsList = document.getElementById('integrations-accounts-list');

    // 1. Barra de filtro por conta na Agenda
    if (accountsBar) {
      if (accounts.length <= 1) {
        // Se tiver apenas 1 conta, mostra de forma compacta com botão para adicionar mais
        accountsBar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text3)">
            <span>Contas conectadas:</span>
            ${accounts.map(acc => `
              <span class="chip" style="padding: 3px 10px; font-size: 12px; border-color: ${acc.color}; color: var(--text); display: inline-flex; align-items: center; gap: 6px">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${acc.color}"></span>
                ${acc.email}
              </span>
            `).join('')}
            <button class="chip" type="button" id="btn-add-second-account" style="padding: 3px 10px; font-size: 12px; border-style: dashed; color: var(--accent)" title="Adicionar outra conta do Google Calendar">
              + Adicionar outra conta Google
            </button>
          </div>
        `;
      } else {
        // Múltiplas contas: renderiza botões de filtro interativo
        accountsBar.innerHTML = `
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; width: 100%">
            <span style="font-size: 12px; color: var(--text3); margin-right: 2px">Filtrar por conta:</span>
            <button class="tab-btn ${state.calendar.accountFilter === 'all' ? 'active' : ''}" type="button" data-filter-account="all" style="padding: 4px 10px; font-size: 12px">
              Todas (${accounts.length})
            </button>
            ${accounts.map(acc => `
              <button class="tab-btn ${state.calendar.accountFilter === acc.email ? 'active' : ''}" type="button" data-filter-account="${acc.email}" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px">
                <span style="width: 7px; height: 7px; border-radius: 50%; background: ${acc.color}"></span>
                <span>${acc.name || acc.email}</span>
              </button>
            `).join('')}
            <button class="chip" type="button" id="btn-add-second-account" style="padding: 3px 10px; font-size: 12px; border-style: dashed; color: var(--accent); margin-left: auto" title="Adicionar outra conta Google">
              + Adicionar conta
            </button>
          </div>
        `;
      }
    }

    // 2. Selects dos modais de criação de eventos
    const accountOptions = accounts.map(acc => `
      <option value="${acc.email}" ${acc.isPrimary ? 'selected' : ''}>
        ${acc.name} (${acc.email}) ${acc.isPrimary ? '★ Principal' : ''}
      </option>
    `).join('');

    if (selectEventAccount) {
      selectEventAccount.innerHTML = accounts.length ? accountOptions : '<option value="">Nenhuma conta conectada</option>';
    }
    if (selectQuickAccount) {
      selectQuickAccount.innerHTML = accounts.length ? accountOptions : '<option value="">Conta Padrão</option>';
    }

    // 3. Lista de contas no Modal de Configurações
    if (modalAccountsCount) {
      modalAccountsCount.textContent = `${accounts.length} ${accounts.length === 1 ? 'conta conectada' : 'contas conectadas'}`;
    }

    if (modalAccountsList) {
      if (accounts.length === 0) {
        modalAccountsList.innerHTML = `
          <div style="padding: 14px; text-align: center; color: var(--text3); font-size: 13px">
            Nenhuma conta Google conectada no momento.
          </div>
        `;
      } else {
        modalAccountsList.innerHTML = accounts.map(acc => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: var(--card); border: 1px solid var(--border-soft); gap: 10px">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1">
              ${acc.picture 
                ? `<img src="${acc.picture}" alt="" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover">`
                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${acc.color}; color: #fff; font-weight: 600; display: flex; align-items: center; justify-content: center; font-size: 13px">${(acc.name || acc.email)[0].toUpperCase()}</div>`
              }
              <div style="display: flex; flex-direction: column; min-width: 0">
                <div style="display: flex; align-items: center; gap: 6px">
                  <span style="font-weight: 600; font-size: 13.5px">${acc.name}</span>
                  ${acc.isPrimary ? '<span class="badge-pill" style="font-size: 10px; color: var(--ok)">Principal</span>' : ''}
                </div>
                <span style="font-size: 12px; color: var(--text3); word-break: break-all">${acc.email}</span>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 6px">
              ${!acc.isPrimary ? `
                <button type="button" class="btn-secondary" data-set-primary="${acc.email}" style="padding: 4px 8px; font-size: 11px">
                  Tornar Principal
                </button>
              ` : ''}
              <button type="button" class="btn-secondary" data-disconnect-account="${acc.email}" style="padding: 4px 8px; font-size: 11px; color: var(--warn)" title="Desconectar esta conta">
                Desconectar
              </button>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. Lista compacta na página de Integrações
    if (integrationsAccountsList) {
      if (accounts.length === 0) {
        integrationsAccountsList.innerHTML = `<span style="font-size: 12px; color: var(--text3)">Nenhuma conta conectada</span>`;
      } else {
        integrationsAccountsList.innerHTML = accounts.map(acc => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 6px; background: var(--raised); font-size: 12px">
            <span style="display: inline-flex; align-items: center; gap: 6px">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: ${acc.color}"></span>
              <strong>${acc.name}</strong> (${acc.email})
            </span>
            <span style="font-size: 11px; color: var(--ok)">${acc.isPrimary ? '● Principal' : '● Conectada'}</span>
          </div>
        `).join('');
      }
    }
  }

  /**
   * Atualiza indicadores de status
   */
  function updateCalendarStatusUI() {
    const cal = state.calendar;
    const accounts = cal.accounts || [];

    const headerStatus = document.getElementById('calendar-header-status');
    if (headerStatus) {
      if (accounts.length > 0) {
        const text = accounts.length === 1 
          ? `Google Calendar · Conectado (${accounts[0].email})` 
          : `Google Calendar · ${accounts.length} contas conectadas`;
        headerStatus.textContent = text;
        headerStatus.style.color = 'var(--ok)';
      } else {
        headerStatus.textContent = `Google Calendar · Demonstração (Não conectado)`;
        headerStatus.style.color = 'var(--text2)';
      }
    }

    const statusText = document.getElementById('calendar-status-text');
    const statusTime = document.getElementById('calendar-sync-time');
    const statusIcon = document.getElementById('calendar-status-icon');

    if (statusText) {
      statusText.textContent = accounts.length > 0 
        ? `${accounts.length} ${accounts.length === 1 ? 'Conta Google Conectada' : 'Contas Google Conectadas'}`
        : 'Google Calendar (Modo Demonstração)';
    }
    if (statusTime) {
      statusTime.textContent = accounts.length > 0
        ? (cal.lastSync ? `Última sincronização: ${cal.lastSync} (Unificada)` : 'Eventos de todas as contas combinados em tempo real.')
        : 'Execute "node server.js" para conectar contas do Google Calendar.';
    }
    if (statusIcon) {
      statusIcon.style.color = accounts.length > 0 ? 'var(--ok)' : 'var(--warn)';
    }

    const badgeIntegracao = document.getElementById('badge-calendar-integration');
    if (badgeIntegracao) {
      badgeIntegracao.textContent = accounts.length > 0 ? `${accounts.length} Conectada(s)` : 'Pendente';
      badgeIntegracao.style.color = accounts.length > 0 ? 'var(--ok)' : 'var(--warn)';
    }
  }

  /**
   * Sincroniza eventos de todas as contas conectadas
   */
  async function syncGoogleCalendar(showFeedback = true) {
    const syncBtn = document.getElementById('btn-sync-calendar');
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.style.opacity = '0.7';
    }

    try {
      // Passa a conta selecionada no filtro (ou 'all' para unificar todas)
      const accountParam = state.calendar.accountFilter !== 'all' ? `?account=${encodeURIComponent(state.calendar.accountFilter)}` : '';
      const res = await fetch(`/api/calendar/events${accountParam}`);
      if (!res.ok) throw new Error('Falha ao obter eventos.');
      
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        state.calendar.events = data.events;
        const now = new Date();
        state.calendar.lastSync = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        renderCalendarEvents();
        updateCalendarStatusUI();
        if (showFeedback) {
          showToast(`Agenda sincronizada! ${data.events.length} compromissos carregados do Google.`, '📅');
        }
      }
    } catch {
      renderCalendarEvents();
      if (showFeedback) {
        showToast('Google Calendar atualizado.', 'ℹ️');
      }
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.style.opacity = '1';
      }
    }
  }

  // ========================================================
  // IMPLEMENTAÇÃO DE VISUALIZAÇÕES DO CALENDÁRIO (MÊS, SEMANA, LISTA)
  // ========================================================

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toDateKey(d) {
    if (!d) return '';
    if (d instanceof Date && !isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
        return d.trim();
      }
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    return '';
  }

  function getEventDateKey(e) {
    if (e.start) return toDateKey(e.start);
    return toDateKey(new Date());
  }

  function updateCalendarPeriodTitle() {
    const titleEl = document.getElementById('cal-period-title');
    if (!titleEl) return;

    const curr = state.calendar.currentDate || new Date();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthNamesShort = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    if (state.calendar.viewMode === 'month') {
      titleEl.textContent = `${monthNames[curr.getMonth()]} de ${curr.getFullYear()}`;
    } else if (state.calendar.viewMode === 'week') {
      const currDay = curr.getDay();
      const startOfWeek = new Date(curr);
      startOfWeek.setDate(curr.getDate() - currDay);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      if (startOfWeek.getMonth() === endOfWeek.getMonth() && startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        titleEl.textContent = `${startOfWeek.getDate()} – ${endOfWeek.getDate()} de ${monthNames[startOfWeek.getMonth()]} de ${startOfWeek.getFullYear()}`;
      } else if (startOfWeek.getFullYear() === endOfWeek.getFullYear()) {
        titleEl.textContent = `${startOfWeek.getDate()} de ${monthNamesShort[startOfWeek.getMonth()]} – ${endOfWeek.getDate()} de ${monthNamesShort[endOfWeek.getMonth()]} de ${startOfWeek.getFullYear()}`;
      } else {
        titleEl.textContent = `${startOfWeek.getDate()} de ${monthNamesShort[startOfWeek.getMonth()]}, ${startOfWeek.getFullYear()} – ${endOfWeek.getDate()} de ${monthNamesShort[endOfWeek.getMonth()]}, ${endOfWeek.getFullYear()}`;
      }
    } else {
      titleEl.textContent = `${monthNames[curr.getMonth()]} de ${curr.getFullYear()}`;
    }
  }

  function setCalendarViewMode(mode) {
    if (!['month', 'week', 'schedule'].includes(mode)) mode = 'month';
    state.calendar.viewMode = mode;

    document.querySelectorAll('.calendar-view-btn').forEach(btn => {
      if (btn.dataset.viewMode === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const monthView = document.getElementById('calendar-view-month');
    const weekView = document.getElementById('calendar-view-week');
    const scheduleView = document.getElementById('calendar-view-schedule');

    if (monthView) monthView.style.display = (mode === 'month') ? 'flex' : 'none';
    if (weekView) weekView.style.display = (mode === 'week') ? 'flex' : 'none';
    if (scheduleView) scheduleView.style.display = (mode === 'schedule') ? 'flex' : 'none';

    renderAllCalendarViews();
  }

  function renderMonthView() {
    const daysGrid = document.getElementById('calendar-month-days-grid');
    if (!daysGrid) return;

    const curr = state.calendar.currentDate || new Date();
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = Math.ceil((startDayOfWeek + daysInCurrentMonth) / 7) * 7;
    const todayKey = toDateKey(new Date());

    const events = (state.calendar.events || []).filter(e => {
      if (state.calendar.accountFilter !== 'all' && e.accountEmail) {
        return e.accountEmail === state.calendar.accountFilter;
      }
      return true;
    });

    const eventsByDay = {};
    events.forEach(e => {
      const key = getEventDateKey(e);
      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(e);
    });

    let cellsHtml = '';

    for (let i = 0; i < totalCells; i++) {
      let cellDate;
      let isOtherMonth = false;
      let dayNum;

      if (i < startDayOfWeek) {
        dayNum = daysInPrevMonth - startDayOfWeek + 1 + i;
        cellDate = new Date(year, month - 1, dayNum);
        isOtherMonth = true;
      } else if (i < startDayOfWeek + daysInCurrentMonth) {
        dayNum = i - startDayOfWeek + 1;
        cellDate = new Date(year, month, dayNum);
        isOtherMonth = false;
      } else {
        dayNum = i - (startDayOfWeek + daysInCurrentMonth) + 1;
        cellDate = new Date(year, month + 1, dayNum);
        isOtherMonth = true;
      }

      const dateKey = toDateKey(cellDate);
      const isToday = (dateKey === todayKey);
      const dayEvents = (eventsByDay[dateKey] || []).slice();

      dayEvents.sort((a, b) => {
        const tA = (a.start && a.start.includes('T')) ? new Date(a.start).getTime() : 0;
        const tB = (b.start && b.start.includes('T')) ? new Date(b.start).getTime() : 0;
        return tA - tB;
      });

      const maxPills = 3;
      const visibleEvents = dayEvents.slice(0, maxPills);
      const remainingCount = dayEvents.length - maxPills;

      const pillsHtml = visibleEvents.map(e => {
        const color = e.accountColor || '#6EA1FF';
        return `
          <div class="cal-event-pill" style="background: ${color};" data-event-id="${e.id}" title="${escapeHtml(e.title)} (${e.time || ''})">
            ${e.time ? `<span class="event-pill-time">${e.time}</span>` : ''}
            <span class="event-pill-title">${escapeHtml(e.title)}</span>
          </div>
        `;
      }).join('');

      const moreHtml = remainingCount > 0 
        ? `<div class="cal-event-more" data-more-date="${dateKey}" title="Ver todos os ${dayEvents.length} eventos">+${remainingCount} mais</div>`
        : '';

      cellsHtml += `
        <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-day-date="${dateKey}" title="Clique para agendar em ${dayNum}/${month + 1}">
          <div class="calendar-day-header">
            <span class="calendar-day-number">${dayNum}</span>
          </div>
          <div class="calendar-day-events">
            ${pillsHtml}
            ${moreHtml}
          </div>
        </div>
      `;
    }

    daysGrid.innerHTML = cellsHtml;
  }

  function renderWeekView() {
    const headerRow = document.getElementById('calendar-week-header-row');
    const bodyGrid = document.getElementById('calendar-week-body-grid');
    if (!headerRow || !bodyGrid) return;

    const curr = state.calendar.currentDate || new Date();
    const currDay = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - currDay);
    startOfWeek.setHours(0, 0, 0, 0);

    const dayNames = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const todayKey = toDateKey(new Date());

    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + d);
      weekDays.push({
        date: dayDate,
        dateKey: toDateKey(dayDate),
        dayName: dayNames[d],
        dayNum: dayDate.getDate(),
        isToday: toDateKey(dayDate) === todayKey
      });
    }

    headerRow.innerHTML = `
      <div class="calendar-week-header-time">GMT-3</div>
      ${weekDays.map(d => `
        <div class="calendar-week-header-day ${d.isToday ? 'today' : ''}" data-date="${d.dateKey}" style="cursor: pointer" title="Clique para agendar neste dia">
          <span class="calendar-week-dayname">${d.dayName}</span>
          <span class="calendar-week-daynum">${d.dayNum}</span>
        </div>
      `).join('')}
    `;

    const events = (state.calendar.events || []).filter(e => {
      if (state.calendar.accountFilter !== 'all' && e.accountEmail) {
        return e.accountEmail === state.calendar.accountFilter;
      }
      return true;
    });

    const eventsByDay = {};
    events.forEach(e => {
      const key = getEventDateKey(e);
      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(e);
    });

    const timeColHtml = `
      <div class="calendar-week-time-col">
        ${Array.from({ length: 24 }).map((_, h) => `
          <div class="calendar-week-hour-label">${String(h).padStart(2, '0')}:00</div>
        `).join('')}
      </div>
    `;

    const dayColsHtml = weekDays.map(d => {
      const dayEvents = (eventsByDay[d.dateKey] || []).slice();

      const slotsHtml = Array.from({ length: 24 }).map((_, h) => `
        <div class="calendar-week-hour-slot" data-slot-date="${d.dateKey}" data-slot-hour="${h}" title="${d.dayName} às ${String(h).padStart(2, '0')}:00 - Clique para criar evento"></div>
      `).join('');

      const cardsHtml = dayEvents.map(e => {
        let startHour = 9;
        let durationHours = 1;

        if (e.start && e.start.includes('T')) {
          const sD = new Date(e.start);
          if (!isNaN(sD.getTime())) {
            startHour = sD.getHours() + (sD.getMinutes() / 60);
          }
        } else if (e.time && e.time.includes(':')) {
          const parts = e.time.split(':');
          startHour = parseInt(parts[0], 10) + (parseInt(parts[1] || '0', 10) / 60);
        }

        if (e.end && e.end.includes('T') && e.start && e.start.includes('T')) {
          const sD = new Date(e.start);
          const eD = new Date(e.end);
          const diff = (eD.getTime() - sD.getTime()) / (1000 * 60 * 60);
          if (diff > 0 && !isNaN(diff)) durationHours = diff;
        }

        const slotHeight = 52;
        const top = Math.round(startHour * slotHeight);
        const height = Math.max(Math.round(durationHours * slotHeight) - 4, 24);
        const color = e.accountColor || '#6EA1FF';

        return `
          <div class="calendar-week-event-card" style="top: ${top}px; height: ${height}px; background: ${color};" data-event-id="${e.id}" title="${escapeHtml(e.title)} (${e.time || ''})">
            <div style="font-weight: 600; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
              ${escapeHtml(e.title)}
            </div>
            <div style="font-size: 10px; opacity: 0.9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
              ${e.time || ''} ${e.location ? `· ${escapeHtml(e.location)}` : ''}
            </div>
            ${e.meetLink ? `<div style="font-size: 9.5px; opacity: 0.95; display: inline-flex; align-items: center; gap: 3px">📹 Meet</div>` : ''}
          </div>
        `;
      }).join('');

      let nowIndicatorHtml = '';
      if (d.isToday) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const currentTop = Math.round((currentMinutes / 60) * 52);
        nowIndicatorHtml = `
          <div style="position: absolute; top: ${currentTop}px; left: 0; right: 0; height: 2px; background: #ea4335; z-index: 8; pointer-events: none;" title="Horário atual">
            <span style="position: absolute; left: -4px; top: -4px; width: 10px; height: 10px; border-radius: 50%; background: #ea4335;"></span>
          </div>
        `;
      }

      return `
        <div class="calendar-week-day-col" data-col-date="${d.dateKey}">
          ${slotsHtml}
          ${nowIndicatorHtml}
          ${cardsHtml}
        </div>
      `;
    }).join('');

    bodyGrid.innerHTML = timeColHtml + dayColsHtml;

    if (!bodyGrid.dataset.scrolled) {
      bodyGrid.scrollTop = 8 * 52 - 16;
      bodyGrid.dataset.scrolled = 'true';
    }
  }

  function renderScheduleEvents() {
    const morningList = document.getElementById('agenda-morning-events');
    const afternoonList = document.getElementById('agenda-afternoon-events');
    const eveningList = document.getElementById('agenda-evening-events');

    if (!morningList || !afternoonList || !eveningList) return;

    const curr = state.calendar.currentDate || new Date();
    const todayStr = toDateKey(new Date());
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toDateKey(tomorrow);

    const currDay = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - currDay);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const startOfWeekStr = toDateKey(startOfWeek);
    const endOfWeekStr = toDateKey(endOfWeek);

    const filtered = (state.calendar.events || []).filter(e => {
      if (state.calendar.accountFilter !== 'all' && e.accountEmail) {
        if (e.accountEmail !== state.calendar.accountFilter) return false;
      }

      const eventDate = getEventDateKey(e);
      if (state.calendar.periodFilter === 'hoje') return eventDate === todayStr;
      if (state.calendar.periodFilter === 'amanha') return eventDate === tomorrowStr;
      if (state.calendar.periodFilter === 'semana') return eventDate >= startOfWeekStr && eventDate <= endOfWeekStr;
      return true;
    });

    const morningEvents = [];
    const afternoonEvents = [];
    const eveningEvents = [];

    filtered.forEach(e => {
      let hour = 10;
      if (e.start && e.start.includes('T')) {
        hour = new Date(e.start).getHours();
      } else if (e.time && e.time.includes(':')) {
        hour = parseInt(e.time.split(':')[0], 10);
      }

      if (hour < 12) morningEvents.push(e);
      else if (hour < 18) afternoonEvents.push(e);
      else eveningEvents.push(e);
    });

    const bMorning = document.getElementById('badge-morning-count');
    const bAfternoon = document.getElementById('badge-afternoon-count');
    const bEvening = document.getElementById('badge-evening-count');
    if (bMorning) bMorning.textContent = `${morningEvents.length} ${morningEvents.length === 1 ? 'evento' : 'eventos'}`;
    if (bAfternoon) bAfternoon.textContent = `${afternoonEvents.length} ${afternoonEvents.length === 1 ? 'evento' : 'eventos'}`;
    if (bEvening) bEvening.textContent = `${eveningEvents.length} ${eveningEvents.length === 1 ? 'evento' : 'eventos'}`;

    const buildEventHtml = (e) => {
      const color = e.accountColor || '#6EA1FF';
      return `
        <div class="event-row ${e.isNext ? 'is-next' : ''}" data-event-id="${e.id}" style="cursor: pointer; ${e.isNext ? 'border: 1px solid var(--accent-soft)' : ''}">
          <span class="event-time">${e.time || 'Horário'}</span>
          <span class="event-dot" style="background: ${color}"></span>
          <div class="event-info">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
              <span class="event-title">${escapeHtml(e.title)}</span>
              ${e.accountName || e.accountEmail ? `
                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 1px 7px; border-radius: 999px; background: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; font-weight: 500">
                  ${escapeHtml(e.accountName || e.accountEmail.split('@')[0])}
                </span>
              ` : ''}
              ${e.meetLink ? `<a href="${e.meetLink}" target="_blank" class="badge-pill" style="font-size: 11px; color: var(--accent); display: inline-flex; align-items: center; gap: 4px" title="Abrir Google Meet">Meet ↗</a>` : ''}
            </div>
            <span class="event-meta">${escapeHtml(e.meta || e.location || 'Compromisso')}</span>
          </div>
          ${e.isNext ? '<span class="badge-pill">Próximo</span>' : ''}
          <button class="delete-event-btn" data-delete-event="${e.id}" data-event-account="${e.accountEmail || ''}" title="Excluir evento do Google Calendar" style="color: var(--text3); padding: 4px; border-radius: 6px; transition: color 0.15s">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      `;
    };

    const emptyHtml = `<div style="padding: 16px; text-align: center; color: var(--text3); font-size: 13px">Nenhum evento agendado</div>`;

    morningList.innerHTML = morningEvents.length ? morningEvents.map(buildEventHtml).join('') : emptyHtml;
    afternoonList.innerHTML = afternoonEvents.length ? afternoonEvents.map(buildEventHtml).join('') : emptyHtml;
    eveningList.innerHTML = eveningEvents.length ? eveningEvents.map(buildEventHtml).join('') : emptyHtml;
  }

  function renderOverviewEvents() {
    const overviewList = document.getElementById('events-overview-list');
    if (!overviewList) return;

    overviewList.innerHTML = (state.calendar.events || []).slice(0, 4).map(e => `
      <div class="event-row ${e.isNext ? 'is-next' : ''}" data-event-id="${e.id}" style="cursor: pointer">
        <span class="event-time">${e.time || '10:00'}</span>
        <span class="event-dot" style="background: ${e.accountColor || 'var(--accent)'}"></span>
        <div class="event-info">
          <span class="event-title">${escapeHtml(e.title)}</span>
          <span class="event-meta">${escapeHtml(e.accountName || e.accountEmail || 'Google Calendar')}</span>
        </div>
        ${e.isNext ? '<span class="badge-pill">Próximo</span>' : ''}
      </div>
    `).join('');
  }

  function updateCalendarNavBadge() {
    const todayStr = toDateKey(new Date());
    const todayCount = (state.calendar.events || []).filter(e => getEventDateKey(e) === todayStr).length;
    const navBadge = document.querySelector('a[data-page="agenda"] .badge');
    if (navBadge) {
      navBadge.textContent = todayCount;
    }
  }

  function openEventDetails(event) {
    if (!event) return;
    const titleEl = document.getElementById('modal-event-detail-title');
    const dotEl = document.getElementById('modal-event-detail-dot');
    const accNameEl = document.getElementById('modal-event-detail-account-name');
    const timeEl = document.getElementById('modal-event-detail-time');
    const locRow = document.getElementById('modal-event-detail-location-row');
    const locEl = document.getElementById('modal-event-detail-location');
    const descRow = document.getElementById('modal-event-detail-desc-row');
    const descEl = document.getElementById('modal-event-detail-desc');
    const meetContainer = document.getElementById('modal-event-detail-meet-container');
    const meetBtn = document.getElementById('modal-event-detail-meet-btn');
    const deleteBtn = document.getElementById('modal-event-detail-btn-delete');

    if (titleEl) titleEl.textContent = event.title || '(Sem título)';
    if (dotEl) dotEl.style.background = event.accountColor || '#6EA1FF';
    if (accNameEl) accNameEl.textContent = event.accountName || event.accountEmail || 'Google Calendar';

    if (timeEl) {
      let formatted = event.time || 'Horário não especificado';
      if (event.start) {
        const d = new Date(event.start);
        if (!isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          let timeRange = event.time || '';
          if (event.end) {
            const eD = new Date(event.end);
            if (!isNaN(eD.getTime())) {
              const startH = String(d.getHours()).padStart(2, '0');
              const startM = String(d.getMinutes()).padStart(2, '0');
              const endH = String(eD.getHours()).padStart(2, '0');
              const endM = String(eD.getMinutes()).padStart(2, '0');
              timeRange = `${startH}:${startM} – ${endH}:${endM}`;
            }
          }
          formatted = `${dateStr} · ${timeRange}`;
        }
      }
      timeEl.textContent = formatted;
    }

    if (locRow && locEl) {
      if (event.location && event.location.trim()) {
        locRow.style.display = 'flex';
        locEl.textContent = event.location;
      } else {
        locRow.style.display = 'none';
      }
    }

    if (descRow && descEl) {
      if (event.description && event.description.trim()) {
        descRow.style.display = 'flex';
        descEl.textContent = event.description;
      } else {
        descRow.style.display = 'none';
      }
    }

    if (meetContainer && meetBtn) {
      if (event.meetLink) {
        meetContainer.style.display = 'block';
        meetBtn.href = event.meetLink;
      } else {
        meetContainer.style.display = 'none';
      }
    }

    if (deleteBtn) {
      deleteBtn.dataset.deleteEvent = event.id;
      deleteBtn.dataset.eventAccount = event.accountEmail || '';
    }

    openModal('modal-event-details');
  }

  function openNewEventModalWithDate(dateStr, hour = 9) {
    const startInput = document.getElementById('event-start');
    const endInput = document.getElementById('event-end');

    const pad = n => String(n).padStart(2, '0');
    const h = parseInt(hour, 10);
    const startVal = `${dateStr}T${pad(h)}:00`;
    const endVal = `${dateStr}T${pad(Math.min(h + 1, 23))}:00`;

    if (startInput) startInput.value = startVal;
    if (endInput) endInput.value = endVal;

    openModal('modal-new-event');
  }

  function renderAllCalendarViews() {
    updateCalendarPeriodTitle();
    renderMonthView();
    renderWeekView();
    renderScheduleEvents();
    renderOverviewEvents();
    updateCalendarNavBadge();
  }

  // Mantém compatibilidade com chamadas existentes
  function renderCalendarEvents() {
    renderAllCalendarViews();
  }

  /**
   * Cria um evento na conta Google selecionada
   */
  async function createGoogleCalendarEvent(eventData) {
    const submitBtn = document.getElementById('btn-submit-new-event');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Criando...';
    }

    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar evento');

      showToast(`Evento "${eventData.summary}" criado na conta Google!`, '🎉');
      closeModal('modal-new-event');
      document.getElementById('form-new-event')?.reset();
      syncGoogleCalendar(false);
    } catch (err) {
      // Fallback local
      const targetAcc = state.calendar.accounts.find(a => a.email === eventData.accountEmail) || state.calendar.accounts[0] || {};
      const newMockEvent = {
        id: 'mock_' + Date.now(),
        title: eventData.summary,
        time: eventData.start ? eventData.start.split('T')[1]?.slice(0, 5) || '10:00' : '10:00',
        meta: eventData.location || (eventData.addMeetLink ? 'Google Meet' : 'Google Calendar'),
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        meetLink: eventData.addMeetLink ? 'https://meet.google.com/new' : null,
        description: eventData.description || '',
        accountEmail: targetAcc.email || 'rianvlnv@gmail.com',
        accountName: targetAcc.name || 'Rian',
        accountColor: targetAcc.color || '#6EA1FF',
        isNext: false
      };
      state.calendar.events.unshift(newMockEvent);
      renderCalendarEvents();
      closeModal('modal-new-event');
      document.getElementById('form-new-event')?.reset();
      showToast(`Evento "${eventData.summary}" adicionado!`, '✓');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Criar Evento';
      }
    }
  }

  /**
   * Adiciona evento via linguagem natural
   */
  async function quickAddGoogleCalendarEvent(text, accountEmail) {
    try {
      const res = await fetch('/api/calendar/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, accountEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no processamento.');

      showToast(`Evento agendado no Google Calendar: "${text}"`, '✨');
      closeModal('modal-quick-add');
      syncGoogleCalendar(false);
    } catch {
      const newMock = {
        id: 'quick_' + Date.now(),
        title: text,
        time: '14:00',
        meta: 'Adicionado por texto · Google Calendar',
        start: new Date().toISOString(),
        accountEmail: accountEmail || 'rianvlnv@gmail.com',
        accountColor: '#6EA1FF',
        isNext: false
      };
      state.calendar.events.unshift(newMock);
      renderCalendarEvents();
      closeModal('modal-quick-add');
      showToast(`Evento agendado: "${text}"`, '✨');
    }
  }

  /**
   * Exclui um evento
   */
  async function deleteGoogleCalendarEvent(eventId, accountEmail) {
    try {
      const event = state.calendar.events.find(e => e.id === eventId);
      const params = new URLSearchParams();
      if (accountEmail) params.append('account', accountEmail);
      if (event && event.calendarId) params.append('calendarId', event.calendarId);
      const param = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/calendar/events/${encodeURIComponent(eventId)}${param}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Falha ao excluir.');
      showToast('Evento removido do Google Calendar.', '🗑');
    } catch {
      showToast('Evento removido localmente.', '🗑');
    }

    state.calendar.events = state.calendar.events.filter(e => e.id !== eventId);
    renderCalendarEvents();
  }

  /**
   * Desconecta uma conta específica
   */
  async function disconnectAccount(email) {
    try {
      const res = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Erro ao desconectar');
      showToast(`Conta ${email} desconectada.`, 'ℹ️');
      checkGoogleCalendarStatus();
    } catch (e) {
      showToast('Falha ao desconectar conta.', '⚠️');
    }
  }

  /**
   * Define uma conta como principal
   */
  async function setPrimaryAccount(email) {
    try {
      const res = await fetch('/api/calendar/set-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error('Erro');
      showToast(`Conta ${email} agora é a principal!`, '★');
      checkGoogleCalendarStatus();
    } catch (e) {
      showToast('Falha ao definir conta principal.', '⚠️');
    }
  }

  // --- Lógica do Módulo de Tarefas ---
  function renderTasks() {
    const listOverview = document.getElementById('tasks-overview-list');
    const listFull = document.getElementById('tasks-full-list');
    const countOverview = document.getElementById('tasks-overview-count');
    const countBadge = document.getElementById('nav-tasks-badge');
    const openTasks = state.tasks.filter(t => !t.done);
    const doneTasks = state.tasks.filter(t => t.done);

    const countText = `${doneTasks.length} de ${state.tasks.length} concluídas`;
    if (countOverview) countOverview.textContent = countText;
    if (countBadge) countBadge.textContent = openTasks.length;

    const greetingSummary = document.getElementById('greeting-summary');
    if (greetingSummary) {
      const p = openTasks.length === 1 ? 'tarefa em aberto' : 'tarefas em aberto';
      greetingSummary.textContent = `Você tem ${state.calendar.events.length} compromissos hoje e ${openTasks.length} ${p}.`;
    }

    if (listOverview) {
      listOverview.innerHTML = state.tasks.slice(0, 5).map(t => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 9px 2px; border-bottom: 1px solid var(--border-soft)">
          <button class="checkbox-btn ${t.done ? 'checked' : ''}" data-task-id="${t.id}" aria-label="${t.done ? 'Reabrir' : 'Concluir'}: ${t.title}">
            ${t.done ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg>' : ''}
          </button>
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">
            <span style="font-weight: 500; ${t.done ? 'color: var(--text3); text-decoration: line-through;' : ''}">${t.title}</span>
            <span style="font-size: 12px; color: var(--text3)">${t.meta}</span>
          </div>
        </div>
      `).join('');
    }

    if (listFull) {
      let filtered = state.tasks;
      if (state.taskFilter === 'pendentes') filtered = state.tasks.filter(t => !t.done);
      else if (state.taskFilter === 'concluidas') filtered = state.tasks.filter(t => t.done);
      else if (state.taskFilter === 'prioritarias') filtered = state.tasks.filter(t => t.priority);

      if (filtered.length === 0) {
        listFull.innerHTML = `<div style="padding: 32px; text-align: center; color: var(--text3); font-size: 14px">Nenhuma tarefa encontrada neste filtro.</div>`;
      } else {
        listFull.innerHTML = filtered.map(t => `
          <div style="display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 10px; background: var(--card); border: 1px solid var(--border-soft); transition: var(--transition)">
            <button class="checkbox-btn ${t.done ? 'checked' : ''}" data-task-id="${t.id}" aria-label="${t.done ? 'Reabrir' : 'Concluir'}">
              ${t.done ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"></path></svg>' : ''}
            </button>
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">
              <span style="font-weight: 500; font-size: 14.5px; ${t.done ? 'color: var(--text3); text-decoration: line-through;' : ''}">${t.title}</span>
              <div style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text3)">
                <span>${t.meta}</span>
                <span>•</span>
                <span class="badge-pill" style="font-size: 11px">${t.category}</span>
                ${t.priority ? '<span style="color: var(--warn); font-weight: 500">★ Prioritária</span>' : ''}
              </div>
            </div>
            <button class="delete-task-btn" data-delete-task="${t.id}" title="Excluir tarefa" style="color: var(--text3); padding: 4px; border-radius: 6px; transition: color 0.15s">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        `).join('');
      }
    }
  }

  function toggleTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.done = !task.done;
      renderTasks();
      showToast(task.done ? `Tarefa "${task.title}" marcada como concluída!` : `Tarefa "${task.title}" reaberta.`, task.done ? '✓' : '↺');
    }
  }

  function addTask(title) {
    if (!title || !title.trim()) return;
    const newTask = {
      id: 't_' + Date.now(),
      title: title.trim(),
      meta: 'Adicionado agora',
      category: 'Geral',
      done: false,
      priority: false
    };
    state.tasks.unshift(newTask);
    renderTasks();
    showToast(`Tarefa adicionada: "${newTask.title}"`);
  }

  // --- Lógica do Módulo Casa e Alexa ---
  function renderDevices() {
    const listOverview = document.getElementById('devices-overview-list');
    const listFull = document.getElementById('devices-full-grid');
    const countOverview = document.getElementById('devices-overview-count');
    const onCount = state.devices.filter(d => d.on).length;

    const countText = `${onCount} de ${state.devices.length} ligados`;
    if (countOverview) countOverview.textContent = countText;

    if (listOverview) {
      listOverview.innerHTML = state.devices.slice(0, 4).map(d => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 2px; border-bottom: 1px solid var(--border-soft)">
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column">
            <span style="font-weight: 500">${d.name}</span>
            <span style="font-size: 12px; color: var(--text3)">${d.meta}</span>
          </div>
          <button class="switch-btn" data-device-id="${d.id}" aria-pressed="${d.on}" aria-label="${d.name}">
            <span class="switch-knob"></span>
          </button>
        </div>
      `).join('');
    }

    if (listFull) {
      let filtered = state.devices;
      if (state.deviceFilter !== 'todos') {
        filtered = state.devices.filter(d => d.room === state.deviceFilter);
      }

      listFull.innerHTML = filtered.map(d => `
        <div class="card" style="padding: 16px; border-color: ${d.on ? 'var(--accent)' : 'var(--border)'}; transition: border-color 0.2s">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: ${d.on ? 'var(--accent-soft)' : 'var(--raised)'}; color: ${d.on ? 'var(--accent)' : 'var(--icon)'}; display: flex; align-items: center; justify-content: center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 11l9-8 9 8"></path><path d="M5 10v10h14V10"></path>
              </svg>
            </div>
            <button class="switch-btn" data-device-id="${d.id}" aria-pressed="${d.on}" aria-label="${d.name}">
              <span class="switch-knob"></span>
            </button>
          </div>
          <div style="margin-top: 10px; display: flex; flex-direction: column">
            <span style="font-weight: 600; font-size: 15px">${d.name}</span>
            <span style="font-size: 12px; color: var(--text3)">${d.room} · ${d.meta}</span>
          </div>
          <div style="margin-top: 6px; font-size: 12px; color: ${d.on ? 'var(--ok)' : 'var(--text3)'}; display: flex; align-items: center; gap: 6px">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: ${d.on ? 'var(--ok)' : 'var(--dot-idle)'}"></span>
            <span>${d.on ? 'Ligado' : 'Desligado'}</span>
          </div>
        </div>
      `).join('');
    }
  }

  function toggleDevice(deviceId) {
    const dev = state.devices.find(d => d.id === deviceId);
    if (dev) {
      dev.on = !dev.on;
      renderDevices();
      showToast(`${dev.name} foi ${dev.on ? 'ligado(a)' : 'desligado(a)'}`, dev.on ? '⚡' : '○');
    }
  }

  // --- Setup de Event Listeners ---
  function initEventListeners() {
    // Alternância de Tema
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // Toggle Mobile Sidebar
    const mobileBtn = document.getElementById('mobile-toggle-btn');
    const mobileOverlay = document.getElementById('mobile-overlay');
    if (mobileBtn) mobileBtn.addEventListener('click', toggleMobileSidebar);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileSidebar);

    // Navegação Sidebar
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) navigateTo(page);
      });
    });

    // Cliques globais com delegação
    document.addEventListener('click', (e) => {
      // Navegação rápida
      const link = e.target.closest('[data-navigate]');
      if (link) {
        e.preventDefault();
        navigateTo(link.dataset.navigate);
        return;
      }

      // Fechamento de Modais
      const closeBtn = e.target.closest('[data-close-modal]');
      if (closeBtn) {
        e.preventDefault();
        closeModal(closeBtn.dataset.closeModal);
        return;
      }

      if (e.target.classList.contains('modal-backdrop')) {
        e.target.classList.remove('active');
        return;
      }

      // Abertura do Modal Novo Evento
      if (e.target.closest('#btn-open-new-event')) {
        e.preventDefault();
        openModal('modal-new-event');
        return;
      }

      // Abertura do Modal Adição Rápida
      if (e.target.closest('#btn-quick-add-event')) {
        e.preventDefault();
        openModal('modal-quick-add');
        return;
      }

      // Alternância de Modos do Calendário (Mês, Semana, Programação)
      const calViewBtn = e.target.closest('.calendar-view-btn');
      if (calViewBtn && calViewBtn.dataset.viewMode) {
        e.preventDefault();
        setCalendarViewMode(calViewBtn.dataset.viewMode);
        return;
      }

      // Navegação do Calendário: Hoje
      if (e.target.closest('#cal-btn-today')) {
        e.preventDefault();
        state.calendar.currentDate = new Date();
        renderAllCalendarViews();
        return;
      }

      // Navegação do Calendário: Anterior (<)
      if (e.target.closest('#cal-btn-prev')) {
        e.preventDefault();
        const d = new Date(state.calendar.currentDate || new Date());
        if (state.calendar.viewMode === 'month') {
          d.setMonth(d.getMonth() - 1);
        } else if (state.calendar.viewMode === 'week') {
          d.setDate(d.getDate() - 7);
        } else {
          d.setDate(d.getDate() - 7);
        }
        state.calendar.currentDate = d;
        renderAllCalendarViews();
        return;
      }

      // Navegação do Calendário: Próximo (>)
      if (e.target.closest('#cal-btn-next')) {
        e.preventDefault();
        const d = new Date(state.calendar.currentDate || new Date());
        if (state.calendar.viewMode === 'month') {
          d.setMonth(d.getMonth() + 1);
        } else if (state.calendar.viewMode === 'week') {
          d.setDate(d.getDate() + 7);
        } else {
          d.setDate(d.getDate() + 7);
        }
        state.calendar.currentDate = d;
        renderAllCalendarViews();
        return;
      }

      // Detalhes do Evento (Pílula do mês, Card da semana, Linha da lista ou do dashboard)
      const eventTarget = e.target.closest('.cal-event-pill, .calendar-week-event-card, .event-row');
      if (eventTarget && !e.target.closest('.delete-event-btn') && !e.target.closest('a')) {
        const eventId = eventTarget.dataset.eventId;
        if (eventId) {
          const ev = state.calendar.events.find(x => String(x.id) === String(eventId));
          if (ev) {
            e.preventDefault();
            e.stopPropagation();
            openEventDetails(ev);
            return;
          }
        }
      }

      // Botão "+X mais" no Mês -> muda foco para Semana
      const moreBtn = e.target.closest('.cal-event-more');
      if (moreBtn && moreBtn.dataset.moreDate) {
        e.preventDefault();
        e.stopPropagation();
        state.calendar.currentDate = new Date(moreBtn.dataset.moreDate + 'T12:00:00');
        setCalendarViewMode('week');
        return;
      }

      // Clique em célula de dia no Mês -> Novo Evento pré-preenchido
      const dayCell = e.target.closest('.calendar-day-cell');
      if (dayCell && !e.target.closest('.cal-event-pill') && !e.target.closest('.cal-event-more')) {
        e.preventDefault();
        const dateStr = dayCell.dataset.dayDate;
        if (dateStr) {
          openNewEventModalWithDate(dateStr, 9);
        }
        return;
      }

      // Clique em slot de horário na Semana -> Novo Evento pré-preenchido
      const hourSlot = e.target.closest('.calendar-week-hour-slot');
      if (hourSlot && !e.target.closest('.calendar-week-event-card')) {
        e.preventDefault();
        const slotDate = hourSlot.dataset.slotDate;
        const slotHour = hourSlot.dataset.slotHour || 9;
        if (slotDate) {
          openNewEventModalWithDate(slotDate, slotHour);
        }
        return;
      }

      // Clique em cabeçalho do dia na Semana -> Novo Evento pré-preenchido
      const weekHeaderDay = e.target.closest('.calendar-week-header-day');
      if (weekHeaderDay && weekHeaderDay.dataset.date) {
        e.preventDefault();
        openNewEventModalWithDate(weekHeaderDay.dataset.date, 9);
        return;
      }

      // Excluir Evento pelo Modal de Detalhes
      const modalDelBtn = e.target.closest('#modal-event-detail-btn-delete');
      if (modalDelBtn) {
        e.preventDefault();
        const eventId = modalDelBtn.dataset.deleteEvent;
        const eventAccount = modalDelBtn.dataset.eventAccount;
        if (eventId && confirm('Deseja realmente excluir este evento do Google Calendar?')) {
          closeModal('modal-event-details');
          deleteGoogleCalendarEvent(eventId, eventAccount);
        }
        return;
      }

      // Abertura do Modal de Configurações / Contas Google
      if (e.target.closest('#btn-open-calendar-settings') || 
          e.target.closest('#btn-config-calendar-integration') ||
          e.target.closest('#btn-add-second-account')) {
        e.preventDefault();
        openModal('modal-google-calendar');
        return;
      }

      // Conectar / Adicionar Outra Conta Google (dispara OAuth2 com seletor de conta)
      if (e.target.closest('#modal-btn-connect-google') || e.target.closest('#btn-auth-calendar-integration')) {
        e.preventDefault();
        window.location.href = '/api/calendar/auth';
        return;
      }

      // Desconectar Conta Específica
      const disconnBtn = e.target.closest('[data-disconnect-account]');
      if (disconnBtn) {
        e.preventDefault();
        const email = disconnBtn.dataset.disconnectAccount;
        if (confirm(`Deseja realmente desconectar a conta ${email}?`)) {
          disconnectAccount(email);
        }
        return;
      }

      // Tornar Conta Principal
      const setPrimaryBtn = e.target.closest('[data-set-primary]');
      if (setPrimaryBtn) {
        e.preventDefault();
        const email = setPrimaryBtn.dataset.setPrimary;
        setPrimaryAccount(email);
        return;
      }

      // Filtro de Conta na Agenda
      const filterAccBtn = e.target.closest('[data-filter-account]');
      if (filterAccBtn) {
        e.preventDefault();
        state.calendar.accountFilter = filterAccBtn.dataset.filterAccount;
        renderAccountsUI();
        renderCalendarEvents();
        return;
      }

      // Botão Sincronizar Agora
      if (e.target.closest('#btn-sync-calendar')) {
        e.preventDefault();
        syncGoogleCalendar(true);
        return;
      }

      // Excluir Evento
      const delEventBtn = e.target.closest('[data-delete-event]');
      if (delEventBtn) {
        e.preventDefault();
        const eventId = delEventBtn.dataset.deleteEvent;
        const eventAccount = delEventBtn.dataset.eventAccount;
        deleteGoogleCalendarEvent(eventId, eventAccount);
        return;
      }

      // Toggle Dispositivo IoT
      const switchBtn = e.target.closest('[data-device-id]');
      if (switchBtn) {
        e.preventDefault();
        toggleDevice(switchBtn.dataset.deviceId);
        return;
      }

      // Toggle Tarefa
      const taskBtn = e.target.closest('[data-task-id]');
      if (taskBtn) {
        e.preventDefault();
        toggleTask(taskBtn.dataset.taskId);
        return;
      }

      // Excluir Tarefa
      const delTaskBtn = e.target.closest('[data-delete-task]');
      if (delTaskBtn) {
        e.preventDefault();
        const taskId = delTaskBtn.dataset.deleteTask;
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        renderTasks();
        showToast('Tarefa removida.', '🗑');
        return;
      }

      // Chips de Prompt
      const chip = e.target.closest('.chip');
      if (chip && chip.dataset.prompt) {
        const promptInput = document.getElementById('assistant-prompt-input');
        if (promptInput) {
          promptInput.value = chip.dataset.prompt;
          promptInput.focus();
        }
        return;
      }

      // Rotinas Alexa
      const routineBtn = e.target.closest('[data-routine]');
      if (routineBtn) {
        showToast(`Executando rotina "${routineBtn.dataset.routine}" via Alexa...`, '✨');
        return;
      }
    });

    // Submissão do Formulário de Novo Evento
    const formNewEvent = document.getElementById('form-new-event');
    if (formNewEvent) {
      formNewEvent.addEventListener('submit', (e) => {
        e.preventDefault();
        const accountEmail = document.getElementById('event-account')?.value;
        const summary = document.getElementById('event-title')?.value.trim();
        const start = document.getElementById('event-start')?.value;
        const end = document.getElementById('event-end')?.value;
        const location = document.getElementById('event-location')?.value.trim();
        const addMeetLink = document.getElementById('event-meet')?.checked || false;
        const description = document.getElementById('event-description')?.value.trim();

        if (!summary || !start || !end) {
          showToast('Preencha título, data de início e término.', '⚠️');
          return;
        }

        createGoogleCalendarEvent({
          accountEmail,
          summary,
          start: new Date(start).toISOString(),
          end: new Date(end).toISOString(),
          location,
          addMeetLink,
          description
        });
      });
    }

    // Submissão da Adição Rápida
    const formQuickAdd = document.getElementById('form-quick-add-event');
    if (formQuickAdd) {
      formQuickAdd.addEventListener('submit', (e) => {
        e.preventDefault();
        const accountEmail = document.getElementById('quick-add-account')?.value;
        const text = document.getElementById('quick-add-text')?.value.trim();
        if (text) {
          quickAddGoogleCalendarEvent(text, accountEmail);
          document.getElementById('quick-add-text').value = '';
        }
      });
    }

    // Submissão das Credenciais do Google Calendar
    const formGoogleCreds = document.getElementById('form-google-credentials');
    if (formGoogleCreds) {
      formGoogleCreds.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientId = document.getElementById('google-client-id')?.value.trim();
        const clientSecret = document.getElementById('google-client-secret')?.value.trim();

        if (!clientId || !clientSecret) {
          showToast('Informe o Client ID e Client Secret.', '⚠️');
          return;
        }

        try {
          const res = await fetch('/api/calendar/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, clientSecret })
          });
          if (!res.ok) throw new Error('Erro ao salvar.');
          showToast('Credenciais salvas! Agora você pode conectar contas Google.', '✓');
          checkGoogleCalendarStatus();
        } catch {
          showToast('Configurações salvas localmente.', '✓');
        }
      });
    }

    // Filtros de Período da Agenda (Tabs: Hoje, Amanhã, Semana, Todos)
    document.querySelectorAll('[data-calendar-filter]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('[data-calendar-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.calendar.periodFilter = tab.dataset.calendarFilter;
        renderCalendarEvents();
      });
    });

    // Envio do Prompt do Assistente
    const promptForm = document.getElementById('assistant-prompt-form');
    const promptInput = document.getElementById('assistant-prompt-input');
    if (promptForm && promptInput) {
      promptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = promptInput.value.trim();
        if (!val) return;
        showToast(`Rian Coworker: "${val}" recebido!`, '💬');
        promptInput.value = '';
      });
    }

    // Formulário de Nova Tarefa
    const addTaskForm = document.getElementById('add-task-form');
    const addTaskInput = document.getElementById('add-task-input');
    if (addTaskForm && addTaskInput) {
      addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = addTaskInput.value.trim();
        if (val) {
          addTask(val);
          addTaskInput.value = '';
        }
      });
    }

    // Filtros de Tarefas
    document.querySelectorAll('[data-task-filter]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('[data-task-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.taskFilter = tab.dataset.taskFilter;
        renderTasks();
      });
    });

    // Filtros de Dispositivos (Cômodos)
    document.querySelectorAll('[data-room-filter]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('[data-room-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.deviceFilter = tab.dataset.roomFilter;
        renderDevices();
      });
    });

    // Formulário de Configurações Gerais
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Configurações salvas com sucesso!', '✓');
      });
    }

    // Histórico de navegação
    window.addEventListener('popstate', handleHashNavigation);
  }

  // --- Inicialização da Aplicação ---
  function init() {
    applyTheme(state.theme);
    initEventListeners();
    renderTasks();
    renderDevices();
    renderCalendarEvents();
    checkGoogleCalendarStatus();
    handleHashNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
