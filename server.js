// server.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const express = require("express");
const socketIO = require("socket.io");
const http = require("http");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const SESSION_FILE_PATH = "./session.json";
let sessionData;

if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

const client = new Client({
  puppeteer: { headless: true, args: ["--no-sandbox"] },
  session: sessionData,
});

client.on("qr", async (qr) => {
  const qrImage = await qrcode.toDataURL(qr);
  io.emit("qr", qrImage);
  console.log("📷 QR Code sent to frontend.");
});

client.on("authenticated", (session) => {
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) console.error("❌ Failed to save session", err);
    else console.log("✅ Session saved successfully.");
  });
});

client.on("ready", () => {
  console.log("✅ WhatsApp client is ready.");
  io.emit("ready");
});

client.on("message", async (msg) => {
  if (!msg.body.startsWith("sudo ")) return;

  const command = msg.body.slice(5).trim();

  // Handle different commands
  if (command === "bot.status") {
    await msg.edit("🤖 Bot is active.");
  }

  if (command === "away.on") {
    await msg.edit("🛑 Away mode activated.");
  }

  if (command === "away.off") {
    await msg.edit("✅ Away mode deactivated.");
  }

  if (command === "typing.on") {
    client.sendPresenceAvailable();
    client.sendTyping(msg.from);
    await msg.edit("💬 Typing emulation started.");
  }

  if (command === "logout") {
    if (fs.existsSync(SESSION_FILE_PATH)) fs.unlinkSync(SESSION_FILE_PATH);
    await msg.reply("🔓 Session cleared. Restart bot to scan QR again.");
    client.logout();
  }
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("🌐 Socket connected.");
});

server.listen(3000, () => {
  console.log("🌍 Server running on http://localhost:3000");
});

client.initialize();
