const db = require('../config/database');

exports.getAll = async (req, res) => {
  const { public_only } = req.query;
  let query = 'SELECT p.*, c.name AS client_name FROM portfolio_items p LEFT JOIN clients c ON c.id = p.client_id WHERE p.artist_id=$1';
  const params = [req.artistId];
  if (public_only === 'true') { query += ' AND p.is_public=TRUE'; }
  query += ' ORDER BY p.created_at DESC';
  const result = await db.query(query, params);
  res.json(result.rows);
};

exports.getOne = async (req, res) => {
  const result = await db.query(
    'SELECT p.*, c.name AS client_name FROM portfolio_items p LEFT JOIN clients c ON c.id = p.client_id WHERE p.id=$1 AND p.artist_id=$2',
    [req.params.id, req.artistId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Portfolio item not found' });
  res.json(result.rows[0]);
};

exports.create = async (req, res) => {
  const { client_id, title, description, tags, is_public } = req.body;
  if (!req.files || !req.files.after) return res.status(400).json({ error: 'After photo is required' });
  const after_url = `/uploads/${req.files.after[0].filename}`;
  const before_url = req.files.before ? `/uploads/${req.files.before[0].filename}` : null;
  const tagsArr = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [];
  const result = await db.query(
    'INSERT INTO portfolio_items (artist_id, client_id, title, description, before_url, after_url, tags, is_public) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
    [req.artistId, client_id || null, title || null, description || null, before_url, after_url, tagsArr, is_public !== 'false']
  );
  res.status(201).json(result.rows[0]);
};

exports.update = async (req, res) => {
  const { title, description, tags, is_public } = req.body;
  const fields = [], values = [];
  let i = 1;
  if (title !== undefined) { fields.push(`title=$${i++}`); values.push(title); }
  if (description !== undefined) { fields.push(`description=$${i++}`); values.push(description); }
  if (tags !== undefined) { fields.push(`tags=$${i++}`); values.push(Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())); }
  if (is_public !== undefined) { fields.push(`is_public=$${i++}`); values.push(is_public); }
  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
  values.push(req.params.id, req.artistId);
  const result = await db.query(
    `UPDATE portfolio_items SET ${fields.join(',')} WHERE id=$${i} AND artist_id=$${i + 1} RETURNING *`,
    values
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Portfolio item not found' });
  res.json(result.rows[0]);
};

exports.remove = async (req, res) => {
  await db.query('DELETE FROM portfolio_items WHERE id=$1 AND artist_id=$2', [req.params.id, req.artistId]);
  res.json({ message: 'Portfolio item deleted' });
};
