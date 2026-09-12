// Parsers that turn the admin form's plain-text fields into the stored shapes.
const { STAGES } = require('../stages');

// Document checklist: one item per line. "[x] Label" = done, "[ ] Label" or "Label" = pending.
function parseChecklist(text) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^\[\s*([xX ])\s*\]\s*(.*)$/);
    if (m) return { label: m[2].trim(), done: m[1].toLowerCase() === 'x' };
    return { label: l, done: false };
  }).filter(k => k.label);
}

// Milestone dates: reads body fields stage_<key> for each of the nine stages.
function parseStageDates(body) {
  const out = {};
  for (const s of STAGES) { const v = String(body['stage_' + s.key] || '').trim(); if (v) out[s.key] = v; }
  return out;
}

// Status rows: one per line "Label | Value | state" (state optional: done|prog|wait).
function parseRows(text) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const p = l.split('|').map(x => x.trim());
    return [p[0] || '', p[1] || '', (p[2] || '').toLowerCase()];
  }).filter(r => r[0] || r[1]);
}

// Update messages: one per line "date | text".
function parseMessages(text) {
  return String(text || '').split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf('|');
    if (i < 0) return { date: '', text: l };
    return { date: l.slice(0, i).trim(), text: l.slice(i + 1).trim() };
  }).filter(m => m.text || m.date);
}

// Build a {synced, rows, messages} status object, or null if all fields are empty.
function buildStatus(synced, rowsText, msgsText) {
  const rows = parseRows(rowsText), messages = parseMessages(msgsText);
  const s = String(synced || '').trim();
  if (!s && !rows.length && !messages.length) return null;
  return { synced: s, rows, messages };
}

module.exports = { parseChecklist, parseStageDates, parseRows, parseMessages, buildStatus };
