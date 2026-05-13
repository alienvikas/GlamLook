require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const appointmentRoutes = require('./routes/appointments');
const serviceRoutes = require('./routes/services');
const portfolioRoutes = require('./routes/portfolio');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');
const customerAuthRoutes = require('./routes/customerAuth');
const customerAppointmentRoutes = require('./routes/customerAppointments');

const app = express();

// Add customer_photo_url column if not yet present
const db = require('./config/database');
db.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS customer_photo_url TEXT`).catch(() => {});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/customer/auth', customerAuthRoutes);
app.use('/api/customer', customerAppointmentRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
