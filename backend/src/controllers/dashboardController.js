const db = require('../config/database');

exports.getStats = async (req, res) => {
  const [clients, appointments, revenue, upcoming] = await Promise.all([
    db.query('SELECT COUNT(*) FROM clients WHERE artist_id=$1 AND is_active=TRUE', [req.artistId]),
    db.query("SELECT COUNT(*) FROM appointments WHERE artist_id=$1 AND scheduled_at::date = CURRENT_DATE AND status NOT IN ('cancelled')", [req.artistId]),
    db.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE artist_id=$1 AND status='completed' AND created_at >= date_trunc('month',NOW())", [req.artistId]),
    db.query(
      `SELECT a.*, c.name AS client_name, s.name AS service_name
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       LEFT JOIN services s ON s.id = a.service_id
       WHERE a.artist_id=$1 AND a.scheduled_at >= NOW() AND a.status NOT IN ('cancelled','completed')
       ORDER BY a.scheduled_at ASC LIMIT 5`,
      [req.artistId]
    ),
  ]);
  res.json({
    total_clients: parseInt(clients.rows[0].count),
    today_appointments: parseInt(appointments.rows[0].count),
    monthly_revenue: parseFloat(revenue.rows[0].total),
    upcoming_appointments: upcoming.rows,
  });
};
