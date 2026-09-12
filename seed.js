// Seed sample clients so you can try the flows immediately.
// Run once:  node seed.js
const DB = require('./db');

const clients = [
  {
    id: 'ernalyn', uci: '11-0099-8877', dob: '1990-05-14', last: 'Reformina',
    full_name: 'Ernalyn Dabalos Reformina', stream: 'SINP · Permanent Residence',
    noc: 'NOC 33102 — Continuing Care Assistant', employer: 'Saskatchewan Health Authority',
    reference: 'SINP #1184278 · e-APR AOR Received', current_stage: 'eapr',
    status_label: 'AOR Received', next_action: 'Biometrics Instruction Letter (BIL)', updated_at: '2026-08-11',
    stage_dates: { intake: 'Mar 2026', sinp: 'Apr 18, 2026', nom: 'Jun 2, 2026', eapr: 'Aug 6, 2026 · AOR' },
    checklist: [
      { label: 'Passport & Photo Page', done: true }, { label: 'SINP Nomination Certificate', done: true },
      { label: 'Job Approval Letter (JAL)', done: true }, { label: 'IMM 0008 / 5406 / 5669 Signed', done: true },
      { label: 'Biometrics', done: false }, { label: 'Upfront Medical Exam', done: false }
    ],
    ircc: { synced: 'Aug 11, 2026 · 9:02 AM',
      rows: [['Application Status','We Are Processing Your Application','prog'],['Review Of Eligibility','In Progress','prog'],['Biometrics','Not Yet Started','wait'],['Medical Exam','Not Yet Started','wait'],['Background Check','Not Yet Started','wait'],['Final Decision','Not Started','wait']],
      messages: [{ date: 'Aug 6, 2026', text: 'We received your application for permanent residence.' }, { date: 'Aug 11, 2026', text: 'We are reviewing whether you meet the eligibility criteria.' }] },
    sinp: { synced: 'Jun 3, 2026',
      rows: [['Application Status','Nomination Approved','done'],['SINP File #','1184278'],['Stream','International Skilled Worker'],['Nomination Certificate','Issued · Jun 2, 2026','done']],
      messages: [{ date: 'Jun 2, 2026', text: 'Your nomination has been approved. A nomination certificate has been issued.' }] }
  },
  {
    id: 'delacruz', uci: '10-7743-9021', dob: '1985-03-27', last: 'Dela Cruz',
    full_name: 'Robert Dela Cruz', stream: 'SINP · Permanent Residence',
    noc: 'NOC 72400 — Heavy-Duty Equipment Mechanic', employer: 'Northline Equipment Ltd.',
    reference: 'Intake — Collecting Documents', current_stage: 'intake',
    status_label: 'Awaiting Client Docs', next_action: 'Reference Letters + ECA Report', updated_at: '2026-08-12',
    stage_dates: { intake: 'Aug 2026' },
    checklist: [
      { label: 'Passport & Photos', done: true }, { label: 'Trade Certification', done: true },
      { label: 'Reference Letters', done: false }, { label: 'ECA Report', done: false }, { label: 'Proof Of Funds', done: false }
    ]
  }
];

clients.forEach(c => DB.upsertClient(c));
console.log(`Seeded ${clients.length} clients.`);
console.log('Demo login (manual):  UCI 11-0099-8877 · DOB 1990-05-14 · Last name Reformina');
