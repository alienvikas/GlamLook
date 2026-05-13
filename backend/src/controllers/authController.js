const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

  const existing = await db.query('SELECT id FROM artists WHERE email=$1', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    'INSERT INTO artists (name, email, password_hash, phone) VALUES ($1,$2,$3,$4) RETURNING id, name, email, phone, created_at',
    [name, email, hash, phone || null]
  );
  const artist = result.rows[0];
  res.status(201).json({ token: signToken(artist.id), artist });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const result = await db.query('SELECT * FROM artists WHERE email=$1 AND is_active=TRUE', [email]);
  const artist = result.rows[0];
  if (!artist) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, artist.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const { password_hash, ...safeArtist } = artist;
  res.json({ token: signToken(artist.id), artist: safeArtist });
};

exports.getMe = async (req, res) => {
  const result = await db.query(
    'SELECT id, name, email, phone, bio, specialties, avatar_url, instagram, facebook, website, created_at FROM artists WHERE id=$1',
    [req.artistId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Artist not found' });
  res.json(result.rows[0]);
};

exports.updateProfile = async (req, res) => {
  const { name, phone, bio, specialties, instagram, facebook, website } = req.body;
  // req.file.path is the full Cloudinary secure URL
  const avatar_url = req.file ? req.file.path : undefined;

  const fields = [];
  const values = [];
  let i = 1;

  if (name) { fields.push(`name=$${i++}`); values.push(name); }
  if (phone !== undefined) { fields.push(`phone=$${i++}`); values.push(phone); }
  if (bio !== undefined) { fields.push(`bio=$${i++}`); values.push(bio); }
  if (specialties) { fields.push(`specialties=$${i++}`); values.push(specialties); }
  if (instagram !== undefined) { fields.push(`instagram=$${i++}`); values.push(instagram); }
  if (facebook !== undefined) { fields.push(`facebook=$${i++}`); values.push(facebook); }
  if (website !== undefined) { fields.push(`website=$${i++}`); values.push(website); }
  if (avatar_url) { fields.push(`avatar_url=$${i++}`); values.push(avatar_url); }

  if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

  values.push(req.artistId);
  const result = await db.query(
    `UPDATE artists SET ${fields.join(',')} WHERE id=$${i} RETURNING id, name, email, phone, bio, specialties, avatar_url, instagram, facebook, website`,
    values
  );
  res.json(result.rows[0]);
};

exports.savePushToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  await db.query('UPDATE artists SET expo_push_token=$1 WHERE id=$2', [token, req.artistId]);
  res.json({ message: 'Push token saved' });
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });

  const result = await db.query('SELECT password_hash FROM artists WHERE id=$1', [req.artistId]);
  const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE artists SET password_hash=$1 WHERE id=$2', [hash, req.artistId]);
  res.json({ message: 'Password updated successfully' });
};
