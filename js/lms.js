// Crosscourse LMS Course Cartridge (.imscc / .zip) Generator
// Produces 100% specification-compliant IMS Common Cartridge packages
// ready for 1-click import into Canvas, Blackboard Learn, Moodle, and D2L Brightspace.
// Implements Higher Education Course Quality Standards, Universal Design for Learning (UDL),
// WCAG 2.1 AA accessibility benchmarks, and interactive assessment rubrics.

import { esc, md } from './ui.js';
import * as T from './time.js';

// Precomputed CRC32 table for high-performance zero-dependency ZIP encoding
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

export function crc32(buf) {
  const table = getCrcTable();
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

/**
 * Creates a standard PKZIP archive from an array of { name: string, content: string|Uint8Array }.
 * Returns a Uint8Array containing the binary ZIP file.
 */
export function createZip(files) {
  const enc = new TextEncoder();
  const localParts = [];
  const cdParts = [];
  let offset = 0;

  const now = new Date();
  const time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const dataBytes = typeof f.content === 'string' ? enc.encode(f.content) : new Uint8Array(f.content);
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local Header (30 bytes + name length)
    const local = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(local.buffer);
    dv.setUint32(0, 0x04034b50, true); // Local file header signature
    dv.setUint16(4, 20, true);         // Version needed: 2.0
    dv.setUint16(6, 0x0800, true);     // General purpose flag: UTF-8 filenames
    dv.setUint16(8, 0, true);          // Compression method: 0 (Stored)
    dv.setUint16(10, time, true);      // File mod time
    dv.setUint16(12, date, true);      // File mod date
    dv.setUint32(14, crc, true);       // CRC-32
    dv.setUint32(18, size, true);      // Compressed size
    dv.setUint32(22, size, true);      // Uncompressed size
    dv.setUint16(26, nameBytes.length, true); // Name length
    dv.setUint16(28, 0, true);         // Extra field length
    local.set(nameBytes, 30);

    localParts.push(local);
    localParts.push(dataBytes);

    // Central Directory Header (46 bytes + name length)
    const cd = new Uint8Array(46 + nameBytes.length);
    const cdv = new DataView(cd.buffer);
    cdv.setUint32(0, 0x02014b50, true); // Central directory header signature
    cdv.setUint16(4, 20, true);         // Version made by: 2.0
    cdv.setUint16(6, 20, true);         // Version needed: 2.0
    cdv.setUint16(8, 0x0800, true);     // General purpose flag: UTF-8
    cdv.setUint16(10, 0, true);         // Compression method: 0
    cdv.setUint16(12, time, true);
    cdv.setUint16(14, date, true);
    cdv.setUint32(16, crc, true);
    cdv.setUint32(20, size, true);
    cdv.setUint32(24, size, true);
    cdv.setUint16(28, nameBytes.length, true);
    cdv.setUint16(30, 0, true);         // Extra field length
    cdv.setUint16(32, 0, true);         // File comment length
    cdv.setUint16(34, 0, true);         // Disk number start
    cdv.setUint16(36, 0, true);         // Internal file attributes
    cdv.setUint32(38, 0, true);         // External file attributes
    cdv.setUint32(42, offset, true);    // Relative offset of local header
    cd.set(nameBytes, 46);

    cdParts.push(cd);
    offset += local.length + dataBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const c of cdParts) cdSize += c.length;

  // End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const edv = new DataView(eocd.buffer);
  edv.setUint32(0, 0x06054b50, true);     // EOCD signature
  edv.setUint16(4, 0, true);              // Number of this disk
  edv.setUint16(6, 0, true);              // Disk where central directory starts
  edv.setUint16(8, files.length, true);   // Number of central directory records on this disk
  edv.setUint16(10, files.length, true);  // Total number of central directory records
  edv.setUint32(12, cdSize, true);        // Size of central directory
  edv.setUint32(16, cdOffset, true);      // Offset of start of central directory
  edv.setUint16(20, 0, true);             // Comment length

  const allChunks = [...localParts, ...cdParts, eocd];
  let totalLength = 0;
  for (const chunk of allChunks) totalLength += chunk.length;

  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of allChunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

const active = p => p.partners.filter(x => x.status !== 'withdrawn');
const slug = s => (s || 'crosscourse').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40).toLowerCase();

/**
 * Higher Education Course Quality Standards Embedded Stylesheet.
 * Enforces WCAG 2.1 AA contrast ratios (min 4.5:1 for normal text, 3:1 for large),
 * responsive typography, semantic layout hierarchy, accessible callouts, and clean print styles.
 */
function lmsThemeCSS() {
  return `
    :root {
      --primary: #0f5c65;
      --primary-dark: #09373d;
      --primary-light: #e6f3f4;
      --accent: #1e40af;
      --accent-light: #eff6ff;
      --text: #0f172a;
      --text-muted: #475569;
      --bg: #ffffff;
      --surface: #f8fafc;
      --surface-card: #ffffff;
      --border: #cbd5e1;
      --border-subtle: #e2e8f0;
      --border-accent: #0f5c65;
      --success: #15803d;
      --success-light: #f0fdf4;
      --warning: #b45309;
      --warning-light: #fffbeb;
      --info: #0369a1;
      --info-light: #f0f9ff;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 16px;
      line-height: 1.68;
      color: var(--text);
      background-color: var(--bg);
      max-width: 920px;
      margin: 0 auto;
      padding: 28px 24px 60px;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Top Banner / Course Header */
    .lms-banner {
      background: linear-gradient(135deg, #0f5c65 0%, #083338 100%);
      color: #ffffff;
      padding: 32px 28px;
      border-radius: 10px;
      margin-bottom: 32px;
      box-shadow: 0 4px 12px rgba(15, 92, 101, 0.15);
      border-left: 6px solid #f59e0b;
    }
    .lms-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
    }
    .lms-badge {
      display: inline-flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.18);
      color: #ffffff;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .lms-badge.gold {
      background: #f59e0b;
      color: #0f172a;
      border-color: #fbbf24;
    }
    .lms-banner h1 {
      margin: 0 0 10px;
      font-size: 1.85rem;
      line-height: 1.28;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.015em;
    }
    .lms-meta {
      font-size: 0.95rem;
      color: #f1f5f9;
      line-height: 1.5;
      margin-top: 8px;
      opacity: 0.95;
    }

    /* Headings & Typography Hierarchy */
    h2 {
      color: var(--primary-dark);
      font-size: 1.4rem;
      font-weight: 750;
      letter-spacing: -0.01em;
      border-bottom: 2px solid var(--border-subtle);
      padding-bottom: 8px;
      margin-top: 40px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    h3 {
      color: var(--text);
      font-size: 1.15rem;
      font-weight: 650;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    p, ul, ol {
      margin-top: 0;
      margin-bottom: 16px;
    }
    li {
      margin-bottom: 6px;
    }

    /* Pedagogical Callout Boxes */
    .lms-callout {
      border-radius: 8px;
      padding: 18px 22px;
      margin: 24px 0;
      border-left: 5px solid;
    }
    .lms-callout-info {
      background: var(--info-light);
      border-color: var(--info);
      color: #0c4a6e;
    }
    .lms-callout-tip {
      background: var(--primary-light);
      border-color: var(--primary);
      color: #134e4a;
    }
    .lms-callout-warning {
      background: var(--warning-light);
      border-color: var(--warning);
      color: #78350f;
    }
    .lms-callout-success {
      background: var(--success-light);
      border-color: var(--success);
      color: #14532d;
    }
    .lms-callout-title {
      font-weight: 750;
      font-size: 1.02rem;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Cards & Containers */
    .card {
      background: var(--surface);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 22px;
      margin: 20px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .card-title {
      font-weight: 700;
      font-size: 1.1rem;
      color: var(--primary-dark);
      margin-top: 0;
      margin-bottom: 12px;
    }

    /* Step-by-Step Task Scaffolding */
    .step-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 22px 0;
    }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 18px 20px;
      border-left: 4px solid var(--primary);
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .step-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .step-num {
      background: var(--primary);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .step-time {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .step-title {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text);
      margin: 4px 0 8px;
    }

    /* Cohort Cards Grid (Consortium Equity) */
    .cohort-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
      margin: 20px 0;
    }
    .cohort-card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      border-top: 4px solid;
    }
    .cohort-name {
      font-weight: 750;
      font-size: 1.02rem;
      margin-bottom: 4px;
      color: var(--text);
    }
    .cohort-country {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 12px;
      font-weight: 600;
    }
    .cohort-detail {
      font-size: 0.92rem;
      line-height: 1.55;
    }

    /* Accessible Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.94rem;
      background: #ffffff;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
    }
    th, td {
      border: 1px solid var(--border-subtle);
      padding: 12px 14px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #1e293b;
      font-size: 0.88rem;
      letter-spacing: 0.02em;
    }
    tr:nth-child(even) td {
      background: #fcfdfe;
    }

    /* Outcome Alignment Badges */
    .outcome-tag {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 700;
      margin-right: 4px;
      margin-bottom: 4px;
    }
    .outcome-tag.mlo {
      background: #fef3c7;
      color: #92400e;
    }

    /* Checklists for Student Self-Verification */
    .checklist {
      list-style: none;
      padding: 0;
      margin: 16px 0;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      margin-bottom: 8px;
      font-size: 0.93rem;
    }
    .checklist-box {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid var(--primary);
      border-radius: 4px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    /* Signatures Block */
    .signatures-block {
      margin-top: 40px;
      padding: 24px;
      border: 2px dashed #94a3b8;
      border-radius: 8px;
      background: var(--surface);
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;
      margin-top: 20px;
    }
    .sig-item {
      border-top: 1px solid #475569;
      padding-top: 10px;
      font-size: 0.9rem;
    }
    .sig-line {
      margin-top: 20px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid var(--border-subtle);
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.5;
    }

    /* Print Stylesheet */
    @media print {
      body { max-width: 100%; padding: 0; font-size: 12pt; }
      .lms-banner { background: none; color: #000; border-left: none; padding: 0 0 16px; border-bottom: 2px solid #000; }
      .lms-banner h1 { color: #000; font-size: 18pt; }
      .lms-badge, .lms-meta { color: #333; }
      .lms-callout, .card, .step-card, .cohort-card { box-shadow: none; border-color: #999; }
    }
  `;
}

/**
 * Stage-specific pedagogical verbs, descriptions and module learning objective templates aligned with Bloom's taxonomy.
 */
const STAGE_PEDAGOGY = {
  trust: {
    label: 'Establish Trust & Working Norms',
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
    label: 'Compare & Identify Divergences',
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
    label: 'Intercultural & Disciplinary Reflection',
    verb: 'Reflect and articulate',
    objective: 'Critically reflect on cross-cultural collaboration dynamics, articulating personal epistemological growth, intercultural competence gains, and ongoing global challenges.',
    focus: 'Individual reflective essays, meta-cognitive learning logs, and consortium portfolio evaluations.'
  }
};

/**
 * Builds HTML for "Start Here: Welcome & Course Orientation" (Course Quality Standards: Orientation & Navigation).
 */
function buildLmsStartHere(p) {
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Start Here: Welcome & Course Orientation</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Module 0 · Start Here</span>
      <span class="lms-badge">Course Quality Standards Aligned</span>
      <span class="lms-badge">${ps.length} Campuses</span>
    </div>
    <h1>Welcome to ${esc(p.title)}</h1>
    <div class="lms-meta">
      An international co-designed collaborative course across ${ps.map(x => esc(`${x.institution} (${x.country})`)).join(', ')}.
    </div>
  </div>

  <h2>1. Course Welcome & Collaborative Purpose</h2>
  <p>Welcome! In this course, you will not simply learn <em>about</em> international topics from a textbook; you will actively investigate real-world challenges <strong>in direct partnership with student colleagues in other countries</strong>. Each university cohort brings unique regional evidence, situated cultural perspectives, and localized community data that enrich the learning of all participants.</p>

  <div class="lms-callout lms-callout-info">
    <div class="lms-callout-title">The Central Driving Investigation</div>
    <p style="margin: 0; font-size: 1.08rem; font-style: italic;">"${esc(p.brief.question || 'How do situated perspectives across partner institutions illuminate key challenges in this field?')}"</p>
  </div>

  <h2>2. How This Course is Structured</h2>
  <div class="card">
    <p>This course is organized into structured weekly modules following a purposeful 6-stage arc of international co-design:</p>
    <ol>
      <li><strong>Establish Trust:</strong> Connecting with your international teammates, establishing team agreements, and agreeing on communication channels.</li>
      <li><strong>Investigate Locally:</strong> Gathering firsthand data, case studies, and field observations from your own home campus community.</li>
      <li><strong>Compare:</strong> Sharing and contrasting your local findings with international partner cohorts to surface unexamined assumptions.</li>
      <li><strong>Critique:</strong> Offering and receiving rigorous, respectful peer feedback across national boundaries.</li>
      <li><strong>Co-Create:</strong> Synthesizing your joint insights into a shared, high-impact collaborative artifact.</li>
      <li><strong>Reflect:</strong> Evaluating your intercultural learning and articulating what you learned from cross-border teamwork.</li>
    </ol>
  </div>

  <h2>3. Action Checklist: Your First 48 Hours</h2>
  <ul class="checklist">
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Step 1: Read the Course Syllabus:</strong> Familiarize yourself with the course schedule, learning outcomes, and grading architecture.</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Step 2: Review the Consortium Charter:</strong> Understand the agreed-upon rules of engagement between our universities.</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Step 3: Post Your Student Introduction:</strong> Introduce yourself, your background, your campus, and your time zone on the collaborative course board.</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Step 4: Check Technical Requirements:</strong> Ensure you have access to your local LMS, shared documents, and video conferencing tools.</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Step 5: Bookmark the Student Support Directory:</strong> Know where to reach out for writing, library, accessibility, or technical assistance.</div>
    </li>
  </ul>

  <h2>4. Netiquette & Cross-Cultural Communication Code</h2>
  <div class="lms-callout lms-callout-tip">
    <div class="lms-callout-title">Core Principles of Mutual Respect Across Borders</div>
    <ul>
      <li><strong>The 48-Hour Communication Rule:</strong> Always acknowledge messages from your international teammates within 48 hours (excluding scheduled university breaks). Even a brief <em>"Received, reviewing now"</em> maintains team momentum.</li>
      <li><strong>Linguistic Inclusivity & Patience:</strong> For many students, English is a second or third language. We evaluate reasoning, insight, and empirical evidence rather than grammatical perfection. Avoid localized idioms, sports metaphors, or culture-specific slang.</li>
      <li><strong>Asynchronous-First Courtesy:</strong> Remember that your international peers may be asleep when you post. Structure all tasks so teammates have at least 24–48 hours to read and contribute before a deadline.</li>
      <li><strong>Constructive & Evidence-Based Dialogue:</strong> Critique ideas, methodologies, and evidence, never persons, cultures, or nations. When disagreeing, cite specific observations and offer constructive alternatives.</li>
    </ul>
  </div>

  <h2>5. Minimum Technology & Digital Literacy Requirements</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 28%;">Technology Category</th>
        <th>Minimum Requirement & Recommendations</th>
        <th style="width: 25%;">Low-Bandwidth Alternative</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Device & OS</strong></td>
        <td>Laptop, desktop, or modern tablet with reliable web browser (Chrome, Edge, Firefox, Safari).</td>
        <td>Mobile-first access supported via LMS mobile app.</td>
      </tr>
      <tr>
        <td><strong>Internet Connection</strong></td>
        <td>Reliable broadband connection for viewing materials and participating in occasional video sessions.</td>
        <td>Asynchronous document handoffs and downloadable transcripts available.</td>
      </tr>
      <tr>
        <td><strong>Productivity & Collaboration</strong></td>
        <td>Word processing, presentation tools, and cloud storage (Google Workspace, Microsoft 365, or campus LMS).</td>
        <td>Offline drafting permitted; plain text and PDF uploads accepted.</td>
      </tr>
      <tr>
        <td><strong>Synchronous Communication</strong></td>
        <td>Webcam and microphone for scheduled live video workshops (Zoom, Teams, or Google Meet).</td>
        <td>Audio-only or chat-based participation accommodated upon notice.</td>
      </tr>
    </tbody>
  </table>

  <h2>6. Technical Support by Participating Institution</h2>
  <table>
    <thead>
      <tr>
        <th>Campus / University</th>
        <th>Support Office</th>
        <th>Contact & Help Desk</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
        <td>Campus Academic Technology & LMS Support</td>
        <td>LMS Help Center / Contact designated instructor: ${esc(x.email || 'Via Campus LMS')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Higher Education Course Quality Standards Aligned.<br>
    Start Here Orientation Guide for All Participating Campuses.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Syllabus page inside the LMS cartridge (Course Quality Standards: Objectives, Assessment & Interaction).
 */
function buildLmsSyllabus(p) {
  const ps = active(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(p.title)}: Consortium Syllabus</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Official Syllabus</span>
      <span class="lms-badge">Learning Outcomes Aligned</span>
      <span class="lms-badge">${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks</span>
    </div>
    <h1>${esc(p.title)}</h1>
    <div class="lms-meta">
      International Consortium: ${ps.map(x => esc(`${x.institution} (${x.country})`)).join(' · ')}<br>
      Collaboration Framework: ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks · ${esc(p.visitFormat === 'student-visit' ? 'Blended with Student Field Immersion' : (p.visitFormat === 'faculty-visit' ? 'Blended with Faculty Colloquium' : '100% Fully Virtual Exchange'))}
    </div>
  </div>

  <h2>1. Course Overview & Central Driving Inquiry</h2>
  <div class="lms-callout lms-callout-info">
    <div class="lms-callout-title">Central Driving Question</div>
    <p style="margin: 0; font-size: 1.1rem; font-style: italic;">"${esc(p.brief.question || 'How do situated perspectives across partner institutions illuminate key challenges in this field?')}"</p>
  </div>
  <p><strong>Shared Disciplinary Challenge:</strong> ${esc(p.brief.challenge || p.title)}</p>
  <p><strong>Why International Collaboration:</strong> ${esc(p.brief.whyInternational || 'Each student cohort holds situated regional evidence, localized institutional frameworks, and cultural perspectives that neither cohort could access alone.')}</p>

  <h2>2. Participating Institutions & Faculty Contacts</h2>
  <table>
    <thead>
      <tr>
        <th>Campus</th>
        <th>Representative Faculty</th>
        <th>Department &amp; Local Course</th>
        <th>Time Zone</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong><br><small style="color:var(--text-muted);">${esc(x.city ? `${x.city}, ${x.country}` : x.country)}</small></td>
        <td><strong>${esc(x.name || 'Designated Professor')}</strong><br><small style="color:var(--text-muted);">${esc(x.email || 'Via Campus LMS')}</small></td>
        <td>${esc(x.course.title || 'Department')} ${esc(x.course.code || '')}<br><small style="color:var(--text-muted);">${esc(x.course.level || 'Undergraduate/Graduate')}</small></td>
        <td><code>${esc(x.timezone)}</code></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>3. Measurable Course Learning Outcomes (CLOs)</h2>
  <p>Upon successful completion of this international collaborative course, students from all participating universities will be able to:</p>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">CLO #</th>
        <th style="width: 18%;">Domain</th>
        <th>Observable Learning Outcome (Bloom's Taxonomy)</th>
        <th style="width: 32%;">Evidenced by Student Artifact</th>
      </tr>
    </thead>
    <tbody>
      ${p.outcomes.map((o, idx) => `
      <tr>
        <td><span class="outcome-tag">CLO O${idx + 1}</span></td>
        <td><strong style="text-transform:capitalize;">${esc(o.type || 'Disciplinary')}</strong></td>
        <td>${esc(o.text)}</td>
        <td>${esc(o.evidence || 'Collaborative team deliverable and individual reflection')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Outcomes Alignment Matrix</h2>
  <p>This matrix maps how course learning outcomes are systematically developed through weekly module activities and evaluated through authentic assessments:</p>
  <table>
    <thead>
      <tr>
        <th>Course Learning Outcome</th>
        <th>Associated Weekly Modules</th>
        <th>Summative Assessment Measure</th>
      </tr>
    </thead>
    <tbody>
      ${p.outcomes.map((o, idx) => {
        const linkedActs = acts.filter(a => (a.outcomes || []).includes(o.id));
        const linkedAssess = (p.assessments || []).filter(s => (s.outcomes || []).includes(o.id));
        return `
        <tr>
          <td><strong>CLO O${idx + 1}:</strong> ${esc(o.text.slice(0, 75))}${o.text.length > 75 ? '…' : ''}</td>
          <td>${linkedActs.length ? linkedActs.map((a, i) => `Week ${acts.indexOf(a) + 1}`).join(', ') : 'Integrated across all weeks'}</td>
          <td>${linkedAssess.length ? linkedAssess.map(s => esc(s.title)).join(', ') : 'Shared Collaborative Portfolio'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <h2>5. Regular and Substantive Interaction (RSI) Plan</h2>
  <div class="card">
    <p>To ensure robust faculty presence and substantive interaction across international cohorts, instructors commit to the following schedule:</p>
    <ul>
      <li><strong>Weekly Video Briefings &amp; Synthesis:</strong> Lead and partner faculty alternate posting weekly overview briefings highlighting cross-campus insights.</li>
      <li><strong>Active Discussion Moderation:</strong> Faculty actively participate in asynchronous team workspaces, offering formative questions and feedback.</li>
      <li><strong>Feedback Turnaround Standard:</strong> Evaluative feedback and graded rubrics will be returned within <strong>7 calendar days</strong> of milestone submissions.</li>
      <li><strong>Synchronous Faculty Office Hours:</strong> Virtual office hours held weekly via video conference inside fair daylight overlap windows.</li>
    </ul>
  </div>

  <h2>6. Weekly Arc of Collaboration</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Week</th>
        <th>Dates &amp; Stage</th>
        <th>Activity &amp; Topic</th>
        <th style="width: 22%;">Modality</th>
        <th style="width: 22%;">Primary Milestone</th>
      </tr>
    </thead>
    <tbody>
      ${acts.map((a, idx) => `
      <tr>
        <td><strong>Week ${idx + 1}</strong></td>
        <td>${T.fmtDate(a.start)} – ${T.fmtDate(a.end)}<br><small class="outcome-tag mlo">${esc((a.stage || 'cocreate').toUpperCase())}</small></td>
        <td><strong>${esc(a.title)}</strong><br><small style="color:var(--text-muted);">${esc(a.summary)}</small></td>
        <td>${a.sync ? 'Synchronous Live Video' : 'Asynchronous Team Handoff'}</td>
        <td>${(a.outcomes || []).length ? 'Graded Collaborative Milestone' : 'Formative Synthesis'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>7. Dual-Layer Grading Architecture & Sovereign Scales</h2>
  <div class="lms-callout lms-callout-tip">
    <div class="lms-callout-title">The Sovereign Grading Philosophy</div>
    <p>This consortium decouples <strong>shared evaluation standards</strong> from <strong>local grade weighting</strong>:</p>
    <ul>
      <li><strong>50% Shared Collaborative Team Deliverables:</strong> Evaluated using the unified assessment rubrics measuring comparative rigor, empirical evidence, and cross-cultural synthesis.</li>
      <li><strong>50% Individual Sovereign Reflection & Local Mastery:</strong> Evaluated and weighted by each student\'s home institution faculty instructor according to local degree requirements.</li>
    </ul>
  </div>

  <h2>8. Academic Integrity & Responsible AI Policy</h2>
  <div class="card">
    <p><strong>Originality and Cross-Border Attribution:</strong> All data, interviews, and community observations contributed by international peers must be formally cited. Appropriating a teammate's empirical data without attribution violates consortium academic integrity policies.</p>
    <p><strong>Generative AI Guidelines:</strong> AI tools may be used for language editing, brainstorming, and translation assistance. However, all regional case studies and empirical claims must be based on genuine local investigations. AI-generated fabrications of local community data will result in immediate assignment failure.</p>
  </div>

  <div class="signatures-block">
    <h3 style="margin-top:0;">Consortium Signatures & Institutional Verification (Fill after download)</h3>
    <p style="color:var(--text-muted);margin-bottom:12px;">Signatures verifying course adoption, institutional equivalency, and cross-border curriculum alignment.</p>
    <div class="sig-grid">
      <div class="sig-item">
        <strong>Curriculum Architect / Course Developer:</strong>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>
      ${ps.map((x, i) => `
      <div class="sig-item">
        <strong>${i === 0 ? 'Lead Campus Faculty Instructor' : `Partner Campus ${i + 1} Faculty Instructor`}:</strong><br>
        <span style="color:#475569;font-size:0.85rem;">${esc(x.institution)} (${esc(x.country)})</span>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Higher Education Course Quality Standards Aligned.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Student Onboarding Guide inside the LMS cartridge (Course Quality Standards: Learner Interaction & Support).
 */
function buildLmsStudentGuide(p) {
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Student Onboarding & Collaboration Guide</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Student Guide</span>
      <span class="lms-badge">Collaboration &amp; Interaction</span>
    </div>
    <h1>Student Onboarding &amp; Collaboration Guide</h1>
    <div class="lms-meta">
      A practical guide for working successfully with student colleagues across ${ps.map(x => esc(`${x.institution} in ${x.country}`)).join(', ')}.
    </div>
  </div>

  <h2>Why Are We Collaborating Internationally?</h2>
  <p>In today's interconnected world, critical global problems (in public health, environmental policy, business ethics, and governance) are deeply shaped by regional, cultural, and political contexts. By teaming up with students living in another country, you will analyze real-world issues through <strong>authentic comparative evidence</strong> rather than textbook theory.</p>

  <div class="lms-callout lms-callout-info">
    <div class="lms-callout-title">The Central Challenge You Will Address Together</div>
    <p style="margin: 0; font-size: 1.05rem;">"${esc(p.brief.question || 'How do situated perspectives across partner institutions illuminate key challenges in this field?')}"</p>
  </div>

  <h2>The 4 Pillars of Successful Cross-Border Teamwork</h2>
  <div class="step-grid">
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Pillar 1</span>
        <span class="step-time">Every Day</span>
      </div>
      <div class="step-title">Asynchronous-First Communication</div>
      <p style="margin:0; font-size:0.92rem;">Partner universities operate in different time zones. Successful teams rely primarily on shared documents, collaborative slides, and threaded discussion boards. Never assume an international teammate can answer immediately.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Pillar 2</span>
        <span class="step-time">Within 48 Hours</span>
      </div>
      <div class="step-title">The 48-Hour Response SLA</div>
      <p style="margin:0; font-size:0.92rem;">Trust requires reliability. Always reply to a team message within 48 hours, even if only to say: <em>"Received! I will post my section by Thursday."</em> Inactivity causes unnecessary anxiety for your overseas partners.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Pillar 3</span>
        <span class="step-time">At All Times</span>
      </div>
      <div class="step-title">Linguistic Graciousness &amp; Inclusion</div>
      <p style="margin:0; font-size:0.92rem;">Second-language speakers contribute indispensable regional insight. We grade on analytical depth, evidence, and intellectual rigor, not native English fluency. Use clear sentences, avoid slang, and use translation tools when helpful.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Pillar 4</span>
        <span class="step-time">Milestone Deadlines</span>
      </div>
      <div class="step-title">Mutual Interdependence &amp; Parity</div>
      <p style="margin:0; font-size:0.92rem;">Every team submission requires substantive contributions from both campuses. No single student should do the entire assignment, and no student should merely "sign off" without doing local field investigation.</p>
    </div>
  </div>

  <h2>What to Do if an Overseas Partner is Disrupted</h2>
  <div class="lms-callout lms-callout-warning">
    <div class="lms-callout-title">Contingency &amp; Academic Protection Policy</div>
    <p>International collaborations sometimes face unforeseen events: campus closures, server outages, connectivity disruptions, or local national emergencies. If your overseas teammate experiences a disruption:</p>
    <ul>
      <li>Notify your instructor immediately via your campus LMS messaging.</li>
      <li>Proceed with your local case analysis as planned.</li>
      <li>Your instructor will provide secondary archived benchmark dossiers so your team deliverable can proceed without academic penalty. <strong>No student's grade will be negatively impacted by international partner delays.</strong></li>
    </ul>
  </div>

  <h2>Setting Up Team Communication Channels</h2>
  <div class="card">
    <p>During Week 1, your team should agree on primary and secondary communication tools:</p>
    <ul>
      <li><strong>Official Submissions &amp; Grades:</strong> Always submitted via your official campus LMS assignment portal.</li>
      <li><strong>Collaborative Drafting:</strong> Google Docs, Microsoft Office 365, or Notion shared folders.</li>
      <li><strong>Quick Messaging:</strong> WhatsApp, Telegram, Slack, or LMS course groups (agree on one channel that is accessible to all partner campuses).</li>
      <li><strong>Video Meetings:</strong> Zoom, Microsoft Teams, or Google Meet (keep live sessions focused and record key decisions for teammates who cannot attend).</li>
    </ul>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Course Quality Standards Aligned.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Consortium Charter inside the LMS cartridge (Institutional Governance & Learner Support).
 */
function buildLmsCharter(p) {
  const ps = active(p);
  const c = p.charter || {};

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Consortium Partnership Charter & Governance Agreement</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Governance Accord</span>
      <span class="lms-badge">Institutional Governance</span>
    </div>
    <h1>Consortium Partnership Charter</h1>
    <div class="lms-meta">
      Inter-Institutional Accord between ${ps.map(x => esc(x.institution)).join(' and ')}
    </div>
  </div>

  <h2>Articles of Consortium Governance</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 26%;">Governance Article</th>
        <th>Agreed Policy &amp; Operational Framework</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Shared Purpose &amp; Equity</strong></td>
        <td>${esc(c.purpose || 'Collaborative cross-border student learning characterized by complete institutional parity, mutual respect, and reciprocal knowledge creation.')}</td>
      </tr>
      <tr>
        <td><strong>2. Decision Rights &amp; Quorum</strong></td>
        <td>${esc(c.decisionRights || 'Consequential shared curriculum modifications require unanimous affirmative consent from all partner faculty. Local grading remains sovereign to each campus.')}</td>
      </tr>
      <tr>
        <td><strong>3. Working Languages &amp; Accommodations</strong></td>
        <td>${esc(c.languages || 'English is the shared working language, with bilingual submissions, multi-lingual citations, and translation comprehension aids fully supported.')}</td>
      </tr>
      <tr>
        <td><strong>4. Division of Teaching Work</strong></td>
        <td>${esc(c.division || 'Balanced rotation of live lecture sessions, shared asynchronous workshop moderation, and collaborative rubric calibration.')}</td>
      </tr>
      <tr>
        <td><strong>5. Communication SLA &amp; Rhythms</strong></td>
        <td>${esc(c.responseTime || 'Faculty commit to responding to asynchronous cross-border inquiries within 3 business days.')}</td>
      </tr>
      <tr>
        <td><strong>6. Intellectual Property &amp; Attribution</strong></td>
        <td>${esc(c.attribution || 'Open educational licensing under Creative Commons (CC BY-NC 4.0) with mutual institutional attribution to all contributing faculty and universities.')}</td>
      </tr>
      <tr>
        <td><strong>7. Student Privacy &amp; Data Governance</strong></td>
        <td>${esc(c.studentComms || 'Compliance with FERPA, GDPR, and local privacy laws. No student educational records or personal identifiable data are transferred without explicit consent.')}</td>
      </tr>
      <tr>
        <td><strong>8. Dispute Resolution &amp; Escalation</strong></td>
        <td>${esc(c.disagreements || 'Documented pedagogical dialogue between instructors; escalating to department chairs or international program deans if unresolved after 7 business days.')}</td>
      </tr>
      <tr>
        <td><strong>9. Contingency &amp; Cohort Protection</strong></td>
        <td>${esc(c.cohortLoss || 'Archived secondary case dossiers protect student academic continuity if a partner campus suffers disruption or closure.')}</td>
      </tr>
      <tr>
        <td><strong>10. International Mobility Protocol</strong></td>
        <td>${esc(c.mobility || (p.visitFormat === 'student-visit' ? 'Blended virtual collaboration with a 1-week reciprocal student immersion visit.' : (p.visitFormat === 'faculty-visit' ? 'Blended virtual collaboration with visiting faculty guest colloquium.' : '100% Fully Virtual Exchange. No international travel required.')))}</td>
      </tr>
    </tbody>
  </table>

  <div class="signatures-block">
    <h3 style="margin-top:0;">Institutional Verification &amp; Official Signatures (Fill after download)</h3>
    <p style="color:var(--text-muted);margin-bottom:12px;">Signatures verifying faculty endorsement and institutional curriculum approval.</p>
    <div class="sig-grid">
      <div class="sig-item">
        <strong>Lead Campus Representative:</strong><br>
        <span style="color:#475569;font-size:0.85rem;">${esc(ps[0]?.institution || 'Lead Institution')} (${esc(ps[0]?.country || '')})</span>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>
      ${ps.slice(1).map((x, i) => `
      <div class="sig-item">
        <strong>Partner Campus ${i + 2} Representative:</strong><br>
        <span style="color:#475569;font-size:0.85rem;">${esc(x.institution)} (${esc(x.country)})</span>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Consortium Governance Accord.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Cross-Cultural Glossary page inside the LMS cartridge (Instructional Materials & Accessibility).
 */
function buildLmsGlossary(p) {
  const terms = p.glossary || [];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Cross-Cultural Disciplinary Glossary</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Reference</span>
      <span class="lms-badge">Instructional Clarity</span>
    </div>
    <h1>Cross-Cultural Disciplinary Glossary</h1>
    <div class="lms-meta">
      Key disciplinary terms that carry nuanced, culturally divergent, or policy-specific meanings across our partner countries.
    </div>
  </div>

  <h2>Agreed Terminology &amp; Regional Nuances</h2>
  ${terms.length ? `
  <table>
    <thead>
      <tr>
        <th style="width:25%;">Term</th>
        <th>Consortium Definition &amp; Regional Nuance</th>
        <th style="width:30%;">Application in Student Assignments</th>
      </tr>
    </thead>
    <tbody>
      ${terms.map(g => `
      <tr>
        <td><strong>${esc(g.term)}</strong></td>
        <td>${Object.entries(g.definitions || {}).map(([lang, def]) => `<strong>${esc(lang)}:</strong> ${esc(def)}`).join('<br>')}</td>
        <td>${esc(g.note || 'Agreed baseline terminology for joint student assignments.')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : `
  <div class="card">
    <p>This course uses standard international disciplinary terminology. When collaborating with international peers, please keep the following distinctions in mind:</p>
    <ul>
      <li><strong>"Public Interest" / "Common Good":</strong> Differs between liberal-individualist and communitarian legal and cultural frameworks.</li>
      <li><strong>"Governance" vs. "Government":</strong> Distinct concepts distinguishing formal state mechanisms from multi-stakeholder civil society processes.</li>
      <li><strong>"Sustainability":</strong> In high-income contexts, often emphasizes ecological conservation; in developing regions, emphasizes poverty eradication, resource equity, and economic resilience.</li>
    </ul>
  </div>
  `}

  <div class="footer">
    Crosscourse LMS Cartridge Export · Shared Disciplinary Terminology.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Institutional Support Services & Accessibility Statement (Universal Accessibility & Student Support).
 */
function buildLmsSupportAccessibility(p) {
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Institutional Support Services & Accessibility Statement</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Student Resources</span>
      <span class="lms-badge">Accessibility &amp; Student Support</span>
    </div>
    <h1>Institutional Support Services &amp; Accessibility Statement</h1>
    <div class="lms-meta">
      Campus resources, academic support, and universal accessibility accommodations across all partner universities.
    </div>
  </div>

  <h2>1. Accessibility & Universal Design for Learning (UDL)</h2>
  <div class="card">
    <p>Our consortium is committed to ensuring full digital inclusion and accessibility for all students, conforming to <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards:</p>
    <ul>
      <li><strong>Screen Reader Compatibility:</strong> All course web pages feature semantic heading structures (H1, H2, H3), accessible table headers, and descriptive link text.</li>
      <li><strong>Alternative Formats:</strong> Core readings and assignment handouts are available in accessible HTML, printable PDF, and editable markdown formats.</li>
      <li><strong>Video Accommodations:</strong> Pre-recorded video briefings include closed captions and downloadable text transcripts.</li>
      <li><strong>Low-Bandwidth Optimization:</strong> All essential collaborative deliverables are lightweight and mobile-ready, ensuring students on constrained connections face no barriers.</li>
    </ul>
  </div>

  <h2>2. Requesting Disability & Academic Accommodations</h2>
  <p>Students with documented disabilities or requiring academic accommodations should coordinate with their home campus accessibility office. Faculty at all participating institutions will honor approved accommodations with complete confidentiality:</p>
  <table>
    <thead>
      <tr>
        <th>Campus</th>
        <th>Accessibility &amp; Disability Services</th>
        <th>Accommodation Procedure</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
        <td>Office of Student Accessibility &amp; Disability Resources</td>
        <td>Submit approved institutional accommodation letters directly to your campus instructor: ${esc(x.email || 'Via Campus LMS')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>3. Academic Support & Writing Centers</h2>
  <p>Writing across borders and disciplines is an acquired skill. Students are strongly encouraged to utilize campus academic centers:</p>
  <table>
    <thead>
      <tr>
        <th>Campus</th>
        <th>Writing Center &amp; Tutoring Support</th>
        <th>Library Research Consultation</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong></td>
        <td>Campus Writing Center / Multilingual Writing Consultations</td>
        <td>University Library Research Desk / Subject Librarian</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Mental Health, Counseling & Student Wellbeing</h2>
  <div class="lms-callout lms-callout-info">
    <div class="lms-callout-title">Student Wellbeing Across Borders</div>
    <p>Cross-border academic teamwork can be demanding. If you experience academic stress, personal crisis, or health challenges, please reach out to your local campus Counseling and Psychological Services. Your instructor is always available to discuss deadline adjustments and support options.</p>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Universal Accessibility & Student Support Aligned.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for each weekly collaborative activity page inside the LMS cartridge.
 * Adheres strictly to Higher Education Course Quality Standards:
 * - Measurable Module Learning Objectives
 * - Required Instructional Materials & Case Data
 * - Scaffolded Collaborative Task Directions
 * - Cohort Interdependence & Workload Allocation
 * - Resilience & Fallback Plan
 * - Assessment Rubric Alignment & Self-Verification Checklist
 */
function buildLmsActivity(p, a, weekNum) {
  const ps = active(p);
  const stage = a.stage || 'cocreate';
  const stageInfo = STAGE_PEDAGOGY[stage] || STAGE_PEDAGOGY.cocreate;
  const linkedCLOs = (a.outcomes || []).map(oid => {
    const o = p.outcomes.find(x => x.id === oid);
    const idx = p.outcomes.indexOf(o);
    return idx >= 0 ? `CLO O${idx + 1}` : null;
  }).filter(Boolean);

  const mloText = `${stageInfo.verb.charAt(0).toUpperCase() + stageInfo.verb.slice(1)} ${a.title.toLowerCase()}: ${stageInfo.objective}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Week ${weekNum}: ${esc(a.title)}</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Week ${weekNum}</span>
      <span class="lms-badge">${esc(stageInfo.label)}</span>
      <span class="lms-badge">${a.sync ? 'Synchronous Workshop' : 'Asynchronous Handoff'}</span>
    </div>
    <h1>${esc(a.title)}</h1>
    <div class="lms-meta">
      Collaboration Window: ${T.fmtDate(a.start)} to ${T.fmtDate(a.end)} · Estimated Total Effort: ~3–5 Hours
    </div>
  </div>

  <h2>1. Module Overview & Pedagogical Purpose</h2>
  <p>${esc(a.summary || 'In this collaborative milestone, students from all participating universities collaborate to advance their shared inquiry through situated investigation and cross-border synthesis.')}</p>

  <h2>2. Measurable Module Learning Objectives (MLOs)</h2>
  <div class="card">
    <p>By the conclusion of this weekly module, you will be able to:</p>
    <ul>
      <li>
        <strong>MLO ${weekNum}.1:</strong> ${esc(mloText)}
        ${linkedCLOs.length ? linkedCLOs.map(c => `<span class="outcome-tag">${esc(c)}</span>`).join('') : '<span class="outcome-tag">Core Collaborative Objective</span>'}
      </li>
      <li>
        <strong>MLO ${weekNum}.2:</strong> Synthesize evidence from your home institution with data provided by your international peers, identifying areas of alignment and critical divergence.
        <span class="outcome-tag">Comparative Inquiry</span>
      </li>
    </ul>
  </div>

  <h2>3. Required Preparation & Instructional Resources</h2>
  <div class="card">
    <h3 class="card-title">Before Joining Your International Team</h3>
    <ul>
      <li><strong>Foundational Disciplinary Context:</strong> Review the primary case study notes and regional briefing materials provided by your home campus instructor.</li>
      <li><strong>Partner Context Dossier:</strong> Review the institutional context card for your overseas partner university (available in the Course Overview module).</li>
      <li><strong>Key Concept Focus:</strong> ${esc(stageInfo.focus)}</li>
    </ul>
  </div>

  <h2>4. Scaffolded Step-by-Step Task Directions</h2>
  <div class="step-grid">
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Phase 1 · Mid-Week</span>
        <span class="step-time">Estimated: 1.5 Hours</span>
      </div>
      <div class="step-title">Step 1: Local Campus Investigation &amp; Evidence Gathering</div>
      <p style="margin:0; font-size:0.92rem;">Work independently or with your home campus cohort to collect, document, and summarize your situated local case findings. Upload your summary to your shared team workspace by <strong>Day 3 (Mid-Week Milestone)</strong>.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Phase 2 · Cross-Border</span>
        <span class="step-time">Estimated: 2.0 Hours</span>
      </div>
      <div class="step-title">Step 2: International Peer Exchange &amp; Dialectical Synthesis</div>
      <p style="margin:0; font-size:0.92rem;">Review the evidence posted by your international peers. Meet synchronously (or via structured asynchronous discussion) to debate divergent findings, question assumptions, and synthesize shared insights.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Phase 3 · Submission</span>
        <span class="step-time">Estimated: 1.0 Hour</span>
      </div>
      <div class="step-title">Step 3: Final Team Deliverable &amp; Peer Evaluation</div>
      <p style="margin:0; font-size:0.92rem;">Compile and finalize your joint submission according to the deliverable instructions below. Submit before <strong>Day 7 (End-of-Week Deadline)</strong> through this LMS portal.</p>
    </div>
  </div>

  <h2>5. Detailed Assignment Instructions & Requirements</h2>
  <div class="card">
    ${a.instructions ? md(a.instructions) : `
    <p><strong>Assignment Deliverable:</strong></p>
    <ol>
      <li>Collaborative team report or structured slide deck (3–5 pages / 8–10 slides) addressing the weekly milestone inquiry.</li>
      <li>Explicit inclusion of situated data and comparative analysis from each participating campus cohort.</li>
      <li>One-paragraph team reflection describing what surprised you most about your international partner's findings.</li>
    </ol>`}
  </div>

  <h2>6. Campus Cohort Interdependence: Who Contributes What</h2>
  <p>To ensure equity and eliminate passive freeloading, students from each campus have distinct required contributions:</p>
  <div class="cohort-grid">
    ${ps.map(x => `
    <div class="cohort-card" style="border-top-color: ${x.color || '#0f5c65'};">
      <div class="cohort-name">${esc(x.institution)}</div>
      <div class="cohort-country">${esc(x.city ? `${x.city}, ${x.country}` : x.country)}</div>
      <div class="cohort-detail">
        <p><strong>Expected Cohort Contribution:</strong><br>${esc(a.contributions?.[x.id] || 'Situated local empirical observations, regional policy documents, and comparative critique.')}</p>
        <p style="margin:0; color:var(--text-muted); font-size:0.85rem;"><strong>Workload Target:</strong> ${a.workload?.[x.id] ?? 3} Hours</p>
      </div>
    </div>`).join('')}
  </div>

  <h2>7. Fallback & Resilience Contingency</h2>
  <div class="lms-callout lms-callout-warning">
    <div class="lms-callout-title">If Your International Partner Cohort is Delayed</div>
    <p style="margin:0;">${esc(a.contingency || 'If your international partner cohort experiences unexpected campus disruption or delays, proceed with your local case data and activate the instructor-curated secondary case dossier. No student will be penalized for partner delays.')}</p>
  </div>

  <h2>8. Pre-Submission Self-Verification Checklist</h2>
  <p>Before submitting your team deliverable, ensure your submission meets all assignment evaluation criteria:</p>
  <ul class="checklist">
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Comparative Parity:</strong> Does the deliverable integrate substantive evidence from all participating campuses?</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Critical Revision:</strong> Does the analysis demonstrate how your initial thinking was revised or deepened through partner dialogue?</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Disciplinary Rigor:</strong> Are claims backed by verifiable citations, empirical observations, or documented policy data?</div>
    </li>
    <li class="checklist-item">
      <span class="checklist-box"></span>
      <div><strong>Equal Attribution:</strong> Are all participating student team members listed with their specific contributions acknowledged?</div>
    </li>
  </ul>

  <h2>9. Grading Rubric Alignment</h2>
  <p>This assignment is evaluated using the official <strong>Consortium Assessment Rubric</strong> (viewable in the Assessment module). Evaluation criteria focus on comparative integration, analytical rigor, and respectful intercultural critique.</p>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Higher Education Course Quality Standards Aligned.<br>
    Module Activity Week ${weekNum} · ${esc(a.title)}.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Grading Policy & Sovereign Institutional Framework (Transparent Assessment Architecture).
 */
function buildLmsGradingPolicy(p) {
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Course Grading Architecture & Sovereign Weighting Policy</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Grading Policy</span>
      <span class="lms-badge">Assessment Architecture</span>
    </div>
    <h1>Course Grading Architecture &amp; Sovereign Weighting</h1>
    <div class="lms-meta">
      Evaluation framework reconciling shared international rubrics with sovereign institutional grading requirements.
    </div>
  </div>

  <h2>1. Dual-Layer Grading Architecture</h2>
  <p>In international collaborations, institutional grading regulations, GPA scales, and credit requirements vary widely across partner countries. Crosscourse resolves this through an equitable <strong>Dual-Layer Grading System</strong>:</p>

  <div class="step-grid">
    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Layer 1 · Shared</span>
        <span class="step-time">50% Consortium Weight</span>
      </div>
      <div class="step-title">Collaborative Team Products (Shared Rubric)</div>
      <p style="margin:0; font-size:0.92rem;">Joint team deliverables, comparative case matrices, and co-created artifacts are evaluated using shared 4-tier assessment rubrics. Faculty instructors calibrate their evaluations together to ensure parity.</p>
    </div>

    <div class="step-card">
      <div class="step-header">
        <span class="step-num">Layer 2 · Sovereign</span>
        <span class="step-time">50% Local Weight</span>
      </div>
      <div class="step-title">Individual Reflection &amp; Local Mastery (Campus Sovereign)</div>
      <p style="margin:0; font-size:0.92rem;">Individual learning logs, local fieldwork notes, and final reflective portfolios are graded sovereignly by each student\'s home campus instructor according to departmental expectations.</p>
    </div>
  </div>

  <h2>2. Sovereign Institutional Grading Scales</h2>
  <table>
    <thead>
      <tr>
        <th>Campus / University</th>
        <th>Official Institutional Grade Scale</th>
        <th>Consortium Equivalency Benchmark</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
        <td>${esc(x.course.assessmentObligations || 'Standard institutional scale (e.g. Letter Grades A-F, ECTS, or 0-10 numerical scale)')}</td>
        <td>Rubric ratings of Exemplary (4 pts) correspond to top-tier marks; Proficient (3 pts) corresponds to satisfactory institutional mastery.</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>3. Late Submission & Revision Policy</h2>
  <div class="card">
    <ul>
      <li><strong>Cross-Border Grace Period:</strong> Because teams operate across time zones, submissions are accepted up to 24 hours after the deadline with prior notice to team members and instructor.</li>
      <li><strong>Revision Opportunities:</strong> For formative milestones in Weeks 1–3, teams earning developing marks may revise and resubmit within 5 days based on instructor and peer feedback.</li>
    </ul>
  </div>

  <h2>4. Feedback & Grading Turnaround Standard</h2>
  <div class="lms-callout lms-callout-success">
    <div class="lms-callout-title">Our Commitment to Timely Feedback</div>
    <p style="margin:0;">All team submissions and reflective milestone assignments will be evaluated with detailed rubric feedback within <strong>7 calendar days</strong> of submission, allowing students to integrate insights into subsequent modules.</p>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Transparent Assessment Architecture Aligned.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for interactive rubrics & evaluation blueprint inside the LMS cartridge (Comprehensive Assessment Rubrics).
 */
function buildLmsRubrics(p) {
  const as = p.assessments || [];
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Assessment Architecture & Interactive Rubrics</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <div class="lms-badge-row">
      <span class="lms-badge gold">Interactive Rubrics</span>
      <span class="lms-badge">Assessment Standards Aligned</span>
    </div>
    <h1>Consortium Assessment &amp; Interactive Rubrics</h1>
    <div class="lms-meta">
      Calibrated evaluation matrices for collaborative deliverables, peer critique, and intercultural inquiry.
    </div>
  </div>

  <h2>Assessment Design Philosophy</h2>
  <p>Assessments in this consortium evaluate analytical reasoning, comparative evidence, and respectful engagement, <strong>not English fluency or localized dialect</strong>. Every student has an equitable opportunity to demonstrate mastery regardless of background.</p>

  <h2>Interactive Assessment Rubric Matrices</h2>
  ${as.length ? as.map((s, idx) => `
  <div class="card" style="margin-bottom: 36px;">
    <h3 style="margin-top:0; color:var(--primary); font-size:1.25rem;">
      Assessment ${idx + 1}: ${esc(s.title)}
      <span style="font-size:0.85rem; font-weight:normal; color:var(--text-muted); margin-left:8px;">[${esc(s.layer || 'Collaborative Deliverable')}]</span>
    </h3>
    <p style="color:var(--text-muted); font-size:0.92rem; margin-bottom:16px;">
      ${esc(s.description || 'Evaluated across 4 performance tiers aligned with consortium learning outcomes.')}
    </p>

    <table>
      <thead>
        <tr>
          <th style="width:24%;">Evaluation Criterion</th>
          <th style="width:19%;">Exemplary (4 Pts)</th>
          <th style="width:19%;">Proficient (3 Pts)</th>
          <th style="width:19%;">Developing (2 Pts)</th>
          <th style="width:19%;">Unsatisfactory (0-1 Pts)</th>
        </tr>
      </thead>
      <tbody>
        ${(s.criteria || [
          { name: 'Comparative Evidence Integration', description: 'Draws on and fairly analyzes situated data from all partner contexts.', levels: { exemplary: 'Seamlessly synthesizes evidence from all campuses with critical nuance.', proficient: 'Accurately integrates evidence from partner contexts.', developing: 'Relies primarily on home context with superficial partner mentions.', beginning: 'Partner context absent or misrepresented.' } },
          { name: 'Critical Engagement & Revision', description: 'Shows how partner critique revised initial hypotheses.', levels: { exemplary: 'Explicitly demonstrates evolution of thinking in response to international peers.', proficient: 'Substantively addresses partner critique.', developing: 'Acknowledges partner views without revising own stance.', beginning: 'No visible engagement with partner critique.' } },
          { name: 'Disciplinary Analysis & Rigor', description: 'Methodologically sound reasoning evaluated on depth, not linguistic fluency.', levels: { exemplary: 'Rigorous, well-justified analytical conclusions.', proficient: 'Sound disciplinary reasoning with minor gaps.', developing: 'Partially supported assertions.', beginning: 'Unsupported claims.' } }
        ]).map(c => `
        <tr>
          <td>
            <strong>${esc(c.name)}</strong><br>
            <small style="color:var(--text-muted);">${esc(c.description || '')}</small>
          </td>
          <td>${esc(c.levels?.exemplary || 'Consistently exceeds standard with deep comparative insight.')}</td>
          <td>${esc(c.levels?.proficient || 'Meets full standard with sound evidence and analysis.')}</td>
          <td>${esc(c.levels?.developing || 'Shows basic effort with noticeable gaps in partner integration.')}</td>
          <td>${esc(c.levels?.beginning || 'Fails to meet standard; missing critical partner data.')}</td>
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="font-size:0.88rem; color:var(--text-muted); margin-top:12px; padding:10px 14px; background:var(--surface); border-radius:6px; border:1px solid var(--border-subtle);">
      <strong>Local Grade Allocation:</strong> ${ps.map(x => `${esc(x.institution)}: ${s.local?.[x.id]?.weight ?? 25}% of course grade`).join(' · ')}
    </div>
  </div>`).join('') : `
  <div class="card">
    <p>Standard course quality aligned rubric applied across all weekly milestones.</p>
  </div>
  `}

  <div class="footer">
    Crosscourse LMS Cartridge Export · Course Quality Standards Aligned Rubrics.
  </div>
</body>
</html>`;
}

/**
 * Builds the IMS Common Cartridge imsmanifest.xml file.
 * Formats modules and resource items according to IMS CC 1.1 specifications.
 */
function buildImsManifestXML(p, files) {
  const uid = 'xc_' + Math.random().toString(36).slice(2, 10);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));

  let orgItems = `
      <item identifier="mod_orientation">
        <title>Module 0: Start Here : Course Orientation &amp; Consortium Governance</title>
        <item identifier="item_start_here" identifierref="res_start_here">
          <title>[START HERE] Course Welcome &amp; Orientation Guide</title>
        </item>
        <item identifier="item_syl" identifierref="res_syl">
          <title>Consortium Course Syllabus &amp; Alignment Matrix</title>
        </item>
        <item identifier="item_guide" identifierref="res_guide">
          <title>Student Onboarding &amp; Cross-Border Collaboration Guide</title>
        </item>
        <item identifier="item_charter" identifierref="res_charter">
          <title>Consortium Partnership Charter &amp; Governance Accord</title>
        </item>
        <item identifier="item_glossary" identifierref="res_glossary">
          <title>Cross-Cultural Disciplinary Glossary</title>
        </item>
        <item identifier="item_support" identifierref="res_support">
          <title>Institutional Support Services, Accessibility &amp; Accommodations</title>
        </item>
      </item>
  `;

  acts.forEach((a, idx) => {
    const weekNum = idx + 1;
    const stage = (a.stage || 'cocreate').toUpperCase();
    orgItems += `
      <item identifier="mod_week_${weekNum}">
        <title>Week ${weekNum}: ${esc(a.title)} (${stage} · ${a.sync ? 'Live Workshop' : 'Asynchronous'})</title>
        <item identifier="item_act_${weekNum}" identifierref="res_act_${weekNum}">
          <title>[GRADED TASK] Week ${weekNum}: ${esc(a.title)}</title>
        </item>
      </item>
    `;
  });

  orgItems += `
      <item identifier="mod_assessment">
        <title>Consortium Assessment &amp; Interactive Rubrics</title>
        <item identifier="item_grading_policy" identifierref="res_grading_policy">
          <title>Course Grading Architecture &amp; Sovereign Weighting Policy</title>
        </item>
        <item identifier="item_rubrics" identifierref="res_rubrics">
          <title>Assessment Architecture &amp; Interactive Rubrics</title>
        </item>
      </item>
  `;

  let resources = `
    <resource identifier="res_start_here" type="webcontent" href="start_here.html">
      <file href="start_here.html"/>
    </resource>
    <resource identifier="res_syl" type="webcontent" href="syllabus.html">
      <file href="syllabus.html"/>
    </resource>
    <resource identifier="res_guide" type="webcontent" href="student_guide.html">
      <file href="student_guide.html"/>
    </resource>
    <resource identifier="res_charter" type="webcontent" href="charter.html">
      <file href="charter.html"/>
    </resource>
    <resource identifier="res_glossary" type="webcontent" href="glossary.html">
      <file href="glossary.html"/>
    </resource>
    <resource identifier="res_support" type="webcontent" href="support_accessibility.html">
      <file href="support_accessibility.html"/>
    </resource>
    <resource identifier="res_grading_policy" type="webcontent" href="assessments/grading_policy.html">
      <file href="assessments/grading_policy.html"/>
    </resource>
    <resource identifier="res_rubrics" type="webcontent" href="assessments/rubrics.html">
      <file href="assessments/rubrics.html"/>
    </resource>
  `;

  acts.forEach((a, idx) => {
    const weekNum = idx + 1;
    resources += `
    <resource identifier="res_act_${weekNum}" type="webcontent" href="modules/week_${weekNum}_activity.html">
      <file href="modules/week_${weekNum}_activity.html"/>
    </resource>
    `;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="CC_MANIFEST_${uid}" 
  xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" 
  xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p1.xsd">
  <metadata>
    <schema>IMS Common Cartridge</schema>
    <schemaversion>1.1.0</schemaversion>
    <lom:lom>
      <lom:general>
        <lom:title>
          <lom:string language="en">${esc(p.title)}</lom:string>
        </lom:title>
        <lom:description>
          <lom:string language="en">Higher Education Course Quality Standards aligned consortium course co-designed with Crosscourse.</lom:string>
        </lom:description>
      </lom:general>
    </lom:lom>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1" structure="rooted-hierarchy">
      <item identifier="root">
        ${orgItems}
      </item>
    </organization>
  </organizations>
  <resources>
    ${resources}
  </resources>
</manifest>`;
}

/**
 * Builds the full file bundle for the LMS cartridge.
 */
export function buildLmsCartridgeFiles(p) {
  const files = [];

  // Core Web Content Documents (Module 0 & Governance)
  files.push({ name: 'start_here.html', content: buildLmsStartHere(p) });
  files.push({ name: 'syllabus.html', content: buildLmsSyllabus(p) });
  files.push({ name: 'student_guide.html', content: buildLmsStudentGuide(p) });
  files.push({ name: 'charter.html', content: buildLmsCharter(p) });
  files.push({ name: 'glossary.html', content: buildLmsGlossary(p) });
  files.push({ name: 'support_accessibility.html', content: buildLmsSupportAccessibility(p) });

  // Assessments & Rubrics Module
  files.push({ name: 'assessments/grading_policy.html', content: buildLmsGradingPolicy(p) });
  files.push({ name: 'assessments/rubrics.html', content: buildLmsRubrics(p) });

  // Weekly Activity Modules
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  acts.forEach((a, idx) => {
    files.push({
      name: `modules/week_${idx + 1}_activity.html`,
      content: buildLmsActivity(p, a, idx + 1)
    });
  });

  // Canvas / LMS Manifest
  files.push({
    name: 'imsmanifest.xml',
    content: buildImsManifestXML(p, files)
  });

  // Canvas-specific course settings text indicator
  files.push({
    name: 'course_settings/canvas_export.txt',
    content: `Crosscourse Course Export for Canvas / Blackboard / Moodle / Brightspace\nTitle: ${p.title}\nStandard: Higher Education Course Quality Standards & IMS CC 1.1\nExported: ${new Date().toISOString()}\n`
  });

  return files;
}

/**
 * Generates and downloads the LMS cartridge as .imscc or .zip.
 */
export function downloadLmsCartridge(p, asZip = false) {
  const files = buildLmsCartridgeFiles(p);
  const zipBytes = createZip(files);
  const ext = asZip ? '.zip' : '.imscc';
  const filename = `${slug(p.title)}-lms-cartridge${ext}`;
  const mime = asZip ? 'application/zip' : 'application/vnd.ims.imscc.cartridge';

  const blob = new Blob([zipBytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 800);
}
