const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { status, from, to } = req.query;
  let query = `
    SELECT p.*, a.scheduled_at, c.name AS client_name, s.name AS service_name
    FROM payments p
    JOIN appointments a ON a.id = p.appointment_id
    JOIN clients c ON c.id = a.client_id
    LEFT JOIN services s ON s.id = a.service_id
    WHERE p.artist_id=$1`;
  const params = [req.artistId];
  let i = 2;
  if (status) { query += ` AND p.status=$${i++}`; params.push(status); }
  if (from) { query += ` AND p.created_at >= $${i++}`; params.push(from); }
  if (to) { query += ` AND p.created_at <= $${i++}`; params.push(to); }
  query += ' ORDER BY p.created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
};

exports.create = async (req, res) => {
  const { appointment_id, amount, method, notes } = req.body;
  if (!appointment_id || !amount) return res.status(400).json({ error: 'appointment_id and amount are required' });
  const appt = await db.query('SELECT id FROM appointments WHERE id=$1 AND artist_id=$2', [appointment_id, req.artistId]);
  if (!appt.rows.length) return res.status(404).json({ error: 'Appointment not found' });
  const result = await db.query(
    "INSERT INTO payments (appointment_id, artist_id, amount, method, status, paid_at, notes) VALUES ($1,$2,$3,$4,'completed',NOW(),$5) RETURNING *",
    [appointment_id, req.artistId, amount, method || 'cash', notes || null]
  );
  await db.query("UPDATE appointments SET status='completed' WHERE id=$1", [appointment_id]);
  res.status(201).json(result.rows[0]);
};

exports.getSummary = async (req, res) => {
  const result = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE status='completed') AS total_payments,
       COALESCE(SUM(amount) FILTER (WHERE status='completed'), 0) AS total_earned,
       COALESCE(SUM(amount) FILTER (WHERE status='completed' AND created_at >= date_trunc('month', NOW())), 0) AS this_month,
       COALESCE(SUM(amount) FILTER (WHERE status='completed' AND created_at >= date_trunc('week', NOW())), 0) AS this_week
     FROM payments WHERE artist_id=$1`,
    [req.artistId]
  );
  res.json(result.rows[0]);
};
