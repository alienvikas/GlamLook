const db = require('../config/database');
const { sendWhatsApp } = require('../services/whatsapp');
const { sendPushNotification } = require('../services/notifications');

exports.book = async (req, res) => {
  const { service_id, scheduled_at, duration, location, notes } = req.body;
  if (!scheduled_at || !duration) return res.status(400).json({ error: 'scheduled_at and duration are required' });

  // Get the artist (single-tenant: first/only artist)
  const artistRow = await db.query(
    'SELECT id, name, phone, expo_push_token FROM artists WHERE is_active=TRUE LIMIT 1'
  );
  if (!artistRow.rows.length) return res.status(404).json({ error: 'No artist found' });
  const artist = artistRow.rows[0];

  // Get customer info
  const custRow = await db.query('SELECT id, name, email, phone FROM customers WHERE id=$1', [req.customerId]);
  const customer = custRow.rows[0];

  // Upsert a client record for this customer (link by email)
  let clientId;
  const existingClient = await db.query('SELECT id FROM clients WHERE artist_id=$1 AND email=$2', [artist.id, customer.email]);
  if (existingClient.rows.length) {
    clientId = existingClient.rows[0].id;
  } else {
    const newClient = await db.query(
      'INSERT INTO clients (artist_id, name, email, phone) VALUES ($1,$2,$3,$4) RETURNING id',
      [artist.id, customer.name, customer.email, customer.phone]
    );
    clientId = newClient.rows[0].id;
  }

  // Get service info
  let serviceInfo = null;
  if (service_id) {
    const svcRow = await db.query('SELECT name, price, duration AS duration_minutes FROM services WHERE id=$1', [service_id]);
    serviceInfo = svcRow.rows[0] || null;
  }

  const customerPhotoUrl = req.file ? req.file.path : null;

  const result = await db.query(
    `INSERT INTO appointments (artist_id, client_id, customer_id, service_id, scheduled_at, duration, location, notes, total_amount, booked_by, customer_photo_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'customer',$10) RETURNING *`,
    [artist.id, clientId, customer.id, service_id || null, scheduled_at, duration, location || null, notes || null, serviceInfo?.price || null, customerPhotoUrl]
  );
  const appointment = result.rows[0];
  res.status(201).json(appointment);

  // WhatsApp + Push notification to artist (non-blocking)
  const date = new Date(scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const serviceName = serviceInfo?.name || 'Appointment';
  const waMsg = `📅 *New Booking - GlamBook*\n\nCustomer: ${customer.name}\nPhone: ${customer.phone || 'N/A'}\nService: ${serviceName}\nDate & Time: ${date}${location ? '\nLocation: ' + location : ''}${notes ? '\nNotes: ' + notes : ''}`;

  sendWhatsApp(artist.phone, waMsg).catch(() => {});
  sendPushNotification(artist.expo_push_token, '📅 New Customer Booking', `${customer.name} — ${serviceName} on ${date}`, { appointmentId: appointment.id }).catch(() => {});
};

exports.getMyAppointments = async (req, res) => {
  const result = await db.query(
    `SELECT a.*, s.name AS service_name, s.price AS service_price, a.customer_photo_url
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     WHERE a.customer_id=$1
     ORDER BY a.scheduled_at DESC`,
    [req.customerId]
  );
  res.json(result.rows);
};

exports.getServices = async (req, res) => {
  const artistRow = await db.query('SELECT id FROM artists WHERE is_active=TRUE LIMIT 1');
  if (!artistRow.rows.length) return res.json([]);
  const result = await db.query(
    'SELECT id, name, price, duration AS duration_minutes, description FROM services WHERE artist_id=$1 AND is_active=TRUE ORDER BY name',
    [artistRow.rows[0].id]
  );
  res.json(result.rows);
};
