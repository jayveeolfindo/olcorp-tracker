// Security helpers: normalization, token generation/hashing, rate limiting, lockout.
const crypto = require('crypto');

// --- normalization (must match the front-end prototype) ---
const normUci  = (s) => String(s || '').replace(/\D/g, '');              // 8 or 10 digits, dashes ignored
const normName = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const normDob  = (s) => String(s || '').trim();                          // expected YYYY-MM-DD

// --- tokens ---
// One-time link token: high-entropy, so a fast hash (SHA-256) is appropriate.
const genToken   = () => crypto.randomBytes(24).toString('base64url');   // ~32 chars, unguessable
const hashToken  = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
const genSession = () => crypto.randomBytes(32).toString('base64url');
const genId      = () => 'c' + crypto.randomBytes(4).toString('hex');   // client id for new files

// --- in-memory rate limiter + lockout (swap for Redis in production) ---
const buckets = new Map();
function hit(key, max, windowMs) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) { b = { count: 0, resetAt: now + windowMs }; buckets.set(key, b); }
  b.count += 1;
  return { allowed: b.count <= max, remaining: Math.max(0, max - b.count), resetAt: b.resetAt };
}
function peek(key, max) {
  const b = buckets.get(key);
  if (!b || Date.now() > b.resetAt) return { locked: false, remaining: max };
  return { locked: b.count >= max, remaining: Math.max(0, max - b.count) };
}
function clear(key) { buckets.delete(key); }

module.exports = { normUci, normName, normDob, genToken, hashToken, genSession, genId, hit, peek, clear };
