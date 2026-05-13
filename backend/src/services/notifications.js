const axios = require('axios');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;
  try {
    await axios.post(
      EXPO_PUSH_URL,
      { to: expoPushToken, title, body, sound: 'default', data },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };
