// tracker.olcorp.ca — access + session server (starter).
// Implements the three-keys model: one-time link, device session, manual login.
try { require('dotenv').config(); } catch (_) { /* dotenv optional — env vars can be set directly */ }
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const QRCode = require('qrcode');
const S = require('./lib/security');
const F = require('./lib/forms');
const M = require('./lib/mailer');
const DB = require('./db');
const R = require('./render');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

const PORT            = process.env.PORT || 3000;
const BASE_URL        = process.env.BASE_URL || `http://localhost:${PORT}`;
const LINK_TTL_HOURS  = Number(process.env.LINK_TTL_HOURS || 72);
const SESSION_DAYS    = Number(process.env.SESSION_DAYS || 75);
const SESSION_MS      = SESSION_DAYS * 24 * 3600 * 1000;
const COOKIE_SECURE   = String(process.env.COOKIE_SECURE || 'false') === 'true';
const ADMIN_USER      = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS      = process.env.ADMIN_PASS || 'change-me';
const COOKIE          = 'olc_sess';

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));   // serves /logo.png

// Issue a fresh one-time link for a client and email it (update notification / resend).
async function issueAndEmailLink(c) {
  const token = S.genToken();
  DB.issueToken(c.id, token, LINK_TTL_HOURS);
  const link = `${BASE_URL}/o/${token}`;
  const first = String(c.full_name || '').trim().split(/\s+/)[0] || 'there';
  const subject = 'Update on your application';
  const text = `Hi ${first},\n\n` +
    `There is an update on your permanent residence application. You can view it here:\n${link}\n\n` +
    `This is a secure, one-time link that expires in ${LINK_TTL_HOURS} hours. When you open it, you will confirm your date of birth to sign in.\n\n` +
    `If you have any questions, just reply to this email.\n\n` +
    `Jayvee Olfindo, RCIC (R711813)\nOlfindo Immigration Consulting Corporation\nconsulting@olcorp.ca`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;font-size:14px;color:#0a0a0a;line-height:1.5">
    <p>Hi ${esc(first)},</p>
    <p>There is an update on your permanent residence application. You can view it here:</p>
    <p><a href="${link}" style="display:inline-block;background:#161616;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:700">View my application</a></p>
    <p style="color:#5b6b78;font-size:12.5px">This is a secure, one-time link that expires in ${LINK_TTL_HOURS} hours. When you open it, you will confirm your date of birth to sign in.</p>
    <p style="color:#5b6b78;font-size:12.5px">If you have any questions, just reply to this email.</p>
    <p style="margin-top:18px">Jayvee Olfindo, RCIC (R711813)<br>Olfindo Immigration Consulting Corporation<br>consulting@olcorp.ca</p>
  </div>`;
  return M.send({ to: c.client_email, subject, text, html });
}

const ipOf = (req) => req.ip;
const uaOf = (req) => req.get('user-agent') || '';
function setSessionCookie(res, id) {
  res.cookie(COOKIE, id, { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', maxAge: SESSION_MS, path: '/' });
}

// ---------- admin (staff) basic auth ----------
function adminAuth(req, res, next) {
  const h = req.get('authorization') || '';
  const [type, val] = h.split(' ');
  if (type === 'Basic' && val) {
    const [u, p] = Buffer.from(val, 'base64').toString().split(':');
    if (u === ADMIN_USER && p === ADMIN_PASS) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Olcorp Tracker Admin"').status(401).send('Authentication required.');
}

app.get('/admin', adminAuth, (req, res) => res.send(R.renderAdmin(DB.listClients(), DB.listArchived())));
app.get('/admin/log', adminAuth, (req, res) => res.send(R.renderLog(DB.recentLog(200))));

// --- add / edit a client ---
app.get('/admin/clients/new', adminAuth, (req, res) => res.send(R.renderClientForm(null)));
app.get('/admin/clients/:id/edit', adminAuth, (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  res.send(R.renderClientForm(c));
});
app.post('/admin/clients', adminAuth, (req, res) => {
  const b = req.body;
  const existing = b.id ? DB.getClient(b.id) : null;
  const id = (existing && existing.id) || (b.id && b.id.trim()) || S.genId();
  // Preserve the status blobs (they're edited on the separate Status form).
  let ircc = null, sinp = null;
  if (existing) {
    try { ircc = JSON.parse(existing.ircc || 'null'); } catch (e) {}
    try { sinp = JSON.parse(existing.sinp || 'null'); } catch (e) {}
  }
  DB.upsertClient({
    id,
    uci: b.uci, dob: String(b.dob || '').trim(), last: b.last,
    full_name: String(b.full_name || '').trim(),
    stream: b.stream, noc: b.noc, employer: b.employer, reference: b.reference,
    client_email: String(b.client_email || '').trim() || null,
    current_stage: b.current_stage || 'intake',
    status_label: b.status_label, next_action: b.next_action,
    updated_at: String(b.updated_at || '').trim() || new Date().toISOString().slice(0, 10),
    stage_dates: F.parseStageDates(b),
    checklist: F.parseChecklist(b.checklist),
    ircc, sinp
  });
  res.redirect('/admin');
});

// --- paste SINP / IRCC status ---
app.get('/admin/clients/:id/status', adminAuth, (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  res.send(R.renderStatusForm(c));
});
app.post('/admin/clients/:id/status', adminAuth, async (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  const b = req.body;
  const obj = DB.rowToObj(c);
  obj.sinp = F.buildStatus(b.sinp_synced, b.sinp_rows, b.sinp_msgs);
  obj.ircc = F.buildStatus(b.ircc_synced, b.ircc_rows, b.ircc_msgs);
  obj.updated_at = new Date().toISOString().slice(0, 10);
  DB.upsertClient(obj);
  if (b.notify === 'on' && obj.client_email) {
    try { await issueAndEmailLink(obj); } catch (e) { console.error('notify failed:', e.message); }
  }
  res.redirect('/admin');
});

// archive / restore / permanent delete, and email a secure link
app.post('/admin/clients/:id/archive', adminAuth, (req, res) => { DB.archiveClient(req.params.id); res.redirect('/admin'); });
app.post('/admin/clients/:id/restore', adminAuth, (req, res) => { DB.restoreClient(req.params.id); res.redirect('/admin'); });
app.post('/admin/clients/:id/delete',  adminAuth, (req, res) => { DB.deleteClient(req.params.id); res.redirect('/admin'); });
app.post('/admin/clients/:id/email-link', adminAuth, async (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  try { await issueAndEmailLink(c); } catch (e) { console.error('email-link failed:', e.message); }
  res.redirect('/admin');
});

app.get('/admin/clients/:id/link', adminAuth, async (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  const token = S.genToken();
  DB.issueToken(c.id, token, LINK_TTL_HOURS);
  const link = `${BASE_URL}/o/${token}`;
  const qr = await QRCode.toDataURL(link, { margin: 2, color: { dark: '#161616', light: '#ffffff' }, width: 320 });
  res.send(R.renderLinkIssued(c, link, qr));
});

app.post('/admin/clients/:id/revoke', adminAuth, (req, res) => {
  DB.revokeTokens(req.params.id);
  DB.revokeClientSessions(req.params.id);
  res.redirect('/admin');
});

// ---------- client: magic-link entry (Key 1 -> device session) ----------
app.get('/o/:token', (req, res) => {
  // Rate-limit token probing per IP.
  if (!S.hit('o:' + ipOf(req), 30, 10 * 60 * 1000).allowed) {
    DB.log(null, ipOf(req), uaOf(req), 'link', 'locked');
    return res.status(429).send('Too many attempts. Try again later.');
  }
  const clientId = DB.consumeToken(req.params.token);   // single-use; null if used/expired/revoked
  if (!clientId) {
    DB.log(null, ipOf(req), uaOf(req), 'link', 'fail');
    return res.redirect('/?e=link');
  }
  const sid = S.genSession();
  DB.createSession(sid, clientId, /*confirmed*/ false, SESSION_MS, ipOf(req), uaOf(req));  // unconfirmed until 2nd factor
  setSessionCookie(res, sid);
  DB.log(clientId, ipOf(req), uaOf(req), 'link', 'success');
  res.redirect('/');                                    // clean URL — token stripped from address bar
});

// ---------- second factor after magic link (DOB) ----------
app.post('/verify', (req, res) => {
  const s = DB.getSession(req.cookies[COOKIE]);
  if (!s) return res.redirect('/');
  const key = 'verify:' + ipOf(req);
  if (!S.hit(key, 5, 15 * 60 * 1000).allowed) {
    DB.log(s.client_id, ipOf(req), uaOf(req), 'second_factor', 'locked');
    return res.send(R.renderVerify({ error: 'Too many attempts. Please wait a few minutes, or contact consulting@olcorp.ca.' }));
  }
  const c = DB.getClient(s.client_id);
  if (c && S.normDob(req.body.dob) === c.dob) {
    DB.confirmSession(s.id); S.clear(key);
    DB.log(c.id, ipOf(req), uaOf(req), 'second_factor', 'success');
    return res.redirect('/');
  }
  DB.log(s.client_id, ipOf(req), uaOf(req), 'second_factor', 'fail');
  res.send(R.renderVerify({ error: "That date of birth doesn't match. Use YYYY-MM-DD." }));
});

// ---------- manual login (Key 3: UCI + DOB + last name) ----------
app.post('/login', (req, res) => {
  const key = 'login:' + ipOf(req);
  const r = S.hit(key, 5, 15 * 60 * 1000);
  if (!r.allowed) {
    DB.log(null, ipOf(req), uaOf(req), 'manual', 'locked');
    return res.send(R.renderLogin({ locked: true, error: 'Too many unsuccessful attempts. For your security, access is temporarily locked. Please contact consulting@olcorp.ca.' }));
  }
  const c = DB.findByCreds(req.body.uci, req.body.dob, req.body.last);
  if (c) {
    const sid = S.genSession();
    DB.createSession(sid, c.id, /*confirmed*/ true, SESSION_MS, ipOf(req), uaOf(req));  // manual login is fully confirmed
    setSessionCookie(res, sid); S.clear(key);
    DB.log(c.id, ipOf(req), uaOf(req), 'manual', 'success');
    return res.redirect('/');
  }
  DB.log(null, ipOf(req), uaOf(req), 'manual', 'fail');
  res.send(R.renderLogin({ error: `Those details don't match a file. Check the UCI, date of birth, and last name exactly as shown on your IRCC documents. (${r.remaining} attempt${r.remaining === 1 ? '' : 's'} remaining)` }));
});

// ---------- the tracker (or login / verify, by session state) ----------
app.get('/', (req, res) => {
  const s = DB.getSession(req.cookies[COOKIE]);
  if (!s) {
    const err = req.query.e === 'link'
      ? 'That secure link has expired or was already used. Sign in with your UCI, date of birth, and last name — or ask your consultant to resend the link.'
      : null;
    return res.send(R.renderLogin({ error: err }));
  }
  DB.touchSession(s.id, SESSION_MS);            // sliding expiry
  setSessionCookie(res, s.id);
  if (!s.confirmed) return res.send(R.renderVerify({}));   // magic-link session awaiting 2nd factor
  const c = DB.getClient(s.client_id);
  if (!c) { DB.revokeSession(s.id); return res.send(R.renderLogin({})); }
  res.send(R.renderTracker(c));
});

app.post('/logout', (req, res) => {
  const s = DB.getSession(req.cookies[COOKIE]);
  if (s) DB.revokeSession(s.id);
  res.clearCookie(COOKIE, { path: '/' });
  res.redirect('/');
});

app.listen(PORT, () => console.log(`Olcorp tracker running on ${BASE_URL}  (admin at ${BASE_URL}/admin)`));
