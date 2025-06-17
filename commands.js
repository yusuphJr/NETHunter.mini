export async function handleCommand(text, msg, client) {
  const command = text.slice(5).trim().toLowerCase();

  switch (true) {
    case command === 'help':
      return `🛠 Available Commands:
• sudo help – Show this help menu
• sudo say <text> – Bot will repeat
• sudo auto-on – Enable auto away reply
• sudo auto-off – Disable auto away
• sudo typing – Simulate typing
• sudo status – Check bot status`;

    case command.startsWith('say'):
      return `🔊 ${text.slice(8)}`;

    case command === 'auto-on':
      return `🟢 Auto-away reply enabled.`;

    case command === 'auto-off':
      return `🔴 Auto-away reply disabled.`;

    case command === 'typing':
      msg.chat.sendStateTyping();
      return '⌨️ Typing simulated...';

    case command === 'status':
      return '✅ Nethunter is online and operational.';

    default:
      return `❓ Unknown command. Type: sudo help`;
  }
}
