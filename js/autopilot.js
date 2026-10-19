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
 * Stage descriptions, verbs, and pedagogical objectives for course documents.
 */
const DOSSIER_STAGE_INFO = {
  trust: {
    label: 'Establish Trust and Working Norms',
    verb: 'Establish and synthesize',
    objective: 'Establish cross-cultural communication agreements, align baseline collaboration expectations, and build team psychological safety across participating campuses.',
    focus: 'Team charters, introductory video memos, timezone reconciliation, and intercultural baseline interviews.'
  },
  local: {
    label: 'Investigate Locally',
    verb: 'Investigate and document',
    objective: 'Investigate, collect, and critically document situated empirical case evidence and localized regional data within the home institution\'s community.',
    focus: 'Primary local field observations, policy archives, community datasets, and institutional case studies.'
  },
  compare: {
    label: 'Compare and Identify Divergences',
    verb: 'Contrast and analyze',
    objective: 'Contrast regional case studies with international partner data, identifying structural similarities, key institutional divergences, and unexamined cultural assumptions.',
    focus: 'Cross-border comparative matrices, dialectical analysis of local vs. global factors, and assumption testing.'
  },
  critique: {
    label: 'Constructive Peer Critique',
    verb: 'Evaluate and challenge',
    objective: 'Critically evaluate international peer hypotheses through respectful academic critique, and iteratively refine own frameworks based on partner feedback.',
    focus: 'Structured peer reviews, alternative hypothesis testing, and evidentiary defense.'
  },
  cocreate: {
    label: 'Collaborative Co-Creation',
    verb: 'Co-design and synthesize',
    objective: 'Co-produce a unified, classroom-ready disciplinary artifact that integrates multi-campus evidence and could not have been produced by a single institution alone.',
    focus: 'Joint white papers, integrated policy briefs, comparative prototype designs, and shared digital repositories.'
  },
  reflect: {
    label: 'Intercultural and Disciplinary Reflection',
    verb: 'Reflect and articulate',
    objective: 'Critically reflect on cross-cultural collaboration dynamics, articulating personal epistemological growth, intercultural competence gains, and ongoing global challenges.',
    focus: 'Individual reflective essays, metacognitive learning logs, and consortium portfolio evaluations.'
  }
};

/**
 * Builds the Comprehensive Master Course Handbook & Syllabus HTML document.
 * Formatted for publication-grade printing or direct "Save as PDF" via the browser print dialog.
 * Serves as a full, standalone, non-LMS alternative containing all course content, learning outcomes,
 * policies, weekly curriculum arc, SpeedGrader rubrics, and a detachable Confidential Instructor Appendix.
 */
export function buildCourseDossierHTML(p, opts = {}) {
  const ps = active(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  const ov = T.termOverlap(ps);
  const outIdx = id => p.outcomes.findIndex(o => o.id === id) + 1;
  const rel = p.releases[0] || { label: 'R1-RELEASE', at: S.now() };
  const initialMode = opts.mode || (opts.studentOnly ? 'student' : (opts.instructorOnly ? 'instructor' : 'full'));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(p.title)}: Master Course Handbook and Syllabus</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    :root {
      --ink: #0f172a;
      --ink-secondary: #334155;
      --ink-muted: #64748b;
      --brand: #0f5c65;
      --brand-dark: #083338;
      --brand-light: #f0fdfa;
      --accent: #1e40af;
      --border: #cbd5e1;
      --border-subtle: #e2e8f0;
      --surface: #f8fafc;
      --surface-warm: #fcfbf9;
      --warning: #b45309;
      --warning-light: #fffbeb;
      --success: #15803d;
      --success-light: #f0fdf4;
    }

    *, *::before, *::after { box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.65;
      color: var(--ink);
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 20px 80px;
      -webkit-font-smoothing: antialiased;
    }

    /* Interactive Non-Print Control Toolbar */
    .no-print.control-toolbar {
      position: sticky;
      top: 0;
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 18px;
      margin-bottom: 28px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      z-index: 1000;
    }
    .toolbar-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .toolbar-left strong {
      font-size: 0.95rem;
      color: var(--brand);
    }
    .toolbar-left span {
      font-size: 0.8rem;
      color: var(--ink-muted);
    }
    .toolbar-center {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: var(--surface);
      padding: 4px;
      border-radius: 6px;
      border: 1px solid var(--border-subtle);
    }
    .view-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 4px;
      color: var(--ink-secondary);
      user-select: none;
    }
    .view-pill:hover {
      background: rgba(15, 92, 101, 0.08);
    }
    .view-pill input {
      margin: 0;
      cursor: pointer;
    }
    .toolbar-right {
      display: flex;
      gap: 8px;
    }
    .btn-action {
      background: var(--brand);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
    }
    .btn-action:hover { background: var(--brand-dark); }
    .btn-action.secondary {
      background: var(--surface);
      color: var(--ink);
      border: 1px solid var(--border);
    }
    .btn-action.secondary:hover { background: var(--border-subtle); }

    /* View Filtering Modes */
    body.view-student .instructor-only { display: none !important; }
    body.view-instructor .student-handbook { display: none !important; }

    /* Academic Publication Header */
    .doc-header {
      border-bottom: 3px solid var(--brand);
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .doc-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .doc-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border: 1px solid;
    }
    .doc-badge.primary { background: var(--brand-light); color: var(--brand); border-color: var(--brand); }
    .doc-badge.secondary { background: var(--surface); color: var(--ink-secondary); border-color: var(--border); }
    .doc-badge.accent { background: #eff6ff; color: var(--accent); border-color: var(--accent); }

    h1.doc-title {
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--brand-dark);
      line-height: 1.22;
      margin: 0 0 10px;
    }
    .doc-subtitle {
      font-size: 1.1rem;
      color: var(--ink-secondary);
      margin: 0 0 14px;
      font-style: italic;
    }

    /* Headings */
    h2 {
      font-family: Georgia, Cambria, "Times New Roman", Times, serif;
      font-size: 1.35rem;
      color: var(--brand-dark);
      border-bottom: 1.5px solid var(--border);
      padding-bottom: 6px;
      margin-top: 36px;
      margin-bottom: 14px;
    }
    h3 {
      font-size: 1.08rem;
      font-weight: 700;
      color: var(--ink);
      margin-top: 22px;
      margin-bottom: 10px;
    }
    p, ul, ol {
      margin-top: 0;
      margin-bottom: 14px;
    }
    li { margin-bottom: 5px; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 0.92rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 9px 12px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--surface);
      font-weight: 700;
      color: var(--ink);
      font-size: 0.88rem;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Callout & Card Blocks */
    .callout {
      border-radius: 6px;
      padding: 16px 18px;
      margin: 18px 0;
      border-left: 4px solid var(--brand);
      background: var(--surface);
    }
    .callout.info {
      border-left-color: var(--accent);
      background: #f0f7ff;
    }
    .callout.warning {
      border-left-color: var(--warning);
      background: var(--warning-light);
    }
    .callout-title {
      font-weight: 700;
      font-size: 0.98rem;
      color: var(--ink);
      margin-bottom: 6px;
    }

    .activity-card {
      border: 1px solid var(--border);
      border-left: 4px solid var(--brand);
      border-radius: 6px;
      padding: 16px 18px;
      margin: 18px 0;
      background: #ffffff;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .activity-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 8px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 8px;
      margin-bottom: 10px;
    }
    .activity-title {
      font-size: 1.12rem;
      font-weight: 700;
      color: var(--brand-dark);
      margin: 0;
    }
    .activity-meta {
      font-size: 0.84rem;
      color: var(--ink-muted);
      font-weight: 600;
    }

    .step-box {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 10px 14px;
      margin: 8px 0;
      font-size: 0.92rem;
    }
    .step-title {
      font-weight: 700;
      color: var(--brand-dark);
      margin-bottom: 4px;
    }

    /* Verification Signatures Block */
    .signatures-block {
      margin-top: 36px;
      padding: 20px;
      border: 1.5px dashed var(--border);
      border-radius: 6px;
      background: var(--surface);
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 18px;
    }
    .sig-item {
      border-top: 1px solid #475569;
      padding-top: 8px;
      font-size: 0.88rem;
    }
    .sig-line {
      margin-top: 18px;
      color: var(--ink-muted);
      font-size: 0.84rem;
    }

    /* Appendix Banner */
    .appendix-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 24px;
      border-radius: 6px;
      margin: 40px 0 24px;
      border-left: 6px solid var(--warning);
    }
    .appendix-banner h2 {
      color: #ffffff;
      border-bottom: 1px solid rgba(255,255,255,0.25);
      margin-top: 0;
      padding-bottom: 8px;
    }
    .appendix-note {
      font-size: 0.9rem;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.5;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    /* Print Stylesheet */
    @media print {
      .no-print { display: none !important; }
      body {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        font-size: 10pt !important;
        line-height: 1.45 !important;
        color: #000000 !important;
        background: #ffffff !important;
      }
      h1.doc-title { font-size: 18pt !important; color: #000000 !important; }
      h2 { font-size: 13pt !important; color: #000000 !important; border-bottom: 1px solid #000 !important; }
      h3 { font-size: 11pt !important; color: #000000 !important; }
      table { font-size: 9pt !important; }
      th { background: #f0f0f0 !important; color: #000 !important; }
      th, td { border: 1px solid #777 !important; padding: 6px 8px !important; }
      .doc-badge { border: 1px solid #444 !important; color: #000 !important; background: none !important; }
      .activity-card { border: 1px solid #666 !important; border-left: 3px solid #000 !important; margin: 12px 0 !important; padding: 10px !important; }
      .callout { border-left-color: #000 !important; background: none !important; border: 1px solid #777 !important; }
      .appendix-banner { background: none !important; color: #000 !important; border: 2px solid #000 !important; border-left: 6px solid #000 !important; }
      .appendix-banner h2 { color: #000 !important; border-bottom: 1px solid #000 !important; }
      .appendix-note { color: #333 !important; }
      .keep-together, .activity-card, .signatures-block, table, tr { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body class="view-${initialMode}">

  <!-- Interactive Control Toolbar (Hidden During Printing) -->
  <div class="no-print control-toolbar">
    <div class="toolbar-left">
      <strong>Master Course Handbook and Syllabus</strong>
      <span>Official Multi-Campus Curriculum Package (Print / PDF Alternative)</span>
    </div>

    <div class="toolbar-center">
      <label class="view-pill">
        <input type="radio" name="dossier-mode" value="full" ${initialMode === 'full' ? 'checked' : ''} onchange="setDossierView('full')">
        Complete Master Document (Includes Appendix)
      </label>
      <label class="view-pill">
        <input type="radio" name="dossier-mode" value="student" ${initialMode === 'student' ? 'checked' : ''} onchange="setDossierView('student')">
        Student Handbook (Classroom Clean)
      </label>
      <label class="view-pill">
        <input type="radio" name="dossier-mode" value="instructor" ${initialMode === 'instructor' ? 'checked' : ''} onchange="setDossierView('instructor')">
        Instructor Dossier (Faculty Only)
      </label>
    </div>

    <div class="toolbar-right">
      <button type="button" class="btn-action" onclick="window.print()">
        Print or Save as PDF
      </button>
      <button type="button" class="btn-action secondary" onclick="downloadCurrentHTML()">
        Download HTML
      </button>
    </div>
  </div>

  <!-- Document Header / Official Title Block -->
  <header class="doc-header">
    <div class="doc-badge-row">
      <span class="doc-badge primary">${esc(rel.label)} Approved Release</span>
      <span class="doc-badge secondary">${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks (${p.durationWeeks <= 7 ? 'Accelerated Intensive' : 'Full Academic Semester'})</span>
      <span class="doc-badge accent">${esc(p.visitFormat === 'student-visit' ? 'Blended with Student Field Immersion' : (p.visitFormat === 'faculty-visit' ? 'Blended with Faculty Colloquium' : '100% Fully Virtual Exchange'))}</span>
    </div>

    <h1 class="doc-title">${esc(p.title)}</h1>
    <p class="doc-subtitle">
      ${p.mode === 'course' ? 'Co-Developed International Course' : 'Shared International Collaborative Module'} : Official Consortium Curriculum Package
    </p>

    <!-- Consortium Institutional Directory Table -->
    <table>
      <thead>
        <tr>
          <th>Participating Campus</th>
          <th>Designated Faculty Instructor</th>
          <th>Local Department / Course Code</th>
          <th>Time Zone</th>
          <th>Working Language</th>
        </tr>
      </thead>
      <tbody>
        ${ps.map((x, idx) => `
        <tr>
          <td>
            <strong>${esc(x.institution)}</strong><br>
            <small style="color:var(--ink-muted);">${esc(x.city ? `${x.city}, ${x.country}` : x.country)} (${idx === 0 ? 'Lead Campus' : 'Partner Campus ' + (idx + 1)})</small>
          </td>
          <td>
            <strong>${esc(x.name || 'Designated Instructor')}</strong><br>
            <small style="color:var(--ink-muted);">${esc(x.email || 'Via Campus Directory')}</small>
          </td>
          <td>${esc(x.course.title || 'Departmental Course')} ${esc(x.course.code || '')}<br><small style="color:var(--ink-muted);">${esc(x.course.level || 'Undergraduate')}</small></td>
          <td><code>${esc(x.timezone)}</code></td>
          <td>${esc(x.language || 'English')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </header>

  <!-- STUDENT HANDBOOK SECTION (INCLUDED IN FULL AND STUDENT VIEWS) -->
  <main class="student-handbook">

    <!-- Section 1: Framework and Driving Inquiry -->
    <section>
      <h2>1. Course Overview and Driving Inquiry</h2>
      <div class="callout">
        <div class="callout-title">Central Driving Investigation</div>
        <p style="margin: 0; font-size: 1.05rem; font-style: italic;">"${esc(p.brief.question || 'How do situated perspectives across partner institutions illuminate key challenges in this field?')}"</p>
      </div>

      <p><strong>Shared Disciplinary Challenge:</strong> ${esc(p.brief.challenge || p.title)}</p>
      <p><strong>Why International Cross-Border Collaboration is Essential:</strong> ${esc(p.brief.whyInternational || 'Each student cohort holds situated regional evidence, localized institutional frameworks, and cultural perspectives that neither cohort could access alone.')}</p>
      <p><strong>Pedagogical Value Rationale:</strong> ${esc(p.brief.counterfactual || 'If students investigated this challenge in isolation without international partners, findings would remain limited to single-nation assumptions without direct comparative testing.')}</p>
    </section>

    <!-- Section 2: Outcomes and Curriculum Alignment -->
    <section>
      <h2>2. Course Learning Outcomes and Academic Alignment Matrix</h2>
      <p>Upon successful completion of this international collaborative course, students from all participating universities will be able to:</p>
      <table>
        <thead>
          <tr>
            <th style="width: 12%;">Outcome #</th>
            <th style="width: 16%;">Domain</th>
            <th>Observable Learning Outcome (Bloom\'s Taxonomy)</th>
            <th style="width: 30%;">Observable Evidence Benchmark</th>
          </tr>
        </thead>
        <tbody>
          ${p.outcomes.map((o, idx) => `
          <tr>
            <td><strong>CLO O${idx + 1}</strong></td>
            <td><span class="doc-badge secondary">${esc(o.type || 'Disciplinary')}</span></td>
            <td>${esc(o.text)}</td>
            <td>${esc(o.evidence || 'Collaborative team deliverable and individual reflection')}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <h3>Curriculum Credit Mapping Across Participating Universities</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Course Learning Outcome</th>
            ${ps.map(x => `<th>${esc(x.institution)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${p.outcomes.map((o, idx) => `
          <tr>
            <td><strong>CLO O${idx + 1}:</strong> ${esc(o.text.slice(0, 60))}${o.text.length > 60 ? '...' : ''}</td>
            ${ps.map(x => `<td>${(o.mappings?.[x.id] || []).map(id => esc(x.course.localOutcomes.find(l => l.id === id)?.text || '')).join('<br>') || 'Direct Program Degree Credit'}</td>`).join('')}
          </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <!-- Section 3: Course Policies and Student Guidelines -->
    <section>
      <h2>3. Course Policies, Communication, and Academic Guidelines</h2>
      
      <h3>Academic Integrity in Cross-Border Collaborative Work</h3>
      <div class="callout">
        <p><strong>Originality and Peer Citation:</strong> All field observations, policy data, and interviews contributed by international student teammates must be formally acknowledged and cited. Presenting an international partner\'s local research notes as your own without explicit attribution constitutes a violation of consortium academic integrity standards.</p>
        <p style="margin:0;"><strong>Responsible Generative AI Policy:</strong> Generative AI tools may be used for grammatical revision, brainstorming, and translation clarification. However, all regional empirical claims, field observations, and institutional case analyses must represent genuine local research. Fabricating local evidence using artificial intelligence tools will result in assignment failure.</p>
      </div>

      <h3>Communication Expectations and Response Rhythms</h3>
      <ul>
        <li><strong>The 48-Hour Communication Response Standard:</strong> Team members must acknowledge all asynchronous messages from international colleagues within 48 hours, excluding official scheduled university breaks. A brief confirmation keeps collaborative projects moving forward across time zones.</li>
        <li><strong>Linguistic Inclusivity:</strong> Second-language readers and speakers provide essential regional expertise. All student work is evaluated on analytical reasoning, comparative evidence, and intellectual rigor rather than native English fluency. Idiomatic expressions and localized cultural slang should be avoided in collaborative documents.</li>
        <li><strong>Asynchronous-First Teamwork:</strong> Course milestones are organized so teammates have at least 24 to 48 hours to contribute before team deadlines. Students are not required to participate in live video sessions outside reasonable local waking hours.</li>
      </ul>

      <h3>Late Submissions and Formative Resubmission Opportunities</h3>
      <p>Submissions delayed due to cross-timezone scheduling conflicts receive a standard 24-hour grace window upon prompt notification to the instructor. Formative milestone tasks submitted in Weeks 1 through 3 that earn developing marks may be revised and resubmitted within five business days based on instructor feedback.</p>

      <h3>Digital Accessibility and Accommodations</h3>
      <p>This course adheres to Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Course materials are provided in multi-modal formats including accessible HTML, printable PDF, and editable markdown. Students requiring academic or technical accommodations should coordinate directly with their home campus accessibility office.</p>
    </section>

    <!-- Section 4: Dual-Layer Grading Architecture -->
    <section>
      <h2>4. Dual-Layer Grading Architecture and Sovereign Institutional Scales</h2>
      <div class="callout">
        <div class="callout-title">The Sovereign Grading Model</div>
        <p>This consortium decouples shared evaluation criteria from local institutional grade calculation:</p>
        <ul>
          <li><strong>50% Shared Collaborative Team Deliverables:</strong> Evaluated using unified consortium SpeedGrader rubrics assessing comparative rigor, empirical integration, and cross-border dialogue.</li>
          <li><strong>50% Individual Sovereign Reflection and Fieldwork:</strong> Evaluated and recorded directly by each student\'s home institution faculty instructor according to departmental requirements.</li>
        </ul>
      </div>

      <h3>Institutional Grading Scale Conversion Table</h3>
      <table>
        <thead>
          <tr>
            <th>Participating Campus</th>
            <th>Local Grade Scale</th>
            <th>Consortium Rating Equivalency</th>
          </tr>
        </thead>
        <tbody>
          ${ps.map(x => `
          <tr>
            <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
            <td>${esc(x.course.assessmentObligations || 'Official institutional scale (e.g. Letter Grades A-F, ECTS, or 0-10 numerical scale)')}</td>
            <td>Rubric rating of Exemplary (4 points) corresponds to top-tier marks; Proficient (3 points) corresponds to satisfactory degree mastery.</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <p><strong>Evaluative Feedback Turnaround:</strong> Instructors commit to returning rubric scores and qualitative evaluative feedback within <strong>seven calendar days</strong> of deliverable submission.</p>
    </section>

    <!-- Section 5: Weekly Course Curriculum and Activity Arc -->
    <section>
      <h2>5. Chronological Weekly Course Curriculum and Student Directions</h2>
      <p><em>Shared Collaboration Window: ${ov.ok ? `${T.fmtDate(ov.start)} to ${T.fmtDate(ov.end)} (${ov.weeks} shared instructional weeks excluding scheduled breaks).` : 'Aligned consortium schedule.'}</em></p>

      ${acts.map((a, i) => {
        const stage = a.stage || 'cocreate';
        const stInfo = DOSSIER_STAGE_INFO[stage] || DOSSIER_STAGE_INFO.cocreate;
        const linkedCLOs = (a.outcomes || []).map(oid => {
          const o = p.outcomes.find(x => x.id === oid);
          const idx = p.outcomes.indexOf(o);
          return idx >= 0 ? `CLO O${idx + 1}` : null;
        }).filter(Boolean);

        return `
        <article class="activity-card">
          <div class="activity-header">
            <div>
              <span class="doc-badge primary">Week ${i + 1}</span>
              <span class="doc-badge secondary">${esc(stInfo.label)}</span>
              <span class="doc-badge accent">${a.sync ? 'Synchronous Live Workshop' : 'Asynchronous Team Handoff'}</span>
            </div>
            <div class="activity-meta">
              Dates: ${T.fmtDate(a.start)} to ${T.fmtDate(a.end)} : Effort: ~3 to 5 Hours
            </div>
          </div>

          <h3 class="activity-title">${esc(a.title)}</h3>
          <p style="margin: 8px 0 12px; font-weight: 500;">${esc(a.summary)}</p>

          <div style="margin-bottom: 12px;">
            <strong>Module Learning Objectives (MLOs):</strong>
            <ul>
              <li><strong>MLO ${i + 1}.1:</strong> ${esc(stInfo.verb.charAt(0).toUpperCase() + stInfo.verb.slice(1))} ${esc(a.title.toLowerCase())}: ${esc(stInfo.objective)} ${linkedCLOs.length ? linkedCLOs.map(c => `<span class="doc-badge primary" style="font-size:0.75rem;">${esc(c)}</span>`).join('') : ''}</li>
              <li><strong>MLO ${i + 1}.2:</strong> Compare local observations with evidence contributed by international peer cohorts.</li>
            </ul>
          </div>

          <div class="step-box">
            <div class="step-title">3-Phase Collaborative Workflow</div>
            <div style="font-size: 0.9rem;">
              <p><strong>Phase 1 (Local Preparation, Mid-Week):</strong> Gather situated case notes and regional data within your local home community. Post summaries to your shared team space by Day 3.</p>
              <p><strong>Phase 2 (Cross-Border Exchange):</strong> Compare regional findings with your international teammates, analyzing divergences and questioning assumptions.</p>
              <p style="margin:0;"><strong>Phase 3 (Milestone Submission, End-of-Week):</strong> Compile your joint synthesis and submit via your campus assignment portal by Day 7.</p>
            </div>
          </div>

          <div style="margin: 14px 0;">
            <strong>Campus Cohort Responsibilities:</strong>
            <table>
              <thead>
                <tr>
                  <th style="width: 32%;">Campus Cohort</th>
                  <th>Expected Situated Contribution and Evidence</th>
                  <th style="width: 18%;">Workload Target</th>
                </tr>
              </thead>
              <tbody>
                ${ps.map(x => `
                <tr>
                  <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
                  <td>${esc(a.contributions?.[x.id] || 'Situated regional case observations, policy documentation, and comparative critique.')}</td>
                  <td>${a.workload?.[x.id] ?? 3} Hours</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin: 12px 0;">
            <strong>Detailed Student Instructions:</strong>
            <div style="font-size: 0.92rem; background: var(--surface); padding: 12px 14px; border-radius: 4px; border: 1px solid var(--border-subtle);">
              ${a.instructions ? md(a.instructions) : `<p>Review partner evidence, formulate comparative conclusions, and submit your team report through your campus portal.</p>`}
            </div>
          </div>

          ${a.contingency ? `
          <div class="callout warning" style="margin: 10px 0 0; padding: 10px 14px;">
            <strong style="color: var(--warning);">Contingency Protocol:</strong> ${esc(a.contingency)}
          </div>` : ''}
        </article>`;
      }).join('')}
    </section>

    <!-- Section 6: SpeedGrader Rubric Matrices -->
    <section class="page-break">
      <h2>6. Comprehensive Assessment Architecture and SpeedGrader Rubrics</h2>
      <p>All collaborative milestone deliverables are evaluated using the official four-tier SpeedGrader rubrics. Evaluations focus on comparative rigor, critical hypothesis revision, and evidence quality:</p>

      ${p.assessments.map((s, idx) => `
      <div class="keep-together" style="margin-bottom: 28px;">
        <h3>Assessment ${idx + 1}: ${esc(s.title)} <small style="font-weight:normal; color:var(--ink-muted);">[${esc(s.layer || 'Collaborative Deliverable')}]</small></h3>
        <p style="font-size: 0.9rem; color: var(--ink-secondary);">Evidence measure for: ${(s.outcomes || []).map(id => 'CLO O' + outIdx(id)).join(', ')} : Target Submission Date: ${T.fmtDate(s.due)}</p>

        <table>
          <thead>
            <tr>
              <th style="width: 24%;">Evaluation Criterion</th>
              <th style="width: 19%;">Exemplary (4 Pts)</th>
              <th style="width: 19%;">Proficient (3 Pts)</th>
              <th style="width: 19%;">Developing (2 Pts)</th>
              <th style="width: 19%;">Unsatisfactory (0 to 1 Pt)</th>
            </tr>
          </thead>
          <tbody>
            ${(s.criteria || [
              { name: 'Comparative Evidence Integration', description: 'Draws on and fairly analyzes situated data from all partner contexts.', levels: { exemplary: 'Seamlessly synthesizes evidence from all campuses with critical nuance.', proficient: 'Accurately integrates evidence from partner contexts.', developing: 'Relies primarily on home context with superficial partner mentions.', beginning: 'Partner context absent or misrepresented.' } },
              { name: 'Critical Engagement and Revision', description: 'Shows how partner critique revised initial hypotheses.', levels: { exemplary: 'Explicitly demonstrates evolution of thinking in response to international peers.', proficient: 'Substantively addresses partner critique.', developing: 'Acknowledges partner views without revising own stance.', beginning: 'No visible engagement with partner critique.' } },
              { name: 'Disciplinary Analysis and Rigor', description: 'Methodologically sound reasoning evaluated on depth, not linguistic fluency.', levels: { exemplary: 'Rigorous, well-justified analytical conclusions.', proficient: 'Sound disciplinary reasoning with minor gaps.', developing: 'Partially supported assertions.', beginning: 'Unsupported claims.' } }
            ]).map(c => `
            <tr>
              <td>
                <strong>${esc(c.name)}</strong><br>
                <small style="color:var(--ink-muted);">${esc(c.description || '')}</small>
              </td>
              <td>${esc(c.levels?.exemplary || 'Consistently exceeds standard with deep comparative insight.')}</td>
              <td>${esc(c.levels?.proficient || 'Meets full standard with sound evidence and analysis.')}</td>
              <td>${esc(c.levels?.developing || 'Shows basic effort with noticeable gaps in partner integration.')}</td>
              <td>${esc(c.levels?.beginning || 'Fails to meet standard; missing critical partner data.')}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <div style="font-size: 0.88rem; background: var(--surface); padding: 8px 12px; border-radius: 4px; border: 1px solid var(--border-subtle);">
          <strong>Local Campus Grade Allocation:</strong> ${ps.map(x => `${esc(x.institution)}: ${s.local?.[x.id]?.weight ?? 25}% of final course grade`).join(' : ')}
        </div>
      </div>`).join('')}
    </section>

    <!-- Section 7: Disciplinary Glossary -->
    <section>
      <h2>7. Cross-Cultural Disciplinary Glossary</h2>
      <p>Key disciplinary terms that carry nuanced, culturally divergent, or policy-specific meanings across our partner countries:</p>
      ${p.glossary.length ? `
      <table>
        <thead>
          <tr>
            <th style="width: 25%;">Term</th>
            <th>Consortium Definition and Regional Nuance</th>
            <th style="width: 30%;">Application in Student Assignments</th>
          </tr>
        </thead>
        <tbody>
          ${p.glossary.map(g => `
          <tr>
            <td><strong>${esc(g.term)}</strong></td>
            <td>${Object.entries(g.definitions || {}).map(([lang, def]) => `<strong>${esc(lang)}:</strong> ${esc(def)}`).join('<br>')}</td>
            <td>${esc(g.note || 'Agreed baseline terminology for joint student assignments.')}</td>
          </tr>`).join('')}
        </tbody>
      </table>` : `
      <p>Standard international disciplinary definitions apply. When analyzing regional case material, students should clarify institutional differences with international teammates.</p>`}
    </section>

    <!-- Section 8: Support Services Directory -->
    <section>
      <h2>8. Multi-Campus Student Support Services Directory</h2>
      <p>Academic and institutional support resources available to students across participating universities:</p>
      <table>
        <thead>
          <tr>
            <th>Campus</th>
            <th>Writing and Academic Tutoring</th>
            <th>Library Research Support</th>
            <th>Accessibility and Disability Office</th>
          </tr>
        </thead>
        <tbody>
          ${ps.map(x => `
          <tr>
            <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
            <td>Campus Writing Center / Academic Success Services</td>
            <td>University Library Research Consultation Desk</td>
            <td>Office of Student Accessibility and Accommodations</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>
  </main>

  <!-- CONFIDENTIAL INSTRUCTOR APPENDIX (INCLUDED IN FULL AND INSTRUCTOR VIEWS) -->
  <aside class="instructor-only page-break">
    <div class="appendix-banner">
      <h2>Confidential Instructor Implementation Dossier and Consortium Accord</h2>
      <p class="appendix-note">
        <strong>Notice for Instructors:</strong> This appendix contains inter-institutional governance accords, facilitator rotation schedules, student care escalation paths, and secondary case fallback dossiers. Instructors may detach or omit this section when sharing the course document with enrolled students.
      </p>
    </div>

    <!-- Appendix Section 1: Governance Accord -->
    <section>
      <h3>Appendix A: Multilateral Partnership Charter Articles</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 28%;">Charter Governance Article</th>
            <th>Operational Accord and Policy Agreement</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Shared Purpose and Equity</strong></td>
            <td>${esc(p.charter.purpose || 'Collaborative cross-border student learning characterized by complete institutional parity, mutual respect, and reciprocal knowledge creation.')}</td>
          </tr>
          <tr>
            <td><strong>2. Decision Rights and Quorum</strong></td>
            <td>${esc(p.charter.decisionRights || 'Consequential shared curriculum modifications require unanimous affirmative consent from all partner faculty. Local grading remains sovereign to each campus.')}</td>
          </tr>
          <tr>
            <td><strong>3. Working Languages and Accommodations</strong></td>
            <td>${esc(p.charter.languages || 'English is the shared working language, with bilingual submissions, multi-lingual citations, and translation comprehension aids fully supported.')}</td>
          </tr>
          <tr>
            <td><strong>4. Division of Teaching Work</strong></td>
            <td>${esc(p.charter.division || 'Balanced rotation of live lecture sessions, shared asynchronous workshop moderation, and collaborative rubric calibration.')}</td>
          </tr>
          <tr>
            <td><strong>5. Communication SLA and Rhythms</strong></td>
            <td>${esc(p.charter.responseTime || 'Faculty commit to responding to asynchronous cross-border inquiries within 3 business days.')}</td>
          </tr>
          <tr>
            <td><strong>6. Intellectual Property and Attribution</strong></td>
            <td>${esc(p.charter.attribution || 'Open educational licensing under Creative Commons (CC BY-NC 4.0) with mutual institutional attribution to all contributing faculty and universities.')}</td>
          </tr>
          <tr>
            <td><strong>7. Student Privacy and Data Governance</strong></td>
            <td>${esc(p.charter.studentComms || 'Compliance with FERPA, GDPR, and local privacy laws. No student educational records or personal identifiable data are transferred without explicit consent.')}</td>
          </tr>
          <tr>
            <td><strong>8. Dispute Resolution and Escalation</strong></td>
            <td>${esc(p.charter.disagreements || 'Documented pedagogical dialogue between instructors; escalating to department chairs or international program deans if unresolved after 7 business days.')}</td>
          </tr>
          <tr>
            <td><strong>9. Contingency and Cohort Protection</strong></td>
            <td>${esc(p.charter.cohortLoss || 'Archived secondary case dossiers protect student academic continuity if a partner campus suffers disruption or closure.')}</td>
          </tr>
          <tr>
            <td><strong>10. International Mobility Protocol</strong></td>
            <td>${esc(p.charter.mobility || (p.visitFormat === 'student-visit' ? 'Blended virtual collaboration with a 1-week reciprocal student immersion visit.' : (p.visitFormat === 'faculty-visit' ? 'Blended virtual collaboration with visiting faculty guest colloquium.' : '100% Fully Virtual Exchange. No international travel required.')))}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <!-- Appendix Section 2: Facilitator Rotation & Workload -->
    <section>
      <h3>Appendix B: Faculty Facilitation Rotation and Workload Parity</h3>
      <div class="callout">
        <p><strong>Balanced Instructional Delivery:</strong> Faculty instructors share facilitation duties throughout the term. Lead lecture and discussion moderation rotate weekly between partner institutions. Virtual office hours are scheduled during daylight overlap windows.</p>
        <p style="margin:0;"><strong>Grading Calibration:</strong> Instructors conduct a calibration meeting following the Week 2 milestone to review early student submissions and align rubric scoring standards across institutions.</p>
      </div>
    </section>

    <!-- Appendix Section 3: Counterfactual Resilience Audit -->
    <section>
      <h3>Appendix C: Counterfactual Resilience Audit and Fallback Case Dossiers</h3>
      <p>To ensure academic continuity if an international campus experiences unforeseen disruption (severe weather, connectivity outages, or unexpected calendar alterations), secondary benchmark case dossiers are pre-curated for every module:</p>
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Module</th>
            <th>Primary Cohort Evidence</th>
            <th>Secondary Backup Case Dossier (Instructor Curated)</th>
          </tr>
        </thead>
        <tbody>
          ${acts.map((a, i) => `
          <tr>
            <td><strong>Week ${i + 1}: ${esc(a.title)}</strong></td>
            <td>${ps.map(x => `${esc(x.institution)} local cohort case data`).join(' : ')}</td>
            <td>${esc(a.contingency || 'Curated benchmark case archive accessible through instructor repository. Students analyze secondary dataset without grading penalty.')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <!-- Appendix Section 4: Multi-Campus Calendar Reconciliation -->
    <section>
      <h3>Appendix D: Multi-Campus Calendar Overlap Reconciliation</h3>
      <table>
        <thead>
          <tr>
            <th>Campus</th>
            <th>Term Start</th>
            <th>Term End</th>
            <th>Scheduled Holidays and Exam Breaks</th>
          </tr>
        </thead>
        <tbody>
          ${ps.map(x => `
          <tr>
            <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
            <td>${esc(x.course.termStart || 'Per academic calendar')}</td>
            <td>${esc(x.course.termEnd || 'Per academic calendar')}</td>
            <td>${(x.course.breaks || []).map(b => `${esc(b.label)} (${b.durationDays || 5} days)`).join(', ') || 'Standard national holidays'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </section>

    <!-- Appendix Section 5: Verification Signatures -->
    <section class="signatures-block">
      <h3 style="margin-top:0;">Institutional Adoption and Accord Verification</h3>
      <p style="color:var(--ink-muted); margin-bottom:14px; font-size:0.9rem;">
        Signatures confirming inter-institutional approval of this curriculum package and authorizing implementation across respective campus learning environments.
      </p>
      <div class="sig-grid">
        <div class="sig-item">
          <strong>Curriculum Architect / Course Developer:</strong><br>
          <span style="color:#64748b; font-size:0.85rem;">Name: __________________________________</span>
          <div class="sig-line">Signature: _______________________ Date: ________</div>
        </div>
        ${ps.map((x, i) => `
        <div class="sig-item">
          <strong>${i === 0 ? 'Lead Campus Faculty Representative' : 'Partner Campus ' + (i + 1) + ' Faculty Representative'}:</strong><br>
          <span style="color:#475569; font-size:0.85rem;">${esc(x.institution)} (${esc(x.country)})</span>
          <div class="sig-line">Signature: _______________________ Date: ________</div>
        </div>`).join('')}
      </div>
    </section>
  </aside>

  <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid var(--border-subtle); font-size: 0.85rem; color: var(--ink-muted); text-align: center;">
    <p>Crosscourse Master Course Handbook and Syllabus : Formulated under Approved Release ${esc(rel.label)}.</p>
    <p>Conceptualized and developed by Professor Babu George (<a href="https://www.linkedin.com/in/beingbabu/" target="_blank" rel="noopener noreferrer" style="color:var(--brand);">LinkedIn</a>).</p>
  </footer>

  <script>
    function setDossierView(mode) {
      document.body.className = 'view-' + mode;
      var radios = document.querySelectorAll('input[name="dossier-mode"]');
      for (var i = 0; i < radios.length; i++) {
        radios[i].checked = (radios[i].value === mode);
      }
    }
    function downloadCurrentHTML() {
      var blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '${slug(p.title)}-master-course-handbook.html';
      document.body.appendChild(a);
      a.click();
      setTimeout(function() { a.remove(); }, 500);
    }
  </script>
</body>
</html>`;
}

/**
 * Backward-compatible alias for buildCourseDossierHTML.
 */
export function buildSyllabusHTML(p, opts = {}) {
  return buildCourseDossierHTML(p, opts);
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

        <div class="download-pack-card" style="border: 2px solid #0f5c65; background: #f8fafc;">
          <div class="download-card-icon">📑</div>
          <div class="download-card-info">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;">
              <h3 style="margin:0;">Master Course Handbook &amp; Syllabus (PDF / Print)</h3>
              <span class="badge" style="background:#0f5c65;color:#fff;">Comprehensive Standalone Document</span>
            </div>
            <p class="muted small">Complete non-LMS alternative: institutional course syllabus, driving challenge, policies and netiquette, 50/50 sovereign grading architecture, chronological weekly curriculum with student directions, 4-tier SpeedGrader rubrics, and a detachable Confidential Instructor Appendix. Formatted for high-quality printing or instant Save as PDF.</p>
            <div class="row gap wrap">
              <button class="btn primary sm" data-action="dl-pack-dossier-pdf-full">${icon.eye} View &amp; Print Master PDF (Complete)</button>
              <button class="btn sm" data-action="dl-pack-dossier-pdf-student">${icon.eye} Print Student Handbook (Clean)</button>
              <button class="btn sm" data-action="dl-pack-syllabus-html">${icon.download} Download HTML Document</button>
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
  'dl-pack-dossier-pdf-full'() {
    const p = app.p;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(buildCourseDossierHTML(p, { mode: 'full' }));
      win.document.close();
      setTimeout(() => { try { win.print(); } catch {} }, 600);
    } else {
      toast('Pop-up blocked. Please allow pop-ups to print, or download the HTML file.', 'warn');
    }
  },
  'dl-pack-dossier-pdf-student'() {
    const p = app.p;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(buildCourseDossierHTML(p, { mode: 'student' }));
      win.document.close();
      setTimeout(() => { try { win.print(); } catch {} }, 600);
    } else {
      toast('Pop-up blocked. Please allow pop-ups to print, or download the HTML file.', 'warn');
    }
  },
  'dl-pack-syllabus-html'() {
    const p = app.p;
    download(`${slug(p.title)}-master-course-handbook.html`, buildCourseDossierHTML(p, { mode: 'full' }), 'text/html');
  },
  'dl-pack-syllabus-pdf'() {
    const p = app.p;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(buildCourseDossierHTML(p, { mode: 'full' }));
      win.document.close();
      setTimeout(() => { try { win.print(); } catch {} }, 600);
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


