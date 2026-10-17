/**
 * Google Calendar API Integration Service for Rian Coworker
 * 
 * Implementa autenticação OAuth 2.0 (com renovação automática de tokens via Refresh Token)
 * e métodos para listar, criar, atualizar e excluir eventos no Google Calendar.
 */

const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, 'tokens.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Escopos padrão necessários para o assistente
const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

class GoogleCalendarService {
  constructor(config = {}) {
    this.config = this.loadConfig(config);
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
   * Atualiza e salva as configurações
   */
  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    return this.config;
  }

  /**
   * Salva os tokens recebidos (access_token, refresh_token, expiry_date)
   */
  saveTokens(tokens) {
    const existing = this.loadTokens() || {};
    const updated = {
      ...existing,
      ...tokens,
      saved_at: Date.now()
    };

    // Calcula expiração em timestamp se vier em expires_in (segundos)
    if (tokens.expires_in) {
      updated.expires_at = Date.now() + (tokens.expires_in * 1000);
    }

    fs.writeFileSync(TOKENS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  }

  /**
   * Carrega os tokens salvos
   */
  loadTokens() {
    if (!fs.existsSync(TOKENS_FILE)) return null;
    try {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Remove tokens (desconectar)
   */
  clearTokens() {
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
      prompt: 'consent',      // Garante envio do refresh_token
      include_granted_scopes: 'true'
    });

    if (state) {
      params.append('state', state);
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Troca o código retornado pelo Google por tokens de acesso
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Falha ao trocar código por tokens.');
    }

    const saved = this.saveTokens(data);

    // Tenta obter informações básicas do perfil do usuário para cache
    try {
      const userInfo = await this.getUserProfile(saved.access_token);
      if (userInfo && userInfo.email) {
        this.saveTokens({ user_email: userInfo.email, user_name: userInfo.name, user_picture: userInfo.picture });
      }
    } catch (e) {
      console.warn('[GoogleCalendarService] Não foi possível obter perfil do usuário:', e.message);
    }

    return saved;
  }

  /**
   * Renova o token de acesso caso tenha expirado
   */
  async refreshAccessToken(refreshToken) {
    const token = refreshToken || (this.loadTokens()?.refresh_token);
    if (!token) {
      throw new Error('Nenhum refresh token disponível. Reautentique sua conta Google.');
    }

    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: token,
      grant_type: 'refresh_token'
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Falha ao renovar token de acesso.');
    }

    return this.saveTokens(data);
  }

  /**
   * Obtém um token de acesso válido, renovando automaticamente se expirou
   */
  async getValidAccessToken() {
    const tokens = this.loadTokens();
    if (!tokens || !tokens.access_token) {
      return null;
    }

    // Se estiver a menos de 60 segundos de expirar ou já expirou
    const isExpired = tokens.expires_at ? (Date.now() >= tokens.expires_at - 60000) : false;

    if (isExpired && tokens.refresh_token) {
      console.log('[GoogleCalendarService] Token expirado, renovando automaticamente...');
      const renewed = await this.refreshAccessToken(tokens.refresh_token);
      return renewed.access_token;
    }

    return tokens.access_token;
  }

  /**
   * Obtém informações do perfil do usuário conectado
   */
  async getUserProfile(accessToken) {
    const token = accessToken || await this.getValidAccessToken();
    if (!token) throw new Error('Não autenticado.');

    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error('Falha ao obter perfil do usuário Google.');
    }

    return await res.json();
  }

  /**
   * Lista os calendários disponíveis na conta do usuário
   */
  async listCalendars() {
    const token = await this.getValidAccessToken();
    if (!token) throw new Error('Conta Google não conectada.');

    const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Falha ao listar calendários.');
    }

    return data.items || [];
  }

  /**
   * Lista eventos do Google Calendar
   * @param {Object} options { calendarId, timeMin, timeMax, maxResults, query }
   */
  async listEvents(options = {}) {
    const token = await this.getValidAccessToken();
    if (!token) throw new Error('Conta Google não conectada.');

    const calendarId = encodeURIComponent(options.calendarId || 'primary');
    
    // Por padrão, pega desde o início do dia de hoje até 7 dias adiante se não especificado
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const timeMin = options.timeMin || startOfDay.toISOString();
    
    const params = new URLSearchParams({
      singleEvents: 'true',
      orderBy: 'startTime',
      timeMin,
      maxResults: String(options.maxResults || 20)
    });

    if (options.timeMax) {
      params.append('timeMax', options.timeMax);
    }

    if (options.query) {
      params.append('q', options.query);
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Falha ao buscar eventos da agenda.');
    }

    // Normaliza para o formato consumido pelo Rian Coworker
    return (data.items || []).map(item => this.normalizeEvent(item));
  }

  /**
   * Cria um novo evento no Google Calendar
   * @param {Object} eventData { summary, description, start, end, location, attendees, addMeetLink }
   * @param {string} calendarId ID do calendário (padrão: 'primary')
   */
  async createEvent(eventData, calendarId = 'primary') {
    const token = await this.getValidAccessToken();
    if (!token) throw new Error('Conta Google não conectada.');

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

    // Se solicitar link do Google Meet
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

    return this.normalizeEvent(data);
  }

  /**
   * Exclui um evento da agenda
   */
  async deleteEvent(eventId, calendarId = 'primary') {
    const token = await this.getValidAccessToken();
    if (!token) throw new Error('Conta Google não conectada.');

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

    return { success: true, eventId };
  }

  /**
   * Adição rápida de eventos em linguagem natural
   * Exemplo de texto: "Almoço com Marcelo amanhã às 12h30"
   */
  async quickAdd(text, calendarId = 'primary') {
    const token = await this.getValidAccessToken();
    if (!token) throw new Error('Conta Google não conectada.');

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

    return this.normalizeEvent(data);
  }

  /**
   * Normaliza um evento retornado pela API do Google para o formato do Rian Coworker
   */
  normalizeEvent(googleEvent) {
    const startRaw = googleEvent.start?.dateTime || googleEvent.start?.date || '';
    const endRaw = googleEvent.end?.dateTime || googleEvent.end?.date || '';

    let formattedTime = 'Dia todo';
    let isNext = false;

    if (startRaw && startRaw.includes('T')) {
      const startDate = new Date(startRaw);
      const hours = String(startDate.getHours()).padStart(2, '0');
      const minutes = String(startDate.getMinutes()).padStart(2, '0');
      formattedTime = `${hours}:${minutes}`;

      // Calcula se o evento é o próximo nos próximos 60 minutos
      const now = new Date();
      const diffMs = startDate - now;
      if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
        isNext = true;
      }
    }

    // Identifica link do Google Meet caso exista
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
      raw: googleEvent
    };
  }

  /**
   * Retorna o status de conexão da integração
   */
  getStatus() {
    const tokens = this.loadTokens();
    const isConfigured = this.isConfigured();

    if (!tokens || !tokens.access_token) {
      return {
        connected: false,
        configured: isConfigured,
        email: null,
        message: isConfigured ? 'Pronto para autenticar com sua conta Google.' : 'Credenciais (Client ID / Secret) pendentes.'
      };
    }

    const isExpired = tokens.expires_at ? (Date.now() >= tokens.expires_at) : false;

    return {
      connected: true,
      configured: isConfigured,
      email: tokens.user_email || 'Conta Google Conectada',
      name: tokens.user_name || null,
      picture: tokens.user_picture || null,
      expiresAt: tokens.expires_at || null,
      isExpired,
      hasRefreshToken: !!tokens.refresh_token
    };
  }
}

module.exports = GoogleCalendarService;
