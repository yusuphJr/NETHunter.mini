import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

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
  console.log('[📷] QR Code received and emitted to frontend');
});

client.on('ready', () => {
  io.emit('ready', 'WhatsApp Bot is ready 🚀');
  console.log('[🤖] Bot is ready and connected.');
});

client.on('message', async msg => {
  const content = msg.body.toLowerCase();
  if (!content.startsWith('sudo ')) return;

  const command = content.slice(5).trim();
  console.log(`[📥] Command received: ${command}`);

  let response = '';

  switch (command) {
    case 'bot.status':
      response = '🤖 Bot is active.';
      break;

    case 'away.on':
      response = '✉️ Auto-reply mode ON.';
      break;

    case 'typing.on':
      client.sendMessage(msg.from, '_typing..._');
      response = '💬 Emulated typing.';
      break;

    case 'logout':
      await client.logout();
      response = '🔒 Logged out.';
      break;

    default:
      response = '⚠️ Unknown command.';
  }

  try {
    await msg.edit(`✔️ ${response}`);
  } catch {
    await msg.reply(`✔️ ${response}`);
  }
});

client.on('disconnected', () => {
  console.log('[🔌] WhatsApp client disconnected.');
});

client.initialize();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
