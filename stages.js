// Milestone definitions — shared by the DB seed and the renderer.
// Title Case labels; acronyms (SINP, IRCC, AOR, e-APR, PR, COPR) preserved.
module.exports.STAGES = [
  { key: 'intake',   t: 'Intake & Document Collection', d: 'We gather and verify your identity documents, employment records, and forms.' },
  { key: 'sinp',     t: 'SINP Application Filed',        d: 'Your provincial nomination application is submitted to Saskatchewan.' },
  { key: 'nom',      t: 'Provincial Nomination',         d: 'Saskatchewan issues the nomination certificate.' },
  { key: 'eapr',     t: 'e-APR Submitted to IRCC',       d: 'Permanent residence application filed federally. Acknowledgement of Receipt (AOR) issued.' },
  { key: 'bio',      t: 'Biometrics',                    d: 'Fingerprints and photo captured at a collection point.' },
  { key: 'medical',  t: 'Medical Exam',                  d: 'Upfront medical completed with a panel physician.' },
  { key: 'bg',       t: 'Background & Security Check',    d: 'IRCC completes eligibility and admissibility review.' },
  { key: 'decision', t: 'Final Decision',                d: 'IRCC issues the decision on your application.' },
  { key: 'copr',     t: 'PR Confirmed (COPR)',           d: 'Confirmation of Permanent Residence issued.' }
];

module.exports.stageIndex = (key) => module.exports.STAGES.findIndex(s => s.key === key);
