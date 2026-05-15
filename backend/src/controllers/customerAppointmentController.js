const db = require('../config/database');
const { sendWhatsApp } = require('../services/whatsapp');
const { sendPushNotification } = require('../services/notifications');
const { sendEmail, appointmentBookedEmail } = require('../services/email');

exports.getArtists = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.name, a.bio, a.avatar_url, a.specialties, a.instagram, a.facebook, a.website,
              COALESCE(ROUND(AVG(f.rating)::numeric, 1), 0)::float AS avg_rating,
              COUNT(DISTINCT f.id)::int AS total_reviews,
              COUNT(DISTINCT s.id)::int AS service_count
       FROM artists a
       LEFT JOIN feedback f ON f.artist_id = a.id
       LEFT JOIN services s ON s.artist_id = a.id AND s.is_active IS NOT FALSE
       WHERE a.is_active = TRUE
       GROUP BY a.id
       ORDER BY a.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getArtistPortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT id, title, description, image_url, category, created_at
       FROM portfolio
       WHERE artist_id=$1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { artist_id } = req.query;
    const params = [];
    let where = 'WHERE s.is_active IS NOT FALSE';
    if (artist_id) {
      params.push(artist_id);
      where += ` AND s.artist_id=$${params.length}`;
    }
    const result = await db.query(
      `SELECT s.id, s.name, s.price, s.duration AS duration_minutes, s.description,
              a.id AS artist_id, a.name AS artist_name, a.avatar_url AS artist_avatar
       FROM services s
       JOIN artists a ON a.id = s.artist_id
       ${where}
       ORDER BY s.name`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.book = async (req, res) => {
  const { service_id, scheduled_at, duration, location, notes, artist_id } = req.body;
  if (!scheduled_at || !duration) return res.status(400).json({ error: 'scheduled_at and duration are required' });
  if (!artist_id) return res.status(400).json({ error: 'artist_id is required' });

  // Verify artist exists
  const artistRow = await db.query(
    'SELECT id, name, email, phone, expo_push_token FROM artists WHERE id=$1 AND is_active=TRUE',
    [artist_id]
  );
  const artist = artistRow.rows[0];
  if (!artist) return res.status(404).json({ error: 'Artist not found' });

  // Verify service belongs to this artist (if provided)
  if (service_id) {
    const svcCheck = await db.query(
      'SELECT id FROM services WHERE id=$1 AND artist_id=$2',
      [service_id, artist_id]
    );
    if (!svcCheck.rows.length) return res.status(400).json({ error: 'Service does not belong to this artist' });
  }

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
    `INSERT INTO appointments (artist_id, client_id, customer_id, service_id, scheduled_at, duration, location, notes, total_amount, booked_by, customer_photo_url, is_seen_by_artist)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'customer',$10,FALSE) RETURNING *`,
    [artist.id, clientId, customer.id, service_id || null, scheduled_at, duration, location || null, notes || null, serviceInfo?.price || null, customerPhotoUrl]
  );
  const appointment = result.rows[0];
  res.status(201).json(appointment);

  // Notifications to artist + confirmation to customer (all non-blocking)
  const dateStr = new Date(scheduled_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const serviceName = serviceInfo?.name || 'Appointment';

  console.log(`[book] Sending notifications — artist: ${artist.name} (${artist.email}, ${artist.phone}), customer: ${customer.name} (${customer.email})`);

  // WhatsApp to artist
  if (artist.phone) {
    const waMsg = `📅 *New Booking - GlamBook*\n\nCustomer: ${customer.name}\nPhone: ${customer.phone || 'N/A'}\nService: ${serviceName}\nDate & Time: ${dateStr}${location ? '\nLocation: ' + location : ''}${notes ? '\nNotes: ' + notes : ''}`;
    sendWhatsApp(artist.phone, waMsg).catch((e) => console.error('[book] WhatsApp error:', e.message));
  } else {
    console.warn('[book] Artist has no phone — WhatsApp skipped');
  }

  // Push notification to artist
  sendPushNotification(artist.expo_push_token, '📅 New Customer Booking', `${customer.name} — ${serviceName} on ${dateStr}`, { appointmentId: appointment.id })
    .catch((e) => console.error('[book] Push error:', e.message));

  // Email to artist about new booking
  if (artist.email) {
    const artistEmailHtml = appointmentBookedEmail({
      customerName: customer.name,
      artistName: artist.name,
      serviceName,
      date: dateStr,
      location: location || null,
      price: serviceInfo?.price || null,
    }).replace('Hi <strong>', 'New booking from <strong>').replace('Your appointment has been booked!', 'A customer has booked an appointment with you.');
    sendEmail(artist.email, `📅 New Booking: ${customer.name} — ${serviceName}`, artistEmailHtml)
      .catch((e) => console.error('[book] Artist email error:', e.message));
  } else {
    console.warn('[book] Artist has no email — email skipped');
  }

  // Confirmation email to customer
  if (customer.email) {
    sendEmail(customer.email, `✅ Booking Confirmed — ${serviceName} with ${artist.name}`, appointmentBookedEmail({
      customerName: customer.name,
      artistName: artist.name,
      serviceName,
      date: dateStr,
      location: location || null,
      price: serviceInfo?.price || null,
    })).catch((e) => console.error('[book] Customer email error:', e.message));
  } else {
    console.warn('[book] Customer has no email — confirmation skipped');
  }
};

exports.getMyAppointments = async (req, res) => {
  const result = await db.query(
    `SELECT a.*, s.name AS service_name, s.price AS service_price, a.customer_photo_url,
            ar.name AS artist_name, ar.avatar_url AS artist_avatar
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN artists ar ON ar.id = a.artist_id
     WHERE a.customer_id=$1
     ORDER BY a.scheduled_at DESC`,
    [req.customerId]
  );
  res.json(result.rows);
};

exports.submitFeedback = async (req, res) => {
  const { appointment_id, rating, comment } = req.body;
  if (!appointment_id || !rating) return res.status(400).json({ error: 'appointment_id and rating are required' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  // Verify this appointment belongs to the customer and is completed
  const appt = await db.query(
    'SELECT id, artist_id, status FROM appointments WHERE id=$1 AND customer_id=$2',
    [appointment_id, req.customerId]
  );
  if (!appt.rows.length) return res.status(404).json({ error: 'Appointment not found' });
  if (appt.rows[0].status !== 'completed') return res.status(400).json({ error: 'Can only review completed appointments' });

  const artist_id = appt.rows[0].artist_id;
  try {
    const result = await db.query(
      `INSERT INTO feedback (customer_id, artist_id, appointment_id, rating, comment)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (customer_id, appointment_id) DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment
       RETURNING *`,
      [req.customerId, artist_id, appointment_id, rating, comment || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyFeedback = async (req, res) => {
  const result = await db.query(
    'SELECT appointment_id FROM feedback WHERE customer_id=$1',
    [req.customerId]
  );
  res.json(result.rows.map((r) => r.appointment_id));
};
