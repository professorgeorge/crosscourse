import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, modal, toast, pickFile, download, fmtAgo, chip, confirmBox } from '../ui.js';
import { allTimezones } from '../time.js';
import { PROVIDERS, testConnection, detectLocalAndBrowserAI } from '../ai.js';
import { createAiPartnerDemo, demoProject, AI_PARTNER_PERSONAS, TOPIC_PRESETS } from '../demo.js';
import { importPacketFile } from './sync.js';
import { showAutopilotProgressModal, openDownloadPackModal } from '../autopilot.js';

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
          <button class="btn ghost lg" data-action="open-ai-demo-modal">${icon.sparkle} Co-Design with an AI Partner Professor</button>
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
          </a>`).join('')}</div>` : `<div class="empty"><p class="empty-title">No projects yet</p><p>Start a partnership, open a project file a colleague sent you, or launch the AI Partner simulation to co-design an international course or module.</p></div>`}
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
    const scan = app._aiScanReport || null;
    const isScanning = app._aiScanning || false;

    return `<div class="page narrow">
      <a href="#/" class="back">${icon.back} Projects</a>
      <h1>Settings</h1>
      <section class="card">
        <div class="section-head">
          <h2>AI assistant</h2>
          <span class="ai-badge-pill ${ai.provider === 'none' ? 'free' : (ai.provider === 'chrome' || ai.provider === 'ollama' ? 'local' : 'cloud')}">${esc(prov.badge || 'Configured')}</span>
        </div>
        <p class="muted">Crosscourse has no server. All AI calls go directly from your browser to your provider, or run entirely on your computer. Your key stays only on this device and is never written into shared project files.</p>

        <!-- Auto-Detection Card for Non-Techies -->
        <div class="ai-detect-card">
          <div class="row between wrap gap">
            <div class="grow">
              <strong>Auto-Detect AI on your Device</strong>
              <p class="ai-help-text">Check if Google Chrome Built-in AI, Ollama, or LM Studio are already installed and running on your machine.</p>
            </div>
            <button type="button" class="btn sm primary" data-action="scan-ai" ${isScanning ? 'disabled' : ''}>
              ${isScanning ? '<span class="spinner"></span> Scanning...' : `${icon.sparkle} Scan my device`}
            </button>
          </div>

          ${scan ? `
          <div class="ai-detect-results">
            ${scan.chrome?.available ? `
            <div class="ai-detect-row">
              <div>
                <strong>Google Chrome Built-in AI (Gemini Nano)</strong>
                <span class="ai-badge-pill free">Ready</span>
                <p class="ai-help-text">Runs on your device inside Chrome. 100% free, zero setup, private.</p>
              </div>
              <button type="button" class="btn sm" data-action="use-detected-ai" data-provider="chrome" data-model="gemini-nano">Use Chrome AI</button>
            </div>` : ''}

            ${scan.ollama?.available ? `
            <div class="ai-detect-row">
              <div>
                <strong>Ollama Local AI</strong>
                <span class="ai-badge-pill local">Found ${scan.ollama.models.length} model(s)</span>
                <p class="ai-help-text">${scan.ollama.models.slice(0, 4).join(', ')}${scan.ollama.models.length > 4 ? '...' : ''}</p>
              </div>
              <button type="button" class="btn sm" data-action="use-detected-ai" data-provider="ollama" data-model="${esc(scan.ollama.models[0] || 'llama3.2')}" data-base="${esc(scan.ollama.baseUrl)}">Use Ollama</button>
            </div>` : ''}

            ${scan.lmstudio?.available ? `
            <div class="ai-detect-row">
              <div>
                <strong>LM Studio Local AI</strong>
                <span class="ai-badge-pill local">Found ${scan.lmstudio.models.length} model(s)</span>
                <p class="ai-help-text">${scan.lmstudio.models.slice(0, 3).join(', ')}</p>
              </div>
              <button type="button" class="btn sm" data-action="use-detected-ai" data-provider="ollama" data-model="${esc(scan.lmstudio.models[0] || '')}" data-base="${esc(scan.lmstudio.baseUrl)}">Use LM Studio</button>
            </div>` : ''}

            ${!scan.chrome?.available && !scan.ollama?.available && !scan.lmstudio?.available ? `
            <p class="ai-help-text" style="margin: 0; padding-top: var(--space-2);">No local AI models are currently running on this computer. That is completely normal! You can use the built-in pedagogical templates below with zero setup, or connect a free Google Gemini key in 30 seconds.</p>` : ''}
          </div>` : ''}
        </div>

        <form id="ai-form" class="stack">
          <div class="field">
            <label for="ai-prov">AI Provider</label>
            <select id="ai-prov" name="provider">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === ai.provider ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
          </div>

          <div class="ai-provider-info">
            <p style="margin: 0;">${esc(prov.desc)}</p>
            ${prov.getKeyUrl ? `<a href="${esc(prov.getKeyUrl)}" target="_blank" rel="noopener noreferrer" class="ai-help-link">${esc(prov.getKeyLabel)} ↗</a>` : ''}
          </div>

          ${ai.provider === 'none' ? `
          <div class="banner info" style="margin-top: var(--space-2);">
            ${icon.checks}
            <span><strong>Zero setup needed:</strong> All course co-design features, alignment checks, calendar overlap calculations, and exports are fully active without any AI. Crosscourse provides expert pedagogical templates whenever you request drafting assistance.</span>
          </div>` : ''}

          ${ai.provider === 'chrome' ? `
          <div class="field">
            <label>Browser Model</label>
            <input type="text" readonly value="gemini-nano (Chrome Built-in)" style="background: var(--color-offset); opacity: 0.9;">
            <p class="ai-help-text">Chrome Built-in AI runs locally on your computer with Gemini Nano. If not yet turned on in your browser, visit <code>chrome://flags/#prompt-api-for-gemini-nano</code> in Chrome and set it to Enabled.</p>
          </div>` : ''}

          ${ai.provider === 'ollama' ? `
          <div class="grid2">
            <div class="field">
              <label for="ai-base">Ollama / Local Server URL</label>
              <input id="ai-base" name="baseUrl" value="${esc(ai.baseUrl || prov.defaultBaseUrl)}" placeholder="http://localhost:11434/v1">
            </div>
            <div class="field">
              <label for="ai-model">Model name</label>
              <input id="ai-model" name="model" list="ollama-models" value="${esc(ai.model || (prov.models[0] || 'llama3.2'))}" placeholder="e.g. llama3.2">
              <datalist id="ollama-models">
                ${(prov.models || []).map(m => `<option value="${m}">`).join('')}
              </datalist>
            </div>
          </div>
          <div class="row gap">
            <button type="button" class="btn sm" data-action="scan-ollama-models">${icon.sparkle} Scan installed Ollama models</button>
            <span class="ai-help-text">Ollama is free from <a href="https://ollama.com" target="_blank" rel="noopener noreferrer">ollama.com</a>. Start with <code>ollama run llama3.2</code></span>
          </div>` : ''}

          ${ai.provider === 'gemini' || ai.provider === 'openai' || ai.provider === 'anthropic' ? `
          <div class="field">
            <label for="ai-key">API Key</label>
            <input id="ai-key" name="apiKey" type="password" autocomplete="off" value="${esc(ai.apiKey || '')}" placeholder="${esc(prov.keyHint || '')}">
            <p class="ai-help-text">Your key stays in this browser's private local storage. It is never included in project files or sent to your partners.</p>
          </div>
          <div class="field">
            <label for="ai-model">Model</label>
            <input id="ai-model" name="model" list="model-list" value="${esc(ai.model || (prov.models[0] || ''))}" placeholder="${esc(prov.models[0] || 'model name')}">
            <datalist id="model-list">
              ${(prov.models || []).map(m => `<option value="${m}">`).join('')}
            </datalist>
            <p class="ai-help-text">Recommended default: <strong>${esc(prov.models[0] || 'standard')}</strong> (leave blank to use default).</p>
          </div>` : ''}

          ${ai.provider === 'compatible' ? `
          <div class="field">
            <label for="ai-base">Server Base URL</label>
            <input id="ai-base" name="baseUrl" value="${esc(ai.baseUrl || prov.defaultBaseUrl || '')}" placeholder="https://openrouter.ai/api/v1">
          </div>
          <div class="field">
            <label for="ai-key">API Key (optional)</label>
            <input id="ai-key" name="apiKey" type="password" autocomplete="off" value="${esc(ai.apiKey || '')}" placeholder="API key if required">
          </div>
          <div class="field">
            <label for="ai-model">Model ID</label>
            <input id="ai-model" name="model" value="${esc(ai.model || '')}" placeholder="e.g. meta-llama/llama-3.2-3b-instruct">
          </div>` : ''}

          <div class="row gap" style="margin-top: var(--space-2);">
            <button type="submit" class="btn primary" data-action="save-ai">Save settings</button>
            ${ai.provider !== 'none' ? `<button type="button" class="btn" data-action="test-ai">Test connection</button>` : ''}
          </div>
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
  async 'open-ai-demo-modal'() {
    const r = await modal({
      title: 'Co-Design with an AI Partner Professor',
      wide: true,
      body: `<p class="lede" style="margin-bottom: var(--space-3);">
        Collaborate with an AI partner wearing the hat of an international professor.
        Explore how Crosscourse aligns different institutional calendars, grading systems, and student contexts.
      </p>
      <fieldset class="field" style="margin-bottom: var(--space-3);">
        <legend><strong>1. Collaboration scope</strong></legend>
        <label class="choice">
          <input type="radio" name="mode" value="module" checked>
          <span>
            <strong>Shared international module / segment in existing courses</strong><br>
            <span class="muted small">A 4 to 8 week collaborative arc embedded within each partner's existing course.</span>
          </span>
        </label>
        <label class="choice">
          <input type="radio" name="mode" value="course">
          <span>
            <strong>Whole course collaboration</strong><br>
            <span class="muted small">A complete 14 to 16 week semester course designed jointly from the ground up.</span>
          </span>
        </label>
      </fieldset>
      <div class="field" style="margin-bottom: var(--space-3);">
        <label for="ai-demo-topic"><strong>2. Collaboration topic</strong></label>
        <select id="ai-demo-topic" name="topicKey">
          ${TOPIC_PRESETS.map(t => `<option value="${t.key}">${esc(t.title)} (${esc(t.discipline)})</option>`).join('')}
          <option value="custom">Other / Enter my own custom topic...</option>
        </select>
        <div id="ai-custom-topic-box" style="display: none; margin-top: var(--space-2);">
          <label for="ai-demo-custom-topic" class="small muted">Custom topic or subject</label>
          <input id="ai-demo-custom-topic" name="customTopic" placeholder="e.g. Sustainable Coastal Ecosystems">
        </div>
      </div>
      <div class="field" style="margin-bottom: var(--space-3);">
        <label for="ai-demo-partner"><strong>3. International AI Partner Professor</strong></label>
        <select id="ai-demo-partner" name="personaKey">
          <option value="random" selected>Surprise me! (Random professor from around the world)</option>
          ${AI_PARTNER_PERSONAS.map(p => `<option value="${p.key}">${esc(p.name)} (${esc(p.institution)}, ${esc(p.country)})</option>`).join('')}
        </select>
        <p class="hint" style="margin-top: 4px;">Your AI colleague navigates real-world university realities: local time zones, campus term dates, student cohort profiles, and grading standards.</p>
      </div>
      <fieldset class="field" style="margin-bottom: var(--space-3);">
        <legend><strong>How would you like AI to collaborate with you?</strong></legend>
        <label class="choice">
          <input type="radio" name="coDesignMode" value="autopilot" checked>
          <span>
            <strong>AI Autopilot Mode (Recommended)</strong><br>
            <span class="muted small">AI partner co-creates and completes all 8 design stages (schedules, outcomes, rubrics, charter, approvals), producing ready-to-use downloadable course files immediately.</span>
          </span>
        </label>
        <label class="choice">
          <input type="radio" name="coDesignMode" value="step">
          <span>
            <strong>Interactive Step-by-Step Mode</strong><br>
            <span class="muted small">Starts as an initial draft where you step through each design stage with the AI partner proposing along the way.</span>
          </span>
        </label>
      </fieldset>
      <fieldset class="field">
        <legend><strong>4. About you (Home Professor)</strong></legend>
        <div class="grid2">
          <div class="field">
            <label for="ai-demo-myname">Your name</label>
            <input id="ai-demo-myname" name="myName" value="Dr. Alex Taylor" required>
          </div>
          <div class="field">
            <label for="ai-demo-myinst">Your institution</label>
            <input id="ai-demo-myinst" name="myInst" value="State University" required>
          </div>
        </div>
      </fieldset>`,
      actions: [
        { label: 'Cancel', value: null },
        { label: 'Launch Co-Design Simulation', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }
      ],
      onOpen(dlg) {
        const sel = dlg.querySelector('#ai-demo-topic');
        const customBox = dlg.querySelector('#ai-custom-topic-box');
        if (sel && customBox) {
          sel.addEventListener('change', () => {
            customBox.style.display = sel.value === 'custom' ? 'block' : 'none';
          });
        }
      }
    });

    if (!r?.value) return;
    const d = r.data;
    const p = createAiPartnerDemo({
      mode: d.mode,
      topicKey: d.topicKey,
      customTopic: d.customTopic,
      personaKey: d.personaKey,
      userProfile: {
        name: d.myName || 'Dr. Alex Taylor',
        institution: d.myInst || 'State University'
      }
    });
    S.saveProject(p);
    const s = S.settings.get();
    s.identities[p.id] = p.partners[0].id;
    S.settings.save(s);
    const partner = p.partners[1];

    if (d.coDesignMode === 'autopilot') {
      showAutopilotProgressModal(p, () => {
        app.go(`#/p/${p.id}/overview`);
      });
    } else {
      app.go(`#/p/${p.id}/overview`);
      toast(`AI Partner simulation started with ${partner.name} (${partner.institution}, ${partner.country})!`, 'ok');
    }
  },
  'load-demo'() {
    app.actions['open-ai-demo-modal']();
  },
  async 'scan-ai'(d, el) {
    app._aiScanning = true;
    app.render();
    try {
      const rep = await detectLocalAndBrowserAI();
      app._aiScanReport = rep;
      const count = (rep.chrome.available ? 1 : 0) + (rep.ollama.available ? 1 : 0) + (rep.lmstudio.available ? 1 : 0);
      if (count > 0) {
        toast(`Found ${count} local/browser AI option(s) on your machine.`, 'ok');
      } else {
        toast('Scan complete. No local models running right now.', 'info');
      }
    } catch (e) {
      toast('Scan error: ' + e.message, 'warn');
    } finally {
      app._aiScanning = false;
      app.render();
    }
  },
  'use-detected-ai'(d, el) {
    const prov = el.dataset.provider;
    const model = el.dataset.model || '';
    const base = el.dataset.base || '';
    const s = S.settings.get();
    s.ai.provider = prov;
    if (model) s.ai.model = model;
    if (base) s.ai.baseUrl = base;
    S.settings.save(s);
    toast(`Configured ${PROVIDERS[prov]?.label.split(' (')[0] || prov}!`, 'ok');
    app.render();
  },
  async 'scan-ollama-models'(d, el) {
    el = el || document.querySelector('[data-action=scan-ollama-models]');
    if (el) { el.disabled = true; el.textContent = 'Scanning Ollama...'; }
    try {
      const rep = await detectLocalAndBrowserAI();
      if (rep.ollama.available && rep.ollama.models.length) {
        const s = S.settings.get();
        s.ai.model = rep.ollama.models[0];
        s.ai.baseUrl = rep.ollama.baseUrl;
        S.settings.save(s);
        toast(`Found Ollama models: ${rep.ollama.models.join(', ')}. Set to ${s.ai.model}.`, 'ok');
      } else {
        toast('Could not find running Ollama models. Is Ollama running on port 11434?', 'warn');
      }
    } catch (e) {
      toast('Scan failed: ' + e.message, 'error');
    } finally {
      app.render();
    }
  },
  'save-ai'(d, el) {
    const f = document.getElementById('ai-form');
    if (!f) return;
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
    if (el) { el.disabled = true; el.textContent = 'Testing connection...'; }
    try {
      await testConnection();
      toast('Connection works! Your AI assistant is ready.', 'ok');
    } catch (e) {
      toast('Connection test failed: ' + e.message, 'error');
    } finally {
      if (el) { el.disabled = false; el.textContent = 'Test connection'; }
    }
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
