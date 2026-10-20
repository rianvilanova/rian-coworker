/**
 * Google Sheets Integration Service for Rian Coworker
 *
 * Registra gastos na planilha financeira pessoal, reaproveitando os tokens OAuth
 * das contas Google conectadas pelo GoogleCalendarService.
 *
 * Layout da aba (linha 1 = cabeçalho):
 *   E: Saídas (descrição) | F: Valor (R$) | G: Pix ou crédito | H: Data
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const PAYMENT_METHODS = {
  pix: 'Pix',
  credito: 'Crédito'
};

class GoogleSheetsService {
  constructor(calendarService) {
    this.calendarService = calendarService;
    this.config = this.loadConfig();
    this.sheetCache = null;
  }

  /**
   * Carrega a configuração da planilha (ID, aba e conta Google dona)
   */
  loadConfig() {
    let fileConfig = {};
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      } catch (err) {
        console.error('[GoogleSheetsService] Erro ao ler config.json:', err.message);
      }
    }

    return {
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || fileConfig.spreadsheetId || '',
      sheetGid: Number(process.env.GOOGLE_SHEETS_GID || fileConfig.sheetGid || 0),
      accountEmail: process.env.GOOGLE_SHEETS_ACCOUNT || fileConfig.accountEmail || '',
      firstDataRow: 2
    };
  }

  isConfigured() {
    return !!(this.config.spreadsheetId && this.config.accountEmail);
  }

  async getToken() {
    const token = await this.calendarService.getValidAccessToken(this.config.accountEmail);
    if (!token) {
      throw new Error(`Conta ${this.config.accountEmail} não está conectada. Conecte-a na página Agenda/Integrações.`);
    }
    return token;
  }

  /**
   * Chamada genérica à API do Google Sheets com mensagens de erro legíveis
   */
  async request(token, urlPath, options = {}) {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}${urlPath}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data.error?.message || res.statusText;
      if (res.status === 403 && /insufficient|scope/i.test(message)) {
        throw new Error('Permissão do Google Sheets ausente. Reconecte a conta Google para autorizar o acesso à planilha.');
      }
      throw new Error(`Google Sheets: ${message}`);
    }
    return data;
  }

  /**
   * Descobre o nome da aba (a partir do gid do link) e o locale da planilha
   */
  async getSheetInfo(token) {
    if (this.sheetCache) return this.sheetCache;

    const data = await this.request(token, '?fields=properties(title,locale),sheets.properties(sheetId,title)');
    const sheet = (data.sheets || []).find(s => s.properties.sheetId === this.config.sheetGid) || data.sheets?.[0];
    if (!sheet) throw new Error('Nenhuma aba encontrada na planilha.');

    this.sheetCache = {
      spreadsheetTitle: data.properties?.title || '',
      locale: data.properties?.locale || 'pt_BR',
      sheetId: sheet.properties.sheetId,
      sheetTitle: sheet.properties.title
    };
    return this.sheetCache;
  }

  quoteSheet(title) {
    return `'${title.replace(/'/g, "''")}'`;
  }

  /**
   * Formata a data (YYYY-MM-DD) no padrão que a planilha reconhece como data
   */
  formatDate(isoDate, locale) {
    const [y, m, d] = isoDate.split('-');
    if (locale.startsWith('pt') || locale === 'en_GB' || locale.startsWith('es')) return `${d}/${m}/${y}`;
    if (locale === 'en_US') return `${m}/${d}/${y}`;
    return isoDate;
  }

  /**
   * Evita que descrições começando com =, +, - ou @ sejam interpretadas como fórmula
   */
  sanitizeText(text) {
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
  }

  /**
   * Retorna o status da integração (para a interface)
   */
  async getStatus() {
    if (!this.isConfigured()) {
      return { configured: false, connected: false, message: 'Planilha não configurada.' };
    }
    try {
      const token = await this.getToken();
      const info = await this.getSheetInfo(token);
      return {
        configured: true,
        connected: true,
        accountEmail: this.config.accountEmail,
        spreadsheetTitle: info.spreadsheetTitle,
        sheetTitle: info.sheetTitle
      };
    } catch (err) {
      return { configured: true, connected: false, accountEmail: this.config.accountEmail, message: err.message };
    }
  }

  /**
   * Encontra a linha logo abaixo do último gasto real (colunas E:H), ignorando a linha "Total".
   * Se não houver espaço livre antes do Total, insere uma linha em E:H acima dele e
   * estende a fórmula =SUM(F2:Fn) do Total para incluir o novo gasto.
   */
  async findNextExpenseRow(token, info) {
    const sheet = this.quoteSheet(info.sheetTitle);
    const current = await this.request(token, `/values/${encodeURIComponent(`${sheet}!E:H`)}?majorDimension=ROWS&valueRenderOption=FORMULA`);
    const rows = current.values || [];

    // Linha do Total (1-based) na coluna E, abaixo do cabeçalho
    const totalIndex = rows.findIndex((r, i) => i >= this.config.firstDataRow - 1 && /^total\b/i.test(String(r[0] || '').trim()));
    const totalRow = totalIndex >= 0 ? totalIndex + 1 : null;

    // Último gasto real: última linha com conteúdo em E:H acima do Total (a API omite linhas vazias no final)
    const searchEnd = totalRow ? totalRow - 1 : rows.length;
    let lastExpenseRow = 1;
    for (let i = 0; i < searchEnd; i++) {
      if ((rows[i] || []).some(cell => String(cell).trim() !== '')) lastExpenseRow = i + 1;
    }

    const row = Math.max(this.config.firstDataRow, lastExpenseRow + 1);
    if (!totalRow || row < totalRow) return row;

    // Sem linha livre antes do Total: empurra só E:H para baixo, sem mexer nas outras colunas
    await this.request(token, ':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({
        requests: [{
          insertRange: {
            range: { sheetId: info.sheetId, startRowIndex: totalRow - 1, endRowIndex: totalRow, startColumnIndex: 4, endColumnIndex: 8 },
            shiftDimension: 'ROWS'
          }
        }]
      })
    });

    // O SUM não se expande sozinho com linhas inseridas logo após o fim do intervalo
    const newTotalCell = `${sheet}!F${totalRow + 1}`;
    const totalCell = await this.request(token, `/values/${encodeURIComponent(newTotalCell)}?valueRenderOption=FORMULA`);
    const formula = String(totalCell.values?.[0]?.[0] || '');
    const match = formula.match(/^=SUM\(F(\d+):F(\d+)\)$/i);
    if (match && Number(match[2]) < row) {
      await this.request(token, `/values/${encodeURIComponent(newTotalCell)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({ range: newTotalCell, values: [[`=SUM(F${match[1]}:F${row})`]] })
      });
    }

    return row;
  }

  /**
   * Registra um gasto na primeira linha livre abaixo da última preenchida (colunas E:H)
   */
  async addExpense({ description, amount, paymentMethod, date }) {
    if (!this.isConfigured()) throw new Error('Planilha do Google Sheets não configurada.');

    const desc = String(description || '').trim();
    const value = Number(amount);
    const method = PAYMENT_METHODS[paymentMethod];
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isoDate = date || today;

    if (!desc) throw new Error('Informe o que foi o gasto.');
    if (!Number.isFinite(value) || value <= 0) throw new Error('Informe um valor válido maior que zero.');
    if (!method) throw new Error('Forma de pagamento deve ser Pix ou Crédito.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) throw new Error('Data inválida.');

    const token = await this.getToken();
    const info = await this.getSheetInfo(token);
    const sheet = this.quoteSheet(info.sheetTitle);

    const row = await this.findNextExpenseRow(token, info);

    const range = `${sheet}!E${row}:H${row}`;
    await this.request(token, `/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[this.sanitizeText(desc), value, method, this.formatDate(isoDate, info.locale)]]
      })
    });

    console.log(`[GoogleSheetsService] Gasto registrado na linha ${row}: ${desc} · R$ ${value.toFixed(2)} · ${method}`);
    return { row, description: desc, amount: value, paymentMethod: method, date: isoDate, sheetTitle: info.sheetTitle };
  }
}

module.exports = GoogleSheetsService;
