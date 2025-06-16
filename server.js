// server.js
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import qrcode from 'qrcode';
import pkg from 'whatsapp-web.js';

const { Client, LocalAuth } = pkg;

const app = express();
const server = createServer(app);
const io = new SocketIO(server);

app.use(express.static('public'));

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  }
});

client.on('qr', async (qr) => {
  const qrImage = await qrcode.toDataURL(qr);
  io.emit('qr', qrImage);
  console.log('[📷] QR Code emitted to frontend');
});

client.on('ready', () => {
  console.log('[🤖] Bot is ready.');
  io.emit('ready', '✅ Nethunter Mini is ready!');
});

client.on('message', async msg => {
  const content = msg.body.trim().toLowerCase();
  if (!content.startsWith('sudo ')) return;

  const command = content.slice(5).trim();
  console.log(`[📥] Command: ${command}`);

  let response = '';

  switch (command) {
    case 'bot.status':
      response = '🤖 Nethunter Mini is active.';
      break;
    case 'typing.on':
      await client.sendMessage(msg.from, '_Bot is typing..._');
      response = '💬 Typing emulation triggered.';
      break;
    case 'away.on':
      response = '🛑 Auto-away mode ON. Unavailable response active.';
      break;
    case 'logout':
      await client.logout();
      response = '🔒 Logged out successfully.';
      break;
    default:
      response = '⚠️ Unknown command. Try: sudo bot.status';
  }

  try {
    await msg.edit(`🛠 ${response}`);
  } catch {
    await msg.reply(`🛠 ${response}`);
  }
});

client.on('disconnected', () => {
  console.log('[⚡] WhatsApp client disconnected.');
});

client.initialize();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server live at http://localhost:${PORT}`);
});
