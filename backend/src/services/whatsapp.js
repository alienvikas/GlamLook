const twilio = require('twilio');

async function sendWhatsApp(toPhone, message) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !toPhone) return;
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const digits = toPhone.replace(/\D/g, '');
    const to = `whatsapp:${digits.startsWith('91') ? '+' + digits : '+91' + digits}`;
    await client.messages.create({ from, to, body: message });
    console.log('WhatsApp sent to', to);
  } catch (err) {
    console.error('WhatsApp error:', err.message);
  }
}

module.exports = { sendWhatsApp };
