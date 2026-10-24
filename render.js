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
.brandlogo{height:120px;width:auto;display:block;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:20px 36px;box-shadow:var(--shadow)}
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
.substep{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px;margin-top:7px;font-size:11.5px;color:var(--muted)}
.substep .subdot{width:5px;height:5px;border-radius:50%;background:var(--green);flex:0 0 5px;align-self:center}
.substep .subdate{margin-left:auto;font-family:var(--mono);font-size:10px;letter-spacing:.5px;color:var(--faint);text-transform:uppercase;white-space:nowrap}
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
.wsent{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;color:#41762f;background:#eef4ea;border:1.5px solid #d7e6d0;border-radius:999px;padding:8px 14px}
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

// ---- client login (manual: UCI + DOB + representation start date) ----
function renderLogin({ error, locked } = {}) {
  const body = `
  <div class="card gate">
    <div class="mlabel">Secure Access</div>
    <h3>View Your Application</h3>
    <p>Enter the <strong>principal applicant's</strong> details exactly as they appear on your IRCC documents and your service agreement with us.</p>
    ${error ? `<div class="err">${esc(error)}</div>` : ''}
    <form method="POST" action="/login" ${locked ? 'style="opacity:.5;pointer-events:none"' : ''}>
      <div class="field"><label>UCI (Unique Client Identifier)</label>
        <input name="uci" inputmode="numeric" autocomplete="off" placeholder="0000-0000  or  00-0000-0000">
        <div class="hint">8 or 10 digits, dashes optional.</div></div>
      <div class="field"><label>Date of Birth</label>
        <input name="dob" inputmode="numeric" autocomplete="off" placeholder="YYYY-MM-DD" maxlength="10"></div>
      <div class="field"><label>First Invoice Number</label>
        <input name="inv" autocomplete="off" placeholder="e.g. 1042">
        <div class="hint">The number on your first invoice from us.</div></div>
      <button class="btn" ${locked ? 'disabled' : ''}>View My Application</button>
    </form>
  </div>
  <p class="note">This page shows only your own file. Your details are verified securely and are never included in the page address.</p>
  <script>var dobEl=document.querySelector('[name=dob]');if(dobEl)dobEl.addEventListener('input',function(e){var d=e.target.value.replace(/\\D/g,'').slice(0,8);var o=d.slice(0,4);if(d.length>4)o+='-'+d.slice(4,6);if(d.length>6)o+='-'+d.slice(6,8);e.target.value=o;});</script>`;
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
// Mask application / work permit numbers for client display: keep the leading
// letter prefix (W, S, V, EP) and the last 3 digits, replace each hidden digit
// with an asterisk. Works on a clean number or one embedded in a note.
function maskRef(r) {
  return String(r || '')
    .replace(/\b([A-Za-z]{1,2})(\d{4,})\b/g, (mm, p, d) => p + '*'.repeat(d.length - 3) + d.slice(-3))
    .replace(/\b(\d{5,})\b/g, d => '*'.repeat(d.length - 3) + d.slice(-3));
}

function appTypeLabel(c) {
  const track = trackFor(c.stream);
  if (track === 'study-permit' || track === 'study-outside') return 'Study Permit';
  if (track === 'visitor-visa')   return 'Visitor Visa';
  if (track === 'super-visa')     return 'Super Visa';
  if (track === 'stay-extension') return 'Stay Extension';
  if (track === 'temp-sinp' || track === 'temp' || track === 'temp-outside') {
    const s = String(c.stream || '') + ' ' + String(c.reference || '');
    // Files from outside Canada are new applications, not extensions.
    const ext = (track !== 'temp-outside');
    if (/study/i.test(s)) return ext ? 'Study Permit Extension' : 'Study Permit';
    if (/visitor|\bVR\b/i.test(s)) return ext ? 'Visitor Record Extension' : 'Visitor Record';
    return ext ? 'Work Permit Extension' : 'Work Permit';
  }
  return 'Permanent Residence';
}

// Reconcile the frozen IRCC panel (captured at the last portal sync) against the
// live stage, so the panel can never lag behind the timeline. A manual stage
// advance (e.g. marking biometrics done) moves the timeline immediately; this
// keeps the IRCC status rows and the latest-update line consistent with it,
// instead of still showing, say, "AOR Pending" after the AOR has landed.
// Rules: the AOR row and the summary follow the stage; the Final Decision row
// only reads "In Progress" when IRCC actually has a dated entry for it (else
// "Not Started"); the stale "awaiting AOR" note is dropped once AOR is in, and
// synthesized while it is genuinely still pending.
function reconcileIrcc(ircc, STG, ci, dates) {
  const idxOf = key => STG.findIndex(s => s.key === key);
  const aorIdx = idxOf('aor'), decIdx = idxOf('decision'), eaprIdx = idxOf('eapr');
  const past = key => { const i = idxOf(key); return i >= 0 && ci >= i; };
  // Approval reached: COPR issued (PR) or permit issued (TR). Once here the
  // whole federal review is finished, so the summary and Final Decision rows
  // must read Approved, not the frozen "in progress" captured at the last sync.
  const coprIdx = idxOf('copr'), issuedIdx = idxOf('issued');
  const approvedDone = (coprIdx >= 0 && ci >= coprIdx) || (issuedIdx >= 0 && ci >= issuedIdx);
  const norm = s => String(s || '').toLowerCase();
  const looksDone = v => /pass|complete|received|approved|\bmet\b|issued|done/i.test(String(v));
  const milestoneKey = label => {
    const l = norm(label);
    if (/acknowledgement of receipt|\baor\b/.test(l)) return 'aor';
    if (/biometric/.test(l)) return 'bio';
    if (/medical/.test(l)) return 'medical';
    if (/background/.test(l)) return 'bg';
    if (/final decision/.test(l)) return 'decision';
    return null;
  };
  const awaitingRe = /awaiting acknowledgement|awaiting aor|aor[^a-z]{0,12}pending/i;
  const submittedRe = /submitted in the ircc pr portal/i;

  // No synced panel: synthesize a minimal one once the e-APR has been filed.
  if (!ircc) {
    if (eaprIdx >= 0 && ci >= eaprIdx) ircc = { rows: [], messages: [] };
    else return null;
  }

  const finMsg = (ircc.messages || []).find(m => /final decision/i.test(m.text || ''));
  const finDate = finMsg ? finMsg.date
    : (dates.decision && !/^\s*est/i.test(String(dates.decision)) ? dates.decision : '');
  const aorVal = () => dates.aor ? ('Received · ' + dates.aor) : 'Received';

  let rows = (ircc.rows || []).map(r => {
    const label = r[0], value = r[1], state = r[2] || '', l = norm(label);
    if (/application status/.test(l)) {
      if (approvedDone) return [label, 'Application Approved', 'done'];
      if (past('aor') && /aor pending|awaiting|not .*acknowledg/i.test(value))
        return [label, 'We Are Processing Your Application', 'prog'];
      return r;
    }
    const mk = milestoneKey(label);
    if (!mk) return r; // leave eligibility and other real detail rows untouched
    if (mk === 'decision') {
      if (approvedDone) return [label, finDate ? 'Approved · ' + finDate : 'Approved', 'done'];
      if (past('decision')) return [label, 'In Progress', 'prog'];
      return finDate ? [label, 'In Progress · ' + finDate, 'prog'] : [label, 'Not Started', 'wait'];
    }
    if (mk === 'aor') return past('aor') ? [label, aorVal(), 'done'] : [label, 'Pending', 'wait'];
    const mi = idxOf(mk);
    if (mi < 0) return r;
    if (ci > mi) return looksDone(value) ? r : [label, 'Completed', 'done'];
    if (ci === mi) return looksDone(value) ? r : [label, 'In Progress', 'prog'];
    return [label, 'Not Started', 'wait']; // step not reached yet
  });

  // If there is no synced panel body at all, build a summary from the stage.
  if (!rows.length && eaprIdx >= 0 && ci >= eaprIdx) {
    if (approvedDone) {
      rows = [
        ['Application Status', 'Application Approved', 'done'],
        ['Final Decision', dates.decision && !/^\s*est/i.test(String(dates.decision)) ? 'Approved · ' + dates.decision : 'Approved', 'done']
      ];
    } else {
      const aorDone = past('aor');
      rows = [
        ['Application Status', aorDone ? 'We Are Processing Your Application' : 'e-APR Submitted, AOR Pending', 'prog'],
        ['Acknowledgement of Receipt (AOR)', aorDone ? aorVal() : 'Pending', aorDone ? 'done' : 'wait']
      ];
    }
  }

  let messages = (ircc.messages || []).slice();
  if (approvedDone) {
    // Drop the frozen "final decision in progress" / "awaiting AOR" lines and
    // lead with the approval, so the latest-update note matches the timeline.
    messages = messages.filter(m => {
      const t = m.text || '';
      return !awaitingRe.test(t) && !(/final decision/i.test(t) && /in progress|reached the final/i.test(t));
    });
    const isPRtrack = coprIdx >= 0;
    const appDate = isPRtrack ? (dates.copr || dates.decision || '') : (dates.issued || dates.decision || '');
    const appText = isPRtrack
      ? 'Your application for permanent residence has been approved. Confirmation of Permanent Residence (COPR) issued.'
      : 'Your application has been approved.';
    if (!messages.some(m => /approved/i.test(m.text || '')))
      messages.unshift({ date: appDate, text: appText });
  } else if (past('aor')) {
    messages = messages.filter(m => !awaitingRe.test(m.text || ''));
  } else if (eaprIdx >= 0 && ci >= eaprIdx) {
    if (!messages.some(m => awaitingRe.test(m.text || '') || submittedRe.test(m.text || '')))
      messages.unshift({ date: dates.eapr || '', text: 'Permanent residence application submitted in the IRCC PR Portal. Awaiting Acknowledgement of Receipt (AOR).' });
  }
  return { rows, messages };
}

// ===== Monochrome client-tracker theme (client-facing pages only; admin/login keep page()) =====
const MONO_CSS = `
:root{
  --bg:#ffffff; --ink:#141414; --ink-soft:#333333; --muted:#6e6e6e; --faint:#a2a2a2;
  --line:#ececec; --line2:#f4f4f4; --chip:#f5f5f5; --fill:#141414;
  --radius:18px;
  --shadow:0 1px 2px rgba(0,0,0,.03),0 10px 28px rgba(0,0,0,.05);
  --shadow-lg:0 2px 6px rgba(0,0,0,.04),0 22px 50px rgba(0,0,0,.08);
  --f:"Jost",-apple-system,system-ui,"Helvetica Neue",Arial,sans-serif;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--f);font-weight:400;-webkit-font-smoothing:antialiased;line-height:1.5}
.wrap{max-width:720px;margin:0 auto;padding:0 16px 56px}

.icon{width:19px;height:19px;flex:0 0 auto;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;display:inline-block;vertical-align:middle}


.brand{text-align:center;padding:24px 0 6px}
.brand .logo{width:310px;max-width:80%;height:auto;display:block;margin:0 auto 24px}
.kicker{font-size:10px;font-weight:500;letter-spacing:2.5px;color:var(--muted);text-transform:uppercase;margin-top:6px}
.cicc{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:600;letter-spacing:.3px;color:var(--ink-soft);background:var(--chip);border:1px solid var(--line);padding:7px 13px;border-radius:999px;margin-top:14px}
.cicc .icon{width:14px;height:14px}

.greet{padding:20px 2px 16px}
.greet h1{margin:0;font-size:26px;font-weight:500;letter-spacing:-.5px}
.greet p{margin:5px 0 0;color:var(--muted);font-size:13.5px}

.card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
.card + .card{margin-top:14px}

.hero{overflow:hidden;box-shadow:var(--shadow-lg)}
.hero-top{display:flex;gap:18px;align-items:center;padding:22px 22px 18px}
@media(max-width:520px){.hero-top{flex-direction:column;align-items:flex-start;gap:16px}}
.hero-info{flex:1;min-width:0}
.apptype{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--muted)}
.hero h2{margin:7px 0 2px;font-size:23px;font-weight:500;letter-spacing:-.3px}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;letter-spacing:.5px;padding:6px 11px;border-radius:8px;background:var(--chip);border:1px solid var(--line);color:var(--ink-soft)}
.chip .icon{width:13px;height:13px;color:var(--muted)}
.ring{position:relative;width:116px;height:116px;flex:0 0 116px}
.ring svg.r{transform:rotate(-90deg)}
.ring .pct{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ring .pct b{font-size:27px;font-weight:500;letter-spacing:-1px}
.ring .pct span{font-size:8.5px;font-weight:500;letter-spacing:1.4px;color:var(--faint);text-transform:uppercase;margin-top:2px}
.banner{display:flex;align-items:center;gap:12px;padding:15px 22px;border-top:1px solid var(--line2);background:#fafafa}
.banner .dot{width:9px;height:9px;border-radius:50%;background:var(--ink);box-shadow:0 0 0 4px rgba(20,20,20,.08);flex:0 0 9px}
.banner .btxt{flex:1;min-width:0}
.banner .blabel{font-size:9px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:var(--faint)}
.banner .bval{font-size:15.5px;font-weight:600;margin-top:2px}
.banner .bsync{font-size:9.5px;font-weight:500;letter-spacing:.5px;color:var(--faint);white-space:nowrap}

.celebrate{background:var(--ink);color:#fff;padding:28px 22px;text-align:center}
.celebrate .emblem{width:54px;height:54px;margin:0 auto 12px;border-radius:50%;border:1.5px solid rgba(255,255,255,.4);display:grid;place-items:center}
.celebrate .emblem .icon{width:26px;height:26px;stroke:#fff;stroke-width:1.5}
.celebrate h2{margin:4px 0 5px;font-size:23px;font-weight:500;letter-spacing:-.3px}
.celebrate p{margin:0 auto;max-width:390px;font-size:13.5px;opacity:.82;font-weight:300}

.next{display:flex;gap:14px;align-items:flex-start;padding:18px 20px}
.next .ic{flex:0 0 42px;height:42px;border-radius:12px;background:var(--chip);border:1px solid var(--line);color:var(--ink);display:grid;place-items:center}
.next .ic .icon{width:21px;height:21px}
.next .ntxt{flex:1;min-width:0}
.next .nlabel{font-size:9px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--faint)}
.next .nstep{font-size:15.5px;font-weight:600;margin:4px 0 2px}
.next .nmeta{font-size:12.5px;color:var(--muted)}
.pillflag{display:inline-flex;align-items:center;gap:6px;margin-top:11px;font-size:11.5px;font-weight:600;padding:6px 12px;border-radius:999px;border:1px solid var(--line);color:var(--ink-soft);background:var(--chip)}
.pillflag .icon{width:13px;height:13px}

.sec-h{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 6px}
.sec-h .t{font-size:13.5px;font-weight:600;letter-spacing:.2px}
.sec-h .meta{font-size:9.5px;font-weight:500;letter-spacing:1px;color:var(--faint);text-transform:uppercase}

.steps{padding:4px 22px 18px}
.step{display:flex;gap:16px;position:relative;padding:12px 0}
.step:not(:last-child)::before{content:"";position:absolute;left:14px;top:38px;bottom:-4px;width:1.5px;background:var(--line)}
.step.done:not(:last-child)::before{background:var(--ink)}
.step.current:not(:last-child)::before{background:linear-gradient(var(--ink),var(--line))}
.node{width:30px;height:30px;border-radius:50%;flex:0 0 30px;display:grid;place-items:center;font-size:12px;font-weight:600;border:1.5px solid var(--line);background:#fff;color:var(--faint);z-index:1}
.node .icon{width:16px;height:16px;stroke:#fff;stroke-width:2.6;display:block}
.step.done .node{background:var(--ink);border-color:var(--ink);color:#fff}
.step.current .node{background:#fff;border:2px solid var(--ink);color:var(--ink);box-shadow:0 0 0 5px rgba(20,20,20,.06)}
.step .body{padding-top:3px;min-width:0}
.step .t{font-size:14.5px;font-weight:600}
.step.pending .t{color:var(--faint)}
.step .d{font-size:12.5px;color:var(--muted);margin-top:3px;font-weight:400}
.when{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:10px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;color:var(--ink-soft);background:var(--chip);padding:4px 10px;border-radius:7px}
.when.cur{color:var(--ink);background:#ededed}
.when.est{color:var(--faint);background:#fff;border:1px dashed var(--line)}
.substep{display:flex;align-items:center;flex-wrap:wrap;gap:4px 10px;margin-top:9px;font-size:12px;color:var(--muted)}
.substep .subdot{width:5px;height:5px;border-radius:50%;background:var(--ink);flex:0 0 5px}
.substep .subdot.est{background:#fff;border:1px solid var(--faint)}
.substep .subdate{margin-left:auto;font-size:10px;font-weight:600;letter-spacing:.6px;color:var(--faint);text-transform:uppercase;white-space:nowrap}
.msg-h{padding:16px 22px 2px;font-size:9.5px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:var(--faint)}
.msg{display:flex;flex-direction:column;gap:3px;padding:12px 22px;border-top:1px solid var(--line2);font-size:12.5px;line-height:1.5;color:var(--ink-soft)}
.msg .md{font-size:9.5px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;color:var(--faint)}

.irow{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 22px;border-top:1px solid var(--line2);font-size:13.5px}
.irow:first-of-type{border-top:0}
.il{color:var(--muted)}
.badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;padding:4px 11px;border-radius:999px}
.badge.done{background:var(--ink);color:#fff}
.badge.prog{background:#fff;color:var(--ink);border:1.5px solid var(--ink)}
.badge.wait{background:var(--chip);color:var(--faint)}
.badge .icon{width:12px;height:12px;stroke-width:2.6}

.reassure{display:flex;gap:13px;align-items:center;padding:16px 20px;background:#fafafa;border:1px solid var(--line);border-radius:var(--radius);margin-top:14px}
.reassure .ic{flex:0 0 auto;color:var(--ink)}
.reassure .ic .icon{width:22px;height:22px}
.reassure .rt{font-size:12.5px;color:var(--muted);line-height:1.55}
.reassure .rt b{display:block;color:var(--ink);font-size:13px;margin-bottom:2px;font-weight:600}

.consult{display:flex;gap:14px;align-items:center;padding:18px 20px}
.avatar{flex:0 0 50px;height:50px;border-radius:50%;background:var(--ink);color:#fff;display:grid;place-items:center;font-size:16px;font-weight:500;letter-spacing:1px}
.consult .cn{font-weight:600;font-size:15px}
.consult .cr{font-size:10.5px;font-weight:500;letter-spacing:.6px;color:var(--muted);margin-top:2px}
.consult .cm{font-size:12px;color:var(--muted);margin-top:4px}
.actions{display:flex;gap:10px;padding:0 20px 18px;flex-wrap:wrap}
.btn{flex:1;min-width:150px;text-align:center;border-radius:999px;padding:14px 16px;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.btn.primary{background:var(--ink);color:#fff}
.btn.ghost{background:#fff;color:var(--ink);border:1.5px solid var(--line)}
.btn .icon{width:17px;height:17px}

.foot{text-align:center;font-size:11px;color:var(--faint);margin-top:24px;line-height:1.8;font-weight:400}
.foot .seal{font-weight:600;color:var(--muted);letter-spacing:.3px}
.foot .lock{display:inline-flex;align-items:center;gap:5px;margin-top:4px}
.foot .lock .icon{width:12px;height:12px}
`;
const MONO_DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <g id="i-check"><path d="M6 11.3l4 4 8-9"/></g>
  <g id="i-shield"><path d="M12 3l7 3v5.5c0 4-2.9 7-7 8.5-4.1-1.5-7-4.5-7-8.5V6z"/><path d="M9 12l2 2 4-4"/></g>
  <g id="i-mail"><rect x="3" y="5" width="18" height="14" rx="2.2"/><path d="m3.5 7.5 8.5 5.5 8.5-5.5"/></g>
  <g id="i-home"><path d="M3 10.5 12 4l9 6.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-5h4v5"/></g>
  <g id="i-eye"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></g>
  <g id="i-spark"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z"/><path d="M19 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/></g>
  <g id="i-message"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.3A8.5 8.5 0 1 1 21 11.5z"/></g>
  <g id="i-userplus"><path d="M15 20.5v-1.8a3.8 3.8 0 0 0-3.8-3.8H6.3A3.8 3.8 0 0 0 2.5 18.7v1.8"/><circle cx="8.7" cy="7.2" r="3.8"/><path d="M19 8v5M21.5 10.5h-5"/></g>
  <g id="i-doc"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></g>
  <g id="i-lock"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></g>
  <g id="i-folder"><path d="M3 7.5a2 2 0 0 1 2-2h3.8l2 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g>
  <g id="i-checklist"><rect x="4.5" y="5" width="15" height="16" rx="2.2"/><path d="M9 5V3.8h6V5"/><path d="m8.3 13 2 2 4-4.2"/></g>
</defs></svg>`;
const useIcon = (id) => `<svg class="icon" viewBox="0 0 24 24"><use href="#${id}"/></svg>`;
const firstNameOf = (full) => String(full || '').trim().split(/\s+/)[0] || '';
function monoPage(title, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>${MONO_CSS}</style></head><body>${MONO_DEFS}<div class="wrap">${body}</div></body></html>`;
}

function appBlock(c, idx, active, ctx = {}) {
  const track = trackFor(c.stream);
  const STG = stagesFor(track);
  // 'hold' is a neutral "final decision received, please contact our office" state.
  // It does not exist in any track's step list, so anchor the progress at the
  // Final Decision step and override the status label and recommendation below.
  const onHold = c.current_stage === 'hold';
  let ci = stageIndex(c.current_stage, track);
  if (onHold) { const di = STG.findIndex(s => s.key === 'decision'); ci = di >= 0 ? di : STG.length - 1; }
  else if (ci < 0) ci = 0;
  const dates = safeJSON(c.stage_dates, {});
  // On a PR file, surface the client's current work permit expiration whenever it
  // is set (for example the expiry of a newly issued permit), so it shows on the
  // PR page while the PR is still in process.
  const isPR = appTypeLabel(c) === 'Permanent Residence';
  const wpExpiry = isPR ? (dates.wp_expiry || null) : null;
  const checklist = safeJSON(c.checklist, []);
  // A terminal completion stage the file has reached (COPR issued, permit/visa
  // issued) is the end of the line: the whole bar fills solid green at 100%,
  // not a faded "current" final segment at 95%.
  const atTerminal = !onHold && !!STG[ci] && (STG[ci].key === 'copr' || STG[ci].key === 'issued');
  const seg = STG.map((s, i) => `<i class="${(i < ci || (atTerminal && i === ci)) ? 'on' : (i === ci ? 'cur' : '')}"></i>`).join('');
  const pct = atTerminal ? 100 : Math.round(((ci + 0.5) / STG.length) * 100);
  const isEstV = v => !!v && /^\s*est\.?\b/i.test(String(v));
  // --- Forward-projected estimates for not-yet-reached steps -------------------
  // Stored "Est." dates are typed once at intake and go stale: a past month reads
  // as overdue even when the file is on track. Instead, project each pending step
  // forward from the most recent REAL milestone on file (or today) using typical
  // IRCC stage gaps, and never display an estimate earlier than next month.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Empirical stage gaps, in DAYS, measured from Olcorp's own PR files (median day
  // gap between the two milestones; n = number of files it is based on). Weak ones
  // (n < 5) fall back to a conservative assumption, noted inline. Each step is
  // anchored (below) to the milestone the offset is measured from, not blindly to
  // the previous step, so the concurrent IRCC checks (pre-arrival, medical,
  // background, final decision) all project from biometrics instead of stacking.
  const OFF = {
    sinp: 14,        // assumption (intake -> SINP filing)
    nom: 13,         // n=36  SINP filed -> nomination
    eapr: 13,        // n=36  nomination -> e-APR
    support: 30,     // assumption
    aor: 205,        // n=10  e-APR -> AOR (~7 months)
    submitted: 14,   // assumption (temp)
    bio: 5,          // n=10  AOR -> biometrics
    prearrival: 37,  // n=9   biometrics -> pre-arrival letter
    medical: 56,     // n=6   biometrics -> medical
    process: 30,     // assumption (temp)
    bg: 60,          // assumption (concurrent with the other checks)
    decision: 57,    // n=7   biometrics -> final decision
    issued: 21,      // assumption (temp)
    copr: 56         // n=3, flagged by Jayvee as running ~2 months (was assuming 1)
  };
  const bioInTrack = STG.some(s => s.key === 'bio');
  // Each step anchors to the milestone its offset was measured from.
  const anchorKeyOf = (key, idx) => {
    if (bioInTrack && (key === 'prearrival' || key === 'medical' || key === 'bg' || key === 'decision')) return 'bio';
    if (key === 'copr' || key === 'issued') return 'decision';
    return idx > 0 ? STG[idx - 1].key : null;
  };
  const parseLoose = v => {
    if (!v) return null;
    const s = String(v).replace(/^\s*est\.?\s*/i, '').trim();
    let t = Date.parse(s);
    if (isNaN(t)) t = Date.parse('1 ' + s); // bare "Sep 2026" -> "1 Sep 2026"
    return isNaN(t) ? null : new Date(t);
  };
  const addMonths = (d, n) => { const x = new Date(d); x.setDate(1); x.setMonth(x.getMonth() + n); return x; };
  const fmtEst = d => 'Est. ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  // Background & Security Check timing, PR files only, when the step has no real
  // date on file. The background check starts right after biometrics and clears
  // just before a decision, so derive its date from the file's current stage:
  //   - At the Final Decision stage: show it DONE, dated one day before the Final
  //     Decision date (you cannot reach a decision without background clearing).
  //   - At the Background stage: show it IN PROGRESS, started the day after
  //     biometrics finished.
  // Files earlier than these are left untouched (a dateless check reads as pending).
  {
    const fmtMD = d => MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    const atDecision = !!STG[ci] && STG[ci].key === 'decision';
    const atBg = !!STG[ci] && STG[ci].key === 'bg';
    const bgReal = dates.bg && !isEstV(dates.bg);
    const decReal = dates.decision && !isEstV(dates.decision);
    const bioReal = dates.bio && !isEstV(dates.bio);
    if (isPR && !bgReal) {
      if (atDecision && decReal) {
        const d = parseLoose(dates.decision);
        if (d) { const b = new Date(d); b.setDate(b.getDate() - 1); dates.bg = fmtMD(b); }
      } else if (atBg && bioReal) {
        const d = parseLoose(dates.bio);
        if (d) { const b = new Date(d); b.setDate(b.getDate() + 1); dates.bg = fmtMD(b); }
      }
    }
  }
  // Project each not-yet-reached step by chaining the empirical day offsets from
  // the last real milestone. estDate(idx) returns a step's real date when on file,
  // otherwise its anchor's date (resolved recursively) plus that step's offset.
  const estAt = {};
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    let latest = null;
    for (let j = 0; j < STG.length; j++) {
      const dv = dates[STG[j].key];
      if (dv && !isEstV(dv)) { const p = parseLoose(dv); if (p && (!latest || p > latest)) latest = p; }
    }
    const latestRealOrToday = latest || today;
    const memo = {};
    const estDate = (idx) => {
      if (memo[idx]) return memo[idx];
      const key = STG[idx].key;
      const real = dates[key] && !isEstV(dates[key]) ? parseLoose(dates[key]) : null;
      if (real) { memo[idx] = real; return real; }
      const ak = anchorKeyOf(key, idx);
      let base = null;
      if (ak) { const ai = STG.findIndex(s => s.key === ak); if (ai >= 0 && ai !== idx) base = estDate(ai); }
      if (!base) base = latestRealOrToday;
      const d = addDays(base, OFF[key] != null ? OFF[key] : 30);
      memo[idx] = d; return d;
    };
    let prev = null;
    for (let j = ci + 1; j < STG.length; j++) {
      let d = estDate(j);
      if (d < nextMonth) d = new Date(nextMonth);
      if (prev && d < prev) d = new Date(prev); // keep the column non-decreasing
      prev = d;
      estAt[j] = fmtEst(d);
    }
  }
  // Pre-Arrival Services estimate: the invitation letter runs about 5 weeks after
  // biometrics in Olcorp's files (n=9), or about 6 weeks after AOR when biometrics
  // is not yet dated. Shown on the Pre-Arrival step whenever it has no real date,
  // only while the file is still in process (not yet at Final Decision), never a
  // past month.
  let preEst = '';
  {
    const decI = STG.findIndex(s => s.key === 'decision');
    const beforeDecision = decI < 0 || ci < decI;
    const bioD = parseLoose(dates.bio), aorD = parseLoose(dates.aor);
    if (beforeDecision && (bioD || aorD)) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      let est = bioD ? addDays(bioD, 37) : addDays(aorD, 42);
      if (est < nextMonth) est = new Date(nextMonth);
      preEst = fmtEst(est);
    }
  }
  let descs = STG.map((s, i) => {
    const dv = dates[s.key];
    // A terminal completion stage the file has reached (COPR issued, visa issued)
    // is DONE, not in progress: render it as a completed step showing its date,
    // never "In Progress".
    const terminalDone = (i === ci) && (s.key === 'issued' || s.key === 'copr');
    // Verification steps (Medical, Background, Pre-Arrival) run concurrently at
    // IRCC, not strictly in sequence, so the stage advancing past one is NOT proof
    // it finished. Only tick these as done when a date is actually on file; with no
    // date, show the step as a not-yet (pending) step even though the stage is
    // further along, so a dateless verification step never reads as completed. The
    // core sequential steps (intake, SINP, nomination, e-APR, AOR, biometrics,
    // final decision, COPR) still tick by stage, since reaching a later one proves
    // they happened.
    const hasRealDate = dv && !isEstV(dv);
    const VERIFY_STEP = (s.key === 'prearrival' || s.key === 'medical' || s.key === 'bg');
    const datelessOptional = VERIFY_STEP && (i < ci) && !hasRealDate;
    // A Final Decision date means pre-arrival has already played out: an Invitation
    // to Pre-Arrival Services that never arrived will not arrive now. So at the Final
    // Decision stage, show a dateless Pre-Arrival step as completed (ticked) with no
    // date, rather than leaving it pending or showing an estimate.
    const atDecisionStage = !!STG[ci] && STG[ci].key === 'decision';
    const preArrivalBlankDone = isPR && !onHold && atDecisionStage && s.key === 'prearrival' && !hasRealDate;
    const isDone = preArrivalBlankDone || ((i < ci || terminalDone) && !datelessOptional);
    const cls = preArrivalBlankDone ? 'done' : (datelessOptional ? 'pending' : (isDone ? 'done' : (i === ci ? 'current' : 'pending')));
    // The current step (medical, final decision, etc.) reads "In Progress" and,
    // when a real (non-estimate) date is on file, appends it: "In Progress · <date>".
    // The "In Progress ·" prefix keeps a dated Final Decision from reading to the
    // client as a finalized decision, while still showing when the stage started.
    // The one exception is a refusal hold: there the Final Decision has been
    // received, so its date shows plainly, never "In Progress".
    const isCurrent = (i === ci) && !terminalDone;
    const heldDecision = onHold && s.key === 'decision';
    let when, estStr = '';
    if (isCurrent && !heldDecision) {
      when = (dv && !isEstV(dv))
        ? `<div class="when">In Progress &middot; ${esc(dv)}</div>`
        : '<div class="when">In Progress</div>';
    } else if (s.key === 'prearrival' && !hasRealDate && !onHold && preEst) {
      // Pre-Arrival with no real date yet: show the AOR/biometrics-based estimate,
      // whether the stage has passed it or not yet reached it.
      estStr = preEst;
      when = `<div class="when est">${esc(preEst)}</div>`;
    } else if (i > ci && !onHold) {
      // not yet reached: show the forward-projected estimate (never a past month)
      estStr = estAt[i] || '';
      when = `<div class="when est">${esc(estStr)}</div>`;
    } else if (dv) {
      when = `<div class="when${isEstV(dv) ? ' est' : ''}">${esc(dv)}</div>`;
    } else {
      when = '';
    }
    // PR-only sub-steps: email-received milestones nested under their parent step.
    let subs = '';
    if (isPR) {
      const subRow = (label, dd, est) => `<div class="substep"><span class="subdot${est ? ' est' : ''}"></span><span>${esc(label)}</span><span class="subdate${est ? ' est' : ''}">${esc(dd)}</span></div>`;
      if (s.key === 'decision') {
        const tab1 = dates.pr_portal_tab1 && !isEstV(dates.pr_portal_tab1) ? dates.pr_portal_tab1 : '';
        if (tab1) subs += subRow('PR Portal Tab 1 Email Received', tab1);
        if (dates.pr_portal_tab2 && !isEstV(dates.pr_portal_tab2)) {
          subs += subRow('PR Portal Tab 2 Email Received', dates.pr_portal_tab2);
        } else if (tab1) {
          // Tab 2 typically arrives about 2 weeks after Tab 1; show an estimate until it does.
          const p = parseLoose(tab1);
          if (p) { const e = new Date(p); e.setDate(e.getDate() + 14); subs += subRow('PR Portal Tab 2 Email', 'Est. ' + MONTHS[e.getMonth()] + ' ' + e.getDate() + ', ' + e.getFullYear(), true); }
        }
      }
    }
    // Sort rank/time for the concurrent-checks cluster (below): done steps first in
    // real-date order, then the in-progress step, then still-expected ones by their
    // estimate. So a check that finished earlier never sits under one that has not.
    const rank = isDone ? 0 : (isCurrent ? 1 : 2);
    let sortTime;
    if (isDone) { const p = parseLoose(dv) || (preArrivalBlankDone ? (parseLoose(dates.bio) || parseLoose(dates.aor)) : null); sortTime = p ? p.getTime() : i; }
    else if (isCurrent) { sortTime = Date.now(); }
    else { const p = parseLoose(estStr); sortTime = p ? p.getTime() : Number.MAX_SAFE_INTEGER; }
    return { s, i, cls, isDone, isCurrent, when, subs, rank, sortTime, dv, estStr };
  });
  // Order the whole timeline by date, not by the fixed track order. Milestones do
  // not always happen in the template sequence: a representation-start date can
  // fall after biometrics, and a step that is in progress with a real start date
  // (for example Background, which begins right after biometrics) should sit ahead
  // of still-undated steps like the Pre-Arrival letter or Medical. Each step's
  // effective date is its real date when it has one (completed, or in progress),
  // otherwise its forward estimate, otherwise it carries forward from the step it
  // follows so a dateless step stays beside it. The sort is stable, so equal dates
  // keep their original order. The progress bar and percentage are unchanged (they
  // key off the stage, not this display order).
  {
    let lastEff = 0;
    for (let k = 0; k < descs.length; k++) {
      const d = descs[k];
      const real = (d.dv && !isEstV(d.dv)) ? parseLoose(d.dv) : null;
      const est = (!real && d.estStr) ? parseLoose(d.estStr) : null;
      d._eff = real ? real.getTime() : (est ? est.getTime() : (lastEff + 1));
      lastEff = d._eff;
    }
    descs = descs.map((d, i) => [d, i]).sort((a, b) => (a[0]._eff - b[0]._eff) || (a[1] - b[1])).map(x => x[0]);
  }
  const steps = descs.map((d, pos) => {
    const inner = d.isDone ? useIcon('i-check') : (pos + 1);
    let when = '';
    if (d.cls === 'current') {
      when = (d.dv && !isEstV(d.dv)) ? `<span class="when cur">In Progress &middot; ${esc(d.dv)}</span>` : '<span class="when cur">In Progress</span>';
    } else if (d.dv && !isEstV(d.dv)) {
      when = `<span class="when">${esc(d.dv)}</span>`;
    } else if (d.estStr) {
      when = `<span class="when est">${esc(d.estStr)}</span>`;
    }
    return `<div class="step ${d.cls}"><div class="node">${inner}</div><div class="body"><div class="t">${esc(d.s.t)}</div><div class="d">${esc(d.s.d)}</div>${when}${d.subs}</div></div>`;
  }).join('');
  const ircc = reconcileIrcc(safeJSON(c.ircc, null), STG, ci, dates);
  // ----- derived view data for the monochrome layout -----
  const appType = appTypeLabel(c);
  const isApproved = atTerminal; // reached COPR / permit issued
  const curStatus = onHold ? 'Final Decision Received' : STG[ci].t;
  const first = firstNameOf(c.full_name);
  const hasFamily = (dates.family === true || String(dates.family || '').toLowerCase() === 'true' || String(dates.family || '').toLowerCase() === 'yes');
  const reassure = recFor(track, onHold ? 'hold' : STG[ci].key);
  // what happens next: the next stage after the current, with its estimate
  let nextStep = '', nextMeta = '', nextIcon = 'i-mail', nextFlag = 'No action needed from you';
  if (onHold) { nextStep = 'Final Decision Received'; nextMeta = 'Please contact our office so we can review the decision with you.'; nextIcon = 'i-message'; nextFlag = 'Please contact our office'; }
  else if (!isApproved) {
    const ni = Math.min(ci + 1, STG.length - 1);
    nextStep = STG[ni].t;
    const est = estAt[ni];
    nextMeta = est ? ('Expected around ' + String(est).replace(/^Est\.\s*/i, '') + '.') : 'We will update you as soon as there is movement.';
    nextIcon = (STG[ni].key === 'copr' || STG[ni].key === 'issued') ? 'i-home' : 'i-mail';
    if (STG[ci].key === 'intake') nextFlag = 'Please send your documents';
  }
  // ----- monochrome IRCC panel -----
  const badge = x => x === 'done' ? 'done' : (x === 'prog' ? 'prog' : 'wait');
  const irccRows = ircc ? (ircc.rows || []).map(r => `<div class="irow"><span class="il">${esc(r[0])}</span><span class="badge ${badge(r[2])}">${r[2] === 'done' ? useIcon('i-check') : ''}${esc(r[1])}</span></div>`).join('') : '';
  const irccMsgs = (ircc && ircc.messages && ircc.messages.length) ? `<div class="msg-h">Latest Updates From IRCC</div>${ircc.messages.map(m => `<div class="msg"><span class="md">${esc(m.date)}</span><span>${esc(m.text)}</span></div>`).join('')}` : '';
  const irccBody = ircc ? (irccRows + irccMsgs) : `<div class="irow"><span class="il">No IRCC status yet. This appears once the e-APR is submitted to IRCC.</span></div>`;
  // ----- chips, ring, cards -----
  const chips = [];
  if (c.reference) chips.push(`<span class="chip">${useIcon('i-doc')} ${esc(maskRef(c.reference))}</span>`);
  if (wpExpiry) chips.push(`<span class="chip">Current Work Permit Expires &middot; ${esc(wpExpiry)}</span>`);
  const circ = (2 * Math.PI * 50).toFixed(1);
  const dashoff = (2 * Math.PI * 50 * (1 - pct / 100)).toFixed(1);
  const sync = esc(fmtSync(c.updated_at)).toUpperCase().replace(/-/g, ' ');
  const celebrate = isApproved ? `<div class="card" style="overflow:hidden"><div class="celebrate">
      <div class="emblem">${useIcon('i-spark')}</div>
      <h2>Congratulations, ${esc(first)}${hasFamily ? ' and family' : ''}!</h2>
      <p>Your permanent residence has been approved. Welcome to your new home country! Thank you for trusting us with your journey.</p></div></div>` : '';
  const nextCard = (!isApproved && nextStep) ? `<div class="card"><div class="next">
      <div class="ic">${useIcon(nextIcon)}</div>
      <div class="ntxt"><div class="nlabel">What happens next</div><div class="nstep">${esc(nextStep)}</div>
        <div class="nmeta">${esc(nextMeta)}</div>
        <span class="pillflag">${useIcon('i-check')} ${esc(nextFlag)}</span></div></div></div>` : '';
  const reassureCard = (!isApproved && reassure) ? `<div class="reassure"><div class="ic">${useIcon('i-eye')}</div>
      <div class="rt"><b>We are watching your file</b><span>${esc(reassure)}</span></div></div>` : '';
  return `<div class="appblock" data-app="${idx}"${active ? '' : ' style="display:none"'}>
  ${celebrate}
  <div class="card hero">
    <div class="hero-top">
      <div class="hero-info"><div class="apptype">${esc(appType)}</div><h2>${esc(c.full_name)}</h2>
        <div class="chips">${chips.join('')}</div></div>
      <div class="ring"><svg class="r" width="116" height="116" viewBox="0 0 116 116">
        <circle cx="58" cy="58" r="50" fill="none" stroke="#ededed" stroke-width="9"/>
        <circle cx="58" cy="58" r="50" fill="none" stroke="#141414" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dashoff}"/>
      </svg><div class="pct"><b>${pct}%</b><span>Step ${ci + 1} of ${STG.length}</span></div></div>
    </div>
    <div class="banner ${isApproved ? 'done' : ''}"><span class="dot"></span>
      <div class="btxt"><div class="blabel">Current Status</div><div class="bval">${esc(curStatus)}</div></div>
      <div class="bsync">SYNCED ${sync}</div></div>
  </div>
  ${nextCard}
  <div class="card"><div class="sec-h"><span class="t">Your Application Journey</span><span class="meta">${isApproved ? STG.length : Math.max(ci, 0)} of ${STG.length} complete</span></div>
    <div class="steps">${steps}</div></div>
  <div class="card"><div class="sec-h"><span class="t">IRCC Application Status</span><span class="meta">SYNCED ${sync}</span></div>${irccBody}</div>
  ${reassureCard}
  </div>`;
}

function renderTracker(input, opts = {}) {
  const list = Array.isArray(input) ? input.slice() : [input];
  if (!list.length) return monoPage('Application Tracker', '<div class="card"><div class="irow"><span class="il">No application on file.</span></div></div>');
  const person = list[0];
  const first = firstNameOf(person.full_name);
  const multi = list.length > 1;

  // Brand header: real logo, kicker, CICC Regulated seal.
  const brand = `<div class="brand">
    <img class="logo" src="/logo.png" alt="Olfindo Immigration Consulting Corporation (Olcorp.ca)">
    <div class="kicker">Client Application Tracker</div>
  </div>`;

  // Thin admin-preview / signed-in bar (mono, inline-styled; MONO_CSS has no .clientbar).
  const barCss = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 2px 14px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--chip);font-size:13px;color:var(--muted)';
  const linkCss = 'color:var(--ink);font-weight:600;text-decoration:none';
  const clientbar = opts.preview
    ? `<div style="${barCss}"><span>Admin preview &middot; exactly what <b style="color:var(--ink)">${esc(person.full_name)}</b> sees.</span><a style="${linkCss}" href="/admin">Back to Admin</a></div>`
    : `<div style="${barCss}"><span>Signed in &middot; <b style="color:var(--ink)">${esc(person.full_name)}</b></span><form method="POST" action="/logout" style="margin:0"><button style="${linkCss};background:none;border:0;cursor:pointer;font-family:inherit;font-size:13px">Sign out</button></form></div>`;

  // Greeting (per person). Subtitle adapts to the application type / count.
  let sub;
  if (multi) sub = 'Here is exactly where your applications stand today.';
  else {
    const t = appTypeLabel(person);
    sub = (t === 'Permanent Residence')
      ? 'Here is exactly where your permanent residence application stands today.'
      : `Here is exactly where your ${t.toLowerCase()} application stands today.`;
  }
  const greet = `<div class="greet"><h1>Hi ${esc(first)},</h1><p>${esc(sub)}</p></div>`;

  // App-type tabs (multi only), inline-styled mono pills.
  const tabWrap = 'display:flex;gap:8px;flex-wrap:wrap;margin:0 2px 16px';
  const tabs = multi
    ? `<div style="${tabWrap}">${list.map((c, i) => `<button class="apptab" data-target="${i}" style="font-family:inherit;font-size:13px;font-weight:500;padding:8px 16px;border-radius:999px;cursor:pointer;border:1px solid ${i === 0 ? 'var(--ink)' : 'var(--line)'};background:${i === 0 ? 'var(--ink)' : '#fff'};color:${i === 0 ? '#fff' : 'var(--muted)'}">${esc(appTypeLabel(c))}</button>`).join('')}</div>`
    : '';

  const hasExtApp = list.some(x => appTypeLabel(x) !== 'Permanent Residence');
  const blocks = list.map((c, i) => appBlock(c, i, i === 0, { hasExtApp })).join('');

  // Bottom action links. Shared Folder is a per-file link stored in
  // stage_dates.folder_url (the client's Google Drive folder); its button shows
  // only when a link is set on the file. Connect Directly always shows.
  let folderUrl = '';
  for (const c of list) {
    const d = safeJSON(c.stage_dates, {});
    if (!folderUrl && d.folder_url) { folderUrl = d.folder_url; break; }
  }

  // Consultant card.
  const consultant = `<div class="card" style="margin-top:14px">
    <div class="consult">
      <div class="avatar">JO</div>
      <div>
        <div class="cn">Jayvee Olfindo, RCIC</div>
        <div class="cr">CICC License # R711813 &middot; SINP License # 000996</div>
        <div class="cm">Olfindo Immigration Consulting Corporation (Olcorp.ca)</div>
      </div>
    </div>
    <div class="actions">
      <a class="btn primary" href="${esc(CONSULT_CHAT_URL)}" target="_blank" rel="noopener">${useIcon('i-message')} Chat Directly</a>
      ${folderUrl ? `<a class="btn ghost" href="${esc(folderUrl)}" target="_blank" rel="noopener">${useIcon('i-folder')} Shared Folder</a>` : ''}
    </div>
  </div>`;

  const foot = `<div class="foot">
    <span class="seal">OLFINDO IMMIGRATION CONSULTING CORPORATION</span><br>
    Regulated Canadian Immigration Consultant &middot; CICC License # R711813 &middot; SINP License # 000996<br>
    Regina &amp; Saskatoon, Saskatchewan &middot; consulting@olcorp.ca<br>
    <span class="lock">${useIcon('i-lock')} This page shows only your own file and is verified securely.</span>
  </div>`;

  const script = multi
    ? `<script>(function(){var tabs=document.querySelectorAll('.apptab'),blocks=document.querySelectorAll('.appblock');tabs.forEach(function(t){t.addEventListener('click',function(){var tgt=t.getAttribute('data-target');tabs.forEach(function(x){var on=x===t;x.style.borderColor=on?'var(--ink)':'var(--line)';x.style.background=on?'var(--ink)':'#fff';x.style.color=on?'#fff':'var(--muted)';});blocks.forEach(function(b){b.style.display=(b.getAttribute('data-app')===tgt)?'':'none';});});});})();</script>`
    : '';

  const body = `${brand}${clientbar}${greet}${tabs}${blocks}${consultant}${foot}${script}`;
  return monoPage(`${person.full_name} · Application Tracker`, body);
}

// ---- consultant admin ----
function renderAdmin(clients, archived = []) {
  const statusOf = c => {
    const st = stagesFor(trackFor(c.stream))[stageIndex(c.current_stage, trackFor(c.stream))];
    return st ? st.t : (c.current_stage === 'hold' ? 'Final Decision Received (On Hold)' : (c.current_stage || ''));
  };
  const rows = clients.map(c => {
    const statusText = statusOf(c);
    let sd = {}; try { sd = JSON.parse(c.stage_dates || '{}'); } catch (e) { sd = {}; }
    const wsent = sd.welcome_sent;
    let welcomeCell;
    if (!c.client_email) {
      welcomeCell = `<span class="abtn ghost" style="opacity:.5;cursor:not-allowed" title="No client email on file. Add one on the Edit screen to send a welcome.">Send welcome (no email)</span>`;
    } else if (wsent) {
      welcomeCell = `<span class="wsent" title="Welcome email sent ${esc(wsent)}">&#10003; Welcome sent &middot; ${esc(wsent)}</span>`
        + `<form method="POST" action="/admin/clients/${esc(c.id)}/welcome" style="margin:0" onsubmit="return confirm('Resend the welcome email with a fresh secure tracker link to ${esc(c.client_email)}?')"><button class="abtn ghost">Resend</button></form>`;
    } else {
      welcomeCell = `<form method="POST" action="/admin/clients/${esc(c.id)}/welcome" style="margin:0" onsubmit="return confirm('Send the welcome email with a secure tracker link to ${esc(c.client_email)}?')"><button class="abtn">Send welcome</button></form>`;
    }
    const hay = ((c.full_name || '') + ' ' + (c.noc || '') + ' ' + (c.status_label || '') + ' ' + statusText).toLowerCase();
    return `<div class="arow" data-search="${esc(hay)}" data-status="${esc(statusText)}">
      <div><div class="aname">${esc(c.full_name)}</div><div class="ameta">${esc(c.noc || '')}</div></div>
      <div><div class="ameta">${esc(statusText)}</div><div class="ameta">${esc(c.status_label || '')}</div></div>
      <div class="actions">
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/preview">View as client</a>
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/edit">Edit</a>
        <a class="abtn ghost" href="/admin/clients/${esc(c.id)}/status">Status</a>
        <a class="abtn" href="/admin/clients/${esc(c.id)}/link">Issue link &#9656;</a>
        ${welcomeCell}
        <form method="POST" action="/admin/clients/${esc(c.id)}/archive" style="margin:0"><button class="abtn ghost">Archive</button></form>
      </div>
    </div>`;
  }).join('');
  // Status filter: one entry per distinct stage, with a count, sorted by how many
  // clients sit at each stage (most common first).
  const counts = {};
  clients.forEach(c => { const s = statusOf(c); counts[s] = (counts[s] || 0) + 1; });
  const statusOptions = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b))
    .map(s => `<option value="${esc(s)}">${esc(s)} (${counts[s]})</option>`).join('');
  const colHead = `<div class="arowhead"><div>Client</div><div>Status</div><div style="text-align:right">Actions</div></div>`;
  const filterBar = `<div class="filterbar">
    <input id="cliSearch" type="search" placeholder="Search name, status, NOC..." autocomplete="off">
    <select id="cliStatus"><option value="">All statuses (${clients.length})</option>${statusOptions}</select>
    <span id="cliCount" class="fcount"></span>
  </div>`;
  const filterCss = `<style>
    .filterbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 2px 14px}
    .filterbar input,.filterbar select{font-family:var(--sans);font-size:13px;border:1.5px solid var(--line);border-radius:10px;padding:10px 12px;outline:none;background:#fff}
    .filterbar input{flex:1;min-width:180px}.filterbar input:focus,.filterbar select:focus{border-color:var(--green)}
    .fcount{font-size:12px;color:var(--faint);white-space:nowrap}
    .arowhead{display:grid;grid-template-columns:1.6fr 1.4fr auto;gap:14px;padding:11px 18px;border-bottom:1px solid var(--line);font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--faint)}
    @media(max-width:700px){.arowhead{display:none}}
  </style>`;
  const filterJs = `<script>(function(){
    var q=document.getElementById('cliSearch'),sel=document.getElementById('cliStatus'),cnt=document.getElementById('cliCount');
    var rows=[].slice.call(document.querySelectorAll('.arow[data-search]'));
    function apply(){var t=(q.value||'').toLowerCase().trim(),s=sel.value,n=0;
      rows.forEach(function(r){var ok=(!t||r.getAttribute('data-search').indexOf(t)>=0)&&(!s||r.getAttribute('data-status')===s);r.style.display=ok?'':'none';if(ok)n++;});
      cnt.textContent=n+' of '+rows.length+' shown';}
    q.addEventListener('input',apply);sel.addEventListener('change',apply);apply();
  })();</script>`;
  const archivedRows = archived.map(c => `<div class="arow arch">
      <div><div class="aname">${esc(c.full_name)}</div><div class="ameta">${esc(c.noc || '')}</div></div>
      <div><div class="ameta">Archived</div></div>
      <div class="actions">
        <form method="POST" action="/admin/clients/${esc(c.id)}/restore" style="margin:0"><button class="abtn ghost">Restore</button></form>
        <form method="POST" action="/admin/clients/${esc(c.id)}/delete" style="margin:0" onsubmit="return confirm('Permanently delete ${esc(c.full_name)} and all their access records? This cannot be undone.')"><button class="abtn ghost" style="color:#b23c30;border-color:#f2ccc8">Delete</button></form>
      </div>
    </div>`).join('');
  const body = `${filterCss}<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px"><h1>Consultant · Active Files</h1>
    <span style="display:flex;gap:8px"><a class="abtn ghost" href="/admin/log">Access log</a><a class="abtn" href="/admin/clients/new">+ Add Client</a></span></div>
  <p class="sub">Add or edit a client, paste their SINP/IRCC status, and issue a one-time secure link (QR) or email it to the client.</p>
  ${filterBar}
  <div class="card">${colHead}${rows || '<div class="arow"><div class="ameta">No active clients yet. Click &ldquo;Add Client&rdquo; to create one.</div></div>'}</div>
  ${archived.length ? `<h1 style="font-size:16px;margin-top:26px">Archived Files</h1><div class="card">${archivedRows}</div>` : ''}
  ${filterJs}`;
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
    <p class="sub">${editing ? esc(c.full_name) : 'The login keys are UCI, date of birth, and the First Invoice Number (set below). Last name is kept for the record and to group a person&rsquo;s files.'}</p>

    <div class="sec"><h4>Identity &amp; Login</h4>
      <div class="field"><label>Full Name</label><input name="full_name" value="${v('full_name')}" required></div>
      <div class="row2">
        <div class="field"><label>UCI (8 or 10 digits)</label><input name="uci" value="${editing ? esc(c.uci_norm) : ''}" placeholder="0000-0000 or 00-0000-0000" required></div>
        <div class="field"><label>Date of Birth</label><input name="dob" value="${v('dob')}" placeholder="YYYY-MM-DD" required></div>
      </div>
      <div class="field"><label>Principal Applicant&rsquo;s Last Name</label><input name="last" value="${editing ? esc(c.last_norm) : ''}" required></div>
      <div class="field"><label>Client Email <span class="hint2">(for update notifications, optional)</span></label><input name="client_email" type="email" value="${editing ? esc(c.client_email || '') : ''}" placeholder="client@example.com"></div>
      <div class="field"><label>First Invoice Number <span class="hint2">(login key; exactly as it appears on the client&rsquo;s first invoice)</span></label><input name="invoice_no" value="${esc(dates.invoice_no || '')}" placeholder="e.g. 1042"></div>
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
      <div class="field"><label>Current Work Permit Expiration <span class="hint2">(shown on a PR file whenever set, e.g. the expiry of a newly issued permit; leave blank to hide)</span></label><input name="wp_expiry" value="${esc(dates.wp_expiry || '')}" placeholder="e.g. Oct 18, 2027"></div>
      <div class="row2">
        <div class="field"><label>PR Portal Tab 1 Email Received <span class="hint2">(sub-step under Final Decision)</span></label><input name="stage_pr_portal_tab1" value="${esc(dates.pr_portal_tab1 || '')}" placeholder="e.g. Dec 1, 2026"></div>
        <div class="field"><label>PR Portal Tab 2 Email Received <span class="hint2">(sub-step under Final Decision)</span></label><input name="stage_pr_portal_tab2" value="${esc(dates.pr_portal_tab2 || '')}" placeholder="e.g. Dec 15, 2026"></div>
      </div>
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
