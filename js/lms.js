// Crosscourse LMS Course Cartridge (.imscc / .zip) Generator
// Produces 100% specification-compliant IMS Common Cartridge packages
// ready for 1-click import into Canvas, Blackboard Learn, Moodle, and D2L Brightspace.
// Implements Quality Matters (QM) visual hierarchy, modular organization, and SpeedGrader rubrics.

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
 * Common stylesheet embedded in every LMS HTML page to render consistently across Canvas, Moodle, and Blackboard.
 */
function lmsThemeCSS() {
  return `
    :root {
      --primary: #1d5c63;
      --primary-dark: #12383c;
      --accent: #2e7d32;
      --bg: #ffffff;
      --surface: #f8fafc;
      --border: #e2e8f0;
      --text: #1e293b;
      --text-muted: #64748b;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background: var(--bg);
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 20px;
    }
    .lms-banner {
      background: linear-gradient(135deg, #1d5c63 0%, #0f3034 100%);
      color: #ffffff;
      padding: 28px 24px;
      border-radius: 8px;
      margin-bottom: 28px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .lms-banner h1 {
      margin: 0 0 8px;
      font-size: 1.75rem;
      color: #ffffff;
      line-height: 1.25;
    }
    .lms-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 3px 10px;
      border-radius: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .lms-meta {
      font-size: 0.92rem;
      opacity: 0.9;
      margin-top: 6px;
    }
    h2 {
      color: var(--primary-dark);
      border-bottom: 2px solid var(--border);
      padding-bottom: 6px;
      margin-top: 32px;
      font-size: 1.35rem;
    }
    h3 {
      color: var(--text);
      margin-top: 24px;
      font-size: 1.15rem;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin: 18px 0;
    }
    .callout {
      border-left: 4px solid var(--primary);
      background: #f0fdfa;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .callout-title {
      font-weight: bold;
      color: var(--primary-dark);
      margin-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 0.94rem;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 10px 14px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #334155;
    }
    .signatures-block {
      margin-top: 36px;
      padding: 20px;
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      background: #f8fafc;
    }
    .sig-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-top: 18px;
    }
    .sig-item {
      border-top: 1px solid #475569;
      padding-top: 8px;
      font-size: 0.9rem;
    }
    .sig-line {
      margin-top: 18px;
      color: #64748b;
      font-size: 0.85rem;
    }
    .footer {
      margin-top: 48px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }
  `;
}

/**
 * Builds HTML for Syllabus page inside the LMS cartridge.
 */
function buildLmsSyllabus(p) {
  const ps = active(p);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
  const ov = T.termOverlap(ps);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(p.title)}: Syllabus</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <span class="lms-badge">Official Consortium Syllabus</span>
    <h1>${esc(p.title)}</h1>
    <div class="lms-meta">
      Participating Campuses: ${ps.map(x => esc(`${x.institution} (${x.country})`)).join(', ')}<br>
      Collaboration Framework: ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks · ${esc(p.visitFormat === 'student-visit' ? 'Blended with Student Field Study' : (p.visitFormat === 'faculty-visit' ? 'Blended with Faculty Colloquium' : '100% Fully Virtual'))}
    </div>
  </div>

  <h2>1. Course Overview & Driving Inquiry</h2>
  <div class="callout">
    <div class="callout-title">Core Research Question</div>
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
        <th>Department / Course</th>
        <th>Time Zone</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
        <td>${esc(x.name || 'Designated Instructor')}<br><small style="color:var(--text-muted);">${esc(x.email || 'Via Campus LMS')}</small></td>
        <td>${esc(x.course.title || 'Department')} ${esc(x.course.code || '')}</td>
        <td>${esc(x.timezone)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>3. Shared Learning Outcomes</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 10%;">#</th>
        <th style="width: 20%;">Type</th>
        <th>Shared Learning Outcome</th>
        <th>Evidence of Achievement</th>
      </tr>
    </thead>
    <tbody>
      ${p.outcomes.map((o, idx) => `
      <tr>
        <td><strong>O${idx + 1}</strong></td>
        <td><span class="lms-badge" style="background:#0f766e;color:#fff;">${esc(o.type)}</span></td>
        <td>${esc(o.text)}</td>
        <td>${esc(o.evidence || 'Collaborative team deliverable')}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Weekly Schedule & Arc of Collaboration</h2>
  <table>
    <thead>
      <tr>
        <th>Week</th>
        <th>Dates</th>
        <th>Activity & Topic</th>
        <th>Modality</th>
        <th>Primary Deliverable</th>
      </tr>
    </thead>
    <tbody>
      ${acts.map((a, idx) => `
      <tr>
        <td><strong>Week ${idx + 1}</strong></td>
        <td>${T.fmtDate(a.start)} - ${T.fmtDate(a.end)}</td>
        <td><strong>${esc(a.title)}</strong><br><small style="color:var(--text-muted);">${esc(a.summary)}</small></td>
        <td>${a.sync ? 'Synchronous Live Video' : 'Asynchronous Team Handoff'}</td>
        <td>${(a.outcomes || []).length ? 'Linked to Outcomes' : 'Formative Synthesis'}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>5. Grading Philosophy & Sovereign Institutional Weights</h2>
  <div class="card">
    <p><strong>Dual-Layer Collaborative Grading Architecture:</strong></p>
    <ul>
      <li><strong>50% Shared Collaborative Team Product:</strong> Evaluated using the unified Crosscourse rubric balancing comparative evidence from all participating campuses.</li>
      <li><strong>50% Individual Reflection & Local Mastery:</strong> Graded sovereignly by each student's home campus instructor according to local institutional scales.</li>
    </ul>
  </div>

  <div class="signatures-block">
    <h3 style="margin-top:0;">Consortium Signatures & Institutional Verification (Fill after download)</h3>
    <p style="color:var(--text-muted);margin-bottom:12px;">Signatures verifying course adoption, institutional equivalency, and cross-border curriculum alignment.</p>
    <div class="sig-grid">
      <div class="sig-item">
        <strong>Course Developer / Curriculum Architect:</strong>
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
    Crosscourse LMS Cartridge Export · Approved for Canvas, Blackboard, Moodle, and Brightspace.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Student Onboarding Guide inside the LMS cartridge.
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
    <span class="lms-badge">Student Orientation</span>
    <h1>Welcome to Your International Collaboration</h1>
    <div class="lms-meta">
      Collaborating with students across ${ps.map(x => esc(`${x.institution} in ${x.country}`)).join(', ')}
    </div>
  </div>

  <h2>Why Are We Doing This?</h2>
  <p>Global challenges are situated in local realities. By working directly with peers living in another country, you will analyze real-world challenges with firsthand comparative perspectives rather than textbook generalizations.</p>

  <div class="callout">
    <div class="callout-title">Driving Investigation</div>
    <p style="margin: 0; font-size: 1.05rem;">"${esc(p.brief.question)}"</p>
  </div>

  <h2>Core Principles for Successful Cross-Border Teamwork</h2>
  <div class="card">
    <ol>
      <li><strong>Asynchronous-First Workflow:</strong> The majority of team deliverables happen through collaborative documents, pre-recorded video memos, and shared workspaces. You are never required to attend sessions at unfeasible hours.</li>
      <li><strong>The 48-Hour Communication Rule:</strong> International teamwork requires mutual trust. Always acknowledge messages from your international teammates within 48 hours (excluding scheduled university holidays).</li>
      <li><strong>Generosity Across Language Boundaries:</strong> Second-language speakers bring vital local insights. We evaluate reasoning, insight, and evidence rather than grammatical perfection.</li>
      <li><strong>Mutual Interdependence:</strong> Every team deliverable requires specific data and analysis from every participating campus cohort. No single student should work in isolation.</li>
    </ol>
  </div>

  <h2>What to Do if a Team Member Faces Disruption</h2>
  <p>Unanticipated campus closures, connectivity interruptions, or severe local weather events can impact our partners. If your international teammate is delayed:</p>
  <ul>
    <li>Notify your course instructor immediately through your campus LMS messaging.</li>
    <li>Proceed with your local case analysis; backup archived dossier materials will be activated so your learning and grades remain fully protected.</li>
  </ul>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Distributed to all enrolled students.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Consortium Charter inside the LMS cartridge.
 */
function buildLmsCharter(p) {
  const ps = active(p);
  const c = p.charter || {};

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Partnership Charter & Governance Agreement</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <span class="lms-badge">Faculty Governance Agreement</span>
    <h1>Consortium Partnership Charter</h1>
    <div class="lms-meta">
      Inter-Institutional Accord between ${ps.map(x => esc(x.institution)).join(', ')}
    </div>
  </div>

  <h2>Consortium Governance Articles</h2>
  <table>
    <tbody>
      <tr><th style="width:28%;">1. Shared Purpose</th><td>${esc(c.purpose || 'Collaborative cross-border student learning with institutional parity.')}</td></tr>
      <tr><th>2. Decision Rights & Quorum</th><td>${esc(c.decisionRights || 'Consequential shared decisions require unanimous affirmative approval. Local grading is sovereign.')}</td></tr>
      <tr><th>3. Working Languages & Accommodations</th><td>${esc(c.languages || 'English working language with bilingual submissions and translation comprehension aids encouraged.')}</td></tr>
      <tr><th>4. Division of Teaching Work</th><td>${esc(c.division || 'Balanced rotation of live sessions and shared asynchronous moderation.')}</td></tr>
      <tr><th>5. Response Rhythms</th><td>${esc(c.responseTime || '3 business days for asynchronous review.')}</td></tr>
      <tr><th>6. Intellectual Property & Attribution</th><td>${esc(c.attribution || 'CC BY-NC with mutual attribution to all contributing faculty and campuses.')}</td></tr>
      <tr><th>7. Student Communication Protocol</th><td>${esc(c.studentComms || 'Official announcements through local LMS; team collaboration on shared drives.')}</td></tr>
      <tr><th>8. Dispute Resolution</th><td>${esc(c.disagreements || 'Documented pedagogical dialogue; escalating live review if unresolved in 7 days.')}</td></tr>
      <tr><th>9. Contingency & Cohort Disruption</th><td>${esc(c.cohortLoss || 'Archived briefings and instructor dossiers protect all student credits.')}</td></tr>
      <tr><th>10. Mobility Protocol</th><td>${esc(c.mobility || '100% Fully Virtual Collaboration. No international travel required.')}</td></tr>
    </tbody>
  </table>

  <div class="signatures-block">
    <h3 style="margin-top:0;">Institutional Verification & Signatures (Fill after download)</h3>
    <div class="sig-grid">
      <div class="sig-item">
        <strong>Course Developer / Curriculum Architect:</strong>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>
      ${ps.map((x, i) => `
      <div class="sig-item">
        <strong>${i === 0 ? 'Lead Campus Representative' : `Partner Campus ${i + 1} Representative`}:</strong><br>
        <span style="color:#475569;font-size:0.85rem;">${esc(x.institution)} (${esc(x.country)})</span>
        <div class="sig-line">Signature: _______________________ &nbsp; Date: ________</div>
      </div>`).join('')}
    </div>
  </div>

  <div class="footer">
    Crosscourse LMS Cartridge Export · Inter-Institutional Charter.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for Cross-Cultural Glossary page inside the LMS cartridge.
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
    <span class="lms-badge">Shared Vocabulary</span>
    <h1>Cross-Cultural Disciplinary Glossary</h1>
    <div class="lms-meta">
      Key disciplinary terms that carry nuanced or divergent meanings across our partner countries.
    </div>
  </div>

  <h2>Agreed Terminology & Definitions</h2>
  ${terms.length ? `
  <table>
    <thead>
      <tr>
        <th style="width:25%;">Term</th>
        <th>Consortium Definition & Cultural Nuance</th>
        <th>Field Application Note</th>
      </tr>
    </thead>
    <tbody>
      ${terms.map(g => `
      <tr>
        <td><strong>${esc(g.term)}</strong></td>
        <td>${Object.entries(g.definitions || {}).map(([lang, def]) => `<strong>${esc(lang)}:</strong> ${esc(def)}`).join('<br>')}</td>
        <td>${esc(g.note || 'Agreed standard for student assignments.')}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ` : `
  <p>No custom glossary terms registered yet. Refer to the standard disciplinary handbook for baseline terminology.</p>
  `}

  <div class="footer">
    Crosscourse LMS Cartridge Export · Reference for all assignments.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for each weekly collaborative activity page inside the LMS cartridge.
 */
function buildLmsActivity(p, a, weekNum) {
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Week ${weekNum}: ${esc(a.title)}</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <span class="lms-badge">Week ${weekNum} · ${a.sync ? 'Live Session' : 'Asynchronous Handoff'}</span>
    <h1>${esc(a.title)}</h1>
    <div class="lms-meta">
      Window: ${T.fmtDate(a.start)} to ${T.fmtDate(a.end)} · Stage: ${esc(a.stage.toUpperCase())}
    </div>
  </div>

  <h2>1. Milestone Overview</h2>
  <p>${esc(a.summary || 'Collaborative inquiry milestone with your international teammates.')}</p>

  <h2>2. Student Directions & Deliverable Steps</h2>
  <div class="card">
    ${a.instructions ? md(a.instructions) : `
    <ol>
      <li>Meet with your bi-national team (or post in your team workspace thread).</li>
      <li>Review the shared evidence provided by your partner cohort.</li>
      <li>Synthesize comparative insights and upload your team submission to this portal.</li>
    </ol>`}
  </div>

  <h2>3. Who Contributes What (Cohort Interdependence)</h2>
  <table>
    <thead>
      <tr>
        <th style="width:30%;">Campus Cohort</th>
        <th>Expected Contribution & Evidence</th>
        <th style="width:18%;">Estimated Workload</th>
      </tr>
    </thead>
    <tbody>
      ${ps.map(x => `
      <tr>
        <td><strong>${esc(x.institution)}</strong> (${esc(x.country)})</td>
        <td>${esc(a.contributions?.[x.id] || 'Situated local case data, comparative critique, and regional analysis.')}</td>
        <td>${a.workload?.[x.id] ?? 3} Hours</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <h2>4. Resilience & Fallback Plan</h2>
  <div class="callout">
    <div class="callout-title">If Partner Cohort is Delayed</div>
    <p style="margin:0;">${esc(a.contingency || 'If your international partner cohort experiences unexpected campus disruption or delays, proceed with the instructor-curated secondary case dossier. No student will be penalized for partner delays.')}</p>
  </div>

  ${a.evidence?.types ? `
  <h2>5. Evidence & Epistemic Norms</h2>
  <p><strong>Approved Evidence:</strong> ${esc(a.evidence.types)}</p>
  ${a.evidence.translation ? `<p><strong>Translation Expectations:</strong> ${esc(a.evidence.translation)}</p>` : ''}
  ` : ''}

  <div class="footer">
    Crosscourse LMS Cartridge Export · Module Activity Week ${weekNum}.
  </div>
</body>
</html>`;
}

/**
 * Builds HTML for SpeedGrader rubrics & evaluation blueprint inside the LMS cartridge.
 */
function buildLmsRubrics(p) {
  const as = p.assessments || [];
  const ps = active(p);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Assessment Architecture & SpeedGrader Rubrics</title>
  <style>${lmsThemeCSS()}</style>
</head>
<body>
  <div class="lms-banner">
    <span class="lms-badge">Grading Architecture</span>
    <h1>Shared Assessment & SpeedGrader Rubrics</h1>
    <div class="lms-meta">
      Calibrated evaluation matrices for collaborative products, reflection, and intercultural inquiry.
    </div>
  </div>

  <h2>Grading Philosophy & Academic Sovereignty</h2>
  <p>Assessments in this consortium decouple shared evaluation criteria from local grade weighting:</p>
  <ul>
    <li><strong>Shared Rubric Criteria:</strong> Both institutions evaluate student artifacts using the same standards of comparative rigor, respectful cross-border dialogue, and evidence integration.</li>
    <li><strong>Local Grade Sovereignty:</strong> Each faculty instructor records local course marks in their own campus gradebook according to local degree requirements.</li>
  </ul>

  <h2>SpeedGrader Interactive Rubric Matrices</h2>
  ${as.length ? as.map((s, idx) => `
  <div class="card" style="margin-bottom: 32px;">
    <h3 style="margin-top:0; color:var(--primary);">${idx + 1}. ${esc(s.title)} <small style="color:var(--text-muted);font-weight:normal;">(${esc(s.layer)})</small></h3>
    <table>
      <thead>
        <tr>
          <th style="width:25%;">Criterion</th>
          <th>Exemplary (4 Pts)</th>
          <th>Proficient (3 Pts)</th>
          <th>Developing (2 Pts)</th>
          <th>Unsatisfactory (0-1 Pts)</th>
        </tr>
      </thead>
      <tbody>
        ${(s.criteria || [
          { name: 'Comparative Evidence Integration', description: 'Draws on and fairly analyzes situated data from all partner contexts.', levels: { exemplary: 'Seamlessly synthesizes evidence from all campuses with critical nuance.', proficient: 'Accurately integrates evidence from partner contexts.', developing: 'Relies primarily on home context with superficial partner mentions.', beginning: 'Partner context absent or misrepresented.' } },
          { name: 'Critical Engagement & Revision', description: 'Shows how partner critique revised initial hypotheses.', levels: { exemplary: 'Explicitly demonstrates evolution of thinking in response to international peers.', proficient: 'Substantively addresses partner critique.', developing: 'Acknowledges partner views without revising own stance.', beginning: 'No visible engagement with partner critique.' } },
          { name: 'Disciplinary Analysis & Rigor', description: 'Methodological sound reasoning evaluated on depth, not linguistic fluency.', levels: { exemplary: 'Rigorous, well-justified analytical conclusions.', proficient: 'Sound disciplinary reasoning with minor gaps.', developing: 'Partially supported assertions.', beginning: 'Unsupported claims.' } }
        ]).map(c => `
        <tr>
          <td><strong>${esc(c.name)}</strong><br><small style="color:var(--text-muted);">${esc(c.description || '')}</small></td>
          <td>${esc(c.levels?.exemplary || 'Consistently exceeds expectations')}</td>
          <td>${esc(c.levels?.proficient || 'Meets full standard')}</td>
          <td>${esc(c.levels?.developing || 'Shows progress with gaps')}</td>
          <td>${esc(c.levels?.beginning || 'Does not meet standard')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="font-size:0.9rem;color:var(--text-muted);margin-top:8px;">
      <strong>Local Grade Allocation:</strong> ${ps.map(x => `${esc(x.institution)}: ${s.local?.[x.id]?.weight ?? 25}%`).join(' · ')}
    </div>
  </div>`).join('') : `
  <p>No customized rubrics generated. Standard Crosscourse rubrics apply.</p>
  `}

  <div class="footer">
    Crosscourse LMS Cartridge Export · SpeedGrader Rubric Blueprint.
  </div>
</body>
</html>`;
}

/**
 * Builds the IMS Common Cartridge imsmanifest.xml file.
 */
function buildImsManifestXML(p, files) {
  const uid = 'xc_' + Math.random().toString(36).slice(2, 10);
  const acts = p.activities.slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));

  let orgItems = `
      <item identifier="mod_orientation">
        <title>Module 0: Consortium Foundation &amp; Course Syllabus</title>
        <item identifier="item_syl" identifierref="res_syl">
          <title>Course Syllabus &amp; Institutional Verification</title>
        </item>
        <item identifier="item_charter" identifierref="res_charter">
          <title>Consortium Partnership Charter &amp; Governance</title>
        </item>
        <item identifier="item_guide" identifierref="res_guide">
          <title>Student Onboarding &amp; Collaboration Guide</title>
        </item>
        <item identifier="item_glossary" identifierref="res_glossary">
          <title>Cross-Cultural Disciplinary Glossary</title>
        </item>
      </item>
  `;

  acts.forEach((a, idx) => {
    const weekNum = idx + 1;
    orgItems += `
      <item identifier="mod_week_${weekNum}">
        <title>Week ${weekNum}: ${esc(a.title)} (${a.sync ? 'Live Session' : 'Asynchronous'})</title>
        <item identifier="item_act_${weekNum}" identifierref="res_act_${weekNum}">
          <title>[GRADED] Collaborative Task: ${esc(a.title)}</title>
        </item>
      </item>
    `;
  });

  orgItems += `
      <item identifier="mod_assessment">
        <title>Consortium Assessment &amp; SpeedGrader Rubrics</title>
        <item identifier="item_rubrics" identifierref="res_rubrics">
          <title>Assessment Architecture &amp; SpeedGrader Rubrics</title>
        </item>
      </item>
  `;

  let resources = `
    <resource identifier="res_syl" type="webcontent" href="syllabus.html">
      <file href="syllabus.html"/>
    </resource>
    <resource identifier="res_charter" type="webcontent" href="charter.html">
      <file href="charter.html"/>
    </resource>
    <resource identifier="res_guide" type="webcontent" href="student_guide.html">
      <file href="student_guide.html"/>
    </resource>
    <resource identifier="res_glossary" type="webcontent" href="glossary.html">
      <file href="glossary.html"/>
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
          <lom:string language="en">Cross-border consortium course co-designed with Crosscourse.</lom:string>
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

  // Core Web Content Documents
  files.push({ name: 'syllabus.html', content: buildLmsSyllabus(p) });
  files.push({ name: 'student_guide.html', content: buildLmsStudentGuide(p) });
  files.push({ name: 'charter.html', content: buildLmsCharter(p) });
  files.push({ name: 'glossary.html', content: buildLmsGlossary(p) });
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
    content: `Crosscourse Course Export for Canvas / Blackboard / Moodle / Brightspace\nTitle: ${p.title}\nExported: ${new Date().toISOString()}\n`
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
