const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/database');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchBusinessContext(artistId) {
  const [clients, todayAppts, monthRevenue, upcomingAppts, services, recentPayments] =
    await Promise.all([
      db.query('SELECT COUNT(*) FROM clients WHERE artist_id=$1 AND is_active=TRUE', [artistId]),
      db.query(
        "SELECT COUNT(*) FROM appointments WHERE artist_id=$1 AND scheduled_at::date=CURRENT_DATE AND status NOT IN ('cancelled')",
        [artistId]
      ),
      db.query(
        "SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE artist_id=$1 AND status='completed' AND created_at >= date_trunc('month',NOW())",
        [artistId]
      ),
      db.query(
        `SELECT a.scheduled_at, c.name AS client_name, s.name AS service_name, a.status
         FROM appointments a
         JOIN clients c ON c.id=a.client_id
         LEFT JOIN services s ON s.id=a.service_id
         WHERE a.artist_id=$1 AND a.scheduled_at >= NOW() AND a.status NOT IN ('cancelled','completed')
         ORDER BY a.scheduled_at ASC LIMIT 10`,
        [artistId]
      ),
      db.query('SELECT name, price, duration_minutes FROM services WHERE artist_id=$1 AND is_active=TRUE ORDER BY name', [artistId]),
      db.query(
        `SELECT p.amount, p.payment_method, p.status, c.name AS client_name, p.created_at
         FROM payments p JOIN clients c ON c.id=p.client_id
         WHERE p.artist_id=$1 ORDER BY p.created_at DESC LIMIT 5`,
        [artistId]
      ),
    ]);

  return {
    total_clients: parseInt(clients.rows[0].count),
    today_appointments: parseInt(todayAppts.rows[0].count),
    monthly_revenue: parseFloat(monthRevenue.rows[0].total),
    upcoming_appointments: upcomingAppts.rows,
    services: services.rows,
    recent_payments: recentPayments.rows,
  };
}

exports.chat = async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const context = await fetchBusinessContext(req.artistId);

    const now = new Date();
    const systemPrompt = `You are GlamAI, a helpful business assistant for a professional makeup artist. You have access to their real-time business data and help them manage clients, appointments, and grow their business.

Today's Date: ${now.toDateString()}
Current Time: ${now.toLocaleTimeString()}

=== BUSINESS SNAPSHOT ===
Total Active Clients: ${context.total_clients}
Today's Appointments: ${context.today_appointments}
Revenue This Month: ₹${context.monthly_revenue.toFixed(2)}

=== UPCOMING APPOINTMENTS (next 10) ===
${
  context.upcoming_appointments.length === 0
    ? 'No upcoming appointments.'
    : context.upcoming_appointments
        .map(
          (a) =>
            `• ${new Date(a.scheduled_at).toLocaleString()} — ${a.client_name} for ${a.service_name || 'General'} (${a.status})`
        )
        .join('\n')
}

=== SERVICES OFFERED ===
${
  context.services.length === 0
    ? 'No services configured.'
    : context.services.map((s) => `• ${s.name}: ₹${s.price} (${s.duration_minutes} min)`).join('\n')
}

=== RECENT PAYMENTS ===
${
  context.recent_payments.length === 0
    ? 'No recent payments.'
    : context.recent_payments
        .map(
          (p) =>
            `• ${p.client_name}: ₹${p.amount} via ${p.payment_method} — ${p.status} on ${new Date(p.created_at).toLocaleDateString()}`
        )
        .join('\n')
}

You can answer questions about their business, give makeup tips, suggest pricing strategies, help with client communication, or provide any other professional advice. Be concise, friendly, and actionable. Use ₹ for currency.`;

    const messages = [
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.text || 'Sorry, I could not generate a response.';
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    if (err.status === 401) {
      return res.status(500).json({ error: 'AI service not configured. Please add ANTHROPIC_API_KEY.' });
    }
    res.status(500).json({ error: 'AI assistant is temporarily unavailable.' });
  }
};
