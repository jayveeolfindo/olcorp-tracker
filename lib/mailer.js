// Optional email sender. Uses SMTP from env; if not configured, send() is a no-op
// that reports back so the app keeps working without email.
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 587);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM || (USER ? `Olfindo Immigration Consulting <${USER}>` : '');

let transport = null;
function isConfigured() { return !!(nodemailer && HOST && USER && PASS); }
function tx() {
  if (!transport && isConfigured()) {
    transport = nodemailer.createTransport({
      host: HOST, port: PORT, secure: PORT === 465,
      auth: { user: USER, pass: PASS }
    });
  }
  return transport;
}

async function send({ to, subject, text, html }) {
  if (!isConfigured()) return { sent: false, reason: 'not_configured' };
  if (!to) return { sent: false, reason: 'no_recipient' };
  try {
    await tx().sendMail({ from: FROM, to, subject, text, html });
    return { sent: true };
  } catch (e) {
    console.error('mail error:', e.message);
    return { sent: false, reason: e.message };
  }
}

module.exports = { isConfigured, send, FROM };
