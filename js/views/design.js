import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, field, chip, badge, toast, md, empty, confirmBox } from '../ui.js';
import { counterfactual } from '../checks.js';
import { fmtDate } from '../time.js';
import { head, statusBadge, approvalBtn } from './project.js';
import { propose, proposalsFor } from './proposals.js';
import { commentsBlock } from './govern.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const active = p => p.partners.filter(x => x.status !== 'withdrawn');

// ================= Shared outcomes =================
app.view('outcomes', {
  render({ p }) {
    return `<div class="page">${head('Shared learning outcomes', 'What students will learn together, mapped onto each partner’s local course so the collaboration counts everywhere.', `<button class="btn" data-action="ai-outcomes">${icon.sparkle} Propose outcomes</button><button class="btn primary" data-action="add-outcome">${icon.plus} Add outcome</button>`)}
      ${proposalsFor(p, ['outcomes'])}
      ${p.outcomes.length ? `<div class="stack">${p.outcomes.map((o, i) => `<article class="card outcome">
        <div class="section-head"><div class="row gap"><span class="num-tag">O${i + 1}</span>${statusBadge(o.status)}${o.source === 'ai' ? badge('from AI proposal', 'ai') : ''}</div>
          <div class="row gap">${approvalBtn('outcomes', o.id, 'Outcome O' + (i + 1), o.status)}<button class="icon-btn" data-action="del-item" data-col="outcomes" data-id="${o.id}" aria-label="Delete outcome">${icon.trash}</button></div></div>
        <div class="grid-outcome">
          ${field('Outcome', `outcomes[${o.id}].text`, o.text, { type: 'textarea', rows: 2 })}
          ${field('Type', `outcomes[${o.id}].type`, o.type, { type: 'select', options: [['disciplinary', 'Disciplinary'], ['intercultural', 'Intercultural']] })}
        </div>
        ${field('Evidence of learning: what observable student work would show it?', `outcomes[${o.id}].evidence`, o.evidence, { type: 'textarea', rows: 2 })}
        <div class="mappings"><h3 class="sub">Maps to local course outcomes</h3><div class="grid-auto">${active(p).map(x => `<fieldset class="map-col"><legend>${chip(x, { small: true })}</legend>${x.course.localOutcomes.length ? x.course.localOutcomes.map(lo => `<label class="check small"><input type="checkbox" data-model="outcomes[${o.id}].mappings.${x.id}" data-array-value="${lo.id}" ${(o.mappings?.[x.id] || []).includes(lo.id) ? 'checked' : ''}><span>${esc(lo.text || '(untitled)')}</span></label>`).join('') : `<p class="muted small">No local outcomes yet. <a href="#/p/${p.id}/partners/${x.id}">Add on context card</a></p>`}</fieldset>`).join('')}</div></div>
        <p class="small muted">Used in ${p.activities.filter(a => (a.outcomes || []).includes(o.id)).length} activities · evidenced by ${p.assessments.filter(a => (a.outcomes || []).includes(o.id)).length} assessments</p>
      </article>`).join('')}</div>` : empty('No shared outcomes yet', 'Start with what students should be able to do that they couldn’t without the partnership. Include at least one intercultural outcome.')}
    </div>`;
  }
});
app.register({
  'ai-outcomes'(d, btn) { return propose('outcomes', {}, {}, btn); },
  'add-outcome'() { app.mutate(pp => pp.outcomes.push({ id: S.uid('out_'), text: '', type: 'disciplinary', evidence: '', mappings: {}, status: 'draft', updatedAt: S.now(), updatedBy: app.me?.id }), 'Added a shared outcome'); }
});

// ================= Experience designer =================
function contribBar(p, a) {
  const parts = (a.participants || []).map(id => pn(p, id)).filter(Boolean);
  return `<span class="contrib" title="Contributing cohorts">${parts.map(x => `<span class="seg ${(a.contributions?.[x.id] || '').trim() ? '' : 'hollow'}" style="--c:${x.color}" title="${esc(x.institution)}${(a.contributions?.[x.id] || '').trim() ? '' : ' (contribution not defined)'}"></span>`).join('')}</span>`;
}

function depMap(p) {
  const acts = p.activities;
  if (!acts.length) return '';
  const colW = 170, rowH = 70, padX = 16, padY = 34, nodeW = 150, nodeH = 50;
  const cols = S.STAGES.map(s => acts.filter(a => a.stage === s.key));
  const pos = {};
  cols.forEach((list, ci) => list.forEach((a, ri) => { pos[a.id] = { x: padX + ci * colW, y: padY + ri * rowH }; }));
  const H = padY + Math.max(1, ...cols.map(c => c.length)) * rowH + 6, W = padX * 2 + S.STAGES.length * colW - (colW - nodeW);
  const edges = acts.flatMap(a => (a.dependsOn || []).filter(id => pos[id]).map(id => {
    const s = pos[id], t = pos[a.id];
    const x1 = s.x + nodeW, y1 = s.y + nodeH / 2, x2 = t.x, y2 = t.y + nodeH / 2;
    const back = x2 <= x1;
    const dpath = back ? `M${s.x + nodeW / 2},${s.y + nodeH} C${s.x + nodeW / 2},${s.y + nodeH + 30} ${t.x + nodeW / 2},${t.y + nodeH + 30} ${t.x + nodeW / 2},${t.y + nodeH}` : `M${x1},${y1} C${x1 + 30},${y1} ${x2 - 30},${y2} ${x2},${y2}`;
    return `<path d="${dpath}" class="edge ${(a.contingency || '').trim() ? '' : 'fragile'}" marker-end="url(#arr)"/>`;
  })).join('');
  const nodes = acts.filter(a => pos[a.id]).map(a => {
    const { x, y } = pos[a.id];
    const parts = (a.participants || []).map(id => pn(p, id)).filter(Boolean);
    const segW = nodeW / Math.max(1, parts.length);
    return `<a href="#/p/${p.id}/design/${a.id}"><g class="node"><rect x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="6"/>${parts.map((pt, i) => `<rect x="${x + i * segW}" y="${y + nodeH - 5}" width="${segW}" height="5" fill="${pt.color}" opacity="${(a.contributions?.[pt.id] || '').trim() ? 1 : 0.3}"/>`).join('')}<text x="${x + 10}" y="${y + (a.sync ? 32 : 28)}">${esc(a.title.length > 22 ? a.title.slice(0, 21) + '…' : a.title)}</text>${a.sync ? `<text x="${x + 10}" y="${y + 15}" class="tag">LIVE</text>` : ''}</g></a>`;
  }).join('');
  const heads = S.STAGES.map((s, i) => `<text x="${padX + i * colW}" y="18" class="colhead">${esc(s.label.toUpperCase())}</text>`).join('');
  return `<div class="depmap-wrap"><svg class="depmap" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Collaboration dependency map"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrowhead"/></marker></defs>${heads}${edges}${nodes}</svg></div>
  <p class="hint">Coloured strips show which cohorts contribute (faded = contribution not defined). Dashed arrows are dependencies without a contingency plan.</p>`;
}

app.view('design', {
  render({ p, params }) {
    if (params[0]) return activityEditor(p, params[0]);
    const cf = counterfactual(p);
    return `<div class="page">${head('Learning experience', 'What students will actually do together, sequenced from trust to co-creation and reflection.', `<button class="btn" data-action="ai-designs">${icon.sparkle} Generate contrasting designs</button><button class="btn primary" data-action="add-activity">${icon.plus} Add activity</button>`)}
      ${proposalsFor(p, ['designs'])}
      ${p.activities.length ? `
      <section class="card flush"><div class="section-head pad"><h2>Collaboration dependency map</h2></div>${depMap(p)}</section>
      <section class="section">
        <div class="section-head"><h2>Sequence</h2></div>
        ${S.STAGES.map(s => { const list = p.activities.filter(a => a.stage === s.key).sort((a, b) => (a.start || '').localeCompare(b.start || '')); return `<div class="stage-block"><h3 class="stage-title"><span class="stage-tag st-${s.key}">${s.label}</span><span class="muted small">${s.hint}</span></h3>
          ${list.length ? `<div class="act-list">${list.map(a => `<a class="act-row" href="#/p/${p.id}/design/${a.id}">
            <span class="act-main"><strong>${esc(a.title || 'Untitled activity')}</strong><span class="muted small">${a.start ? `${fmtDate(a.start)} → ${fmtDate(a.end)}` : 'Not scheduled'} · ${a.sync ? 'Live' : 'Asynchronous'} · owner ${esc(pn(p, a.owner)?.institution || 'Not set')}</span></span>
            ${contribBar(p, a)}${statusBadge(a.status)}</a>`).join('')}</div>` : '<p class="muted small">No activities in this stage.</p>'}</div>`; }).join('')}
      </section>
      <section class="card">
        <h2>Counterfactual collaboration test</h2>
        <p class="muted">If one cohort disappeared, which learning would become impossible, and could students still finish fairly?</p>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>If this cohort were absent…</th><th>Activities that need them directly</th><th>Activities affected downstream</th><th>Without contingency</th></tr></thead><tbody>
        ${cf.map(r => `<tr><td>${chip(r.partner, { small: true })}</td><td>${r.direct.length ? r.direct.length : '<strong class="bad-text">0 (design doesn’t need them)</strong>'}</td><td>${r.affected.length}</td><td>${r.unprotected.length ? `<span class="warn-text">${r.unprotected.length}: ${r.unprotected.map(a => esc(a.title)).join(', ')}</span>` : '0'}</td></tr>`).join('')}
        </tbody></table></div>
      </section>` : empty('No activities yet', 'Generate two or three contrasting designs to compare, or add activities by hand. Each activity states what every cohort contributes.')}
    </div>`;
  }
});

function activityEditor(p, id) {
  const a = p.activities.find(x => x.id === id);
  if (!a) return `<div class="page">${empty('Activity not found', '')}</div>`;
  const A = `activities[${a.id}]`;
  const ps = active(p);
  const others = p.activities.filter(x => x.id !== a.id);
  a.evidence = a.evidence || {};
  return `<div class="page">
    <a href="#/p/${p.id}/design" class="back">${icon.back} Learning experience</a>
    <header class="page-head"><div class="grow"><p class="eyebrow">${esc(S.STAGES.find(s => s.key === a.stage)?.label)}</p><h1 class="editable"><input class="title-input" data-model="${A}.title" value="${esc(a.title)}" aria-label="Activity title"></h1><div class="row gap">${statusBadge(a.status)}${contribBar(p, a)}</div></div>
      <div class="row gap wrap">${approvalBtn('activities', a.id, a.title, a.status)}<button class="btn danger ghost sm" data-action="del-activity" data-id="${a.id}">${icon.trash} Delete</button></div></header>
    <div class="cols">
      <div class="col-main stack">
        <section class="card">
          <h2>Design</h2>
          ${field('Summary (for partners)', `${A}.summary`, a.summary, { type: 'textarea', rows: 3 })}
          <h3 class="sub">Who contributes what</h3>
          <p class="hint">Interdependence lives here. State what each cohort’s students bring (evidence, interpretation, critique or decisions), not just “participates”.</p>
          ${ps.map(x => `<div class="contrib-row"><label class="check"><input type="checkbox" data-model="${A}.participants" data-array-value="${x.id}" data-rerender ${(a.participants || []).includes(x.id) ? 'checked' : ''}>${chip(x, { small: true })}</label>
            ${(a.participants || []).includes(x.id) ? `<div class="grid-contrib">${field('Contribution', `${A}.contributions.${x.id}`, a.contributions?.[x.id] || '', { type: 'textarea', rows: 2 })}${field('Student hours', `${A}.workload.${x.id}`, a.workload?.[x.id] ?? '', { type: 'number', step: '0.5', min: 0 })}</div>` : ''}</div>`).join('')}
        </section>
        <section class="card">
          <div class="section-head"><h2>Student instructions</h2><button class="btn sm" data-action="ai-instructions" data-id="${a.id}">${icon.sparkle} Draft instructions</button></div>
          ${proposalsFor({ ...p, proposals: p.proposals.filter(x => x.activityId === a.id) }, ['instructions'])}
          ${field('Instructions (Markdown supported)', `${A}.instructions`, a.instructions, { type: 'textarea', rows: 8 })}
          ${a.instructions ? `<details><summary>Preview</summary><div class="prose">${md(a.instructions)}</div></details>` : ''}
        </section>
        <section class="card">
          <h2>Evidence & perspective agreement</h2>
          <p class="hint">Partners may agree on a topic while holding different assumptions about what counts as credible knowledge. Agree it here instead of asking AI to “represent” a perspective.</p>
          ${field('Required and permitted evidence types', `${A}.evidence.types`, a.evidence.types, { type: 'textarea', rows: 2, placeholder: 'e.g. policy documents, local news, community testimony, peer-reviewed research' })}
          ${field('Translation & citation expectations', `${A}.evidence.translation`, a.evidence.translation, { type: 'textarea', rows: 2 })}
          ${field('How conflicting interpretations are represented', `${A}.evidence.conflicting`, a.evidence.conflicting, { type: 'textarea', rows: 2 })}
          <div class="grid2">${field('Is consensus required?', `${A}.evidence.consensus`, a.evidence.consensus, { type: 'select', options: [['', 'Choose…'], ['required', 'Yes, a joint position is required'], ['optional', 'Optional: documented disagreement is a legitimate outcome'], ['no', 'No, multiple positions expected']] })}
          ${field('How students acknowledge uncertainty', `${A}.evidence.uncertainty`, a.evidence.uncertainty)}</div>
        </section>
        ${commentsBlock(p, { kind: 'activities', id: a.id })}
      </div>
      <aside class="col-side stack">
        <section class="card">
          <h2>Logistics</h2>
          ${field('Stage', `${A}.stage`, a.stage, { type: 'select', options: S.STAGES.map(s => [s.key, s.label]), rerender: true })}
          ${field('Live (synchronous) session', `${A}.sync`, a.sync, { type: 'checkbox' })}
          <p class="hint">Leave unchecked for asynchronous work; this is the default for most international exchanges.</p>
          <div class="grid2">${field('Starts', `${A}.start`, a.start, { type: 'date', rerender: true })}${field('Ends', `${A}.end`, a.end, { type: 'date', rerender: true })}</div>
          ${field('Facilitating owner', `${A}.owner`, a.owner, { type: 'select', options: [['', 'None'], ...ps.map(x => [x.id, x.institution || x.name])] })}
          ${field('Tools', `${A}.tools`, a.tools, { placeholder: 'Must be approved at every institution' })}
        </section>
        <section class="card">
          <h2>Builds on</h2>
          ${others.length ? others.map(o => `<label class="check small"><input type="checkbox" data-model="${A}.dependsOn" data-array-value="${o.id}" ${(a.dependsOn || []).includes(o.id) ? 'checked' : ''}><span>${esc(o.title)}</span></label>`).join('') : '<p class="muted small">No other activities.</p>'}
          ${field('If a partner cohort is delayed or absent…', `${A}.contingency`, a.contingency, { type: 'textarea', rows: 3, hint: 'A fair path that preserves as much learning as possible and doesn’t penalise students for another cohort’s disruption.' })}
        </section>
        <section class="card">
          <h2>Outcomes served</h2>
          ${p.outcomes.length ? p.outcomes.map((o, i) => `<label class="check small"><input type="checkbox" data-model="${A}.outcomes" data-array-value="${o.id}" ${(a.outcomes || []).includes(o.id) ? 'checked' : ''}><span><strong>O${i + 1}</strong> ${esc(o.text.slice(0, 90))}</span></label>`).join('') : `<p class="muted small"><a href="#/p/${p.id}/outcomes">Add shared outcomes first.</a></p>`}
        </section>
        <section class="card">
          <h2>Access & language support</h2>
          ${field('Accessibility and alternative participation', `${A}.accessibility`, a.accessibility, { type: 'textarea', rows: 3, placeholder: 'Captions, low-bandwidth option, asynchronous alternative, time-zone fairness…' })}
        </section>
      </aside>
    </div>
  </div>`;
}

app.register({
  'ai-designs'(d, btn) {
    if (!app.p.outcomes.length) toast('Tip: add shared outcomes first so designs can be linked to them.');
    return propose('designs', {}, {}, btn);
  },
  'ai-instructions'(d, btn) { return propose('instructions', { id: d.id }, { activityId: d.id }, btn); },
  'add-activity'() {
    const ids = active(app.p).map(x => x.id);
    const a = { id: S.uid('act_'), title: 'New activity', stage: 'compare', summary: '', instructions: '', sync: false, start: '', end: '', participants: ids, contributions: {}, workload: {}, owner: app.me?.id || '', dependsOn: [], outcomes: [], tools: '', contingency: '', accessibility: '', evidence: {}, status: 'draft', updatedAt: S.now(), updatedBy: app.me?.id };
    app.mutate(pp => pp.activities.push(a), 'Added an activity', { kind: 'activities', id: a.id }, { rerender: false });
    app.go(`#/p/${app.p.id}/design/${a.id}`);
  },
  async 'del-activity'(d) {
    if (!(await confirmBox('Delete activity?', 'Dependencies pointing to it will be removed.', 'Delete'))) return;
    app.mutate(pp => { pp.activities = pp.activities.filter(x => x.id !== d.id); pp.activities.forEach(x => x.dependsOn = (x.dependsOn || []).filter(y => y !== d.id)); pp.tombstones.push(d.id); }, 'Deleted an activity', null, { rerender: false });
    app.go(`#/p/${app.p.id}/design`);
  }
});

// ================= Assessment =================
const LAYERS = { product: 'Collaborative product', process: 'Collaboration process', individual: 'Individual learning' };
app.view('assess', {
  render({ p }) {
    return `<div class="page">${head('Assessment', 'Shared where necessary, local where appropriate. Shared criteria; local grade weighting. The assistant drafts criteria; it never grades students.', `<button class="btn primary" data-action="add-assessment">${icon.plus} Add assessment</button>`)}
      <div class="layers-legend">${Object.entries(LAYERS).map(([k, v]) => `<span class="badge l-${k}">${v}</span>`).join('')}</div>
      ${p.assessments.length ? `<div class="stack">${p.assessments.map(s => assessmentCard(p, s)).join('')}</div>` : empty('No assessments yet', 'Plan evidence for each shared outcome: a collaborative product, the collaboration process, and individual learning.')}
    </div>`;
  }
});
function assessmentCard(p, s) {
  const A = `assessments[${s.id}]`;
  return `<article class="card">
    <div class="section-head"><div class="grow"><input class="title-input sm" data-model="${A}.title" value="${esc(s.title)}" aria-label="Assessment title"></div><div class="row gap">${statusBadge(s.status)}${approvalBtn('assessments', s.id, s.title, s.status)}<button class="icon-btn" data-action="del-item" data-col="assessments" data-id="${s.id}" aria-label="Delete">${icon.trash}</button></div></div>
    <div class="grid3">${field('Layer', `${A}.layer`, s.layer, { type: 'select', options: Object.entries(LAYERS) })}${field('Linked activity', `${A}.activityId`, s.activityId, { type: 'select', options: [['', 'Choose…'], ...p.activities.map(a => [a.id, a.title])] })}${field('Due', `${A}.due`, s.due, { type: 'date' })}</div>
    <fieldset class="field"><legend>Evidence for outcomes</legend><div class="row gap wrap">${p.outcomes.map((o, i) => `<label class="check small"><input type="checkbox" data-model="${A}.outcomes" data-array-value="${o.id}" ${(s.outcomes || []).includes(o.id) ? 'checked' : ''}><span title="${esc(o.text)}">O${i + 1}</span></label>`).join('') || '<span class="muted small">No outcomes yet</span>'}</div></fieldset>
    <div class="section-head"><h3 class="sub">Shared criteria</h3><div class="row gap"><button class="btn sm" data-action="ai-rubric" data-id="${s.id}">${icon.sparkle} Draft criteria</button><button class="btn sm" data-action="add-criterion" data-id="${s.id}">${icon.plus} Criterion</button></div></div>
    ${proposalsFor({ ...p, proposals: p.proposals.filter(x => x.assessmentId === s.id) }, ['rubric'])}
    ${(s.criteria || []).length ? `<div class="table-wrap"><table class="tbl rubric edit"><thead><tr><th>Criterion</th><th>Exemplary</th><th>Proficient</th><th>Developing</th><th>Beginning</th><th></th></tr></thead><tbody>${s.criteria.map(c => `<tr>
      <td><input data-model="${A}.criteria[${c.id}].name" value="${esc(c.name)}" aria-label="Criterion"><textarea rows="2" data-model="${A}.criteria[${c.id}].description" aria-label="Description">${esc(c.description)}</textarea></td>
      ${['exemplary', 'proficient', 'developing', 'beginning'].map(l => `<td><textarea rows="4" data-model="${A}.criteria[${c.id}].levels.${l}" aria-label="${l}">${esc(c.levels?.[l] || '')}</textarea></td>`).join('')}
      <td><button class="icon-btn" data-action="del-criterion" data-id="${s.id}" data-cid="${c.id}" aria-label="Remove">${icon.trash}</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small">No criteria yet.</p>'}
    <h3 class="sub">Local arrangements</h3>
    <div class="grid-auto">${active(p).map(x => `<div class="local-box">${chip(x, { small: true })}${field('Weight in local grade (%)', `${A}.local.${x.id}.weight`, s.local?.[x.id]?.weight ?? '', { type: 'number', min: 0 })}${field('Local grading notes', `${A}.local.${x.id}.notes`, s.local?.[x.id]?.notes || '', { type: 'textarea', rows: 2 })}</div>`).join('')}</div>
  </article>`;
}
app.register({
  'add-assessment'() { app.mutate(pp => pp.assessments.push({ id: S.uid('asm_'), title: 'New assessment', layer: 'product', outcomes: [], activityId: '', due: '', criteria: [], local: {}, status: 'draft', updatedAt: S.now(), updatedBy: app.me?.id }), 'Added an assessment'); },
  'add-criterion'(d) { const s = app.p.assessments.find(x => x.id === d.id); app.mutate(() => { s.criteria = s.criteria || []; s.criteria.push({ id: S.uid('cr_'), name: '', description: '', levels: {} }); app.touch(s); }); },
  'del-criterion'(d) { const s = app.p.assessments.find(x => x.id === d.id); app.mutate(() => { s.criteria = s.criteria.filter(c => c.id !== d.cid); app.touch(s); }); },
  'ai-rubric'(d, btn) {
    const s = app.p.assessments.find(x => x.id === d.id);
    return propose('rubric', { title: s.title, layer: LAYERS[s.layer], outcomes: app.p.outcomes.filter(o => (s.outcomes || []).includes(o.id)).map(o => o.text) }, { assessmentId: s.id }, btn);
  }
});
