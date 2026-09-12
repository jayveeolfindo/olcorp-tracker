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

const TRACKS = {
  'sinp': SINP_STAGES,
  'express': EXPRESS_STAGES,
  'temp-sinp': TEMP_SINP_STAGES,
  'temp': TEMP_STAGES
};

// Decide which track a client uses from their stream text.
function trackFor(stream) {
  const s = String(stream || '');
  const isSinp = /SINP/i.test(s);
  const isTemp = /work permit|study permit|visitor|temporary|permit extension|\bWP\b|\bSP\b|\bVR\b/i.test(s);
  if (isTemp) return isSinp ? 'temp-sinp' : 'temp';
  return isSinp ? 'sinp' : 'express';
}

function stagesFor(track) {
  return TRACKS[track] || SINP_STAGES;
}

module.exports.STAGES = SINP_STAGES;            // backward compatibility (admin forms, seed)
module.exports.SINP_STAGES = SINP_STAGES;
module.exports.EXPRESS_STAGES = EXPRESS_STAGES;
module.exports.TEMP_SINP_STAGES = TEMP_SINP_STAGES;
module.exports.TEMP_STAGES = TEMP_STAGES;
module.exports.TRACKS = TRACKS;
module.exports.trackFor = trackFor;
module.exports.stagesFor = stagesFor;
// stageIndex(key) works on the SINP set by default; pass a track for another set.
module.exports.stageIndex = (key, track) => stagesFor(track).findIndex(s => s.key === key);
