/**
 * Rian Coworker - Application Logic & Multi-Account Google Calendar Integration
 * 
 * Suporte a navegação SPA, temas, interatividades de tarefas, IoT
 * e gerenciamento unificado de MÚLTIPLAS CONTAS do Google Calendar (OAuth2, agregação e criação por conta).
 */

(function () {
  'use strict';

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
      syncing: false,
      lastSync: null,
      events: [
        {
          id: 'mock_1',
          title: 'Revisão semanal com time',
          time: '10:30',
          meta: 'Foco e Alinhamento · Google Meet',
          start: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
          location: 'Google Meet',
          meetLink: 'https://meet.google.com/abc-defg-hij',
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
          start: new Date(new Date().setHours(12, 30, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
          location: 'Restaurante Central',
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
          start: new Date(new Date().setHours(15, 0, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(),
          location: 'Escritório',
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
          start: new Date(new Date().setHours(19, 30, 0, 0)).toISOString(),
          end: new Date(new Date().setHours(21, 0, 0, 0)).toISOString(),
          location: 'SmartFit',
          accountEmail: 'rianvlnv@gmail.com',
          accountName: 'Rian Vilanova',
          accountColor: '#6EA1FF',
          accountLabel: 'Principal',
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

  /**
   * Renderiza os eventos na Linha do Tempo da Agenda
   */
  function renderCalendarEvents() {
    const morningList = document.getElementById('agenda-morning-events');
    const afternoonList = document.getElementById('agenda-afternoon-events');
    const eveningList = document.getElementById('agenda-evening-events');
    const overviewList = document.getElementById('events-overview-list');

    if (!morningList || !afternoonList || !eveningList) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Filtra por período e por conta selecionada
    const filtered = state.calendar.events.filter(e => {
      // Filtro de conta
      if (state.calendar.accountFilter !== 'all' && e.accountEmail) {
        if (e.accountEmail !== state.calendar.accountFilter) return false;
      }

      // Filtro de data
      if (!e.start) return true;
      const eventDate = e.start.split('T')[0];
      if (state.calendar.periodFilter === 'hoje') return eventDate === todayStr;
      if (state.calendar.periodFilter === 'amanha') return eventDate === tomorrowStr;
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
        <div class="event-row ${e.isNext ? 'is-next' : ''}" style="${e.isNext ? 'border: 1px solid var(--accent-soft)' : ''}">
          <span class="event-time">${e.time || 'Horário'}</span>
          <span class="event-dot" style="background: ${color}"></span>
          <div class="event-info">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap">
              <span class="event-title">${e.title}</span>
              ${e.accountName || e.accountEmail ? `
                <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 1px 7px; border-radius: 999px; background: color-mix(in srgb, ${color} 15%, transparent); color: ${color}; font-weight: 500">
                  ${e.accountName || e.accountEmail.split('@')[0]}
                </span>
              ` : ''}
              ${e.meetLink ? `<a href="${e.meetLink}" target="_blank" class="badge-pill" style="font-size: 11px; color: var(--accent); display: inline-flex; align-items: center; gap: 4px" title="Abrir Google Meet">Meet ↗</a>` : ''}
            </div>
            <span class="event-meta">${e.meta || e.location || 'Compromisso'}</span>
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

    if (overviewList) {
      overviewList.innerHTML = state.calendar.events.slice(0, 4).map(e => `
        <div class="event-row ${e.isNext ? 'is-next' : ''}">
          <span class="event-time">${e.time || '10:00'}</span>
          <span class="event-dot" style="background: ${e.accountColor || 'var(--accent)'}"></span>
          <div class="event-info">
            <span class="event-title">${e.title}</span>
            <span class="event-meta">${e.accountName || e.accountEmail || 'Google Calendar'}</span>
          </div>
          ${e.isNext ? '<span class="badge-pill">Próximo</span>' : ''}
        </div>
      `).join('');
    }
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
      const param = accountEmail ? `?account=${encodeURIComponent(accountEmail)}` : '';
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
