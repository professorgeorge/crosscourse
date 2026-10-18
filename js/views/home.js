import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, modal, toast, pickFile, download, fmtAgo, chip, confirmBox } from '../ui.js';
import { allTimezones } from '../time.js';
import { PROVIDERS, testConnection, detectLocalAndBrowserAI, structureRawPrompt, structureMobilityPrompt } from '../ai.js';
import { createAiPartnerDemo, demoProject } from '../demo.js';
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
        <p class="eyebrow">Autonomous International Course Co-Design</p>
        <h1>Autonomous AI Co-Design for International Courses Across Partner Universities.</h1>
        <p class="lede">Specify your partner universities (two or more, up to 9) and collaboration scope (either conversationally in natural language or through structured choices), and AI autonomously co-develops the complete, approved course deliverables ready for your classroom.</p>

        <!-- Natural Language & Structured AI Co-Design Studio Card -->
        <div class="ai-prompt-studio card">
          <form id="ai-prompt-form" class="stack">
            <!-- Dynamic Partner Universities Consortium (2 to 9 Campuses) -->
            <div class="card" style="padding: var(--space-4); background: var(--color-surface); border-radius: var(--radius-lg); border: 1px solid var(--color-border); margin: 0;">
              <div class="row between wrap gap" style="margin-bottom: var(--space-3); align-items: center;">
                <div>
                  <h3 style="margin: 0; font-size: 1.05rem;">1. Partner Universities Consortium (2 to 9 Campuses)</h3>
                  <span class="muted small">Add your lead institution and international partner universities. Time zones and multi-campus calendars are reconciled automatically.</span>
                </div>
                <span class="badge badge-ok" id="consortium-count-badge">2 Universities in Consortium</span>
              </div>

              <div id="campus-intake-list" class="stack gap">
                <!-- Campus 1: Lead Institution (You) -->
                <div class="campus-intake-card" data-idx="1" style="border-left: 4px solid #b4532a;">
                  <div class="row between wrap gap" style="align-items: center; margin-bottom: var(--space-2);">
                    <div class="row gap" style="align-items: center;">
                      <span class="campus-badge-dot" style="background: #b4532a;"></span>
                      <strong class="small">Campus 1 (Lead Institution / You)</strong>
                    </div>
                  </div>
                  <div class="grid3 gap">
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-1-inst"><strong>University Name</strong></label>
                      <input id="uni-1-inst" name="uni_1_inst" required placeholder="e.g. Lead University / Your Campus">
                    </div>
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-1-country">Country (Optional)</label>
                      <input id="uni-1-country" name="uni_1_country" placeholder="e.g. Country">
                    </div>
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-1-prof">Lead Professor Name (Optional)</label>
                      <input id="uni-1-prof" name="uni_1_prof" placeholder="e.g. Lead Professor Name">
                    </div>
                  </div>
                </div>

                <!-- Campus 2: Partner Institution -->
                <div class="campus-intake-card" data-idx="2" style="border-left: 4px solid #2c6a8a;">
                  <div class="row between wrap gap" style="align-items: center; margin-bottom: var(--space-2);">
                    <div class="row gap" style="align-items: center;">
                      <span class="campus-badge-dot" style="background: #2c6a8a;"></span>
                      <strong class="small">Campus 2 (Partner University)</strong>
                    </div>
                  </div>
                  <div class="grid3 gap">
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-2-inst"><strong>University Name</strong></label>
                      <input id="uni-2-inst" name="uni_2_inst" required placeholder="e.g. Partner University 2">
                    </div>
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-2-country">Country (Optional)</label>
                      <input id="uni-2-country" name="uni_2_country" placeholder="e.g. Country">
                    </div>
                    <div class="field" style="margin: 0;">
                      <label class="small" for="uni-2-prof">Colleague Name (Optional)</label>
                      <input id="uni-2-prof" name="uni_2_prof" placeholder="e.g. Colleague Name">
                    </div>
                  </div>
                </div>
              </div>

              <div class="row between wrap gap" style="margin-top: var(--space-3); align-items: center;">
                <button type="button" class="btn sm" id="btn-add-campus" style="font-weight: 600;">
                  ${icon.plus} Add Another Partner University (Up to 9)
                </button>
                <span class="muted small" id="campus-counter-hint">You can add up to 7 more partner universities to this consortium.</span>
              </div>
            </div>

            <!-- Scope Selection: Course Segment vs Whole New Course -->
            <fieldset class="field" style="margin: 0; padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <legend class="small" style="font-weight: 600; margin-bottom: var(--space-2);">2. Collaboration Scope</legend>
              <div class="row gap wrap">
                <label class="choice small grow" style="margin: 0;">
                  <input type="radio" name="mode" value="module" checked>
                  <span><strong>Shared Course Segment / Module</strong><br><span class="muted">Collaborative module or segment embedded within each institution's existing course</span></span>
                </label>
                <label class="choice small grow" style="margin: 0;">
                  <input type="radio" name="mode" value="course">
                  <span><strong>Whole New Course Collaboration</strong><br><span class="muted">Complete joint course designed collaboratively from the ground up</span></span>
                </label>
              </div>
            </fieldset>

            <!-- Duration & Cross-Country Mobility Controls -->
            <div class="ai-customization-bar grid2 gap" style="padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <div class="field" style="margin: 0;">
                <label for="prompt-dur-weeks" class="small" style="font-weight: 600;">
                  3. Course Duration (Weeks)
                </label>
                <input type="number" id="prompt-dur-weeks" name="durationWeeks" min="1" max="52" required placeholder="Number of weeks (e.g. 5 or 14)" value="5">
              </div>

              <div class="field" style="margin: 0;">
                <label for="prompt-visit-format" class="small" style="font-weight: 600;">
                  4. Cross-Country Mobility & Format
                </label>
                <select id="prompt-visit-format" name="visitFormat">
                  <option value="virtual" selected>100% Fully Virtual Exchange (Online collaboration)</option>
                  <option value="student-visit">Blended: Virtual Collaboration + Reciprocal Student Immersion Visit</option>
                  <option value="faculty-visit">Blended: Virtual Collaboration + Visiting Faculty Mobility / Colloquium</option>
                  <option value="parallel-studios">Dual-Campus Synchronized Labs / Parallel Studios</option>
                  <option value="async-distributed">Asynchronous Distributed Teams (Optimized for large time-zone differences)</option>
                  <option value="field-practicum">Virtual Preparation + Joint On-Site Field Practicum / Community Action</option>
                  <option value="custom">Other / Custom Mobility Format (Specify below)...</option>
                </select>
                <div id="prompt-custom-visit-box" style="display: none; margin-top: var(--space-2);">
                  <div class="row between wrap gap" style="margin-bottom: var(--space-1); align-items: flex-end;">
                    <span class="muted small">Specify your custom mobility arrangement or delivery model:</span>
                    <button type="button" class="btn text sm" data-action="structure-mobility-prompt" data-target="prompt-custom-visit" style="padding: 2px 8px; font-size: 0.82rem;" title="Convert rough mobility notes into a structured plan">
                      ${icon.sparkle} Convert Rough Notes to Structured Mobility Plan
                    </button>
                  </div>
                  <textarea id="prompt-custom-visit" name="customVisitFormat" rows="3" placeholder="e.g. Enter notes (e.g. 2 weeks online team onboarding, 10 days reciprocal field practicum/immersion in host city, final joint virtual symposium)..."></textarea>
                </div>
              </div>
            </div>

            <div class="field" style="margin: 0;">
              <div class="row between wrap gap" style="margin-bottom: var(--space-1); align-items: flex-end;">
                <label for="course-prompt" class="ai-prompt-label" style="margin: 0;">
                  <strong>5. Course Topic, Discipline, or Driving Inquiry Vision</strong>
                </label>
                <button type="button" class="btn text sm" data-action="structure-raw-prompt" data-target="course-prompt" style="padding: 2px 8px; font-size: 0.82rem;" title="Convert rough or unstructured notes into a structured prompt">
                  ${icon.sparkle} Convert Rough Notes to Structured Prompt
                </button>
              </div>
              <span class="muted small" style="display: block; font-weight: normal; margin-bottom: var(--space-2);">
                Enter your topic, syllabus ideas, or raw notes. You can click <strong>Convert Rough Notes to Structured Prompt</strong> to instantly format them into a comprehensive, editable prompt.
              </span>
              <textarea id="course-prompt" name="prompt" rows="4" required placeholder="e.g. Enter your topic, rough syllabus notes, or paste unformatted text here (e.g. Sustainable urban mobility and public transit equity across US and Brazil, 5-week module, student team comparative reports)..."></textarea>
            </div>

            <div class="row between wrap gap" style="margin-top: var(--space-3); align-items: center;">
              <span class="muted small">All 5 deliverables (Syllabus HTML & PDF, Student Handout MD, Consortium Charter, .ics Calendar, and Project File) will be created immediately.</span>
              <div class="row gap wrap">
                <button type="submit" class="btn primary lg" data-action="generate-from-prompt" style="min-width: 260px;">
                  ${icon.sparkle} Autonomously Generate Deliverables
                </button>
                <button type="button" class="btn ghost lg" data-action="open-ai-demo-modal">
                  Co-Design with AI Partner Professors...
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Your projects</h2>
          <div class="row gap" style="align-items: center;">
            <button class="btn sm" data-action="import-project" title="Import a previously saved Crosscourse project JSON backup">${icon.upload} Import Course Backup (.json)</button>
            <span class="muted">${projects.length ? `${projects.length} on this device` : ''}</span>
          </div>
        </div>
        ${projects.length ? `<div class="project-grid">${projects.map(p => `
          <a class="project-card" href="#/p/${p.id}/overview">
            <span class="pc-mode">${p.mode === 'course' ? 'Co-developed course' : 'Shared international module'}</span>
            <h3>${esc(p.title)}</h3>
            <div class="chips">${p.partners.map(x => chip(x, { small: true })).join('')}</div>
            <span class="muted small">Updated ${fmtAgo(p.updatedAt)} · ${p.activities.length} activities · ${p.decisions.length} decisions</span>
          </a>`).join('')}</div>` : `<div class="empty"><p class="empty-title">No projects yet</p><p>Start a partnership, open a project file a colleague sent you, or launch the AI Partner simulation to co-design an international course or module.</p></div>`}
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
              <p class="ai-help-text">Check if In-Browser WebGPU, Google Chrome Built-in AI, Ollama, or LM Studio are available on your machine.</p>
            </div>
            <button type="button" class="btn sm primary" data-action="scan-ai" ${isScanning ? 'disabled' : ''}>
              ${isScanning ? '<span class="spinner"></span> Scanning...' : `${icon.sparkle} Scan my device`}
            </button>
          </div>

          ${scan ? `
          <div class="ai-detect-results">
            ${scan.webgpu?.available ? `
            <div class="ai-detect-row">
              <div>
                <strong>In-Browser Local AI (WebGPU)</strong>
                <span class="ai-badge-pill free">Hardware-Accelerated</span>
                <p class="ai-help-text">Runs directly inside this browser tab (Edge, Chrome, Firefox, Safari 18+). Zero server setup, zero API keys, 100% private.</p>
              </div>
              <button type="button" class="btn sm" data-action="use-detected-ai" data-provider="webgpu" data-model="SmolLM2-360M-Instruct-q4f16_1-MLC">Use In-Browser WebGPU</button>
            </div>` : ''}

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

            ${!scan.webgpu?.available && !scan.chrome?.available && !scan.ollama?.available && !scan.lmstudio?.available ? `
            <p class="ai-help-text" style="margin: 0; padding-top: var(--space-2);">No local AI models are currently running on this computer. That is completely normal! You can use the built-in pedagogical templates below with zero setup, or connect a free Google Gemini key in 30 seconds.</p>` : ''}
          </div>` : ''}
        </div>

        <form id="ai-form" class="stack">
          <div class="field">
            <label for="ai-prov">AI Provider</label>
            <select id="ai-prov" name="provider" onchange="window.crosscourse.actions['change-ai-provider'](null, this)">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === ai.provider ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}</select>
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

          ${ai.provider === 'webgpu' ? `
          <div class="field">
            <label for="ai-webgpu-model">In-Browser Open-Weights Model</label>
            <select id="ai-webgpu-model" name="model">
              ${(prov.models || []).map(m => `<option value="${m}" ${m === (ai.model || prov.defaultModel) ? 'selected' : ''}>${esc(m)}</option>`).join('')}
            </select>
            <p class="ai-help-text">Runs locally inside this browser tab via WebGPU (Edge, Chrome, Firefox, Safari 18+). The model downloads into your browser cache on first use and runs offline with zero server setup.</p>
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
          <label class="choice"><input type="radio" name="mode" value="module" checked><span><strong>A shared international module</strong><br><span class="muted">A collaborative module embedded in each partner’s existing course</span></span></label>
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
    const homeForm = document.getElementById('ai-prompt-form');
    const curScope = homeForm?.querySelector('input[name=scope]:checked')?.value || 'module';
    const curWeeks = document.getElementById('prompt-dur-weeks')?.value || (curScope === 'course' ? '14' : '5');
    const curVisit = document.getElementById('prompt-visit-format')?.value || 'virtual';
    const curCustomVisit = document.getElementById('prompt-custom-visit')?.value || '';
    const curTopic = document.getElementById('course-prompt')?.value || '';

    // Extract all campuses currently in the consortium intake list (2 to 9 campuses)
    const intakeCards = Array.from(document.querySelectorAll('#campus-intake-list .campus-intake-card'));
    const campuses = intakeCards.map((card, i) => {
      const idx = card.dataset.idx || (i + 1);
      const inst = card.querySelector(`input[name="campus_name_${idx}"], input[name^="uni_${idx}_inst"], input[id^="uni-${idx}-inst"]`)?.value || '';
      const country = card.querySelector(`input[name="campus_location_${idx}"], input[name^="uni_${idx}_country"], input[id^="uni-${idx}-country"]`)?.value || '';
      const prof = card.querySelector(`input[name="campus_faculty_${idx}"], input[name^="uni_${idx}_prof"], input[id^="uni-${idx}-prof"]`)?.value || '';
      return { idx: parseInt(idx, 10), institution: inst.trim(), country: country.trim(), faculty: prof.trim() };
    });

    const leadCampus = campuses.find(c => c.idx === 1) || campuses[0] || { idx: 1, institution: '', country: '', faculty: '' };
    let partnerCampuses = campuses.filter(c => c.idx > 1);
    if (!partnerCampuses.length) {
      partnerCampuses = [{ idx: 2, institution: '', country: '', faculty: '' }];
    }

    const r = await modal({
      title: 'Co-Design with AI Partner Professors',
      wide: true,
      body: `<p class="lede" style="margin-bottom: var(--space-3);">
        Collaborate step-by-step with AI partner professors representing each international partner university in your consortium.
        This mode provides interactive AI Assistance across all course design stages, ensuring professors and course developers retain full design control.
      </p>
      <fieldset class="field" style="margin-bottom: var(--space-3);">
        <legend><strong>1. Collaboration scope</strong></legend>
        <label class="choice">
          <input type="radio" name="mode" value="module" ${curScope !== 'course' ? 'checked' : ''}>
          <span>
            <strong>Shared international module / segment in existing courses</strong><br>
            <span class="muted small">A collaborative arc embedded within each partner's existing course.</span>
          </span>
        </label>
        <label class="choice">
          <input type="radio" name="mode" value="course" ${curScope === 'course' ? 'checked' : ''}>
          <span>
            <strong>Whole course collaboration</strong><br>
            <span class="muted small">A complete joint course designed collaboratively from the ground up.</span>
          </span>
        </label>
      </fieldset>
      <div class="grid2 gap" style="margin-bottom: var(--space-3);">
        <div class="field" style="margin: 0;">
          <label for="ai-demo-duration"><strong>2. Course Duration (Weeks)</strong></label>
          <input type="number" id="ai-demo-duration" name="durationWeeks" min="1" max="52" required placeholder="Number of weeks (e.g. 5 or 14)" value="${esc(curWeeks)}">
        </div>

        <div class="field" style="margin: 0;">
          <label for="ai-demo-visit"><strong>3. Cross-Country Mobility & Format</strong></label>
          <select id="ai-demo-visit" name="visitFormat">
            <option value="virtual" ${curVisit === 'virtual' ? 'selected' : ''}>100% Fully Virtual Exchange (Online collaboration)</option>
            <option value="student-visit" ${curVisit === 'student-visit' ? 'selected' : ''}>Blended: Virtual Collaboration + Reciprocal Student Immersion Visit</option>
            <option value="faculty-visit" ${curVisit === 'faculty-visit' ? 'selected' : ''}>Blended: Virtual Collaboration + Visiting Faculty Mobility / Colloquium</option>
            <option value="parallel-studios" ${curVisit === 'parallel-studios' ? 'selected' : ''}>Dual-Campus Synchronized Labs / Parallel Studios</option>
            <option value="async-distributed" ${curVisit === 'async-distributed' ? 'selected' : ''}>Asynchronous Distributed Teams (Optimized for large time-zone differences)</option>
            <option value="field-practicum" ${curVisit === 'field-practicum' ? 'selected' : ''}>Virtual Preparation + Joint On-Site Field Practicum / Community Action</option>
            <option value="custom" ${curVisit === 'custom' ? 'selected' : ''}>Other / Custom Mobility Format (Specify below)...</option>
          </select>
          <div id="ai-demo-custom-visit-box" style="display: ${curVisit === 'custom' ? 'block' : 'none'}; margin-top: var(--space-2);">
            <div class="row between wrap gap" style="margin-bottom: var(--space-1); align-items: flex-end;">
              <span class="muted small">Specify your custom mobility arrangement or delivery model:</span>
              <button type="button" class="btn text sm" id="btn-modal-structure-mobility" style="padding: 2px 8px; font-size: 0.82rem;" title="Convert rough mobility notes into a structured plan">
                ${icon.sparkle} Convert Rough Notes to Structured Mobility Plan
              </button>
            </div>
            <textarea id="ai-demo-custom-visit" name="customVisitFormat" rows="3" placeholder="e.g. Enter notes (e.g. 2 weeks online collaboration, 10-day field study visit in host country, final joint virtual showcase)...">${esc(curCustomVisit)}</textarea>
          </div>
        </div>
      </div>
      <div class="field" style="margin-bottom: var(--space-3);">
        <div class="row between wrap gap" style="margin-bottom: var(--space-1); align-items: flex-end;">
          <label for="ai-demo-topic" style="margin: 0;"><strong>4. Collaboration Topic or Inquiry Vision</strong></label>
          <button type="button" class="btn text sm" id="btn-modal-structure-topic" style="padding: 2px 8px; font-size: 0.82rem;" title="Convert rough notes into a structured prompt">
            ${icon.sparkle} Convert Rough Notes to Structured Prompt
          </button>
        </div>
        <textarea id="ai-demo-topic" name="topic" rows="3" required placeholder="e.g. Enter your topic, rough syllabus notes, or paste unformatted text (e.g. Comparative Climate Resilience, AI Ethics, Global Supply Chains)...">${esc(curTopic)}</textarea>
      </div>

      <div class="field" style="margin-bottom: var(--space-3);">
        <div class="row between wrap gap" style="margin-bottom: var(--space-2); align-items: center;">
          <label style="margin: 0;"><strong>5. Participating Universities Consortium</strong></label>
          <span class="badge badge-ok">${campuses.length} Campuses in Consortium</span>
        </div>
        <span class="muted small" style="display: block; margin-bottom: var(--space-2);">Pre-populated from your consortium intake. An AI partner professor will represent each international campus.</span>
        <div class="stack gap">
          ${campuses.map(c => {
            const color = S.PARTNER_COLORS[(c.idx - 1) % S.PARTNER_COLORS.length];
            const isLead = c.idx === 1;
            return `
            <div class="campus-intake-card" style="border-left: 4px solid ${color}; padding: var(--space-3); margin: 0;">
              <div class="row between wrap gap" style="margin-bottom: var(--space-1); align-items: center;">
                <div class="row gap" style="align-items: center;">
                  <span class="campus-badge-dot" style="background: ${color};"></span>
                  <strong class="small">${isLead ? 'Campus 1 (Lead Institution / You)' : `Campus ${c.idx} (Partner University)`}</strong>
                </div>
              </div>
              <div class="grid3 gap">
                <div class="field" style="margin: 0;">
                  <label class="small" for="modal-uni-${c.idx}-inst"><strong>University Name</strong></label>
                  <input id="modal-uni-${c.idx}-inst" name="modal_uni_${c.idx}_inst" value="${esc(c.institution)}" required placeholder="e.g. ${isLead ? 'Lead University' : 'Partner University ' + c.idx}">
                </div>
                <div class="field" style="margin: 0;">
                  <label class="small" for="modal-uni-${c.idx}-country">Country (Optional)</label>
                  <input id="modal-uni-${c.idx}-country" name="modal_uni_${c.idx}_country" value="${esc(c.country)}" placeholder="e.g. Country">
                </div>
                <div class="field" style="margin: 0;">
                  <label class="small" for="modal-uni-${c.idx}-prof">Faculty / Colleague (Optional)</label>
                  <input id="modal-uni-${c.idx}-prof" name="modal_uni_${c.idx}_prof" value="${esc(c.faculty)}" placeholder="e.g. Professor / Colleague Name">
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`,
      actions: [
        { label: 'Cancel', value: null },
        { label: 'Start AI-Assisted Co-Design', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }
      ],
      onOpen(dlg) {
        const selVisit = dlg.querySelector('#ai-demo-visit');
        const customVisitBox = dlg.querySelector('#ai-demo-custom-visit-box');
        if (selVisit && customVisitBox) {
          selVisit.addEventListener('change', () => {
            customVisitBox.style.display = selVisit.value === 'custom' ? 'block' : 'none';
          });
        }

        const btnMobility = dlg.querySelector('#btn-modal-structure-mobility');
        const mobilityTa = dlg.querySelector('#ai-demo-custom-visit');
        if (btnMobility && mobilityTa) {
          btnMobility.addEventListener('click', async () => {
            const raw = mobilityTa.value.trim();
            if (!raw) {
              toast('Enter some mobility notes or keywords first.', 'info');
              mobilityTa.focus();
              return;
            }
            btnMobility.disabled = true;
            const oldHtml = btnMobility.innerHTML;
            btnMobility.innerHTML = '<span class="spinner"></span> Structuring...';
            try {
              const homeUni = dlg.querySelector('#modal-uni-1-inst')?.value || '';
              const dWeeks = parseInt(dlg.querySelector('#ai-demo-duration')?.value, 10) || 5;
              const structured = await structureMobilityPrompt(raw, {
                homeUniversity: homeUni,
                partnerUniversity: 'Partner Universities',
                durationWeeks: dWeeks
              });
              mobilityTa.value = structured;
              mobilityTa.focus();
              toast('Rough notes converted into structured mobility plan! You can review or edit below.', 'ok');
            } catch (e) {
              toast('Could not structure mobility plan: ' + e.message, 'warn');
            } finally {
              btnMobility.disabled = false;
              btnMobility.innerHTML = oldHtml;
            }
          });
        }

        const btnStruct = dlg.querySelector('#btn-modal-structure-topic');
        const topicTa = dlg.querySelector('#ai-demo-topic');
        if (btnStruct && topicTa) {
          btnStruct.addEventListener('click', async () => {
            const raw = topicTa.value.trim();
            if (!raw) {
              toast('Enter some rough notes or keywords in the topic field first.', 'info');
              topicTa.focus();
              return;
            }
            btnStruct.disabled = true;
            const oldHtml = btnStruct.innerHTML;
            btnStruct.innerHTML = '<span class="spinner"></span> Structuring...';
            try {
              const homeUni = dlg.querySelector('#modal-uni-1-inst')?.value || '';
              const partnerUnis = campuses.slice(1).map(c => dlg.querySelector(`#modal-uni-${c.idx}-inst`)?.value || '').filter(Boolean).join(', ');
              const mode = dlg.querySelector('input[name=mode]:checked')?.value || 'module';
              const dWeeks = parseInt(dlg.querySelector('#ai-demo-duration')?.value, 10) || (mode === 'course' ? 14 : 5);
              const structured = await structureRawPrompt(raw, {
                homeUniversity: homeUni,
                partnerUniversity: partnerUnis || 'Partner Universities',
                mode,
                durationWeeks: dWeeks
              });
              topicTa.value = structured;
              topicTa.focus();
              toast('Rough notes converted into structured prompt! You can review or edit below.', 'ok');
            } catch (e) {
              toast('Could not structure prompt: ' + e.message, 'warn');
            } finally {
              btnStruct.disabled = false;
              btnStruct.innerHTML = oldHtml;
            }
          });
        }
      }
    });

    if (!r?.value) return;
    const d = r.data;
    const dWeeks = parseInt(d.durationWeeks, 10) || (d.mode === 'course' ? 14 : 5);
    const visitFormat = d.visitFormat || 'virtual';
    const customVisitFormat = (d.customVisitFormat || '').trim();
    const effectiveVisit = (visitFormat === 'custom' && customVisitFormat) ? 'custom' : visitFormat;

    const allUniversities = campuses.map(c => ({
      name: (d[`modal_uni_${c.idx}_inst`] || c.institution || (c.idx === 1 ? 'Lead University' : `Partner University ${c.idx}`)).trim(),
      location: (d[`modal_uni_${c.idx}_country`] || c.country || '').trim(),
      faculty: (d[`modal_uni_${c.idx}_prof`] || c.faculty || (c.idx === 1 ? 'Lead Faculty' : `Partner Colleague ${c.idx}`)).trim()
    }));

    const p = createAiPartnerDemo({
      mode: d.mode,
      durationWeeks: dWeeks,
      visitFormat: effectiveVisit,
      customVisitFormat: customVisitFormat,
      topic: d.topic,
      customTopic: d.topic,
      universities: allUniversities,
      homeUniversity: allUniversities[0].name,
      userProfile: {
        name: allUniversities[0].faculty || 'Lead Faculty',
        institution: allUniversities[0].name
      }
    });
    p.isAiSimulation = true;
    p.coDesignMode = 'assist';
    p.isAutopilotCompleted = false;
    S.saveProject(p);
    const s = S.settings.get();
    s.identities[p.id] = p.partners[0].id;
    S.settings.save(s);

    app.go(`#/p/${p.id}/overview`);
    toast(`AI-Assisted Co-Design started for ${allUniversities.length}-campus consortium! Use AI Assistance at each stage to draft, refine, and align your course.`, 'ok');
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
      const count = (rep.webgpu?.available ? 1 : 0) + (rep.chrome?.available ? 1 : 0) + (rep.ollama?.available ? 1 : 0) + (rep.lmstudio?.available ? 1 : 0);
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
  'change-ai-provider'(d, el) {
    const s = S.settings.get();
    s.ai.provider = el.value;
    s.ai.model = PROVIDERS[el.value]?.defaultModel || PROVIDERS[el.value]?.models?.[0] || '';
    S.settings.save(s);
    app.render();
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
      const res = await testConnection();
      toast(res?.message || 'Connection works! Your AI assistant is ready.', 'ok');
    } catch (e) {
      toast('Connection test failed: ' + e.message, 'error');
    } finally {
      if (el) { el.disabled = false; el.textContent = 'Test connection'; }
    }
  },
  async 'structure-raw-prompt'(d, btn) {
    const targetId = d?.target || btn?.dataset?.target || 'course-prompt';
    const ta = document.getElementById(targetId);
    if (!ta) return;
    const raw = ta.value.trim();
    if (!raw) {
      toast('Enter some rough notes, syllabus ideas, or keywords first, then click Convert.', 'info');
      ta.focus();
      return;
    }
    const form = ta.closest('form') || document.getElementById('ai-prompt-form');
    const universities = [];
    if (form) {
      const cards = form.querySelectorAll('.campus-intake-card');
      cards.forEach((card, idx) => {
        const inst = (card.querySelector('input[name$="_inst"]')?.value || '').trim();
        const country = (card.querySelector('input[name$="_country"]')?.value || '').trim();
        const prof = (card.querySelector('input[name$="_prof"]')?.value || '').trim();
        if (inst) {
          universities.push({
            institution: inst,
            country: country || (idx === 0 ? 'United States' : 'International'),
            professor: prof || (idx === 0 ? 'Lead Professor' : `Colleague ${idx + 1}`)
          });
        }
      });
    }
    const homeUni = universities[0]?.institution || 'Home University';
    const partnerUnis = universities.slice(1).map(u => u.institution).join(', ') || 'Partner University';
    const mode = form?.querySelector('input[name=mode]:checked')?.value || 'module';
    const dWeeks = parseInt(form?.querySelector('input[name=durationWeeks]')?.value, 10) || (mode === 'course' ? 14 : 5);

    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Structuring prompt...';
    try {
      const res = await structureRawPrompt(raw, {
        homeUniversity: homeUni,
        partnerUniversity: partnerUnis,
        universities,
        mode,
        durationWeeks: dWeeks
      });
      ta.value = res;
      ta.focus();
      toast('Rough notes converted into structured prompt! You can review or edit below.', 'ok');
    } catch (err) {
      toast('Could not structure prompt: ' + err.message, 'warn');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
    }
  },
  async 'structure-mobility-prompt'(d, btn) {
    const targetId = d?.target || btn?.dataset?.target || 'prompt-custom-visit';
    const ta = document.getElementById(targetId);
    if (!ta) return;
    const raw = ta.value.trim();
    if (!raw) {
      toast('Please enter some notes or keywords describing your mobility format first.', 'info');
      ta.focus();
      return;
    }
    const form = ta.closest('form') || document.getElementById('ai-prompt-form');
    const universities = [];
    if (form) {
      const cards = form.querySelectorAll('.campus-intake-card');
      cards.forEach((card, idx) => {
        const inst = (card.querySelector('input[name$="_inst"]')?.value || '').trim();
        if (inst) universities.push(inst);
      });
    }
    const homeUni = universities[0] || 'Lead Institution';
    const partnerUnis = universities.slice(1).join(', ') || 'Partner Universities';
    const dWeeks = parseInt(form?.querySelector('input[name=durationWeeks]')?.value, 10) || 5;

    btn.disabled = true;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Structuring mobility plan...';
    try {
      const res = await structureMobilityPrompt(raw, {
        homeUniversity: homeUni,
        partnerUniversity: partnerUnis,
        durationWeeks: dWeeks
      });
      ta.value = res;
      ta.focus();
      toast('Rough notes converted into structured mobility plan! You can review or edit below.', 'ok');
    } catch (err) {
      toast('Could not structure mobility plan: ' + err.message, 'warn');
    } finally {
      btn.disabled = false;
      btn.innerHTML = oldText;
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

function reindexCampusCards(list) {
  const cards = list.querySelectorAll('.campus-intake-card');
  cards.forEach((card, i) => {
    const idx = i + 1;
    card.dataset.idx = idx;
    const color = S.PARTNER_COLORS[(idx - 1) % S.PARTNER_COLORS.length];
    card.style.borderLeft = `4px solid ${color}`;
    const dot = card.querySelector('.campus-badge-dot');
    if (dot) dot.style.background = color;
    const label = card.querySelector('strong.small');
    if (label) {
      label.textContent = idx === 1 ? 'Campus 1 (Lead Institution / You)' : `Campus ${idx} (Partner University)`;
    }
  });
}

function updateConsortiumBadges(list) {
  const count = list.querySelectorAll('.campus-intake-card').length;
  const badge = document.getElementById('consortium-count-badge');
  if (badge) badge.textContent = `${count} Universities in Consortium`;
  const hint = document.getElementById('campus-counter-hint');
  if (hint) {
    hint.textContent = count >= 9 ? 'Consortium full (9 partner universities).' : `You can add up to ${9 - count} more partner universities.`;
  }
}

document.addEventListener('click', e => {
  const addBtn = e.target.closest('#btn-add-campus');
  if (addBtn) {
    const list = document.getElementById('campus-intake-list');
    if (!list) return;
    const cards = list.querySelectorAll('.campus-intake-card');
    if (cards.length >= 9) {
      toast('Maximum of 9 partner universities reached for this consortium.', 'warn');
      return;
    }
    const nextIdx = cards.length + 1;
    const color = S.PARTNER_COLORS[(nextIdx - 1) % S.PARTNER_COLORS.length];
    const newCard = document.createElement('div');
    newCard.className = 'campus-intake-card';
    newCard.dataset.idx = nextIdx;
    newCard.style.borderLeft = `4px solid ${color}`;
    newCard.innerHTML = `
      <div class="row between wrap gap" style="align-items: center; margin-bottom: var(--space-2);">
        <div class="row gap" style="align-items: center;">
          <span class="campus-badge-dot" style="background: ${color};"></span>
          <strong class="small">Campus ${nextIdx} (Partner University)</strong>
        </div>
        <button type="button" class="campus-remove-btn" title="Remove this university">✕ Remove</button>
      </div>
      <div class="grid3 gap">
        <div class="field" style="margin: 0;">
          <label class="small" for="uni-${nextIdx}-inst"><strong>University Name</strong></label>
          <input id="uni-${nextIdx}-inst" name="uni_${nextIdx}_inst" required placeholder="e.g. Partner University ${nextIdx}">
        </div>
        <div class="field" style="margin: 0;">
          <label class="small" for="uni-${nextIdx}-country">Country (Optional)</label>
          <input id="uni-${nextIdx}-country" name="uni_${nextIdx}_country" placeholder="e.g. Country">
        </div>
        <div class="field" style="margin: 0;">
          <label class="small" for="uni-${nextIdx}-prof">Colleague Name (Optional)</label>
          <input id="uni-${nextIdx}-prof" name="uni_${nextIdx}_prof" placeholder="e.g. Dr. Colleague Name">
        </div>
      </div>
    `;
    list.appendChild(newCard);
    updateConsortiumBadges(list);
    return;
  }

  const removeBtn = e.target.closest('.campus-remove-btn');
  if (removeBtn) {
    const card = removeBtn.closest('.campus-intake-card');
    const list = card ? card.closest('#campus-intake-list') : null;
    if (card && list) {
      card.remove();
      reindexCampusCards(list);
      updateConsortiumBadges(list);
    }
  }
});

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'prompt-visit-format') {
    const box = document.getElementById('prompt-custom-visit-box');
    if (box) box.style.display = e.target.value === 'custom' ? 'block' : 'none';
  }
});
