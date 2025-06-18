import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';

const allowedUsers = ['255745830630', '255765457691']; // replace with your number & Mansour's (no "+")

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './sessions'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('[!] Scan this QR code with your emulator WhatsApp:');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('[✓] Authenticated successfully');
});

client.on('auth_failure', msg => {
    console.error('[X] AUTHENTICATION FAILURE:', msg);
});

client.on('ready', async () => {
    console.log('[✓] Bot is ready!');

    // Send DM to allowed users
    for (const number of allowedUsers) {
        const chatId = `${number}@c.us`;
        await client.sendMessage(chatId, '*[Anonymous Bot]*\n\n⚠️ You are now connected to the .NETFramework system. Please use responsibly.\nMisuse may lead to disconnection.');
    }
});

client.on('message', async msg => {
    const senderId = msg.from.split('@')[0];

    if (!allowedUsers.includes(senderId)) {
        await msg.reply("You are not available in .NETFramework, cannot process command.");
        return;
    }

    // Process allowed user commands here
    if (msg.body.toLowerCase() === 'menu') {
        msg.reply('*Anonymous Bot Menu*\n1. Type `gpt <your question>` to ask AI\n2. Type `say <text>` for voice\n3. More features coming soon...');
    }
});

client.initialize();
