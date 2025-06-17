import express from 'express';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { generate } from 'qrcode';
import { handleCommand } from './commands.js';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

let qrCodeImage = '';
let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox']
  }
});

client.on('qr', async (qr) => {
  console.log('[QR] Scan this code:');
  qrcode.generate(qr, { small: true });
  qrCodeImage = await generate(qr);
});

client.on('ready', () => {
  console.log('[BOT] WhatsApp client is ready');
  isReady = true;
});

client.on('message_create', async (msg) => {
  const text = msg.body.trim();
  const isFromMe = msg.fromMe;

  if (text.startsWith('sudo') && isFromMe) {
    const output = await handleCommand(text, msg, client);
    if (output) {
      try {
        await msg.edit(output);
      } catch {
        await msg.reply(output);
      }
    }
  }
});

client.initialize();

// Web server to show QR
app.get('/', (req, res) => {
  const html = readFileSync('./index.html', 'utf8');
  const status = isReady
    ? `<h2 style="color: green;">✅ Nethunter is running</h2>`
    : qrCodeImage
      ? `<h2>📲 Scan QR to Link WhatsApp</h2><img src="${qrCodeImage}"/>`
      : `<p>Loading QR...</p>`;
  res.send(html.replace('{{STATUS}}', status));
});

server.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
