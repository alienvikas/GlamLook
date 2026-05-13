const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendPushNotification(expoPushToken, title, body, data = {}) {
  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, title, body, sound: 'default', data }),
    });
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

module.exports = { sendPushNotification };
