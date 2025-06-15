const express = require('express');
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const schedule = require('node-schedule');

const app = express();
const port = process.env.PORT || 3000;

// WhatsApp client with persistent auth session
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'nethunter' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Bot owner WhatsApp ID - replace with your full WhatsApp number (country code + number)
const BOT_OWNER = '255745830630';

// Bot state variables
let isAvailable = true;
let useTyping = false;

// Start WhatsApp client
client.initialize();

// Display QR in terminal for login
client.on('qr', (qr) => {
  console.log('Scan this QR with WhatsApp to authenticate:');
  qrcode.generate(qr, { small: true });
});

// Client ready
client.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
});

// Listen for incoming messages
client.on('message', async (msg) => {
  // Auto-reply when away and message from others (not bot owner)
  if (!isAvailable && msg.from !== BOT_OWNER) {
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

  // Only listen for sudo commands from BOT_OWNER
  if (msg.from === BOT_OWNER && msg.body.toLowerCase().startsWith('sudo ')) {
    const args = msg.body.slice(5).trim().split(' ');
    const command = args.shift().toLowerCase();

    try {
      switch (command) {
        case 'bot.status':
          await msg.edit('✅ Bot is active and authenticated.');
          break;

        case 'bot.qr':
          await msg.edit('⚠️ QR regeneration is only possible at app start.');
          break;

        case 'bot.ping':
          await msg.edit('🏓 Pong! Bot is responsive.');
          break;

        case 'bot.clear':
          await msg.edit('🧹 Session clear not supported at runtime. Restart app.');
          break;

        case 'away.on':
          isAvailable = false;
          await msg.edit('📴 Away mode ON. Auto-replies activated.');
          break;

        case 'away.off':
          isAvailable = true;
          await msg.edit('✅ Away mode OFF. Back to normal.');
          break;

        case 'typing.on':
          useTyping = true;
          await msg.edit('🌀 Typing emulation enabled.');
          break;

        case 'typing.off':
          useTyping = false;
          await msg.edit('🚫 Typing emulation disabled.');
          break;

        case 'schedule.set':
          if (args.length < 3) {
            await msg.edit('❌ Invalid format. Use:\nsudo schedule.set HH:MM 2556XXXXXXXX "Your message"');
            break;
          }
          const time = args.shift();
          const phone = args.shift();
          const messageText = args.join(' ').replace(/^"|"$/g, '');

          // Validate time format HH:MM
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
            await msg.edit('❌ Invalid time format. Use HH:MM 24-hour format.');
            break;
          }

          const hour = Number(timeParts[0]);
          const minute = Number(timeParts[1]);
          const target = phone.includes('@c.us') ? phone : phone + '@c.us';

          // Schedule the job to run every day at specified time
          schedule.scheduleJob(`${minute} ${hour} * * *`, () => {
            client.sendMessage(target, `🕒 Scheduled message:\n${messageText}`);
          });

          await msg.edit(`⏰ Scheduled message to ${phone} at ${time}`);
          break;

        case 'nethunter.help':
          await msg.edit(
            `📖 Available Commands:
• sudo bot.status
• sudo bot.qr
• sudo bot.ping
• sudo away.on / sudo away.off
• sudo typing.on / sudo typing.off
• sudo schedule.set HH:MM 2556XXXXXXXX "Your message"
`
          );
          break;

        default:
          await msg.edit('❓ Unknown command. Type sudo nethunter.help');
      }
    } catch (error) {
      console.error('Command error:', error);
      await msg.edit('⚠️ An error occurred while processing your command.');
    }
  }
});

app.get('/', (req, res) => {
  res.send('nethunter.mini WhatsApp bot is running.');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
