import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, field, chip, badge, modal, toast, download, md, empty, confirmBox } from '../ui.js';
import * as T from '../time.js';
import { head } from './project.js';
import { propose, proposalsFor } from './proposals.js';
import { decisionStatus } from '../checks.js';
import { commentsBlock } from './govern.js';
import { tzOptions } from './home.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const active = p => p.partners.filter(x => x.status !== 'withdrawn');
const viewerTz = () => app.me?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

// ================= Calendar & time =================
function timeline(p) {
  const ps = active(p).filter(x => x.course.termStart && x.course.termEnd);
  if (!ps.length) return empty('No term dates yet', 'Each partner adds term start/end and breaks on their context card.');
  const lo = ps.map(x => x.course.termStart).sort()[0], hi = ps.map(x => x.course.termEnd).sort().at(-1);
  const span = Math.max(1, T.daysBetween(lo, hi) + 1);
  const pct = d => (T.daysBetween(lo, d) / span * 100).toFixed(2);
  const w = (a, b) => ((T.daysBetween(a, b) + 1) / span * 100).toFixed(2);
  const ov = T.termOverlap(ps);
  const months = [];
  let m = lo.slice(0, 7) + '-01';
  while (m <= hi) { if (m >= lo) months.push(m); const [y, mm] = m.split('-').map(Number); m = `${mm === 12 ? y + 1 : y}-${T.pad(mm === 12 ? 1 : mm + 1)}-01`; }
  const acts = p.activities.filter(a => a.start && a.end);
  return `<div class="timeline">
    <div class="tl-row tl-axis"><span class="tl-label"></span><div class="tl-track">${months.map(d => `<span class="tl-tick" style="left:${pct(d)}%">${new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'))}</span>`).join('')}</div></div>
    ${ov.ok ? `<div class="tl-overlap" style="left:calc(var(--tl-label) + (100% - var(--tl-label)) * ${pct(ov.start) / 100});width:calc((100% - var(--tl-label)) * ${w(ov.start, ov.end) / 100})" aria-hidden="true"></div>` : ''}
    ${ps.map(x => `<div class="tl-row"><span class="tl-label">${chip(x, { small: true })}</span><div class="tl-track"><span class="tl-term" style="left:${pct(x.course.termStart)}%;width:${w(x.course.termStart, x.course.termEnd)}%;--c:${x.color}" title="${esc(x.course.termStart)} → ${esc(x.course.termEnd)}"></span>${(x.course.breaks || []).filter(b => b.start && b.end).map(b => `<span class="tl-break" style="left:${pct(b.start)}%;width:${w(b.start, b.end)}%" title="${esc(b.label || 'Break')}: ${esc(b.start)} → ${esc(b.end)}"></span>`).join('')}</div></div>`).join('')}
    ${acts.length ? `<div class="tl-row"><span class="tl-label small muted">Activities</span><div class="tl-track acts">${acts.map((a, i) => `<a class="tl-act ${a.sync ? 'live' : ''}" href="#/p/${p.id}/design/${a.id}" style="left:${pct(a.start)}%;width:${Math.max(0.8, w(a.start, a.end))}%;top:${(i % 3) * 12}px" title="${esc(a.title)}: ${esc(a.start)} → ${esc(a.end)}"></a>`).join('')}</div></div>` : ''}
  </div>
  <p class="small">${ov.ok ? `<strong>${ov.weeks} shared teaching weeks</strong> (${T.fmtDate(ov.start)} → ${T.fmtDate(ov.end)}), excluding breaks. Shaded band = overlap; hatched = breaks.` : `<strong class="bad-text">${esc(ov.reason)}</strong>`}</p>`;
}

function hourGrid(p, ymd) {
  const tz = viewerTz();
  const ps = active(p);
  const hours = [...Array(24).keys()].map(h => T.zonedToUtc(ymd, T.pad(h) + ':00', tz));
  const all = hours.map(d => { const cls = ps.map(x => T.hourClass(x, d)); return cls.every(c => c === 'work') ? 'work' : cls.every(c => c !== 'off') ? 'flex' : 'off'; });
  return `<div class="hourgrid" role="table" aria-label="Working hours by partner">
    <div class="hg-row hg-head" role="row"><span class="hg-label" role="columnheader">Your time (${esc(T.tzAbbrev(tz, hours[12]))})</span>${hours.map((d, h) => `<span class="hg-cell" role="columnheader">${h % 3 === 0 ? T.pad(h) : ''}</span>`).join('')}</div>
    ${ps.map(x => `<div class="hg-row" role="row"><span class="hg-label" role="rowheader">${chip(x, { small: true })}</span>${hours.map(d => `<span class="hg-cell c-${T.hourClass(x, d)}" role="cell" title="${esc(x.institution)}: ${T.fmtDateTime(d, x.timezone)}"></span>`).join('')}</div>`).join('')}
    <div class="hg-row hg-all" role="row"><span class="hg-label" role="rowheader"><strong>Everyone</strong></span>${all.map((c, h) => `<span class="hg-cell c-${c}" role="cell" title="${T.fmtTime(hours[h], tz)}"></span>`).join('')}</div>
  </div>
  <div class="legend"><span><i class="c-work"></i>Core hours</span><span><i class="c-flex"></i>Flexible</span><span><i class="c-off"></i>Off / weekend</span></div>`;
}

app.view('schedule', {
  render({ p }) {
    const ov = T.termOverlap(active(p));
    const today = T.ymdOf(new Date(), viewerTz());
    const day = app._gridDay || (ov.ok && ov.start > today ? ov.start : today);
    const flex = !!app._flex;
    const wins = active(p).length >= 2 ? T.findOverlaps(active(p), day, 14, { flex, minMinutes: 30 }) : [];
    return `<div class="page">${head('Calendar & time zones', 'Calculated, not guessed: academic-calendar overlap and DST-aware working-hour windows for every partner.')}
      <section class="card"><h2>Academic calendars</h2>${timeline(p)}</section>
      <section class="card">
        <div class="section-head"><h2>Working hours on a day</h2><div class="field inline"><label for="grid-day">Date</label><input type="date" id="grid-day" value="${day}" data-action-change="grid-day"></div></div>
        ${active(p).length ? hourGrid(p, day) : ''}
      </section>
      <section class="card">
        <div class="section-head"><h2>Fair windows for live sessions</h2><label class="check small"><input type="checkbox" id="flex-toggle" ${flex ? 'checked' : ''} data-action-change="flex"><span>Include flexible hours</span></label></div>
        <p class="muted small">Next 14 days from ${T.fmtDate(day)}. ${flex ? 'Flexible hours ask someone to stretch; rotate who carries that burden.' : 'Core hours only.'}</p>
        ${wins.length ? `<ul class="windows">${wins.slice(0, 20).map(w => `<li><div class="win-times">${active(p).map(x => `<span>${chip(x, { small: true })}<span class="mono">${T.fmtDateTime(w.start, x.timezone)} - ${T.fmtTime(w.end, x.timezone)}</span></span>`).join('')}</div><span class="muted small">${Math.floor(w.minutes / 60)}h ${w.minutes % 60}m</span><button class="btn sm" data-action="new-meeting" data-start="${w.start.toISOString()}">${icon.video} Schedule</button></li>`).join('')}</ul>` : `<p class="banner warn">${icon.alert}<span>${active(p).length < 2 ? 'Add at least two partners.' : flex ? 'No time when everyone is within flexible hours. Prefer asynchronous exchanges, or split live sessions by region.' : 'No overlap in core hours. Try including flexible hours, or keep collaboration asynchronous.'}</span></p>`}
      </section>
    </div>`;
  }
});
document.addEventListener('change', e => {
  const a = e.target.dataset?.actionChange;
  if (a === 'grid-day') { app._gridDay = e.target.value; app.render(); }
  if (a === 'flex') { app._flex = e.target.checked; app.render(); }
});

// ================= Meetings =================
function meetingTimes(p, m) {
  const s = new Date(m.start), e = new Date(s.getTime() + m.duration * 60000);
  return active(p).map(x => `<li>${chip(x, { small: true })}<span class="mono">${T.fmtDateTime(s, x.timezone)} - ${T.fmtTime(e, x.timezone)}</span><span class="hc-${T.hourClass(x, s)} small">${({ work: 'core hours', flex: 'flexible hours', off: 'outside working hours' })[T.hourClass(x, s)]}</span></li>`).join('');
}
function inviteText(p, m) {
  const s = new Date(m.start), e = new Date(s.getTime() + m.duration * 60000);
  return `${m.title}\n${p.title}\n\n${active(p).map(x => `${x.institution}: ${T.fmtDateTime(s, x.timezone)} - ${T.fmtTime(e, x.timezone)} (${T.tzAbbrev(x.timezone, s)})`).join('\n')}\n\nJoin: ${m.link || '(link to follow)'}\n\nAgenda:\n${m.agenda || '(to be shared)'}\n\nCan’t attend? Add your view as a comment on the decisions in Crosscourse beforehand; it will be read at the meeting.`;
}
app.view('meetings', {
  render({ p }) {
    const now = Date.now();
    const ms = p.meetings.slice().sort((a, b) => a.start.localeCompare(b.start));
    const up = ms.filter(m => Date.parse(m.start) + m.duration * 60000 >= now), past = ms.filter(m => Date.parse(m.start) + m.duration * 60000 < now).reverse();
    const card = m => {
      const M = `meetings[${m.id}]`;
      const s = new Date(m.start), e = new Date(s.getTime() + m.duration * 60000);
      const det = inviteText(p, m);
      return `<article class="card meeting" id="${m.id}">
        <div class="section-head"><div class="grow"><input class="title-input sm" data-model="${M}.title" value="${esc(m.title)}" aria-label="Meeting title"></div><div class="row gap wrap">
          ${m.link ? `<a class="btn sm primary" href="${esc(m.link)}" target="_blank" rel="noopener">${icon.video} Join</a>` : ''}
          <button class="btn sm" data-action="meeting-ics" data-id="${m.id}">${icon.download} .ics</button>
          <a class="btn sm" target="_blank" rel="noopener" href="${esc(T.googleCalUrl({ title: m.title, start: s, end: e, details: det, location: m.link }))}">Google</a>
          <a class="btn sm" target="_blank" rel="noopener" href="${esc(T.outlookCalUrl({ title: m.title, start: s, end: e, details: det, location: m.link }))}">Outlook</a>
          <button class="btn sm" data-action="meeting-copy" data-id="${m.id}">${icon.copy} Copy invitation</button>
          <button class="icon-btn" data-action="del-item" data-col="meetings" data-id="${m.id}" aria-label="Delete meeting">${icon.trash}</button></div></div>
        <ul class="clock-list">${meetingTimes(p, m)}</ul>
        <div class="grid2">${field('Video link', `${M}.link`, m.link, { placeholder: 'Zoom / Teams / Meet / Jitsi URL' })}<div class="field"><label>&nbsp;</label><button class="btn sm" data-action="jitsi" data-id="${m.id}">Create a free Jitsi room link</button></div></div>
        <div class="section-head"><h3 class="sub">Agenda</h3><button class="btn sm" data-action="ai-agenda" data-id="${m.id}">${icon.sparkle} Draft from open items</button></div>
        ${proposalsFor({ ...p, proposals: p.proposals.filter(x => x.meetingId === m.id) }, ['agenda'])}
        ${field('Agenda', `${M}.agenda`, m.agenda, { type: 'textarea', rows: 5 })}
        ${field('Notes & outcomes (shared with partners who couldn’t attend)', `${M}.notes`, m.notes, { type: 'textarea', rows: 4 })}
        <button class="btn sm" data-action="meeting-decision" data-id="${m.id}">${icon.vote} Record a decision from this meeting</button>
      </article>`;
    };
    return `<div class="page">${head('Live sessions', 'Most co-design happens asynchronously. Meet live for what genuinely needs conversation, and record outcomes for anyone who couldn’t join.', `<a class="btn" href="#/p/${p.id}/schedule">${icon.clock} Find a fair time</a><button class="btn primary" data-action="new-meeting">${icon.plus} Schedule session</button>`)}
      <section class="section"><h2>Upcoming</h2>${up.length ? `<div class="stack">${up.map(card).join('')}</div>` : empty('No upcoming sessions', 'Use “Find a fair time” to see windows inside everyone’s working hours.')}</section>
      ${past.length ? `<section class="section"><h2>Past</h2><div class="stack">${past.map(card).join('')}</div></section>` : ''}
    </div>`;
  }
});

app.register({
  async 'new-meeting'(d = {}) {
    const p = app.p, tz = viewerTz();
    const start = d.start ? new Date(d.start) : new Date(Date.now() + 86400000 * 2);
    const ymd = T.ymdOf(start, tz), pt = T.parts(start, tz);
    const r = await modal({
      title: 'Schedule a live co-design session',
      body: `<div class="field"><label for="m-title">Title</label><input id="m-title" name="title" required value="Co-design session"></div>
        <div class="grid3"><div class="field"><label for="m-date">Date</label><input id="m-date" type="date" name="date" required value="${ymd}"></div><div class="field"><label for="m-time">Time</label><input id="m-time" type="time" name="time" required value="${T.pad(pt.H)}:${T.pad(Math.floor(pt.M / 15) * 15)}"></div><div class="field"><label for="m-dur">Minutes</label><input id="m-dur" type="number" name="duration" min="15" step="15" value="60"></div></div>
        <div class="field"><label for="m-tz">Time zone of the time above</label><select id="m-tz" name="tz">${tzOptions(tz)}</select></div>
        <div class="field"><label for="m-link">Video link (optional)</label><input id="m-link" name="link" placeholder="Paste a Zoom/Teams/Meet link, or create a Jitsi room after saving"></div>`,
      actions: [{ label: 'Cancel', value: null }, { label: 'Save session', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }]
    });
    if (!r?.value) return;
    const m = { id: S.uid('mtg_'), title: r.data.title, start: T.zonedToUtc(r.data.date, r.data.time, r.data.tz).toISOString(), duration: Number(r.data.duration) || 60, link: r.data.link, agenda: '', notes: '', attendees: active(p).map(x => x.id), updatedAt: S.now(), updatedBy: app.me?.id };
    app.mutate(pp => pp.meetings.push(m), `Scheduled a live session: ${m.title}`, { kind: 'meetings', id: m.id }, { rerender: false });
    app.go(`#/p/${p.id}/meetings`);
    app.render();
    setTimeout(() => document.getElementById(m.id)?.scrollIntoView({ block: 'start' }), 50);
  },
  jitsi(d) {
    const m = app.p.meetings.find(x => x.id === d.id);
    const slug = app.p.title.replace(/[^a-z0-9]+/gi, '').slice(0, 24) || 'Crosscourse';
    app.mutate(() => { m.link = `https://meet.jit.si/Crosscourse-${slug}-${Math.random().toString(36).slice(2, 8)}`; app.touch(m); }, 'Added a Jitsi room to a session');
  },
  'meeting-ics'(d) {
    const m = app.p.meetings.find(x => x.id === d.id);
    const s = new Date(m.start);
    download(`${m.title.replace(/\W+/g, '-')}.ics`, T.buildICS([{ uid: m.id, title: m.title, start: s, end: new Date(s.getTime() + m.duration * 60000), description: inviteText(app.p, m), location: m.link, url: m.link }]), 'text/calendar');
  },
  async 'meeting-copy'(d) {
    const m = app.p.meetings.find(x => x.id === d.id);
    try { await navigator.clipboard.writeText(inviteText(app.p, m)); toast('Invitation copied with every partner’s local time.', 'ok'); }
    catch { toast('Copy failed. Your browser blocked clipboard access.', 'error'); }
  },
  'ai-agenda'(d, btn) {
    const p = app.p, m = p.meetings.find(x => x.id === d.id);
    const open = [...p.decisions.filter(x => !['approved', 'adopted'].includes(decisionStatus(p, x).status)).map(x => 'Decision: ' + x.title), ...p.differences.filter(x => x.status !== 'addressed' && x.kind === 'hard').map(x => 'Hard incompatibility: ' + x.topic)];
    return propose('agenda', { minutes: m.duration, open: open.length ? open : ['Review the draft learning sequence'] }, { meetingId: m.id }, btn);
  },
  'meeting-decision'(d) {
    const m = app.p.meetings.find(x => x.id === d.id);
    return app.actions['new-decision']({});
  }
});
