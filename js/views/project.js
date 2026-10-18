import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, field, chip, badge, modal, toast, fmtAgo, pickFile, confirmBox, empty, renderCoach } from '../ui.js';
import { stageProgress, releaseGate, decisionStatus, runChecks } from '../checks.js';
import { fmtTime, tzAbbrev, termOverlap } from '../time.js';
import { partnerFormFields } from './home.js';
import { propose, proposalsFor } from './proposals.js';
import { aiEnabled } from '../ai.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
export const head = (title, sub = '', actions = '') => `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="lede">${sub}</p>` : ''}</div>${actions ? `<div class="row gap wrap">${actions}</div>` : ''}</header>`;
export const statusBadge = s => badge(({ draft: 'Draft', pending: 'Awaiting approval', approved: 'Approved', changed: 'Changed since approval', objection: 'Objection raised' })[s] || s, 'st-' + s);
export const approvalBtn = (kind, id, title, status) => status === 'pending' ? `<a class="btn sm" href="#/p/${app.p.id}/decisions">${icon.vote} View approval</a>` : `<button class="btn sm" data-action="request-approval" data-kind="${kind}" data-id="${id}" data-title="${esc(title)}">${icon.vote} ${status === 'approved' ? 'Re-open for approval' : 'Request partner approval'}</button>`;

// ================= Overview =================
app.view('overview', {
  render({ p, me }) {
    const s = app.settings;
    const lastSeen = s.lastSeen[p.id] || '1970';
    const since = p.events.filter(e => e.at > lastSeen && e.by !== me?.id).slice(-12).reverse();
    const myDecisions = me ? p.decisions.filter(d => { const st = decisionStatus(p, d); return st.waiting.includes(me.id) && st.status !== 'approved'; }) : [];
    const pending = p.proposals.filter(x => x.status === 'pending');
    const conflicts = (p.conflicts || []).filter(c => !c.resolved);
    const stages = stageProgress(p);
    const gate = releaseGate(p);
    const F = runChecks(p);
    const blockers = F.filter(f => f.severity === 'blocker').length, discuss = F.filter(f => f.severity === 'discuss').length, missing = F.filter(f => f.severity === 'missing').length;
    const ov = termOverlap(p.partners);
    const nowD = new Date();
    const myCard = me ? Object.values(me.course).filter(v => typeof v === 'string' ? v.trim() : Array.isArray(v) && v.length).length : 0;
    const todo = [];
    if (!me) todo.push(`<li><button class="link" data-action="choose-identity">Choose which partner you are</button> so your edits and approvals are attributed.</li>`);
    if (me && myCard < 8) todo.push(`<li><a href="#/p/${p.id}/partners/${me.id}">Complete your context card</a> <span class="muted">(${myCard} of ${S.COURSE_FIELDS.length + 2} fields)</span></li>`);
    if (p.partners.length < 2) todo.push(`<li><a href="#/p/${p.id}/partners">Invite at least one international partner</a></li>`);
    for (const d of myDecisions) todo.push(`<li><a href="#/p/${p.id}/decisions/${d.id}">Your approval is needed: ${esc(d.title)}</a>${d.due ? ` <span class="muted">· due ${esc(d.due)}</span>` : ''}</li>`);
    if (pending.length) todo.push(`<li><a href="#/p/${p.id}/decisions">${pending.length} assistant proposal${pending.length > 1 ? 's' : ''} to review</a></li>`);
    if (conflicts.length) todo.push(`<li><a href="#/p/${p.id}/sync">${conflicts.length} merge conflict${conflicts.length > 1 ? 's' : ''} to check</a></li>`);

    return `<div class="page">
      <header class="page-head">
        <div class="grow">
          <p class="eyebrow">${p.mode === 'course' ? 'Co-developed course' : 'Shared international module'}</p>
          <h1 class="editable"><input class="title-input" data-model="title" value="${esc(p.title)}" aria-label="Project title"></h1>
          <div class="chips">${p.partners.map(x => chip(x, { me: x.id === me?.id })).join('')}</div>
        </div>
        <div class="row gap wrap">
          <button class="btn" data-action="open-download-pack">${icon.download} Download Course Pack</button>
          <a class="btn" href="#/p/${p.id}/sync">${icon.sync} Send update to partners</a>
          <a class="btn primary" href="#/p/${p.id}/meetings">${icon.video} Plan a live session</a>
        </div>
      </header>

      <ol class="stages" aria-label="Design-thinking progress">${stages.map((st, i) => `<li class="${st.done ? 'done' : ''}"><a href="#/p/${p.id}/${st.route}"><span class="num">${st.done ? icon.check : i + 1}</span><span>${st.label}</span></a></li>`).join('')}</ol>

      ${p.isAiSimulation ? `
      <div class="card autopilot-banner" style="margin-bottom: var(--space-4);">
        <div class="row between wrap gap" style="align-items: center;">
          <div class="grow">
            <div class="row gap" style="align-items: center; margin-bottom: 4px;">
              <span class="badge ${p.isAutopilotCompleted ? 'badge-ok' : 'badge-live'}">${p.isAutopilotCompleted ? 'Autopilot Complete' : 'AI Simulation Active'}</span>
              <strong>AI Autopilot Co-Design Partner: ${esc(pn(p, p.aiPartnerId)?.name || 'International Colleague')}</strong>
            </div>
            <p class="muted small" style="margin: 0;">
              Partner institution: <strong>${esc(pn(p, p.aiPartnerId)?.institution || '')}</strong> (${esc(pn(p, p.aiPartnerId)?.country || '')}) · 
              Scope: <strong>${p.mode === 'course' ? 'Co-developed whole course' : 'Shared international module'}</strong>.
              ${p.isAutopilotCompleted ? 'All 8 design stages are fully approved and ready for classroom teaching.' : 'Run AI Autopilot to automatically co-develop, align, and approve the complete course package.'}
            </p>
          </div>
          <div class="row gap wrap">
            <button class="btn sm ${p.isAutopilotCompleted ? '' : 'primary'}" data-action="run-autopilot">${icon.sparkle} ${p.isAutopilotCompleted ? 'Re-Run Autopilot' : 'Run AI Autopilot'}</button>
            <button class="btn sm ${p.isAutopilotCompleted ? 'primary' : ''}" data-action="open-download-pack">${icon.download} Download Course Pack</button>
            <a class="btn sm ghost" href="#/p/${p.id}/partners/${p.aiPartnerId}">${icon.eye} Partner Context</a>
          </div>
        </div>
      </div>` : `
      <div class="card" style="margin-bottom: var(--space-4);">
        <div class="row between wrap gap" style="align-items: center;">
          <div>
            <strong>Ready-to-Use Course Pack & Syllabus</strong>
            <p class="muted small" style="margin: 0;">Download classroom-ready syllabus, student guide, and calendar for this course.</p>
          </div>
          <button class="btn sm primary" data-action="open-download-pack">${icon.download} Download Course Pack</button>
        </div>
      </div>`}

      ${renderCoach({
        stage: 'Overview & Guidance',
        title: 'Course Co-Design Coach',
        goal: 'Welcome! This dashboard orchestrates your international co-design workflow across institutional contexts. Follow the 8-stage progress tracker above, resolve pending approvals, and keep calendars synchronized.',
        actions: [{ action: 'ai-coach', data: { stage: 'overview' }, label: 'Coach guidance for our next step', icon: 'sparkle' }],
        tips: [
          'Have both partner faculty chosen their identity so edits and votes are recorded?',
          'Are there any open blockers flagged in the Alignment box?',
          'Have you agreed on an update-exchange rhythm in Share & sync?'
        ]
      })}
      ${proposalsFor(p, ['coach'])}

      <div class="dash">
        <section class="card span2">
          <div class="section-head"><h2>Waiting on you</h2></div>
          ${todo.length ? `<ul class="todo">${todo.join('')}</ul>` : `<p class="muted">Nothing needs your action right now.</p>`}
        </section>
        <section class="card">
          <div class="section-head"><h2>Alignment</h2><a href="#/p/${p.id}/review" class="small">Review ${icon.arrow}</a></div>
          <div class="kpis"><div class="kpi ${blockers ? 'bad' : ''}"><strong>${blockers}</strong><span>blockers</span></div><div class="kpi"><strong>${discuss}</strong><span>to discuss</span></div><div class="kpi"><strong>${missing}</strong><span>missing</span></div></div>
          <p class="small muted">${ov.ok ? `${ov.weeks} shared teaching weeks · ${esc(ov.start)} → ${esc(ov.end)}` : esc(ov.reason || '')}</p>
        </section>

        <section class="card span2">
          <div class="section-head"><h2>Since your last visit</h2>${since.length ? `<button class="btn sm ghost" data-action="mark-seen">Mark all as read</button>` : ''}</div>
          ${since.length ? `<ul class="feed">${since.map(e => `<li><span class="dot" style="--c:${pn(p, e.by)?.color || 'var(--color-text-faint)'}"></span><span><strong>${esc(pn(p, e.by)?.name || 'Someone')}</strong> ${esc(e.summary)}</span><time class="muted small">${fmtAgo(e.at)}</time></li>`).join('')}</ul>` : `<p class="muted">No new activity from partners. When a partner sends you an update file, open it in <a href="#/p/${p.id}/sync">Share &amp; sync</a> and their changes appear here.</p>`}
        </section>
        <section class="card">
          <div class="section-head"><h2>Partners now</h2></div>
          <ul class="clock-list">${p.partners.map(x => `<li>${chip(x, { small: true })}<span class="mono">${fmtTime(nowD, x.timezone, { weekday: 'short' })}</span><span class="muted small">${esc(tzAbbrev(x.timezone))}</span></li>`).join('')}</ul>
        </section>

        <section class="card span3">
          <div class="section-head"><h2>Release gate</h2><span class="muted small">${gate.filter(g => g.ok).length} of ${gate.length} met</span></div>
          <ul class="gate">${gate.map(g => `<li class="${g.ok ? 'ok' : ''}"><span class="tick">${g.ok ? icon.check : ''}</span><span>${esc(g.label)}<small>${esc(g.detail)}</small></span></li>`).join('')}</ul>
        </section>
      </div>
    </div>`;
  }
});

// ================= Partners =================
function stateBadge(p, x, key) {
  const st = x.fieldStates?.[key];
  if (!st || !(x.course[key] || '').toString().trim()) return '';
  const own = app.me?.id === x.id;
  return ` <span class="state s-${st}">${S.FIELD_STATES[st]}</span>${own && st !== 'confirmed' ? ` <button type="button" class="link small" data-action="confirm-field" data-pid="${x.id}" data-key="${key}">Confirm</button>` : ''}`;
}

app.view('partners', {
  render({ p, me, params }) {
    const tab = params[0] || me?.id || p.partners[0]?.id || 'compare';
    const tabs = `<div class="tabs" role="tablist">${p.partners.map(x => `<a role="tab" href="#/p/${p.id}/partners/${x.id}" class="tab ${tab === x.id ? 'active' : ''}" ${tab === x.id ? 'aria-selected="true"' : ''}><span class="dot" style="--c:${x.color}"></span>${esc(x.institution || x.name)}${x.id === me?.id ? ' <em class="you">you</em>' : ''}</a>`).join('')}<a role="tab" href="#/p/${p.id}/partners/compare" class="tab ${tab === 'compare' ? 'active' : ''}">Compare side by side</a></div>`;
    const actions = `<button class="btn primary" data-action="add-partner">${icon.plus} Invite a partner</button>`;
    let content;
    if (tab === 'compare') content = compareView(p);
    else { const x = pn(p, tab); content = x ? partnerCard(p, x, me) : empty('Partner not found', ''); }
    return `<div class="page">${head('Partners & context cards', 'Each partner describes their own course and constraints first. The comparison shows differences; it doesn’t average them away.', actions)}
      ${renderCoach({
        stage: 'Stage 1: Institutional Context',
        title: 'Context Cards & Cohort Profile Coach',
        goal: 'Solid partnerships start with transparency about local realities. Each partner details their academic calendar, student demographics, linguistic background, and technical constraints before designing activities.',
        actions: [{ action: 'ai-coach', data: { stage: 'partners' }, label: 'Coach tips on context gaps', icon: 'sparkle' }],
        tips: [
          'Are term dates entered accurately with all campus holidays and exam breaks?',
          'What digital tools are officially approved and accessible without paywalls or VPNs?',
          'What local disciplinary outcomes must this international module satisfy for your institution?'
        ]
      })}
      ${proposalsFor(p, ['coach'])}
      ${tabs}${content}</div>`;
  }
});

function partnerCard(p, x, me) {
  const P = `partners[${x.id}]`;
  const own = me?.id === x.id;
  const c = x.course;
  const f = (k, o = {}) => field(S.COURSE_FIELDS.find(z => z[0] === k)[1], `${P}.course.${k}`, c[k], Object.assign({ badge: stateBadge(p, x, k) }, o));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `
  ${x.isAi ? `<div class="banner info" style="margin-bottom: var(--space-3);">${icon.sparkle}<span><strong>International AI Simulation Colleague:</strong> ${esc(x.name)} is wearing the hat of a faculty member at ${esc(x.institution)} in ${esc(x.country)}. This context card reflects authentic academic calendar dates, student cohort background, local learning outcomes, and technical access constraints.</span></div>` : ''}
  ${!own && !x.isAi ? `<div class="banner info">${icon.alert}<span>This is ${esc(x.name || 'a partner')}’s card. You can add notes, but your edits are marked <em>Reported</em> until ${esc(x.name || 'they')} confirm${x.name ? 's' : ''} them.</span></div>` : ''}
  <div class="cols">
    <div class="col-main stack">
      <section class="card">
        <div class="section-head"><h2>Course</h2>
          <div class="row gap"><button class="btn sm" data-action="extract-syllabus" data-pid="${x.id}">${icon.upload} Import from syllabus</button></div></div>
        <div class="grid2">${f('title')}${f('code')}${f('level')}${f('discipline')}${f('studentsCount', { type: 'number' })}${f('workloadHoursPerWeek', { type: 'number', step: '0.5' })}</div>
        ${f('purpose', { type: 'textarea' })}${f('priorities', { type: 'textarea' })}${f('interculturalAims', { type: 'textarea' })}
      </section>
      ${proposalsFor({ ...p, proposals: p.proposals.filter(y => y.partnerId === x.id) }, ['extract'])}
      <section class="card">
        <div class="section-head"><h2>Local course outcomes</h2><button class="btn sm" data-action="add-local-outcome" data-pid="${x.id}">${icon.plus} Add</button></div>
        <p class="hint">Shared outcomes are mapped onto these, so the collaboration counts in each course.</p>
        ${c.localOutcomes.length ? `<ol class="lo-list">${c.localOutcomes.map(o => `<li><input data-model="${P}.course.localOutcomes[${o.id}].text" value="${esc(o.text)}" aria-label="Local outcome"><button class="icon-btn" data-action="del-local-outcome" data-pid="${x.id}" data-id="${o.id}" aria-label="Remove">${icon.trash}</button></li>`).join('')}</ol>` : `<p class="muted small">None yet.</p>`}
      </section>
      <section class="card">
        <h2>Students, constraints & care</h2>
        ${f('languages', { type: 'textarea', rows: 2 })}${f('studentAvailability', { type: 'textarea', rows: 2 })}
        <div class="grid2">${f('tech', { type: 'textarea', rows: 2 })}${f('techRestrictions', { type: 'textarea', rows: 2 })}</div>
        ${f('assessmentObligations', { type: 'textarea', rows: 2 })}${f('accessibility', { type: 'textarea', rows: 2 })}${f('careTopics', { type: 'textarea', rows: 2 })}${f('constraints', { type: 'textarea', rows: 2 })}${f('hopes', { type: 'textarea', rows: 2 })}
      </section>
    </div>
    <aside class="col-side stack">
      <section class="card">
        <h2>Profile</h2>
        ${field('Name', `${P}.name`, x.name)}${field('Institution', `${P}.institution`, x.institution)}
        <div class="grid2">${field('Country', `${P}.country`, x.country)}${field('Language', `${P}.language`, x.language)}</div>
        ${field('Email', `${P}.email`, x.email, { type: 'email' })}
        ${field('Time zone', `${P}.timezone`, x.timezone, { list: 'tz-list', hint: 'IANA name, e.g. America/Recife' })}
        ${field('Role', `${P}.role`, x.role, { type: 'select', options: [['representative', 'Representative (approves)'], ['co-designer', 'Co-designer']], rerender: true })}
        ${field('Status', `${P}.status`, x.status, { type: 'select', options: [['active', 'Active'], ['invited', 'Invited'], ['paused', 'Paused'], ['withdrawn', 'Withdrawn']], rerender: true })}
        ${p.partners.length > 1 ? `<button class="btn sm danger ghost" data-action="remove-partner" data-pid="${x.id}">${icon.trash} Remove partner</button>` : ''}
      </section>
      <section class="card">
        <h2>Working hours</h2>
        <p class="hint">Used for live-session planning. Flexible hours are times this partner could stretch to occasionally.</p>
        <div class="grid2">${field('Core from', `${P}.workStart`, x.workStart, { type: 'time' })}${field('Core to', `${P}.workEnd`, x.workEnd, { type: 'time' })}${field('Flexible from', `${P}.flexStart`, x.flexStart, { type: 'time' })}${field('Flexible to', `${P}.flexEnd`, x.flexEnd, { type: 'time' })}</div>
        <fieldset class="days"><legend>Working days</legend>${days.map((d, i) => `<label class="day"><input type="checkbox" data-model="${P}.workDays" data-array-value="${i}" ${x.workDays.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</fieldset>
      </section>
      <section class="card">
        <h2>Term</h2>
        <div class="grid2">${f('termStart', { type: 'date', rerender: true })}${f('termEnd', { type: 'date', rerender: true })}</div>
        <h3 class="sub">Breaks & exam periods</h3>
        ${c.breaks.map(b => `<div class="break-row"><input aria-label="Label" data-model="${P}.course.breaks[${b.id}].label" value="${esc(b.label)}" placeholder="Label"><input type="date" aria-label="From" data-model="${P}.course.breaks[${b.id}].start" value="${esc(b.start)}"><input type="date" aria-label="To" data-model="${P}.course.breaks[${b.id}].end" value="${esc(b.end)}"><button class="icon-btn" data-action="del-break" data-pid="${x.id}" data-id="${b.id}" aria-label="Remove break">${icon.trash}</button></div>`).join('')}
        <button class="btn sm" data-action="add-break" data-pid="${x.id}">${icon.plus} Add break</button>
      </section>
      <section class="card">
        <div class="section-head"><h2>What we bring</h2><button type="button" class="btn sm" data-action="ai-partner-contribution" data-pid="${x.id}">${icon.sparkle} Draft cohort contribution</button></div>
        ${proposalsFor({ ...p, proposals: p.proposals.filter(y => y.partnerId === x.id) }, ['partnerContribution'])}
        ${field('Expertise, perspectives, resources this cohort contributes', `${P}.contributes`, x.contributes, { type: 'textarea', rows: 4 })}
      </section>
    </aside>
  </div>
  <datalist id="tz-list">${(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []).map(t => `<option value="${t}">`).join('')}</datalist>`;
}

function compareView(p) {
  const rows = S.COURSE_FIELDS.filter(([k]) => !['code'].includes(k));
  return `<section class="card flush"><div class="table-wrap"><table class="tbl compare">
    <thead><tr><th scope="col">Field</th>${p.partners.map(x => `<th scope="col">${chip(x, { small: true })}</th>`).join('')}</tr></thead>
    <tbody>
      <tr><th scope="row">Time zone</th>${p.partners.map(x => `<td>${esc(x.timezone)}</td>`).join('')}</tr>
      <tr><th scope="row">Working language</th>${p.partners.map(x => `<td>${esc(x.language)}</td>`).join('')}</tr>
      ${rows.map(([k, l]) => `<tr><th scope="row">${esc(l)}</th>${p.partners.map(x => { const v = x.course[k]; const st = x.fieldStates?.[k]; return `<td>${v ? esc(v) : '<span class="muted">Not set</span>'}${v && st && st !== 'confirmed' ? ` <span class="state s-${st}">${S.FIELD_STATES[st]}</span>` : ''}</td>`; }).join('')}</tr>`).join('')}
      <tr><th scope="row">Local outcomes</th>${p.partners.map(x => `<td>${x.course.localOutcomes.length ? `<ol class="small">${x.course.localOutcomes.map(o => `<li>${esc(o.text)}</li>`).join('')}</ol>` : '<span class="muted">Not set</span>'}</td>`).join('')}</tr>
      <tr><th scope="row">What we bring</th>${p.partners.map(x => `<td>${esc(x.contributes) || '<span class="muted">Not set</span>'}</td>`).join('')}</tr>
    </tbody></table></div></section>
    <p class="hint">Next: classify the differences you see in the <a href="#/p/${p.id}/frame">design brief</a>: hard incompatibilities, negotiable preferences, productive differences, and unknowns.</p>`;
}

app.register({
  async 'add-partner'() {
    const r = await modal({ title: 'Invite an international partner', body: `${partnerFormFields({ role: 'representative', timezone: 'UTC' })}<p class="hint">After adding, Crosscourse downloads the project file and opens an email draft. Attach the file. Your partner opens it in Crosscourse and sends their update back.</p>`, actions: [{ label: 'Cancel', value: null }, { label: 'Add & prepare invitation', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }] });
    if (!r?.value) return;
    const x = S.blankPartner({ ...r.data, status: 'invited' }, app.p.partners.length);
    app.mutate(pp => { app.touch(x); pp.partners.push(x); }, `Invited ${x.name} (${x.institution})`);
    app.actions['send-update']({ to: x.email, invite: '1' });
    app.go(`#/p/${app.p.id}/partners/${x.id}`);
  },
  async 'remove-partner'(d) {
    const x = pn(app.p, d.pid);
    if (!(await confirmBox('Remove partner?', `Remove ${x.name || x.institution} from this project? Consider setting their status to “Withdrawn” instead, which preserves the record.`, 'Remove'))) return;
    app.mutate(pp => { pp.partners = pp.partners.filter(y => y.id !== x.id); pp.tombstones.push(x.id); }, `Removed partner ${x.name}`);
    app.go(`#/p/${app.p.id}/partners`);
  },
  'confirm-field'(d) {
    const x = pn(app.p, d.pid);
    app.mutate(() => { x.fieldStates[d.key] = 'confirmed'; app.touch(x); }, `Confirmed “${S.COURSE_FIELDS.find(f => f[0] === d.key)?.[1]}” on own context card`);
  },
  'add-local-outcome'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.localOutcomes.push({ id: S.uid('lo_'), text: '' }); app.touch(x); }); },
  'del-local-outcome'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.localOutcomes = x.course.localOutcomes.filter(o => o.id !== d.id); app.touch(x); }); },
  'add-break'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.breaks.push({ id: S.uid('brk_'), label: '', start: '', end: '' }); app.touch(x); }); },
  'del-break'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.breaks = x.course.breaks.filter(o => o.id !== d.id); app.touch(x); }); },
  async 'extract-syllabus'(d, btn) {
    const x = pn(app.p, d.pid);
    const r = await modal({ title: 'Import from a syllabus', wide: true, body: `<p class="muted">Paste syllabus text, or load a .txt, .md, .pdf or .docx file. ${aiEnabled() ? 'The assistant will propose values; nothing is saved until you accept, and accepted values stay marked “Extracted” until ' + esc(x.name || 'the partner') + ' confirms them.' : 'Without an AI provider, only file text loading is available. Add a key in Settings to extract fields automatically.'}</p>
      <div class="row gap"><button type="button" class="btn sm" id="syl-file">${icon.upload} Load file</button><span class="muted small" id="syl-name"></span></div>
      <div class="field"><label for="syl-text">Syllabus text</label><textarea id="syl-text" name="text" rows="12"></textarea></div>`,
      actions: [{ label: 'Cancel', value: null }, { label: aiEnabled() ? 'Extract with assistant' : 'Close', value: aiEnabled() ? 'ok' : null, kind: 'primary' }],
      onOpen: dlg => dlg.querySelector('#syl-file').addEventListener('click', async () => {
        const f = await pickFile('.txt,.md,.pdf,.docx');
        if (!f) return;
        dlg.querySelector('#syl-name').textContent = 'Reading ' + f.name + '…';
        try { dlg.querySelector('#syl-text').value = await readDocText(f); dlg.querySelector('#syl-name').textContent = f.name; }
        catch (e) { dlg.querySelector('#syl-name').textContent = 'Could not read file: ' + e.message; }
      })
    });
    if (!r?.value || !r.data.text?.trim()) return;
    await propose('extract', { text: r.data.text, partnerName: x.institution || x.name }, { partnerId: x.id }, btn);
  }
});

async function readDocText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= Math.min(doc.numPages, 40); i++) { const pg = await doc.getPage(i); const t = await pg.getTextContent(); out += t.items.map(it => it.str).join(' ') + '\n\n'; }
    return out;
  }
  if (name.endsWith('.docx')) {
    const mod = await import('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm');
    const m = mod.default || mod;
    const res = await m.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value;
  }
  return await file.text();
}

// ================= Frame: design brief & differences =================
app.view('frame', {
  render({ p }) {
    const b = p.brief;
    const kinds = Object.entries(S.DIFF_KINDS);
    return `<div class="page">${head('Design brief', 'Frame a learning challenge that becomes possible only because your cohorts work together.', `<button class="btn" data-action="ai-brief">${icon.sparkle} Draft shared brief</button><button class="btn" data-action="ai-common-ground">${icon.sparkle} Surface common ground & differences</button>`)}
      ${renderCoach({
        stage: 'Stage 2: Design Brief',
        title: 'Framing & Driving Question Coach',
        goal: 'Define a shared challenge that becomes possible only because your diverse cohorts work together. Preserve productive cultural and disciplinary differences rather than smoothing them away.',
        actions: [
          { action: 'ai-brief', label: 'Draft Shared Brief & Driving Question', icon: 'sparkle' },
          { action: 'ai-common-ground', label: 'Surface Common Ground & Differences', icon: 'sparkle' }
        ],
        tips: [
          'Counterfactual test: if one cohort disappeared, what learning would become impossible?',
          'Are differences categorized into productive contrasts vs hard operational blockers?',
          'Does the driving question invite authentic inquiry from both student cohorts?'
        ]
      })}
      ${proposalsFor(p, ['brief', 'commonGround', 'coach'])}
      <div class="cols">
        <section class="card col-main">
          <div class="section-head"><h2>Joint brief ${statusBadge(b.status)}</h2>${approvalBtn('brief', 'brief', 'Design brief', b.status)}</div>
          ${field('Shared learning challenge', 'brief.challenge', b.challenge, { placeholder: 'e.g. Evaluating flood-risk interventions across two coasts' })}
          ${field('Driving question students investigate together', 'brief.question', b.question, { type: 'textarea', rows: 2 })}
          ${field('Why this needs international collaboration', 'brief.whyInternational', b.whyInternational, { type: 'textarea', rows: 3, hint: 'What becomes possible only because these cohorts work together?' })}
          ${field('Counterfactual test: if one cohort disappeared, what learning would become impossible?', 'brief.counterfactual', b.counterfactual, { type: 'textarea', rows: 3, hint: 'If the honest answer is “nothing except an international audience”, the design needs attention.' })}
        </section>
        <aside class="col-side card">
          <div class="section-head"><h2>Common ground</h2><button class="icon-btn" data-action="add-cg" aria-label="Add common ground">${icon.plus}</button></div>
          ${p.commonGround.length ? `<ul class="plain stack-sm">${p.commonGround.map(c => `<li class="cg"><input data-model="commonGround[${c.id}].theme" value="${esc(c.theme)}" aria-label="Theme"><span class="muted small">${esc(c.evidence || '')}</span><button class="icon-btn" data-action="del-item" data-col="commonGround" data-id="${c.id}" aria-label="Remove">${icon.trash}</button></li>`).join('')}</ul>` : '<p class="muted small">Shared interests and overlapping aims appear here.</p>'}
        </aside>
      </div>
      <section class="section">
        <div class="section-head"><h2>Differences: preserved, not resolved</h2><button class="btn sm" data-action="add-diff">${icon.plus} Add a difference</button></div>
        <div class="board">${kinds.map(([k, v]) => `<div class="lane"><header><h3>${v.label}</h3><p class="muted small">${v.hint}</p></header>
          ${p.differences.filter(d => d.kind === k).map(d => `<article class="diff ${d.status}">
            <input class="diff-topic" data-model="differences[${d.id}].topic" value="${esc(d.topic)}" aria-label="Topic">
            <textarea data-model="differences[${d.id}].detail" rows="2" aria-label="Detail">${esc(d.detail)}</textarea>
            <div class="row gap between"><select data-model="differences[${d.id}].kind" data-rerender aria-label="Kind">${kinds.map(([kk, vv]) => `<option value="${kk}" ${kk === d.kind ? 'selected' : ''}>${vv.label}</option>`).join('')}</select>
            <label class="check small"><input type="checkbox" ${d.status === 'addressed' ? 'checked' : ''} data-action="toggle-diff" data-id="${d.id}"><span>Addressed</span></label>
            <button class="icon-btn" data-action="del-item" data-col="differences" data-id="${d.id}" aria-label="Remove">${icon.trash}</button></div>
          </article>`).join('') || '<p class="muted small lane-empty">None</p>'}</div>`).join('')}</div>
      </section>
    </div>`;
  }
});

app.register({
  'ai-coach'(d, btn) { return propose('coach', { stage: d.stage || 'overview' }, {}, btn); },
  'ai-partner-contribution'(d, btn) { return propose('partnerContribution', { partnerId: d.pid }, { partnerId: d.pid }, btn); },
  'ai-brief'(d, btn) { return propose('brief', {}, {}, btn); },
  'ai-charter'(d, btn) { return propose('charter', {}, {}, btn); },
  'ai-common-ground'(d, btn) { return propose('commonGround', {}, {}, btn); },
  'add-cg'() { app.mutate(pp => pp.commonGround.push({ id: S.uid('cg_'), theme: '', evidence: 'Added by ' + (app.me?.name || 'a partner'), updatedAt: S.now(), updatedBy: app.me?.id })); },
  'add-diff'() { app.mutate(pp => pp.differences.push({ id: S.uid('dif_'), topic: 'New difference', detail: '', kind: 'unknown', status: 'open', updatedAt: S.now(), updatedBy: app.me?.id }), 'Added a difference'); },
  'toggle-diff'(d, el) { const x = app.p.differences.find(y => y.id === d.id); app.mutate(() => { x.status = x.status === 'addressed' ? 'open' : 'addressed'; app.touch(x); }, `Marked difference “${x.topic}” ${x.status === 'addressed' ? 'open' : 'addressed'}`); },
  async 'del-item'(d) {
    if (!(await confirmBox('Delete this item?', 'It will also be removed from partners’ copies when they open your next update.', 'Delete'))) return;
    app.mutate(pp => { const it = pp[d.col].find(x => x.id === d.id); pp[d.col] = pp[d.col].filter(x => x.id !== d.id); pp.tombstones.push(d.id); return it; }, `Deleted ${d.col.replace(/s$/, '')}`);
  }
});

// ================= Charter =================
const CHARTER = [
  ['purpose', 'Shared purpose', 'Why are we doing this together? What does each partner want students to gain?'],
  ['decisionRights', 'Decision rights', 'Which decisions are shared, which are local, who represents each institution?'],
  ['languages', 'Languages of collaboration', 'Which languages for partner discussion, student work, and materials?'],
  ['division', 'Division of design & facilitation work', 'Who drafts, who facilitates which sessions, how is invisible labour shared?'],
  ['studentComms', 'Student communication responsibilities', 'Who communicates what to which students, through which channels?'],
  ['attribution', 'Attribution & reuse', 'Who may reuse the co-designed materials, and how are partners credited?'],
  ['disagreements', 'How disagreements are handled', 'e.g. articulate options asynchronously, then meet live if unresolved within a week'],
  ['withdrawal', 'Pausing or withdrawing', 'How a partner can pause or leave, and what notice is expected'],
  ['cohortLoss', 'If a cohort cannot participate', 'Strikes, closures, connectivity loss: what is the fallback for students?']
];
app.view('charter', {
  render({ p }) {
    const c = p.charter;
    const actions = `<button class="btn" data-action="ai-charter">${icon.sparkle} Propose charter draft</button>${approvalBtn('charter', 'charter', 'Partnership charter', c.status)}`;
    return `<div class="page narrow-ish">${head('Partnership charter', 'Agree how you will work together before designing what students will do.', actions)}
      <div class="row gap"><span>Status: ${statusBadge(c.status)}</span></div>
      ${renderCoach({
        stage: 'Stage 3: Partnership Charter',
        title: 'Partnership Charter Coach',
        goal: 'Agree on mutual expectations, response rhythms, attribution, and contingency plans before students are introduced to the collaboration.',
        actions: [{ action: 'ai-charter', label: 'Propose Complete Charter Draft', icon: 'sparkle' }],
        tips: [
          'What is the agreed response time for asynchronous reviews (e.g. 2 to 3 working days)?',
          'How will grading disagreements or cohort delays be handled?',
          'Who retains attribution and reuse rights to jointly developed materials?'
        ]
      })}
      ${proposalsFor(p, ['charter', 'coach'])}
      <section class="card stack">
        ${field('Expected response time for asynchronous requests (working days)', 'charter.responseDays', c.responseDays, { type: 'number', min: 1 })}
        ${CHARTER.map(([k, l, h]) => field(l, 'charter.' + k, c[k], { type: 'textarea', rows: 3, placeholder: h })).join('')}
        <div class="banner info">${icon.shield}<span>Built-in decision rules: consequential shared decisions need explicit approval from each affected institution’s representative. Silence is never treated as approval, and the most active editor never becomes owner by default.</span></div>
      </section>
    </div>`;
  }
});
