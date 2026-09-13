// Server-side HTML rendering. On-brand with olcorp.ca (off-white, white cards,
// green accent, mono labels, black pill buttons). Swap the text wordmark for the
// real logo image if you like (drop a file in /public and reference it).
const { STAGES, ALL_STAGES, stagesFor, trackFor, stageIndex, recFor } = require('./stages');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const safeJSON = (s, d) => { if (!s) return d; try { return JSON.parse(s); } catch (e) { return d; } };

// Where the "Direct Chat with Consultant" button points. One link for every client.
// Swap this for a Messenger (m.me/...), WhatsApp (wa.me/...) or booking link any time.
const CONSULT_CHAT_URL = 'https://www.facebook.com/jayveeolfindo';

// Format an ISO date (YYYY-MM-DD) as DD-MON-YYYY, e.g. 2026-09-13 -> 13-SEP-2026.
function fmtSync(iso) {
  const MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const p = String(iso || '').split('-');
  if (p.length !== 3) return String(iso || '');
  const mo = parseInt(p[1], 10);
  return `${p[2]}-${MON[mo - 1] || p[1]}-${p[0]}`;
}

const CSS = `
:root{--bg:#f2f2f0;--card:#fff;--card2:#fbfcfd;--ink:#0a0a0a;--dark:#161616;--muted:#5b6b78;--faint:#8a97a2;
--line:#e1e1de;--line2:#ececea;--green:#5f9c52;--green-soft:#eef4ec;--slate-soft:#eef1f3;--radius:16px;
--shadow:0 1px 2px rgba(16,24,32,.04),0 8px 24px rgba(16,24,32,.05);
--mono:ui-monospace,"SF Mono","IBM Plex Mono",Menlo,monospace;--sans:-apple-system,system-ui,"SF Pro Display","Helvetica Neue",Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:1040px;margin:0 auto;padding:0 22px 60px}
.topbar{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 0}
.brandlogo{height:60px;width:auto;display:block;background:#fff;border:1.5px solid var(--line);border-radius:10px;padding:10px 18px;box-shadow:var(--shadow)}
.div{color:var(--faint);font-size:13px}
.mlabel{font-family:var(--mono);font-size:11px;font-weight:500;letter-spacing:1.2px;color:var(--green);text-transform:uppercase}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
h1{font-size:24px;font-weight:800;letter-spacing:-.5px;margin:14px 2px 6px}
.sub{color:var(--muted);font-size:13px;margin:0 2px 18px}
/* login / verify */
.gate{max-width:448px;margin:26px auto 6px;padding:30px}
.gate h3{font-size:19px;font-weight:800;margin:4px 0 6px}
.gate p{font-size:12.5px;color:var(--muted);line-height:1.5;margin:0 0 20px}
.field{margin-bottom:15px}.field label{display:block;font-size:12px;font-weight:600;margin-bottom:6px}
.field input{width:100%;font-family:var(--sans);font-size:14px;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;outline:none}
.field input:focus{border-color:var(--green)}.field .hint{font-size:11px;color:var(--faint);margin-top:5px}
.btn{width:100%;background:var(--dark);color:#fff;border:0;border-radius:999px;padding:13px;font-family:var(--sans);font-size:14px;font-weight:700;cursor:pointer}
.err{background:#fbeceb;border:1px solid #f2ccc8;color:#b23c30;font-size:12.5px;line-height:1.45;padding:10px 12px;border-radius:9px;margin-bottom:16px}
.note{max-width:448px;margin:10px auto 0;text-align:center;font-size:11px;color:var(--faint);line-height:1.5}
/* tracker */
.clientbar{display:flex;justify-content:space-between;align-items:center;margin:16px 2px 12px}
.clientbar .who{font-size:12.5px;color:var(--muted)}.clientbar .who b{color:var(--ink)}
.signout{background:#fff;border:1.5px solid var(--line);color:var(--muted);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:600;cursor:pointer}
.hero{padding:22px;border-bottom:1px solid var(--line2);display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}
.hero h2{margin:6px 0 4px;font-size:21px;font-weight:800;letter-spacing:-.4px}
.hero .noc{font-size:12.5px;color:var(--muted)}
.ref{font-family:var(--mono);font-size:12px;color:#41762f;background:var(--green-soft);border:1px solid #d7e6d0;padding:5px 10px;border-radius:8px;display:inline-block;margin-top:10px}
.wpexp{font-family:var(--mono);font-size:12px;color:#33475b;background:var(--slate-soft);border:1px solid #d5dde2;padding:5px 10px;border-radius:8px;display:inline-block;margin-top:10px}
.actionbtns{display:flex;gap:12px;flex-wrap:wrap;margin:16px 2px 0}
.actionbtn{flex:1;min-width:200px;text-align:center;background:var(--dark);color:#fff;text-decoration:none;border-radius:999px;padding:13px 18px;font-size:13.5px;font-weight:700}
.actionbtn:hover{opacity:.92}
.rec{padding:15px 18px;font-size:13px;line-height:1.55;color:var(--muted)}
.statusnow{text-align:right;min-width:180px}.statusnow .val{font-size:16px;font-weight:800;margin-top:6px}
.seg{display:flex;gap:5px;padding:16px 22px 4px}.seg i{height:5px;border-radius:99px;flex:1;background:#e6e8e5}
.seg i.on{background:var(--green)}.seg i.cur{background:var(--green);opacity:.55}
.segcap{padding:2px 22px 16px;font-family:var(--mono);font-size:11px;letter-spacing:1px;color:var(--faint);text-transform:uppercase}
.steps{padding:8px 22px 20px}.step{display:flex;gap:15px;position:relative;padding:13px 0}
.step:not(:last-child)::before{content:"";position:absolute;left:13px;top:36px;bottom:-6px;width:2px;background:var(--line)}
.step.done:not(:last-child)::before{background:var(--green)}
.node{width:28px;height:28px;border-radius:50%;flex:0 0 28px;display:grid;place-items:center;font-size:12px;font-weight:800;border:1.5px solid var(--line);background:#fff;color:var(--faint)}
.step.done .node{background:var(--green);border-color:var(--green);color:#fff}
.step.current .node{background:var(--dark);border-color:var(--dark);color:#fff;box-shadow:0 0 0 4px rgba(22,22,22,.08)}
.step .t{font-size:14px;font-weight:700}.step.pending .t{color:var(--faint)}
.step .d{font-size:12.5px;color:var(--muted);margin-top:3px;line-height:1.45}
.step .when{font-family:var(--mono);font-size:10.5px;letter-spacing:.6px;color:var(--faint);margin-top:6px;text-transform:uppercase}
.step.current .when{color:var(--green)}
.step .when.est{color:#b7791f}
.estnote{margin:0 22px 18px;font-size:11px;line-height:1.45;color:#b7791f;font-style:italic}
.cols{display:grid;grid-template-columns:1fr .82fr;gap:14px;margin-top:14px}
@media(max-width:820px){.cols{grid-template-columns:1fr}}
.panel-h{padding:15px 18px;border-bottom:1px solid var(--line2);font-size:13.5px;font-weight:700}
.check{margin:0;padding:10px 8px}.check li{list-style:none;display:flex;align-items:center;gap:11px;padding:9px 12px;font-size:13px}
.tick{width:19px;height:19px;border-radius:6px;flex:0 0 19px;display:grid;place-items:center;font-size:11px;font-weight:800}
.tick.ok{background:var(--green);color:#fff}.tick.wait{background:#f1f3f0;color:var(--faint);border:1px solid var(--line)}
.check li.pend{color:var(--muted)}
.contact{padding:16px 18px;font-size:12.5px;color:var(--muted);line-height:1.65}.contact b{color:var(--ink)}
/* admin */
.arow{display:grid;grid-template-columns:1.6fr 1.4fr auto;gap:14px;align-items:center;padding:15px 18px;border-top:1px solid var(--line2)}
.arow:first-of-type{border-top:0}.aname{font-weight:700;font-size:14px}.ameta{font-size:12px;color:var(--muted);margin-top:3px}
.abtn{background:var(--dark);color:#fff;border:0;border-radius:999px;padding:8px 15px;font-size:12.5px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block}
.linkcode{font-family:var(--mono);font-size:12px;color:#41762f;background:var(--green-soft);border:1px solid #d7e6d0;padding:8px 11px;border-radius:8px;word-break:break-all;display:inline-block}
.chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.chips span{font-family:var(--mono);font-size:9.5px;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);background:var(--slate-soft);border:1px solid #dde3e8;padding:4px 8px;border-radius:999px}
a.back{color:var(--muted);font-size:12.5px;text-decoration:none}
.istat{padding:6px 6px 4px}.irow{display:flex;justify-content:space-between;gap:12px;padding:11px 12px;border-bottom:1px solid var(--line2);font-size:13px}.irow:last-child{border-bottom:0}
.il{color:var(--muted)}.iv{font-weight:700;text-align:right}.iv.prog{color:#41586e}.iv.done{color:#41762f}.iv.wait{color:var(--faint)}
.imsg-h{padding:12px 14px 4px;font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--faint);border-top:1px solid var(--line2)}
.imsgs{padding:2px 6px 10px}.imsg{display:flex;gap:12px;padding:8px 12px;font-size:12.5px;line-height:1.45}
.imd{font-family:var(--mono);font-size:10.5px;color:var(--green);white-space:nowrap;padding-top:2px}.imt{color:var(--ink)}
.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.abtn.ghost{background:#fff;color:var(--muted);border:1.5px solid var(--line)}
.form{max-width:680px;margin:0 auto;padding:26px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:600px){.row2{grid-template-columns:1fr}}
textarea{width:100%;font-family:var(--sans);font-size:13px;line-height:1.5;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;outline:none;min-height:96px;resize:vertical}
textarea:focus{border-color:var(--green)}
select{width:100%;font-family:var(--sans);font-size:14px;border:1.5px solid var(--line);border-radius:10px;padding:11px 12px;outline:none;background:#fff}
.sec{margin-top:20px;padding-top:16px;border-top:1px solid var(--line2)}.sec h4{margin:0 0 12px;font-size:14px}
.hint2{font-size:11px;color:var(--faint);margin:5px 0 0;line-height:1.45}
.stagegrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:600px){.stagegrid{grid-template-columns:1fr}}
code{font-family:var(--mono);font-size:11px;background:var(--slate-soft);padding:1px 5px;border-radius:5px}
.ltable{width:100%;border-collapse:collapse;font-size:12.5px}
.ltable th,.ltable td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line2)}
.ltable th{font-family:var(--mono);font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--faint);font-weight:500}
.ltable td.mono{font-family:var(--mono);font-size:11px;color:var(--muted)}
.pill{font-size:10px;font-weight:700;padding:3px 9px;border-radius:999px}
.pill.ok{background:var(--green-soft);color:#41762f}.pill.fail{background:#fbeceb;color:#b23c30}.pill.locked{background:#f6efe1;color:#8a641c}
.checkrow{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink);cursor:pointer}
.checkrow input{width:16px;height:16px}
.arow.arch{opacity:.72}
.apptabs{display:flex;gap:8px;flex-wrap:wrap;margin:0 2px 14px}
.apptab{background:#fff;border:1.5px solid var(--line);color:var(--muted);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;cursor:pointer}
.apptab.on{background:var(--dark);color:#fff;border-color:var(--dark)}
`;

function page(title, body) {
  const BASE = (process.env.BASE_URL || 'https://tracker.olcorp.ca').replace(/\/+$/, '');
  const OG_IMG = BASE + '/share.png';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="olcorp.ca">
<meta property="og:title" content="Client Application Tracker">
<meta property="og:description" content="Track your Canadian immigration application status with Olfindo Immigration Consulting Corp.">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="olcorp.ca, Olfindo Immigration Consulting Corp, Client Application Tracker">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Client Application Tracker">
<meta name="twitter:description" content="Track your Canadian immigration application status with Olfindo Immigration Consulting Corp.">
<meta name="twitter:image" content="${OG_IMG}">
<style>${CSS}</style></head>
<body><div class="wrap">
<div class="topbar"><span style="display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center"><img class="brandlogo" src="/logo.png" alt="olcorp.ca, Olfindo Immigration Consulting Corp"><span class="div">Client Application Tracker</span></span></div>
${body}
</div></body></html>`;
}

// ---- client login (manual: UCI + DOB + last name) ----
function renderLogin({ error, locked } = {}) {
  const body = `
  <div class="card gate">
    <div class="mlabel">Secure Access</div>
    <h3>View Your Application</h3>
    <p>Enter the <strong>principal applicant's</strong> details exactly as they appear on your IRCC documents.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <form method="POST" action="/login" ${locked ? 'style="opacity:.5;pointer-events:none"' : ''}>
      <div class="field"><label>UCI (Unique Client Identifier)</label>
        <input name="uci" inputmode="numeric" autocomplete="off" placeholder="0000-0000  or  00-0000-0000">
        <div class="hint">8 or 10 digits, dashes optional.</div></div>
      <div class="field"><label>Date of Birth</label>
        <input name="dob" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" maxlength="10"></div>
      <div class="field"><label>Principal Applicant's Last Name</label>
        <input name="last" autocomplete="off" placeholder="Family name"></div>
      <button class="btn" ${locked ? 'disabled' : ''}>View My Application</button>
    </form>
  </div>
  <p class="note">This page shows only your own file. Your details are verified securely and are never included in the page address.</p>
  <script>document.querySelector('[name=dob]').addEventListener('input',function(e){var d=e.target.value.replace(/\\D/g,'').slice(0,8);var o=d.slice(0,4);if(d.length>4)o+='-'+d.slice(4,6);if(d.length>6)o+='-'+d.slice(6,8);e.target.value=o;});</script>`;
  return page('Sign In · Client Application Tracker', body);
}

// ---- second factor after a magic link (DOB only) ----
function renderVerify({ error } = {}) {
  const body = `
  <div class="card gate">
    <div class="mlabel" style="color:var(--green)">Confirm It's You</div>
    <h3>Almost There</h3>
    <p>You opened a secure link. Enter the <strong>principal applicant's date of birth</strong> to finish signing in.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <form method="POST" action="/verify">
      <div class="field"><label>Date of Birth</label>
        <input name="dob" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" maxlength="10"></div>
      <button class="btn">Continue</button>
    </form>
  </div>
  <p class="note">The one-time link has already been used. Your session now lives only on this device.</p>
  <script>document.querySelector('[name=dob]').addEventListener('input',function(e){var d=e.target.value.replace(/\\D/g,'').slice(0,8);var o=d.slice(0,4);if(d.length>4)o+='-'+d.slice(4,6);if(d.length>6)o+='-'+d.slice(6,8);e.target.value=o;});</script>`;
  return page('Confirm · Client Application Tracker', body);
}

// ---- the client's tracker page ----
// Accepts a single client object or an array of the client's applications
// (all files that share the same UCI + DOB + last name). Shows one tab per
// application so a client who logs in with their UCI sees every pending file.
function appTypeLabel(c) {
  const track = trackFor(c.stream);
  if (track === 'study-permit')   return 'Study Permit';
  if (track === 'visitor-visa')   return 'Visitor Visa';
  if (track === 'super-visa')     return 'Super Visa';
  if (track === 'stay-extension') return 'Stay Extension';
  if (track === 'temp-sinp' || track === 'temp') {
    const s = String(c.stream || '') + ' ' + String(c.reference || '');
    if (/study/i.test(s)) return 'Study Permit Extension';
    if (/visitor|\bVR\b/i.test(s)) return 'Visitor Record Extension';
    return 'Work Permit Extension';
  }
  return 'Permanent Residence';
}

function appBlock(c, idx, active, ctx = {}) {
  const track = trackFor(c.stream);
  const STG = stagesFor(track);
  let ci = stageIndex(c.current_stage, track);
  if (ci < 0) ci = 0;
  const dates = safeJSON(c.stage_dates, {});
  // On a PR file, when the client has NO separate work/study/visitor extension
  // application on the tracker, surface their current work permit expiration here.
  const isPR = appTypeLabel(c) === 'Permanent Residence';
  const wpExpiry = (isPR && !ctx.hasExtApp) ? (dates.wp_expiry || null) : null;
  const checklist = safeJSON(c.checklist, []);
  const seg = STG.map((s, i) => `<i class="${i < ci ? 'on' : (i === ci ? 'cur' : '')}"></i>`).join('');
  const pct = Math.round(((ci + 0.5) / STG.length) * 100);
  const isEstV = v => !!v && /^\s*est\.?\b/i.test(String(v));
  const steps = STG.map((s, i) => {
    const cls = i < ci ? 'done' : (i === ci ? 'current' : 'pending');
    const inner = i < ci ? '&#10003;' : (i + 1);
    const dv = dates[s.key];
    const when = dv ? `<div class="when${isEstV(dv) ? ' est' : ''}">${esc(dv)}</div>` : (i === ci ? '<div class="when">In Progress</div>' : '');
    return `<div class="step ${cls}"><div class="node">${inner}</div><div><div class="t">${esc(s.t)}</div><div class="d">${esc(s.d)}</div>${when}</div></div>`;
  }).join('');
  const hasEst = STG.some(s => isEstV(dates[s.key]));
  const checks = checklist.map(k => `<li class="${k.done ? '' : 'pend'}"><span class="tick ${k.done ? 'ok' : 'wait'}">${k.done ? '&#10003;' : '&#8226;'}</span>${esc(k.label)}</li>`).join('');
  const ircc = safeJSON(c.ircc, null);
  const irccHtml = ircc ? `
    <div class="istat">${(ircc.rows || []).map(r => `<div class="irow"><span class="il">${esc(r[0])}</span><span class="iv ${r[2] || ''}">${esc(r[1])}</span></div>`).join('')}</div>
    ${(ircc.messages && ircc.messages.length) ? `<div class="imsg-h">Latest Updates From IRCC</div><div class="imsgs">${ircc.messages.map(m => `<div class="imsg"><span class="imd">${esc(m.date)}</span><span class="imt">${esc(m.text)}</span></div>`).join('')}</div>` : ''}`
    : `<div class="istat"><div class="irow"><span class="il">No IRCC status yet. This appears once the e-APR is submitted to IRCC.</span></div></div>`;
  return `<div class="appblock" data-app="${idx}"${active ? '' : ' style="display:none"'}>
  <div class="card">
    <div class="hero">
      <div><div class="mlabel">${esc(c.stream || '')}</div><h2>${esc(appTypeLabel(c))}</h2>
        ${c.reference ? `<div class="ref">${esc(c.reference)}</div>` : ''}
        ${wpExpiry ? `<div class="wpexp">Current Work Permit Expires · ${esc(wpExpiry)}</div>` : ''}</div>
      <div class="statusnow"><div class="mlabel">Current Status</div><div class="val">${esc(STG[ci].t)}</div>
        <div class="noc" style="margin-top:6px">Sync Date: ${esc(fmtSync(c.updated_at))}</div></div>
    </div>
    <div class="seg">${seg}</div>
    <div class="segcap">Step ${ci + 1} Of ${STG.length} · ${pct}% Complete</div>
    <div class="steps">${steps}</div>
    ${hasEst ? '<div class="estnote">Dates shown in yellow are estimated from average processing times. They are projections to help you plan, not commitments, and actual IRCC timelines vary.</div>' : ''}
  </div>
  <div class="card" style="margin-top:14px"><div class="panel-h" style="display:flex;justify-content:space-between;align-items:center"><span>IRCC Application Status</span><span style="font-weight:500;color:var(--faint);font-size:11px;font-family:var(--mono)">SYNCED ${esc(fmtSync(c.updated_at))}</span></div>${irccHtml}</div>
  <div class="card" style="margin-top:14px"><div class="panel-h">Recommended Action</div><div class="rec">${esc(recFor(track, STG[ci].key))}</div></div>
  </div>`;
}

function renderTracker(input, opts = {}) {
  const list = Array.isArray(input) ? input.slice() : [input];
  if (!list.length) return page('Application Tracker', '<div class="card gate"><p>No application on file.</p></div>');
  const person = list[0];
  const clientbar = opts.preview
    ? `<div class="clientbar" style="background:var(--green-soft);border:1px solid #d7e6d0;border-radius:12px;padding:10px 14px">
        <span class="who">Admin preview. This is exactly what <b>${esc(person.full_name)}</b> sees on their tracker.</span>
        <a class="signout" href="/admin">Back to Admin</a>
      </div>`
    : `<div class="clientbar">
        <span class="who">Signed in · <b>${esc(person.full_name)}</b></span>
        <form method="POST" action="/logout" style="margin:0"><button class="signout">Sign out</button></form>
      </div>`;
  const multi = list.length > 1;
  const tabs = multi
    ? `<div class="apptabs">${list.map((c, i) => `<button class="apptab ${i === 0 ? 'on' : ''}" data-target="${i}">${esc(appTypeLabel(c))}</button>`).join('')}</div>`
    : '';
  const intro = multi
    ? `<p class="sub" style="margin:0 2px 12px">You have ${list.length} applications in progress. Select one to view its status.</p>`
    : '';
  const hasExtApp = list.some(x => appTypeLabel(x) !== 'Permanent Residence');
  const blocks = list.map((c, i) => appBlock(c, i, i === 0, { hasExtApp })).join('');
  const consultant = `<div class="card" style="margin-top:14px"><div class="panel-h">Your Consultant</div>
      <div class="contact"><b>Jayvee Olfindo</b>, RCIC (R711813)<br>Olfindo Immigration Consulting Corporation<br>consulting@olcorp.ca<br><br>Questions about your file? Message us through the Direct Chat with Consultant button below, or reply to your last email, and we'll get back to you.</div></div>`;
  // Bottom action buttons. Shared Folder link is per client (stored in stage_dates.folder_url);
  // its button only shows when a link is set on the file.
  let folderUrl = '';
  for (const c of list) { const u = safeJSON(c.stage_dates, {}).folder_url; if (u) { folderUrl = u; break; } }
  const actions = `<div class="actionbtns">
      <a class="actionbtn" href="${esc(CONSULT_CHAT_URL)}">Direct Chat with Consultant</a>
      ${folderUrl ? `<a class="actionbtn" href="${esc(folderUrl)}" target="_blank" rel="noopener">Link to Shared Folder</a>` : ''}
    </div>`;
  const script = multi
    ? `<script>(function(){var tabs=document.querySelectorAll('.apptab'),blocks=document.querySelectorAll('.appblock');tabs.forEach(function(t){t.addEventListener('click',function(){var tgt=t.getAttribute('data-target');tabs.forEach(function(x){x.classList.toggle('on',x===t);});blocks.forEach(function(b){b.style.display=(b.getAttribute('data-app')===tgt)?'':'none';});});});})();</script>`
    : '';
  const body = `
  ${clientbar}
  ${intro}
  ${tabs}
  ${blocks}
  ${consultant}
  ${actions}
  ${script}`;
  return page(`${person.full_name} · Application Tracker`, body);
}

// ---- consultant admin ----
function renderAdmin(clients, archived = []) {
  const rows = clients.map(c => {
    const st = stagesFor(trackFor(c.stream))[stageIndex(c.current_stage, trackFor(c.stream))];
    return `<div class="arow">
      <div><div class="aname">${esc(c.full_name)}</div><div class="ameta">${esc(c.noc || '')}</div></div>
      <div><div class="ameta">${esc(st ? st.t : c.current_stage)}</div><div class="ameta">${esc(c.status_label || '')}</div></div>
      <div class="actions">
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/preview">View as client</a>
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/edit">Edit</a>
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/status">Status</a>
        <a class="abtn" href="/admin/clients/${esc(c.id)}/link">Issue link &#9656;</a>
        <form method="POST" action="/admin/clients/${esc(c.id)}/archive" style="margin:0"><button class="abtn ghost">Archive</button></form>
      </div>
    </div>`;
  }).join('');
  const archivedRows = archived.map(c => `<div class="arow arch">
      <div><div class="aname">${esc(c.full_name)}</div><div class="ameta">${esc(c.noc || '')}</div></div>
      <div><div class="ameta">Archived</div></div>
      <div class="actions">
        <form method="POST" action="/admin/clients/${esc(c.id)}/restore" style="margin:0"><button class="abtn ghost">Restore</button></form>
        <form method="POST" action="/admin/clients/${esc(c.id)}/delete" style="margin:0" onsubmit="return confirm('Permanently delete ${esc(c.full_name)} and all their access records? This cannot be undone.')"><button class="abtn ghost" style="color:#b23c30;border-color:#f2ccc8">Delete</button></form>
      </div>
    </div>`).join('');
  const body = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h1>Consultant · Active Files</h1>
    <span style="display:flex;gap:8px"><a class="abtn ghost" href="/admin/log">Access log</a><a class="abtn" href="/admin/clients/new">+ Add Client</a></span></div>
  <p class="sub">Add or edit a client, paste their SINP/IRCC status, and issue a one-time secure link (QR) or email it to the client.</p>
  <div class="card">${rows || '<div class="arow"><div class="ameta">No active clients yet. Click &ldquo;Add Client&rdquo; to create one.</div></div>'}</div>
  ${archived.length ? `<h1 style="font-size:16px;margin-top:26px">Archived Files</h1><div class="card">${archivedRows}</div>` : ''}`;
  return page('Admin · Client Application Tracker', body);
}

// ---- access log ----
function renderLog(entries) {
  const fmt = (ms) => { try { return new Date(ms).toLocaleString('en-CA', { hour12: false }); } catch (e) { return ''; } };
  const rows = entries.map(e => `<tr>
    <td class="mono">${esc(fmt(e.at))}</td>
    <td>${esc(e.client_name || '(unknown)')}</td>
    <td class="mono">${esc(e.method || '')}</td>
    <td><span class="pill ${e.result === 'success' ? 'ok' : (e.result === 'locked' ? 'locked' : 'fail')}">${esc(e.result || '')}</span></td>
    <td class="mono">${esc(e.ip || '')}</td>
  </tr>`).join('');
  const body = `<a class="back" href="/admin">&lsaquo; Back to files</a>
  <h1>Access Log</h1><p class="sub">Every sign-in attempt and secure-link open, newest first. Handy for your records.</p>
  <div class="card" style="padding:6px 6px;overflow-x:auto"><table class="ltable">
    <thead><tr><th>When</th><th>Client</th><th>Method</th><th>Result</th><th>IP</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="padding:16px">No entries yet.</td></tr>'}</tbody></table></div>`;
  return page('Access Log · Client Application Tracker', body);
}

// Add / edit a client file.
function renderClientForm(c) {
  const editing = !!c;
  const v = (k) => c ? esc(c[k] || '') : '';
  const stageOpts = ALL_STAGES.map(s => `<option value="${s.key}" ${c && c.current_stage === s.key ? 'selected' : ''}>${esc(s.t)}</option>`).join('');
  let dates = {}; try { dates = JSON.parse((c && c.stage_dates) || '{}'); } catch (e) { dates = {}; }
  const stageInputs = ALL_STAGES.map(s => `<div class="field"><label>${esc(s.t)}</label><input name="stage_${s.key}" value="${esc(dates[s.key] || '')}" placeholder="e.g. Aug 6, 2026"></div>`).join('');
  let checklistText = '';
  if (c) { try { checklistText = JSON.parse(c.checklist || '[]').map(k => `[${k.done ? 'x' : ' '}] ${k.label}`).join('\n'); } catch (e) {} }
  const body = `<a class="back" href="/admin">&lsaquo; Back to files</a>
  <form class="card form" method="POST" action="/admin/clients">
    <input type="hidden" name="id" value="${editing ? esc(c.id) : ''}">
    <h1>${editing ? 'Edit Client' : 'Add Client'}</h1>
    <p class="sub">${editing ? esc(c.full_name) : 'The login keys are UCI, date of birth, and the principal applicant&rsquo;s last name.'}</p>

    <div class="sec"><h4>Identity &amp; Login</h4>
      <div class="field"><label>Full Name</label><input name="full_name" value="${v('full_name')}" required></div>
      <div class="row2">
        <div class="field"><label>UCI (8 or 10 digits)</label><input name="uci" value="${editing ? esc(c.uci_norm) : ''}" placeholder="0000-0000 or 00-0000-0000" required></div>
        <div class="field"><label>Date of Birth</label><input name="dob" value="${v('dob')}" placeholder="YYYY-MM-DD" required></div>
      </div>
      <div class="field"><label>Principal Applicant&rsquo;s Last Name</label><input name="last" value="${editing ? esc(c.last_norm) : ''}" required></div>
      <div class="field"><label>Client Email <span class="hint2">(for update notifications, optional)</span></label><input name="client_email" type="email" value="${editing ? esc(c.client_email || '') : ''}" placeholder="client@example.com"></div>
    </div>

    <div class="sec"><h4>File Details</h4>
      <div class="row2">
        <div class="field"><label>Stream</label><input name="stream" value="${v('stream')}" placeholder="SINP · Permanent Residence"></div>
        <div class="field"><label>NOC / Occupation</label><input name="noc" value="${v('noc')}" placeholder="NOC 33102 - Continuing Care Assistant"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Employer</label><input name="employer" value="${v('employer')}"></div>
        <div class="field"><label>Reference / File Note</label><input name="reference" value="${v('reference')}" placeholder="SINP #1184278 · e-APR AOR Received"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Current Stage</label><select name="current_stage">${stageOpts}</select></div>
        <div class="field"><label>Status Label</label><input name="status_label" value="${v('status_label')}" placeholder="AOR Received"></div>
      </div>
      <div class="row2">
        <div class="field"><label>Next Action</label><input name="next_action" value="${v('next_action')}" placeholder="Biometrics Instruction Letter (BIL)"></div>
        <div class="field"><label>Last Updated</label><input name="updated_at" value="${v('updated_at')}" placeholder="YYYY-MM-DD"></div>
      </div>
      <div class="field"><label>Shared Folder Link <span class="hint2">(client's Google Drive folder; the "Link to Shared Folder" button appears only when this is set)</span></label><input name="folder_url" value="${esc(dates.folder_url || '')}" placeholder="https://drive.google.com/..."></div>
    </div>

    <div class="sec"><h4>Milestone Dates <span class="hint2">(optional, shown under each step)</span></h4>
      <div class="field"><label>Current Work Permit Expiration <span class="hint2">(shown on a PR file only when the client has no Work Permit Extension file; leave blank to hide)</span></label><input name="wp_expiry" value="${esc(dates.wp_expiry || '')}" placeholder="e.g. Oct 18, 2027"></div>
      <div class="stagegrid">${stageInputs}</div>
    </div>

    <div class="sec"><h4>Document Checklist</h4>
      <textarea name="checklist" placeholder="[x] Passport &amp; Photo Page&#10;[x] SINP Nomination Certificate&#10;[ ] Biometrics">${esc(checklistText)}</textarea>
      <p class="hint2">One item per line. Start a line with <code>[x]</code> for done, <code>[ ]</code> for pending.</p>
    </div>

    <div class="sec"><label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600"><input type="checkbox" name="notify" value="on"> Notify client of this update by email (sends their secure tracker link)</label>
      <p class="hint2">Tick this only when you want the client emailed about this change. The daily date refresh never emails.</p></div>
    <div class="sec"><button class="btn" style="max-width:240px">Save Client</button></div>
  </form>`;
  return page(editing ? ('Edit · ' + c.full_name) : 'Add Client', body);
}

// Paste SINP + IRCC status text copied from the portals.
function renderStatusForm(c) {
  const rowsToText = (a) => (a || []).map(r => `${r[0]} | ${r[1]}${r[2] ? (' | ' + r[2]) : ''}`).join('\n');
  const msgsToText = (a) => (a || []).map(m => `${m.date} | ${m.text}`).join('\n');
  let sinp = null, ircc = null;
  try { sinp = JSON.parse(c.sinp || 'null'); } catch (e) {}
  try { ircc = JSON.parse(c.ircc || 'null'); } catch (e) {}
  const section = (key, title, obj) => `
    <div class="sec"><h4>${title}</h4>
      <div class="field"><label>Synced (when you copied it)</label><input name="${key}_synced" value="${obj ? esc(obj.synced || '') : ''}" placeholder="Aug 11, 2026 · 9:02 AM"></div>
      <div class="field"><label>Status Rows</label>
        <textarea name="${key}_rows" placeholder="Application Status | We Are Processing Your Application | prog&#10;Review Of Eligibility | In Progress | prog&#10;Biometrics | Not Yet Started | wait">${obj ? esc(rowsToText(obj.rows)) : ''}</textarea>
        <p class="hint2">One per line: <code>Label | Value | state</code>. State optional: <code>done</code> (green), <code>prog</code> (blue), <code>wait</code> (grey).</p>
      </div>
      <div class="field"><label>Latest Update Messages</label>
        <textarea name="${key}_msgs" placeholder="Aug 6, 2026 | We received your application.&#10;Aug 11, 2026 | We are reviewing your eligibility.">${obj ? esc(msgsToText(obj.messages)) : ''}</textarea>
        <p class="hint2">One per line: <code>date | message</code>. Leave a whole section blank to clear that portal&rsquo;s status.</p>
      </div>
    </div>`;
  const body = `<a class="back" href="/admin">&lsaquo; Back to files</a>
  <form class="card form" method="POST" action="/admin/clients/${esc(c.id)}/status">
    <h1>Update Status</h1>
    <p class="sub">${esc(c.full_name)}: paste what you see in each portal.</p>
    ${section('sinp', 'SINP Status (OASIS)', sinp)}
    ${section('ircc', 'IRCC Status (Portal)', ircc)}
    <div class="sec">
      <label class="checkrow"><input type="checkbox" name="notify" ${c.client_email ? '' : 'disabled'}> Email the client that there is an update (sends a fresh secure link)</label>
      <p class="hint2">${c.client_email ? ('Sends to ' + esc(c.client_email) + '. Requires email to be configured on the server.') : 'Add a client email on the Edit screen to enable this.'}</p>
    </div>
    <div class="sec"><button class="btn" style="max-width:240px">Save Status</button></div>
  </form>`;
  return page('Update Status · ' + c.full_name, body);
}

function renderLinkIssued(c, link, qrDataUrl) {
  const body = `<a class="back" href="/admin">‹ Back to files</a>
  <div class="card gate" style="max-width:520px">
    <div class="mlabel">Client Access · Secure Link</div>
    <h3>${esc(c.full_name)}</h3>
    <p>Send this to your client. Scanning the QR (or opening the link) signs them in on their own phone; after that the address is just <b>${esc(process.env.BASE_URL || 'tracker.olcorp.ca')}</b>. They confirm date of birth to finish.</p>
    <div style="text-align:center;margin:8px 0 16px"><img src="${qrDataUrl}" alt="QR" style="width:190px;height:190px;border:1px solid var(--line);border-radius:12px;padding:8px;background:#fff"></div>
    <div class="linkcode">${esc(link)}</div>
    <div class="chips"><span>Single-use</span><span>Expires ${esc(process.env.LINK_TTL_HOURS || '72')}h</span><span>Device-bound</span></div>
    ${c.client_email
      ? `<form method="POST" action="/admin/clients/${esc(c.id)}/email-link" style="margin-top:16px"><button class="abtn" style="width:100%">Email this link to ${esc(c.client_email)}</button></form>`
      : `<p class="hint2" style="margin-top:16px">Add a client email on the Edit screen to email links directly.</p>`}
    <form method="POST" action="/admin/clients/${esc(c.id)}/revoke" style="margin-top:12px"><button class="signout">Revoke outstanding links & sessions</button></form>
  </div>`;
  return page('Access Link · ' + c.full_name, body);
}

module.exports = { renderLogin, renderVerify, renderTracker, renderAdmin, renderLog, renderLinkIssued, renderClientForm, renderStatusForm, page };
