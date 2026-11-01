// Email Integration Abstraction Service
const sendEmail = async ({ toEmail, subject, text, html }) => {
  const apiKey = process.env.EMAIL_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      configured: false,
      message: 'Email API Key is not configured in server environment variables.'
    };
  }

  // Future integration placeholder with official API providers (e.g. SendGrid, Mailgun, AWS SES, Nodemailer)
  console.log(`[Email Service] Sending email to ${toEmail} with subject: ${subject}`);
  return {
    success: true,
    configured: true,
    messageId: 'email_' + Date.now()
  };
};

module.exports = { sendEmail };
