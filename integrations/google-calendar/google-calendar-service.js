/**
 * Google Calendar API Integration Service for Rian Coworker
 * 
 * Suporte completo a MÚLTIPLAS CONTAS do Google Calendar (ex: Pessoal, Trabalho, Projetos).
 * Gerencia OAuth 2.0, renovação individual de tokens por conta e agregação unificada de eventos.
 */

const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, 'tokens.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Paleta de cores para identificar visualmente cada conta conectada
const ACCOUNT_COLORS = [
  '#6EA1FF', // Azul principal
  '#6fbf8f', // Verde esmeralda
  '#e0a45a', // Laranja quente
  '#b185db', // Roxo suave
  '#ff7b72', // Coral
  '#4dd0e1'  // Ciano
];

// Escopos padrão necessários
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

class GoogleCalendarService {
  constructor(config = {}) {
    this.config = this.loadConfig(config);
    this.ensureStoreFormat();
  }

  /**
   * Carrega as configurações (Client ID, Client Secret, Redirect URI)
   */
  loadConfig(overrides = {}) {
    let fileConfig = {};
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      } catch (err) {
        console.error('[GoogleCalendarService] Erro ao ler config.json:', err.message);
      }
    }

    return {
      clientId: process.env.GOOGLE_CLIENT_ID || fileConfig.clientId || overrides.clientId || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || fileConfig.clientSecret || overrides.clientSecret || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || fileConfig.redirectUri || overrides.redirectUri || 'http://localhost:3001/api/calendar/callback',
      scopes: DEFAULT_SCOPES
    };
  }

  /**
   * Salva configurações no config.json
   */
  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    return this.config;
  }

  /**
   * Garante e migra o tokens.json para o formato multi-contas
   */
  ensureStoreFormat() {
    if (!fs.existsSync(TOKENS_FILE)) return;

    try {
      const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      
      // Se for formato legado de conta única (com access_token na raiz)
      if (data && data.access_token && !data.accounts) {
        const email = data.user_email || 'conta_padrao@gmail.com';
        const migrated = {
          accounts: {
            [email]: {
              email: email,
              name: data.user_name || 'Usuário Google',
              picture: data.user_picture || null,
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_at: data.expires_at || (Date.now() + 3600 * 1000),
              scope: data.scope,
              color: ACCOUNT_COLORS[0],
              label: 'Principal'
            }
          },
          primaryEmail: email
        };
        fs.writeFileSync(TOKENS_FILE, JSON.stringify(migrated, null, 2), 'utf8');
        console.log(`[GoogleCalendarService] Migrado tokens.json para formato multi-contas (Conta: ${email})`);
      }
    } catch (err) {
      console.error('[GoogleCalendarService] Erro ao verificar formato de tokens.json:', err.message);
    }
  }

  /**
   * Lê a estrutura de contas salva
   */
  loadStore() {
    if (!fs.existsSync(TOKENS_FILE)) {
      return { accounts: {}, primaryEmail: null };
    }
    try {
      const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      if (!data.accounts) {
        return { accounts: {}, primaryEmail: null };
      }
      return data;
    } catch {
      return { accounts: {}, primaryEmail: null };
    }
  }

  /**
   * Salva a estrutura completa de contas
   */
  saveStore(store) {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(store, null, 2), 'utf8');
    return store;
  }

  /**
   * Retorna a lista de contas conectadas
   */
  getAccounts() {
    const store = this.loadStore();
    const accounts = Object.values(store.accounts || {});
    return accounts.map(acc => ({
      email: acc.email,
      name: acc.name,
      picture: acc.picture,
      color: acc.color,
      label: acc.label,
      isPrimary: acc.email === store.primaryEmail
    }));
  }

  /**
   * Salva ou atualiza uma conta específica
   */
  saveAccountTokens(email, accountData) {
    const store = this.loadStore();
    if (!store.accounts) store.accounts = {};

    const existing = store.accounts[email] || {};
    const count = Object.keys(store.accounts).length;
    const color = existing.color || ACCOUNT_COLORS[count % ACCOUNT_COLORS.length];

    store.accounts[email] = {
      ...existing,
      ...accountData,
      email,
      color,
      label: existing.label || (count === 0 ? 'Principal' : `Conta ${count + 1}`),
      saved_at: Date.now()
    };

    if (!store.primaryEmail || !store.accounts[store.primaryEmail]) {
      store.primaryEmail = email;
    }

    this.saveStore(store);
    return store.accounts[email];
  }

  /**
   * Remove uma conta específica
   */
  removeAccount(email) {
    const store = this.loadStore();
    if (store.accounts && store.accounts[email]) {
      delete store.accounts[email];
      
      // Se removeu a principal, define a primeira restante como principal
      if (store.primaryEmail === email) {
        const remaining = Object.keys(store.accounts);
        store.primaryEmail = remaining.length > 0 ? remaining[0] : null;
      }

      this.saveStore(store);
      return { success: true, email };
    }
    return { success: false, message: 'Conta não encontrada.' };
  }

  /**
   * Define a conta principal
   */
  setPrimaryAccount(email) {
    const store = this.loadStore();
    if (store.accounts && store.accounts[email]) {
      store.primaryEmail = email;
      this.saveStore(store);
      return { success: true, primaryEmail: email };
    }
    throw new Error('Conta não encontrada.');
  }

  /**
   * Remove todas as contas (desconectar tudo)
   */
  clearAll() {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
  }

  /**
   * Verifica se o serviço está configurado com credenciais
   */
  isConfigured() {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * Gera a URL de autorização OAuth 2.0
   * prompt=select_account permite selecionar ou adicionar outra conta Google facilmente!
   */
  generateAuthUrl(state = '') {
    if (!this.config.clientId) {
      throw new Error('Google Client ID não configurado.');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline', // Importante para receber refresh_token
      prompt: 'select_account consent', // Força seleção de conta para adicionar múltiplas!
      include_granted_scopes: 'true'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Troca o código por tokens e registra a nova conta
   */
  async exchangeCodeForTokens(code) {
    if (!code) throw new Error('Código de autorização não fornecido.');

    const body = new URLSearchParams({
      code,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const tokenData = await response.json();
    if (!response.ok) {
      throw new Error(tokenData.error_description || tokenData.error || 'Falha ao trocar código por tokens.');
    }

    // Calcula expires_at
    const expiresAt = Date.now() + ((tokenData.expires_in || 3600) * 1000);

    // Identifica quem é o usuário consultando o userinfo
    const profile = await this.getUserProfile(tokenData.access_token);
    const email = profile.email;

    if (!email) {
      throw new Error('Não foi possível identificar o e-mail da conta Google.');
    }

    const saved = this.saveAccountTokens(email, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scope: tokenData.scope,
      name: profile.name || email.split('@')[0],
      picture: profile.picture || null
    });

    console.log(`[GoogleCalendarService] Conta Google conectada/atualizada: ${email}`);
    return saved;
  }

  /**
   * Renova o token de acesso de uma conta específica
   */
  async refreshAccessToken(email) {
    const store = this.loadStore();
    const account = store.accounts[email];

    if (!account || !account.refresh_token) {
      throw new Error(`Nenhum refresh token disponível para a conta ${email}. Reautentique esta conta.`);
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || data.error || `Falha ao renovar token da conta ${email}.`);
    }

    const expiresAt = Date.now() + ((data.expires_in || 3600) * 1000);
    account.access_token = data.access_token;
    account.expires_at = expiresAt;
    if (data.refresh_token) account.refresh_token = data.refresh_token;

    this.saveStore(store);
    return account.access_token;
  }

  /**
   * Obtém token de acesso válido para uma conta específica
   */
  async getValidAccessToken(email) {
    const store = this.loadStore();
    const targetEmail = email || store.primaryEmail;

    if (!targetEmail || !store.accounts[targetEmail]) {
      return null;
    }

    const account = store.accounts[targetEmail];
    const isExpired = account.expires_at ? (Date.now() >= account.expires_at - 60000) : false;

    if (isExpired && account.refresh_token) {
      console.log(`[GoogleCalendarService] Renovando token para ${targetEmail}...`);
      return await this.refreshAccessToken(targetEmail);
    }

    return account.access_token;
  }

  /**
   * Consulta o perfil de usuário
   */
  async getUserProfile(accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('Falha ao obter perfil do usuário Google.');
    return await res.json();
  }

  /**
   * Lista eventos de uma conta específica
   */
  async listEventsForAccount(email, options = {}) {
    const token = await this.getValidAccessToken(email);
    if (!token) return [];

    const store = this.loadStore();
    const account = store.accounts[email] || {};

    const calendarId = encodeURIComponent(options.calendarId || 'primary');
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const timeMin = options.timeMin || startOfDay.toISOString();

    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      maxResults: String(options.maxResults || 25)
    });

    if (options.timeMax) params.append('timeMax', options.timeMax);
    if (options.query) params.append('q', options.query);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.warn(`[GoogleCalendarService] Falha ao buscar eventos da conta ${email}:`, res.statusText);
      return [];
    }

    const data = await res.json();
    return (data.items || []).map(item => this.normalizeEvent(item, account));
  }

  /**
   * Lista eventos de TODAS as contas conectadas (ou de uma conta específica)
   */
  async listEvents(options = {}) {
    const store = this.loadStore();
    const accounts = Object.keys(store.accounts || {});

    if (accounts.length === 0) {
      return [];
    }

    // Se foi solicitada uma conta específica
    if (options.accountEmail && options.accountEmail !== 'all') {
      return await this.listEventsForAccount(options.accountEmail, options);
    }

    // Busca eventos de todas as contas em paralelo
    const promises = accounts.map(accEmail => this.listEventsForAccount(accEmail, options));
    const results = await Promise.all(promises);

    // Une todos os eventos
    const allEvents = results.flat();

    // Ordena cronologicamente por horário de início
    allEvents.sort((a, b) => {
      const timeA = new Date(a.start || 0).getTime();
      const timeB = new Date(b.start || 0).getTime();
      return timeA - timeB;
    });

    return allEvents;
  }

  /**
   * Cria um evento na conta especificada (ou na conta principal)
   */
  async createEvent(eventData, accountEmail = null, calendarId = 'primary') {
    const store = this.loadStore();
    const targetEmail = accountEmail || store.primaryEmail;

    if (!targetEmail) {
      throw new Error('Nenhuma conta Google conectada para criar o evento.');
    }

    const token = await this.getValidAccessToken(targetEmail);
    if (!token) throw new Error(`Conta ${targetEmail} não autenticada.`);

    const body = {
      summary: eventData.summary || eventData.title || 'Novo Compromisso',
      description: eventData.description || '',
      location: eventData.location || '',
      start: typeof eventData.start === 'string'
        ? (eventData.start.includes('T') ? { dateTime: eventData.start } : { date: eventData.start })
        : eventData.start,
      end: typeof eventData.end === 'string'
        ? (eventData.end.includes('T') ? { dateTime: eventData.end } : { date: eventData.end })
        : eventData.end
    };

    if (eventData.attendees && Array.isArray(eventData.attendees)) {
      body.attendees = eventData.attendees.map(email => ({ email: typeof email === 'string' ? email : email.email }));
    }

    const queryParams = new URLSearchParams();
    if (eventData.addMeetLink) {
      queryParams.append('conferenceDataVersion', '1');
      body.conferenceData = {
        createRequest: {
          requestId: 'rian_' + Date.now(),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      };
    }

    const encodedCal = encodeURIComponent(calendarId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events?${queryParams.toString()}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Falha ao criar evento no Google Calendar.');
    }

    const account = store.accounts[targetEmail] || {};
    return this.normalizeEvent(data, account);
  }

  /**
   * Exclui um evento da agenda
   */
  async deleteEvent(eventId, accountEmail = null, calendarId = 'primary') {
    const store = this.loadStore();
    const targetEmail = accountEmail || store.primaryEmail;

    if (!targetEmail) throw new Error('Nenhuma conta conectada.');

    const token = await this.getValidAccessToken(targetEmail);
    if (!token) throw new Error(`Conta ${targetEmail} não autenticada.`);

    const encodedCal = encodeURIComponent(calendarId);
    const encodedEvent = encodeURIComponent(eventId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/${encodedEvent}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error?.message || 'Falha ao excluir evento.');
    }

    return { success: true, eventId, accountEmail: targetEmail };
  }

  /**
   * Adição rápida de eventos em linguagem natural
   */
  async quickAdd(text, accountEmail = null, calendarId = 'primary') {
    const store = this.loadStore();
    const targetEmail = accountEmail || store.primaryEmail;

    if (!targetEmail) throw new Error('Nenhuma conta Google conectada.');

    const token = await this.getValidAccessToken(targetEmail);
    if (!token) throw new Error(`Conta ${targetEmail} não autenticada.`);

    const params = new URLSearchParams({ text });
    const encodedCal = encodeURIComponent(calendarId);
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodedCal}/events/quickAdd?${params.toString()}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Falha na adição rápida do evento.');
    }

    const account = store.accounts[targetEmail] || {};
    return this.normalizeEvent(data, account);
  }

  /**
   * Normaliza um evento incluindo metadados da conta Google correspondente
   */
  normalizeEvent(googleEvent, account = {}) {
    const startRaw = googleEvent.start?.dateTime || googleEvent.start?.date || '';
    const endRaw = googleEvent.end?.dateTime || googleEvent.end?.date || '';

    let formattedTime = 'Dia todo';
    let isNext = false;

    if (startRaw && startRaw.includes('T')) {
      const startDate = new Date(startRaw);
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      formattedTime = `${hours}:${minutes}`;

      const now = new Date();
      const diffMs = startDate - now;
      if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
        isNext = true;
      }
    }

    const meetLink = googleEvent.hangoutLink || googleEvent.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')?.uri || null;

    return {
      id: googleEvent.id,
      title: googleEvent.summary || '(Sem título)',
      time: formattedTime,
      meta: googleEvent.location || (meetLink ? 'Google Meet' : 'Google Calendar'),
      description: googleEvent.description || '',
      start: startRaw,
      end: endRaw,
      location: googleEvent.location || '',
      meetLink,
      htmlLink: googleEvent.htmlLink,
      isNext,
      // Metadados da conta
      accountEmail: account.email || 'Google Calendar',
      accountName: account.name || 'Conta Google',
      accountColor: account.color || '#6EA1FF',
      accountLabel: account.label || 'Principal',
      raw: googleEvent
    };
  }

  /**
   * Retorna o status de conexão da integração multi-contas
   */
  getStatus() {
    const store = this.loadStore();
    const accounts = this.getAccounts();
    const isConfigured = this.isConfigured();

    if (accounts.length === 0) {
      return {
        connected: false,
        configured: isConfigured,
        accountsCount: 0,
        accounts: [],
        primaryEmail: null,
        message: isConfigured ? 'Pronto para conectar contas Google.' : 'Credenciais (Client ID / Secret) pendentes.'
      };
    }

    return {
      connected: true,
      configured: isConfigured,
      accountsCount: accounts.length,
      accounts: accounts,
      primaryEmail: store.primaryEmail,
      message: `${accounts.length} ${accounts.length === 1 ? 'conta conectada' : 'contas conectadas'}.`
    };
  }
}

module.exports = GoogleCalendarService;
