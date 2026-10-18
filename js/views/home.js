import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, modal, toast, pickFile, download, fmtAgo, chip, confirmBox } from '../ui.js';
import { allTimezones } from '../time.js';
import { PROVIDERS, testConnection } from '../ai.js';
import { demoProject } from '../demo.js';
import { importPacketFile } from './sync.js';

let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; });

export function tzOptions(sel) {
  return allTimezones().map(t => `<option value="${esc(t)}" ${t === sel ? 'selected' : ''}>${esc(t.replace(/_/g, ' '))}</option>`).join('');
}

export function partnerFormFields(x = {}) {
  const tz = x.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `<div class="grid2">
    <div class="field"><label for="pf-name">Full name</label><input id="pf-name" name="name" required value="${esc(x.name || '')}"></div>
    <div class="field"><label for="pf-email">Email</label><input id="pf-email" name="email" type="email" value="${esc(x.email || '')}"></div>
    <div class="field"><label for="pf-inst">Institution</label><input id="pf-inst" name="institution" required value="${esc(x.institution || '')}"></div>
    <div class="field"><label for="pf-country">Country</label><input id="pf-country" name="country" value="${esc(x.country || '')}"></div>
    <div class="field"><label for="pf-tz">Time zone</label><select id="pf-tz" name="timezone">${tzOptions(tz)}</select></div>
    <div class="field"><label for="pf-lang">Preferred working language</label><input id="pf-lang" name="language" value="${esc(x.language || 'English')}"></div>
  </div>
  <div class="field"><label for="pf-role">Role</label><select id="pf-role" name="role"><option value="representative">Institutional representative (approves shared decisions)</option><option value="co-designer" ${x.role === 'co-designer' ? 'selected' : ''}>Co-designer (contributes, does not approve)</option></select></div>`;
}

app.view('home', {
  render() {
    const projects = S.listProjects();
    return `<div class="page home">
      <section class="home-hero">
        <p class="eyebrow">International course co-design</p>
        <h1>Design a course <em>with</em> your international partners, not for them.</h1>
        <p class="lede">Crosscourse is a shared workspace where professors in different countries turn different courses, calendars and perspectives into one jointly owned learning experience. AI proposes; partners decide.</p>
        <div class="row gap">
          <button class="btn primary lg" data-action="new-project">${icon.plus} Start a partnership</button>
          <button class="btn lg" data-action="import-project">${icon.upload} Open a partner’s project file</button>
          <button class="btn ghost lg" data-action="load-demo">Explore a sample project</button>
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Your projects</h2><span class="muted">${projects.length ? `${projects.length} on this device` : ''}</span></div>
        ${projects.length ? `<div class="project-grid">${projects.map(p => `
          <a class="project-card" href="#/p/${p.id}/overview">
            <span class="pc-mode">${p.mode === 'course' ? 'Co-developed course' : 'Shared international module'}</span>
            <h3>${esc(p.title)}</h3>
            <div class="chips">${p.partners.map(x => chip(x, { small: true })).join('')}</div>
            <span class="muted small">Updated ${fmtAgo(p.updatedAt)} · ${p.activities.length} activities · ${p.decisions.length} decisions</span>
          </a>`).join('')}</div>` : `<div class="empty"><p class="empty-title">No projects yet</p><p>Start a partnership, open a project file a colleague sent you, or explore the sample to see a complete co-design in progress.</p></div>`}
      </section>

      <section class="section how">
        <h2>How asynchronous co-design works here</h2>
        <ol class="how-steps">
          <li><strong>Each partner describes their own context.</strong> Context cards stay separate before anything is merged, so differences are visible rather than smoothed over.</li>
          <li><strong>Work happens in your own time.</strong> Your project lives on your device. Send an update file to partners by email or a shared drive; when they open it, changes merge item by item and approvals from every partner are preserved.</li>
          <li><strong>AI drafts, the partnership decides.</strong> Every AI output lands in a proposal queue with its assumptions. Shared decisions need explicit approval from each affected institution; silence is never consent.</li>
          <li><strong>Meet live only when it helps.</strong> The time-zone planner finds fair windows across daylight-saving changes and creates calendar invitations.</li>
          <li><strong>Release a plan everyone has signed.</strong> An alignment review and release gate check reciprocity, feasibility and assessment before students arrive.</li>
        </ol>
      </section>
    </div>`;
  }
});

app.view('settings', {
  render() {
    const s = S.settings.get();
    const ai = s.ai;
    const prov = PROVIDERS[ai.provider] || PROVIDERS.none;
    return `<div class="page narrow">
      <a href="#/" class="back">${icon.back} Projects</a>
      <h1>Settings</h1>
      <section class="card">
        <h2>AI assistant</h2>
        <p class="muted">Crosscourse has no server. If you add a key, your browser calls the provider you choose directly; the key stays on this device and is never included in project files. Check your institution’s policy before sending course material to an AI provider.</p>
        <form id="ai-form" class="stack">
          <div class="field"><label for="ai-prov">Provider</label><select id="ai-prov" name="provider">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === ai.provider ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select></div>
          ${ai.provider !== 'none' ? `
          <div class="field"><label for="ai-key">API key</label><input id="ai-key" name="apiKey" type="password" autocomplete="off" value="${esc(ai.apiKey)}" placeholder="${esc(prov.keyHint || '')}"></div>
          <div class="field"><label for="ai-model">Model</label><input id="ai-model" name="model" list="model-list" value="${esc(ai.model)}" placeholder="${esc(prov.models[0] || 'model name')}"><datalist id="model-list">${prov.models.map(m => `<option value="${m}">`).join('')}</datalist><p class="hint">Any model your account can access. Leave blank for the default.</p></div>
          ${ai.provider === 'compatible' ? `<div class="field"><label for="ai-base">Base URL</label><input id="ai-base" name="baseUrl" value="${esc(ai.baseUrl)}" placeholder="https://openrouter.ai/api/v1 or http://localhost:11434/v1"></div>` : ''}` : `<p class="hint">Without AI, the alignment engine, calendar tools, approvals and exports all work fully. Assistants offer clearly-labelled templates instead of generated suggestions.</p>`}
          <div class="row gap"><button class="btn primary" data-action="save-ai">Save</button>${ai.provider !== 'none' ? `<button class="btn" data-action="test-ai">Test connection</button>` : ''}</div>
        </form>
      </section>
      <section class="card">
        <h2>Install as an app</h2>
        <p class="muted">Crosscourse is a progressive web app. Installed, it opens in its own window and works offline (AI features need a connection).</p>
        <button class="btn" data-action="install">${icon.download} Install Crosscourse</button>
      </section>
      <section class="card">
        <h2>Data on this device</h2>
        <p class="muted">${S.persistent ? 'Projects are saved in this browser’s local storage.' : 'Local storage is unavailable in this context; nothing persists after you close the page.'} Clearing browser data deletes them. Keep exported project files as backups.</p>
        <div class="row gap"><button class="btn" data-action="export-all">${icon.download} Export all projects</button><button class="btn danger" data-action="wipe">${icon.trash} Delete all local data</button></div>
      </section>
    </div>`;
  }
});

app.register({
  async 'new-project'() {
    const r = await modal({
      title: 'Start a partnership',
      body: `<div class="field"><label for="np-title">Working title</label><input id="np-title" name="title" required placeholder="e.g. Flood risk across two coasts"></div>
        <fieldset class="field"><legend>What are you designing?</legend>
          <label class="choice"><input type="radio" name="mode" value="module" checked><span><strong>A shared international module</strong><br><span class="muted">A 4-8 week collaboration embedded in each partner’s existing course</span></span></label>
          <label class="choice"><input type="radio" name="mode" value="course"><span><strong>A co-developed course</strong><br><span class="muted">A full course designed together from the start</span></span></label>
        </fieldset>
        <h3 class="sub">About you</h3>${partnerFormFields({ name: '' })}`,
      actions: [{ label: 'Cancel', value: null }, { label: 'Create project', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }]
    });
    if (!r?.value) return;
    const d = r.data;
    const p = S.blankProject(d.title || 'Untitled partnership');
    p.mode = d.mode;
    const me = S.blankPartner({ name: d.name, email: d.email, institution: d.institution, country: d.country, timezone: d.timezone, language: d.language, role: d.role }, 0);
    p.partners.push(me);
    S.logEvent(p, me.id, 'change', `Created the partnership “${p.title}”`);
    S.saveProject(p);
    const s = S.settings.get(); s.identities[p.id] = me.id; S.settings.save(s);
    app.go(`#/p/${p.id}/partners`);
    toast('Project created. Next: describe your course, then invite your partners.');
  },
  async 'import-project'() {
    const f = await pickFile('.json,application/json');
    if (f) await importPacketFile(f);
  },
  'load-demo'() {
    const p = demoProject();
    S.saveProject(p);
    const s = S.settings.get(); s.identities[p.id] = p.partners[0].id; S.settings.save(s);
    app.go(`#/p/${p.id}/overview`);
    toast('Sample loaded. You are viewing it as the U.S. partner. Switch in the sidebar.');
  },
  'save-ai'(d, el) {
    const f = document.getElementById('ai-form');
    const s = S.settings.get();
    const data = Object.fromEntries(new FormData(f).entries());
    const changedProvider = data.provider !== s.ai.provider;
    s.ai = Object.assign(s.ai, data);
    if (changedProvider) { s.ai.model = ''; }
    S.settings.save(s);
    toast('AI settings saved on this device.');
    app.render();
  },
  async 'test-ai'(d, el) {
    app.actions['save-ai']();
    el = document.querySelector('[data-action=test-ai]');
    el.disabled = true; el.textContent = 'Testing…';
    try { await testConnection(); toast('Connection works.', 'ok'); }
    catch (e) { toast('Connection failed: ' + e.message, 'error'); }
    finally { el.disabled = false; el.textContent = 'Test connection'; }
  },
  async install() {
    if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; }
    else toast('Use your browser’s “Install app” or “Add to Home Screen” menu item.');
  },
  'export-all'() {
    download(`crosscourse-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ format: 'crosscourse-backup', projects: S.listProjects() }, null, 2));
  },
  async wipe() {
    if (!(await confirmBox('Delete all local data?', 'This removes every project and setting from this browser. Partners keep their own copies.', 'Delete everything'))) return;
    for (const k of S.kv.keys()) if (k.startsWith('xc:')) S.kv.del(k);
    app.go('#/'); app.render();
  }
});
