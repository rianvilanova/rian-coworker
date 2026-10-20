/**
 * Rian Coworker - Local Server & Google Calendar API Gateway
 * 
 * Executa o servidor estático da aplicação e a API de integração com o Google Calendar.
 * Roda com Node.js nativo (sem necessidade obrigatória de npm install).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const GoogleCalendarService = require('./integrations/google-calendar/google-calendar-service');
const calendarService = new GoogleCalendarService();

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = __dirname;

// Mapeamento de tipos MIME para arquivos estáticos
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Lê o corpo da requisição JSON
 */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Prevenção contra payloads gigantes (> 1MB)
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('JSON Inválido'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Envia resposta JSON com cabeçalhos CORS
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Criação do Servidor HTTP
const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost:' + PORT}`);
  const pathname = requestUrl.pathname;
  const searchParams = requestUrl.searchParams;
  const method = req.method.toUpperCase();

  // Tratamento de CORS Preflight (OPTIONS)
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================
  // ROTAS DA API: /api/calendar/*
  // ==========================================

  // 1. Status da Conexão
  if (pathname === '/api/calendar/status' && method === 'GET') {
    try {
      const status = calendarService.getStatus();
      return sendJson(res, 200, status);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 2. Salvar Configurações (Client ID / Client Secret)
  if (pathname === '/api/calendar/config' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.clientId) {
        return sendJson(res, 400, { error: 'clientId é obrigatório.' });
      }
      calendarService.saveConfig(body);
      return sendJson(res, 200, { success: true, message: 'Configurações do Google Calendar salvas.' });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 3. Obter URL de Autenticação OAuth 2.0
  if (pathname === '/api/calendar/auth' && method === 'GET') {
    try {
      const authUrl = calendarService.generateAuthUrl(searchParams.get('state') || '');
      // Se solicitado retorno em JSON
      if (searchParams.get('format') === 'json') {
        return sendJson(res, 200, { authUrl });
      }
      // Caso contrário, redireciona o navegador diretamente
      res.writeHead(302, { Location: authUrl });
      return res.end();
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 4. Callback do Google OAuth 2.0
  if (pathname === '/api/calendar/callback' && method === 'GET') {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      res.writeHead(302, { Location: '/#agenda?error=' + encodeURIComponent(error) });
      return res.end();
    }

    if (!code) {
      res.writeHead(302, { Location: '/#agenda?error=no_code' });
      return res.end();
    }

    try {
      await calendarService.exchangeCodeForTokens(code);
      // Redireciona de volta para a tela de agenda com indicador de sucesso
      res.writeHead(302, { Location: '/#agenda?auth=success' });
      return res.end();
    } catch (err) {
      console.error('[API Callback Error]', err);
      res.writeHead(302, { Location: '/#agenda?auth=error&msg=' + encodeURIComponent(err.message) });
      return res.end();
    }
  }

  // 5. Listar Contas Conectadas
  if (pathname === '/api/calendar/accounts' && method === 'GET') {
    try {
      const accounts = calendarService.getAccounts();
      const status = calendarService.getStatus();
      return sendJson(res, 200, { accounts, primaryEmail: status.primaryEmail });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. Definir Conta Principal
  if (pathname === '/api/calendar/set-primary' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.email) return sendJson(res, 400, { error: 'E-mail é obrigatório.' });
      const result = calendarService.setPrimaryAccount(body.email);
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 7. Desconectar conta Google (específica ou todas)
  if (pathname === '/api/calendar/disconnect' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = body.email || searchParams.get('email');
      if (email) {
        const result = calendarService.removeAccount(email);
        return sendJson(res, 200, { success: true, message: `Conta ${email} desconectada.`, result });
      } else {
        calendarService.clearAll();
        return sendJson(res, 200, { success: true, message: 'Todas as contas Google foram desconectadas.' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 8. Listar Eventos (Unificados ou por conta)
  if (pathname === '/api/calendar/events' && method === 'GET') {
    try {
      const events = await calendarService.listEvents({
        timeMin: searchParams.get('timeMin') || undefined,
        timeMax: searchParams.get('timeMax') || undefined,
        maxResults: searchParams.get('maxResults') ? parseInt(searchParams.get('maxResults'), 10) : undefined,
        calendarId: searchParams.get('calendarId') || undefined, // sem calendarId = todas as agendas visíveis
        accountEmail: searchParams.get('account') || undefined
      });
      return sendJson(res, 200, { events });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 9. Criar Evento em Conta Específica
  if (pathname === '/api/calendar/events' && method === 'POST') {
    try {
      const eventData = await readJsonBody(req);
      const calendarId = searchParams.get('calendarId') || 'primary';
      const accountEmail = eventData.accountEmail || searchParams.get('account') || null;
      const created = await calendarService.createEvent(eventData, accountEmail, calendarId);
      return sendJson(res, 201, { success: true, event: created });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 10. Adição Rápida de Evento (Linguagem Natural)
  if (pathname === '/api/calendar/quick-add' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.text) {
        return sendJson(res, 400, { error: 'Campo "text" é obrigatório.' });
      }
      const accountEmail = body.accountEmail || searchParams.get('account') || null;
      const created = await calendarService.quickAdd(body.text, accountEmail, body.calendarId || 'primary');
      return sendJson(res, 201, { success: true, event: created });
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }
  }

  // 11. Excluir Evento (/api/calendar/events/{id})
  if (pathname.startsWith('/api/calendar/events/') && method === 'DELETE') {
    const eventId = pathname.replace('/api/calendar/events/', '');
    const accountEmail = searchParams.get('account') || null;
    try {
      const result = await calendarService.deleteEvent(eventId, accountEmail, searchParams.get('calendarId') || 'primary');
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // ==========================================
  // ARQUIVOS ESTÁTICOS DO FRONTEND
  // ==========================================
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Bloqueia arquivos sensíveis: credenciais/tokens e código em integrations/ (exceto guias .md),
  // arquivos ocultos (.git, .env, .gitignore) e o próprio servidor
  const relPath = path.relative(PUBLIC_DIR, filePath).split(path.sep).join('/');
  const isSensitive =
    relPath.split('/').some(segment => segment.startsWith('.')) ||
    (relPath.startsWith('integrations/') && path.extname(relPath).toLowerCase() !== '.md') ||
    relPath === 'server.js';

  // Prevenção contra Path Traversal
  if (!filePath.startsWith(PUBLIC_DIR) || isSensitive) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acesso proibido.');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se não encontrou o arquivo estático, tenta fallback para index.html (SPA)
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('404 - Arquivo não encontrado.');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('500 - Erro interno ao ler arquivo.');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

// Inicia o servidor se executado diretamente
if (require.main === module) {
  server.listen(PORT, () => {
    console.log('=====================================================');
    console.log(`🤖 Rian Coworker Server rodando em http://localhost:${PORT}`);
    console.log(`📅 Google Calendar API Gateway pronto.`);
    console.log('=====================================================');
  });
}

module.exports = server;
