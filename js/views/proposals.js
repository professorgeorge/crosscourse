// Proposal queue: every AI (or template) output lands here first, with assumptions visible.
import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, badge, toast, md, fmtAgo, chip } from '../ui.js';
import { runTask, TASK_LABELS, designOptionToActivities, aiEnabled } from '../ai.js';
import { DIMENSIONS } from '../checks.js';

const pn = (p, id) => p.partners.find(x => x.id === id);

export async function propose(kind, args = {}, payloadExtra = {}, btn) {
  const p = app.p;
  const label = btn?.innerHTML;
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> ${aiEnabled() ? 'Asking the assistant…' : 'Preparing template…'}`; }
  try {
    const { result, source, model } = await runTask(kind, p, args);
    const prop = { id: S.uid('prp_'), kind, title: TASK_LABELS[kind], result, ...payloadExtra, source, model, status: 'pending', createdAt: S.now(), createdBy: app.me?.id || null, updatedAt: S.now() };
    app.mutate(pp => pp.proposals.push(prop), `${source === 'ai' ? 'AI' : 'Template'} proposal: ${TASK_LABELS[kind]}`, { kind: 'proposals', id: prop.id });
    toast(source === 'ai' ? 'Proposal ready for review.' : 'Template suggestion added for review (no AI configured).');
    setTimeout(() => document.getElementById(prop.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    return prop;
  } finally {
    if (btn && document.body.contains(btn)) { btn.disabled = false; btn.innerHTML = label; }
  }
}

const list = (arr, cls = '') => arr?.length ? `<ul class="${cls}">${arr.map(x => `<li>${esc(typeof x === 'string' ? x : JSON.stringify(x))}</li>`).join('')}</ul>` : '';
const sel = (name, i, checked = true) => `<input type="checkbox" class="sel" data-group="${name}" value="${i}" ${checked ? 'checked' : ''} aria-label="Include">`;

function body(p, x) {
  const r = x.result || {};
  switch (x.kind) {
    case 'extract': return `<p class="muted">For ${esc(pn(p, x.partnerId)?.institution || 'partner')}: values will be marked <em>Extracted</em> until that partner confirms them.</p>
      <table class="tbl"><tbody>${Object.entries(r.fields || {}).filter(([, v]) => v).map(([k, v], i) => `<tr><td>${sel('fields', k)}</td><th>${esc(S.COURSE_FIELDS.find(f => f[0] === k)?.[1] || k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      ${r.localOutcomes?.length ? `<h4>Local course outcomes</h4><ul class="plain">${r.localOutcomes.map((o, i) => `<li><label class="check">${sel('lo', i)}<span>${esc(o)}</span></label></li>`).join('')}</ul>` : ''}
      ${r.notes?.length ? `<h4>Ambiguities</h4>${list(r.notes)}` : ''}`;
    case 'commonGround': return `
      ${r.commonGround?.length ? `<h4>Common ground</h4><ul class="plain">${r.commonGround.map((c, i) => `<li><label class="check">${sel('cg', i)}<span><strong>${esc(c.theme)}</strong>: <span class="muted">${esc(c.evidence)}</span></span></label></li>`).join('')}</ul>` : ''}
      <h4>Differences</h4><ul class="plain">${(r.differences || []).map((d, i) => `<li><label class="check">${sel('diff', i)}<span>${badge(S.DIFF_KINDS[d.kind]?.label || d.kind, 'k-' + d.kind)} <strong>${esc(d.topic)}</strong>: ${esc(d.detail)} <span class="muted">${esc(d.why || '')}</span></span></label></li>`).join('')}</ul>
      ${r.candidateChallenges?.length ? `<h4>Candidate shared challenges</h4><div class="stack">${r.candidateChallenges.map((c, i) => `<div class="mini-card"><strong>${esc(c.title)}</strong><p>${esc(c.question)}</p><p class="muted small">Why international: ${esc(c.whyInternational)}</p>${x.status === 'pending' ? `<button class="btn sm" data-action="use-challenge" data-id="${x.id}" data-i="${i}">Use in design brief</button>` : ''}</div>`).join('')}</div>` : ''}
      ${r.questionsForPartners?.length ? `<h4>Questions to ask each other</h4><ul>${r.questionsForPartners.map(q => `<li><strong>${esc(q.to)}:</strong> ${esc(q.question)}</li>`).join('')}</ul>` : ''}`;
    case 'outcomes': return `<ul class="plain">${(r.outcomes || []).map((o, i) => `<li><label class="check">${sel('o', i)}<span>${badge(o.type)} ${esc(o.text)}<br><span class="muted small">Evidence: ${esc(o.evidence)}${o.rationale ? ' · ' + esc(o.rationale) : ''}</span></span></label></li>`).join('')}</ul>${r.alternatives?.length ? `<h4>Alternatives</h4>${list(r.alternatives)}` : ''}`;
    case 'designs': return `<div class="options">${(r.options || []).map((o, i) => `<article class="option">
        <header><h4>${esc(o.name)}</h4><span class="muted small">${esc(o.model || '')}</span></header>
        <p>${esc(o.summary)}</p>
        <div class="grid2 small"><div><strong>Strengths</strong>${list(o.strengths)}</div><div><strong>Risks</strong>${list(o.risks)}</div></div>
        <ol class="seq">${(o.activities || []).map(a => `<li><span class="stage-tag st-${esc(a.stage)}">${esc(S.STAGES.find(s => s.key === a.stage)?.label || a.stage)}</span> ${esc(a.title)}${a.sync ? ' <span class="badge">live</span>' : ''}</li>`).join('')}</ol>
        ${x.status === 'pending' ? `<button class="btn primary sm" data-action="use-design" data-id="${x.id}" data-i="${i}">Adopt as draft sequence</button>` : ''}
      </article>`).join('')}</div>${r.questions?.length ? `<h4>Questions</h4>${list(r.questions)}` : ''}`;
    case 'review': return `<ul class="plain findings">${(r.findings || []).map((f, i) => `<li><label class="check">${sel('f', i)}<span>${badge(DIMENSIONS.find(d => d[0] === f.dimension)?.[1] || f.dimension)} ${badge(f.status, 'st-' + f.status)}<br><strong>${esc(f.concern)}</strong><br><span class="small"><em>Evidence:</em> ${esc(f.evidence)} · <em>Consequence:</em> ${esc(f.consequence)}</span>${f.alternatives?.length ? `<br><span class="small"><em>Alternatives:</em> ${esc(f.alternatives.join(' · '))}</span>` : ''}<br><span class="small muted">Decides: ${esc(f.decisionMaker || 'partners')}</span></span></label></li>`).join('')}</ul>`;
    case 'rubric': return `<table class="tbl rubric"><thead><tr><th>Criterion</th><th>Exemplary</th><th>Proficient</th><th>Developing</th><th>Beginning</th></tr></thead><tbody>${(r.criteria || []).map(c => `<tr><th>${esc(c.name)}<br><span class="muted small">${esc(c.description)}</span></th><td>${esc(c.levels?.exemplary)}</td><td>${esc(c.levels?.proficient)}</td><td>${esc(c.levels?.developing)}</td><td>${esc(c.levels?.beginning)}</td></tr>`).join('')}</tbody></table><p class="small"><strong>Language fairness:</strong> ${esc(r.languageFairness)}</p>`;
    case 'instructions': return `<div class="prose">${md(r.instructions || '')}</div>${r.plainLanguageNotes ? `<p class="muted small">${esc(r.plainLanguageNotes)}</p>` : ''}`;
    case 'agenda': return `<ol>${(r.agenda || []).map(a => `<li>${esc(a.item)} <span class="muted small">(${a.minutes} min${a.decisionNeeded ? ', decision' : ''})</span>${a.prework ? `<br><span class="small">Pre-work: ${esc(a.prework)}</span>` : ''}</li>`).join('')}</ol><p class="small"><strong>For partners who can’t attend:</strong> ${esc(r.asyncAlternative)}</p>`;
    case 'mediate': return `<p>${esc(r.summary)}</p>${(r.positions || []).map(x => `<p class="small"><strong>${esc(x.partner)}:</strong> ${esc(x.position)} <span class="muted">(concern: ${esc(x.underlyingConcern)})</span></p>`).join('')}<h4>Options</h4><ul>${(r.options || []).map(o => `<li><strong>${esc(o.option)}</strong>: ${esc((o.consequences || []).join('; '))} <span class="muted">(${esc(o.whoIsAffected)})</span></li>`).join('')}</ul>${list(r.questions)}`;
    case 'brief': return `<div class="mini-card stack"><p><strong>Shared Challenge:</strong> ${esc(r.challenge || '')}</p><p><strong>Driving Question:</strong> ${esc(r.question || '')}</p><p><strong>Why International:</strong> ${esc(r.whyInternational || '')}</p><p><strong>Counterfactual Test:</strong> ${esc(r.counterfactual || '')}</p></div>`;
    case 'charter': return `<table class="tbl"><tbody>${Object.entries(r.charter || {}).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;
    case 'partnerContribution': return `<div class="mini-card"><p><strong>Proposed Contribution for ${esc(pn(p, x.partnerId)?.institution || 'Partner')}:</strong></p><p>${esc(r.contributes || '')}</p></div>`;
    case 'glossarySuggest': return `<ul class="plain">${(r.terms || []).map((t, i) => `<li><label class="check">${sel('gls', i)}<span><strong>${esc(t.term)}</strong>: ${Object.entries(t.definitions || {}).map(([lang, def]) => `<em>${esc(lang)}:</em> ${esc(def)}`).join(' | ')} <small class="muted">${esc(t.note || '')}</small></span></label></li>`).join('')}</ul>`;
    case 'studentBrief': return `<div class="prose">${md(r.brief || '')}</div>`;
    case 'coach': return `<div class="stack"><div class="banner info">${icon.sparkle} <span><strong>Assessment:</strong> ${esc(r.assessment || '')}</span></div>${r.recommendations?.length ? `<h4>Actionable Next Steps</h4>${list(r.recommendations)}` : ''}${r.discussionQuestions?.length ? `<h4>Questions to Discuss with Your Partner</h4>${list(r.discussionQuestions)}` : ''}${r.risksToWatch?.length ? `<h4>Potential Pitfalls</h4>${list(r.risksToWatch)}` : ''}</div>`;
    default: return `<pre class="err">${esc(JSON.stringify(r, null, 2))}</pre>`;
  }
}

export function proposalCard(p, x) {
  const by = pn(p, x.createdBy);
  const assumptions = x.result?.assumptions;
  const selectable = ['extract', 'commonGround', 'outcomes', 'review', 'glossarySuggest'].includes(x.kind);
  return `<article class="proposal ${x.status}" id="${x.id}">
    <header class="prop-head">
      <div><span class="prop-kind">${icon.sparkle} ${esc(x.title)}</span> ${badge(x.source === 'ai' ? 'AI proposal' : 'Template', x.source === 'ai' ? 'ai' : '')} ${x.status !== 'pending' ? badge(x.status, x.status === 'accepted' ? 'ok' : '') : ''}</div>
      <span class="muted small">${esc(x.model || '')} · requested by ${esc(by?.name || 'someone')} · ${fmtAgo(x.createdAt)}</span>
    </header>
    ${assumptions?.length ? `<div class="assumptions"><strong>Assumptions</strong>${list(assumptions)}</div>` : ''}
    <div class="prop-body">${body(p, x)}</div>
    ${x.status === 'pending' ? `<footer class="prop-foot">
      ${selectable || ['rubric', 'instructions', 'agenda', 'mediate', 'brief', 'charter', 'partnerContribution', 'coach', 'studentBrief'].includes(x.kind) ? `<button class="btn primary sm" data-action="accept-proposal" data-id="${x.id}">${icon.check} ${selectable ? 'Add selected as drafts' : (x.kind === 'coach' ? 'Mark reviewed' : 'Accept as draft')}</button>` : ''}
      <button class="btn sm" data-action="reject-proposal" data-id="${x.id}">Dismiss</button>
      <span class="muted small">Accepted items enter the design as drafts. Shared items still need partner approval.</span>
    </footer>` : ''}
  </article>`;
}

export function proposalsFor(p, kinds, { showDone = false } = {}) {
  const xs = p.proposals.filter(x => kinds.includes(x.kind) && (showDone || x.status === 'pending')).slice().reverse();
  return xs.length ? `<div class="stack proposals">${xs.map(x => proposalCard(p, x)).join('')}</div>` : '';
}

function selected(el, group) {
  return [...el.closest('.proposal').querySelectorAll(`.sel[data-group="${group}"]:checked`)].map(i => i.value);
}

function close(pp, x, status) { x.status = status; x.decidedBy = app.me?.id; x.updatedAt = S.now(); }

app.register({
  'accept-proposal'(d, el) {
    const x = app.p.proposals.find(y => y.id === d.id);
    const r = x.result || {};
    app.mutate(pp => {
      const by = app.me?.id || null, at = S.now();
      if (x.kind === 'extract') {
        const pt = pp.partners.find(y => y.id === x.partnerId);
        for (const k of selected(el, 'fields')) { pt.course[k] = r.fields[k]; pt.fieldStates[k] = 'extracted'; }
        for (const i of selected(el, 'lo')) pt.course.localOutcomes.push({ id: S.uid('lo_'), text: r.localOutcomes[+i] });
        app.touch(pt);
      }
      if (x.kind === 'commonGround') {
        for (const i of selected(el, 'cg')) pp.commonGround.push({ id: S.uid('cg_'), ...r.commonGround[+i], updatedAt: at, updatedBy: by });
        for (const i of selected(el, 'diff')) { const df = r.differences[+i]; pp.differences.push({ id: S.uid('dif_'), topic: df.topic, detail: df.detail + (df.why ? ` (${df.why})` : ''), kind: S.DIFF_KINDS[df.kind] ? df.kind : 'unknown', status: 'open', source: x.source, updatedAt: at, updatedBy: by }); }
      }
      if (x.kind === 'outcomes') for (const i of selected(el, 'o')) { const o = r.outcomes[+i]; pp.outcomes.push({ id: S.uid('out_'), text: o.text, type: o.type === 'intercultural' ? 'intercultural' : 'disciplinary', evidence: o.evidence || '', mappings: o.mappings || {}, status: 'draft', source: x.source, updatedAt: at, updatedBy: by }); }
      if (x.kind === 'review') { pp.findings = pp.findings.filter(f => f.source !== 'ai' || f.resolved); for (const i of selected(el, 'f')) pp.findings.push({ id: S.uid('fnd_'), source: 'ai', resolved: false, ...r.findings[+i], updatedAt: at, updatedBy: by }); }
      if (x.kind === 'rubric') { const a = pp.assessments.find(y => y.id === x.assessmentId); if (a) { a.criteria = (r.criteria || []).map(c => ({ id: S.uid('cr_'), ...c })); a.fairness = r.languageFairness || ''; app.touch(a); if (a.status === 'approved') a.status = 'changed'; } }
      if (x.kind === 'instructions') { const a = pp.activities.find(y => y.id === x.activityId); if (a) { a.instructions = r.instructions || ''; app.touch(a); if (a.status === 'approved') a.status = 'changed'; } }
      if (x.kind === 'agenda') { const m = pp.meetings.find(y => y.id === x.meetingId); if (m) { m.agenda = (r.agenda || []).map((a, i) => `${i + 1}. ${a.item} (${a.minutes} min)${a.decisionNeeded ? ' (decision needed)' : ''}`).join('\n') + (r.asyncAlternative ? `\n\nCan’t attend? ${r.asyncAlternative}` : ''); app.touch(m); } }
      if (x.kind === 'mediate') pp.comments.push({ id: S.uid('cmt_'), target: { kind: 'decisions', id: x.decisionId }, author: by, ai: true, text: `Assistant’s neutral summary (proposal, not a recommendation):\n${r.summary}\n\nOptions:\n${(r.options || []).map(o => `- ${o.option}: ${(o.consequences || []).join('; ')}`).join('\n')}`, at });
      if (x.kind === 'brief') {
        Object.assign(pp.brief, {
          challenge: r.challenge || pp.brief.challenge,
          question: r.question || pp.brief.question,
          whyInternational: r.whyInternational || pp.brief.whyInternational,
          counterfactual: r.counterfactual || pp.brief.counterfactual
        });
        app.touch(pp.brief);
        if (pp.brief.status === 'approved') pp.brief.status = 'changed';
      }
      if (x.kind === 'charter') {
        Object.assign(pp.charter, r.charter || {});
        app.touch(pp.charter);
        if (pp.charter.status === 'approved') pp.charter.status = 'changed';
      }
      if (x.kind === 'partnerContribution') {
        const pt = pp.partners.find(y => y.id === x.partnerId);
        if (pt) { pt.contributes = r.contributes || pt.contributes; app.touch(pt); }
      }
      if (x.kind === 'glossarySuggest') {
        for (const i of selected(el, 'gls')) {
          const t = r.terms[+i];
          pp.glossary.push({ id: S.uid('gls_'), term: t.term, definitions: t.definitions || {}, note: t.note || '', updatedAt: at, updatedBy: by });
        }
      }
      close(pp, x, 'accepted');
    }, `Accepted proposal: ${x.title}`, { kind: 'proposals', id: x.id });
    toast('Added as drafts.', 'ok');
  },
  'reject-proposal'(d) {
    const x = app.p.proposals.find(y => y.id === d.id);
    app.mutate(pp => close(pp, x, 'dismissed'), `Dismissed proposal: ${x.title}`);
  },
  'use-challenge'(d) {
    const x = app.p.proposals.find(y => y.id === d.id);
    const c = x.result.candidateChallenges[+d.i];
    app.mutate(pp => { Object.assign(pp.brief, { challenge: c.title, question: c.question, whyInternational: c.whyInternational }); app.touch(pp.brief); if (pp.brief.status === 'approved') pp.brief.status = 'changed'; }, `Used a candidate challenge in the design brief: ${c.title}`);
    toast('Design brief updated. Edit it together, then request approval.');
  },
  'use-design'(d) {
    const x = app.p.proposals.find(y => y.id === d.id);
    const opt = x.result.options[+d.i];
    const acts = designOptionToActivities(app.p, opt);
    app.mutate(pp => { for (const a of acts) { a.updatedAt = S.now(); a.updatedBy = app.me?.id; pp.activities.push(a); } close(pp, x, 'accepted'); x.adopted = opt.name; }, `Adopted design option “${opt.name}” as a draft sequence (${acts.length} activities)`);
    toast(`${acts.length} draft activities added. Review contributions, owners and dates.`, 'ok');
    app.go(`#/p/${app.p.id}/design`);
  }
});
