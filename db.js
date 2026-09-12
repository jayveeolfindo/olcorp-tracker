// SQLite data layer. One file DB (data.db). Synchronous (better-sqlite3).
const path = require('path');
const Database = require('better-sqlite3');
const { normUci, normName, hashToken } = require('./lib/security');

const db = new Database(process.env.DB_FILE || path.join(__dirname, 'data.db'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  uci_norm      TEXT NOT NULL,             -- digits only
  dob           TEXT NOT NULL,             -- YYYY-MM-DD
  last_norm     TEXT NOT NULL,             -- principal applicant surname, normalized
  full_name     TEXT NOT NULL,
  stream        TEXT, noc TEXT, employer TEXT, reference TEXT,
  client_email  TEXT,                       -- for update notifications (optional)
  current_stage TEXT NOT NULL,             -- stage key
  status_label  TEXT, next_action TEXT,
  stage_dates   TEXT DEFAULT '{}',         -- JSON: {stageKey: 'label'}
  checklist     TEXT DEFAULT '[]',         -- JSON: [{label, done}]
  ircc          TEXT DEFAULT '',           -- JSON: {synced, rows:[[label,value,state]], messages:[{date,text}]} — IRCC status text copied from the portal
  sinp          TEXT DEFAULT '',           -- JSON, same shape as ircc — SINP (OASIS) status text copied from the portal (SINP-stream files)
  updated_at    TEXT,
  active        INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS access_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id  TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  issued_at  INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER,
  revoked_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_tok_hash ON access_tokens(token_hash);
CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  client_id  TEXT NOT NULL,
  confirmed  INTEGER DEFAULT 0,            -- 0 until second factor passed
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  ip TEXT, user_agent TEXT
);
CREATE TABLE IF NOT EXISTS access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT, at INTEGER NOT NULL,
  ip TEXT, user_agent TEXT,
  method TEXT, result TEXT               -- link|manual|second_factor ; success|fail|locked
);
`);

const now = () => Date.now();

// ---- clients ----
const insertClient = db.prepare(`INSERT OR REPLACE INTO clients
  (id,uci_norm,dob,last_norm,full_name,stream,noc,employer,reference,client_email,current_stage,status_label,next_action,stage_dates,checklist,ircc,sinp,updated_at,active)
  VALUES (@id,@uci_norm,@dob,@last_norm,@full_name,@stream,@noc,@employer,@reference,@client_email,@current_stage,@status_label,@next_action,@stage_dates,@checklist,@ircc,@sinp,@updated_at,1)`);

function upsertClient(c) {
  insertClient.run({
    id: c.id,
    uci_norm: normUci(c.uci),
    dob: c.dob,
    last_norm: normName(c.last),
    full_name: c.full_name,
    stream: c.stream || null, noc: c.noc || null, employer: c.employer || null, reference: c.reference || null,
    client_email: c.client_email || null,
    current_stage: c.current_stage,
    status_label: c.status_label || null, next_action: c.next_action || null,
    stage_dates: JSON.stringify(c.stage_dates || {}),
    checklist: JSON.stringify(c.checklist || []),
    ircc: JSON.stringify(c.ircc || null),
    sinp: JSON.stringify(c.sinp || null),
    updated_at: c.updated_at || new Date().toISOString().slice(0, 10)
  });
}
const _getClient = db.prepare(`SELECT * FROM clients WHERE id = ?`);
const getClient = (id) => _getClient.get(id);
const listClients = () => db.prepare(`SELECT * FROM clients WHERE active = 1 ORDER BY full_name`).all();
const listArchived = () => db.prepare(`SELECT * FROM clients WHERE active = 0 ORDER BY full_name`).all();
const archiveClient = (id) => db.prepare(`UPDATE clients SET active = 0 WHERE id = ?`).run(id);
const restoreClient = (id) => db.prepare(`UPDATE clients SET active = 1 WHERE id = ?`).run(id);
// Permanent delete: removes the file and everything tied to it.
const deleteClient = db.transaction((id) => {
  db.prepare(`DELETE FROM access_tokens WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM sessions WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM access_log WHERE client_id = ?`).run(id);
  db.prepare(`DELETE FROM clients WHERE id = ?`).run(id);
});

const _findByCreds = db.prepare(`SELECT * FROM clients WHERE uci_norm = ? AND dob = ? AND last_norm = ? AND active = 1`);
const findByCreds = (uci, dob, last) => _findByCreds.get(normUci(uci), String(dob).trim(), normName(last));

// Turn a DB row back into the object shape upsertClient expects (for edit round-trips).
function rowToObj(r) {
  const J = (s, d) => { try { return JSON.parse(s || d); } catch (e) { return JSON.parse(d); } };
  return {
    id: r.id, uci: r.uci_norm, dob: r.dob, last: r.last_norm, full_name: r.full_name,
    stream: r.stream, noc: r.noc, employer: r.employer, reference: r.reference,
    client_email: r.client_email,
    current_stage: r.current_stage, status_label: r.status_label, next_action: r.next_action,
    updated_at: r.updated_at,
    stage_dates: J(r.stage_dates, '{}'), checklist: J(r.checklist, '[]'),
    ircc: J(r.ircc, 'null'), sinp: J(r.sinp, 'null')
  };
}

// ---- tokens ----
function issueToken(clientId, token, ttlHours) {
  db.prepare(`INSERT INTO access_tokens (client_id,token_hash,issued_at,expires_at) VALUES (?,?,?,?)`)
    .run(clientId, hashToken(token), now(), now() + ttlHours * 3600 * 1000);
}
// Consume a token: returns client_id if valid & unused & unexpired & not revoked, else null. Single-use.
function consumeToken(token) {
  const row = db.prepare(`SELECT * FROM access_tokens WHERE token_hash = ?`).get(hashToken(token));
  if (!row) return null;
  if (row.used_at || row.revoked_at || row.expires_at < now()) return null;
  db.prepare(`UPDATE access_tokens SET used_at = ? WHERE id = ?`).run(now(), row.id);
  return row.client_id;
}
const revokeTokens = (clientId) =>
  db.prepare(`UPDATE access_tokens SET revoked_at = ? WHERE client_id = ? AND used_at IS NULL AND revoked_at IS NULL`).run(now(), clientId);

// ---- sessions ----
function createSession(id, clientId, confirmed, ttlMs, ip, ua) {
  db.prepare(`INSERT INTO sessions (id,client_id,confirmed,created_at,last_seen,expires_at,ip,user_agent)
              VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, clientId, confirmed ? 1 : 0, now(), now(), now() + ttlMs, ip || null, ua || null);
}
function getSession(id) {
  if (!id) return null;
  const s = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
  if (!s || s.revoked_at || s.expires_at < now()) return null;
  return s;
}
function touchSession(id, ttlMs) { // sliding expiry
  db.prepare(`UPDATE sessions SET last_seen = ?, expires_at = ? WHERE id = ?`).run(now(), now() + ttlMs, id);
}
const confirmSession = (id) => db.prepare(`UPDATE sessions SET confirmed = 1 WHERE id = ?`).run(id);
const revokeSession  = (id) => db.prepare(`UPDATE sessions SET revoked_at = ? WHERE id = ?`).run(now(), id);
const revokeClientSessions = (clientId) => db.prepare(`UPDATE sessions SET revoked_at = ? WHERE client_id = ? AND revoked_at IS NULL`).run(now(), clientId);

// ---- log ----
const log = (clientId, ip, ua, method, result) =>
  db.prepare(`INSERT INTO access_log (client_id,at,ip,user_agent,method,result) VALUES (?,?,?,?,?,?)`)
    .run(clientId || null, now(), ip || null, ua || null, method, result);

// Recent access-log entries joined with the client name (for the admin log view).
const recentLog = (limit = 200) => db.prepare(
  `SELECT l.*, c.full_name AS client_name
   FROM access_log l LEFT JOIN clients c ON c.id = l.client_id
   ORDER BY l.at DESC LIMIT ?`).all(limit);

module.exports = {
  db, upsertClient, getClient, listClients, listArchived, findByCreds, rowToObj,
  archiveClient, restoreClient, deleteClient,
  issueToken, consumeToken, revokeTokens,
  createSession, getSession, touchSession, confirmSession, revokeSession, revokeClientSessions,
  log, recentLog
};
