// Milestone definitions — shared by the DB seed and the renderer.
// Title Case labels; acronyms (SINP, IRCC, AOR, e-APR, PR, COPR, JAL) preserved.
//
// Four tracks, picked from the client's stream text:
//   - Permanent residence, SINP nominee ....... 'sinp'      (full 9-step provincial + federal)
//   - Permanent residence, no nomination ...... 'express'   (federal-only PR steps)
//   - Temporary residence (WP/SP/VR), SINP .... 'temp-sinp' (SINP support + permit steps)
//   - Temporary residence, no SINP ............ 'temp'      (permit steps only)

const SINP_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, employment records, and forms.' },
  { key: 'sinp',     t: 'SINP Application Filed',        d: 'Your provincial nomination application is submitted to Saskatchewan.' },
  { key: 'nom',      t: 'Provincial Nomination',         d: 'Saskatchewan issues the nomination certificate.' },
  { key: 'eapr',     t: 'e-APR Submitted to IRCC',       d: 'Permanent residence application filed federally in the PR Portal.' },
  { key: 'aor',      t: 'Acknowledgement of Receipt (AOR)', d: 'IRCC acknowledges receipt and links your file. This appears once the AOR is issued.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'medical',  t: 'Medical Exam',                  d: 'Upfront medical completed with a panel physician.' },
  { key: 'bg',       t: 'Background & Security Check',    d: 'IRCC completes eligibility and admissibility review.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'copr',     t: 'PR Confirmed (COPR)',           d: 'Confirmation of Permanent Residence issued.' }
];

const EXPRESS_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, employment records, and forms.' },
  { key: 'eapr',     t: 'e-APR Submitted to IRCC',       d: 'Permanent residence application filed federally in the PR Portal.' },
  { key: 'aor',      t: 'Acknowledgement of Receipt (AOR)', d: 'IRCC acknowledges receipt and links your file. This appears once the AOR is issued.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'medical',  t: 'Medical Exam',                  d: 'Upfront medical completed with a panel physician.' },
  { key: 'bg',       t: 'Background & Security Check',    d: 'IRCC completes eligibility and admissibility review.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'copr',     t: 'PR Confirmed (COPR)',           d: 'Confirmation of Permanent Residence issued.' }
];

// Temporary residence (work permit / study permit / visitor record extension), SINP-based.
const TEMP_SINP_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, employment records, and forms.' },
  { key: 'support',  t: 'SINP Work Permit Support Letter', d: 'Saskatchewan issues the work permit support letter.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your permit application is filed with IRCC.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured (if required).' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews eligibility and admissibility.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Permit Issued',                 d: 'Your new permit is issued.' }
];

// Temporary residence, no SINP support step.
const TEMP_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, employment records, and forms.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your permit application is filed with IRCC.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured (if required).' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews eligibility and admissibility.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Permit Issued',                 d: 'Your new permit is issued.' }
];

// Study Permit (new application, not an extension). Application number starts with S.
const STUDY_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, letter of acceptance, proof of funds, and forms.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your study permit application is filed with IRCC.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'medical',  t: 'Medical Exam (If Required)',    d: 'Immigration medical completed with a panel physician, if your program or length of stay requires it.' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews eligibility and admissibility.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Study Permit Issued',          d: 'Your study permit (or approval letter and entry document) is issued.' }
];

// Visitor Visa (Temporary Resident Visa / TRV). Application number starts with V.
const VISITOR_VISA_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, purpose of travel, and proof of ties and funds.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your visitor visa application is filed with IRCC.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews eligibility and admissibility.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Visa Issued',                   d: 'Your temporary resident visa is issued in your passport.' }
];

// Super Visa (parent/grandparent long-stay visa). Medical always required. Application number starts with V.
const SUPER_VISA_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, invitation, proof of funds, and insurance.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your super visa application is filed with IRCC.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'medical',  t: 'Medical Exam',                  d: 'Immigration medical completed with a panel physician (required for the super visa).' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews eligibility and admissibility.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Super Visa Issued',            d: 'Your super visa is issued in your passport.' }
];

// Stay Extension Application (extend your stay as a visitor / visitor record). Application number starts with V.
const STAY_EXT_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, current status, and reason for extending.' },
  { key: 'submitted',t: 'Application Submitted to IRCC', d: 'Your application to extend your stay is filed with IRCC.' },
  { key: 'process',  t: 'Application in Process',        d: 'IRCC reviews your request. You may remain in Canada under maintained status while it is processed.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'issued',   t: 'Visitor Record Issued',        d: 'Your new visitor record is issued.' }
];

const TRACKS = {
  'sinp': SINP_STAGES,
  'express': EXPRESS_STAGES,
  'temp-sinp': TEMP_SINP_STAGES,
  'temp': TEMP_STAGES,
  'study-permit': STUDY_STAGES,
  'visitor-visa': VISITOR_VISA_STAGES,
  'super-visa': SUPER_VISA_STAGES,
  'stay-extension': STAY_EXT_STAGES
};

// Union of every step across all tracks, deduped by key, in a sensible order.
// Used by the admin form so a file on any track can set its stage and dates.
const ALL_STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection' },
  { key: 'sinp',     t: 'SINP Application Filed' },
  { key: 'nom',      t: 'Provincial Nomination' },
  { key: 'eapr',     t: 'e-APR Submitted to IRCC' },
  { key: 'aor',      t: 'Acknowledgement of Receipt (AOR)' },
  { key: 'support',  t: 'SINP Work Permit Support Letter' },
  { key: 'submitted',t: 'Application Submitted to IRCC' },
  { key: 'bio',      t: 'Biometrics' },
  { key: 'medical',  t: 'Medical Exam' },
  { key: 'process',  t: 'Application in Process' },
  { key: 'bg',       t: 'Background & Security Check' },
  { key: 'decision', t: 'Final Decision' },
  { key: 'issued',   t: 'Permit / Visa Issued' },
  { key: 'copr',     t: 'PR Confirmed (COPR)' }
];

// Decide which track a client uses from their stream text.
function trackFor(stream) {
  const s = String(stream || '');
  const isSinp = /SINP/i.test(s);
  // Distinct temporary-resident application types. Matched on specific stream
  // phrases before the generic extension rules, so existing WP/SP/VR extension
  // files keep their current tracks untouched.
  if (/super\s*visa/i.test(s)) return 'super-visa';
  if (/visitor\s*visa|temporary resident visa|\bTRV\b/i.test(s)) return 'visitor-visa';
  if (/stay extension|extend(?:ing|ed)?\s+(?:my\s+|your\s+|the\s+)?stay/i.test(s)) return 'stay-extension';
  if (/study permit/i.test(s) && !/extension/i.test(s)) return 'study-permit';
  const isTemp = /work permit|study permit|visitor|temporary|permit extension|\bWP\b|\bSP\b|\bVR\b/i.test(s);
  if (isTemp) return isSinp ? 'temp-sinp' : 'temp';
  return isSinp ? 'sinp' : 'express';
}

function stagesFor(track) {
  return TRACKS[track] || SINP_STAGES;
}

// Per-step client recommendations shown in the "Recommended To Do As Of This
// Moment" panel. Keyed by track, then by stage key. recFor() falls back to the
// PR track and then to a generic line.
const DEFAULT_REC = "No action is needed from you right now. We are monitoring your file and will reach out if anything is required.";

const PR_FED = {
  eapr:    "No action needed. Your PR application is filed with IRCC. This is the longest stage, usually around six months, so please sit tight and let your consultant know if anything changes.",
  aor:     "No action needed. IRCC has your application. Watch for a biometrics request and tell us as soon as one arrives.",
  bio:     "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
  medical: "If IRCC requests it by email, complete your upfront medical with a panel physician if you have not already. Otherwise, no action is needed.",
  bg:      "No action needed. Your background and security check is underway. This is the second longest stage, so please be patient.",
  decision:"No action needed. IRCC is finalizing your decision. Please keep your passport valid and your contact details current. We will coordinate your virtual landing and PR card photo. If you took a PR photo within the last 12 months, we can still use it; if not, please have a professional digital photo taken (digital copy only, no scanned copy, and no back details needed).",
  copr:    "Congratulations. Please follow the landing instructions we send you to complete your PR and apply for your PR card."
};

const RECS = {
  sinp: Object.assign({
    intake: "Please send the documents we have asked for so we can finish preparing and filing your application.",
    sinp:   "Your nomination application is with Saskatchewan and we are monitoring it. Please coordinate with your employer, and keep preparing the rest of your Work Permit and PR requirements from your Requirements Checklist.",
    nom:    "Congratulations on clearing this first big step. Your Work Permit and PR are now well within reach. Please submit everything on your Requirements Checklist for the Work Permit (if applicable) and PR so we are ready to move quickly."
  }, PR_FED),
  express: Object.assign({
    intake: "Please send the documents we have asked for so we can finish preparing and filing your application."
  }, PR_FED),
  'temp-sinp': {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, so we can finish preparing and filing your work permit application.",
    support:   "Saskatchewan is issuing your work permit support letter. Please coordinate with your employer if we ask for anything, and keep the rest of your Requirements Checklist ready.",
    submitted: "No action needed. Your work permit application is filed with IRCC. If your previous permit expired after we applied, you may keep working under maintained status. Please inform your consultant if anything changes.",
    bio:       "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
    process:   "No action needed. IRCC is reviewing your work permit application. You may continue working under maintained status if it applies to you.",
    decision:  "No action needed. IRCC is finalizing your decision. Please keep your passport valid and your contact details current.",
    issued:    "Your new work permit is issued. Please review it for accuracy and send us a copy so we can update your file."
  },
  temp: {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, so we can finish preparing and filing your permit application.",
    submitted: "No action needed. Your permit application is filed with IRCC. If your previous permit expired after we applied, you may keep working under maintained status. Please inform your consultant if anything changes.",
    bio:       "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
    process:   "No action needed. IRCC is reviewing your application. You may continue under maintained status if it applies to you.",
    decision:  "No action needed. IRCC is finalizing your decision. Please keep your passport valid and your contact details current.",
    issued:    "Your new permit is issued. Please review it for accuracy and send us a copy so we can update your file."
  },
  'study-permit': {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, including your letter of acceptance and proof of funds, so we can finish preparing and filing your study permit application.",
    submitted: "No action needed. Your study permit application is filed with IRCC. Please inform your consultant if anything changes.",
    bio:       "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
    medical:   "If IRCC requests it by email, complete your medical with a panel physician if you have not already. Otherwise, no action is needed.",
    process:   "No action needed. IRCC is reviewing your study permit application.",
    decision:  "No action needed. IRCC is finalizing your decision. Please keep your passport valid and your contact details current.",
    issued:    "Your study permit or approval is issued. Please review the details and follow the arrival steps we send you."
  },
  'visitor-visa': {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, including your travel purpose and proof of funds and ties, so we can finish preparing and filing your visitor visa application.",
    submitted: "No action needed. Your visitor visa application is filed with IRCC. Please inform your consultant if anything changes.",
    bio:       "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
    process:   "No action needed. IRCC is reviewing your visitor visa application.",
    decision:  "No action needed yet. If IRCC asks for your passport, please send it to us right away so we can arrange your visa printing.",
    issued:    "Your visa is issued. Please check the details and keep your passport safe for travel."
  },
  'super-visa': {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, including your invitation letter, proof of funds, and medical insurance, so we can finish preparing and filing your super visa application.",
    submitted: "No action needed. Your super visa application is filed with IRCC. Please inform your consultant if anything changes.",
    bio:       "Most clients receive a biometrics letter by email. If you get one, please book and complete your appointment as soon as possible. We are glad to help.",
    medical:   "Complete your medical with a panel physician. This is required for the super visa, and we can guide you on where to go.",
    process:   "No action needed. IRCC is reviewing your super visa application.",
    decision:  "No action needed yet. If IRCC asks for your passport, please send it to us right away so we can arrange your visa printing.",
    issued:    "Your super visa is issued. Please check the details and keep your passport safe for travel."
  },
  'stay-extension': {
    intake:    "Please send the documents we have asked for, as listed in your Requirements Checklist, so we can finish preparing and filing your application to extend your stay.",
    submitted: "No action needed. Your application to extend your stay is filed with IRCC. You may remain in Canada under maintained status while it is processed. Please inform your consultant if anything changes.",
    process:   "No action needed. IRCC is reviewing your request, and you may continue under maintained status.",
    decision:  "No action needed. IRCC is finalizing your decision. Please keep your passport valid and your contact details current.",
    issued:    "Your new visitor record is issued. Please review it for accuracy and send us a copy so we can update your file."
  }
};

function recFor(track, key) {
  const t = RECS[track] || RECS.sinp;
  return t[key] || DEFAULT_REC;
}

module.exports.STAGES = SINP_STAGES;            // backward compatibility (admin forms, seed)
module.exports.SINP_STAGES = SINP_STAGES;
module.exports.EXPRESS_STAGES = EXPRESS_STAGES;
module.exports.TEMP_SINP_STAGES = TEMP_SINP_STAGES;
module.exports.TEMP_STAGES = TEMP_STAGES;
module.exports.STUDY_STAGES = STUDY_STAGES;
module.exports.VISITOR_VISA_STAGES = VISITOR_VISA_STAGES;
module.exports.SUPER_VISA_STAGES = SUPER_VISA_STAGES;
module.exports.STAY_EXT_STAGES = STAY_EXT_STAGES;
module.exports.ALL_STAGES = ALL_STAGES;
module.exports.TRACKS = TRACKS;
module.exports.trackFor = trackFor;
module.exports.stagesFor = stagesFor;
module.exports.recFor = recFor;
// stageIndex(key) works on the SINP set by default; pass a track for another set.
module.exports.stageIndex = (key, track) => stagesFor(track).findIndex(s => s.key === key);
