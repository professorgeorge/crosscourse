import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, modal, toast, pickFile, download, fmtAgo, chip, confirmBox } from '../ui.js';
import { allTimezones } from '../time.js';
import { PROVIDERS, testConnection, detectLocalAndBrowserAI } from '../ai.js';
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
        <p class="lede">Specify two partner universities and collaboration scope—either conversationally in natural language or through structured choices—and AI autonomously co-develops the complete, approved course deliverables ready for your classroom.</p>

        <!-- Natural Language & Structured AI Co-Design Studio Card -->
        <div class="ai-prompt-studio card">
          <form id="ai-prompt-form" class="stack">
            <!-- Dedicated Dual-University Controls -->
            <div class="grid2 gap" style="padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <div class="field" style="margin: 0;">
                <label for="prompt-home-uni" class="small" style="font-weight: 600;">
                  1. Home University (University 1)
                </label>
                <input id="prompt-home-uni" name="homeUniversity" required placeholder="e.g. Alcorn State University">
              </div>

              <div class="field" style="margin: 0;">
                <label for="prompt-partner-uni" class="small" style="font-weight: 600;">
                  2. Partner University (University 2)
                </label>
                <input id="prompt-partner-uni" name="partnerUniversity" required list="partner-uni-datalist" placeholder="e.g. Kyoto University">
                <datalist id="partner-uni-datalist">
                  <option value="Kyoto University (Japan)">
                  <option value="Cheikh Anta Diop University (Senegal)">
                  <option value="Universidade de São Paulo (Brazil)">
                  <option value="Universidad de los Andes (Colombia)">
                  <option value="University of Bologna (Italy)">
                  <option value="Lund University (Sweden)">
                  <option value="American University of Sharjah (UAE)">
                  <option value="Indian Institute of Technology Delhi (India)">
                  <option value="University of Ghana (Ghana)">
                  <option value="National University of Singapore (Singapore)">
                </datalist>
              </div>
            </div>

            <!-- Scope Selection: Course Segment vs Whole New Course -->
            <fieldset class="field" style="margin: 0; padding: var(--space-3); background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border);">
              <legend class="small" style="font-weight: 600; margin-bottom: var(--space-2);">3. Collaboration Scope</legend>
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
                  4. Course Duration (Weeks & Pace)
                </label>
                <div class="row gap" style="align-items: center;">
                  <select id="prompt-dur-weeks" name="durationWeeks" class="grow">
                    <option value="5" selected>5 weeks (Accelerated Intensive)</option>
                    <option value="7">7 weeks (Accelerated Term)</option>
                    <option value="8">8 weeks (Standard Module)</option>
                    <option value="12">12 weeks (Quarter / Trimester)</option>
                    <option value="14">14 weeks (Full Semester)</option>
                    <option value="16">16 weeks (Extended Semester)</option>
                    <option value="custom">Custom duration...</option>
                  </select>
                  <input type="number" id="prompt-custom-weeks" name="customWeeks" min="2" max="30" placeholder="Weeks" style="width: 80px; display: none;" aria-label="Custom weeks">
                </div>
              </div>

              <div class="field" style="margin: 0;">
                <label for="prompt-visit-format" class="small" style="font-weight: 600;">
                  5. Cross-Country Mobility & Format
                </label>
                <select id="prompt-visit-format" name="visitFormat">
                  <option value="virtual" selected>100% Fully Virtual Exchange (COIL, online collaboration)</option>
                  <option value="student-visit">Blended: Virtual Collaboration + Reciprocal Student Immersion Visit</option>
                  <option value="faculty-visit">Blended: Virtual Collaboration + Visiting Faculty Mobility / Colloquium</option>
                  <option value="parallel-studios">Dual-Campus Synchronized Labs / Parallel Studios</option>
                  <option value="async-distributed">Asynchronous Distributed Teams (Optimized for large time-zone differences)</option>
                  <option value="field-practicum">Virtual Preparation + Joint On-Site Field Practicum / Community Action</option>
                </select>
              </div>
            </div>

            <div class="field" style="margin: 0;">
              <label for="course-prompt" class="ai-prompt-label">
                ${icon.sparkle} <strong>6. Course Topic, Discipline, or Driving Inquiry Vision</strong>
                <span class="muted small" style="display: block; font-weight: normal; margin-top: 2px;">Enter your topic, syllabus goals, or inquiry question. AI will co-develop the complete, approved international course package with zero intermediate steps.</span>
              </label>
              <textarea id="course-prompt" name="prompt" rows="3" required placeholder="e.g. AI Ethics, Algorithmic Bias and Public Policy. Focus on algorithmic accountability audits and comparative cultural governance..."></textarea>
            </div>

            <div class="row between wrap gap" style="margin-top: var(--space-3); align-items: center;">
              <span class="muted small">All 5 deliverables (Syllabus HTML & PDF, Student Handout MD, Partnership Charter, .ics Calendar, and Project File) will be created immediately.</span>
              <div class="row gap wrap">
                <button type="submit" class="btn primary lg" data-action="generate-from-prompt" style="min-width: 260px;">
                  ${icon.sparkle} Generate Complete Course Package
                </button>
                <button type="button" class="btn ghost lg" data-action="open-ai-demo-modal">
                  Guided Wizard...
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="row gap wrap" style="margin-top: var(--space-4);">
          <span class="muted small" style="align-self: center;">Other ways to collaborate:</span>
          <button class="btn" data-action="new-project">${icon.plus} Start manual partnership</button>
          <button class="btn" data-action="import-project">${icon.upload} Open a partner’s project file</button>
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
    const r = await modal({
      title: 'Co-Design with an AI Partner Professor',
      wide: true,
      body: `<p class="lede" style="margin-bottom: var(--space-3);">
        Collaborate with an AI partner representing your international partner university.
        Crosscourse aligns institutional contexts, calendars, and outcomes to co-develop complete, approved course deliverables.
      </p>
      <fieldset class="field" style="margin-bottom: var(--space-3);">
        <legend><strong>1. Collaboration scope</strong></legend>
        <label class="choice">
          <input type="radio" name="mode" value="module" checked>
          <span>
            <strong>Shared international module / segment in existing courses</strong><br>
            <span class="muted small">A collaborative arc embedded within each partner's existing course.</span>
          </span>
        </label>
        <label class="choice">
          <input type="radio" name="mode" value="course">
          <span>
            <strong>Whole course collaboration</strong><br>
            <span class="muted small">A complete joint course designed collaboratively from the ground up.</span>
          </span>
        </label>
      </fieldset>
      <div class="grid2 gap" style="margin-bottom: var(--space-3);">
        <div class="field" style="margin: 0;">
          <label for="ai-demo-duration"><strong>2. Course Duration & Pace</strong></label>
          <select id="ai-demo-duration" name="durationWeeks">
            <option value="5" selected>5 weeks (Accelerated Intensive)</option>
            <option value="7">7 weeks (Accelerated Term)</option>
            <option value="8">8 weeks (Standard Module)</option>
            <option value="12">12 weeks (Quarter / Trimester)</option>
            <option value="14">14 weeks (Full Semester)</option>
            <option value="16">16 weeks (Extended Semester)</option>
            <option value="custom">Custom duration...</option>
          </select>
          <div id="ai-demo-custom-weeks-box" style="display: none; margin-top: var(--space-2);">
            <label for="ai-demo-custom-weeks" class="small muted">Duration in weeks (2 to 30)</label>
            <input type="number" id="ai-demo-custom-weeks" name="customWeeks" min="2" max="30" value="7">
          </div>
        </div>

        <div class="field" style="margin: 0;">
          <label for="ai-demo-visit"><strong>3. Cross-Country Mobility & Format</strong></label>
          <select id="ai-demo-visit" name="visitFormat">
            <option value="virtual" selected>100% Fully Virtual Exchange (COIL, online collaboration)</option>
            <option value="student-visit">Blended: Virtual Collaboration + Reciprocal Student Immersion Visit</option>
            <option value="faculty-visit">Blended: Virtual Collaboration + Visiting Faculty Mobility / Colloquium</option>
            <option value="parallel-studios">Dual-Campus Synchronized Labs / Parallel Studios</option>
            <option value="async-distributed">Asynchronous Distributed Teams (Optimized for large time-zone differences)</option>
            <option value="field-practicum">Virtual Preparation + Joint On-Site Field Practicum / Community Action</option>
          </select>
        </div>
      </div>
      <div class="field" style="margin-bottom: var(--space-3);">
        <label for="ai-demo-topic"><strong>4. Collaboration Topic or Inquiry Vision</strong></label>
        <input id="ai-demo-topic" name="topic" required placeholder="e.g. Comparative Climate Resilience, AI Ethics, or Global Supply Chains">
      </div>
      <div class="grid2 gap" style="margin-bottom: var(--space-3);">
        <div class="field" style="margin: 0;">
          <label for="ai-demo-partner-inst"><strong>5. Partner University (University 2)</strong></label>
          <input id="ai-demo-partner-inst" name="partnerInst" required placeholder="e.g. Kyoto University">
        </div>
        <div class="field" style="margin: 0;">
          <label for="ai-demo-partner-name"><strong>Partner Colleague Name (Optional)</strong></label>
          <input id="ai-demo-partner-name" name="partnerName" placeholder="e.g. Dr. Colleague Name">
        </div>
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
            <strong>Interactive Step-by-Step Mode (AI Assisted)</strong><br>
            <span class="muted small">Starts as an initial draft with your customized parameters, where you step through each design stage with the AI partner proposing along the way.</span>
          </span>
        </label>
      </fieldset>
      <fieldset class="field">
        <legend><strong>6. About you (Home Professor)</strong></legend>
        <div class="grid2">
          <div class="field">
            <label for="ai-demo-myname">Your name</label>
            <input id="ai-demo-myname" name="myName" placeholder="e.g. Professor Name" required>
          </div>
          <div class="field">
            <label for="ai-demo-myinst">Your institution (University 1)</label>
            <input id="ai-demo-myinst" name="myInst" placeholder="e.g. Alcorn State University" required>
          </div>
        </div>
      </fieldset>`,
      actions: [
        { label: 'Cancel', value: null },
        { label: 'Launch Co-Design Simulation', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }
      ],
      onOpen(dlg) {
        const selDur = dlg.querySelector('#ai-demo-duration');
        const customWeeksBox = dlg.querySelector('#ai-demo-custom-weeks-box');
        if (selDur && customWeeksBox) {
          selDur.addEventListener('change', () => {
            customWeeksBox.style.display = selDur.value === 'custom' ? 'block' : 'none';
          });
        }
      }
    });

    if (!r?.value) return;
    const d = r.data;
    let dWeeks = d.durationWeeks;
    if (dWeeks === 'custom') {
      dWeeks = parseInt(d.customWeeks, 10) || 7;
    } else {
      dWeeks = parseInt(dWeeks, 10) || (d.mode === 'course' ? 14 : 5);
    }

    const p = createAiPartnerDemo({
      mode: d.mode,
      durationWeeks: dWeeks,
      visitFormat: d.visitFormat || 'virtual',
      topic: d.topic,
      customTopic: d.topic,
      homeUniversity: d.myInst || 'Home University',
      partnerUniversity: d.partnerInst || 'Partner University',
      partnerName: d.partnerName || undefined,
      userProfile: {
        name: d.myName || 'Home Professor',
        institution: d.myInst || 'Home University'
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
      toast(`AI Partner simulation started with ${partner.name} (${partner.institution}, ${partner.country})! ${dWeeks} weeks, ${d.visitFormat === 'student-visit' ? 'Hybrid Student Immersion' : (d.visitFormat === 'faculty-visit' ? 'Hybrid Faculty Visit' : 'Virtual')}`, 'ok');
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
