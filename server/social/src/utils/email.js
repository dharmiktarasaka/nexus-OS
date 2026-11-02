import nodemailer from 'nodemailer';
import axios from 'axios';

// Helper to create a transporter dynamically when needed
function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  // Handle SMTP servers with dynamic secure option and robust TLS settings
  const secure = process.env.EMAIL_SECURE !== undefined
    ? process.env.EMAIL_SECURE === 'true'
    : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    },
    connectionTimeout: 15000, // 15 seconds connection timeout
    greetingTimeout: 15000,   // 15 seconds greeting timeout
    socketTimeout: 15000      // 15 seconds socket activity timeout
  });
}

/**
 * Sends a notification email to the administrator when any user logs in.
 * Operates asynchronously and catches all exceptions to avoid disrupting the login process.
 * 
 * @param {Object} user The user object containing name, email, and role
 * @param {string} ip The IP address of the client making the login request
 */
export const sendLoginNotification = async (user, ip = 'Unknown') => {
  const recipient = process.env.NOTIFICATION_EMAIL || 'info@tarasaka.com';
  const from = process.env.EMAIL_FROM || `"Mediamation Alerts" <${process.env.EMAIL_USER || 'no-reply@mediamation.com'}>`;

  // Log locally
  console.log(`[Email Utility] Preparing login notification for: ${user.email} -> ${recipient}`);

  const roleDisplay = user.role ? user.role.toUpperCase() : 'USER';
  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>User Login Alert</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #0b0f19;
      color: #f3f4f6;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0f19;
      padding: 40px 0;
    }
    .container {
      max-width: 550px;
      margin: 0 auto;
      background-color: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 35px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #c7d2fe;
      font-size: 13px;
      margin: 8px 0 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 35px 30px;
    }
    .greeting {
      font-size: 15px;
      line-height: 1.6;
      color: #d1d5db;
      margin: 0 0 20px 0;
    }
    .table-container {
      background-color: #1f2937;
      border: 1px solid #374151;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 25px;
    }
    .data-row {
      display: table;
      width: 100%;
      padding: 10px 0;
      border-bottom: 1px solid #2d3748;
    }
    .data-row:last-child {
      border-bottom: none;
    }
    .label {
      display: table-cell;
      font-weight: 600;
      color: #9ca3af;
      font-size: 13px;
      width: 35%;
    }
    .value {
      display: table-cell;
      color: #ffffff;
      font-size: 13px;
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .badge-admin {
      background-color: rgba(239, 68, 68, 0.2);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .badge-user {
      background-color: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .footer {
      padding: 25px 30px;
      background-color: #0b0f19;
      border-top: 1px solid #1f2937;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      line-height: 1.6;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>User Login Alert</h1>
        <p>Mediamation Administrative Portal</p>
      </div>
      <div class="content">
        <p class="greeting">Hello Admin,</p>
        <p class="greeting">A user has logged into your application. Details are listed below:</p>
        
        <div class="table-container">
          <div class="data-row">
            <span class="label">Name</span>
            <span class="value" style="font-weight: 600; color: #e5e7eb;">${user.name}</span>
          </div>
          <div class="data-row">
            <span class="label">Email</span>
            <span class="value">${user.email}</span>
          </div>
          <div class="data-row">
            <span class="label">Role</span>
            <span class="value">
              <span class="badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}">${roleDisplay}</span>
            </span>
          </div>
          <div class="data-row">
            <span class="label">Timestamp</span>
            <span class="value">${dateStr}</span>
          </div>
          <div class="data-row">
            <span class="label">IP Address</span>
            <span class="value" style="font-family: monospace; color: #a5b4fc;">${ip}</span>
          </div>
        </div>
      </div>
      <div class="footer">
        <p>This alert was generated automatically by Mediamation security monitor.</p>
        <p>&copy; ${new Date().getFullYear()} Mediamation &bull; Tarasaka Digital Solutions</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Check if Webhook URL is set (Option A: For Render Free Tier)
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    console.log('[Email Utility] Using Webhook HTTP API for email transmission (Render Free Tier compatible)');
    try {
      const response = await axios.post(webhookUrl, {
        to: recipient,
        subject: `[Mediamation Alert] User Login: ${user.name}`,
        text: `User Login Alert!\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${roleDisplay}\nTime: ${dateStr}\nIP Address: ${ip}`,
        html: htmlContent
      }, {
        timeout: 15000 // 15 seconds timeout
      });
      console.log('[Email Utility] Webhook notification sent successfully. Response:', response.data);
      return;
    } catch (error) {
      console.error('[Email Utility] Failed to send email via Webhook HTTP API:', error.message);
      console.log('[Email Utility] Falling back to SMTP connection...');
    }
  }

  // Option B: Fallback to SMTP
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email Utility] SMTP credentials are not configured in environment. Login notification email skipped.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: `[Mediamation Alert] User Login: ${user.name}`,
      text: `User Login Alert!\n\nName: ${user.name}\nEmail: ${user.email}\nRole: ${roleDisplay}\nTime: ${dateStr}\nIP Address: ${ip}`,
      html: htmlContent
    });
    console.log(`[Email Utility] Notification email sent successfully via SMTP! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('[Email Utility] Failed to send login notification email via SMTP:', error);
  }
};
