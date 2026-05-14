const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

function signToken(id) {
  return jwt.sign({ id, role: 'customer' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

exports.register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });

  const existing = await db.query('SELECT id FROM customers WHERE email=$1', [email]);
  if (existing.rows.length) return res.status(409).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query(
    'INSERT INTO customers (name, email, password_hash, phone) VALUES ($1,$2,$3,$4) RETURNING id, name, email, phone, created_at',
    [name, email, hash, phone || null]
  );
  const customer = result.rows[0];
  res.status(201).json({ token: signToken(customer.id), customer });

  // Auto-add customer as a client for every artist (non-blocking)
  db.query('SELECT id FROM artists').then(async (artistRes) => {
    for (const artist of artistRes.rows) {
      const exists = await db.query(
        'SELECT id FROM clients WHERE artist_id=$1 AND email=$2',
        [artist.id, customer.email]
      );
      if (!exists.rows.length) {
        await db.query(
          'INSERT INTO clients (artist_id, name, email, phone) VALUES ($1,$2,$3,$4)',
          [artist.id, customer.name, customer.email, customer.phone || null]
        );
      }
    }
  }).catch((err) => console.error('Auto client create error:', err.message));
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const result = await db.query('SELECT * FROM customers WHERE email=$1 AND is_active=TRUE', [email]);
  const customer = result.rows[0];
  if (!customer) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const { password_hash, ...safe } = customer;
  res.json({ token: signToken(customer.id), customer: safe });
};

exports.getMe = async (req, res) => {
  const result = await db.query(
    'SELECT id, name, email, phone, created_at FROM customers WHERE id=$1',
    [req.customerId]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
  res.json(result.rows[0]);
};
