const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const BOT_OWNER_NUMBER = '255745830630'; // replace with your number

let awayMode = false;
let isTyping = false;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    io.emit('qr', qr);
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready.');
    io.emit('ready');
});

client.on('message', async msg => {
    const content = msg.body.toLowerCase();
    const from = msg.from;

    // Reply with edited message simulation
    function editMessage(output) {
        msg.reply(`🛠️ ${output}`);
    }

    // Only allow commands from owner
    if (!from.includes(BOT_OWNER_NUMBER)) return;

    if (content === 'sudo away.on') {
        awayMode = true;
        editMessage("Away mode activated.");
    } else if (content === 'sudo away.off') {
        awayMode = false;
        editMessage("Away mode deactivated.");
    } else if (content === 'sudo bot.status') {
        editMessage(`Status:\nAway: ${awayMode}\nTyping: ${isTyping}`);
    } else if (content === 'sudo typing.on') {
        isTyping = true;
        client.sendPresenceAvailable();
        editMessage("Typing emulation on.");
    } else if (content === 'sudo typing.off') {
        isTyping = false;
        editMessage("Typing emulation off.");
    } else if (content.startsWith('sudo schedule.set')) {
        const parts = content.split(' ');
        const time = parts[2];
        const number = parts[3];
        const message = parts.slice(4).join(' ');

        const [hour, minute] = time.split(':');
        schedule.scheduleJob({ hour: parseInt(hour), minute: parseInt(minute) }, () => {
            client.sendMessage(`${number}@c.us`, message);
        });

        editMessage(`Scheduled: "${message}" to ${number} at ${time}`);
    }
});

client.on('message_create', msg => {
    if (awayMode && msg.fromMe === false) {
        msg.reply("🚫 I’m currently unavailable. Please try later.");
    }
});

client.initialize();

io.on('connection', socket => {
    console.log("🌐 Web UI connected");
});

server.listen(PORT, () => {
    console.log(`🌍 Server is running on port ${PORT}`);
});
