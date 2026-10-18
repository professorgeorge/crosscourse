// Fictional sample partnership used to explore the app. Institutions and people are invented.
import * as S from './store.js';

export function demoProject() {
  const p = S.blankProject('Flood risk on two coasts');
  p.mode = 'module';
  const ago = h => new Date(Date.now() - h * 3600000).toISOString();
  const us = S.blankPartner({
    id: 'ptn_us', name: 'Dr. Maya Thompson', email: 'm.thompson@example.edu', institution: 'Gulf Coast State University', country: 'United States', timezone: 'America/Chicago', language: 'English',
    workStart: '08:00', workEnd: '17:00', flexStart: '07:00', flexEnd: '20:00',
    contributes: 'Policy-evaluation methods, access to FEMA and state hazard-mitigation plans, students who have lived through recent hurricane seasons.',
    course: {
      title: 'Environmental Policy Analysis', code: 'POL 340', level: 'Upper-division undergraduate', discipline: 'Political science / environmental policy', studentsCount: 28,
      purpose: 'Students learn to evaluate environmental policies using evidence, cost-benefit reasoning and stakeholder analysis.',
      priorities: 'Policy evaluation, evidence quality, stakeholder mapping', interculturalAims: 'Recognise how “good policy” is defined differently in other governance contexts.',
      languages: 'English. Some heritage Spanish speakers; no Portuguese.', termStart: '2027-01-12', termEnd: '2027-05-02', studentAvailability: 'Tue/Thu class 10:00-11:15; many students work afternoons.',
      workloadHoursPerWeek: 4, tech: 'Canvas, Zoom, Microsoft Teams', techRestrictions: 'University policy discourages WhatsApp for graded coursework.',
      assessmentObligations: 'Department requires an individual written component worth ≥ 20% of any group grade.', accessibility: 'Captioning required for recorded video; two students use screen readers.',
      careTopics: 'Displacement after storms can be personal for some students.', constraints: 'Final exams 26 Apr - 2 May.', hopes: 'Learn participatory approaches used in Brazilian planning.',
      breaks: [{ id: 'brk_us1', label: 'Spring break', start: '2027-03-08', end: '2027-03-12' }, { id: 'brk_us2', label: 'Final exams', start: '2027-04-26', end: '2027-05-02' }],
      localOutcomes: [{ id: 'lo_us1', text: 'Evaluate a public policy using explicit criteria and evidence.' }, { id: 'lo_us2', text: 'Analyse stakeholder interests in environmental decisions.' }, { id: 'lo_us3', text: 'Communicate policy recommendations to a non-specialist audience.' }]
    },
    fieldStates: { title: 'confirmed', purpose: 'confirmed', termStart: 'confirmed', termEnd: 'confirmed', techRestrictions: 'confirmed', assessmentObligations: 'confirmed' }
  }, 0);
  const br = S.blankPartner({
    id: 'ptn_br', name: 'Profa. Ana Beatriz Souza', email: 'ana.souza@example.br', institution: 'Universidade Federal do Litoral', country: 'Brazil', timezone: 'America/Recife', language: 'Portuguese',
    workStart: '08:00', workEnd: '18:00', flexStart: '07:00', flexEnd: '21:00',
    contributes: 'Community-based research methods, links with a neighbourhood association in a flood-prone area, experience with participatory budgeting.',
    course: {
      title: 'Desenvolvimento Sustentável e Território', code: 'DST 2041', level: 'Undergraduate, 3rd year', discipline: 'Sustainable development / urban planning', studentsCount: 32,
      purpose: 'Students examine how development interventions affect communities and territories, with emphasis on participation and local knowledge.',
      priorities: 'Community impacts, participatory methods, environmental justice', interculturalAims: 'Question assumptions about whose knowledge counts in planning.',
      languages: 'Portuguese; intermediate English for most students; reading in English is easier than speaking.', termStart: '2027-02-22', termEnd: '2027-07-03',
      studentAvailability: 'Evening programme: classes 19:00-22:00; many students work during the day.', workloadHoursPerWeek: 3,
      tech: 'Moodle, Google Meet, WhatsApp', techRestrictions: 'Limited bandwidth for some students; mobile-first.',
      assessmentObligations: 'Grades out of 10; final grade combines two evaluations (N1, N2).', accessibility: 'Low-bandwidth alternatives needed; one student is hard of hearing.',
      careTopics: 'Some students live in the affected neighbourhood.', constraints: 'Fieldwork requires ethics clearance if students interview residents.', hopes: 'Bring policy-evaluation tools to community work.',
      breaks: [{ id: 'brk_br1', label: 'Semana Santa', start: '2027-03-25', end: '2027-03-28' }],
      localOutcomes: [{ id: 'lo_br1', text: 'Analisar impactos socioambientais de intervenções no território.' }, { id: 'lo_br2', text: 'Aplicar métodos participativos de diagnóstico.' }, { id: 'lo_br3', text: 'Propor alternativas de desenvolvimento com base em evidências.' }]
    },
    fieldStates: { title: 'confirmed', purpose: 'confirmed', termStart: 'extracted', termEnd: 'extracted', studentAvailability: 'confirmed', languages: 'confirmed' }
  }, 1);
  p.partners = [us, br];
  p.brief = { id: 'brief', challenge: 'Evaluating flood-risk interventions across two coasts', question: 'How should communities evaluate a flood-risk intervention when its benefits, costs and evidence are understood differently?', whyInternational: 'Each cohort holds situated evidence (local plans, community accounts) the other cannot access, and each brings an evaluation tradition the other lacks.', counterfactual: 'Without the Brazilian cohort, U.S. students could not test their criteria against participatory evidence; without the U.S. cohort, Brazilian students would lack the comparative policy-evaluation lens.', status: 'approved', updatedAt: ago(200), updatedBy: 'ptn_us' };
  Object.assign(p.charter, { purpose: 'Students jointly evaluate flood-risk interventions, using evidence from both coasts.', decisionRights: 'Shared outcomes, deliverables and schedule: both representatives. Local grading: each professor.', responseDays: 3, languages: 'Partner discussion in English with Portuguese glossary; students may draft in either language; final artifact bilingual summary.', division: 'Maya drafts rubrics and the policy toolkit; Ana drafts community-evidence guidance and facilitates live sessions in Recife-friendly hours.', studentComms: 'Each professor communicates with their own students; shared announcements go through the joint Padlet.', attribution: 'Materials CC BY-NC; both partners credited.', disagreements: 'Write options as a decision in Crosscourse; meet live if unresolved after one week.', withdrawal: 'Two weeks’ notice where possible.', cohortLoss: 'Use archived partner dossiers and instructor-mediated exchange so no student is penalised.', status: 'approved', updatedAt: ago(180), updatedBy: 'ptn_br' });
  const o1 = 'out_1', o2 = 'out_2', o3 = 'out_3';
  p.outcomes = [
    { id: o1, text: 'Students will be able to compare how flood-risk interventions are evaluated in two national contexts, using evidence from both.', type: 'disciplinary', evidence: 'Joint evaluation framework applied to both cases', mappings: { ptn_us: ['lo_us1'], ptn_br: ['lo_br1', 'lo_br3'] }, status: 'approved', updatedAt: ago(150), updatedBy: 'ptn_us' },
    { id: o2, text: 'Students will be able to explain how their own context shapes what they treat as credible evidence, and revise an interpretation after engaging partners’ evidence.', type: 'intercultural', evidence: 'Individual reflection with before/after interpretation', mappings: { ptn_us: ['lo_us2'], ptn_br: ['lo_br2'] }, status: 'approved', updatedAt: ago(150), updatedBy: 'ptn_br' },
    { id: o3, text: 'Students will be able to negotiate roles, timelines and disagreements in a bilingual team to produce a shared recommendation.', type: 'intercultural', evidence: 'Team agreement, process log, peer feedback', mappings: { ptn_us: ['lo_us3'], ptn_br: [] }, status: 'draft', updatedAt: ago(30), updatedBy: 'ptn_br' }
  ];
  const both = ['ptn_us', 'ptn_br'];
  const A = (id, title, stage, start, end, sync, owner, contributions, dependsOn, outcomes, extra = {}) => Object.assign({ id, title, stage, summary: '', instructions: '', sync, start, end, participants: both, contributions, workload: { ptn_us: 3, ptn_br: 3 }, owner, dependsOn, outcomes, tools: 'Padlet, shared Google Drive', contingency: '', accessibility: '', evidence: {}, status: 'draft', updatedAt: ago(40), updatedBy: owner }, extra);
  p.activities = [
    A('act_1', 'Team introductions & working agreement', 'trust', '2027-02-23', '2027-03-02', true, 'ptn_br', { ptn_us: 'Short video introducing themselves and a place affected by flooding', ptn_br: 'Short video introducing themselves and their neighbourhood' }, [], [o3], { summary: 'Mixed teams of 6 meet once live and agree communication norms.', contingency: 'Asynchronous video introductions on Padlet for anyone who cannot attend.', accessibility: 'Captioned videos; low-bandwidth audio-only option.', workload: { ptn_us: 2, ptn_br: 2 }, status: 'approved', instructions: '## Meet your team\n\n1. Record a 2-minute video (captions on).\n2. Watch your teammates’ videos and reply to two.\n3. Agree your team’s communication norms in the shared document.' }),
    A('act_2', 'Local case dossier', 'local', '2027-03-03', '2027-03-19', false, 'ptn_us', { ptn_us: 'Dossier on a Gulf Coast levee/buyout programme incl. official evaluation documents', ptn_br: 'Dossier on a drainage-channel project with community accounts gathered with the neighbourhood association' }, ['act_1'], [o1], { summary: 'Each cohort documents a local intervention and the limits of its evidence.', contingency: 'Instructor-curated dossier from a previous term.', accessibility: 'Dossier template works on mobile; audio submissions accepted.', workload: { ptn_us: 5, ptn_br: 5 }, evidence: { types: 'Official plans, local news, community testimony (with consent), peer-reviewed studies', translation: 'Summaries in English; originals linked', conflicting: 'Record competing claims side by side', consensus: 'no', uncertainty: 'Mark claims as documented / reported / contested' } }),
    A('act_3', 'Cross-context comparison', 'compare', '2027-03-22', '2027-04-02', false, 'ptn_br', { ptn_us: 'Questions and observations about the Brazilian dossier', ptn_br: 'Questions and observations about the U.S. dossier' }, ['act_2'], [o1, o2], { summary: 'Teams map similarities, differences and assumptions across both dossiers.', accessibility: 'Bilingual prompt sheet.' }),
    A('act_4', 'Reciprocal critique', 'critique', '2027-04-01', '2027-04-09', true, 'ptn_us', { ptn_us: 'Critique of the Brazilian group’s interpretation', ptn_br: '' }, ['act_3'], [o2], { summary: 'Each group tests the other’s interpretation in a live session.', contingency: 'Written critique exchange if the live session fails.' }),
    A('act_5', 'Joint evaluation framework', 'cocreate', '2027-04-12', '2027-04-25', false, 'ptn_us', { ptn_us: 'Apply the framework to the Gulf Coast case and revise criteria', ptn_br: 'Apply the framework to the drainage case and revise criteria' }, ['act_4'], [o1, o3], { summary: 'Teams build one framework and apply it to both cases, documenting what remains contested.', contingency: 'Instructor-mediated exchange of drafts.', accessibility: 'Shared doc with comment threads in either language.', workload: { ptn_us: 6, ptn_br: 6 } }),
    A('act_6', 'Reflection: what changed and what remains contested', 'reflect', '2027-04-26', '2027-04-30', false, 'ptn_br', { ptn_us: 'Individual reflection', ptn_br: 'Individual reflection' }, ['act_5'], [o2], { summary: 'Individual reflection on revised thinking.', workload: { ptn_us: 2, ptn_br: 2 } })
  ];
  p.assessments = [
    { id: 'asm_1', title: 'Joint evaluation framework', layer: 'product', outcomes: [o1], activityId: 'act_5', due: '2027-04-25', criteria: [
      { id: 'cr_1', name: 'Use of evidence from both contexts', description: 'Draws on and fairly represents evidence from both dossiers.', levels: { exemplary: 'Integrates and weighs evidence from both contexts, noting limitations', proficient: 'Uses evidence from both contexts accurately', developing: 'Relies mostly on one context', beginning: 'Partner evidence absent or misrepresented' } },
      { id: 'cr_2', name: 'Handling of disagreement', description: 'Represents contested points honestly.', levels: { exemplary: 'Maps what remains contested and why', proficient: 'Notes key disagreements', developing: 'Implies false consensus', beginning: 'Ignores disagreement' } }
    ], local: { ptn_us: { weight: 25, notes: 'Plus individual memo (department rule)' }, ptn_br: { weight: '', notes: '' } }, status: 'draft', updatedAt: ago(20), updatedBy: 'ptn_us' },
    { id: 'asm_2', title: 'Individual reflection', layer: 'individual', outcomes: [o2], activityId: 'act_6', due: '2027-04-30', criteria: [], local: { ptn_us: { weight: 10 }, ptn_br: { weight: 20, notes: 'Counts toward N2' } }, status: 'draft', updatedAt: ago(20), updatedBy: 'ptn_br' }
  ];
  p.differences = [
    { id: 'dif_1', topic: 'Class schedules', detail: 'U.S. daytime class; Brazilian evening programme (19:00-22:00 Recife). Live sessions must fall in someone’s flexible hours.', kind: 'hard', status: 'addressed', updatedAt: ago(170), updatedBy: 'ptn_us' },
    { id: 'dif_2', topic: 'Messaging platform', detail: 'Brazilian students use WhatsApp; U.S. policy discourages it for graded work.', kind: 'negotiable', status: 'open', updatedAt: ago(60), updatedBy: 'ptn_br' },
    { id: 'dif_3', topic: 'What counts as evidence', detail: 'Policy-evaluation documents vs. community testimony and participatory diagnosis.', kind: 'productive', status: 'open', updatedAt: ago(160), updatedBy: 'ptn_br' },
    { id: 'dif_4', topic: 'Ethics clearance for interviews', detail: 'Unclear whether Brazilian students need clearance to record residents’ accounts.', kind: 'unknown', status: 'open', updatedAt: ago(90), updatedBy: 'ptn_br' }
  ];
  p.commonGround = [{ id: 'cg_1', theme: 'Both courses examine who benefits from environmental interventions', evidence: 'Course purposes', updatedAt: ago(170) }, { id: 'cg_2', theme: 'Both professors want students to question evidence quality', evidence: 'Disciplinary priorities', updatedAt: ago(170) }];
  p.decisions = [
    { id: 'dec_1', title: 'Approve design brief', description: 'Shared challenge and driving question.', type: 'shared', affected: both, approvals: { ptn_us: { status: 'approve', at: ago(195) }, ptn_br: { status: 'approve', at: ago(190) } }, linked: { kind: 'brief', id: 'brief' }, createdBy: 'ptn_us', createdAt: ago(200), updatedAt: ago(190), updatedBy: 'ptn_br' },
    { id: 'dec_2', title: 'Approve partnership charter', description: '', type: 'shared', affected: both, approvals: { ptn_us: { status: 'approve', at: ago(178) }, ptn_br: { status: 'approve', at: ago(176) } }, linked: { kind: 'charter', id: 'charter' }, createdBy: 'ptn_br', createdAt: ago(180), updatedAt: ago(176), updatedBy: 'ptn_us' },
    { id: 'dec_3', title: 'Team communication channel', description: 'Option A: WhatsApp groups (students already use it).\nOption B: Microsoft Teams (U.S. approved, heavier on mobile data).\nOption C: Padlet + email digest.', type: 'shared', affected: both, due: '2026-10-28', approvals: { ptn_br: { status: 'approve', at: ago(50), note: '' }, ptn_us: { status: 'object', at: ago(30), note: 'University policy discourages WhatsApp for graded work. Could we use it only for informal chat?' } }, linked: null, createdBy: 'ptn_br', createdAt: ago(60), updatedAt: ago(30), updatedBy: 'ptn_us' },
    { id: 'dec_4', title: 'Approve outcome O3 (team negotiation)', description: 'Ana proposed this intercultural outcome.', type: 'shared', affected: both, due: '2026-10-25', approvals: { ptn_br: { status: 'approve', at: ago(6) } }, linked: { kind: 'outcomes', id: o3 }, createdBy: 'ptn_br', createdAt: ago(8), updatedAt: ago(6), updatedBy: 'ptn_br' }
  ];
  p.outcomes[2].status = 'pending';
  p.comments = [
    { id: 'cmt_1', target: { kind: 'decisions', id: 'dec_3' }, author: 'ptn_br', text: 'Meus alunos usam WhatsApp o tempo todo; Teams consome muitos dados no celular.', lang: 'Portuguese', at: ago(49) },
    { id: 'cmt_2', target: { kind: 'decisions', id: 'dec_3' }, author: 'ptn_us', text: 'Objection: University policy discourages WhatsApp for graded work. Could we use it only for informal chat?', lang: 'English', at: ago(30) },
    { id: 'cmt_3', target: { kind: 'activities', id: 'act_4' }, author: 'ptn_br', text: 'Precisamos definir a contribuição dos meus alunos na crítica, não só receber a crítica.', lang: 'Portuguese', at: ago(5) }
  ];
  const nextWed = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() + ((10 - d.getUTCDay()) % 7 || 7)); return d.toISOString().slice(0, 10); })();
  p.meetings = [{ id: 'mtg_1', title: 'Co-design session: critique stage & communication channel', start: new Date(Date.parse(nextWed + 'T19:00:00Z')).toISOString(), duration: 60, link: 'https://meet.jit.si/Crosscourse-FloodRisk-demo', agenda: '1. Communication channel options (decision)\n2. Brazilian cohort’s contribution in the critique stage\n3. Ethics clearance: who checks?', notes: '', attendees: both, updatedAt: ago(4), updatedBy: 'ptn_br' }];
  p.glossary = [
    { id: 'gls_1', term: 'community', definitions: { English: 'People sharing a place or interest; in policy texts often “residents and stakeholders”.', Portuguese: 'comunidade: frequentemente associada a organização territorial e associações de moradores.' }, note: 'Carries political weight in Brazilian planning.', updatedAt: ago(100) },
    { id: 'gls_2', term: 'policy evaluation', definitions: { English: 'Systematic assessment of a policy’s design, implementation and outcomes.', Portuguese: 'avaliação de políticas públicas' }, note: '', updatedAt: ago(100) }
  ];
  p.events = [
    { id: 'e1', at: ago(200), by: 'ptn_us', type: 'change', summary: 'Created the partnership “Flood risk on two coasts”' },
    { id: 'e2', at: ago(190), by: 'ptn_br', type: 'change', summary: 'Approved: Approve design brief' },
    { id: 'e3', at: ago(176), by: 'ptn_br', type: 'change', summary: 'Approved: Approve partnership charter' },
    { id: 'e4', at: ago(50), by: 'ptn_br', type: 'change', summary: 'Approved: Team communication channel' },
    { id: 'e5', at: ago(30), by: 'ptn_us', type: 'change', summary: 'Objected to: Team communication channel' },
    { id: 'e6', at: ago(8), by: 'ptn_br', type: 'change', summary: 'Asked partners to decide: Approve outcome O3 (team negotiation)' },
    { id: 'e7', at: ago(5), by: 'ptn_br', type: 'change', summary: 'Commented on “Reciprocal critique”' },
    { id: 'e8', at: ago(4), by: 'ptn_br', type: 'change', summary: 'Scheduled a live session: Co-design session: critique stage & communication channel' }
  ];
  return p;
}
