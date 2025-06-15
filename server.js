const express = require('express');
const qrcode = require('qrcode');
const http = require('http');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const schedule = require('node-schedule');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
const BOT_OWNER_NUMBER = '255745830630'; // Your number without @c.us or +

// WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'nethunter' }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let isAvailable = true;
let useTyping = false;
let isReady = false;
let lastQr = null;

// Serve static files (for simplicity, none now, but you can add CSS/js here)
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

client.on('qr', async (qr) => {
  lastQr = qr;
  // Emit QR to clients connected to socket
  io.emit('qr', qr);
  io.emit('message', '⚠️ Scan the QR code with WhatsApp to authenticate.');
});

client.on('ready', () => {
  isReady = true;
  io.emit('ready', true);
  io.emit('message', '✅ WhatsApp client is ready.');
  console.log('Client is ready!');
});

client.on('auth_failure', () => {
  io.emit('message', '❌ Authentication failure, restart the bot.');
});

client.on('disconnected', () => {
  isReady = false;
  io.emit('ready', false);
  io.emit('message', '⚠️ WhatsApp client disconnected.');
});

client.initialize();

client.on('message', async (msg) => {
  if (!isAvailable && msg.from !== `${BOT_OWNER_NUMBER}@c.us`) {
    if (!msg.hasQuotedMsg) {
      if (useTyping) {
        await client.sendPresenceAvailable();
        await client.sendTyping(msg.from);
        await new Promise((r) => setTimeout(r, 1500));
      }
      msg.reply('🤖 I am currently unavailable. I will respond later.');
    }
    return;
  }
  // Ignore command messages from others
  if (msg.from === `${BOT_OWNER_NUMBER}@c.us` && msg.body.toLowerCase().startsWith('sudo ')) {
    // Commands sent from WhatsApp chat - already handled below
  }
});

io.on('connection', (socket) => {
  console.log('Client connected to web UI');

  // Send last QR if available and not ready
  if (!isReady && lastQr) {
    socket.emit('qr', lastQr);
    socket.emit('message', '⚠️ Scan the QR code with WhatsApp to authenticate.');
  }

  // Send ready status
  socket.emit('ready', isReady);

  // Listen for commands from web UI
  socket.on('command', async (commandStr) => {
    if (!isReady) {
      socket.emit('commandResponse', '❌ Bot not connected.');
      return;
    }
    if (!commandStr.toLowerCase().startsWith('sudo ')) {
      socket.emit('commandResponse', '❌ Commands must start with sudo');
      return;
    }

    const args = commandStr.slice(5).trim().split(' ');
    const command = args.shift().toLowerCase();

    // Use a fake "message" object to use .edit()
    // We'll simulate editing by emitting the response back to UI

    try {
      switch (command) {
        case 'bot.status':
          socket.emit('commandResponse', '✅ Bot is active and authenticated.');
          break;

        case 'away.on':
          isAvailable = false;
          socket.emit('commandResponse', '📴 Away mode ON. Auto-replies activated.');
          break;

        case 'away.off':
          isAvailable = true;
          socket.emit('commandResponse', '✅ Away mode OFF. Back to normal.');
          break;

        case 'typing.on':
          useTyping = true;
          socket.emit('commandResponse', '🌀 Typing emulation enabled.');
          break;

        case 'typing.off':
          useTyping = false;
          socket.emit('commandResponse', '🚫 Typing emulation disabled.');
          break;

        case 'schedule.set':
          if (args.length < 3) {
            socket.emit('commandResponse', '❌ Invalid format. Use:\nsudo schedule.set HH:MM 2556XXXXXXXX "Your message"');
            break;
          }
          const time = args.shift();
          const phone = args.shift();
          const messageText = args.join(' ').replace(/^"|"$/g, '');

          const timeParts = time.split(':');
          if (
            timeParts.length !== 2 ||
            isNaN(timeParts[0]) ||
            isNaN(timeParts[1]) ||
            Number(timeParts[0]) < 0 ||
            Number(timeParts[0]) > 23 ||
            Number(timeParts[1]) < 0 ||
            Number(timeParts[1]) > 59
          ) {
            socket.emit('commandResponse', '❌ Invalid time format. Use HH:MM 24-hour format.');
            break;
          }

          const hour = Number(timeParts[0]);
          const minute = Number(timeParts[1]);
          const target = phone.includes('@c.us') ? phone : phone + '@c.us';

          schedule.scheduleJob(`${minute} ${hour} * * *`, () => {
            client.sendMessage(target, `🕒 Scheduled message:\n${messageText}`);
          });

          socket.emit('commandResponse', `⏰ Scheduled message to ${phone} at ${time}`);
          break;

        case 'nethunter.help':
          socket.emit('commandResponse',
            `📖 Available Commands:
• sudo bot.status
• sudo away.on / sudo away.off
• sudo typing.on / sudo typing.off
• sudo schedule.set HH:MM 2556XXXXXXXX "Your message"
`
          );
          break;

        default:
          socket.emit('commandResponse', '❓ Unknown command. Type sudo nethunter.help');
      }
    } catch (error) {
      console.error('Command error:', error);
      socket.emit('commandResponse', '⚠️ An error occurred while processing your command.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected from web UI');
  });
});

server.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
