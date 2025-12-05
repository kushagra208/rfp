// backend/services/mailgunMailer.js
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mg = new Mailgun(formData);
const mgClient = mg.client({ username: 'api', key: process.env.MAILGUN_API_KEY , url: "https://api.eu.mailgun.net"});

const DOMAIN = process.env.MAILGUN_DOMAIN;
const FROM = process.env.FROM_EMAIL || `no-reply@${DOMAIN || 'example.com'}`;

async function sendMail({ to, subject, text, replyTo }) {
  if (!process.env.MAILGUN_API_KEY || !DOMAIN) {
    throw new Error('Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN in env.');
  }
  const data = {
    from: FROM,
    to,
    subject,
    text,
    'h:Reply-To': replyTo
  };
  try {
    console.log("Trying to send email!");
    console.log(DOMAIN, data);
    const resp = await mgClient.messages.create(DOMAIN, data);
    return resp;
  } catch (err) {
    console.error('Mailgun send error:', err);
    throw err;
  }
}

module.exports = { sendMail };
