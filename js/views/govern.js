import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, field, chip, badge, modal, toast, fmtAgo, empty, md, renderCoach } from '../ui.js';
import { decisionStatus, runChecks, matrix, DIMENSIONS, counterfactual } from '../checks.js';
import { head } from './project.js';
import { propose, proposalsFor, proposalCard } from './proposals.js';
import { runTask, aiEnabled } from '../ai.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const reps = p => p.partners.filter(x => x.role === 'representative' && x.status !== 'withdrawn');

// ================= Comments (threaded per item) =================
export function commentsBlock(p, target) {
  const cs = p.comments.filter(c => c.target?.kind === target.kind && c.target?.id === target.id);
  return `<section class="card comments">
    <h2>Discussion <span class="muted small">${cs.length || ''}</span></h2>
    ${cs.length ? `<ul class="thread">${cs.map(c => { const a = pn(p, c.author); return `<li class="${c.ai ? 'ai' : ''}"><div class="c-head"><span class="dot" style="--c:${a?.color || 'var(--color-text-faint)'}"></span><strong>${c.ai ? 'Assistant (requested by ' + esc(a?.name || 'partner') + ')' : esc(a?.name || 'Someone')}</strong><span class="muted small">${fmtAgo(c.at)}${c.lang ? ' · ' + esc(c.lang) : ''}</span></div><div class="c-body">${md(c.text)}</div>${c.translation ? `<div class="c-trans"><span class="badge ai">Draft translation</span>${md(c.translation)}</div>` : ''}${!c.ai && aiEnabled() && app.me && c.author !== app.me.id && !c.translation ? `<button class="link small" data-action="translate-comment" data-id="${c.id}">${icon.translate} Translate to ${esc(app.me.language)}</button>` : ''}</li>`; }).join('')}</ul>` : '<p class="muted small">No comments yet. Discussion here travels with the update file.</p>'}
    <form class="comment-form" data-kind="${target.kind}" data-id="${target.id}"><label class="sr-only" for="c-${target.id}">Add a comment</label><textarea id="c-${target.id}" rows="2" placeholder="${app.me ? `Comment in ${esc(app.me.language || 'any language')}…` : 'Choose who you are to comment'}" ${app.me ? '' : 'disabled'}></textarea><button class="btn sm" data-action="add-comment" ${app.me ? '' : 'disabled'}>${icon.message} Comment</button></form>
  </section>`;
}
app.register({
  'add-comment'(d, el) {
    const form = el.closest('form');
    const t = form.querySelector('textarea').value.trim();
    if (!t) return;
    app.mutate(pp => pp.comments.push({ id: S.uid('cmt_'), target: { kind: form.dataset.kind, id: form.dataset.id }, author: app.me.id, text: t, lang: app.me.language, at: S.now() }), 'Commented', { kind: form.dataset.kind, id: form.dataset.id });
  },
  async 'translate-comment'(d, el) {
    const c = app.p.comments.find(x => x.id === d.id);
    el.textContent = 'Translating…';
    const { result } = await runTask('translate', app.p, { text: c.text, target: app.me.language });
    // Translations are personal reading aids; stored on this copy only and labelled as drafts.
    app.mutate(() => { c.translation = result.translation; });
  }
});

// ================= Decisions =================
function linkedLabel(p, l) {
  if (!l) return '';
  if (l.kind === 'brief') return 'Design brief';
  if (l.kind === 'charter') return 'Partnership charter';
  if (l.kind === 'releases') return 'Release ' + (p.releases.find(r => r.id === l.id)?.label || '');
  const it = p[l.kind]?.find(x => x.id === l.id);
  return it ? (it.title || it.text?.slice(0, 60)) : '(deleted item)';
}
function linkedHref(p, l) {
  return { brief: 'frame', charter: 'charter', outcomes: 'outcomes', activities: 'design/' + l.id, assessments: 'assess', releases: 'release' }[l.kind] || 'overview';
}
const DSTAT = { approved: ['Approved', 'ok'], pending: ['Awaiting approval', 'pending'], objection: ['Objection raised', 'bad'], advisory: ['Advisory', ''], adopted: ['Adopted', 'ok'] };

function decisionCard(p, d, open = false) {
  const st = decisionStatus(p, d);
  const me = app.me;
  const myVote = me && d.approvals?.[me.id];
  const canVote = me && st.affected.includes(me.id) && d.type !== 'advisory';
  return `<article class="card decision ${st.status}" id="${d.id}">
    <header class="section-head"><div><p class="eyebrow">${esc({ shared: 'Shared decision', local: 'Local decision', advisory: 'Advisory' }[d.type])}${d.due ? ` · respond by ${esc(d.due)}` : ''}</p><h2><a href="#/p/${p.id}/decisions/${d.id}">${esc(d.title)}</a></h2></div>${badge(DSTAT[st.status][0], DSTAT[st.status][1])}</header>
    ${d.description ? `<div class="prose">${md(d.description)}</div>` : ''}
    ${d.linked ? `<p class="small">Applies to: <a href="#/p/${p.id}/${linkedHref(p, d.linked)}">${esc(linkedLabel(p, d.linked))}</a></p>` : ''}
    <ul class="votes">${st.affected.map(id => { const x = pn(p, id); const v = d.approvals?.[id]; const stale = v && d.revisedAt && (v.at || '') < d.revisedAt; return `<li>${chip(x, { small: true, me: id === me?.id })}<span class="vote v-${stale ? 'none' : v?.status || 'none'}">${stale ? `${({ approve: 'Approved', object: 'Objected to', abstain: 'Abstained on' })[v.status]} an earlier version, please review again` : v ? ({ approve: 'Approved', object: 'Objected', abstain: 'Abstained' })[v.status] : 'No response yet'}</span>${v?.note ? `<span class="muted small">“${esc(v.note)}”</span>` : ''}${v?.at ? `<span class="muted small">${fmtAgo(v.at)}</span>` : ''}</li>`; }).join('')}</ul>
    ${canVote ? `<div class="row gap wrap vote-actions"><span class="muted small">Your response${myVote ? ' (you can change it)' : ''}:</span>
      <button class="btn sm ${myVote?.status === 'approve' ? 'primary' : ''}" data-action="vote" data-id="${d.id}" data-v="approve">${icon.check} Approve</button>
      <button class="btn sm ${myVote?.status === 'object' ? 'danger' : ''}" data-action="vote" data-id="${d.id}" data-v="object">Object…</button>
      <button class="btn sm ghost" data-action="vote" data-id="${d.id}" data-v="abstain">Abstain</button></div>` : d.type === 'advisory' ? `<button class="btn sm" data-action="adopt" data-id="${d.id}">${d.adopted ? 'Mark not adopted' : 'Mark adopted'}</button>` : !me ? '<p class="muted small">Choose who you are to respond.</p>' : ''}
    ${p.isAiSimulation && st.affected.includes(p.aiPartnerId) && (!d.approvals?.[p.aiPartnerId] || ((d.approvals[p.aiPartnerId].at || '') < (d.revisedAt || ''))) ? `<div class="row gap wrap" style="margin-top: var(--space-2);"><button class="btn sm primary" data-action="ai-partner-vote" data-id="${d.id}">${icon.sparkle} Ask ${esc(pn(p, p.aiPartnerId)?.name || 'AI Partner')} to vote</button></div>` : ''}
    ${st.status === 'objection' ? `<button class="btn sm" data-action="ai-mediate" data-id="${d.id}">${icon.sparkle} Articulate alternatives</button>` : ''}
    ${open ? proposalsFor({ ...p, proposals: p.proposals.filter(x => x.decisionId === d.id) }, ['mediate']) + commentsBlock(p, { kind: 'decisions', id: d.id }) : `<p class="small"><a href="#/p/${p.id}/decisions/${d.id}">${p.comments.filter(c => c.target?.id === d.id).length} comments · open discussion</a></p>`}
  </article>`;
}

function onApproved(p, d) {
  if (!d.linked) return;
  const it = d.linked.kind === 'brief' ? p.brief : d.linked.kind === 'charter' ? p.charter : p[d.linked.kind]?.find(x => x.id === d.linked.id);
  if (it && it.status !== 'approved' && d.linked.kind !== 'releases') { it.status = 'approved'; it.approvedAt = S.now(); it.updatedAt = S.now(); }
  if (d.linked.kind === 'releases') { const r = p.releases.find(x => x.id === d.linked.id); if (r) r.approvals = { ...d.approvals }; }
}

app.view('decisions', {
  render({ p, params }) {
    if (params[0]) { const d = p.decisions.find(x => x.id === params[0]); return `<div class="page narrow-ish"><a class="back" href="#/p/${p.id}/decisions">${icon.back} Decisions</a>${d ? decisionCard(p, d, true) : empty('Decision not found', '')}</div>`; }
    const tab = app._decTab || 'open';
    const pend = p.proposals.filter(x => x.status === 'pending');
    const open = p.decisions.filter(d => !['approved', 'adopted'].includes(decisionStatus(p, d).status)).reverse();
    const closed = p.decisions.filter(d => ['approved', 'adopted'].includes(decisionStatus(p, d).status)).reverse();
    return `<div class="page narrow-ish">${head('Decisions & proposals', 'Shared decisions need explicit approval from every affected institution. Silence is not consent.', `<button class="btn primary" data-action="new-decision">${icon.plus} New decision</button>`)}
      ${renderCoach({
        stage: 'Governance & Decisions',
        title: 'Consensus & Decision Coach',
        goal: 'Consequential shared decisions require explicit approval from each partner’s representative. Silence is never taken as consent.',
        actions: [
          { action: 'ai-coach', data: { stage: 'decisions' }, label: 'Coach guidance on decisions', icon: 'sparkle' }
        ],
        tips: [
          'Are any critical decisions pending partner response before module launch?',
          'If an objection was raised, use Articulate Alternatives to mediate constructive compromises.',
          'Decisions are merged across update files so institutional accountability is permanently preserved.'
        ]
      })}
      ${proposalsFor(p, ['coach'])}
      <div class="tabs"><button class="tab ${tab === 'open' ? 'active' : ''}" data-action="dec-tab" data-t="open">Open <span class="count">${open.length}</span></button><button class="tab ${tab === 'proposals' ? 'active' : ''}" data-action="dec-tab" data-t="proposals">Assistant proposals <span class="count">${pend.length}</span></button><button class="tab ${tab === 'closed' ? 'active' : ''}" data-action="dec-tab" data-t="closed">Settled <span class="count">${closed.length}</span></button></div>
      ${tab === 'open' ? (open.length ? `<div class="stack">${open.map(d => decisionCard(p, d)).join('')}</div>` : empty('No open decisions', 'Request approval from any brief, outcome, activity or assessment, or create a decision for anything else partners need to agree.')) : ''}
      ${tab === 'closed' ? (closed.length ? `<div class="stack">${closed.map(d => decisionCard(p, d)).join('')}</div>` : empty('Nothing settled yet', '')) : ''}
      ${tab === 'proposals' ? (pend.length ? `<div class="stack">${pend.slice().reverse().map(x => proposalCard(p, x)).join('')}</div>` : empty('No pending proposals', 'Assistant outputs appear here until someone accepts or dismisses them.')) : ''}
    </div>`;
  }
});

app.register({
  'dec-tab'(d) { app._decTab = d.t; app.render(); },
  async 'new-decision'(d = {}) {
    const p = app.p;
    const r = await modal({
      title: d.title ? `Request approval: ${d.title}` : 'New decision',
      body: `<div class="field"><label for="nd-t">What needs deciding?</label><input id="nd-t" name="title" required value="${esc(d.title ? 'Approve ' + d.title : '')}"></div>
        <div class="field"><label for="nd-d">Context, options and rationale</label><textarea id="nd-d" name="description" rows="4"></textarea></div>
        <div class="grid2"><div class="field"><label for="nd-type">Type</label><select id="nd-type" name="type"><option value="shared">Shared: every affected partner approves</option><option value="local">Local: responsible professor decides</option><option value="advisory">Advisory: optional until adopted</option></select></div>
        <div class="field"><label for="nd-due">Respond by</label><input id="nd-due" name="due" type="date"></div></div>
        <fieldset class="field"><legend>Affected partners</legend>${reps(p).map(x => `<label class="check"><input type="checkbox" name="aff_${x.id}" checked>${chip(x, { small: true })}</label>`).join('')}<p class="hint">For three or more institutions, only partners affected by a sub-activity need to approve, unless it changes shared outcomes.</p></fieldset>`,
      actions: [{ label: 'Cancel', value: null }, { label: 'Create & ask partners', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }]
    });
    if (!r?.value) return;
    const affected = reps(p).filter(x => r.data['aff_' + x.id]).map(x => x.id);
    const dec = { id: S.uid('dec_'), title: r.data.title, description: r.data.description, type: r.data.type, due: r.data.due, affected: r.data.type === 'local' ? affected.slice(0, 1) : affected, approvals: {}, linked: d.kind ? { kind: d.kind, id: d.id } : null, createdBy: app.me?.id, createdAt: S.now(), updatedAt: S.now(), updatedBy: app.me?.id };
    app.mutate(pp => {
      pp.decisions.push(dec);
      if (d.kind) { const it = d.kind === 'brief' ? pp.brief : d.kind === 'charter' ? pp.charter : pp[d.kind]?.find(x => x.id === d.id); if (it && d.kind !== 'releases') { it.status = 'pending'; app.touch(it); } }
    }, `Asked partners to decide: ${dec.title}`, { kind: 'decisions', id: dec.id }, { rerender: false });
    app.go(`#/p/${p.id}/decisions/${dec.id}`);
    toast('Decision created. Send an update so partners can respond.');
  },
  'request-approval'(d) { return app.actions['new-decision'](d); },
  async vote(d) {
    const p = app.p, dec = p.decisions.find(x => x.id === d.id);
    let note = '';
    if (d.v === 'object') {
      const r = await modal({ title: 'Raise an objection', body: `<div class="field"><label for="obj">What concerns you, and what would make this acceptable?</label><textarea id="obj" name="note" rows="4" required></textarea></div>`, actions: [{ label: 'Cancel', value: null }, { label: 'Record objection', value: 'ok', kind: 'danger', validate: f => f.reportValidity() }] });
      if (!r?.value) return;
      note = r.data.note;
    }
    app.mutate(pp => {
      dec.approvals = dec.approvals || {};
      dec.approvals[app.me.id] = { status: d.v, note, at: S.now() };
      app.touch(dec);
      if (note) pp.comments.push({ id: S.uid('cmt_'), target: { kind: 'decisions', id: dec.id }, author: app.me.id, text: 'Objection: ' + note, lang: app.me.language, at: S.now() });
      if (decisionStatus(pp, dec).status === 'approved') onApproved(pp, dec);
      if (d.v === 'object' && dec.linked) { const it = dec.linked.kind === 'brief' ? pp.brief : dec.linked.kind === 'charter' ? pp.charter : pp[dec.linked.kind]?.find(x => x.id === dec.linked.id); if (it && it.status) it.status = 'objection'; }
    }, `${({ approve: 'Approved', object: 'Objected to', abstain: 'Abstained on' })[d.v]}: ${dec.title}`, { kind: 'decisions', id: dec.id });
    if (decisionStatus(app.p, dec).status === 'approved') toast('Approved by every affected partner.', 'ok');
  },
  adopt(d) { const dec = app.p.decisions.find(x => x.id === d.id); app.mutate(() => { dec.adopted = !dec.adopted; app.touch(dec); }, `${dec.adopted ? 'Un-adopted' : 'Adopted'} advisory: ${dec.title}`); },
  'ai-mediate'(d, btn) {
    const dec = app.p.decisions.find(x => x.id === d.id);
    return propose('mediate', { decision: { title: dec.title, description: dec.description, votes: Object.fromEntries(Object.entries(dec.approvals || {}).map(([k, v]) => [pn(app.p, k)?.institution, v])) }, comments: app.p.comments.filter(c => c.target?.id === dec.id).map(c => ({ by: pn(app.p, c.author)?.institution, text: c.text })) }, { decisionId: dec.id }, btn);
  },
  async 'ai-partner-vote'(data, el) {
    const p = app.p;
    const dec = p.decisions.find(x => x.id === data.id);
    if (!dec || !p.aiPartnerId) return;
    const aiPartner = p.partners.find(x => x.id === p.aiPartnerId);
    if (!aiPartner) return;

    if (el) {
      el.disabled = true;
      el.innerHTML = '<span class="spinner"></span> Consulting ' + esc(aiPartner.name) + '...';
    }

    try {
      const { result } = await runTask('partnerVote', p, { decision: dec, partner: aiPartner });
      const voteStatus = result?.status === 'object' ? 'object' : 'approve';
      const voteNote = result?.note || `Approved from ${aiPartner.institution}.`;

      app.mutate(pp => {
        const targetDec = pp.decisions.find(x => x.id === dec.id);
        if (!targetDec) return;
        targetDec.approvals = targetDec.approvals || {};
        targetDec.approvals[aiPartner.id] = {
          status: voteStatus,
          note: voteNote,
          at: S.now()
        };
        app.touch(targetDec);
        if (voteStatus === 'object') {
          pp.comments.push({
            id: S.uid('cmt_'),
            target: { kind: 'decisions', id: targetDec.id },
            author: aiPartner.id,
            text: 'Feedback from ' + aiPartner.name + ': ' + voteNote,
            lang: aiPartner.language,
            at: S.now()
          });
        }
        if (decisionStatus(pp, targetDec).status === 'approved') onApproved(pp, targetDec);
      }, `${aiPartner.name} ${voteStatus === 'approve' ? 'approved' : 'commented on'}: ${dec.title}`, { kind: 'decisions', id: dec.id });

      toast(`${aiPartner.name} has recorded their response: ${voteStatus === 'approve' ? 'Approved' : 'Feedback provided'}!`, 'ok');
    } catch (err) {
      toast('Could not get response: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = `${icon.sparkle} Ask ${esc(aiPartner.name)} to vote`; }
    }
  }
});

// Re-evaluate approvals after merges: any decision that became fully approved applies its effect.
export function settleDecisions(p) {
  for (const d of p.decisions) if (decisionStatus(p, d).status === 'approved') onApproved(p, d);
}

// ================= Alignment review =================
const SEV = { blocker: ['Blocker', 'bad'], discuss: ['Needs discussion', 'pending'], missing: ['Missing evidence', ''], ok: ['Satisfied', 'ok'] };
app.view('review', {
  render({ p }) {
    const F = runChecks(p);
    const M = matrix(F);
    const groups = ['blocker', 'discuss', 'missing', 'ok'];
    const link = f => f.target?.kind === 'activity' ? `#/p/${p.id}/design/${f.target.id}` : f.target?.kind === 'outcome' ? `#/p/${p.id}/outcomes` : f.target?.kind === 'assessment' ? `#/p/${p.id}/assess` : f.target?.kind === 'partner' ? `#/p/${p.id}/partners/${f.target.id}` : f.fix ? `#/p/${p.id}/${f.fix}` : '';
    return `<div class="page">${head('Alignment review', 'Deterministic checks run continuously. The assistant’s semantic review adds interpretive findings, for discussion, never as verdicts.', `<button class="btn primary" data-action="ai-review">${icon.sparkle} Run semantic review</button>`)}
      ${renderCoach({
        stage: 'Stage 7: Alignment Review',
        title: 'Quality & Alignment Audit Coach',
        goal: 'Deterministic checks flag feasibility blockers continuously, while semantic review evaluates equity, workload balance, and pedagogical depth.',
        actions: [
          { action: 'ai-review', label: 'Run Semantic Review', icon: 'sparkle' },
          { action: 'ai-coach', data: { stage: 'review' }, label: 'Coach guidance on blockers', icon: 'sparkle' }
        ],
        tips: [
          'Are there any zero-tolerance feasibility blockers (e.g. 0 shared weeks, unmapped outcomes)?',
          'Is student workload realistic and equitable across all institutions?',
          'Does the counterfactual test confirm that collaboration is genuinely necessary?'
        ]
      })}
      ${proposalsFor(p, ['review', 'coach'])}
      <section class="card flush"><div class="table-wrap"><table class="tbl matrix"><thead><tr><th>Review dimension</th><th>Status</th><th>Open findings</th></tr></thead><tbody>
        ${M.map(m => `<tr><th scope="row">${esc(m.label)}</th><td>${m.status === 'na' ? `<span class="muted">${p.activities.length ? 'No rule-based issues' : 'Not yet assessed'}</span>` : badge(SEV[m.status][0], SEV[m.status][1])}</td><td>${m.count || '0'}</td></tr>`).join('')}
      </tbody></table></div></section>
      <p class="hint">No single “collaboration integrity score” is shown on purpose: a number would imply validity the review doesn’t have. Feasibility blockers are kept separate from interpretive concerns.</p>
      ${groups.map(g => { const fs = F.filter(f => f.severity === g); if (!fs.length) return ''; return `<section class="section"><h2>${SEV[g][0]} <span class="muted small">${fs.length}</span></h2><ul class="findings-list">${fs.map(f => `<li class="finding sev-${g}"><div><span class="muted small">${esc(DIMENSIONS.find(d => d[0] === f.dimension)?.[1] || f.dimension)}</span><strong>${esc(f.title)}</strong><p>${esc(f.detail)}</p></div>${link(f) ? `<a class="btn sm ghost" href="${link(f)}">Go ${icon.arrow}</a>` : ''}</li>`).join('')}</ul></section>`; }).join('')}
      ${p.findings.filter(f => f.source === 'ai').length ? `<section class="section"><h2>Semantic review findings</h2><div class="stack">${p.findings.filter(f => f.source === 'ai').map(f => `<article class="card finding-ai ${f.resolved ? 'resolved' : ''}">
        <div class="row gap between"><span>${badge(DIMENSIONS.find(d => d[0] === f.dimension)?.[1] || f.dimension)} ${badge(f.status)}</span><label class="check small"><input type="checkbox" data-model="findings[${f.id}].resolved" data-rerender ${f.resolved ? 'checked' : ''}><span>Discussed / resolved</span></label></div>
        <dl class="cecad"><dt>Concern</dt><dd>${esc(f.concern)}</dd><dt>Evidence</dt><dd>${esc(f.evidence)}</dd><dt>Consequence</dt><dd>${esc(f.consequence)}</dd><dt>Alternatives</dt><dd>${esc((f.alternatives || []).join(' · '))}</dd><dt>Decides</dt><dd>${esc(f.decisionMaker)}</dd></dl>
        <button class="btn sm" data-action="finding-to-decision" data-id="${f.id}">${icon.vote} Turn into a decision</button>
      </article>`).join('')}</div></section>` : ''}
    </div>`;
  }
});
app.register({
  'ai-coach'(d, btn) { return propose('coach', { stage: d.stage || 'review' }, {}, btn); },
  'ai-glossary'(d, btn) { return propose('glossarySuggest', {}, {}, btn); },
  'ai-review'(d, btn) {
    if (!aiEnabled()) { toast('Semantic review needs an AI provider (Settings). The deterministic checks above work without one.'); return; }
    return propose('review', {}, {}, btn);
  },
  'finding-to-decision'(d) {
    const f = app.p.findings.find(x => x.id === d.id);
    const dec = { id: S.uid('dec_'), title: f.concern.slice(0, 90), description: `**Evidence:** ${f.evidence}\n\n**Consequence:** ${f.consequence}\n\n**Alternatives:**\n${(f.alternatives || []).map(a => '- ' + a).join('\n')}`, type: 'shared', affected: reps(app.p).map(x => x.id), approvals: {}, linked: null, createdBy: app.me?.id, createdAt: S.now(), updatedAt: S.now(), updatedBy: app.me?.id };
    app.mutate(pp => pp.decisions.push(dec), `Opened a decision from a review finding: ${dec.title}`, null, { rerender: false });
    app.go(`#/p/${app.p.id}/decisions/${dec.id}`);
  }
});

// ================= Language: glossary & translation =================
app.view('language', {
  render({ p }) {
    const langs = [...new Set(p.partners.map(x => x.language).filter(Boolean))];
    const actions = `<button class="btn" data-action="ai-glossary">${icon.sparkle} Suggest glossary terms</button><button class="btn primary" data-action="add-term">${icon.plus} Add term</button>`;
    return `<div class="page">${head('Language & terminology', 'Work in your preferred language. Keep originals beside translations, and agree key terms so meaning doesn’t drift.', actions)}
      ${renderCoach({
        stage: 'Cross-Cultural Glossary',
        title: 'Language & Terminology Coach',
        goal: 'Avoid misunderstandings by aligning on false friends, academic jargon, and terms with divergent local meanings across contexts.',
        actions: [
          { action: 'ai-glossary', label: 'Suggest Cross-Cultural Glossary Terms', icon: 'sparkle' }
        ],
        tips: [
          'Which disciplinary terms carry different connotations in your partner’s academic tradition?',
          'Are students encouraged to use draft translations as comprehension aids rather than final authority?',
          'Is the collaboration language accessible to non-native speakers with ample asynchronous reading time?'
        ]
      })}
      ${proposalsFor(p, ['glossarySuggest', 'coach'])}
      <section class="card flush"><div class="section-head pad"><h2>Shared glossary</h2><span class="muted small">${langs.join(' · ')}</span></div>
      ${p.glossary.length ? `<div class="table-wrap"><table class="tbl glossary"><thead><tr><th>Term</th>${langs.map(l => `<th>${esc(l)}</th>`).join('')}<th>Note</th><th></th></tr></thead><tbody>${p.glossary.map(g => `<tr><td><input data-model="glossary[${g.id}].term" value="${esc(g.term)}" aria-label="Term"></td>${langs.map(l => `<td><textarea rows="2" data-model="glossary[${g.id}].definitions.${l.replace(/[^\w]/g, '_')}" aria-label="${esc(l)}">${esc(g.definitions?.[l.replace(/[^\w]/g, '_')] || '')}</textarea></td>`).join('')}<td><textarea rows="2" data-model="glossary[${g.id}].note" aria-label="Note">${esc(g.note || '')}</textarea></td><td><button class="icon-btn" data-action="del-item" data-col="glossary" data-id="${g.id}" aria-label="Delete">${icon.trash}</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="pad">${empty('No terms yet', 'Add discipline terms that may carry different meanings across contexts, e.g. “community”, “policy evaluation”, “participation”.')}</div>`}
      </section>
      <section class="card">
        <h2>Draft a translation</h2>
        <p class="muted">${aiEnabled() ? 'Uses your AI provider and the glossary above. Translations are drafts: a fluent partner should review anything students will read.' : 'Needs an AI provider (Settings). Without one, use your institution’s approved translation service and paste results into the glossary or comments.'}</p>
        <div class="grid2"><div class="field"><label for="tr-src">Original text</label><textarea id="tr-src" rows="8"></textarea></div><div class="field"><label for="tr-out">Draft translation</label><textarea id="tr-out" rows="8" readonly></textarea></div></div>
        <div class="row gap"><div class="field inline"><label for="tr-lang">Into</label><input id="tr-lang" list="lang-list" value="${esc(langs.find(l => l !== app.me?.language) || 'Portuguese')}"><datalist id="lang-list">${langs.map(l => `<option value="${esc(l)}">`).join('')}</datalist></div><button class="btn primary" data-action="translate" ${aiEnabled() ? '' : 'disabled'}>${icon.translate} Translate</button></div>
        <div id="tr-notes" class="small muted"></div>
      </section>
    </div>`;
  }
});
app.register({
  'add-term'() { app.mutate(pp => pp.glossary.push({ id: S.uid('gls_'), term: '', definitions: {}, note: '', updatedAt: S.now(), updatedBy: app.me?.id }), 'Added a glossary term'); },
  async translate(d, btn) {
    const text = document.getElementById('tr-src').value.trim();
    if (!text) return;
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Translating…';
    try {
      const { result } = await runTask('translate', app.p, { text, target: document.getElementById('tr-lang').value });
      document.getElementById('tr-out').value = result.translation || '';
      document.getElementById('tr-notes').innerHTML = (result.notes || []).length ? '<strong>Check with a partner:</strong> ' + esc(result.notes.join(' · ')) : '';
    } finally { btn.disabled = false; btn.innerHTML = `${icon.translate} Translate`; }
  }
});

// ================= Activity log =================
app.view('log', {
  render({ p }) {
    const ev = p.events.slice().reverse();
    return `<div class="page narrow-ish">${head('Activity log', 'Who proposed, changed and approved what, merged from every partner’s copy.')}
      <ul class="feed long">${ev.map(e => `<li><span class="dot" style="--c:${pn(p, e.by)?.color || 'var(--color-text-faint)'}"></span><span><strong>${esc(pn(p, e.by)?.name || 'Someone')}</strong> ${esc(e.summary)}</span><time class="muted small" datetime="${e.at}" title="${new Date(e.at).toLocaleString()}">${fmtAgo(e.at)}</time></li>`).join('')}</ul>
    </div>`;
  }
});
