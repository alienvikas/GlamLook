const db = require('../config/database');

exports.getAll = async (req, res) => {
  const result = await db.query(
    'SELECT * FROM services WHERE artist_id=$1 AND is_active=TRUE ORDER BY category, name',
    [req.artistId]
  );
  res.json(result.rows);
};

exports.create = async (req, res) => {
  const { name, description, duration, price, category } = req.body;
  if (!name || !duration || !price) return res.status(400).json({ error: 'name, duration and price are required' });
  const result = await db.query(
    'INSERT INTO services (artist_id, name, description, duration, price, category) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [req.artistId, name, description || null, duration, price, category || null]
  );
  res.status(201).json(result.rows[0]);
};

exports.update = async (req, res) => {
  const { name, description, duration, price, category, is_active } = req.body;
  const fields = [], values = [];
  let i = 1;
  if (name) { fields.push(`name=$${i++}`); values.push(name); }
  if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description); }
  if (duration) { fields.push(`duration=$${i++}`); values.push(duration); }
  if (price) { fields.push(`price=$${i++}`); values.push(price); }
  if (category !== undefined) { fields.push(`category=$${i++}`); values.push(category); }
  if (is_active !== undefined) { fields.push(`is_active=$${i++}`); values.push(is_active); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id, req.artistId);
  const result = await db.query(
    `UPDATE services SET ${fields.join(',')} WHERE id=$${i} AND artist_id=$${i + 1} RETURNING *`,
    values
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Service not found' });
  res.json(result.rows[0]);
};

exports.remove = async (req, res) => {
  await db.query('UPDATE services SET is_active=FALSE WHERE id=$1 AND artist_id=$2', [req.params.id, req.artistId]);
  res.json({ message: 'Service removed' });
};
