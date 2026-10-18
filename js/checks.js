// Partnership Alignment Engine: deterministic feasibility & structure checks.
// Interpretive questions are left to the (optional) AI review and, above all, to the professors.
import { termOverlap, findOverlaps, inBreak, ymdOf, addDays } from './time.js';
import { STAGES } from './store.js';

export const DIMENSIONS = [
  ['reciprocity', 'Reciprocity'],
  ['interaction', 'Meaningful interaction'],
  ['knowledge', 'Collaborative knowledge construction'],
  ['reflection', 'Intercultural reflection'],
  ['alignment', 'Outcome-activity-assessment alignment'],
  ['feasibility', 'Participation feasibility'],
  ['access', 'Accessibility & language support'],
  ['readiness', 'Implementation readiness']
];

const pname = (p, id) => p.partners.find(x => x.id === id)?.institution || p.partners.find(x => x.id === id)?.name || 'Unknown partner';
const reps = p => p.partners.filter(x => x.role === 'representative' && x.status !== 'withdrawn');

export function decisionStatus(p, d) {
  const affected = (d.affected?.length ? d.affected : reps(p).map(x => x.id)).filter(id => p.partners.some(x => x.id === id));
  if (d.type === 'advisory') return { status: d.adopted ? 'adopted' : 'advisory', affected, waiting: [] };
  // Votes cast before the item was last revised count as "approved an earlier version", not as approval.
  const votes = affected.map(id => { const v = d.approvals?.[id]; return [id, v && d.revisedAt && (v.at || '') < d.revisedAt ? 'stale' : v?.status]; });
  if (votes.some(([, s]) => s === 'object')) return { status: 'objection', affected, waiting: votes.filter(([, s]) => !s).map(([id]) => id) };
  const waiting = votes.filter(([, s]) => s !== 'approve' && s !== 'abstain').map(([id]) => id);
  return { status: waiting.length ? 'pending' : 'approved', affected, waiting };
}

/** If cohort X disappeared, which activities become impossible, and is there a fallback? */
export function counterfactual(p) {
  return p.partners.filter(x => x.status !== 'withdrawn').map(pt => {
    const direct = p.activities.filter(a => (a.participants || []).includes(pt.id) && (a.contributions?.[pt.id] || '').trim());
    const ids = new Set(direct.map(a => a.id));
    let grew = true;
    while (grew) {
      grew = false;
      for (const a of p.activities) if (!ids.has(a.id) && (a.dependsOn || []).some(d => ids.has(d))) { ids.add(a.id); grew = true; }
    }
    const affected = p.activities.filter(a => ids.has(a.id));
    return { partner: pt, direct, affected, unprotected: affected.filter(a => !(a.contingency || '').trim()) };
  });
}

export function runChecks(p) {
  const F = [];
  const add = (dimension, severity, title, detail, target = null, fix = null) => F.push({ id: `${dimension}:${title}:${target?.id || ''}`, dimension, severity, title, detail, target, fix });
  const partners = p.partners.filter(x => x.status !== 'withdrawn');
  const acts = p.activities;

  // --- Feasibility: calendars
  if (partners.length < 2) add('readiness', 'blocker', 'Fewer than two partners', 'A collaboration needs at least two teaching partners from different institutions.', null, 'partners');
  const ov = termOverlap(partners);
  if (partners.length >= 2) {
    if (!ov.ok && ov.reason === 'Academic terms do not overlap') add('feasibility', 'blocker', 'Academic terms do not overlap', `Latest start ${ov.start} is after earliest end ${ov.end}. Consider an asynchronous bridge, a shorter module, or a different term.`, null, 'schedule');
    else if (!ov.ok) add('feasibility', 'missing', 'Term dates missing', `${ov.missing.map(x => x.institution || x.name).join(', ')} still need to enter term start/end dates.`, null, 'partners');
    else if (ov.weeks < 4) add('feasibility', 'discuss', `Only ${ov.weeks} shared teaching weeks`, 'Short overlaps compress trust-building and feedback cycles. Consider fewer, deeper exchanges.', null, 'schedule');
    else add('feasibility', 'ok', `${ov.weeks} shared teaching weeks`, `${ov.start} → ${ov.end}, excluding partner breaks.`);
  }
  // --- Feasibility: synchronous activities need a common window
  const syncActs = acts.filter(a => a.sync);
  if (partners.length >= 2) {
    const start = ov.ok ? ov.start : ymdOf(new Date(), 'UTC');
    const core = findOverlaps(partners, start, 14, { flex: false });
    const flex = core.length ? core : findOverlaps(partners, start, 14, { flex: true });
    if (!core.length && !flex.length && syncActs.length) add('feasibility', 'blocker', 'No shared live window', `${syncActs.length} activities are synchronous, but no time exists when all partners are within even their flexible hours. Make them asynchronous or split sessions.`, null, 'schedule');
    else if (!core.length && syncActs.length) add('feasibility', 'discuss', 'Live sessions fall outside someone’s working hours', 'Synchronous sessions are only possible in flexible (early/late) hours. Decide who carries that burden, and rotate it.', null, 'schedule');
    else if (core.length) add('feasibility', 'ok', 'Shared working-hour windows exist', `${core.length} overlapping windows in the first two weeks.`);
  }
  // --- Activities: dates, ownership, interdependence, resilience
  const ownerCounts = {};
  for (const a of acts) {
    const t = { kind: 'activity', id: a.id, label: a.title };
    if (!a.owner) add('readiness', 'missing', 'Activity has no responsible owner', `“${a.title}” needs a facilitating partner.`, t);
    else ownerCounts[a.owner] = (ownerCounts[a.owner] || 0) + 1;
    if (!a.start || !a.end) add('readiness', 'missing', 'Activity has no dates', `“${a.title}” is not yet scheduled.`, t);
    else {
      if (a.end < a.start) add('feasibility', 'blocker', 'End date before start date', `“${a.title}”.`, t);
      if (ov.ok && (a.start < ov.start || a.end > ov.end)) add('feasibility', 'blocker', 'Activity falls outside the shared term', `“${a.title}” (${a.start} → ${a.end}) extends beyond ${ov.start} → ${ov.end}.`, t);
      for (let d = a.start; d <= a.end && d <= addDays(a.start, 60); d = addDays(d, 1)) {
        const hit = inBreak(d, partners.filter(x => (a.participants || []).includes(x.id)));
        if (hit) { add('feasibility', 'discuss', 'Activity overlaps a partner break', `“${a.title}” overlaps ${hit.brk.label || 'a break'} at ${hit.partner.institution || hit.partner.name}.`, t); break; }
      }
    }
    for (const dep of a.dependsOn || []) {
      const d = acts.find(x => x.id === dep);
      if (d && d.end && a.start && a.start < d.end) add('feasibility', 'blocker', 'Dependency ordering conflict', `“${a.title}” starts before “${d.title}”, which it depends on, ends.`, t);
    }
    const parts = (a.participants || []).filter(id => partners.some(x => x.id === id));
    const collaborative = ['compare', 'critique', 'cocreate'].includes(a.stage);
    if (parts.length < 2 && a.stage !== 'local') add('interaction', 'discuss', 'Single-cohort activity', `“${a.title}” involves only one cohort. That can be fine for local investigation, but not for ${STAGES.find(s => s.key === a.stage)?.label.toLowerCase()} work.`, t);
    const silent = parts.filter(id => !(a.contributions?.[id] || '').trim());
    if (collaborative && parts.length >= 2 && silent.length) add('reciprocity', 'missing', 'Contribution not defined for a cohort', `In “${a.title}”, it is not stated what ${silent.map(id => pname(p, id)).join(', ')} students contribute. Without it, collaboration risks becoming parallel work or one-directional information supply.`, t);
    if (collaborative && (a.dependsOn || []).length === 0 && a.stage !== 'compare') add('knowledge', 'discuss', 'No upstream dependency', `“${a.title}” does not build on any earlier exchange. Ask: what from the partner cohort must students use here?`, t);
    if ((a.dependsOn || []).length && !(a.contingency || '').trim()) add('feasibility', 'missing', 'No contingency for a dependent activity', `“${a.title}” depends on earlier partner work but has no fallback if a cohort is delayed.`, t);
    if (!(a.accessibility || '').trim()) add('access', 'missing', 'No accessibility / alternative participation note', `“${a.title}”.`, t);
    if (['compare', 'cocreate'].includes(a.stage) && !(a.evidence?.types || '').trim()) add('knowledge', 'missing', 'No evidence & perspective agreement', `“${a.title}” asks students to compare or co-create but doesn’t state which evidence types count, or how disagreement is handled.`, t);
    if (!(a.outcomes || []).length) add('alignment', 'missing', 'Activity not linked to a shared outcome', `“${a.title}”.`, t);
  }
  if (acts.length) {
    const tot = Object.values(ownerCounts).reduce((s, n) => s + n, 0);
    for (const [id, n] of Object.entries(ownerCounts)) if (partners.length >= 2 && tot >= 3 && n / tot > 0.7) add('reciprocity', 'discuss', 'Facilitation concentrated in one partner', `${pname(p, id)} owns ${n} of ${tot} activities. Check that design labour and visibility are shared as intended.`);
    if (!acts.some(a => a.stage === 'reflect')) add('reflection', 'missing', 'No reflection activity', 'Add a stage where students explain what changed in their thinking and what remains contested.');
    if (!acts.some(a => a.stage === 'trust')) add('interaction', 'discuss', 'No relationship-building stage', 'Teams that skip trust-building typically struggle in later interdependent tasks.');
    if (!acts.some(a => a.stage === 'cocreate')) add('knowledge', 'discuss', 'No co-created artifact', 'Consider at least one product that neither cohort could produce alone.');
  } else add('readiness', 'missing', 'No learning activities yet', 'Design or generate a sequence in the Experience designer.', null, 'design');

  // --- Workload balance
  if (partners.length >= 2 && acts.length) {
    const hours = Object.fromEntries(partners.map(x => [x.id, 0]));
    for (const a of acts) for (const id of a.participants || []) if (id in hours) hours[id] += Number(a.workload?.[id] ?? a.hours ?? 0) || 0;
    const vals = Object.values(hours).filter(v => v > 0);
    if (vals.length >= 2 && Math.max(...vals) / Math.min(...vals) > 1.5) add('feasibility', 'discuss', 'Uneven student workload across cohorts', partners.map(x => `${x.institution || x.name}: ${hours[x.id]} h`).join(' · ') + '. Uneven load is sometimes intended; make it an explicit decision.');
    for (const x of partners) {
      const cap = Number(x.course?.workloadHoursPerWeek || 0) * (ov.ok ? ov.weeks : 0);
      if (cap && hours[x.id] > cap) add('feasibility', 'blocker', 'Workload exceeds stated capacity', `${x.institution || x.name}: ${hours[x.id]} h planned vs ~${Math.round(cap)} h capacity across the shared weeks.`);
    }
  }

  // --- Outcomes & assessment alignment
  if (!p.outcomes.length) add('alignment', 'missing', 'No shared learning outcomes', 'Agree what students will learn together before designing activities.', null, 'outcomes');
  if (p.outcomes.length && !p.outcomes.some(o => o.type === 'intercultural')) add('reflection', 'discuss', 'No intercultural outcome', 'All shared outcomes are disciplinary. Collaborative international courses are strongest when intercultural learning is intended and assessed, not assumed.', null, 'outcomes');
  for (const o of p.outcomes) {
    const t = { kind: 'outcome', id: o.id, label: o.text };
    if (!acts.some(a => (a.outcomes || []).includes(o.id))) add('alignment', 'missing', 'Outcome has no learning activity', `“${o.text.slice(0, 90)}”`, t);
    if (!p.assessments.some(s => (s.outcomes || []).includes(o.id))) add('alignment', 'missing', 'Outcome has no evidence source', `No assessment collects evidence for “${o.text.slice(0, 90)}”.`, t);
    for (const x of partners) if (x.course?.localOutcomes?.length && !(o.mappings?.[x.id] || []).length) add('alignment', 'discuss', 'Outcome not mapped to a local course', `${x.institution || x.name} hasn’t mapped “${o.text.slice(0, 60)}…” to a local course outcome.`, t);
  }
  for (const s of p.assessments) {
    const t = { kind: 'assessment', id: s.id, label: s.title };
    if (!(s.outcomes || []).length) add('alignment', 'missing', 'Assessment not linked to outcomes', `“${s.title}”.`, t);
    if (!(s.criteria || []).length) add('alignment', 'missing', 'Assessment has no shared criteria', `“${s.title}”.`, t);
    for (const x of partners) if (!s.local?.[x.id]?.weight && s.local?.[x.id]?.weight !== 0) add('readiness', 'missing', 'Local grading arrangement not stated', `${x.institution || x.name} hasn’t recorded how “${s.title}” counts locally.`, t);
  }
  if (p.assessments.length && !p.assessments.some(s => s.layer === 'individual')) add('reflection', 'discuss', 'No individual learning evidence', 'Shared products hide individual learning; add an individual reflection or account of revised thinking.');

  // --- Language and access
  const langs = new Set(partners.map(x => (x.language || '').trim().toLowerCase()).filter(Boolean));
  if (langs.size > 1 && !p.glossary.length) add('access', 'discuss', 'Multiple working languages, no shared glossary', `Partners work in ${[...langs].join(', ')}. Agree key terms so translation doesn’t silently change meaning.`, null, 'language');

  // --- Provenance
  for (const x of partners) {
    const unconfirmed = Object.entries(x.fieldStates || {}).filter(([, s]) => s === 'inferred' || s === 'extracted');
    if (unconfirmed.length) add('readiness', 'missing', 'Unconfirmed extracted or AI-inferred facts', `${x.institution || x.name}: ${unconfirmed.length} fields await confirmation by that partner.`, { kind: 'partner', id: x.id, label: x.name }, 'partners');
  }
  // --- Governance
  if (p.charter.status !== 'approved') add('readiness', 'missing', 'Partnership charter not approved', 'Agree how you will decide, communicate, and handle disruption before students arrive.', null, 'charter');
  const open = p.decisions.filter(d => d.type === 'shared' && decisionStatus(p, d).status !== 'approved');
  const objected = open.filter(d => decisionStatus(p, d).status === 'objection');
  if (objected.length) add('readiness', 'blocker', `${objected.length} shared decision${objected.length > 1 ? 's' : ''} with objections`, objected.map(d => d.title).join(' · '), null, 'decisions');
  if (open.length - objected.length > 0) add('readiness', 'discuss', `${open.length - objected.length} shared decision${open.length - objected.length > 1 ? 's' : ''} awaiting approval`, 'Silence is not approval.', null, 'decisions');
  const changed = [...p.outcomes, ...acts, ...p.assessments].filter(x => x.status === 'changed');
  if (changed.length) add('readiness', 'discuss', 'Approved items changed since approval', changed.map(x => x.title || x.text?.slice(0, 40)).join(' · '));
  // --- Counterfactual collaboration test
  if (acts.length) for (const r of counterfactual(p)) {
    if (!r.direct.length) add('reciprocity', 'blocker', `The design doesn’t need ${r.partner.institution || r.partner.name}`, `If this cohort disappeared, no activity would become impossible. Their students may be an audience rather than co-constructors.`, { kind: 'partner', id: r.partner.id, label: r.partner.name }, 'design');
    else if (r.unprotected.length > 2) add('feasibility', 'discuss', `Fragile dependence on ${r.partner.institution || r.partner.name}`, `${r.affected.length} activities depend on this cohort; ${r.unprotected.length} lack a contingency.`);
  }
  for (const f of p.findings || []) if (f.source === 'ai' && !f.resolved) add(f.dimension, f.status === 'satisfied' ? 'ok' : f.status === 'missing-evidence' ? 'missing' : f.status === 'not-applicable' ? 'ok' : 'discuss', 'AI review: ' + (f.concern || '').slice(0, 80), f.evidence || '', f.target, null);

  return F;
}

export function matrix(findings) {
  return DIMENSIONS.map(([key, label]) => {
    const fs = findings.filter(f => f.dimension === key);
    const status = fs.some(f => f.severity === 'blocker') ? 'blocker' : fs.some(f => f.severity === 'discuss') ? 'discuss' : fs.some(f => f.severity === 'missing') ? 'missing' : fs.length ? 'ok' : 'na';
    return { key, label, status, count: fs.filter(f => f.severity !== 'ok').length };
  });
}

export function releaseGate(p) {
  const F = runChecks(p);
  const has = (pred) => F.some(pred);
  const partners = p.partners.filter(x => x.status !== 'withdrawn');
  const r = (label, ok, detail) => ({ label, ok, detail });
  const lastRel = p.releases.at(-1);
  const relApproved = lastRel && reps(p).every(x => lastRel.approvals?.[x.id]?.status === 'approve');
  return [
    r('Every shared outcome has an activity and an evidence source', p.outcomes.length > 0 && !has(f => f.title.startsWith('Outcome has no')), `${p.outcomes.length} shared outcomes`),
    r('Every activity has an owner, instructions, timing and support plan', p.activities.length > 0 && p.activities.every(a => a.owner && a.start && a.end && (a.instructions || '').trim() && (a.accessibility || '').trim()), `${p.activities.length} activities`),
    r('Meaningful contribution from every partner is visible', p.activities.length > 0 && !has(f => f.dimension === 'reciprocity' && f.severity !== 'ok' && f.severity !== 'discuss'), 'Counterfactual test and contribution checks'),
    r('Calendar and workload conflicts resolved or explicitly accepted', partners.length >= 2 && !has(f => f.dimension === 'feasibility' && f.severity === 'blocker'), 'Deterministic calendar & workload checks'),
    r('Shared and local assessment responsibilities are clear', p.assessments.length > 0 && !has(f => f.title === 'Local grading arrangement not stated' || f.title === 'Assessment has no shared criteria'), `${p.assessments.length} assessments`),
    r('Accessibility and disruption alternatives exist', p.activities.length > 0 && !has(f => f.title.startsWith('No accessibility') || f.title.startsWith('No contingency')), 'Per-activity notes'),
    r('Every affected partner has approved the current release', !!relApproved, lastRel ? `Release ${lastRel.label}` : 'No release candidate yet'),
    r('No AI inference is presented as a verified requirement', !has(f => f.title.startsWith('Unconfirmed')) && !p.proposals.some(x => x.status === 'pending'), 'Provenance states & proposal queue')
  ];
}

export function stageProgress(p) {
  const partners = p.partners.filter(x => x.status !== 'withdrawn');
  const filled = x => Object.values(x.course || {}).filter(v => typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.length : v).length;
  const F = runChecks(p);
  return [
    { key: 'understand', label: 'Understand', route: 'partners', done: partners.length >= 2 && partners.every(x => filled(x) >= 8) },
    { key: 'frame', label: 'Frame', route: 'frame', done: !!(p.brief.challenge && p.brief.whyInternational) && p.charter.status === 'approved' },
    { key: 'explore', label: 'Explore', route: 'design', done: p.outcomes.length > 0 && (p.proposals.some(x => x.kind === 'designs') || p.activities.length >= 3) },
    { key: 'prototype', label: 'Prototype', route: 'design', done: p.activities.length >= 3 && p.assessments.length > 0 },
    { key: 'test', label: 'Test', route: 'review', done: p.activities.length > 0 && !F.some(f => f.severity === 'blocker') },
    { key: 'commit', label: 'Commit', route: 'release', done: releaseGate(p).every(g => g.ok) }
  ];
}
