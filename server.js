import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

app.use(express.static(join(__dirname, 'public')));
app.use(express.json());

let qrCodeData = '';

client.on('qr', async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr);
  console.log('[ QR RECEIVED ]');
});

client.on('ready', () => {
  console.log('[ BOT IS READY ✅ ]');
});

client.on('authenticated', () => {
  console.log('[ AUTHENTICATED 🔐 ]');
});

client.initialize();

app.get('/qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    res.status(503).json({ message: 'QR code not available yet' });
  }
});

app.post('/link-phone', (req, res) => {
  const { phone } = req.body;
  console.log(`[ MOCK PHONE LOGIN ] Requested phone link for: ${phone}`);
  // Simulation: return success message
  res.json({ success: true, message: `Link code for ${phone} sent! (mocked)` });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
