// tracker.olcorp.ca — access + session server (starter).
// Implements the three-keys model: one-time link, device session, manual login.
try { require('dotenv').config(); } catch (_) { /* dotenv optional — env vars can be set directly */ }
const path = require('path');
const crypto = require('crypto');
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
const API_KEY         = process.env.API_KEY || '';   // enables the programmatic API when set
const COOKIE          = 'olc_sess';

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));                    // for the programmatic API
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));   // serves /logo.png

// --- Daily "Last Updated" refresh -------------------------------------------
// Every day at 6am Saskatchewan time (America/Regina = UTC-6, no DST) every
// active client's updated_at is stamped with today's date, so each page shows a
// fresh "Last Updated" even on days with no status change. Self-healing: it runs
// on boot, on a 15-minute interval, and on the first request of the day, so it
// still fires after a restart or a Render sleep (it just runs a little late that
// day). It only writes when a client is not already stamped today, so it is cheap
// to call repeatedly.
const REFRESH_HOUR_REGINA = 6;
let lastRefreshDate = null;
function reginaParts() {
  const d = new Date(Date.now() - 6 * 3600 * 1000); // shift to UTC-6
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours() };
}
function refreshAllDates() {
  const { date: today } = reginaParts();
  try {
    const rows = DB.listClients() || [];
    let n = 0;
    for (const r of rows) {
      const o = DB.rowToObj(r);
      if (o.updated_at !== today) { o.updated_at = today; DB.upsertClient(o); n++; }
    }
    lastRefreshDate = today;
    console.log(`[daily-refresh] stamped updated_at=${today} on ${n} client(s)`);
  } catch (e) { console.error('[daily-refresh] failed:', e.message); }
}
function maybeDailyRefresh() {
  const { date: today, hour } = reginaParts();
  if (lastRefreshDate !== today && hour >= REFRESH_HOUR_REGINA) refreshAllDates();
}
app.use((req, res, next) => { maybeDailyRefresh(); next(); }); // first hit of the day catches up
setInterval(maybeDailyRefresh, 15 * 60 * 1000);
maybeDailyRefresh(); // catch up on boot

// Issue a fresh single-use link for a client; returns the full URL.
function issueLink(c) {
  const token = S.genToken();
  DB.issueToken(c.id, token, LINK_TTL_HOURS);
  return `${BASE_URL}/o/${token}`;
}
// Email a given secure link to the client (used by notifications, resend, and the API).
async function emailLink(c, link) {
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
// Convenience: issue a link and email it in one step.
async function issueAndEmailLink(c) {
  return emailLink(c, issueLink(c));
}

const ipOf = (req) => req.ip;
const uaOf = (req) => req.get('user-agent') || '';
function setSessionCookie(res, id) {
  res.cookie(COOKIE, id, { httpOnly: true, secure: COOKIE_SECURE, sameSite: 'lax', maxAge: SESSION_MS, path: '/' });
}

// All active applications for the same person (same UCI + DOB + last name).
// A client logs in with their UCI, so they should see every pending file, not just one.
function appsForPerson(c) {
  try {
    const all = DB.listClients() || [];
    let mine = all.filter(x => x.uci_norm === c.uci_norm && x.last_norm === c.last_norm && String(x.dob) === String(c.dob));
    if (!mine.some(x => x.id === c.id)) mine = [c].concat(mine);
    mine.sort((a, b) => (a.id === c.id ? -1 : (b.id === c.id ? 1 : 0)));  // logged-in file first
    return mine.length ? mine : [c];
  } catch (e) { return [c]; }
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
app.post('/admin/clients', adminAuth, async (req, res) => {
  const b = req.body;
  const existing = b.id ? DB.getClient(b.id) : null;
  const id = (existing && existing.id) || (b.id && b.id.trim()) || S.genId();
  // Preserve the status blobs (they're edited on the separate Status form).
  let ircc = null, sinp = null;
  if (existing) {
    try { ircc = JSON.parse(existing.ircc || 'null'); } catch (e) {}
    try { sinp = JSON.parse(existing.sinp || 'null'); } catch (e) {}
  }
  const stageDates = F.parseStageDates(b);
  // Merge every milestone-date field straight from the form so steps outside the
  // default SINP set (submitted, process, issued, support, and the new visa/study
  // tracks) also save. Blank clears the value, matching the other date fields.
  Object.keys(b).forEach(k => {
    if (k.indexOf('stage_') === 0) {
      const key = k.slice(6);
      const v = String(b[k] || '').trim();
      if (v) stageDates[key] = v; else delete stageDates[key];
    }
  });
  // Current Work Permit Expiration is stored in stage_dates (it has no milestone
  // step of its own) so it survives admin saves. Blank clears it, like the other dates.
  const wpExp = String(b.wp_expiry || '').trim();
  if (wpExp) stageDates.wp_expiry = wpExp; else delete stageDates.wp_expiry;
  // Shared Folder link (per client), also kept in stage_dates. Blank clears it.
  const folderUrl = String(b.folder_url || '').trim();
  if (folderUrl) stageDates.folder_url = folderUrl; else delete stageDates.folder_url;
  DB.upsertClient({
    id,
    uci: b.uci, dob: String(b.dob || '').trim(), last: b.last,
    full_name: String(b.full_name || '').trim(),
    stream: b.stream, noc: b.noc, employer: b.employer, reference: b.reference,
    client_email: String(b.client_email || '').trim() || null,
    current_stage: b.current_stage || 'intake',
    status_label: b.status_label, next_action: b.next_action,
    updated_at: String(b.updated_at || '').trim() || new Date().toISOString().slice(0, 10),
    stage_dates: stageDates,
    checklist: F.parseChecklist(b.checklist),
    ircc, sinp
  });
  // Optionally email the client that their file was updated (only when ticked).
  if (b.notify === 'on') {
    const saved = DB.getClient(id);
    const obj = saved ? DB.rowToObj(saved) : null;
    if (obj && obj.client_email) {
      try { await issueAndEmailLink(obj); } catch (e) { console.error('edit notify failed:', e.message); }
    }
  }
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
// Admin preview: render the client's tracker page exactly as the client sees it (read-only).
app.get('/admin/clients/:id/preview', adminAuth, (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).send('Client not found.');
  res.send(R.renderTracker(appsForPerson(c), { preview: true }));
});
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
  res.send(R.renderTracker(appsForPerson(c)));
});

app.post('/logout', (req, res) => {
  const s = DB.getSession(req.cookies[COOKIE]);
  if (s) DB.revokeSession(s.id);
  res.clearCookie(COOKIE, { path: '/' });
  res.redirect('/');
});

// ================= Programmatic API (for your own automation) =================
// Enable by setting API_KEY on the server. Authenticate each call with either
//   Authorization: Bearer <API_KEY>   or   X-API-Key: <API_KEY>
function apiAuth(req, res, next) {
  if (!API_KEY) return res.status(503).json({ error: 'API disabled. Set API_KEY on the server to enable it.' });
  const provided = (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || req.get('x-api-key') || '';
  const a = Buffer.from(String(provided)), b = Buffer.from(String(API_KEY));
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) { DB.log(null, ipOf(req), uaOf(req), 'api', 'fail'); return res.status(401).json({ error: 'Invalid API key.' }); }
  next();
}

// Public health check (no auth) so Render can do zero-downtime deploys:
// it keeps the current version serving until the new one passes this check.
app.get('/healthz', (req, res) => res.status(200).send('ok'));

// Health / key check.
app.get('/api/ping', apiAuth, (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// List active clients.
app.get('/api/clients', apiAuth, (req, res) => res.json(DB.listClients().map(r => DB.rowToObj(r))));

// Get one client.
app.get('/api/clients/:id', apiAuth, (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(DB.rowToObj(c));
});

// Create or update a client. Provide "id" to update a specific file, or omit to create a new one.
// Fields: uci, dob, last, full_name (required to create); optional stream, noc, employer, reference,
// client_email, current_stage, status_label, next_action, updated_at,
// stage_dates {stageKey:"label"}, checklist [{label,done}], sinp {...}, ircc {...}.
// On update, any field you omit keeps its current value.
app.post('/api/clients', apiAuth, (req, res) => {
  const b = req.body || {};
  const existing = b.id ? DB.getClient(b.id) : null;
  if (!existing && (!b.uci || !b.dob || !b.last || !b.full_name)) {
    return res.status(400).json({ error: 'uci, dob, last, and full_name are required to create a client.' });
  }
  const prev = existing ? DB.rowToObj(existing) : {};
  const id = (existing && existing.id) || (b.id && String(b.id).trim()) || S.genId();
  const pick = (k, dflt) => (b[k] !== undefined ? b[k] : (existing ? prev[k] : dflt));
  DB.upsertClient({
    id,
    uci: pick('uci'), dob: String(pick('dob') || '').trim(), last: pick('last'), full_name: pick('full_name'),
    stream: pick('stream'), noc: pick('noc'), employer: pick('employer'), reference: pick('reference'),
    client_email: pick('client_email', null),
    current_stage: pick('current_stage', 'intake'),
    status_label: pick('status_label'), next_action: pick('next_action'),
    updated_at: b.updated_at || new Date().toISOString().slice(0, 10),
    stage_dates: pick('stage_dates', {}),
    checklist: pick('checklist', []),
    ircc: pick('ircc', null),
    sinp: pick('sinp', null)
  });
  DB.log(id, ipOf(req), uaOf(req), 'api', 'success');
  res.json({ ok: true, id });
});

// Update just the status (the common automation call).
// Body: { sinp:{synced,rows,messages}|null, ircc:{...}|null, current_stage?, status_label?, next_action?, notify?:true }
app.post('/api/clients/:id/status', apiAuth, async (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const obj = DB.rowToObj(c);
  if (b.sinp !== undefined) obj.sinp = b.sinp;
  if (b.ircc !== undefined) obj.ircc = b.ircc;
  if (b.current_stage) obj.current_stage = b.current_stage;
  if (b.status_label !== undefined) obj.status_label = b.status_label;
  if (b.next_action !== undefined) obj.next_action = b.next_action;
  obj.updated_at = b.updated_at || new Date().toISOString().slice(0, 10);
  DB.upsertClient(obj);
  let emailed = false;
  if (b.notify === true && obj.client_email) {
    try { const r = await issueAndEmailLink(obj); emailed = !!(r && r.sent); } catch (e) { console.error('api notify failed:', e.message); }
  }
  DB.log(c.id, ipOf(req), uaOf(req), 'api', 'success');
  res.json({ ok: true, id: c.id, emailed });
});

// Issue a secure link for a client (optionally email it). Body: { email:true|false }
app.post('/api/clients/:id/link', apiAuth, async (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  const link = issueLink(c);
  let emailed = false;
  if (req.body && req.body.email === true && c.client_email) {
    try { const r = await emailLink(c, link); emailed = !!(r && r.sent); } catch (e) { console.error('api link email failed:', e.message); }
  }
  res.json({ ok: true, link, expires_hours: LINK_TTL_HOURS, emailed });
});

// Archive (soft-delete) a client.
app.post('/api/clients/:id/archive', apiAuth, (req, res) => {
  const c = DB.getClient(req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  DB.archiveClient(c.id);
  res.json({ ok: true, id: c.id });
});

app.listen(PORT, () => console.log(`Olcorp tracker running on ${BASE_URL}  (admin at ${BASE_URL}/admin)`));
