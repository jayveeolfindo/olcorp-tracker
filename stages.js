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
  'temp-outside': TEMP_STAGES,
  'study-permit': STUDY_STAGES,
  'study-outside': STUDY_STAGES,
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
  // Applications filed from outside Canada get their own recommendation wording,
  // since maintained status and "continue working" language does not apply to a
  // foreign national who is still abroad. Marked by "outside Canada" in the stream.
  const isOutside = /outside\s+(?:of\s+)?canada|\(outside\)/i.test(s);
  // Distinct temporary-resident application types. Matched on specific stream
  // phrases before the generic extension rules, so existing WP/SP/VR extension
  // files keep their current tracks untouched.
  if (/super\s*visa/i.test(s)) return 'super-visa';
  if (/visitor\s*visa|temporary resident visa|\bTRV\b/i.test(s)) return 'visitor-visa';
  if (/stay extension|extend(?:ing|ed)?\s+(?:my\s+|your\s+|the\s+)?stay/i.test(s)) return 'stay-extension';
  if (/study permit/i.test(s) && !/extension/i.test(s)) return isOutside ? 'study-outside' : 'study-permit';
  const isTemp = /work permit|study permit|visitor|temporary|permit extension|\bWP\b|\bSP\b|\bVR\b/i.test(s);
  if (isTemp) return isSinp ? 'temp-sinp' : (isOutside ? 'temp-outside' : 'temp');
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
  eapr:    "Congratulations on reaching the permanent residence stage, this is a big milestone. Your PR application is now filed with IRCC. This is the longest part of the journey, usually around six months, so please settle in and let us do the watching. There is nothing you need to do right now. Just keep us posted if your address, family situation, or passport changes.",
  aor:     "Good news, IRCC has confirmed they have your application. There is nothing you need to do at the moment. The next thing to watch for is a biometrics request, so please tell us as soon as one arrives and we will guide you from there.",
  bio:     "Most clients receive a biometrics letter by email asking for fingerprints and a photo. If you get one, please book and complete your appointment as soon as you can, then let us know. We are glad to walk you through where to go and what to bring.",
  medical: "If IRCC emails you to request your medical, please complete it with an approved panel physician if you have not already. If you have not been asked, there is nothing to do for now. We are happy to help you find the nearest panel doctor.",
  bg:      "Your background and security check is now underway. This is the second longest stage, so please be patient, it is a normal and quiet part of the process. There is nothing you need to do while it runs, and we are keeping an eye on it for you.",
  decision:"You are almost there, and we are so close now. IRCC is finalizing your decision. Please keep your passport valid and your contact details current so nothing is delayed. We will coordinate your virtual landing and your PR card photo with you. If you had a PR photo taken within the last 12 months we can still use it; if not, please have a professional digital photo taken (a digital copy only, not a scan, and the back details are not needed). We will guide you through every step.",
  copr:    "Congratulations, this is the moment we have all been working toward. Please follow the landing instructions we will send you to complete your permanent residence and apply for your PR card. We could not be happier for you."
};

const RECS = {
  sinp: Object.assign({
    intake: "Welcome, and thank you for trusting us with your permanent residence journey. To get started, please send the documents on your Requirements Checklist so we can finish preparing and filing your application. If anything is unclear, just reach out, we are always here to help.",
    sinp:   "Your provincial nomination application is now with Saskatchewan, and we are monitoring it closely for you. In the meantime, please stay in touch with your employer, and keep preparing the rest of your Work Permit and PR requirements from your Requirements Checklist so we are ready to move the moment your nomination comes through.",
    nom:    "Congratulations on your provincial nomination, this is a big step forward and your permanent residence is now well within reach. There is nothing you need to do at this moment. We are now preparing your federal permanent residence application, and our target is to file it within about a week. Please keep the rest of your Requirements Checklist ready so we can submit without delay."
  }, PR_FED),
  express: Object.assign({
    intake: "Welcome, and thank you for choosing us for your permanent residence application. To get started, please send the documents on your Requirements Checklist so we can finish preparing and filing everything for you. Any questions along the way, we are here to help."
  }, PR_FED),
  'temp-sinp': {
    intake:    "Welcome, and thank you for trusting us with your work permit. Right now we are gathering and double checking your documents. The quickest way to help is to send everything on your Requirements Checklist as soon as you can, and we will take care of the preparation and filing from there. If anything is unclear, just ask, we are always happy to help.",
    support:   "Good progress. Saskatchewan is preparing your work permit support letter, which is an important piece of the puzzle. There is nothing you need to do at this moment. If your employer needs to confirm anything, we will reach out and guide you both through it.",
    submitted: "Your work permit application is now safely filed with IRCC, so you can relax at this stage. If your previous permit expired after we applied, the good news is that you may keep working under maintained status while you wait. Please just keep us posted if your job, address, or travel plans change.",
    bio:       "IRCC may email you a biometrics letter asking for your fingerprints and photo. If you receive one, please book and complete the appointment as soon as you can, then let us know. We are glad to walk you through where to go and what to bring.",
    process:   "Your application is in IRCC's hands and being reviewed, and you may continue working under maintained status if it applies to you. There is nothing you need to do right now. These reviews take time, so thank you for your patience while we keep an eye on it for you.",
    decision:  "You are almost there. IRCC is finalizing the decision on your work permit. Please make sure your passport stays valid and your contact details are current so nothing slows things down, and we will let you know the moment there is news.",
    issued:    "Wonderful news, your new work permit has been issued. Please look it over carefully to make sure every detail is correct, then send us a copy so we can update your file and confirm everything is in order."
  },
  temp: {
    intake:    "Welcome, and thank you for choosing us to handle your application. Right now we are gathering and checking your documents. The quickest way to help is to send everything on your Requirements Checklist, and we will take care of preparing and filing it. If anything is unclear, just reach out, we are here for you.",
    submitted: "Your application is now safely filed with IRCC, so you can relax at this stage. If your previous permit expired after we applied, you may keep working under maintained status while you wait. Please just let us know if your job, address, or travel plans change.",
    bio:       "IRCC may email you a biometrics letter asking for your fingerprints and photo. If you receive one, please book and complete the appointment as soon as you can, then let us know. We are glad to guide you through it.",
    process:   "Your application is being reviewed by IRCC, and you may continue under maintained status if it applies to you. There is nothing you need to do right now. Thank you for your patience while we keep watch on it for you.",
    decision:  "You are almost there. IRCC is finalizing the decision. Please keep your passport valid and your contact details current so nothing is delayed, and we will reach out as soon as we hear.",
    issued:    "Wonderful news, your new permit has been issued. Please review it carefully to make sure every detail is correct, then send us a copy so we can update your file."
  },
  'study-permit': {
    intake:    "Welcome, and congratulations on this exciting step toward studying in Canada. To get your study permit moving, please send the items on your Requirements Checklist, especially your letter of acceptance and proof of funds. Once we have those, we will prepare and file everything for you. Any questions at all, we are here to help.",
    submitted: "Your study permit application is filed with IRCC, nicely done. There is nothing you need to do right now, so take a breath. Please just let us know if your school plans, contact details, or travel dates change.",
    bio:       "IRCC may send you a biometrics letter by email asking for your fingerprints and photo. If it arrives, please complete the appointment as soon as you can and tell us. We will gladly guide you on where to go and what to bring.",
    medical:   "If IRCC emails you to ask for a medical exam, please complete it with an approved panel physician if you have not already. If you have not heard anything about a medical, there is nothing to do. We are happy to point you to the nearest panel doctor.",
    process:   "Your study permit application is now being reviewed by IRCC, and there is nothing further needed from you at this stage. Processing can take a little time, so thank you for your patience while we monitor it for you.",
    decision:  "You are almost at the finish line. IRCC is finalizing the decision. Please keep your passport valid and your contact details current so there are no delays, and we will reach out the moment we hear.",
    issued:    "Congratulations, your study permit or approval has been issued. Please review the details carefully and follow the arrival and next steps we will send you. We are excited for you."
  },
  'visitor-visa': {
    intake:    "Thank you for trusting us with your visitor visa. To get started, please send the documents on your Requirements Checklist, including the purpose of your trip and your proof of funds and ties to home. Once we have everything, we will prepare and file your application for you. Reach out anytime with questions.",
    submitted: "Your visitor visa application is filed with IRCC, all set for now. There is nothing you need to do at this stage, so please sit back and relax. Just let us know if your travel plans or contact details change.",
    bio:       "IRCC may email you a biometrics letter for your fingerprints and photo. If you receive one, please complete the appointment as soon as you can and let us know. We are happy to help you through it.",
    process:   "Your application is being reviewed by IRCC, and nothing is needed from you right now. Thank you for your patience while it is assessed. We are keeping watch on it for you.",
    decision:  "Almost done. If IRCC asks for your passport so your visa can be printed, please get it to us right away and we will arrange it quickly. Otherwise, there is nothing to do but wait for the good news.",
    issued:    "Great news, your visa has been issued. Please double check the details, and keep your passport safe and ready for your trip. Safe travels ahead."
  },
  'super-visa': {
    intake:    "Thank you for choosing us for your super visa. To move forward, please send the items on your Requirements Checklist, including your invitation letter, proof of funds, and your medical insurance. Once we have these, we will prepare and file everything for you. We are here for any questions along the way.",
    submitted: "Your super visa application is filed with IRCC, well done. There is nothing you need to do at this stage. Please just keep us informed if anything changes with your travel plans or contact details.",
    bio:       "IRCC may email you a biometrics letter for your fingerprints and photo. If one arrives, please complete the appointment as soon as you can and let us know. We will gladly guide you through it.",
    medical:   "A medical exam is required for the super visa. Please complete it with an approved panel physician, then let us know once it is done. We are happy to point you to the nearest panel doctor and explain what to expect.",
    process:   "Your super visa application is now being reviewed by IRCC, and there is nothing further needed from you right now. Thank you for your patience while we keep an eye on it for you.",
    decision:  "You are almost there. If IRCC asks for your passport so the visa can be printed, please send it to us right away and we will arrange it. Otherwise, simply wait for the good news.",
    issued:    "Wonderful news, your super visa has been issued. Please review the details, and keep your passport safe and ready for your visit to Canada."
  },
  'stay-extension': {
    intake:    "Thank you for letting us help you extend your stay in Canada. The best next step is to send the documents on your Requirements Checklist so we can prepare and file your application promptly. If anything is unclear, just reach out, we are always glad to help.",
    submitted: "Your application to extend your stay is filed with IRCC, so you are in good hands. Because we applied before your current status ended, you may remain in Canada under maintained status while you wait. Please just let us know if anything changes.",
    process:   "Your request is now being reviewed by IRCC, and you may continue under maintained status in the meantime. There is nothing you need to do right now. Thank you for your patience while we monitor it for you.",
    decision:  "Almost done. IRCC is finalizing the decision on your extension. Please keep your passport valid and your contact details current so nothing is delayed, and we will let you know as soon as we hear.",
    issued:    "Good news, your new visitor record has been issued. Please review it to make sure the details are correct, then send us a copy so we can update your file."
  },
  // Work permit filed from outside Canada. No maintained status or "keep working"
  // language, since the applicant is still abroad and has no Canadian status yet.
  'temp-outside': {
    intake:    "Welcome, and thank you for trusting us with your work permit application. Right now we are gathering and double checking your documents. The quickest way to help is to send everything on your Requirements Checklist as soon as you can, and we will take care of the preparation and filing from there. If anything is unclear, just ask, we are always happy to help.",
    submitted: "Your work permit application has been filed with IRCC, so you can relax at this stage. There is nothing you need to do right now. Please keep your passport valid, since IRCC may ask for it later to finalize your document, and let us know if your contact details or plans change.",
    bio:       "If IRCC emails you a biometrics letter, please book and give your fingerprints and photo at your nearest Visa Application Centre as soon as you can, then let us know. We are glad to guide you on where to go and what to bring.",
    process:   "Your application is being reviewed by IRCC. There is nothing you need to do right now. Please keep your passport valid and your contact details current, and if IRCC asks for your passport or any document we will guide you through it. Thank you for your patience while we keep watch on it for you.",
    decision:  "You are almost there. IRCC is finalizing the decision on your work permit. Please keep your passport valid and ready, since it may be requested so your document or entry visa can be issued, and we will reach out the moment we hear.",
    issued:    "Wonderful news, your work permit has been approved. IRCC will issue your Port of Entry Letter of Introduction, and your entry visa if one is required. Please send us a copy so we can review everything and guide you on your travel and arrival in Canada."
  },
  // Study permit filed from outside Canada. Same principle: no in-Canada status wording.
  'study-outside': {
    intake:    "Welcome, and congratulations on this exciting step toward studying in Canada. To get your study permit moving, please send the items on your Requirements Checklist, especially your letter of acceptance and proof of funds. Once we have those, we will prepare and file everything for you. Any questions at all, we are here to help.",
    submitted: "Your study permit application has been filed with IRCC, nicely done. There is nothing you need to do right now. Please keep your passport valid, since IRCC may ask for it later to finalize your document, and let us know if your school plans or contact details change.",
    bio:       "If IRCC emails you a biometrics letter, please give your fingerprints and photo at your nearest Visa Application Centre as soon as you can, then let us know. We will gladly guide you on where to go and what to bring.",
    medical:   "If IRCC asks for a medical exam, please complete it with an approved panel physician. If you have not been asked, there is nothing to do for now. We are happy to point you to the nearest panel doctor.",
    process:   "Your study permit application is being reviewed by IRCC, and there is nothing further needed from you at this stage. Please keep your passport valid and your contact details current, and if IRCC requests your passport or any document we will guide you. Thank you for your patience while we monitor it for you.",
    decision:  "You are almost at the finish line. IRCC is finalizing the decision on your study permit. Please keep your passport valid and ready, since it may be requested so your document or entry visa can be issued, and we will reach out the moment we hear.",
    issued:    "Congratulations, your study permit has been approved. IRCC will issue your Port of Entry Letter of Introduction, and your entry visa if one is required. Please send us a copy and follow the arrival and next steps we will send you. We are excited for you."
  }
};

// Appended to the intake step (and SINP nomination-approved step), before lodging.
const FEES_NOTE = " To keep your filing on schedule, it also helps to set aside your IRCC government application fees ahead of time, which you can find listed in your service agreement, so we can lodge your application without delay.";
// Appended to the post-filing waiting steps, where IRCC may occasionally email the client directly.
const IRCC_FWD = " IRCC usually sends updates to us, but once in a while they email you directly. If you ever receive anything from IRCC, please forward it to us right away so we can guide you on it and keep your file properly tracked.";
const FEES_KEYS = new Set(['intake', 'nom']);
const FWD_KEYS = new Set(['eapr', 'aor', 'bg', 'submitted', 'process']);

// Neutral holding message shown when a final decision has landed but we do not
// want the client to read the outcome from the tracker before we have spoken with
// them (for example a refusal, or any decision we need to walk them through). It
// never states the outcome; it asks them to contact the office.
const HOLD_REC = "A final decision has been made on your application. Please contact our office at your earliest convenience so we can review the decision with you in detail and go over your options for next steps. We are here to support you.";

function recFor(track, key) {
  if (key === 'hold') return HOLD_REC;
  const t = RECS[track] || RECS.sinp;
  if (!t[key]) return DEFAULT_REC;
  let s = t[key];
  if (FEES_KEYS.has(key)) s += FEES_NOTE;
  if (FWD_KEYS.has(key)) s += IRCC_FWD;
  return s;
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
