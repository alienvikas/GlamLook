const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM clients WHERE artist_id=$1 AND is_active=TRUE';
  const params = [req.artistId];
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`;
  }
  query += ` ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);
  const result = await db.query(query, params);
  res.json(result.rows);
};

exports.getOne = async (req, res) => {
  const result = await db.query(
    'SELECT * FROM clients WHERE id=$1 AND artist_id=$2 AND is_active=TRUE',
    [req.params.id, req.artistId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Client not found' });
  res.json(result.rows[0]);
};

exports.create = async (req, res) => {
  const { name, email, phone, notes, skin_type, allergies } = req.body;
  if (!name) return res.status(400).json({ error: 'Client name is required' });
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : null;
  const result = await db.query(
    'INSERT INTO clients (artist_id, name, email, phone, notes, skin_type, allergies, avatar_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [req.artistId, name, email || null, phone || null, notes || null, skin_type || null, allergies || null, avatar_url]
  );
  res.status(201).json(result.rows[0]);
};

exports.update = async (req, res) => {
  const { name, email, phone, notes, skin_type, allergies } = req.body;
  const avatar_url = req.file ? `/uploads/${req.file.filename}` : undefined;
  const fields = [], values = [];
  let i = 1;
  if (name) { fields.push(`name=$${i++}`); values.push(name); }
  if (email !== undefined) { fields.push(`email=$${i++}`); values.push(email); }
  if (phone !== undefined) { fields.push(`phone=$${i++}`); values.push(phone); }
  if (notes !== undefined) { fields.push(`notes=$${i++}`); values.push(notes); }
  if (skin_type !== undefined) { fields.push(`skin_type=$${i++}`); values.push(skin_type); }
  if (allergies !== undefined) { fields.push(`allergies=$${i++}`); values.push(allergies); }
  if (avatar_url) { fields.push(`avatar_url=$${i++}`); values.push(avatar_url); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id, req.artistId);
  const result = await db.query(
    `UPDATE clients SET ${fields.join(',')} WHERE id=$${i} AND artist_id=$${i + 1} RETURNING *`,
    values
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Client not found' });
  res.json(result.rows[0]);
};

exports.remove = async (req, res) => {
  await db.query('UPDATE clients SET is_active=FALSE WHERE id=$1 AND artist_id=$2', [req.params.id, req.artistId]);
  res.json({ message: 'Client removed' });
};

exports.getHistory = async (req, res) => {
  const result = await db.query(
    `SELECT a.*, s.name AS service_name, p.amount AS paid_amount, p.status AS payment_status
     FROM appointments a
     LEFT JOIN services s ON s.id = a.service_id
     LEFT JOIN payments p ON p.appointment_id = a.id
     WHERE a.client_id=$1 AND a.artist_id=$2
     ORDER BY a.scheduled_at DESC`,
    [req.params.id, req.artistId]
  );
  res.json(result.rows);
};
