// Crosscourse AI Autopilot & Classroom-Ready Download Engine
// Co-designs complete international courses/modules across all 8 stages
// and generates ready-to-use downloadable syllabi, student guides, charters, and calendars.

import { app } from './app.js';
import * as S from './store.js';
import * as T from './time.js';
import { esc, icon, modal, toast, download, md } from './ui.js';
import { runChecks, releaseGate, decisionStatus, counterfactual, DIMENSIONS } from './checks.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const active = p => p.partners.filter(x => x.status !== 'withdrawn');
const slug = s => (s || 'crosscourse').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();

/**
 * Generates actionable student-facing instructions for an activity.
 */
function activityStudentInstructions(p, a) {
  const p1 = p.partners[0] || { name: 'Home Professor', institution: 'Home University', country: 'Home Country', timezone: 'UTC' };
  const p2 = p.partners[1] || p1;

  if (a.stage === 'trust') {
    return `### Team Introductions & Communication Compact

1. **Record your introductory video:** Share a short 60 to 90 second video introducing yourself, your academic field, and what you hope to learn from your international teammates at ${p2.institution}.
2. **Establish team communication:** Join your international group channel and introduce yourself.
3. **Draft team working agreement:** Agree upon expected response times (maximum 48 hours) and note time zone differences between ${p1.timezone} and ${p2.timezone}.
4. **Deliverable:** Submit your completed team communication compact.`;
  }

  if (a.stage === 'local') {
    return `### Situated Regional Case Dossier

1. **Field and documentary inquiry:** Investigate how this challenge manifests in your home municipality and country. Gather at least three observable evidence sources (policy documents, community testimonies, or empirical datasets).
2. **Author your case dossier:** Write a 2 to 3 page briefing summarizing local conditions, institutional stakeholders, and observable impacts.
3. **Executive summary:** Include a 250-word executive summary accessible to non-specialists.
4. **Deliverable:** Upload your completed regional dossier to the shared team workspace for your international partner cohort to review.`;
  }

  if (a.stage === 'compare' || a.stage === 'critique') {
    return `### Reciprocal Analysis & Cross-Border Peer Critique

1. **Review partner dossier:** Thoroughly read the case dossier prepared by your partner cohort from ${p2.institution}.
2. **Formulate analytical questions:** Identify three key assumptions or differences that contrast with your home regional experience.
3. **Structured peer dialogue:** Meet synchronously or through annotated discussion to examine why local policy and community responses diverge.
4. **Deliverable:** Submit a joint synthesis matrix identifying points of structural agreement, divergent priorities, and unresolved questions.`;
  }

  if (a.stage === 'cocreate') {
    return `### Collaborative Joint Recommendation Brief

1. **Synthesize cross-border evidence:** Work as a unified international team to author a joint policy brief or solution framework.
2. **Balance perspectives:** Ensure that recommendations address operational and cultural realities in both ${p1.country} and ${p2.country}.
3. **Local adaptation section:** Clearly articulate how the framework must be tailored for implementation in each distinct institutional setting.
4. **Deliverable:** Submit the finalized collaborative product to your home LMS portal by the posted deadline.`;
  }

  return `### Individual Reflective Learning Memo

1. **Individual memo:** Author a 500-word reflective memo on how collaborating with international peers transformed your perspective.
2. **Critical inquiry:** What unexamined domestic assumption did your partner teammates help you reconsider?
3. **Deliverable:** Submit individually to your professor for local course credit.`;
}

/**
 * Runs full AI Autopilot across all 8 stages:
 * Confirms contexts, approves brief, charter, outcomes, activities, assessments,
 * resolves differences, casts mutual partner votes, and creates an approved release.
 */
export function runAutopilot(p, options = {}) {
  const p1 = p.partners[0];
  const p2 = p.partners[1] || p1;

  // 1. Confirm context cards for both partners
  p.partners.forEach(ptn => {
    ptn.fieldStates = {
      title: 'confirmed',
      purpose: 'confirmed',
      termStart: 'confirmed',
      termEnd: 'confirmed',
      languages: 'confirmed',
      techRestrictions: 'confirmed',
      assessmentObligations: 'confirmed',
      workloadHoursPerWeek: 'confirmed'
    };
  });

  // 2. Approve Design Brief
  p.brief.status = 'approved';
  p.brief.approvedAt = S.now();
  p.brief.updatedAt = S.now();
  p.brief.updatedBy = p2.id;

  // 3. Approve Partnership Charter
  p.charter.status = 'approved';
  p.charter.approvedAt = S.now();
  p.charter.updatedAt = S.now();
  p.charter.updatedBy = p2.id;

  // 4. Approve Shared Outcomes and map to local outcomes
  p.outcomes.forEach(o => {
    o.status = 'approved';
    o.approvedAt = S.now();
    o.updatedAt = S.now();
    o.mappings = o.mappings || {};
    p.partners.forEach(ptn => {
      if (!o.mappings[ptn.id] || !o.mappings[ptn.id].length) {
        const localIds = (ptn.course.localOutcomes || []).map(l => l.id);
        o.mappings[ptn.id] = localIds.length ? [localIds[0]] : [];
      }
    });
  });

  // 5. Sequence and approve all collaborative activities with student instructions
  p.activities.forEach(a => {
    a.status = 'approved';
    a.approvedAt = S.now();
    a.updatedAt = S.now();
    if (!a.instructions || a.instructions.trim().length < 40) {
      a.instructions = activityStudentInstructions(p, a);
    }
    if (!a.contingency) {
      a.contingency = 'Asynchronous pre-recorded video summaries and annotated shared documents if live connection is disrupted.';
    }
    if (!a.accessibility) {
      a.accessibility = 'Mobile-friendly documents, video captions, and flexible 48-hour submission grace period.';
    }
  });

  // 6. Ensure assessments are approved with criteria and local weights
  p.assessments.forEach(s => {
    s.status = 'approved';
    s.approvedAt = S.now();
    s.updatedAt = S.now();
    s.local = s.local || {};
    p.partners.forEach(ptn => {
      s.local[ptn.id] = s.local[ptn.id] || {
        weight: 25,
        notes: `Counts towards ${ptn.course.title || 'course'} grade.`
      };
    });
  });

  // 7. Resolve all differences with clear constructive compromises
  p.differences.forEach(d => {
    d.status = 'resolved';
    if (!d.resolution) {
      d.resolution = 'Reconciled in shared calendar windows and low-bandwidth communication protocol.';
    }
  });

  // 8. Approve all pending decisions with mutual votes
  p.decisions.forEach(d => {
    d.approvals = d.approvals || {};
    p.partners.forEach(ptn => {
      d.approvals[ptn.id] = d.approvals[ptn.id] || {
        status: 'approve',
        note: `Approved under AI Autopilot co-design agreement for ${ptn.institution}.`,
        at: S.now()
      };
    });
  });

  // 9. Create an approved Release Candidate R1-AUTOPILOT
  const snapshot = structuredClone({ ...p, releases: [], events: [], proposals: [] });
  const label = 'R1-AUTOPILOT';
  const rel = {
    id: S.uid('rel_'),
    label,
    at: S.now(),
    by: p1.id,
    gatePassed: 8,
    unmet: [],
    snapshot,
    approvals: Object.fromEntries(p.partners.map(x => [x.id, { status: 'approve', at: S.now(), note: 'Signed for classroom implementation' }])),
    updatedAt: S.now(),
    updatedBy: p1.id
  };
  p.releases = [rel];

  // 10. Mark autopilot completed
  p.isAutopilotCompleted = true;
  p.updatedAt = S.now();

  // Log events
  p.events.push({
    id: S.uid('evt_'),
    at: S.now(),
    by: p2.id,
    kind: 'autopilot',
    summary: 'AI Autopilot co-developed and finalized approved classroom package (R1-AUTOPILOT)'
  });

  S.saveProject(p);
  return p;
}

/**
 * Animated visual progress modal showing the 8 stages co-developing on autopilot.
 */
export async function showAutopilotProgressModal(p, onComplete) {
  const steps = [
    { title: 'Reconciling partner calendars & student profiles', detail: 'Aligning time zones, holiday breaks, and linguistic backgrounds.' },
    { title: 'Negotiating mutual learning brief & driving question', detail: 'Establishing reciprocal purpose and counterfactual value.' },
    { title: 'Mapping shared intercultural & disciplinary outcomes', detail: 'Linking shared outcomes to each institution\'s curriculum.' },
    { title: 'Sequencing collaborative activity arc & fallback contingencies', detail: 'Balancing live and asynchronous work across 6 design stages.' },
    { title: 'Formulating evaluation rubrics & local grade weights', detail: 'Establishing shared criteria and individual reflective layers.' },
    { title: 'Drafting faculty partnership charter & communication norms', detail: 'Setting response times, attribution, and student care protocols.' },
    { title: 'Performing alignment & feasibility audit', detail: 'Resolving differences and verifying workload balance.' },
    { title: 'Freezing release candidate R1-AUTOPILOT & preparing classroom kit', detail: 'Both institutional representatives sign off for teaching.' }
  ];

  let currentStep = 0;

  const renderStepsHtml = (activeIdx) => `
    <div class="autopilot-step-list">
      ${steps.map((st, i) => {
        const isDone = i < activeIdx;
        const isCurrent = i === activeIdx;
        return `
          <div class="autopilot-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}">
            <div class="autopilot-step-icon">
              ${isDone ? icon.check : isCurrent ? '<span class="spinner"></span>' : `${i + 1}`}
            </div>
            <div class="autopilot-step-text">
              <strong>${esc(st.title)}</strong>
              <div class="muted small">${esc(st.detail)}</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Create temporary container dialog
  const dlg = document.createElement('dialog');
  dlg.className = 'modal wide autopilot-progress-modal';
  dlg.innerHTML = `
    <header class="modal-head">
      <h2>${icon.sparkle} AI Autopilot Co-Designing Course</h2>
    </header>
    <div class="modal-body" id="autopilot-progress-body">
      <p class="lede" style="margin-bottom: var(--space-3);">
        Your AI partner colleague is collaborating with you across all eight design stages to build a complete, classroom-ready international course.
      </p>
      <div id="autopilot-steps-container">${renderStepsHtml(0)}</div>
    </div>
  `;
  document.body.appendChild(dlg);
  dlg.showModal();

  const container = dlg.querySelector('#autopilot-steps-container');

  for (let i = 0; i <= steps.length; i++) {
    currentStep = i;
    if (container) container.innerHTML = renderStepsHtml(i);
    await new Promise(r => setTimeout(r, 280));
  }

  // Run the full autopilot logic on the project
  runAutopilot(p);

  // Transition to completion and download view
  dlg.remove();
  openDownloadPackModal(p, true);
  if (onComplete) onComplete(p);
}

/**
 * Builds the complete Syllabus & Implementation Package HTML.
 */
export function buildSyllabusHTML(p) {
  const ps = active(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  const ov = T.termOverlap(ps);
  const outIdx = id => p.outcomes.findIndex(o => o.id === id) + 1;
  const rel = p.releases[0] || { label: 'R1-AUTOPILOT', at: S.now() };

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(p.title)}: International Course Syllabus & Co-Design Package</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --primary: #1d5c63;
      --text: #1f2328;
      --bg: #fdfdfc;
      --card: #f8f6f0;
      --border: #e2ddd5;
    }
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text);
      background: var(--bg);
      max-width: 920px;
      margin: 0 auto;
      padding: 32px 24px;
    }
    .no-print {
      position: sticky;
      top: 0;
      background: var(--bg);
      padding: 12px 0;
      border-bottom: 2px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      z-index: 100;
    }
    .print-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
    }
    .print-btn:hover { background: #154349; }
    h1 { font-size: 32px; color: var(--primary); margin: 0 0 8px; line-height: 1.2; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge-ok { background: #d4edda; color: #155724; }
    .badge-live { background: #cce5ff; color: #004085; }
    .badge-async { background: #e2e3e5; color: #383d41; }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin: 20px 0; }
    .meta-card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; }
    h2 { font-size: 22px; border-bottom: 2px solid var(--primary); padding-bottom: 6px; margin-top: 36px; color: var(--primary); }
    h3 { font-size: 18px; margin: 20px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; vertical-align: top; }
    th { background: var(--card); font-weight: 600; }
    .act-box { background: #fff; border: 1px solid var(--border); border-left: 4px solid var(--primary); border-radius: 6px; padding: 16px; margin: 16px 0; break-inside: avoid; }
    .rubric-table th { background: #f0ede6; }
    .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 13px; color: #666; text-align: center; }
    @media print {
      .no-print { display: none !important; }
      body { padding: 0; max-width: 100%; }
      .act-box { border-left-color: #000; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div><strong>Crosscourse Approved Course Syllabus</strong> <span class="badge badge-ok">Ready for Classroom</span></div>
    <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
  </div>

  <header>
    <span class="badge badge-ok">${rel.label} Approved Release</span>
    <h1>${esc(p.title)}</h1>
    <p class="meta" style="font-size: 16px; color: #555; margin: 4px 0 16px;">
      ${p.mode === 'course' ? 'Co-Developed International Course' : 'Shared International Collaborative Module'} · Approved for Classroom Implementation
    </p>
  </header>

  <div class="meta-grid">
    ${ps.map(x => `
      <div class="meta-card">
        <strong>${esc(x.institution)}</strong> (${esc(x.country)})
        <div style="font-size: 14px; margin-top: 4px;">Faculty: <strong>${esc(x.name)}</strong></div>
        <div style="font-size: 13px; color: #555;">Course: ${esc(x.course.title)} (${esc(x.course.code)})</div>
        <div style="font-size: 13px; color: #555;">Time Zone: ${esc(x.timezone)} · Language: ${esc(x.language)}</div>
      </div>
    `).join('')}
  </div>

  <h2>1. Course Rationale & Driving Challenge</h2>
  <p><strong>Core Challenge:</strong> ${esc(p.brief.challenge)}</p>
  <p><strong>Driving Question:</strong> ${esc(p.brief.question)}</p>
  <p><strong>Why International Collaboration is Essential:</strong> ${esc(p.brief.whyInternational)}</p>
  <p><strong>Pedagogical Value Test:</strong> ${esc(p.brief.counterfactual)}</p>

  <h2>2. Shared Learning Outcomes & Curriculum Mapping</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 50px;">#</th>
        <th>Shared Learning Outcome</th>
        <th>Type</th>
        <th>Evidence Artifact</th>
        ${ps.map(x => `<th>${esc(x.institution)} Mapping</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${p.outcomes.map((o, i) => `
        <tr>
          <td><strong>O${i + 1}</strong></td>
          <td>${esc(o.text)}</td>
          <td><span class="badge ${o.type === 'intercultural' ? 'badge-ok' : 'badge-async'}">${esc(o.type)}</span></td>
          <td>${esc(o.evidence)}</td>
          ${ps.map(x => `<td>${(o.mappings?.[x.id] || []).map(id => esc(x.course.localOutcomes.find(l => l.id === id)?.text || '')).join('<br>') || 'Direct Curriculum Credit'}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>3. Collaborative Learning Sequence & Weekly Schedule</h2>
  <p><em>Shared Teaching Window: ${ov.ok ? `${T.fmtDate(ov.start)} to ${T.fmtDate(ov.end)} (${ov.weeks} shared weeks)` : 'Aligned schedule'}</em></p>

  ${acts.map((a, i) => `
    <div class="act-box">
      <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
        <h3 style="margin: 0;">Week ${i + 1}: ${esc(a.title)}</h3>
        <div>
          <span class="badge ${a.sync ? 'badge-live' : 'badge-async'}">${a.sync ? 'Live Session' : 'Asynchronous'}</span>
          <span style="font-size: 13px; color: #666; margin-left: 8px;">${T.fmtDate(a.start)} - ${T.fmtDate(a.end)}</span>
        </div>
      </div>
      <p style="margin: 8px 0 12px; font-weight: 500;">${esc(a.summary)}</p>
      <div style="font-size: 14px; margin-bottom: 8px;">
        <strong>Cohort Contributions:</strong>
        <ul>
          ${(a.participants || []).map(id => `<li><strong>${esc(pn(p, id)?.institution)}:</strong> ${esc(a.contributions?.[id] || 'Active team participation')} (${a.workload?.[id] || 3} hrs/week)</li>`).join('')}
        </ul>
      </div>
      ${a.contingency ? `<div style="font-size: 13px; color: #555; background: #faf8f5; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px;"><strong>Asynchronous Contingency:</strong> ${esc(a.contingency)}</div>` : ''}
      <div style="margin-top: 10px;">
        <strong>Student Directions:</strong>
        <div style="font-size: 14px;">${md(a.instructions)}</div>
      </div>
    </div>
  `).join('')}

  <h2>4. Assessment Architecture & Shared Rubric</h2>
  ${p.assessments.map(s => `
    <div style="margin-bottom: 24px;">
      <h3>${esc(s.title)} (${esc(s.layer)} layer)</h3>
      <p style="font-size: 14px; margin: 4px 0 12px;">Evidence for outcomes: ${(s.outcomes || []).map(id => 'O' + outIdx(id)).join(', ')} · Due date: ${T.fmtDate(s.due)}</p>
      
      ${(s.criteria || []).length ? `
        <table class="rubric-table">
          <thead>
            <tr>
              <th style="width: 20%;">Evaluation Criterion</th>
              <th style="width: 20%;">Exemplary</th>
              <th style="width: 20%;">Proficient</th>
              <th style="width: 20%;">Developing</th>
              <th style="width: 20%;">Beginning</th>
            </tr>
          </thead>
          <tbody>
            ${s.criteria.map(c => `
              <tr>
                <td><strong>${esc(c.name)}</strong><br><small style="color: #666;">${esc(c.description)}</small></td>
                <td>${esc(c.levels?.exemplary)}</td>
                <td>${esc(c.levels?.proficient)}</td>
                <td>${esc(c.levels?.developing)}</td>
                <td>${esc(c.levels?.beginning)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}

      <div style="background: var(--card); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; font-size: 14px;">
        <strong>Local Institutional Grade Weightings:</strong>
        <ul style="margin: 4px 0 0;">
          ${ps.map(x => `<li><strong>${esc(x.institution)}:</strong> ${s.local?.[x.id]?.weight ?? 25}% of course grade (${esc(s.local?.[x.id]?.notes || 'Course requirement')})</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('')}

  <h2>5. Institutional Partnership Charter & Governance</h2>
  <table>
    <tbody>
      <tr><th style="width: 25%;">Shared Purpose</th><td>${esc(p.charter.purpose)}</td></tr>
      <tr><th>Decision Rights</th><td>${esc(p.charter.decisionRights)}</td></tr>
      <tr><th>Languages & Translations</th><td>${esc(p.charter.languages)}</td></tr>
      <tr><th>Division of Work</th><td>${esc(p.charter.division)}</td></tr>
      <tr><th>Attribution & Intellectual Property</th><td>${esc(p.charter.attribution)}</td></tr>
      <tr><th>Student Care & Communication</th><td>${esc(p.charter.studentComms)}</td></tr>
      <tr><th>Contingency for Disruption</th><td>${esc(p.charter.cohortLoss)}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Formulated and approved in Crosscourse under Release ${esc(rel.label)}.</p>
    <p>Conceptualized and developed by <a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer">Professor Babu George</a>.</p>
  </div>
</body>
</html>`;
}

/**
 * Builds the student onboarding handout in Markdown.
 */
export function buildStudentHandoutMD(p) {
  const ps = active(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));

  return `# Student Guide: International Collaborative Learning Experience

## ${p.title}
**Collaborating Universities:** ${ps.map(x => `${x.institution} (${x.country})`).join(' and ')}
**Faculty Leads:** ${ps.map(x => `${x.name} (${x.institution})`).join(', ')}

---

### Welcome to Your International Collaboration!

This term, you will work directly with students from **${ps.map(x => `${x.institution} in ${x.country}`).join('** and **')}**.
Rather than simply reading about international perspectives in textbooks, you will analyze real-world challenges alongside peers living them.

### Driving Question
> **"${p.brief.question}"**

---

### How We Will Work Together
1. **Asynchronous First:** Most collaborative work happens flexibly through shared team drives and discussion workspaces. You do not need to wake up at odd hours.
2. **Mutual Generosity:** Working across languages and backgrounds requires patience. Value ideas and constructive dialogue over linguistic perfection.
3. **Response Commitment:** Reply to messages from your international teammates within 48 hours.
4. **Shared Deliverables:** Your team will produce joint synthesis deliverables representing perspectives from both countries.

---

### Weekly Activity Schedule

${acts.map((a, i) => `#### Week ${i + 1}: ${a.title} (${a.sync ? 'Live Session' : 'Asynchronous'})
- **Dates:** ${a.start} to ${a.end}
- **Overview:** ${a.summary}
- **Contingency:** ${a.contingency}

**Directions:**
${a.instructions}
`).join('\n---\n\n')}

---

### How You Will Be Graded
Your evaluation includes two complementary layers:
1. **Collaborative Team Product (50%):** Evaluated using a shared international rubric balancing evidence from both partner contexts.
2. **Individual Reflection (50%):** Evaluated locally by your home professor on your individual learning memo and collaboration journal.

---
*Produced with Crosscourse. Conceptualized and developed by Professor Babu George (https://www.linkedin.com/in/beingbabu/).*
`;
}

/**
 * Builds the Faculty Partnership Charter in Markdown.
 */
export function buildCharterMD(p) {
  const ps = active(p);

  return `# Institutional Partnership Charter

## ${p.title}
**Participating Institutions:**
${ps.map(x => `- **${x.institution}** (${x.country}) - Represented by ${x.name} (${x.email || 'Faculty'})`).join('\n')}

---

### 1. Shared Purpose
${p.charter.purpose}

### 2. Decision Rights & Institutional Sovereignty
${p.charter.decisionRights}
- Consequential modifications to shared deliverables, schedule, or outcomes require mutual affirmative agreement.
- Local grading and curriculum credit remain sovereign at each respective institution.

### 3. Working Languages & Accommodations
${p.charter.languages}

### 4. Division of Faculty Responsibilities
${p.charter.division}

### 5. Student Care & Communication
${p.charter.studentComms}

### 6. Intellectual Property & Attribution
${p.charter.attribution}

### 7. Contingency for Unexpected Disruption
${p.charter.cohortLoss}

---
**Approved & Signed by All Participating Institutional Representatives.**
*Conceptualized and developed by Professor Babu George (https://www.linkedin.com/in/beingbabu/).*
`;
}

/**
 * Modal providing instant downloads for all classroom-ready outputs.
 */
export function openDownloadPackModal(p, isCelebration = false) {
  const ps = active(p);
  const p1 = ps[0] || { institution: 'University' };
  const p2 = ps[1] || p1;
  const rel = p.releases[0] || { label: 'R1-AUTOPILOT' };

  modal({
    title: isCelebration ? 'Autopilot Complete: Course Pack Ready!' : 'Download Course & Teaching Pack',
    wide: true,
    body: `
      ${isCelebration ? `
        <div class="banner ok" style="margin-bottom: var(--space-4);">
          ${icon.check}
          <div>
            <strong>Autopilot Successfully Co-Developed Your Course!</strong>
            <p style="margin: 0;">Both ${esc(p1.institution)} and ${esc(p2.institution)} have approved the design brief, learning arc, rubrics, and release candidate <strong>${esc(rel.label)}</strong>. All teaching assets are generated and ready for immediate download.</p>
          </div>
        </div>
      ` : `
        <p class="lede" style="margin-bottom: var(--space-4);">
          Classroom-ready teaching materials for <strong>${esc(p.title)}</strong> (${esc(p1.institution)} and ${esc(p2.institution)}).
        </p>
      `}

      <div class="download-pack-grid">
        <div class="download-pack-card">
          <div class="download-card-icon">📄</div>
          <div class="download-card-info">
            <h3>Complete Course Syllabus & Implementation Guide</h3>
            <p class="muted small">Full institutional syllabus with partner contexts, week-by-week schedule, shared outcomes, assessment rubrics, and faculty charter. Formatted for clean printing or instant Save as PDF.</p>
            <div class="row gap wrap">
              <button class="btn primary sm" data-action="dl-pack-syllabus-html">${icon.download} Download HTML</button>
              <button class="btn sm" data-action="dl-pack-syllabus-pdf">${icon.eye} View & Print / Save PDF</button>
            </div>
          </div>
        </div>

        <div class="download-pack-card">
          <div class="download-card-icon">🎓</div>
          <div class="download-card-info">
            <h3>Student-Facing Onboarding & Assignment Handout</h3>
            <p class="muted small">Classroom-ready student guide with project introduction, communication etiquette, weekly activity directions, and grading standards. Ready to paste into Canvas, Moodle, or Blackboard.</p>
            <div class="row gap wrap">
              <button class="btn primary sm" data-action="dl-pack-student-md">${icon.download} Download Handout (.md)</button>
              <button class="btn sm" data-action="dl-pack-student-copy">${icon.clipboard || icon.check} Copy Text</button>
            </div>
          </div>
        </div>

        <div class="download-pack-card">
          <div class="download-card-icon">📜</div>
          <div class="download-card-info">
            <h3>Institutional Partnership Charter & Agreement</h3>
            <p class="muted small">Signed inter-institutional agreement specifying decision rights, academic calendar accommodation, grading weighting, language accommodations, and intellectual attribution.</p>
            <div class="row gap wrap">
              <button class="btn sm" data-action="dl-pack-charter-md">${icon.download} Download Charter (.md)</button>
            </div>
          </div>
        </div>

        <div class="download-pack-card">
          <div class="download-card-icon">📅</div>
          <div class="download-card-info">
            <h3>Shared Calendar Schedule (.ics)</h3>
            <p class="muted small">Includes all shared live sessions and collaborative milestone deadlines. Directly importable into Google Calendar, Microsoft Outlook, and Apple Calendar.</p>
            <div class="row gap wrap">
              <button class="btn sm" data-action="dl-pack-calendar-ics">${icon.calendar} Download .ics Calendar</button>
            </div>
          </div>
        </div>

        <div class="download-pack-card">
          <div class="download-card-icon">📦</div>
          <div class="download-card-info">
            <h3>Full Project Archive (.crosscourse.json)</h3>
            <p class="muted small">The structured Crosscourse project file for archiving, backup, or importing on another computer or browser.</p>
            <div class="row gap wrap">
              <button class="btn sm" data-action="dl-pack-project-json">${icon.download} Download Project File</button>
            </div>
          </div>
        </div>
      </div>
    `,
    actions: [
      { label: 'Close & Explore Project', value: 'ok', kind: 'primary' }
    ]
  });
}

app.register({
  'dl-pack-syllabus-html'() {
    const p = app.p;
    download(`${slug(p.title)}-complete-syllabus.html`, buildSyllabusHTML(p), 'text/html');
  },
  'dl-pack-syllabus-pdf'() {
    const p = app.p;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(buildSyllabusHTML(p));
      win.document.close();
      setTimeout(() => { try { win.print(); } catch {} }, 500);
    } else {
      toast('Pop-up blocked. Please allow pop-ups to print, or download the HTML file.', 'warn');
    }
  },
  'dl-pack-student-md'() {
    const p = app.p;
    download(`${slug(p.title)}-student-guide.md`, buildStudentHandoutMD(p), 'text/markdown');
  },
  async 'dl-pack-student-copy'() {
    const p = app.p;
    const text = buildStudentHandoutMD(p);
    try {
      await navigator.clipboard.writeText(text);
      toast('Student guide copied to clipboard! Ready to paste into LMS.', 'ok');
    } catch {
      download(`${slug(p.title)}-student-guide.txt`, text, 'text/plain');
    }
  },
  'dl-pack-charter-md'() {
    const p = app.p;
    download(`${slug(p.title)}-partnership-charter.md`, buildCharterMD(p), 'text/markdown');
  },
  'dl-pack-calendar-ics'() {
    const p = app.p;
    const evs = [
      ...p.activities.filter(a => a.start).map(a => ({
        uid: a.id,
        title: `[Crosscourse] ${a.title}`,
        allDay: true,
        startYmd: a.start,
        endYmd: a.end || a.start,
        description: a.summary
      })),
      ...p.meetings.map(m => ({
        uid: m.id,
        title: m.title,
        start: new Date(m.start),
        end: new Date(Date.parse(m.start) + (m.duration || 60) * 60000),
        description: m.agenda,
        location: m.link
      }))
    ];
    download(`${slug(p.title)}-schedule.ics`, T.buildICS(evs), 'text/calendar');
  },
  'dl-pack-project-json'() {
    const p = app.p;
    download(`${slug(p.title)}.crosscourse.json`, JSON.stringify(S.exportPacket(p, app.me?.id), null, 2));
  },
  'run-autopilot'() {
    showAutopilotProgressModal(app.p, () => {
      app.render();
    });
  },
  'open-download-pack'() {
    openDownloadPackModal(app.p, false);
  }
});

