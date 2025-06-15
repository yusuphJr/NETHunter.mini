const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const schedule = require('node-schedule');

const client = new Client({
    authStrategy: new LocalAuth()
});

let isAvailable = false; // Change via command later

client.on('qr', qr => {
    console.log('📲 Scan the QR below to login:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WhatsApp is ready (nethunter.mini)');
});

// Auto-response when user is away
client.on('message', async msg => {
    if (isAvailable) return;

    const lower = msg.body.toLowerCase();

    // Simulate typing
    await client.sendMessage(msg.from, '_Typing..._');
    await delay(1000);

    // Handle messages
    if (lower === 'hi' || lower === 'hello') {
        await msg.reply('👋 I’m currently away. nethunter.mini will notify me. Please wait.');
    }
});

// Scheduled message example (edit time)
schedule.scheduleJob('30 14 * * *', () => { // At 2:30 PM every day
    const target = '2556xxxxxxx@c.us'; // WhatsApp ID format
    client.sendMessage(target, '🔔 Scheduled message from nethunter.mini!');
});

// Helper delay
function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

module.exports = client;
