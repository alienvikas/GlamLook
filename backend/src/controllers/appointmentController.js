const db = require('../config/database');
const { sendPushNotification } = require('../services/notifications');
const { sendWhatsApp } = require('../services/whatsapp');
const { sendEmail, appointmentBookedEmail, appointmentStatusEmail } = require('../services/email');

exports.getAll = async (req, res) => {
  const { status, from, to, client_id } = req.query;
  let query = `
    SELECT a.*, c.name AS client_name, c.phone AS client_phone,
           s.name AS service_name, s.price AS service_price
    FROM appointments a
    JOIN clients c ON c.id = a.client_id
    LEFT JOIN services s ON s.id = a.service_id
    WHERE a.artist_id=$1`;
  const params = [req.artistId];
  let i = 2;
  if (status) { query += ` AND a.status=$${i++}`; params.push(status); }
  if (from) { query += ` AND a.scheduled_at >= $${i++}`; params.push(from); }
  if (to) { query += ` AND a.scheduled_at <= $${i++}`; params.push(to); }
  if (client_id) { query += ` AND a.client_id=$${i++}`; params.push(client_id); }
  query += ' ORDER BY a.scheduled_at ASC';
  const result = await db.query(query, params);
  res.json(result.rows);
};

exports.getOne = async (req, res) => {
  const result = await db.query(
    `SELECT a.*, c.name AS client_name, c.phone AS client_phone, c.email AS client_email,
            s.name AS service_name, s.price AS service_price, s.duration AS service_duration,
            p.amount AS paid_amount, p.method AS payment_method, p.status AS payment_status
     FROM appointments a
     JOIN clients c ON c.id = a.client_id
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN payments p ON p.appointment_id = a.id
     WHERE a.id=$1 AND a.artist_id=$2`,
    [req.params.id, req.artistId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
  res.json(result.rows[0]);
};

exports.create = async (req, res) => {
  const { client_id, service_id, scheduled_at, duration, location, notes, total_amount } = req.body;
  if (!client_id || !scheduled_at || !duration) {
    return res.status(400).json({ error: 'client_id, scheduled_at and duration are required' });
  }
  const result = await db.query(
    `INSERT INTO appointments (artist_id, client_id, service_id, scheduled_at, duration, location, notes, total_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [req.artistId, client_id, service_id || null, scheduled_at, duration, location || null, notes || null, total_amount || null]
  );
  const appointment = result.rows[0];
  res.status(201).json(appointment);

  // Notifications (non-blocking)
  try {
    const [artistRow, clientRow, serviceRow] = await Promise.all([
      db.query('SELECT name, expo_push_token FROM artists WHERE id=$1', [req.artistId]),
      db.query('SELECT name, email, phone FROM clients WHERE id=$1', [client_id]),
      service_id ? db.query('SELECT name, price FROM services WHERE id=$1', [service_id]) : Promise.resolve({ rows: [] }),
    ]);
    const artistName = artistRow.rows[0]?.name || 'Your Artist';
    const token = artistRow.rows[0]?.expo_push_token;
    const client = clientRow.rows[0] || {};
    const clientName = client.name || 'Client';
    const service = serviceRow.rows[0] || {};
    const serviceName = service.name || 'Appointment';
    const dateStr = new Date(scheduled_at).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    // Push to artist
    sendPushNotification(token, '📅 New Appointment Booked', `${clientName} — ${serviceName} on ${dateStr}`, { appointmentId: appointment.id }).catch(() => {});

    // WhatsApp to client
    if (client.phone) {
      const waMsg = `📅 *Appointment Booked - GlamBook*\n\nHi ${clientName}!\nYour appointment has been booked.\n\n💄 *Service:* ${serviceName}\n👩‍🎨 *Artist:* ${artistName}\n📅 *Date & Time:* ${dateStr}${location ? '\n📍 *Location:* ' + location : ''}${service.price ? '\n💰 *Price:* ₹' + service.price : ''}\n\nSee you soon! ✨`;
      sendWhatsApp(client.phone, waMsg).catch(() => {});
    }

    // Email to client
    if (client.email) {
      const html = appointmentBookedEmail({ customerName: clientName, artistName, serviceName, date: dateStr, location, price: service.price });
      sendEmail(client.email, `📅 Appointment Confirmed — ${serviceName} with ${artistName}`, html).catch(() => {});
    }
  } catch (err) {
    console.error('Notification send error:', err.message);
  }
};

exports.update = async (req, res) => {
  const { service_id, scheduled_at, duration, location, status, notes, total_amount } = req.body;
  const fields = [], values = [];
  let i = 1;
  if (service_id !== undefined) { fields.push(`service_id=$${i++}`); values.push(service_id); }
  if (scheduled_at) { fields.push(`scheduled_at=$${i++}`); values.push(scheduled_at); }
  if (duration) { fields.push(`duration=$${i++}`); values.push(duration); }
  if (location !== undefined) { fields.push(`location=$${i++}`); values.push(location); }
  if (status) { fields.push(`status=$${i++}`); values.push(status); }
  if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(notes); }
  if (total_amount !== undefined) { fields.push(`total_amount=$${i++}`); values.push(total_amount); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id, req.artistId);
  const result = await db.query(
    `UPDATE appointments SET ${fields.join(',')} WHERE id=$${i} AND artist_id=$${i + 1} RETURNING *`,
    values
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
  const updated = result.rows[0];
  res.json(updated);

  // Notify client on status change (non-blocking)
  if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) {
    try {
      const [clientRow, serviceRow, artistRow] = await Promise.all([
        db.query('SELECT name, email, phone FROM clients WHERE id=$1', [updated.client_id]),
        updated.service_id ? db.query('SELECT name FROM services WHERE id=$1', [updated.service_id]) : Promise.resolve({ rows: [] }),
        db.query('SELECT name FROM artists WHERE id=$1', [req.artistId]),
      ]);
      const client = clientRow.rows[0] || {};
      const clientName = client.name || 'Client';
      const serviceName = serviceRow.rows[0]?.name || 'Appointment';
      const artistName = artistRow.rows[0]?.name || 'Your Artist';
      const dateStr = new Date(updated.scheduled_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      });
      const statusLabel = { confirmed: 'Confirmed ✅', cancelled: 'Cancelled ❌', completed: 'Completed ⭐' }[status];

      if (client.phone) {
        const waMsg = `📅 *Appointment ${statusLabel} - GlamBook*\n\nHi ${clientName}!\n\n💄 *Service:* ${serviceName}\n👩‍🎨 *Artist:* ${artistName}\n📅 *Date & Time:* ${dateStr}\n\n${status === 'confirmed' ? 'Your appointment is confirmed. See you soon! ✨' : status === 'cancelled' ? 'Your appointment has been cancelled. Please contact us to rebook.' : 'Thank you for visiting! We hope you loved your look. 💄'}`;
        sendWhatsApp(client.phone, waMsg).catch(() => {});
      }
      if (client.email) {
        const html = appointmentStatusEmail({ customerName: clientName, artistName, serviceName, date: dateStr, status });
        sendEmail(client.email, `Appointment ${statusLabel} — ${serviceName}`, html).catch(() => {});
      }
    } catch (err) {
      console.error('Status notification error:', err.message);
    }
  }
};

exports.remove = async (req, res) => {
  await db.query(
    "UPDATE appointments SET status='cancelled' WHERE id=$1 AND artist_id=$2",
    [req.params.id, req.artistId]
  );
  res.json({ message: 'Appointment cancelled' });
};

exports.getToday = async (req, res) => {
  const result = await db.query(
    `SELECT a.*, c.name AS client_name, c.phone AS client_phone, s.name AS service_name
     FROM appointments a
     JOIN clients c ON c.id = a.client_id
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.artist_id=$1
       AND a.scheduled_at::date = CURRENT_DATE
       AND a.status NOT IN ('cancelled')
     ORDER BY a.scheduled_at ASC`,
    [req.artistId]
  );
  res.json(result.rows);
};
