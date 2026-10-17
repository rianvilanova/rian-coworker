/**
 * Rian Coworker - Application Logic & Google Calendar API Integration
 * 
 * Gerencia navegação SPA, temas, interatividades de tarefas, dispositivos IoT
 * e comunicação completa com a Google Calendar API (OAuth2, listagem, criação e exclusão de eventos).
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
    
    // Estado da Integração com Google Calendar
    calendar: {
      connected: false,
      configured: false,
      email: null,
      syncing: false,
      lastSync: null,
      filter: 'hoje',
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

      // Se for o modal de novo evento, pré-preenche horários
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

    // Verifica parâmetros de retorno OAuth do Google (?auth=success ou ?error=...)
    const urlParams = new URLSearchParams(window.location.search || (rawHash.includes('?') ? rawHash.slice(rawHash.indexOf('?')) : ''));
    if (urlParams.get('auth') === 'success') {
      showToast('Conta Google Calendar conectada com sucesso!', '🎉');
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

  // ==========================================
  // INTEGRAÇÃO COM GOOGLE CALENDAR API
  // ==========================================

  /**
   * Consulta o status da conexão da Google Calendar API com o backend local
   */
  async function checkGoogleCalendarStatus() {
    try {
      const res = await fetch('/api/calendar/status');
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();

      state.calendar.connected = data.connected;
      state.calendar.configured = data.configured;
      state.calendar.email = data.email;

      updateCalendarStatusUI();

      if (data.connected) {
        syncGoogleCalendar(false); // Sincroniza silenciosamente
      }
    } catch {
      // Backend offline ou rodando via file://
      state.calendar.connected = false;
      state.calendar.configured = false;
      updateCalendarStatusUI();
    }
  }

  /**
   * Atualiza indicadores de status do Google Calendar em todas as telas
   */
  function updateCalendarStatusUI() {
    const cal = state.calendar;

    // Header da Agenda
    const headerStatus = document.getElementById('calendar-header-status');
    if (headerStatus) {
      if (cal.connected) {
        headerStatus.textContent = `Google Calendar · Conectado (${cal.email})`;
        headerStatus.style.color = 'var(--ok)';
      } else {
        headerStatus.textContent = `Google Calendar · Demonstração (Não conectado)`;
        headerStatus.style.color = 'var(--text2)';
      }
    }

    // Card de status inferior na Agenda
    const statusText = document.getElementById('calendar-status-text');
    const statusTime = document.getElementById('calendar-sync-time');
    const statusIcon = document.getElementById('calendar-status-icon');

    if (statusText) {
      statusText.textContent = cal.connected ? `Conectado: ${cal.email}` : 'Google Calendar (Modo Demonstração)';
    }
    if (statusTime) {
      statusTime.textContent = cal.connected
        ? (cal.lastSync ? `Última sincronização: ${cal.lastSync}` : 'Sincronização ativa via OAuth 2.0')
        : 'Inicie "node server.js" e configure as credenciais para sincronizar em tempo real.';
    }
    if (statusIcon) {
      statusIcon.style.color = cal.connected ? 'var(--ok)' : 'var(--warn)';
    }

    // Badge na página de Integrações
    const badgeIntegracao = document.getElementById('badge-calendar-integration');
    const btnAuthIntegracao = document.getElementById('btn-auth-calendar-integration');
    if (badgeIntegracao) {
      badgeIntegracao.textContent = cal.connected ? 'Conectado' : (cal.configured ? 'Pronto para Conectar' : 'Pendente');
      badgeIntegracao.style.color = cal.connected ? 'var(--ok)' : 'var(--warn)';
    }
    if (btnAuthIntegracao) {
      btnAuthIntegracao.textContent = cal.connected ? 'Reconectar' : 'Conectar com Google';
    }

    // Modal de Configurações
    const modalBadge = document.getElementById('modal-cal-status-badge');
    const modalAccount = document.getElementById('modal-cal-account-info');
    const modalDetails = document.getElementById('modal-cal-details');
    const btnConnect = document.getElementById('modal-btn-connect-google');
    const btnDisconnect = document.getElementById('modal-btn-disconnect-google');

    if (modalBadge) {
      modalBadge.textContent = cal.connected ? 'Conectado' : 'Desconectado';
      modalBadge.style.color = cal.connected ? 'var(--ok)' : 'var(--warn)';
    }
    if (modalAccount) {
      modalAccount.textContent = cal.connected ? `Conta: ${cal.email}` : 'Nenhuma conta Google conectada';
    }
    if (modalDetails) {
      modalDetails.textContent = cal.connected
        ? 'O Rian Coworker possui permissão para ler, criar e excluir eventos na sua agenda oficial.'
        : 'Configure o Client ID e Client Secret abaixo e clique em "Conectar com Google".';
    }
    if (btnConnect) {
      btnConnect.textContent = cal.connected ? 'Trocar Conta Google' : 'Conectar com Google';
    }
    if (btnDisconnect) {
      btnDisconnect.style.display = cal.connected ? 'inline-block' : 'none';
    }
  }

  /**
   * Sincroniza eventos do Google Calendar com a API
   */
  async function syncGoogleCalendar(showFeedback = true) {
    const syncBtn = document.getElementById('btn-sync-calendar');
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.style.opacity = '0.7';
    }

    try {
      const res = await fetch('/api/calendar/events');
      if (!res.ok) {
        throw new Error('Falha ao obter eventos.');
      }
      const data = await res.json();
      if (data.events && Array.isArray(data.events)) {
        state.calendar.events = data.events;
        const now = new Date();
        state.calendar.lastSync = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        renderCalendarEvents();
        updateCalendarStatusUI();
        if (showFeedback) {
          showToast(`Agenda sincronizada! ${data.events.length} eventos carregados do Google.`, '📅');
        }
      }
    } catch (err) {
      // Se a API estiver offline ou desconectada
      renderCalendarEvents();
      if (showFeedback) {
        if (!state.calendar.connected) {
          showToast('Google Calendar desconectado. Exibindo eventos de exemplo.', 'ℹ️');
        } else {
          showToast('Não foi possível conectar ao servidor local. Verifique se "node server.js" está ativo.', '⚠️');
        }
      }
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.style.opacity = '1';
      }
    }
  }

  /**
   * Renderiza os eventos da Agenda divididos por períodos (Manhã, Tarde, Noite)
   */
  function renderCalendarEvents() {
    const morningList = document.getElementById('agenda-morning-events');
    const afternoonList = document.getElementById('agenda-afternoon-events');
    const eveningList = document.getElementById('agenda-evening-events');
    const overviewList = document.getElementById('events-overview-list');

    if (!morningList || !afternoonList || !eveningList) return;

    // Filtra eventos de acordo com a aba selecionada (hoje, amanha, semana, todos)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const filtered = state.calendar.events.filter(e => {
      if (!e.start) return true;
      const eventDate = e.start.split('T')[0];
      if (state.calendar.filter === 'hoje') return eventDate === todayStr;
      if (state.calendar.filter === 'amanha') return eventDate === tomorrowStr;
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

    // Atualiza contadores dos cards
    const bMorning = document.getElementById('badge-morning-count');
    const bAfternoon = document.getElementById('badge-afternoon-count');
    const bEvening = document.getElementById('badge-evening-count');
    if (bMorning) bMorning.textContent = `${morningEvents.length} ${morningEvents.length === 1 ? 'evento' : 'eventos'}`;
    if (bAfternoon) bAfternoon.textContent = `${afternoonEvents.length} ${afternoonEvents.length === 1 ? 'evento' : 'eventos'}`;
    if (bEvening) bEvening.textContent = `${eveningEvents.length} ${eveningEvents.length === 1 ? 'evento' : 'eventos'}`;

    // Função auxiliar para gerar HTML do evento
    const buildEventHtml = (e) => `
      <div class="event-row ${e.isNext ? 'is-next' : ''}" style="${e.isNext ? 'border: 1px solid var(--accent-soft)' : ''}">
        <span class="event-time">${e.time || 'Horário'}</span>
        <span class="event-dot ${e.isNext ? 'active' : ''}"></span>
        <div class="event-info">
          <div style="display: flex; align-items: center; gap: 8px">
            <span class="event-title">${e.title}</span>
            ${e.meetLink ? `<a href="${e.meetLink}" target="_blank" class="badge-pill" style="font-size: 11px; color: var(--accent); display: inline-flex; align-items: center; gap: 4px" title="Abrir Google Meet">Meet ↗</a>` : ''}
          </div>
          <span class="event-meta">${e.meta || e.location || 'Compromisso'}</span>
        </div>
        ${e.isNext ? '<span class="badge-pill">Próximo</span>' : ''}
        <button class="delete-event-btn" data-delete-event="${e.id}" title="Excluir evento do Google Calendar" style="color: var(--text3); padding: 4px; border-radius: 6px; transition: color 0.15s">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    const emptyHtml = `<div style="padding: 16px; text-align: center; color: var(--text3); font-size: 13px">Nenhum evento agendado</div>`;

    morningList.innerHTML = morningEvents.length ? morningEvents.map(buildEventHtml).join('') : emptyHtml;
    afternoonList.innerHTML = afternoonEvents.length ? afternoonEvents.map(buildEventHtml).join('') : emptyHtml;
    eveningList.innerHTML = eveningEvents.length ? eveningEvents.map(buildEventHtml).join('') : emptyHtml;

    // Atualiza também o Card de Resumo no Início
    if (overviewList) {
      overviewList.innerHTML = state.calendar.events.slice(0, 4).map(e => `
        <div class="event-row ${e.isNext ? 'is-next' : ''}">
          <span class="event-time">${e.time || '10:00'}</span>
          <span class="event-dot ${e.isNext ? 'active' : ''}"></span>
          <div class="event-info">
            <span class="event-title">${e.title}</span>
            <span class="event-meta">${e.meta || e.location || 'Google Calendar'}</span>
          </div>
          ${e.isNext ? '<span class="badge-pill">Próximo</span>' : ''}
        </div>
      `).join('');
    }
  }

  /**
   * Cria um novo evento no Google Calendar
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

      showToast(`Evento "${eventData.summary}" criado no Google Calendar!`, '🎉');
      closeModal('modal-new-event');
      document.getElementById('form-new-event')?.reset();
      syncGoogleCalendar(false);
    } catch (err) {
      // Fallback local se o servidor estiver offline
      console.warn('Fallback local para criação de evento:', err.message);
      const newMockEvent = {
        id: 'mock_' + Date.now(),
        title: eventData.summary,
        time: eventData.start ? eventData.start.split('T')[1]?.slice(0, 5) || '10:00' : '10:00',
        meta: eventData.location || (eventData.addMeetLink ? 'Google Meet' : 'Google Calendar'),
        start: eventData.start,
        end: eventData.end,
        location: eventData.location,
        meetLink: eventData.addMeetLink ? 'https://meet.google.com/new' : null,
        isNext: false
      };
      state.calendar.events.unshift(newMockEvent);
      renderCalendarEvents();
      closeModal('modal-new-event');
      document.getElementById('form-new-event')?.reset();
      showToast(`Evento "${eventData.summary}" adicionado localmente!`, '✓');
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
  async function quickAddGoogleCalendarEvent(text) {
    try {
      const res = await fetch('/api/calendar/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha no processamento.');

      showToast(`Evento agendado pelo Google Calendar: "${text}"`, '✨');
      closeModal('modal-quick-add');
      syncGoogleCalendar(false);
    } catch {
      // Fallback local
      const newMock = {
        id: 'quick_' + Date.now(),
        title: text,
        time: '14:00',
        meta: 'Adicionado por texto · Google Calendar',
        start: new Date().toISOString(),
        isNext: false
      };
      state.calendar.events.unshift(newMock);
      renderCalendarEvents();
      closeModal('modal-quick-add');
      showToast(`Evento agendado: "${text}"`, '✨');
    }
  }

  /**
   * Exclui um evento do Google Calendar
   */
  async function deleteGoogleCalendarEvent(eventId) {
    try {
      const res = await fetch(`/api/calendar/events/${encodeURIComponent(eventId)}`, {
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

      // Clique no fundo do backdrop do modal para fechar
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

      // Abertura do Modal de Configurações do Google Calendar
      if (e.target.closest('#btn-open-calendar-settings') || e.target.closest('#btn-config-calendar-integration')) {
        e.preventDefault();
        openModal('modal-google-calendar');
        return;
      }

      // Disparo de Autenticação com Google
      if (e.target.closest('#modal-btn-connect-google') || e.target.closest('#btn-auth-calendar-integration')) {
        e.preventDefault();
        window.location.href = '/api/calendar/auth';
        return;
      }

      // Desconectar Google
      if (e.target.closest('#modal-btn-disconnect-google')) {
        e.preventDefault();
        fetch('/api/calendar/disconnect', { method: 'POST' })
          .then(() => {
            showToast('Conta Google desconectada.', 'ℹ️');
            checkGoogleCalendarStatus();
          })
          .catch(() => showToast('Erro ao desconectar.', '⚠️'));
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
        deleteGoogleCalendarEvent(eventId);
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
        const text = document.getElementById('quick-add-text')?.value.trim();
        if (text) {
          quickAddGoogleCalendarEvent(text);
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
          showToast('Credenciais do Google Calendar salvas! Clique em "Conectar com Google".', '✓');
          checkGoogleCalendarStatus();
        } catch {
          showToast('Configurações salvas localmente.', '✓');
        }
      });
    }

    // Filtros de Agenda (Tabs: Hoje, Amanhã, Semana, Todos)
    document.querySelectorAll('[data-calendar-filter]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('[data-calendar-filter]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        state.calendar.filter = tab.dataset.calendarFilter;
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
        showToast(`Rian Coworker: "${val}" recebido! Em breve executarei essa ação.`, '💬');
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
