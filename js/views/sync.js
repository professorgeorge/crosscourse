import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, chip, badge, modal, toast, download, pickFile, fmtAgo, empty, md, renderCoach } from '../ui.js';
import { releaseGate, runChecks, decisionStatus, DIMENSIONS, counterfactual } from '../checks.js';
import * as T from '../time.js';
import { head } from './project.js';
import { settleDecisions } from './govern.js';
import { propose, proposalsFor } from './proposals.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const active = p => p.partners.filter(x => x.status !== 'withdrawn');
const slug = s => (s || 'crosscourse').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();

// ---------- Import & merge ----------
export async function importPacketFile(file) {
  let data;
  try { data = JSON.parse(await file.text()); } catch { toast('That file isn’t a Crosscourse project file.', 'error'); return; }
  if (data.format === 'crosscourse-backup') {
    for (const p of data.projects || []) { const ex = S.loadProject(p.id); S.saveProject(ex ? S.mergeProjects(ex, p).merged : p); }
    toast(`Restored ${data.projects.length} projects.`, 'ok'); app.go('#/'); app.render(); return;
  }
  const inc = data.format === 'crosscourse-packet' ? data.project : data;
  if (!inc?.id || !Array.isArray(inc.partners)) { toast('That file isn’t a Crosscourse project file.', 'error'); return; }
  const local = S.loadProject(inc.id);
  const from = inc.partners.find(x => x.id === data.exportedBy);
  if (!local) {
    S.logEvent(inc, null, 'sync', `Project opened on a new device from ${from ? from.name + '’s' : 'a'} update file`);
    S.saveProject(inc);
    toast(`Opened “${inc.title}”.`, 'ok');
    app.go(`#/p/${inc.id}/overview`);
    return;
  }
  const { merged, report } = S.mergeProjects(local, inc);
  settleDecisions(merged);
  S.logEvent(merged, S.settings.get().identities[merged.id] || null, 'sync', `Merged an update from ${from ? from.name : 'a partner'}: ${report.added} new, ${report.updated} updated${report.conflicts ? `, ${report.conflicts} concurrent edits` : ''}`);
  S.saveProject(merged);
  app.p = merged;
  await modal({
    title: `Update from ${from ? esc(from.name) : 'a partner'} merged`,
    body: `<div class="kpis"><div class="kpi"><strong>${report.added}</strong><span>new</span></div><div class="kpi"><strong>${report.updated}</strong><span>updated</span></div><div class="kpi ${report.conflicts ? 'bad' : ''}"><strong>${report.conflicts}</strong><span>concurrent edits</span></div></div>
      ${report.details.length ? `<ul class="small">${report.details.slice(0, 12).map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
      ${report.conflicts ? `<p class="small">Where you and a partner edited the same item, the newer version was kept and the other was saved under <strong>Share &amp; sync → Concurrent edits</strong> so nothing is lost.</p>` : ''}
      <p class="small muted">Approvals from every partner are combined, never overwritten.</p>`,
    actions: [{ label: 'See what changed', value: 'ok', kind: 'primary' }]
  });
  app.go(`#/p/${merged.id}/overview`);
  app.render();
}

function changesSince(p, iso) {
  return p.events.filter(e => e.at > (iso || '1970') && e.by === app.me?.id && e.type !== 'sync');
}

app.view('sync', {
  render({ p, me }) {
    const s = app.settings;
    const last = s.lastExport[p.id];
    const mine = changesSince(p, last);
    const conflicts = (p.conflicts || []).filter(c => !c.resolved);
    return `<div class="page narrow-ish">${head('Share & sync', 'There’s no central server: each partner keeps their own copy. Exchange update files by email or a shared drive. Crosscourse merges them item by item.')}
      ${renderCoach({
        stage: 'Decentralized Sync',
        title: 'Collaboration & Sync Coach',
        goal: 'Crosscourse operates without a central server. You own your data. Export your update file and send it to partners via email or shared drive.',
        actions: [
          { action: 'ai-coach', data: { stage: 'sync' }, label: 'Coach guidance on sync & merges', icon: 'sparkle' }
        ],
        tips: [
          'Have you established a regular rhythm for exchanging update files (e.g. after every co-design session)?',
          'When importing an update, review any concurrent edits in the conflict log.',
          'Never share or paste private API keys in project files; keys are kept strictly in local browser storage.'
        ]
      })}
      ${proposalsFor(p, ['coach'])}
      <div class="cols eq">
        <section class="card">
          <h2>${icon.upload} Send your update</h2>
          <p class="muted">${last ? `Last sent ${fmtAgo(last)}. ${mine.length} change${mine.length === 1 ? '' : 's'} by you since then.` : 'You haven’t sent an update yet.'}</p>
          ${mine.length ? `<ul class="small changes">${mine.slice(-8).reverse().map(e => `<li>${esc(e.summary)}</li>`).join('')}</ul>` : ''}
          <div class="row gap wrap"><button class="btn primary" data-action="send-update">${icon.mail} Download file & draft email</button><button class="btn" data-action="download-packet">${icon.download} Download file only</button></div>
          <p class="hint">Attach the downloaded <code>.crosscourse.json</code> file to the email. It contains the whole project, but never your AI key.</p>
        </section>
        <section class="card">
          <h2>${icon.download} Open a partner’s update</h2>
          <p class="muted">Received a file? Open it here. New items are added, newer edits replace older ones, and approvals from every partner are combined.</p>
          <button class="btn primary" data-action="import-project">${icon.upload} Open update file</button>
          <p class="hint">Tip: agree a rhythm in your charter, e.g. send an update whenever you finish a work session, and at least every ${p.charter.responseDays || 3} working days.</p>
        </section>
      </div>
      <section class="card">
        <h2>Partners</h2>
        <ul class="partner-sync">${p.partners.map(x => { const lastEv = p.events.filter(e => e.by === x.id).at(-1); return `<li>${chip(x, { me: x.id === me?.id })}<span class="muted small">${esc(x.email || 'no email')}</span><span class="small">${lastEv ? 'Last activity ' + fmtAgo(lastEv.at) : 'No activity yet'}</span>${x.status === 'invited' ? badge('invited') : ''}</li>`; }).join('')}</ul>
      </section>
      <section class="card">
        <h2>Concurrent edits ${conflicts.length ? badge(conflicts.length, 'pending') : ''}</h2>
        ${conflicts.length ? `<ul class="stack">${conflicts.map(c => { const o = c.overwritten; return `<li class="conflict"><div><strong>${esc(o.title || o.name || o.text?.slice(0, 60) || c.collection)}</strong><p class="small muted">${esc(c.collection)} · the version by ${esc(pn(p, o.updatedBy)?.name || 'a partner')} from ${fmtAgo(o.updatedAt)} was replaced by a newer edit.</p></div><div class="row gap"><button class="btn sm" data-action="restore-conflict" data-id="${c.id}">Restore that version</button><button class="btn sm ghost" data-action="dismiss-conflict" data-id="${c.id}">Keep current</button></div></li>`; }).join('')}</ul>` : '<p class="muted small">None. When two partners edit the same item between syncs, the other version is kept here for review.</p>'}
      </section>
    </div>`;
  }
});

function packet(p) { return JSON.stringify(S.exportPacket(p, app.me?.id), null, 1); }
function markExported(p) { const s = S.settings.get(); s.lastExport[p.id] = S.now(); S.settings.save(s); p._dirty = {}; S.saveProject(p); }

app.register({
  'download-packet'() {
    const p = app.p;
    download(`${slug(p.title)}-${slug(app.me?.institution || 'update')}-${new Date().toISOString().slice(0, 10)}.crosscourse.json`, packet(p));
    markExported(p); app.render();
  },
  'send-update'(d = {}) {
    const p = app.p;
    const mine = changesSince(p, app.settings.lastExport[p.id]);
    app.actions['download-packet']();
    const to = d.to || p.partners.filter(x => x.id !== app.me?.id && x.email).map(x => x.email).join(',');
    const appUrl = location.href.split('#')[0];
    const pend = app.me ? p.decisions.filter(x => { const st = decisionStatus(p, x); return st.status !== 'approved' && st.waiting.some(id => id !== app.me.id); }) : [];
    const subject = d.invite ? `Invitation to co-design an international course: ${p.title}` : `Crosscourse update: ${p.title}`;
    const body = d.invite
      ? `Hello,\n\nI'd like to co-design a collaborative international course experience with you. I've started a shared project in Crosscourse, a free browser app:\n${appUrl}\n\n1. Open the link (no account needed; it can be installed as an app).\n2. Choose "Open a partner's project file" and select the attached .crosscourse.json file.\n3. Pick your name, fill in your course context card, and send your update back the same way.\n\nNothing is merged into a final plan without both of our approvals.\n\nBest wishes,\n${app.me?.name || ''}`
      : `Hello,\n\nHere is my latest update for "${p.title}". Open the attached file in Crosscourse (${appUrl}) → Share & sync → Open update file.\n\nWhat I changed:\n${mine.slice(-15).map(e => '- ' + e.summary).join('\n') || '- (minor edits)'}\n${pend.length ? `\nWaiting for your response:\n${pend.map(x => '- ' + x.title).join('\n')}\n` : ''}\nBest,\n${app.me?.name || ''}`;
    location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast('Update file downloaded. Attach it to the email draft.');
  },
  'restore-conflict'(d) {
    const c = app.p.conflicts.find(x => x.id === d.id);
    app.mutate(pp => { const arr = pp[c.collection]; const i = arr.findIndex(x => x.id === c.entityId); const v = { ...c.overwritten, updatedAt: S.now(), updatedBy: app.me?.id }; if (i >= 0) arr[i] = v; else arr.push(v); c.resolved = true; }, `Restored an overwritten version in ${c.collection}`);
  },
  'dismiss-conflict'(d) { const c = app.p.conflicts.find(x => x.id === d.id); app.mutate(() => { c.resolved = true; }); }
});

// ---------- Release & export ----------
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().slice(0, 6); }

app.view('release', {
  render({ p }) {
    const gate = releaseGate(p);
    const passed = gate.filter(g => g.ok).length;
    const actions = `<button class="btn" data-action="ai-student-brief">${icon.sparkle} Draft student guide</button><button class="btn primary" data-action="create-release">${icon.package} Create release candidate</button>`;
    return `<div class="page narrow-ish">${head('Release & export', 'Generate implementation documents only from an approved release, so every partner can verify they’re using the same plan.', actions)}
      ${renderCoach({
        stage: 'Stage 8: Release & Implementation',
        title: 'Launch Readiness Coach',
        goal: 'Freeze approved learning designs into immutable release candidates, audit all gate checks, and export student-facing guides and design packages.',
        actions: [
          { action: 'ai-student-brief', label: 'Draft Student Onboarding Guide', icon: 'sparkle' },
          { action: 'ai-coach', data: { stage: 'release' }, label: 'Coach guidance on launch', icon: 'sparkle' }
        ],
        tips: [
          'Are all 8 release gate criteria met or explicitly acknowledged by all partner representatives?',
          'Have you generated the student onboarding guide for distribution before the first module week?',
          'Are LMS course codes and emergency contact details clearly communicated to students?'
        ]
      })}
      ${proposalsFor(p, ['studentBrief', 'coach'])}
      <section class="card">
        <div class="section-head"><h2>Release gate</h2><span class="muted small">${passed} of ${gate.length} met</span></div>
        <ul class="gate">${gate.map(g => `<li class="${g.ok ? 'ok' : ''}"><span class="tick">${g.ok ? icon.check : ''}</span><span>${esc(g.label)}<small>${esc(g.detail)}</small></span></li>`).join('')}</ul>
        <div class="row gap wrap"><button class="btn primary" data-action="create-release">${icon.package} Create release candidate</button><span class="muted small">A candidate freezes the current design and asks every representative to approve it.</span></div>
      </section>
      <section class="card">
        <h2>Releases</h2>
        ${p.releases.length ? `<ul class="stack">${p.releases.slice().reverse().map(r => { const ok = active(p).filter(x => x.role === 'representative').every(x => r.approvals?.[x.id]?.status === 'approve'); return `<li class="release"><div><strong class="mono">${esc(r.label)}</strong> ${badge(ok ? 'Approved by all partners' : 'Awaiting approval', ok ? 'ok' : 'pending')}<p class="small muted">Created ${fmtAgo(r.at)} by ${esc(pn(p, r.by)?.name || 'a partner')}${r.gatePassed != null ? ` · gate ${r.gatePassed}/8 at creation` : ''}</p></div><div class="row gap wrap"><button class="btn sm" data-action="export-html" data-rel="${r.id}">${icon.download} Design package</button><button class="btn sm" data-action="export-students" data-rel="${r.id}">Student guide</button>${r.decisionId ? `<a class="btn sm ghost" href="#/p/${p.id}/decisions/${r.decisionId}">Approvals</a>` : ''}</div></li>`; }).join('')}</ul>` : '<p class="muted small">No releases yet.</p>'}
      </section>
      <section class="card">
        <h2>Working-draft exports</h2>
        <p class="muted small">Watermarked as drafts, useful for discussion with colleagues, not for students.</p>
        <div class="row gap wrap">
          <button class="btn" data-action="export-html">${icon.download} Draft design package (HTML / print to PDF)</button>
          <button class="btn" data-action="export-md">${icon.download} Markdown</button>
          <button class="btn" data-action="export-ics">${icon.calendar} All activities & sessions (.ics)</button>
          <button class="btn" data-action="export-json">${icon.download} Structured data (JSON)</button>
        </div>
      </section>
    </div>`;
  }
});

export function packageHTML(p, rel, studentOnly = false) {
  const draft = !rel;
  const outIdx = id => p.outcomes.findIndex(o => o.id === id) + 1;
  const ps = active(p);
  const F = runChecks(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  const hours = Object.fromEntries(ps.map(x => [x.id, acts.reduce((s, a) => s + ((a.participants || []).includes(x.id) ? Number(a.workload?.[x.id] || 0) : 0), 0)]));
  const ov = T.termOverlap(ps);
  const sec = (t, b) => `<section><h2>${t}</h2>${b}</section>`;
  const charterRows = [['Shared purpose', 'purpose'], ['Decision rights', 'decisionRights'], ['Languages', 'languages'], ['Division of work', 'division'], ['Student communication', 'studentComms'], ['Attribution & reuse', 'attribution'], ['Disagreements', 'disagreements'], ['Pausing / withdrawal', 'withdrawal'], ['If a cohort cannot participate', 'cohortLoss']];
  const student = `${sec('Your international collaboration', `<p><strong>${esc(p.brief.challenge || p.title)}</strong></p><p>${esc(p.brief.question)}</p><p>You will work with students from ${ps.map(x => esc(`${x.institution} (${x.country})`)).join(', ')}.</p>`)}
    ${sec('Schedule', `<table><thead><tr><th>Dates</th><th>Activity</th><th>Mode</th></tr></thead><tbody>${acts.map(a => `<tr><td>${T.fmtDate(a.start)} - ${T.fmtDate(a.end)}</td><td>${esc(a.title)}</td><td>${a.sync ? 'Live session' : 'Asynchronous'}</td></tr>`).join('')}</tbody></table>`)}
    ${acts.map(a => `<section class="act"><h3>${esc(a.title)}</h3>${a.instructions ? md(a.instructions) : `<p>${esc(a.summary)}</p>`}${a.contingency ? `<p><strong>If your partners are delayed:</strong> ${esc(a.contingency)}</p>` : ''}${a.accessibility ? `<p><strong>Access & alternatives:</strong> ${esc(a.accessibility)}</p>` : ''}</section>`).join('')}
    ${p.glossary.length ? sec('Key terms', `<table><tbody>${p.glossary.map(g => `<tr><th>${esc(g.term)}</th><td>${Object.values(g.definitions || {}).map(esc).join('<br>')}</td></tr>`).join('')}</tbody></table>`) : ''}`;
  const full = `
    ${sec('1. Partnership & Instructional Team', `
      ${p.developerName ? `<p><strong>Course Developer / Instructional Designer:</strong> ${esc(p.developerName)}</p>` : `<p><strong>Course Developer / Instructional Designer:</strong> <span style="display:inline-block;border-bottom:1px solid #888;min-width:240px;">&nbsp;</span> <em>(Fillable)</em></p>`}
      <table><thead><tr><th>Partner</th><th>Institution</th><th>Course / Dept</th><th>Designated Faculty Instructor</th><th>Time zone</th><th>Language</th></tr></thead><tbody>${ps.map(x => `<tr><td>${esc(x.name || 'Faculty Representative')}</td><td>${esc(x.institution)}, ${esc(x.country)}</td><td>${esc(x.course.title || 'Department')} ${esc(x.course.code || '')}</td><td><strong>${esc(x.name || '')}</strong></td><td>${esc(x.timezone)}</td><td>${esc(x.language)}</td></tr>`).join('')}</tbody></table>
      <h3>Partnership charter</h3><table><tbody>${charterRows.map(([l, k]) => `<tr><th>${l}</th><td>${esc(p.charter[k]) || 'Not set'}</td></tr>`).join('')}</tbody></table>`)}
    ${sec('2. Design brief', `<p><strong>Challenge:</strong> ${esc(p.brief.challenge)}</p><p><strong>Driving question:</strong> ${esc(p.brief.question)}</p><p><strong>Why international:</strong> ${esc(p.brief.whyInternational)}</p><p><strong>Counterfactual test:</strong> ${esc(p.brief.counterfactual)}</p>`)}
    ${sec('3. Shared outcomes & local mappings', `<table><thead><tr><th>#</th><th>Outcome</th><th>Type</th><th>Evidence</th>${ps.map(x => `<th>${esc(x.institution)}</th>`).join('')}</tr></thead><tbody>${p.outcomes.map((o, i) => `<tr><td>O${i + 1}</td><td>${esc(o.text)}</td><td>${esc(o.type)}</td><td>${esc(o.evidence)}</td>${ps.map(x => `<td>${(o.mappings?.[x.id] || []).map(id => esc(x.course.localOutcomes.find(l => l.id === id)?.text || '')).join('<br>') || 'Not set'}</td>`).join('')}</tr>`).join('')}</tbody></table>`)}
    ${sec('4. Learning sequence', `<table><thead><tr><th>Dates</th><th>Stage</th><th>Activity</th><th>Mode</th><th>Owner</th><th>Outcomes</th></tr></thead><tbody>${acts.map(a => `<tr><td>${T.fmtDate(a.start)} - ${T.fmtDate(a.end)}</td><td>${esc(S.STAGES.find(s => s.key === a.stage)?.label)}</td><td>${esc(a.title)}</td><td>${a.sync ? 'Live' : 'Async'}</td><td>${esc(pn(p, a.owner)?.institution || 'Not set')}</td><td>${(a.outcomes || []).map(id => 'O' + outIdx(id)).join(', ')}</td></tr>`).join('')}</tbody></table>
      ${acts.map(a => `<div class="act"><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p><h4>Contributions</h4><ul>${(a.participants || []).map(id => `<li><strong>${esc(pn(p, id)?.institution)}:</strong> ${esc(a.contributions?.[id] || 'Not set')} (${a.workload?.[id] ?? '?'} h)</li>`).join('')}</ul>${a.dependsOn?.length ? `<p><strong>Builds on:</strong> ${a.dependsOn.map(id => esc(p.activities.find(x => x.id === id)?.title || '')).join(', ')}</p>` : ''}<p><strong>Contingency:</strong> ${esc(a.contingency || 'Not set')}</p><p><strong>Access & alternatives:</strong> ${esc(a.accessibility || 'Not set')}</p>${a.evidence?.types ? `<p><strong>Evidence & perspective agreement:</strong> ${esc(a.evidence.types)}${a.evidence.conflicting ? ' · Conflicts: ' + esc(a.evidence.conflicting) : ''}${a.evidence.consensus ? ' · Consensus: ' + esc(a.evidence.consensus) : ''}</p>` : ''}${a.instructions ? `<h4>Student instructions</h4>${md(a.instructions)}` : ''}</div>`).join('')}`)}
    ${sec('5. Assessment', p.assessments.map(s => `<div class="act"><h3>${esc(s.title)}</h3><p>${esc(s.layer)} · evidence for ${(s.outcomes || []).map(id => 'O' + outIdx(id)).join(', ') || 'Not set'}</p>${(s.criteria || []).length ? `<table><thead><tr><th>Criterion</th><th>Exemplary</th><th>Proficient</th><th>Developing</th><th>Beginning</th></tr></thead><tbody>${s.criteria.map(c => `<tr><th>${esc(c.name)}<br><small>${esc(c.description)}</small></th><td>${esc(c.levels?.exemplary)}</td><td>${esc(c.levels?.proficient)}</td><td>${esc(c.levels?.developing)}</td><td>${esc(c.levels?.beginning)}</td></tr>`).join('')}</tbody></table>` : ''}<h4>Local arrangements</h4><ul>${ps.map(x => `<li>${esc(x.institution)}: ${s.local?.[x.id]?.weight ?? 'Not set'}% ${esc(s.local?.[x.id]?.notes || '')}</li>`).join('')}</ul></div>`).join(''))}
    ${sec('6. Calendar & workload', `<p>${ov.ok ? `Shared window ${T.fmtDate(ov.start)} - ${T.fmtDate(ov.end)} (${ov.weeks} teaching weeks excluding breaks).` : esc(ov.reason)}</p><table><thead><tr><th>Cohort</th><th>Planned student hours</th><th>Stated capacity / week</th></tr></thead><tbody>${ps.map(x => `<tr><td>${esc(x.institution)}</td><td>${hours[x.id]}</td><td>${esc(x.course.workloadHoursPerWeek || 'Not set')}</td></tr>`).join('')}</tbody></table>
      ${p.meetings.length ? `<h3>Live sessions</h3><ul>${p.meetings.map(m => `<li>${esc(m.title)}: ${ps.map(x => `${esc(x.institution)} ${T.fmtDateTime(new Date(m.start), x.timezone)}`).join(' / ')}</li>`).join('')}</ul>` : ''}`)}
    ${sec('7. Review report', `<p>${F.filter(f => f.severity === 'blocker').length} blockers · ${F.filter(f => f.severity === 'discuss').length} items for discussion · ${F.filter(f => f.severity === 'missing').length} missing evidence.</p><ul>${F.filter(f => f.severity !== 'ok').slice(0, 40).map(f => `<li><strong>${esc(DIMENSIONS.find(d => d[0] === f.dimension)?.[1])}:</strong> ${esc(f.title)}: ${esc(f.detail)}</li>`).join('')}</ul>
      <h3>Counterfactual collaboration test</h3><ul>${counterfactual(p).map(r => `<li>${esc(r.partner.institution)}: ${r.direct.length} activities need this cohort directly; ${r.unprotected.length} affected activities lack a contingency.</li>`).join('')}</ul>`)}
    ${sec('8. Approval record', `<table><thead><tr><th>Decision</th><th>Type</th><th>Status</th>${ps.map(x => `<th>${esc(x.institution)}</th>`).join('')}</tr></thead><tbody>${p.decisions.map(d => `<tr><td>${esc(d.title)}</td><td>${esc(d.type)}</td><td>${esc(decisionStatus(p, d).status)}</td>${ps.map(x => `<td>${esc(d.approvals?.[x.id]?.status || 'Not set')}${d.approvals?.[x.id]?.at ? '<br><small>' + new Date(d.approvals[x.id].at).toLocaleDateString() + '</small>' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`)}
    ${p.glossary.length ? sec('9. Glossary', `<table><tbody>${p.glossary.map(g => `<tr><th>${esc(g.term)}</th><td>${Object.entries(g.definitions || {}).map(([k, v]) => `<em>${esc(k.replace(/_/g, ' '))}:</em> ${esc(v)}`).join('<br>')}</td></tr>`).join('')}</tbody></table>`) : ''}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(p.title)}: ${studentOnly ? 'Student guide' : 'Course design package'}</title><meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2328;max-width:900px;margin:40px auto;padding:0 24px}h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;border-bottom:1px solid #ddd;padding-bottom:6px;margin-top:36px}h3{font-size:17px;margin:20px 0 6px}h4{font-size:15px;margin:14px 0 4px}table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f5f2ec}.meta{color:#555;font-size:14px}.draft{background:#fbeee6;color:#7a3612;padding:8px 12px;border-radius:6px;font-weight:600}.act{break-inside:avoid;margin:14px 0}@media print{body{margin:0}a{color:inherit}}</style></head><body>
  <h1>${esc(p.title)}</h1><p class="meta">${studentOnly ? 'Student guide' : 'Course design package'} · ${ps.map(x => esc(x.institution)).join(' × ')} · ${rel ? `Release <strong>${esc(rel.label)}</strong> · ${new Date(rel.at).toLocaleDateString()}` : 'Generated ' + new Date().toLocaleDateString()}</p>
  ${draft ? '<p class="draft">WORKING DRAFT: not an approved release. Do not distribute to students.</p>' : ''}
  ${studentOnly ? student : full}
  <p class="meta" style="margin-top:40px">Produced with Crosscourse. AI-assisted content was reviewed and approved by the teaching partners named above${draft ? ' (pending)' : ''}.</p></body></html>`;
}

export function packageMD(p) {
  const ps = active(p);
  return `# ${p.title}\n\n${ps.map(x => `- **${x.institution}** (${x.country}): ${x.name}, ${x.course.title || ''}`).join('\n')}\n\n## Design brief\n\n**Challenge:** ${p.brief.challenge}\n\n**Question:** ${p.brief.question}\n\n**Why international:** ${p.brief.whyInternational}\n\n## Shared outcomes\n\n${p.outcomes.map((o, i) => `${i + 1}. (${o.type}) ${o.text}\n   - Evidence: ${o.evidence}`).join('\n')}\n\n## Learning sequence\n\n${p.activities.map(a => `### ${a.title}\n\n- Stage: ${S.STAGES.find(s => s.key === a.stage)?.label}\n- Dates: ${a.start || '?'} → ${a.end || '?'} (${a.sync ? 'live' : 'async'})\n- Owner: ${pn(p, a.owner)?.institution || 'Not set'}\n${(a.participants || []).map(id => `- ${pn(p, id)?.institution}: ${a.contributions?.[id] || 'Not set'}`).join('\n')}\n- Contingency: ${a.contingency || 'Not set'}\n\n${a.instructions || a.summary || ''}\n`).join('\n')}\n## Assessment\n\n${p.assessments.map(s => `### ${s.title}\n\n${(s.criteria || []).map(c => `- **${c.name}**: ${c.description}`).join('\n')}`).join('\n\n')}\n`;
}

app.register({
  async 'create-release'() {
    const p = app.p;
    const gate = releaseGate(p);
    const unmet = gate.filter(g => !g.ok && !g.label.startsWith('Every affected partner has approved'));
    if (unmet.length) {
      const r = await modal({ title: 'Some gate conditions are not met', body: `<ul>${unmet.map(g => `<li>${esc(g.label)}</li>`).join('')}</ul><p class="small">You can still create a candidate and ask partners to accept these explicitly; the release record will show what was unmet.</p>`, actions: [{ label: 'Cancel', value: null }, { label: 'Create anyway', value: 'ok', kind: 'primary' }] });
      if (!r?.value) return;
    }
    const n = p.releases.length + 1;
    const snapshot = structuredClone({ ...p, releases: [], events: [], proposals: [] });
    const label = `R${n}-${hash(JSON.stringify(snapshot))}`;
    const rel = { id: S.uid('rel_'), label, at: S.now(), by: app.me?.id, gatePassed: gate.filter(g => g.ok).length, unmet: unmet.map(g => g.label), snapshot, approvals: {}, updatedAt: S.now(), updatedBy: app.me?.id };
    const dec = { id: S.uid('dec_'), title: `Approve release ${label} for implementation`, description: `Freezes the current design for teaching.${unmet.length ? `\n\nUnmet gate conditions accepted with this release:\n${unmet.map(g => '- ' + g.label).join('\n')}` : ''}`, type: 'shared', affected: active(p).filter(x => x.role === 'representative').map(x => x.id), approvals: {}, linked: { kind: 'releases', id: rel.id }, createdBy: app.me?.id, createdAt: S.now(), updatedAt: S.now(), updatedBy: app.me?.id };
    rel.decisionId = dec.id;
    app.mutate(pp => { pp.releases.push(rel); pp.decisions.push(dec); }, `Created release candidate ${label}`, { kind: 'releases', id: rel.id });
    toast(`Release ${label} created. Each partner approves it under Decisions.`, 'ok');
  },
  'export-html'(d) {
    const rel = d.rel ? app.p.releases.find(r => r.id === d.rel) : null;
    const html = packageHTML(rel ? { ...rel.snapshot, releases: app.p.releases, decisions: app.p.decisions } : app.p, rel);
    download(`${slug(app.p.title)}-${rel ? rel.label : 'draft'}-design-package.html`, html, 'text/html');
  },
  'export-students'(d) {
    const rel = app.p.releases.find(r => r.id === d.rel);
    download(`${slug(app.p.title)}-${rel.label}-student-guide.html`, packageHTML(rel.snapshot, rel, true), 'text/html');
  },
  'export-md'() { download(`${slug(app.p.title)}-draft.md`, packageMD(app.p), 'text/markdown'); },
  'export-json'() { download(`${slug(app.p.title)}-course-model.json`, JSON.stringify(app.p, null, 2)); },
  'export-ics'() {
    const p = app.p;
    const evs = [...p.activities.filter(a => a.start).map(a => ({ uid: a.id, title: `[Crosscourse] ${a.title}`, allDay: true, startYmd: a.start, endYmd: a.end || a.start, description: a.summary })),
    ...p.meetings.map(m => ({ uid: m.id, title: m.title, start: new Date(m.start), end: new Date(Date.parse(m.start) + m.duration * 60000), description: m.agenda, location: m.link }))];
    download(`${slug(p.title)}-calendar.ics`, T.buildICS(evs), 'text/calendar');
  },
  'ai-coach'(d, btn) { return propose('coach', { stage: d.stage || 'release' }, {}, btn); },
  'ai-student-brief'(d, btn) { return propose('studentBrief', {}, {}, btn); }
});
