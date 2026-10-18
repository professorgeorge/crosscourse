import * as S from './store.js';
import { esc, icon, toast, modal, chip, fmtAgo } from './ui.js';
import { aiLabel, aiEnabled } from './ai.js';
import { decisionStatus } from './checks.js';

// ---------- Global app state ----------
export const app = {
  p: null, me: null, route: [], actions: {}, views: {},
  get settings() { return S.settings.get(); },
  saveSoon() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.save(), 250);
  },
  save() {
    if (!this.p) return;
    if (!S.saveProject(this.p)) toast('Storage is full. Export your project file to keep a copy.', 'warn');
    setSaved();
  },
  /** Make a change, record who made it, persist, re-render. */
  mutate(fn, summary, target = null, { rerender = true, type = 'change' } = {}) {
    const res = fn(this.p);
    if (summary) S.logEvent(this.p, this.me?.id || null, type, summary, target);
    this.save();
    if (rerender) this.render();
    return res;
  },
  touch(entity) {
    if (!entity) return;
    const p = this.p;
    if (p) {
      // Remember which synced version this local edit builds on (for conflict-free merges).
      p._dirty = p._dirty || {};
      if (!p._dirty[entity.id]) { entity.baseAt = entity.updatedAt || null; p._dirty[entity.id] = true; }
      // Editing something that is awaiting approval invalidates votes cast on the earlier version.
      if (['pending', 'objection'].includes(entity.status)) for (const d of p.decisions) if (d.linked?.id === entity.id) d.revisedAt = S.now();
    }
    entity.updatedAt = S.now(); entity.updatedBy = this.me?.id || null;
  },
  go(hash) { location.hash = hash; },
  render() { render(); },
  register(actions) { Object.assign(this.actions, actions); },
  view(name, def) { this.views[name] = def; }
};
window.crosscourse = app;

// ---------- Routing ----------
const NAV = [
  { group: 'Course Blueprint', items: [
    ['overview', '3-Pillar Blueprint', 'home'],
    ['partners', 'Consortium Campuses', 'users'],
    ['design', 'Weekly Arc & Activities', 'route'],
    ['sync', 'Download Deliverables', 'download']
  ] },
  { group: 'Curriculum Foundations', items: [
    ['frame', 'Driving Question & Vision', 'frame'],
    ['charter', 'Consortium Charter', 'scroll'],
    ['outcomes', 'Shared Outcomes', 'target'],
    ['assess', 'Assessments & Rubric', 'checks']
  ] },
  { group: 'Coordination Tools', items: [
    ['schedule', 'Calendar & Time Zones', 'calendar'],
    ['meetings', 'Meetings', 'video'],
    ['decisions', 'Consensus & Decisions', 'vote'],
    ['review', 'Readiness Review', 'shield']
  ] }
];

function parseRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  return h ? h.split('/').map(decodeURIComponent) : [];
}

function setSaved() {
  const el = document.getElementById('save-state');
  if (el) { el.textContent = S.persistent ? 'Saved on this device' : 'Not saved (preview mode)'; el.classList.toggle('warn', !S.persistent); }
}

function pendingForMe(p, me) {
  if (!me) return 0;
  let n = 0;
  for (const d of p.decisions) { const st = decisionStatus(p, d); if (st.waiting.includes(me.id) && st.status !== 'approved') n++; }
  n += p.proposals.filter(x => x.status === 'pending').length;
  return n;
}

function shell(content, p) {
  const me = app.me;
  const cur = app.route[2] || 'overview';
  const s = app.settings;
  const nav = p ? NAV.map(g => `<div class="nav-group"><p class="nav-label">${g.group}</p>${g.items.map(([k, l, ic]) => {
    const badge = k === 'decisions' ? pendingForMe(p, me) : 0;
    return `<a href="#/p/${p.id}/${k}" class="nav-item ${cur === k ? 'active' : ''}" ${cur === k ? 'aria-current="page"' : ''}>${icon[ic]}<span>${l}</span>${badge ? `<span class="count">${badge}</span>` : ''}</a>`;
  }).join('')}</div>`).join('') : '';
  return `
  <a class="skip" href="#main">Skip to content</a>
  <div class="layout ${p ? 'has-side' : ''}">
    ${p ? `<aside class="side" id="side" aria-label="Project navigation">
      <a class="brand" href="#/">${brandMark()}<span>Crosscourse</span></a>
      <a class="project-switch" href="#/" title="All projects">${icon.back}<span>${esc(p.title)}</span></a>
      <nav>${nav}</nav>
      <div class="side-foot">
        <button class="me-card" data-action="choose-identity">${me ? `<span class="dot" style="--c:${me.color}"></span><span><strong>${esc(me.name || 'You')}</strong><small>${esc(me.institution)}</small></span>` : `<span><strong>Who are you?</strong><small>Choose your partner profile</small></span>`}</button>
      </div>
    </aside>` : ''}
    <div class="main-col">
      <header class="topbar">
        ${p ? `<button class="icon-btn only-mobile" data-action="toggle-nav" aria-label="Open navigation">${icon.menu}</button>` : `<a class="brand" href="#/">${brandMark()}<span>Crosscourse</span></a>`}
        <div class="top-meta">
          <span id="save-state" class="save-state"></span>
          <a href="#/settings" class="ai-pill ${aiEnabled() ? 'on' : ''}" title="AI assistant settings">${icon.sparkle}<span>${esc(aiLabel())}</span></a>
          <button class="icon-btn" data-action="toggle-theme" aria-label="Toggle colour theme">${document.documentElement.dataset.theme === 'dark' ? icon.sun : icon.moon}</button>
          <a class="icon-btn" href="#/settings" aria-label="Settings">${icon.gear}</a>
        </div>
      </header>
      ${!S.persistent ? `<div class="banner warn">${icon.alert}<span>This browser context blocks local storage, so work isn’t saved between visits. Open the app directly (or install it) and export project files regularly.</span></div>` : ''}
      <main id="main" tabindex="-1">${content}</main>
      <footer class="app-footer">
        <p>Conceptualized and developed by <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a></p>
      </footer>
    </div>
  </div>
  <div class="scrim" data-action="toggle-nav"></div>`;
}
export function brandMark() {
  return `<svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="12" cy="16" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="20" cy="16" r="8.5" fill="none" stroke="var(--color-primary)" stroke-width="2.2"/></svg>`;
}

function render() {
  app.route = parseRoute();
  const [section, pid, view = 'overview', ...rest] = app.route;
  const root = document.getElementById('app');
  const y = window.scrollY;
  const same = root.dataset.route === location.hash;
  let html;
  if (section === 'p' && pid) {
    if (!app.p || app.p.id !== pid) app.p = S.loadProject(pid);
    if (!app.p) { location.hash = '#/'; return; }
    const ids = app.settings.identities;
    app.me = app.p.partners.find(x => x.id === ids[pid]) || null;
    const v = app.views[view] || app.views.overview;
    try { html = shell(v.render({ p: app.p, me: app.me, params: rest }), app.p); }
    catch (e) { console.error(e); html = shell(`<div class="page"><h1>Something went wrong</h1><pre class="err">${esc(e.stack || e.message)}</pre></div>`, app.p); }
    document.title = `${app.p.title} · Crosscourse`;
  } else {
    app.p = null; app.me = null;
    const v = section === 'settings' ? app.views.settings : app.views.home;
    html = shell(v.render({ params: app.route.slice(1) }), null);
    document.title = 'Crosscourse: international course co-design';
  }
  root.innerHTML = html;
  root.dataset.route = location.hash;
  setSaved();
  if (same) window.scrollTo(0, y); else { window.scrollTo(0, 0); }
  const v = section === 'p' ? (app.views[view] || app.views.overview) : null;
  v?.after?.({ p: app.p, me: app.me, params: rest });
  if (section === 'p' && !app.me && app.p.partners.length && !app._askedId) { app._askedId = true; setTimeout(() => app.actions['choose-identity'](), 50); }
}

// ---------- Data binding ----------
function readValue(el) {
  if (el.type === 'checkbox') return el.checked;
  if (el.type === 'number') return el.value === '' ? '' : Number(el.value);
  return el.value;
}
function onModel(e) {
  const el = e.target.closest('[data-model]');
  if (!el || !app.p) return;
  const path = el.dataset.model;
  const r = S.resolvePath(app.p, path);
  if (!r) return;
  let v = readValue(el);
  if (el.dataset.arrayValue !== undefined) {
    const arr = Array.isArray(r.parent[r.key]) ? r.parent[r.key] : (r.parent[r.key] = []);
    const val = el.dataset.arrayValue;
    const num = /^\d+$/.test(val) ? Number(val) : val;
    const i = arr.indexOf(num);
    if (el.checked && i < 0) arr.push(num);
    if (!el.checked && i >= 0) arr.splice(i, 1);
  } else r.parent[r.key] = v;
  const ent = r.entity;
  if (ent) {
    app.touch(ent);
    if (ent.status === 'approved' && !path.endsWith('.status')) {
      ent.status = 'changed';
      S.logEvent(app.p, app.me?.id, 'impact', `Approved item changed, now needs re-approval: ${ent.title || ent.text?.slice(0, 50) || r.collection}`, { kind: r.collection, id: ent.id });
      toast('This item was approved. Your edit marks it for re-approval.', 'warn');
    }
    // Context-card provenance: an edit by the card's owner confirms; by anyone else, it's "reported".
    if (r.collection === 'partners' && r.parent === ent.course) {
      ent.fieldStates = ent.fieldStates || {};
      ent.fieldStates[r.key] = app.me?.id === ent.id ? 'confirmed' : 'reported';
    }
    S.logEvent(app.p, app.me?.id || null, 'edit', `Edited ${labelFor(r.collection, ent)}`, { kind: r.collection, id: ent.id });
  }
  app.saveSoon();
  if (el.hasAttribute('data-rerender') && e.type === 'change') app.render();
}
function labelFor(col, ent) {
  const name = ent.title || ent.name || ent.term || ent.topic || (ent.text || '').slice(0, 40) || col;
  return `${({ partners: 'context card', outcomes: 'outcome', activities: 'activity', assessments: 'assessment', decisions: 'decision', meetings: 'meeting', brief: 'design brief', charter: 'charter', glossary: 'glossary term', differences: 'difference' })[col] || col}: ${name}`;
}
document.addEventListener('input', e => { if (e.target.matches('input:not([type=checkbox]):not([type=radio]), textarea')) onModel(e); });
document.addEventListener('change', e => { if (e.target.matches('select, input[type=checkbox], input[type=radio], input[type=date], input[type=time]')) onModel(e); else if (e.target.hasAttribute('data-rerender')) app.render(); });

// ---------- Action dispatch ----------
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = app.actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  try { await fn(el.dataset, el, e); }
  catch (err) { console.error(err); toast(err.message || String(err), 'error'); }
});

// ---------- Core actions ----------
app.register({
  'toggle-nav'() { document.body.classList.toggle('nav-open'); },
  'toggle-theme'() {
    const s = S.settings.get();
    const curr = document.documentElement.dataset.theme;
    s.theme = curr === 'dark' ? 'light' : 'dark';
    S.settings.save(s); applyTheme(); render();
  },
  async 'choose-identity'() {
    const p = app.p;
    if (!p) return;
    const r = await modal({
      title: 'Which partner are you?',
      body: `<p class="muted">Crosscourse records who proposes, edits and approves. This choice is stored only on this device.</p>
        <div class="choice-list">${p.partners.map(x => `<label class="choice"><input type="radio" name="pid" value="${x.id}" ${app.me?.id === x.id ? 'checked' : ''}>${chip(x)}<span class="muted">${esc(x.name)}</span></label>`).join('')}</div>`,
      actions: [{ label: 'Cancel', value: null }, { label: 'This is me', value: 'ok', kind: 'primary' }]
    });
    if (r?.value && r.data.pid) {
      const s = S.settings.get();
      s.identities[p.id] = r.data.pid;
      S.settings.save(s);
      render();
    }
  },
  'mark-seen'() {
    const s = S.settings.get();
    s.lastSeen[app.p.id] = S.now();
    S.settings.save(s);
    render();
  }
});

// ---------- Theme ----------
export function applyTheme() {
  const t = S.settings.get().theme;
  const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

// ---------- Boot ----------
export async function boot() {
  applyTheme();
  window.addEventListener('hashchange', () => { document.body.classList.remove('nav-open'); app._askedId = false; render(); });
  render();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    try { await navigator.serviceWorker.register('./sw.js'); } catch { }
  }
}
export { render };
