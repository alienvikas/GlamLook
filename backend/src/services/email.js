const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) {
    console.error('Email not configured: EMAIL_USER or EMAIL_PASS missing');
    return null;
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass: pass.replace(/\s/g, ''),
    },
    tls: { rejectUnauthorized: false },
    family: 4, // force IPv4 — Render free tier blocks IPv6 SMTP
  });
}

async function sendEmail(to, subject, html) {
  if (!to) return;
  const transporter = getTransporter();
  if (!transporter) return;
  try {
    const info = await transporter.sendMail({
      from: `"GlamBook Beauty" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Email sent to', to, '| messageId:', info.messageId);
  } catch (err) {
    console.error('Email error:', err.code, '-', err.message);
  }
}

function appointmentBookedEmail({ customerName, artistName, serviceName, date, location, price }) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
    <div style="background:#0B3D38;padding:28px 32px;text-align:center;">
      <h1 style="color:#C9A84C;margin:0;font-size:26px;letter-spacing:1px;">GlamBook Beauty</h1>
      <p style="color:#a8d5d0;margin:6px 0 0;font-size:13px;">Appointment Confirmation</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:16px;color:#333;">Hi <strong>${customerName}</strong>,</p>
      <p style="color:#555;font-size:15px;">Your appointment has been booked! Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:10px 0;color:#888;font-size:14px;width:40%;">Artist</td>
          <td style="padding:10px 0;color:#222;font-weight:600;font-size:14px;">${artistName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:10px 0;color:#888;font-size:14px;">Service</td>
          <td style="padding:10px 0;color:#222;font-weight:600;font-size:14px;">${serviceName}</td>
        </tr>
        <tr style="border-bottom:1px solid #f0f0f0;">
          <td style="padding:10px 0;color:#888;font-size:14px;">Date &amp; Time</td>
          <td style="padding:10px 0;color:#222;font-weight:600;font-size:14px;">${date}</td>
        </tr>
        ${location ? `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:10px 0;color:#888;font-size:14px;">Location</td><td style="padding:10px 0;color:#222;font-weight:600;font-size:14px;">${location}</td></tr>` : ''}
        ${price ? `<tr><td style="padding:10px 0;color:#888;font-size:14px;">Price</td><td style="padding:10px 0;color:#0B3D38;font-weight:700;font-size:16px;">₹${price}</td></tr>` : ''}
      </table>
      <p style="color:#555;font-size:14px;">We look forward to seeing you! If you need to reschedule, please contact us.</p>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #e8e8e8;">
      <p style="color:#aaa;font-size:12px;margin:0;">GlamBook Beauty · Powered by GlamBook</p>
    </div>
  </div>`;
}

function appointmentStatusEmail({ customerName, artistName, serviceName, date, status }) {
  const statusConfig = {
    confirmed: { color: '#27ae60', icon: '✅', title: 'Appointment Confirmed', msg: 'Your appointment has been confirmed by your artist.' },
    cancelled:  { color: '#e74c3c', icon: '❌', title: 'Appointment Cancelled', msg: 'Unfortunately your appointment has been cancelled. Please contact us to rebook.' },
    completed:  { color: '#0B3D38', icon: '⭐', title: 'Appointment Completed', msg: 'Thank you for visiting! We hope you loved your look.' },
  };
  const cfg = statusConfig[status] || { color: '#555', icon: '📅', title: 'Appointment Update', msg: `Your appointment status has been updated to: ${status}` };
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e8e8;">
    <div style="background:#0B3D38;padding:28px 32px;text-align:center;">
      <h1 style="color:#C9A84C;margin:0;font-size:26px;letter-spacing:1px;">GlamBook Beauty</h1>
    </div>
    <div style="padding:28px 32px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">${cfg.icon}</div>
      <h2 style="color:${cfg.color};margin:0 0 8px;">${cfg.title}</h2>
      <p style="color:#555;font-size:15px;">${cfg.msg}</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:20px 0;text-align:left;">
        <p style="margin:4px 0;font-size:14px;color:#555;">👤 <strong>${customerName}</strong></p>
        <p style="margin:4px 0;font-size:14px;color:#555;">💄 ${serviceName} with ${artistName}</p>
        <p style="margin:4px 0;font-size:14px;color:#555;">📅 ${date}</p>
      </div>
    </div>
    <div style="background:#f9f9f9;padding:16px 32px;text-align:center;border-top:1px solid #e8e8e8;">
      <p style="color:#aaa;font-size:12px;margin:0;">GlamBook Beauty · Powered by GlamBook</p>
    </div>
  </div>`;
}

module.exports = { sendEmail, appointmentBookedEmail, appointmentStatusEmail };
