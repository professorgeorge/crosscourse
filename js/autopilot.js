// Crosscourse AI Autopilot & Classroom-Ready Download Engine
// Co-designs complete international courses/modules across all 8 stages
// and generates ready-to-use downloadable syllabi, student guides, charters, and calendars.

import { app } from './app.js';
import * as S from './store.js';
import * as T from './time.js';
import { esc, icon, modal, toast, download, md } from './ui.js';
import { runChecks, releaseGate, decisionStatus, counterfactual, DIMENSIONS } from './checks.js';
import { AI_PARTNER_PERSONAS, TOPIC_PRESETS, createAiPartnerDemo, getTermDates } from './demo.js';
import { callProvider, aiEnabled, parseJSON } from './ai.js';
import { downloadLmsCartridge } from './lms.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
const active = p => p.partners.filter(x => x.status !== 'withdrawn');
const slug = s => (s || 'crosscourse').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();

export function getMobilityLabel(format, customDetails = '') {
  if (format === 'custom' && customDetails) return `Custom: ${customDetails}`;
  switch (format) {
    case 'student-visit': return 'Blended: Virtual + Student Immersion Visit';
    case 'faculty-visit': return 'Blended: Virtual + Faculty Mobility / Colloquium';
    case 'parallel-studios': return 'Dual-Campus Synchronized Labs / Parallel Studios';
    case 'async-distributed': return 'Asynchronous Distributed Teams';
    case 'field-practicum': return 'Virtual Preparation + Joint On-Site Field Practicum';
    case 'custom': return 'Custom Mobility Format';
    case 'virtual':
    default: return '100% Fully Virtual Exchange';
  }
}

export function getMobilityDescription(format, partnerInst = 'Partner University', partnerCountry = 'International', customDetails = '') {
  if (format === 'custom' && customDetails) {
    return `Custom International Mobility & Delivery Format: ${customDetails}. Activities and institutional support are tailored accordingly across ${partnerInst} and the home campus.`;
  }
  switch (format) {
    case 'student-visit':
      return `Blended Virtual + Student Immersion: Student cohort participates in an intensive reciprocal field study visit at ${partnerInst} (${partnerCountry}). Host institution coordinates campus access, safety briefings, and field site visits. Non-traveling students participate through synchronized video links and annotated collaborative documents with complete academic parity.`;
    case 'faculty-visit':
      return `Blended Virtual + Faculty Mobility: Visiting faculty travels to partner campus for guest lectures, seminars, and a joint colloquium. Host institution assists with campus credentials and academic itinerary. Student cohort collaboration remains online.`;
    case 'parallel-studios':
      return `Dual-Campus Parallel Studios: Cohorts work simultaneously in synchronized design studios or laboratories on their home campuses, connecting at scheduled milestones for joint peer reviews, data exchanges, and simultaneous prototype crits.`;
    case 'async-distributed':
      return `Asynchronous Distributed Teams: Designed specifically for large time-zone differentials. Collaboration occurs via structured asynchronous handoffs, pre-recorded briefings, annotated documents, and 24-hour cycle workflows with lightweight messaging.`;
    case 'field-practicum':
      return `Virtual Preparation + Field Practicum: Cohorts complete collaborative virtual preparatory modules, followed by an intensive joint on-site practicum or community-based fieldwork with civic or industry partners in the host region.`;
    case 'virtual':
    default:
      return `100% Fully Virtual Exchange: All student and faculty interactions take place online via asynchronous shared workspaces and scheduled video sessions. No international travel is required.`;
  }
}

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
        note: `Approved under consortium co-design agreement for ${ptn.institution}.`,
        at: S.now()
      };
    });
  });

  // 9. Create an approved Release Candidate R1-RELEASE
  const snapshot = structuredClone({ ...p, releases: [], events: [], proposals: [] });
  const label = 'R1-RELEASE';
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

  // 10. Mark co-design completed
  p.isAutopilotCompleted = true;
  p.updatedAt = S.now();

  // Log events
  p.events.push({
    id: S.uid('evt_'),
    at: S.now(),
    by: p2.id,
    kind: 'co-design',
    summary: 'AI Assistance co-developed and finalized approved classroom package (R1-RELEASE)'
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
      <h2>${icon.sparkle} AI-Assisted Co-Design in Progress</h2>
    </header>
    <div class="modal-body" id="autopilot-progress-body">
      <p class="lede" style="margin-bottom: var(--space-3);">
        AI partner professors are collaborating across all eight design stages to build a complete, classroom-ready international course.
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
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
      <span class="badge badge-ok">${rel.label} Approved Release</span>
      <span class="badge ${p.durationWeeks <= 7 ? 'badge-live' : 'badge-ok'}">${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks (${p.durationWeeks <= 7 ? 'Accelerated Intensive' : 'Full Semester'})</span>
      <span class="badge ${p.visitFormat === 'student-visit' || p.visitFormat === 'faculty-visit' ? 'badge-ok' : 'badge-async'}">
        ${p.visitFormat === 'student-visit' ? 'In-Person Student Field Study & Immersion' : (p.visitFormat === 'faculty-visit' ? 'Faculty Cross-Country Exchange' : '100% Fully Virtual')}
      </span>
    </div>
    <h1>${esc(p.title)}</h1>
    <p class="meta" style="font-size: 16px; color: #555; margin: 4px 0 16px;">
      ${p.mode === 'course' ? 'Co-Developed International Course' : 'Shared International Collaborative Module'} · ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks · Approved for Classroom Implementation
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
      <tr><th>Mobility & Travel Protocol</th><td>${esc(p.charter.mobility || '100% Fully Virtual Collaboration. No international travel required.')}</td></tr>
      <tr><th>Contingency for Disruption</th><td>${esc(p.charter.cohortLoss)}</td></tr>
    </tbody>
  </table>

  <div style="margin-top: 2rem; padding: 1.25rem; border: 1px dashed #cbd5e1; border-radius: 6px; background: #f8fafc;">
    <h3 style="margin: 0 0 0.5rem; font-size: 1.05rem;">Consortium Course Signatures & Institutional Verification (Fill after download)</h3>
    <p style="margin: 0 0 1rem; font-size: 0.9rem; color: #64748b;">Signatures verifying course adoption, institutional equivalency, and cross-border curriculum alignment.</p>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
      <div style="padding-top: 0.5rem; border-top: 1px solid #94a3b8;">
        <strong>Course Developer / Instructional Designer:</strong><br>
        <span style="display: inline-block; margin-top: 1.5rem; color: #64748b; font-size: 0.85rem;">Signature: __________________________ &nbsp;&nbsp; Date: ___________</span>
      </div>
      <div style="padding-top: 0.5rem; border-top: 1px solid #94a3b8;">
        <strong>Lead Campus Faculty Instructor (${esc(ps[0]?.institution || 'Lead University')}):</strong><br>
        <span style="display: inline-block; margin-top: 1.5rem; color: #64748b; font-size: 0.85rem;">Signature: __________________________ &nbsp;&nbsp; Date: ___________</span>
      </div>
      ${ps.slice(1).map((x, idx) => `
      <div style="padding-top: 0.5rem; border-top: 1px solid #94a3b8;">
        <strong>Partner Campus ${idx + 2} Faculty Instructor (${esc(x.institution)}):</strong><br>
        <span style="display: inline-block; margin-top: 1.5rem; color: #64748b; font-size: 0.85rem;">Signature: __________________________ &nbsp;&nbsp; Date: ___________</span>
      </div>
      `).join('')}
    </div>
  </div>

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
**Duration & Format:** ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} weeks (${p.durationWeeks <= 7 ? 'Accelerated Intensive' : 'Full Semester'}) · ${p.visitFormat === 'student-visit' ? 'Hybrid with In-Person Student Field Study' : (p.visitFormat === 'faculty-visit' ? 'Hybrid with Faculty Exchange' : '100% Fully Virtual Online Collaboration')}

---

### Welcome to Your International Collaboration!

This term, you will work directly with students from **${ps.map(x => `${x.institution} in ${x.country}`).join('** and **')}**.
Rather than simply reading about international perspectives in textbooks, you will analyze real-world challenges alongside peers living them.

### Driving Question
> **"${p.brief.question}"**

---

### Collaboration Format & Schedule
- **Duration:** ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} weeks (${p.durationWeeks <= 7 ? 'Accelerated Intensive' : 'Full Semester'})
- **Format:** ${p.visitFormat === 'student-visit' ? `Hybrid with an intensive 1-week in-person field study visit at ${ps[1]?.institution || 'Partner Campus'}` : (p.visitFormat === 'faculty-visit' ? 'Hybrid with international faculty exchange' : '100% Fully Virtual Online Collaboration (no international travel required)')}
${p.visitFormat === 'student-visit' ? `
> **In-Person Field Study Note:** Traveling students will receive visa guidance and host campus orientations. Non-traveling students participate through synchronized video links and annotated collaborative field documents with full academic parity.
` : ''}

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

### Consortium Institutional Signatures (Fill after download)

- **Course Developer / Instructional Designer:** ________________________________ (Signature & Date)
- **Lead Campus Faculty Instructor (${ps[0]?.institution || 'Lead Campus'}):** ________________________________ (Signature & Date)
${ps.slice(1).map((x, i) => `- **Partner Campus ${i + 2} Faculty Instructor (${x.institution}):** ________________________________ (Signature & Date)`).join('\n')}

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
**Collaboration Parameters:** ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks · ${p.visitFormat === 'student-visit' ? 'Hybrid with Student In-Person Immersion' : (p.visitFormat === 'faculty-visit' ? 'Hybrid with Faculty Exchange' : '100% Fully Virtual')}

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

### 8. Cross-Country Mobility & Virtual Inclusivity
${p.charter.mobility || 'All student and faculty interactions take place online via asynchronous shared workspaces and scheduled video sessions. No international travel is required.'}

---

### Consortium Signatures & Institutional Verification (Fill after download)

- **Course Developer / Instructional Designer:** ________________________________ (Signature & Date)
- **Lead Campus Faculty Representative (${ps[0]?.institution || 'Lead Campus'}):** ________________________________ (Signature & Date)
${ps.slice(1).map((x, i) => `- **Partner Campus ${i + 2} Faculty Representative (${x.institution}):** ________________________________ (Signature & Date)`).join('\n')}

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
  const rel = p.releases[0] || { label: 'R1-RELEASE' };
  const campusList = ps.map(x => esc(x.institution)).join(', ');

  modal({
    title: isCelebration ? 'AI-Assisted Co-Design Complete: Course Pack Ready!' : 'Download Course & Teaching Pack',
    wide: true,
    body: `
      ${isCelebration ? `
        <div class="banner ok" style="margin-bottom: var(--space-4);">
          ${icon.check}
          <div>
            <strong>Course Successfully Co-Developed with AI Assistance!</strong>
            <p style="margin: 0;">Partner institutions in the consortium (${campusList}) have approved the design brief, learning arc, rubrics, and release candidate <strong>${esc(rel.label)}</strong>. All teaching assets are generated and ready for immediate download.</p>
          </div>
        </div>
      ` : `
        <p class="lede" style="margin-bottom: var(--space-4);">
          Classroom-ready teaching materials for <strong>${esc(p.title)}</strong> (${campusList}).
        </p>
      `}

      <div class="download-pack-grid">
        <div class="download-pack-card" style="border: 2px solid var(--primary); background: #f0fdfa;">
          <div class="download-card-icon">🏛️</div>
          <div class="download-card-info">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <h3 style="margin:0;">LMS Course Cartridge (Canvas / Blackboard / Moodle / Brightspace)</h3>
              <span class="badge" style="background:#1d5c63;color:#fff;">Universal LMS Standard</span>
            </div>
            <p class="muted small">Complete IMS Common Cartridge (.imscc) bundle containing full weekly module pages, student assignments, SpeedGrader rubrics, syllabus, and institutional charter. Ready to upload directly into Canvas ("Common Cartridge 1.x Package"), Blackboard, or Moodle.</p>
            <div class="row gap wrap">
              <button class="btn primary sm" data-action="dl-pack-lms-imscc">${icon.package} Download LMS Cartridge (.imscc)</button>
              <button class="btn sm" data-action="dl-pack-lms-zip">${icon.download} Download Web Package (.zip)</button>
            </div>
          </div>
        </div>

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
  'dl-pack-lms-imscc'() {
    const p = app.p;
    downloadLmsCartridge(p, false);
    toast('Downloaded LMS Common Cartridge (.imscc) for Canvas, Blackboard, Moodle, and Brightspace!', 'ok');
  },
  'dl-pack-lms-zip'() {
    const p = app.p;
    downloadLmsCartridge(p, true);
    toast('Downloaded LMS Web Package (.zip)!', 'ok');
  },
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
  },
  async 'generate-from-prompt'(d, el) {
    const form = el ? el.closest('form') : document.getElementById('ai-prompt-form');
    if (!form) return;
    const formData = new FormData(form);
    const promptText = (formData.get('prompt') || '').trim();
    const mode = formData.get('mode') || 'module';
    const durationWeeks = parseInt(formData.get('durationWeeks'), 10) || 5;
    const visitFormat = formData.get('visitFormat') || 'virtual';
    const customVisitFormat = (formData.get('customVisitFormat') || '').trim();
    const myName = (formData.get('myName') || '').trim();
    const myEmail = (formData.get('myEmail') || '').trim();
    const partnerName = (formData.get('partnerName') || '').trim();
    const workingLanguage = (formData.get('workingLanguage') || '').trim();

    if (!promptText) {
      toast('Please enter a course topic, discipline, or vision to generate.', 'warn');
      return;
    }

    // Extract all 2 to 9 universities from campus intake cards
    const campusCards = form.querySelectorAll('.campus-intake-card');
    const universities = [];
    if (campusCards.length > 0) {
      campusCards.forEach((c, idx) => {
        const instInput = c.querySelector('input[name$="_inst"]');
        const countryInput = c.querySelector('input[name$="_country"]');
        const profInput = c.querySelector('input[name$="_prof"]');
        const inst = (instInput?.value || '').trim();
        const country = (countryInput?.value || '').trim();
        const prof = (profInput?.value || '').trim();
        if (inst || idx === 0) {
          universities.push({
            index: idx + 1,
            institution: inst || (idx === 0 ? 'Home University' : `Partner University ${idx + 1}`),
            country: country || (idx === 0 ? 'United States' : 'International'),
            professor: prof || (idx === 0 ? (myName || 'Lead Professor') : `Partner Colleague ${idx + 1}`)
          });
        }
      });
    }

    if (universities.length < 2) {
      const fallbackHome = (formData.get('homeUniversity') || '').trim() || 'Home University';
      const fallbackPartner = (formData.get('partnerUniversity') || '').trim() || 'Partner University';
      universities.length = 0;
      universities.push({ index: 1, institution: fallbackHome, country: 'United States', professor: myName || 'Professor You' });
      universities.push({ index: 2, institution: fallbackPartner, country: 'International', professor: partnerName || 'Dr. Colleague Name' });
    }

    const homeUniversity = universities[0].institution;
    const partnerInstitutions = universities.slice(1).map(u => u.institution).join(', ');
    const partnerUniversity = universities[1]?.institution || 'Partner University';

    const durText = `${durationWeeks} weeks`;
    const mobilityLabel = getMobilityLabel(visitFormat, customVisitFormat);
    const steps = [
      { title: 'Interpreting consortium specifications & parameters', detail: `${universities.length} Universities: ${homeUniversity} and partner campuses · ${mode === 'course' ? 'Whole Course' : 'Course Segment'}` },
      { title: 'Calibrating duration & cross-country mobility format', detail: `Duration: ${durText} · Mobility: ${mobilityLabel}` },
      { title: 'Harmonizing institutional contexts across consortium', detail: `Aligning ${universities.length} campuses for flexible multi-term deployment.` },
      { title: 'Drafting mutual learning brief & driving inquiry question', detail: 'Formulating core international challenge and counterfactual test.' },
      { title: 'Mapping shared intercultural & disciplinary outcomes', detail: 'Linking shared outcomes to each institution\'s curriculum.' },
      { title: 'Sequencing collaborative learning arc & weekly milestones', detail: 'Balancing live and async activities with fallback contingencies.' },
      { title: 'Formulating student instructions & evaluation rubrics', detail: 'Generating weekly directions and 4-level grading rubrics.' },
      { title: 'Signing institutional partnership charter & agreement', detail: `Binding multilateral consortium agreement across ${universities.length} universities.` },
      { title: 'Freezing approved release candidate & classroom kit', detail: 'Zero intermediate human intervention: final deliverables ready.' }
    ];

    const renderSteps = (idx) => `
      <div class="autopilot-step-list">
        ${steps.map((st, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;
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

    const dlg = document.createElement('dialog');
    dlg.className = 'modal wide autopilot-progress-modal';
    dlg.innerHTML = `
      <header class="modal-head">
        <h2>${icon.sparkle} Co-Developing Course with AI</h2>
      </header>
      <div class="modal-body">
        <p class="lede" style="margin-bottom: var(--space-3);">
          AI is autonomously co-developing the complete course package for a consortium of <strong>${universities.length} partner universities</strong> (${esc(homeUniversity)} and partner campuses). Evergreen & reusable across academic terms. No intermediate manual steps required.
        </p>
        <div id="prompt-gen-steps">${renderSteps(0)}</div>
      </div>
    `;
    document.body.appendChild(dlg);
    dlg.showModal();

    const container = dlg.querySelector('#prompt-gen-steps');

    const genPromise = generateCourseFromPrompt(promptText, {
      homeUniversity,
      partnerUniversity,
      universities,
      mode,
      durationWeeks,
      visitFormat: (visitFormat === 'custom' && customVisitFormat) ? 'custom' : visitFormat,
      customVisitFormat,
      userProfile: {
        name: myName || universities[0]?.professor || 'Professor You',
        email: myEmail || '',
        institution: homeUniversity
      },
      partnerName,
      workingLanguage
    });

    for (let i = 1; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 220));
      if (container) container.innerHTML = renderSteps(i);
    }

    const project = await genPromise;
    if (container) container.innerHTML = renderSteps(steps.length);
    await new Promise(r => setTimeout(r, 200));

    S.saveProject(project);
    const s = S.settings.get();
    s.identities[project.id] = project.partners[0].id;
    S.settings.save(s);

    dlg.remove();

    app.p = project;
    app.me = project.partners[0];
    app.go(`#/p/${project.id}/overview`);
    openDownloadPackModal(project, true);
    toast(`Course co-developed successfully: "${project.title}"! All deliverables ready.`, 'ok');
  },
  'fill-prompt'(d, el) {
    const text = el.dataset.p;
    const u1 = el.dataset.u1;
    const u2 = el.dataset.u2;
    const term = el.dataset.term;
    const mode = el.dataset.mode;
    const dur = el.dataset.dur;
    const visit = el.dataset.visit;
    const form = document.getElementById('ai-prompt-form');
    if (!form || !text) return;
    const ta = form.querySelector('textarea[name=prompt]');
    if (ta) {
      ta.value = text;
      ta.focus();
    }
    if (u1) {
      const u1Input = form.querySelector('input[name=homeUniversity]');
      if (u1Input) u1Input.value = u1;
    }
    if (u2) {
      const u2Input = form.querySelector('input[name=partnerUniversity]');
      if (u2Input) u2Input.value = u2;
    }
    if (term) {
      const termSel = form.querySelector('select[name=term]');
      if (termSel) termSel.value = term;
    }
    if (mode) {
      const modeRadio = form.querySelector(`input[name=mode][value="${mode}"]`);
      if (modeRadio) modeRadio.checked = true;
    }
    if (dur) {
      const durSel = form.querySelector('select[name=durationWeeks]');
      if (durSel) durSel.value = dur;
    }
    if (visit) {
      const visitSel = form.querySelector('select[name=visitFormat]');
      if (visitSel) visitSel.value = visit;
    }
  },
  'customize-collab-format'() {
    const p = app.p;
    if (!p) return;
    const curDur = p.durationWeeks || (p.mode === 'course' ? 14 : 5);
    const curVisit = p.visitFormat || 'virtual';
    const isCustomVisit = !['virtual', 'student-visit', 'faculty-visit', 'parallel-studios', 'async-distributed', 'field-practicum'].includes(curVisit);

    modal({
      title: 'Customize Collaboration Format & Pacing',
      content: `
        <form class="stack" id="format-custom-form">
          <p class="muted">Set the duration in weeks and specify your cross-country collaboration format.</p>
          
          <div class="field">
            <label for="custom-dur-weeks"><strong>Course Duration (Weeks)</strong></label>
            <input type="number" id="custom-dur-weeks" name="durationWeeks" min="1" max="52" value="${curDur}" required placeholder="Number of weeks (e.g. 8)">
          </div>

          <div class="field">
            <label for="custom-visit-format"><strong>Cross-Country Mobility & Format</strong></label>
            <select id="custom-visit-format" name="visitFormat">
              <option value="virtual" ${curVisit === 'virtual' ? 'selected' : ''}>100% Fully Virtual Exchange (Online collaboration)</option>
              <option value="student-visit" ${curVisit === 'student-visit' ? 'selected' : ''}>Blended: Virtual Collaboration + Reciprocal Student Immersion Visit</option>
              <option value="faculty-visit" ${curVisit === 'faculty-visit' ? 'selected' : ''}>Blended: Virtual Collaboration + Visiting Faculty Mobility / Colloquium</option>
              <option value="parallel-studios" ${curVisit === 'parallel-studios' ? 'selected' : ''}>Dual-Campus Synchronized Labs / Parallel Studios</option>
              <option value="async-distributed" ${curVisit === 'async-distributed' ? 'selected' : ''}>Asynchronous Distributed Teams (Optimized for large time-zone differences)</option>
              <option value="field-practicum" ${curVisit === 'field-practicum' ? 'selected' : ''}>Virtual Preparation + Joint On-Site Field Practicum / Community Action</option>
              <option value="custom" ${isCustomVisit ? 'selected' : ''}>Other / Custom Mobility Format (Specify below)...</option>
            </select>
            <div id="modal-custom-visit-box" style="${isCustomVisit ? '' : 'display: none;'} margin-top: var(--space-2);">
              <input id="modal-custom-visit" name="customVisitFormat" placeholder="Describe your mobility/delivery format" value="${isCustomVisit ? esc(p.customVisitFormat || curVisit) : ''}">
            </div>
            <p class="hint">Includes travel safety, orientation, and hybrid contingencies for students participating remotely.</p>
          </div>
        </form>
      `,
      actions: [
        { label: 'Cancel', value: null },
        { label: 'Apply & AI Re-Align Arc', value: 'apply', kind: 'primary' }
      ],
      onOpen(dlg) {
        const sel = dlg.querySelector('#custom-visit-format');
        const box = dlg.querySelector('#modal-custom-visit-box');
        if (sel && box) {
          sel.addEventListener('change', () => {
            box.style.display = sel.value === 'custom' ? 'block' : 'none';
          });
        }
      }
    }).then(res => {
      if (res?.value !== 'apply') return;
      const f = document.getElementById('format-custom-form');
      if (!f) return;
      const fd = new FormData(f);
      const dWeeks = parseInt(fd.get('durationWeeks'), 10) || 5;
      const vFormat = fd.get('visitFormat') || 'virtual';
      const cVisit = (fd.get('customVisitFormat') || '').trim();
      const effectiveFormat = (vFormat === 'custom' && cVisit) ? 'custom' : vFormat;

      realignProjectArc(app.p, { durationWeeks: dWeeks, visitFormat: effectiveFormat, customVisitFormat: cVisit });
      if (app.p.isAutopilotCompleted) {
        runAutopilot(app.p);
      }
      S.saveProject(app.p);
      app.render();
      toast(`Collaboration format updated to ${dWeeks} weeks (${getMobilityLabel(effectiveFormat, cVisit)})!`, 'ok');
    });
  },
  'ai-resync-format'() {
    const p = app.p;
    if (!p) return;
    realignProjectArc(p, { durationWeeks: p.durationWeeks, visitFormat: p.visitFormat });
    if (p.isAutopilotCompleted) {
      runAutopilot(p);
    }
    S.saveProject(p);
    app.render();
    toast('AI successfully re-aligned schedule, activities, and charter!', 'ok');
  }
});

export function realignProjectArc(p, custom = {}) {
  if (custom.durationWeeks) p.durationWeeks = parseInt(custom.durationWeeks, 10);
  if (custom.visitFormat) p.visitFormat = custom.visitFormat;
  p.mode = p.durationWeeks >= 10 ? 'course' : 'module';

  const nowD = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmtYmd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

  const termDays = p.durationWeeks * 7 + 21;
  const termStartD = addDays(nowD, -7);
  const termEndD = addDays(termStartD, termDays);

  p.partners.forEach(ptn => {
    if (ptn.course) {
      ptn.course.termStart = fmtYmd(termStartD);
      ptn.course.termEnd = fmtYmd(termEndD);
    }
  });

  if (custom.customVisitFormat !== undefined) p.customVisitFormat = custom.customVisitFormat;
  const partner2 = p.partners[1] || p.partners[0];
  p.charter.mobility = getMobilityDescription(p.visitFormat, partner2.institution, partner2.country, p.customVisitFormat);

  // Respace activities across durationWeeks
  const acts = p.activities;
  const n = acts.length;
  if (n > 0) {
    const daysPerAct = Math.max(5, Math.floor((p.durationWeeks * 7) / n));
    acts.forEach((a, i) => {
      const s = addDays(nowD, i * daysPerAct + 2);
      const e = addDays(s, daysPerAct - 1);
      a.start = fmtYmd(s);
      a.end = fmtYmd(e);
      if (p.visitFormat === 'student-visit' && i === Math.floor(n / 2)) {
        a.title = `In-Person Immersion & Field Lab at ${partner2.institution}`;
        a.sync = true;
        a.summary = `Reciprocal in-person cross-country immersion week hosted at ${partner2.institution} in ${partner2.country}.`;
      }
    });
  }

  p.updatedAt = S.now();
  S.saveProject(p);
  return p;
}

function buildProjectFromHeuristic(prompt, mode, user, options = {}) {
  const lower = prompt.toLowerCase();
  
  let matchedPersona = null;
  if (lower.includes('senegal') || lower.includes('dakar') || lower.includes('west africa')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'senegal');
  else if (lower.includes('brazil') || lower.includes('sao paulo') || lower.includes('latin america')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'brazil');
  else if (lower.includes('japan') || lower.includes('kyoto') || lower.includes('tokyo') || lower.includes('asia')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'japan');
  else if (lower.includes('italy') || lower.includes('bologna')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'italy');
  else if (lower.includes('uae') || lower.includes('emirates') || lower.includes('dubai') || lower.includes('middle east')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'uae');
  else if (lower.includes('india') || lower.includes('delhi')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'india');
  else if (lower.includes('colombia') || lower.includes('andes') || lower.includes('bogota')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'colombia');
  else if (lower.includes('sweden') || lower.includes('lund') || lower.includes('nordic') || lower.includes('europe')) matchedPersona = AI_PARTNER_PERSONAS.find(p => p.key === 'sweden');

  let matchedTopic = null;
  if (lower.includes('health') || lower.includes('epidemic') || lower.includes('vaccine') || lower.includes('medical')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'health');
  else if (lower.includes('ethic') || lower.includes('ai') || lower.includes('algorithm') || lower.includes('robot')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'ethics');
  else if (lower.includes('city') || lower.includes('transit') || lower.includes('urban') || lower.includes('mobility')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'cities');
  else if (lower.includes('water') || lower.includes('river') || lower.includes('basin') || lower.includes('watershed')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'water');
  else if (lower.includes('supply') || lower.includes('trade') || lower.includes('waste') || lower.includes('circular') || lower.includes('logistics')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'supplychain');
  else if (lower.includes('media') || lower.includes('news') || lower.includes('misinformation') || lower.includes('journalism') || lower.includes('disinformation')) matchedTopic = TOPIC_PRESETS.find(t => t.key === 'media');

  const homeInst = options.homeUniversity || user.userInst || 'Home University';
  const partnerInst = options.partnerUniversity || (matchedPersona ? matchedPersona.institution : 'Partner University');
  const term = options.term || 'Evergreen / Multi-Term';

  const demoOptions = {
    mode,
    durationWeeks: options.durationWeeks,
    visitFormat: options.visitFormat,
    customVisitFormat: options.customVisitFormat,
    term,
    homeUniversity: homeInst,
    partnerUniversity: partnerInst,
    universities: options.universities,
    partnerName: options.partnerName,
    workingLanguage: options.workingLanguage,
    topicKey: matchedTopic ? matchedTopic.key : 'custom',
    customTopic: matchedTopic ? undefined : (prompt.length > 50 ? prompt.slice(0, 50).trim() : prompt.trim()),
    personaKey: matchedPersona ? matchedPersona.key : 'random',
    userProfile: {
      name: user.userName || 'Professor You',
      email: user.email || '',
      institution: homeInst,
      country: user.userCountry || 'United States'
    }
  };

  return createAiPartnerDemo(demoOptions);
}

function buildProjectFromAiJson(parsed, mode, user, options = {}) {
  const p = S.blankProject(parsed.title || 'International Course Collaboration');
  p.mode = mode;
  p.durationWeeks = options.durationWeeks || (mode === 'course' ? 14 : 5);
  p.visitFormat = options.visitFormat || 'virtual';
  p.customVisitFormat = options.customVisitFormat || '';
  p.isAiSimulation = true;
  p.isAutopilotCompleted = true;

  const homeInst = options.homeUniversity || user.userInst || 'Home University';
  const aiP = parsed.partner || {};
  const partnerInst = options.partnerUniversity || aiP.institution || 'Partner University';
  const termInfo = getTermDates(options.term || 'Evergreen / Multi-Term', p.durationWeeks);
  const termStartStr = termInfo.startStr;
  const termEndStr = termInfo.endStr;
  p.term = termInfo.term;

  const nowD = new Date();
  const pad = n => String(n).padStart(2, '0');
  const fmtYmd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const ago = h => new Date(Date.now() - h * 3600000).toISOString();

  const rawUniversities = (options.universities && options.universities.length >= 2)
    ? options.universities
    : [
        { index: 1, institution: homeInst, country: user.userCountry || 'United States', professor: user.userName || 'Professor You' },
        { index: 2, institution: partnerInst, country: aiP.country || 'International', professor: options.partnerName || aiP.name || 'Dr. International Colleague' }
      ];

  const leadUni = rawUniversities[0];
  const homePartner = S.blankPartner({
    id: 'ptn_home',
    name: leadUni.professor || user.userName || 'Professor You',
    email: user.email || 'professor@example.edu',
    institution: leadUni.institution || homeInst,
    country: leadUni.country || user.userCountry || 'United States',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    language: options.workingLanguage || 'English',
    role: 'representative',
    status: 'active',
    contributes: 'Home course evidence and student cohort inquiry.',
    course: {
      title: parsed.homeCourse?.title || 'Studies in Collaborative Inquiry',
      code: parsed.homeCourse?.code || 'INT 350',
      level: 'Upper-division undergraduate',
      discipline: parsed.homeCourse?.discipline || 'Interdisciplinary Studies',
      studentsCount: 25,
      purpose: parsed.challenge || 'Collaborative international inquiry',
      priorities: 'Methodological rigor, cross-cultural synthesis',
      interculturalAims: 'Broaden perspective through reciprocal dialogue',
      languages: options.workingLanguage || 'English',
      termStart: termStartStr,
      termEnd: termEndStr,
      workloadHoursPerWeek: 3.5,
      tech: 'Canvas, Zoom, Google Docs',
      techRestrictions: 'Standard campus access',
      assessmentObligations: 'Individual written portfolio component (25%)',
      breaks: [],
      localOutcomes: [
        { id: 'lo_h1', text: 'Analyze comparative evidence across international contexts.' },
        { id: 'lo_h2', text: 'Communicate findings persuasively to diverse audiences.' }
      ]
    }
  }, 0);

  const partnerObjects = rawUniversities.slice(1).map((u, idx) => {
    const pIdx = idx + 1;
    const partnerId = pIdx === 1 ? 'ptn_ai' : `ptn_ai_${pIdx + 1}`;
    const ptnPersona = Object.assign({}, AI_PARTNER_PERSONAS[idx % AI_PARTNER_PERSONAS.length]);
    return S.blankPartner({
      id: partnerId,
      name: u.professor || (idx === 0 ? (options.partnerName || aiP.name || ptnPersona.name) : ptnPersona.name),
      email: ptnPersona.email,
      institution: u.institution || (idx === 0 ? partnerInst : ptnPersona.institution),
      country: u.country || (idx === 0 ? (aiP.country || ptnPersona.country) : ptnPersona.country),
      city: ptnPersona.city,
      timezone: ptnPersona.timezone,
      language: ptnPersona.language || options.workingLanguage || 'English',
      role: 'representative',
      status: 'active',
      isAi: true,
      contributes: (idx === 0 && aiP.contributes) ? aiP.contributes : ptnPersona.contributes,
      course: {
        title: `${aiP.courseTitle || 'Comparative Seminar'} (Campus ${pIdx + 1})`,
        code: `${aiP.courseCode || 'GLO 300'}-${pIdx + 1}`,
        level: 'Undergraduate / Master seminar',
        discipline: aiP.discipline || 'Higher Education',
        studentsCount: 28,
        purpose: (idx === 0 && aiP.studentProfile) ? aiP.studentProfile : ptnPersona.studentProfile,
        priorities: 'Community-grounded analysis and cross-cultural synthesis',
        interculturalAims: 'Question universal assumptions and share local traditions',
        languages: ptnPersona.language || options.workingLanguage || 'English',
        termStart: termStartStr,
        termEnd: termEndStr,
        workloadHoursPerWeek: 3.5,
        tech: 'Campus LMS, Video conferencing',
        techRestrictions: 'Mobile-friendly formats preferred',
        assessmentObligations: 'Continuous evaluation and final deliverable',
        breaks: [],
        localOutcomes: [
          { id: `lo_${partnerId}_1`, text: 'Apply regional methodologies to analyze local data.' },
          { id: `lo_${partnerId}_2`, text: 'Collaborate respectfully in multinational teams.' }
        ]
      }
    }, pIdx);
  });

  const allPartners = [homePartner, ...partnerObjects];
  const allIds = allPartners.map(x => x.id);
  const both = allIds;
  const primaryPartner = partnerObjects[0];

  p.partners = allPartners;
  p.aiPartnerId = primaryPartner.id;

  p.brief = {
    id: 'brief',
    challenge: parsed.challenge || 'Shared international inquiry',
    question: parsed.question || 'How can our cohorts investigate this together?',
    whyInternational: parsed.whyInternational || 'Each cohort possesses situated knowledge the other cannot access.',
    counterfactual: parsed.counterfactual || 'Without collaboration, students evaluate only their domestic lens.',
    status: 'approved',
    approvedAt: S.now(),
    updatedAt: S.now()
  };

  const mobilityClause = getMobilityDescription(p.visitFormat, partnerInst, aiP.country || 'International', options.customVisitFormat);
  const instNames = allPartners.map(x => x.institution).join(', ');

  p.charter = {
    purpose: `To co-design an authentic ${mode === 'course' ? 'course collaboration' : 'international learning module'} (${p.durationWeeks} weeks, ${getMobilityLabel(p.visitFormat, options.customVisitFormat)}) across ${instNames}, designed for flexible multi-term deployment.`,
    decisionRights: 'Substantive changes require multilateral consensus across participating faculty representatives. Local grading is sovereign.',
    responseDays: 3,
    languages: `Faculty coordination in ${options.workingLanguage || 'English'}; student teams support bilingual collaboration.`,
    division: `${homePartner.name} coordinates synthesis templates; partner colleagues coordinate regional case dossiers.`,
    studentComms: 'Faculty advise their own cohort; joint announcements posted in shared workspace.',
    attribution: 'Shared materials licensed under CC BY-NC with mutual credit.',
    disagreements: 'Articulate asynchronously; meet live if unresolved after 5 days.',
    withdrawal: 'Two weeks advance notice with student grading protection.',
    cohortLoss: 'Pre-recorded briefings and archived case studies preserve credit if disruption occurs.',
    mobility: mobilityClause,
    status: 'approved',
    approvedAt: S.now(),
    updatedAt: S.now()
  };

  const oIds = ['out_1', 'out_2', 'out_3'];
  p.outcomes = (parsed.outcomes || []).map((o, i) => ({
    id: oIds[i] || `out_${i + 1}`,
    text: o.text,
    type: o.type || (i === 1 ? 'intercultural' : 'disciplinary'),
    evidence: o.evidence || 'Joint project dossier',
    mappings: Object.fromEntries(allPartners.map((ptn, idx) => [
      ptn.id,
      idx === 0 ? ['lo_h1'] : [`lo_${ptn.id}_1`]
    ])),
    status: 'approved',
    approvedAt: S.now(),
    updatedAt: S.now()
  }));

  if (!p.outcomes.length) {
    p.outcomes = [
      { id: 'out_1', text: 'Analyze and contrast regional evidence from both contexts.', type: 'disciplinary', evidence: 'Joint dossier', mappings: Object.fromEntries(allPartners.map((ptn, idx) => [ptn.id, idx === 0 ? ['lo_h1'] : [`lo_${ptn.id}_1`]])), status: 'approved' },
      { id: 'out_2', text: 'Collaborate effectively across different institutional frameworks.', type: 'intercultural', evidence: 'Process reflection', mappings: Object.fromEntries(allPartners.map((ptn, idx) => [ptn.id, idx === 0 ? ['lo_h2'] : [`lo_${ptn.id}_2`]])), status: 'approved' }
    ];
  }

  p.activities = (parsed.activities || []).map((a, i) => {
    const startD = addDays(nowD, i * 10 + 3);
    const endD = addDays(startD, a.durationDays || 8);
    const actId = `act_${i + 1}`;
    const contributions = { ptn_home: a.homeContribution || 'Home student cohort contribution.' };
    partnerObjects.forEach(ptn => {
      contributions[ptn.id] = a.partnerContribution || `${ptn.institution} cohort contribution.`;
    });
    return {
      id: actId,
      title: a.title,
      stage: a.stage || (i === 0 ? 'trust' : i === 1 ? 'local' : i === 2 ? 'compare' : 'cocreate'),
      summary: a.summary || '',
      instructions: a.instructions || activityStudentInstructions(p, { stage: a.stage }),
      sync: Boolean(a.sync),
      start: fmtYmd(startD),
      end: fmtYmd(endD),
      participants: both,
      contributions,
      workload: Object.fromEntries(allPartners.map(x => [x.id, 3.5])),
      owner: i % 2 === 0 ? primaryPartner.id : 'ptn_home',
      dependsOn: i > 0 ? [`act_${i}`] : [],
      outcomes: [p.outcomes[0]?.id || 'out_1'],
      tools: 'Google Drive, Padlet, Jitsi/Zoom',
      contingency: a.contingency || 'Asynchronous video briefs and shared discussion board.',
      accessibility: 'Captioned media and mobile-friendly templates.',
      status: 'approved',
      approvedAt: S.now(),
      updatedAt: S.now()
    };
  });

  if (!p.activities.length) {
    p.activities = [
      { id: 'act_1', title: 'Team Introductions & Communication Compact', stage: 'trust', sync: true, start: fmtYmd(addDays(nowD, 3)), end: fmtYmd(addDays(nowD, 10)), participants: both, workload: Object.fromEntries(allPartners.map(x => [x.id, 3.5])), owner: primaryPartner.id, summary: 'Student introductions and team charter.', instructions: activityStudentInstructions(p, { stage: 'trust' }), contingency: 'Asynchronous video exchange.', status: 'approved' },
      { id: 'act_2', title: 'Local Case Dossier', stage: 'local', sync: false, start: fmtYmd(addDays(nowD, 12)), end: fmtYmd(addDays(nowD, 24)), participants: both, workload: Object.fromEntries(allPartners.map(x => [x.id, 3.5])), owner: 'ptn_home', summary: 'Regional field dossier.', instructions: activityStudentInstructions(p, { stage: 'local' }), contingency: 'Pre-recorded briefing.', status: 'approved' },
      { id: 'act_3', title: 'Reciprocal Comparative Critique', stage: 'compare', sync: false, start: fmtYmd(addDays(nowD, 26)), end: fmtYmd(addDays(nowD, 38)), participants: both, workload: Object.fromEntries(allPartners.map(x => [x.id, 3.5])), owner: primaryPartner.id, summary: 'Reciprocal analysis.', instructions: activityStudentInstructions(p, { stage: 'compare' }), contingency: 'Annotated document exchange.', status: 'approved' },
      { id: 'act_4', title: 'Joint Synthesis & Recommendation', stage: 'cocreate', sync: false, start: fmtYmd(addDays(nowD, 40)), end: fmtYmd(addDays(nowD, 54)), participants: both, workload: Object.fromEntries(allPartners.map(x => [x.id, 3.5])), owner: 'ptn_home', summary: 'Collaborative final deliverable.', instructions: activityStudentInstructions(p, { stage: 'cocreate' }), contingency: 'Asynchronous submission.', status: 'approved' }
    ];
  }

  p.assessments = [
    {
      id: 'asm_1',
      title: 'Collaborative Synthesis Deliverable',
      layer: 'product',
      outcomes: p.outcomes.map(o => o.id),
      due: fmtYmd(addDays(nowD, mode === 'course' ? 65 : 45)),
      criteria: (parsed.rubricCriteria || []).map((c, ci) => ({
        id: `cr_${ci + 1}`,
        name: c.name,
        description: c.description || '',
        levels: {
          exemplary: c.exemplary || 'Exceptional synthesis and integration.',
          proficient: c.proficient || 'Proficient and accurate integration.',
          developing: c.developing || 'Developing with some gaps.',
          beginning: c.beginning || 'Incomplete.'
        }
      })),
      local: Object.fromEntries(allPartners.map(x => [x.id, { weight: 25, notes: 'Counted towards course grade.' }])),
      status: 'approved',
      approvedAt: S.now(),
      updatedAt: S.now()
    }
  ];

  p.differences = [
    { id: 'dif_1', topic: 'Academic Calendar Overlap', detail: 'Harmonized term dates and exam schedules.', kind: 'hard', status: 'resolved', resolution: 'Aligned within shared teaching window.' },
    { id: 'dif_2', topic: 'Digital Communication Platform', detail: 'Mobile-first access vs institutional LMS.', kind: 'negotiable', status: 'resolved', resolution: 'Lightweight web tools and async messaging.' },
    { id: 'dif_3', topic: 'Grading Frameworks', detail: 'Numerical scale vs letter grades.', kind: 'negotiable', status: 'resolved', resolution: 'Shared rubric criteria with sovereign local grade weights.' }
  ];

  p.decisions = [
    {
      id: 'dec_1',
      title: 'Approve Design Brief & Driving Question',
      description: `Formal agreement on the joint challenge: "${p.brief.challenge}".`,
      type: 'shared',
      affected: both,
      approvals: Object.fromEntries(allPartners.map(ptn => [
        ptn.id,
        { status: 'approve', note: 'Approved under multilateral consortium consensus.', at: S.now() }
      ])),
      linked: { kind: 'brief', id: 'brief' }
    },
    {
      id: 'dec_2',
      title: 'Approve Collaborative Learning Arc & Rubric',
      description: 'Formal agreement on the weekly activity sequence and assessment criteria.',
      type: 'shared',
      affected: both,
      approvals: Object.fromEntries(allPartners.map(ptn => [
        ptn.id,
        { status: 'approve', note: 'Approved under multilateral consortium consensus.', at: S.now() }
      ])),
      linked: null
    }
  ];

  p.meetings = [
    {
      id: 'mtg_1',
      title: `Co-Design Session: ${homePartner.name} & ${aiPartner.name}`,
      start: addDays(nowD, 5).toISOString(),
      duration: 50,
      link: 'https://meet.jit.si/Crosscourse-co-design',
      agenda: '1. Welcome & syllabus review\n2. Schedule & time zone coordination\n3. Student onboarding plan',
      notes: '',
      attendees: both
    }
  ];

  p.glossary = [
    { id: 'gls_1', term: 'Situated Inquiry', definitions: { English: 'Grounding analytical claims in local community data and lived reality.' }, note: 'Critical across both cohorts.' },
    { id: 'gls_2', term: 'Reciprocal Critique', definitions: { English: 'Constructive peer evaluation balancing multiple geopolitical perspectives.' }, note: 'Core to the collaborative learning arc.' }
  ];

  p.events = [
    { id: 'ev_1', at: ago(3), by: aiPartner.id, type: 'change', summary: `Co-developed course via AI prompt: "${p.title}"` },
    { id: 'ev_2', at: ago(2), by: homePartner.id, type: 'change', summary: 'Aligned academic calendar and shared outcomes' },
    { id: 'ev_3', at: ago(1), by: aiPartner.id, type: 'change', summary: 'Approved all decisions and generated final release' }
  ];

  return p;
}

export function parsePromptCustomizations(promptText, defaultOptions = {}) {
  const text = String(promptText || '').trim();
  const lower = text.toLowerCase();

  let homeUniversity = defaultOptions.homeUniversity || defaultOptions.university1 || null;
  let partnerUniversity = defaultOptions.partnerUniversity || defaultOptions.partnerInst || defaultOptions.university2 || null;

  if (!partnerUniversity) {
    const betweenMatch = text.match(/between\s+([A-Za-z0-9\s.,'&-]+?)\s+and\s+([A-Za-z0-9\s.,'&-]+?)(?:[,.]|$|\s+in|\s+for|\s+focusing)/i);
    if (betweenMatch) {
      if (!homeUniversity) homeUniversity = betweenMatch[1].trim();
      partnerUniversity = betweenMatch[2].trim();
    } else {
      const partnerWithMatch = text.match(/(?:partnering with|partnered with|with partner|collaborating with|partner institution:?)\s+([A-Za-z0-9\s.,'&-]+?)(?:[,.]|$|\s+in\s+[A-Z]|\s+for|\s+focusing)/i);
      if (partnerWithMatch) {
        partnerUniversity = partnerWithMatch[1].trim();
      }
    }
  }

  let term = defaultOptions.term || null;
  if (!term) {
    const termMatch = text.match(/(Fall|Spring|Summer|Winter)\s*(20\d\d)?/i);
    if (termMatch) {
      term = `${termMatch[1].charAt(0).toUpperCase() + termMatch[1].slice(1).toLowerCase()} ${termMatch[2] || '2026'}`;
    } else {
      term = 'Fall 2026';
    }
  }

  let durationWeeks = defaultOptions.durationWeeks ? parseInt(defaultOptions.durationWeeks, 10) : null;
  let customWeeks = defaultOptions.customWeeks ? parseInt(defaultOptions.customWeeks, 10) : null;
  if (!durationWeeks && customWeeks) {
    durationWeeks = customWeeks;
  }
  let visitFormat = defaultOptions.visitFormat || null;
  let mode = defaultOptions.mode || null;

  // Natural language parsing of duration
  if (!durationWeeks) {
    const weekMatch = text.match(/(\d+)\s*[- ]\s*week/i);
    if (weekMatch) {
      durationWeeks = parseInt(weekMatch[1], 10);
    } else if (lower.includes('accelerated') || lower.includes('intensive') || lower.includes('bootcamp')) {
      durationWeeks = 5;
    } else if (lower.includes('semester') || lower.includes('full term') || lower.includes('whole semester') || lower.includes('14 week') || lower.includes('15 week') || lower.includes('16 week')) {
      durationWeeks = 14;
    }
  }

  if (!mode) {
    if (durationWeeks && durationWeeks >= 10) mode = 'course';
    else if (lower.includes('whole course') || lower.includes('new course') || lower.includes('full course') || lower.includes('full semester')) mode = 'course';
    else mode = 'module';
  }

  if (!durationWeeks) {
    durationWeeks = mode === 'course' ? 14 : 5;
  }

  // Natural language parsing of in-person visit/travel
  if (!visitFormat || visitFormat === 'virtual') {
    if (lower.includes('faculty visit') || lower.includes('professor visit') || lower.includes('faculty exchange') || lower.includes('guest lecture visit')) {
      visitFormat = 'faculty-visit';
    } else if (lower.includes('in-person') || lower.includes('in person') || lower.includes('travel') || lower.includes('field study') || lower.includes('field trip') || lower.includes('study abroad') || lower.includes('immersion') || lower.includes('on campus') || lower.includes('on-site')) {
      visitFormat = 'student-visit';
    } else {
      visitFormat = defaultOptions.visitFormat || 'virtual';
    }
  }

  return { homeUniversity, partnerUniversity, term, durationWeeks, visitFormat, mode };
}

export async function generateCourseFromPrompt(promptText, options = {}) {
  const prompt = String(promptText || '').trim();
  const custom = parsePromptCustomizations(prompt, options);
  const mode = custom.mode;
  const durationWeeks = custom.durationWeeks;
  const visitFormat = custom.visitFormat;
  const homeUniversity = custom.homeUniversity || options.homeUniversity || options.userProfile?.institution || 'Alcorn State University';
  const partnerUniversity = custom.partnerUniversity || options.partnerUniversity || 'Partner University';
  const term = custom.term || options.term || 'Fall 2026';

  const user = options.userProfile || {};
  const userName = user.name || 'Professor You';
  const userInst = homeUniversity;
  const userCountry = user.country || 'United States';

  let project = null;

  if (aiEnabled()) {
    try {
      const systemPrompt = `You are Crosscourse AI Co-Design Generator.
Your task is to co-develop an authentic, rigorous international collaborative course or module based on the professor's natural language request.
Output JSON ONLY matching this schema:
{
  "title": "Course or module title",
  "challenge": "Core shared societal or scientific challenge",
  "question": "Driving inquiry question for students",
  "whyInternational": "Why reciprocal international collaboration across these cohorts is necessary",
  "counterfactual": "What students miss if taught only domestically",
  "partner": {
    "name": "Dr. Full Name",
    "institution": "${partnerUniversity}",
    "country": "Country Name",
    "city": "City Name",
    "timezone": "Valid IANA timezone e.g. Europe/Stockholm, Asia/Tokyo, Africa/Dakar, or America/Sao_Paulo",
    "language": "Working language e.g. Portuguese, French, Japanese, Spanish, Italian, or English",
    "courseTitle": "Course title at partner institution",
    "courseCode": "Course code e.g. GHP 402",
    "discipline": "Discipline e.g. Environmental Policy",
    "studentProfile": "Cohort background and skills",
    "contributes": "What situated evidence and methods this cohort contributes"
  },
  "homeCourse": {
    "title": "Home course title",
    "code": "Course code e.g. INT 350",
    "discipline": "Discipline"
  },
  "outcomes": [
    { "text": "Disciplinary outcome 1...", "type": "disciplinary", "evidence": "Evidence deliverable..." },
    { "text": "Intercultural outcome 2...", "type": "intercultural", "evidence": "Evidence deliverable..." },
    { "text": "Comparative synthesis outcome 3...", "type": "disciplinary", "evidence": "Evidence deliverable..." }
  ],
  "activities": [
    {
      "title": "Activity Title",
      "stage": "trust",
      "sync": true,
      "durationDays": 7,
      "summary": "Brief summary",
      "instructions": "Detailed student-facing instructions",
      "homeContribution": "Home cohort contribution",
      "partnerContribution": "Partner cohort contribution",
      "contingency": "Asynchronous fallback plan"
    }
  ],
  "rubricCriteria": [
    {
      "name": "Criterion Name",
      "description": "Criterion description",
      "exemplary": "Exemplary description",
      "proficient": "Proficient description",
      "developing": "Developing description",
      "beginning": "Beginning description"
    }
  ]
}`;

      const userMsg = `Co-develop a complete international course collaboration based on this prompt:
"${prompt}"
Partner Institutions:
- University 1 (Home Institution): ${homeUniversity} (${userCountry})
- University 2 (Partner Institution): ${partnerUniversity}
Deployment: Evergreen / reusable across academic terms and years
Scope: ${mode === 'course' ? 'Whole New Course (designed jointly from scratch)' : 'Shared Course Segment / Module (embedded in existing courses)'}
Duration: ${durationWeeks} weeks
Mobility & Format: ${getMobilityDescription(visitFormat, partnerUniversity, 'International', options.customVisitFormat)}
Home Professor: ${userName} at ${homeUniversity} (${userCountry})${options.partnerName ? `\nPartner Colleague: ${options.partnerName}` : ''}${options.workingLanguage ? `\nPreferred Working Language: ${options.workingLanguage}` : ''}`;

      const responseText = await callProvider(systemPrompt, userMsg);
      const parsed = parseJSON(responseText);

      if (parsed && parsed.title && parsed.partner) {
        project = buildProjectFromAiJson(parsed, mode, { userName, email: options.userProfile?.email, userInst: homeUniversity, userCountry }, { durationWeeks, visitFormat, customVisitFormat: options.customVisitFormat, term, homeUniversity, partnerUniversity, universities: options.universities, partnerName: options.partnerName, workingLanguage: options.workingLanguage });
      }
    } catch (err) {
      console.warn('Live AI generation failed or returned invalid format, falling back to heuristic engine:', err);
    }
  }

  if (!project) {
    project = buildProjectFromHeuristic(prompt, mode, { userName, email: options.userProfile?.email, userInst: homeUniversity, userCountry }, { durationWeeks, visitFormat, customVisitFormat: options.customVisitFormat, term, homeUniversity, partnerUniversity, universities: options.universities, partnerName: options.partnerName, workingLanguage: options.workingLanguage });
  }

  project.durationWeeks = durationWeeks;
  project.visitFormat = visitFormat;
  project.customVisitFormat = options.customVisitFormat || '';
  project.term = term;
  runAutopilot(project);
  return project;
}


