const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const TOKEN = process.env.BOT_TOKEN, PORT = process.env.PORT || 3000;
const BASE = (process.env.WEBAPP_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const SECRET = TOKEN ? crypto.createHash('sha256').update(TOKEN).digest('hex').slice(0, 32) : '';
const PUB = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const api = (method, body) => fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {})
}).then(r => r.json());

async function handle(update) {
  const m = update.message;
  if (!m || !m.text) return;
  if (m.text.startsWith('/start') || m.text.startsWith('/play')) {
    await api('sendMessage', {
      chat_id: m.chat.id,
      text: 'Viral Life — снимай вирусные видео, копи подписчиков и открывай кейсы с уникальными номерами.',
      reply_markup: { inline_keyboard: [[{ text: '🎮 Играть', web_app: { url: BASE } }]] }
    });
  }
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'POST' && url === '/webhook') {
    if (req.headers['x-telegram-bot-api-secret-token'] !== SECRET) { res.writeHead(403); return res.end(); }
    let b = '';
    req.on('data', d => { b += d; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => {
      res.writeHead(200); res.end('ok');
      try { handle(JSON.parse(b)).catch(e => console.error(e)); } catch (e) { console.error(e); }
    });
    return;
  }
  if (url === '/health') { res.writeHead(200); return res.end('ok'); }
  let file = path.normalize(path.join(PUB, url === '/' ? 'index.html' : url));
  if (!file.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=3600' });
    res.end(data);
  });
}).listen(PORT, async () => {
  console.log('Server on port', PORT);
  if (!TOKEN) return console.log('BOT_TOKEN не задан — работает только сайт');
  if (!BASE) return console.log('Не найден адрес сервиса (RENDER_EXTERNAL_URL / WEBAPP_URL)');
  try {
    console.log('setWebhook', JSON.stringify(await api('setWebhook', { url: BASE + '/webhook', secret_token: SECRET, allowed_updates: ['message'] })));
    console.log('menuButton', JSON.stringify(await api('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Играть', web_app: { url: BASE } } })));
    await api('setMyCommands', { commands: [{ command: 'start', description: 'Открыть игру' }] });
  } catch (e) { console.error('Telegram setup failed:', e.message); }
});
process.on('unhandledRejection', e => console.error(e));
