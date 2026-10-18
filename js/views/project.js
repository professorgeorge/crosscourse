import { app } from '../app.js';
import * as S from '../store.js';
import { esc, icon, field, chip, badge, modal, toast, fmtAgo, pickFile, confirmBox, empty, renderCoach, md, download } from '../ui.js';
import { stageProgress, releaseGate, decisionStatus, runChecks } from '../checks.js';
import { fmtTime, tzAbbrev, termOverlap, buildICS } from '../time.js';
import { packageHTML, packageMD } from './sync.js';
import { partnerFormFields } from './home.js';
import { propose, proposalsFor } from './proposals.js';
import { aiEnabled, runTask } from '../ai.js';

const pn = (p, id) => p.partners.find(x => x.id === id);
export const head = (title, sub = '', actions = '') => `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p class="lede">${sub}</p>` : ''}</div>${actions ? `<div class="row gap wrap">${actions}</div>` : ''}</header>`;
export const statusBadge = s => badge(({ draft: 'Draft', pending: 'Awaiting approval', approved: 'Approved', changed: 'Changed since approval', objection: 'Objection raised' })[s] || s, 'st-' + s);
export const approvalBtn = (kind, id, title, status) => status === 'pending' ? `<a class="btn sm" href="#/p/${app.p.id}/decisions">${icon.vote} View approval</a>` : `<button class="btn sm" data-action="request-approval" data-kind="${kind}" data-id="${id}" data-title="${esc(title)}">${icon.vote} ${status === 'approved' ? 'Re-open for approval' : 'Request partner approval'}</button>`;

import { getMobilityLabel, realignProjectArc } from '../autopilot.js';
import { downloadLmsCartridge } from '../lms.js';

// ================= Overview (3-Pillar Unified Blueprint) =================
app.view('overview', {
  render({ p, me }) {
    const s = app.settings;
    const curPillar = app._activePillar || 1;
    const lastSeen = s.lastSeen[p.id] || '1970';
    const since = p.events.filter(e => e.at > lastSeen && e.by !== me?.id).slice(-12).reverse();
    const myDecisions = me ? p.decisions.filter(d => { const st = decisionStatus(p, d); return st.waiting.includes(me.id) && st.status !== 'approved'; }) : [];
    const pending = p.proposals.filter(x => x.status === 'pending');
    const conflicts = (p.conflicts || []).filter(c => !c.resolved);
    const gate = releaseGate(p);
    const F = runChecks(p);
    const blockers = F.filter(f => f.severity === 'blocker').length, discuss = F.filter(f => f.severity === 'discuss').length, missing = F.filter(f => f.severity === 'missing').length;
    const ov = termOverlap(p.partners);
    const nowD = new Date();
    const acts = (p.activities || []).slice().sort((a, b) => (a.start || '9').localeCompare(b.start || '9'));
    const liveActs = acts.filter(a => a.sync).length;
    const asyncActs = acts.length - liveActs;

    return `<div class="page">
      <header class="page-head">
        <div class="grow">
          <p class="eyebrow">${p.mode === 'course' ? 'Co-Developed Course' : 'Shared International Module'} · ${p.partners.length} Universities Consortium</p>
          <h1 class="editable"><input class="title-input" data-model="title" value="${esc(p.title)}" aria-label="Project title"></h1>
          <div class="chips">${p.partners.map(x => chip(x, { me: x.id === me?.id })).join('')}</div>
        </div>
        <div class="row gap wrap">
          <button class="btn primary" data-action="open-download-pack">${icon.download} Download Course Pack</button>
          <button class="btn" data-action="customize-collab-format">${icon.plus} Pacing &amp; Format</button>
          <a class="btn" href="#/p/${p.id}/sync">${icon.sync} Share &amp; Sync</a>
        </div>
      </header>

      <!-- AI Co-Design Assistant Quick Help (Zero Friction, Low Learning Curve) -->
      <div class="card ai-assistant-hero-bar" style="margin-bottom: var(--space-3); padding: var(--space-3) var(--space-4); background: linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08)); border: 1px solid rgba(99, 102, 241, 0.35); border-radius: var(--radius-lg);">
        <div class="row between wrap gap" style="align-items: center;">
          <div class="row gap" style="align-items: center;">
            <span style="font-size: 1.4rem; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: rgba(99, 102, 241, 0.15); border-radius: 50%;">✨</span>
            <div>
              <strong style="font-size: 0.95rem; color: var(--color-text);">AI Co-Design Assistant Ready</strong>
              <p class="muted small" style="margin: 2px 0 0;">Zero learning curve: Click any quick action below to draft, align, or refine your consortium course with AI assistance.</p>
            </div>
          </div>
          <div class="row gap wrap">
            <button type="button" class="btn sm primary" data-action="ai-quick-refine-all">${icon.sparkle} 1-Click AI Polish (All Pillars)</button>
            <button type="button" class="btn sm" data-action="ai-refine-driving-question">${icon.sparkle} Refine Driving Question</button>
            <button type="button" class="btn sm" data-action="ai-draft-outcomes">${icon.sparkle} Draft Outcomes</button>
            <button type="button" class="btn sm" data-action="ai-generate-arc">${icon.sparkle} Auto-Balance Weekly Arc</button>
          </div>
        </div>
      </div>

      <!-- 3-Pillar Navigation Bar -->
      <nav class="blueprint-nav" aria-label="Course Blueprint Pillars">
        <button type="button" class="blueprint-tab ${curPillar === 1 ? 'active' : ''}" data-action="switch-blueprint-pillar" data-pillar="1">
          <strong>${icon.users} Pillar 1: Consortium &amp; Vision</strong>
          <span class="subtext">${p.partners.length} Universities · Driving Challenge &amp; Charter</span>
        </button>
        <button type="button" class="blueprint-tab ${curPillar === 2 ? 'active' : ''}" data-action="switch-blueprint-pillar" data-pillar="2">
          <strong>${icon.sparkle} Pillar 2: Weekly Arc &amp; Activities</strong>
          <span class="subtext">${acts.length} Milestones (${liveActs} live, ${asyncActs} async)</span>
        </button>
        <button type="button" class="blueprint-tab ${curPillar === 3 ? 'active' : ''}" data-action="switch-blueprint-pillar" data-pillar="3">
          <strong>${icon.download} Pillar 3: Classroom Deliverables</strong>
          <span class="subtext">5 Ready-to-Use Packages · Syllabus, Handouts &amp; Calendar</span>
        </button>
      </nav>

      <!-- Pillar 1 Content: Consortium & Vision -->
      ${curPillar === 1 ? `
      <div class="stack gap">
        <!-- Quick Consortium Scope & Alignment Bar -->
        <div class="card collab-format-card" style="margin: 0; padding: var(--space-3) var(--space-4);">
          <div class="row between wrap gap" style="align-items: center;">
            <div class="row gap wrap" style="align-items: center;">
              <span class="badge badge-ok">${p.partners.length} Campuses in Consortium</span>
              <span class="badge ${p.durationWeeks <= 7 ? 'badge-live' : 'badge-ok'}">${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks (${p.durationWeeks <= 7 ? 'Accelerated Intensive' : 'Full Semester'})</span>
              <span class="badge badge-async">${getMobilityLabel(p.visitFormat, p.customVisitFormat)}</span>
            </div>
            <div class="row gap wrap">
              <button class="btn sm" data-action="customize-collab-format">${icon.plus} Customize Duration &amp; Mobility</button>
              <button class="btn sm ghost" data-action="ai-resync-format">${icon.sparkle} AI: Re-Align Arc</button>
            </div>
          </div>
        </div>

        <!-- Multi-Campus Cards (2 to 9 Universities) -->
        <section class="card">
          <div class="section-head" style="margin-bottom: var(--space-3);">
            <div>
              <h2 style="font-size: 1.15rem; margin: 0;">Participating Universities &amp; Cohort Profiles</h2>
              <p class="muted small" style="margin: 4px 0 0;">Each institution maintains sovereign grading while collaborating within shared learning milestones.</p>
            </div>
            <a href="#/p/${p.id}/partners" class="btn sm">${icon.eye} View Full Context Cards</a>
          </div>

          <div class="campus-grid">
            ${p.partners.map((x, idx) => `
              <div class="campus-intake-card" style="border-left: 4px solid ${x.color || S.PARTNER_COLORS[idx % S.PARTNER_COLORS.length]}; padding: var(--space-3);">
                <div class="row between wrap gap" style="align-items: baseline; margin-bottom: 6px;">
                  <strong style="font-size: 0.95rem; color: var(--color-text);">${esc(x.institution)}</strong>
                  <span class="badge ${idx === 0 ? 'badge-ok' : 'badge-async'}" style="font-size: 11px;">
                    ${idx === 0 ? 'Lead Institution' : `Partner Campus ${idx + 1}`}
                  </span>
                </div>
                <div style="font-size: 0.85rem; margin-bottom: 4px;">
                  Faculty: <strong>${esc(x.name || 'Faculty Representative')}</strong>
                  ${x.country ? ` · <span class="muted">${esc(x.country)}</span>` : ''}
                </div>
                <div style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 6px;">
                  Course: <strong>${esc(x.course?.title || 'Collaborative Seminar')}</strong> (${esc(x.course?.code || 'INT')})
                </div>
                <div class="row between wrap gap" style="font-size: 0.8rem; background: var(--color-surface-2); padding: 4px 8px; border-radius: 4px; margin-bottom: 8px;">
                  <span>Time Zone: <strong>${esc(tzAbbrev(x.timezone))}</strong></span>
                  <span class="mono">${fmtTime(nowD, x.timezone, { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style="font-size: 0.82rem; color: var(--color-text-muted); margin: 0; line-height: 1.4;">
                  <strong>Cohort:</strong> ${esc((x.course?.purpose || x.contributes || '').slice(0, 120))}${((x.course?.purpose || x.contributes || '').length > 120) ? '...' : ''}
                </p>
                <div style="margin-top: 8px;">
                  <a href="#/p/${p.id}/partners/${x.id}" class="small" style="font-weight: 500;">Edit Campus Profile &rarr;</a>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Core Inquiry Vision & Value Test -->
        <section class="card">
          <div class="section-head">
            <div>
              <h2 style="font-size: 1.15rem; margin: 0;">Shared Driving Inquiry Vision</h2>
              <span class="muted small">Joint inquiry challenge and pedagogical value test</span>
            </div>
            <div class="row gap wrap">
              <button type="button" class="btn sm" data-action="ai-refine-driving-question">${icon.sparkle} AI: Refine Vision</button>
              <a href="#/p/${p.id}/frame" class="btn sm ghost">${icon.edit || icon.sparkle} Edit Details</a>
            </div>
          </div>
          <div class="grid2 gap" style="margin-top: var(--space-3);">
            <div style="background: var(--color-surface-2); padding: var(--space-3); border-radius: var(--radius-md);">
              <span class="muted small" style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Core Shared Challenge</span>
              <p style="margin: 6px 0 0; font-size: 1rem; font-weight: 500;">${esc(p.brief?.challenge || 'International collaborative inquiry')}</p>
            </div>
            <div style="background: var(--color-surface-2); padding: var(--space-3); border-radius: var(--radius-md);">
              <span class="muted small" style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Driving Inquiry Question</span>
              <p style="margin: 6px 0 0; font-size: 1rem; font-weight: 500; color: var(--color-primary);">${esc(p.brief?.question || 'How do our regional cohorts investigate this challenge together?')}</p>
            </div>
          </div>
          <div style="margin-top: var(--space-3); padding-top: var(--space-2); border-top: 1px solid var(--color-border); font-size: 0.9rem; line-height: 1.5;">
            <strong>Pedagogical Value Test:</strong> ${esc(p.brief?.counterfactual || 'Without this cross-country partnership, students would analyze the topic only through a single domestic lens.')}
          </div>
        </section>

        <!-- Multilateral Consortium Charter -->
        <section class="card">
          <div class="section-head">
            <div>
              <h2 style="font-size: 1.15rem; margin: 0;">Consortium Charter &amp; Governance Compact</h2>
              <span class="muted small">Ratified decision rules across all ${p.partners.length} institutions</span>
            </div>
            <div class="row gap wrap">
              <button type="button" class="btn sm" data-action="ai-refine-charter">${icon.sparkle} AI: Draft Charter Terms</button>
              <a href="#/p/${p.id}/charter" class="btn sm ghost">${icon.shield} View Full Charter</a>
            </div>
          </div>
          <div class="grid2 gap" style="margin-top: var(--space-3); font-size: 0.88rem;">
            <div>
              <strong>Consortium Purpose:</strong>
              <p class="muted" style="margin: 4px 0 10px;">${esc(p.charter?.purpose || '')}</p>
              <strong>Decision Rights &amp; Sovereignty:</strong>
              <p class="muted" style="margin: 4px 0 0;">${esc(p.charter?.decisionRights || 'Multilateral consensus for shared deliverables; local grading sovereign.')}</p>
            </div>
            <div>
              <strong>Communication &amp; Languages:</strong>
              <p class="muted" style="margin: 4px 0 10px;">${esc(p.charter?.languages || 'English for coordination with multilingual support.')}</p>
              <strong>Delivery &amp; Mobility Format:</strong>
              <p class="muted" style="margin: 4px 0 0;">${esc(p.charter?.mobility || getMobilityLabel(p.visitFormat))}</p>
            </div>
          </div>
        </section>
      </div>` : ''}

      <!-- Pillar 2 Content: Weekly Arc & Multi-Campus Activities -->
      ${curPillar === 2 ? `
      <div class="stack gap">
        <div class="card collab-format-card" style="margin: 0; padding: var(--space-3) var(--space-4);">
          <div class="row between wrap gap" style="align-items: center;">
            <div>
              <strong>${acts.length} Milestones across ${p.durationWeeks || (p.mode === 'course' ? 14 : 5)} Weeks</strong>
              <span class="muted small" style="margin-left: 8px;">
                ${ov.ok ? `Shared teaching window: ${ov.start} to ${ov.end} (${ov.weeks} shared weeks)` : 'Aligned schedule across all partner campuses'}
              </span>
            </div>
            <div class="row gap wrap">
              <button class="btn sm" data-action="customize-collab-format">${icon.plus} Re-Space Weeks</button>
              <button class="btn sm ghost" data-action="ai-resync-format">${icon.sparkle} AI: Auto-Balance</button>
            </div>
          </div>
        </div>

        <section class="card" style="padding: var(--space-4);">
          <div class="section-head" style="margin-bottom: var(--space-3);">
            <div>
              <h2 style="font-size: 1.15rem; margin: 0;">Weekly Collaborative Learning Sequence</h2>
              <span class="muted small">Chronological arc with cohort tasks for every participating university</span>
            </div>
            <div class="row gap wrap">
              <button type="button" class="btn sm" data-action="ai-generate-arc">${icon.sparkle} AI: Auto-Balance Weeks</button>
              <a href="#/p/${p.id}/arc" class="btn sm ghost">${icon.sparkle} Advanced Arc Editor</a>
            </div>
          </div>

          <div class="arc-timeline">
            ${acts.map((a, i) => `
              <div class="arc-week-card">
                <div class="row between wrap gap" style="align-items: baseline; margin-bottom: 8px;">
                  <div class="row gap wrap" style="align-items: center;">
                    <span class="badge ${a.sync ? 'badge-live' : 'badge-async'}">${a.sync ? 'Live Session' : 'Asynchronous'}</span>
                    <strong style="font-size: 1.05rem;">Week ${i + 1}: ${esc(a.title)}</strong>
                  </div>
                  <span class="muted small font-mono">${a.start || ''} &rarr; ${a.end || ''}</span>
                </div>
                ${a.summary ? `<p style="margin: 0 0 10px; font-size: 0.92rem; color: var(--color-text);">${esc(a.summary)}</p>` : ''}

                <!-- Multi-Campus Cohort Contributions -->
                <div style="margin: 10px 0; padding: var(--space-2) var(--space-3); background: var(--color-surface-2); border-radius: var(--radius-md);">
                  <span class="small" style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: var(--color-text-muted);">Cohort Roles Across Campuses:</span>
                  <div class="arc-cohort-pills">
                    ${p.partners.map((ptn, ptnIdx) => {
                      const roleText = a.contributions?.[ptn.id] || (ptn.id === a.owner ? 'Lead coordination and briefing' : 'Collaborative critique and synthesis');
                      const pColor = ptn.color || S.PARTNER_COLORS[ptnIdx % S.PARTNER_COLORS.length];
                      return `
                        <div class="cohort-pill" style="border-left: 3px solid ${pColor};">
                          <span class="campus-badge-dot" style="background: ${pColor};"></span>
                          <strong>${esc(ptn.institution)}:</strong>
                          <span style="color: var(--color-text);">${esc(roleText)}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>

                ${a.instructions ? `
                  <div style="margin-top: 10px; font-size: 0.88rem; line-height: 1.5; color: var(--color-text-muted);">
                    <strong style="color: var(--color-text);">Student Directions:</strong>
                    <div style="margin-top: 4px;">${md(a.instructions)}</div>
                  </div>
                ` : ''}

                ${a.contingency ? `
                  <div style="margin-top: 8px; font-size: 0.82rem; color: var(--color-text-faint);">
                    <em>Contingency:</em> ${esc(a.contingency)}
                  </div>
                ` : ''}

                <div class="row between wrap gap" style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--color-border); align-items: center;">
                  <span class="muted small font-mono">${a.sync ? 'Live Session across Time Zones' : 'Flexible Asynchronous Workflow'}</span>
                  <button type="button" class="btn sm text" data-action="ai-draft-week" data-id="${a.id}">
                    ${icon.sparkle} AI: Elaborate Directions &amp; Roles
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>` : ''}

      <!-- Pillar 3 Content: Classroom Deliverables -->
      ${curPillar === 3 ? `
      <div class="stack gap">
        <div class="card collab-format-card" style="margin: 0; padding: var(--space-4); background: var(--color-surface-2);">
          <div class="row between wrap gap" style="align-items: center;">
            <div>
              <h2 style="font-size: 1.25rem; margin: 0 0 4px;">Ready-to-Teach Classroom Deliverables</h2>
              <p class="muted small" style="margin: 0;">Everything is approved, formatted, and ready for your classroom LMS. No further manual steps required.</p>
            </div>
            <button class="btn primary lg" data-action="open-download-pack">
              ${icon.download} Download Complete Pack (.ZIP)
            </button>
          </div>
        </div>

        <div class="deliverable-grid">
          <!-- 0. LMS Cartridge (Canvas / Blackboard / Moodle / Brightspace) -->
          <div class="deliverable-card" style="border: 2px solid var(--primary); background: #f0fdfa;">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-ok">Canvas / Moodle / Blackboard</span>
                <span class="muted small">IMS Common Cartridge (.IMSCC)</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">LMS Course Cartridge</h3>
              <p class="muted small" style="line-height: 1.4;">Universal 1-click import package (.imscc) with complete weekly modules, assignments, student instructions, and SpeedGrader rubrics.</p>
            </div>
            <div class="row gap wrap" style="width: 100%;">
              <button class="btn primary" data-action="dl-pack-lms-imscc" style="flex: 1;">
                ${icon.package} Export Cartridge (.IMSCC)
              </button>
              <button class="btn" data-action="dl-pack-lms-zip" style="flex: 1;">
                ${icon.download} Web Zip (.ZIP)
              </button>
            </div>
          </div>

          <!-- 1. Syllabus -->
          <div class="deliverable-card">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-ok">Ready to Distribute</span>
                <span class="muted small">HTML / PDF</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">1. Approved Course Syllabus</h3>
              <p class="muted small" style="line-height: 1.4;">Complete multi-campus syllabus with driving challenge, curriculum alignment matrix across all ${p.partners.length} universities, weekly arc, and 4-level rubric.</p>
            </div>
            <button class="btn primary" data-action="open-syllabus-print" style="width: 100%;">
              ${icon.download} Print or Save Syllabus PDF
            </button>
          </div>

          <!-- 2. Student Guide -->
          <div class="deliverable-card">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-ok">Ready for LMS</span>
                <span class="muted small">Markdown (.MD)</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">2. Student Activity Guide &amp; Handouts</h3>
              <p class="muted small" style="line-height: 1.4;">Week-by-week instructions, team working compact templates, and step-by-step assignments for student teams.</p>
            </div>
            <button class="btn" data-action="dl-pack-student-guide" style="width: 100%;">
              ${icon.download} Download Handouts (.MD)
            </button>
          </div>

          <!-- 3. Charter -->
          <div class="deliverable-card">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-ok">Ratified</span>
                <span class="muted small">HTML Document</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">3. Consortium Partnership Charter</h3>
              <p class="muted small" style="line-height: 1.4;">Official multilateral inter-institutional agreement specifying decision protocols, sovereign grading, and IP attribution.</p>
            </div>
            <button class="btn" data-action="dl-pack-charter-html" style="width: 100%;">
              ${icon.download} Download Charter (.HTML)
            </button>
          </div>

          <!-- 4. Calendar -->
          <div class="deliverable-card">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-live">Synchronized</span>
                <span class="muted small">iCalendar (.ICS)</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">4. Synchronized Consortium Calendar</h3>
              <p class="muted small" style="line-height: 1.4;">Universal calendar feed with all live sessions, handoff windows, and project milestones across all time zones.</p>
            </div>
            <button class="btn" data-action="dl-pack-calendar-ics" style="width: 100%;">
              ${icon.download} Download Calendar (.ICS)
            </button>
          </div>

          <!-- 5. Portable Project File -->
          <div class="deliverable-card">
            <div>
              <div class="row between wrap gap" style="margin-bottom: 8px;">
                <span class="badge badge-async">Exportable</span>
                <span class="muted small">JSON</span>
              </div>
              <h3 style="margin: 0 0 6px; font-size: 1.1rem;">5. Portable Crosscourse File</h3>
              <p class="muted small" style="line-height: 1.4;">Complete backup file of this course. Share with colleagues or reload on any device running Crosscourse.</p>
            </div>
            <button class="btn" data-action="dl-pack-project-json" style="width: 100%;">
              ${icon.download} Export Project (.JSON)
            </button>
          </div>
        </div>

        <div class="banner info" style="margin-top: var(--space-4);">
          ${icon.shield}
          <div>
            <strong>Classroom-Ready Verification:</strong> All downloaded documents (Syllabus, Student Handouts, and Consortium Charter) include dedicated signature and verification lines for course developers and instructors across all ${p.partners.length} partner universities to enter after download.
          </div>
        </div>
      </div>` : ''}

      <!-- Collapsed Advanced Co-Design Diagnostics & Tools Drawer -->
      <details class="card" style="margin-top: var(--space-4); background: var(--color-surface-2);">
        <summary style="cursor: pointer; font-weight: 600; padding: var(--space-2) 0;">
          ${icon.check} Advanced Co-Design Diagnostics &amp; Alignment Tools (${blockers} blockers, ${gate.filter(g => g.ok).length}/${gate.length} release criteria met)
        </summary>
        <div class="dash" style="margin-top: var(--space-3);">
          <section class="card span2">
            <div class="section-head"><h2>Waiting on you</h2></div>
            ${myDecisions.length ? `<ul class="todo">${myDecisions.map(d => `<li><a href="#/p/${p.id}/decisions/${d.id}">Approval needed: ${esc(d.title)}</a></li>`).join('')}</ul>` : `<p class="muted">All approvals and context cards up to date.</p>`}
          </section>
          <section class="card">
            <div class="section-head"><h2>Alignment Health</h2><a href="#/p/${p.id}/review" class="small">Review &rarr;</a></div>
            <div class="kpis"><div class="kpi ${blockers ? 'bad' : ''}"><strong>${blockers}</strong><span>blockers</span></div><div class="kpi"><strong>${discuss}</strong><span>discuss</span></div><div class="kpi"><strong>${missing}</strong><span>missing</span></div></div>
          </section>
          <section class="card span2">
            <div class="section-head"><h2>Recent Consortium Events</h2></div>
            ${since.length ? `<ul class="feed">${since.map(e => `<li><span><strong>${esc(pn(p, e.by)?.name || 'Consortium Member')}</strong> ${esc(e.summary)}</span></li>`).join('')}</ul>` : `<p class="muted">No recent events.</p>`}
          </section>
          <section class="card">
            <div class="section-head"><h2>Campus Clocks</h2></div>
            <ul class="clock-list">${p.partners.map(x => `<li>${chip(x, { small: true })}<span class="mono">${fmtTime(nowD, x.timezone, { weekday: 'short' })}</span></li>`).join('')}</ul>
          </section>
        </div>
      </details>
    </div>`;
  }
});

// ================= Partners =================
function stateBadge(p, x, key) {
  const st = x.fieldStates?.[key];
  if (!st || !(x.course[key] || '').toString().trim()) return '';
  const own = app.me?.id === x.id;
  return ` <span class="state s-${st}">${S.FIELD_STATES[st]}</span>${own && st !== 'confirmed' ? ` <button type="button" class="link small" data-action="confirm-field" data-pid="${x.id}" data-key="${key}">Confirm</button>` : ''}`;
}

app.view('partners', {
  render({ p, me, params }) {
    const tab = params[0] || me?.id || p.partners[0]?.id || 'compare';
    const tabs = `<div class="tabs" role="tablist">${p.partners.map(x => `<a role="tab" href="#/p/${p.id}/partners/${x.id}" class="tab ${tab === x.id ? 'active' : ''}" ${tab === x.id ? 'aria-selected="true"' : ''}><span class="dot" style="--c:${x.color}"></span>${esc(x.institution || x.name)}${x.id === me?.id ? ' <em class="you">you</em>' : ''}</a>`).join('')}<a role="tab" href="#/p/${p.id}/partners/compare" class="tab ${tab === 'compare' ? 'active' : ''}">Compare side by side</a></div>`;
    const actions = `<button class="btn primary" data-action="add-partner">${icon.plus} Invite a partner</button>`;
    let content;
    if (tab === 'compare') content = compareView(p);
    else { const x = pn(p, tab); content = x ? partnerCard(p, x, me) : empty('Partner not found', ''); }
    return `<div class="page">${head('Partners & context cards', 'Each partner describes their own course and constraints first. The comparison shows differences; it doesn’t average them away.', actions)}
      ${renderCoach({
        stage: 'Stage 1: Institutional Context',
        title: 'Context Cards & Cohort Profile Coach',
        goal: 'Solid partnerships start with transparency about local realities. Each partner details their academic calendar, student demographics, linguistic background, and technical constraints before designing activities.',
        actions: [{ action: 'ai-coach', data: { stage: 'partners' }, label: 'Coach tips on context gaps', icon: 'sparkle' }],
        tips: [
          'Are term dates entered accurately with all campus holidays and exam breaks?',
          'What digital tools are officially approved and accessible without paywalls or VPNs?',
          'What local disciplinary outcomes must this international module satisfy for your institution?'
        ]
      })}
      ${proposalsFor(p, ['coach'])}
      ${tabs}${content}</div>`;
  }
});

function partnerCard(p, x, me) {
  const P = `partners[${x.id}]`;
  const own = me?.id === x.id;
  const c = x.course;
  const f = (k, o = {}) => field(S.COURSE_FIELDS.find(z => z[0] === k)[1], `${P}.course.${k}`, c[k], Object.assign({ badge: stateBadge(p, x, k) }, o));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `
  ${x.isAi ? `<div class="banner info" style="margin-bottom: var(--space-3);">${icon.sparkle}<span><strong>International AI Simulation Colleague:</strong> ${esc(x.name)} is wearing the hat of a faculty member at ${esc(x.institution)} in ${esc(x.country)}. This context card reflects authentic academic calendar dates, student cohort background, local learning outcomes, and technical access constraints.</span></div>` : ''}
  ${!own && !x.isAi ? `<div class="banner info">${icon.alert}<span>This is ${esc(x.name || 'a partner')}’s card. You can add notes, but your edits are marked <em>Reported</em> until ${esc(x.name || 'they')} confirm${x.name ? 's' : ''} them.</span></div>` : ''}
  <div class="cols">
    <div class="col-main stack">
      <section class="card">
        <div class="section-head"><h2>Course</h2>
          <div class="row gap"><button class="btn sm" data-action="extract-syllabus" data-pid="${x.id}">${icon.upload} Import from syllabus</button></div></div>
        <div class="grid2">${f('title')}${f('code')}${f('level')}${f('discipline')}${f('studentsCount', { type: 'number' })}${f('workloadHoursPerWeek', { type: 'number', step: '0.5' })}</div>
        ${f('purpose', { type: 'textarea' })}${f('priorities', { type: 'textarea' })}${f('interculturalAims', { type: 'textarea' })}
      </section>
      ${proposalsFor({ ...p, proposals: p.proposals.filter(y => y.partnerId === x.id) }, ['extract'])}
      <section class="card">
        <div class="section-head"><h2>Local course outcomes</h2><button class="btn sm" data-action="add-local-outcome" data-pid="${x.id}">${icon.plus} Add</button></div>
        <p class="hint">Shared outcomes are mapped onto these, so the collaboration counts in each course.</p>
        ${c.localOutcomes.length ? `<ol class="lo-list">${c.localOutcomes.map(o => `<li><input data-model="${P}.course.localOutcomes[${o.id}].text" value="${esc(o.text)}" aria-label="Local outcome"><button class="icon-btn" data-action="del-local-outcome" data-pid="${x.id}" data-id="${o.id}" aria-label="Remove">${icon.trash}</button></li>`).join('')}</ol>` : `<p class="muted small">None yet.</p>`}
      </section>
      <section class="card">
        <h2>Students, constraints & care</h2>
        ${f('languages', { type: 'textarea', rows: 2 })}${f('studentAvailability', { type: 'textarea', rows: 2 })}
        <div class="grid2">${f('tech', { type: 'textarea', rows: 2 })}${f('techRestrictions', { type: 'textarea', rows: 2 })}</div>
        ${f('assessmentObligations', { type: 'textarea', rows: 2 })}${f('accessibility', { type: 'textarea', rows: 2 })}${f('careTopics', { type: 'textarea', rows: 2 })}${f('constraints', { type: 'textarea', rows: 2 })}${f('hopes', { type: 'textarea', rows: 2 })}
      </section>
    </div>
    <aside class="col-side stack">
      <section class="card">
        <h2>Profile</h2>
        ${field('Name', `${P}.name`, x.name)}${field('Institution', `${P}.institution`, x.institution)}
        <div class="grid2">${field('Country', `${P}.country`, x.country)}${field('Language', `${P}.language`, x.language)}</div>
        ${field('Email', `${P}.email`, x.email, { type: 'email' })}
        ${field('Time zone', `${P}.timezone`, x.timezone, { list: 'tz-list', hint: 'IANA name, e.g. America/Recife' })}
        ${field('Role', `${P}.role`, x.role, { type: 'select', options: [['representative', 'Representative (approves)'], ['co-designer', 'Co-designer']], rerender: true })}
        ${field('Status', `${P}.status`, x.status, { type: 'select', options: [['active', 'Active'], ['invited', 'Invited'], ['paused', 'Paused'], ['withdrawn', 'Withdrawn']], rerender: true })}
        ${p.partners.length > 1 ? `<button class="btn sm danger ghost" data-action="remove-partner" data-pid="${x.id}">${icon.trash} Remove partner</button>` : ''}
      </section>
      <section class="card">
        <h2>Working hours</h2>
        <p class="hint">Used for live-session planning. Flexible hours are times this partner could stretch to occasionally.</p>
        <div class="grid2">${field('Core from', `${P}.workStart`, x.workStart, { type: 'time' })}${field('Core to', `${P}.workEnd`, x.workEnd, { type: 'time' })}${field('Flexible from', `${P}.flexStart`, x.flexStart, { type: 'time' })}${field('Flexible to', `${P}.flexEnd`, x.flexEnd, { type: 'time' })}</div>
        <fieldset class="days"><legend>Working days</legend>${days.map((d, i) => `<label class="day"><input type="checkbox" data-model="${P}.workDays" data-array-value="${i}" ${x.workDays.includes(i) ? 'checked' : ''}><span>${d}</span></label>`).join('')}</fieldset>
      </section>
      <section class="card">
        <h2>Term</h2>
        <div class="grid2">${f('termStart', { type: 'date', rerender: true })}${f('termEnd', { type: 'date', rerender: true })}</div>
        <h3 class="sub">Breaks & exam periods</h3>
        ${c.breaks.map(b => `<div class="break-row"><input aria-label="Label" data-model="${P}.course.breaks[${b.id}].label" value="${esc(b.label)}" placeholder="Label"><input type="date" aria-label="From" data-model="${P}.course.breaks[${b.id}].start" value="${esc(b.start)}"><input type="date" aria-label="To" data-model="${P}.course.breaks[${b.id}].end" value="${esc(b.end)}"><button class="icon-btn" data-action="del-break" data-pid="${x.id}" data-id="${b.id}" aria-label="Remove break">${icon.trash}</button></div>`).join('')}
        <button class="btn sm" data-action="add-break" data-pid="${x.id}">${icon.plus} Add break</button>
      </section>
      <section class="card">
        <div class="section-head"><h2>What we bring</h2><button type="button" class="btn sm" data-action="ai-partner-contribution" data-pid="${x.id}">${icon.sparkle} Draft cohort contribution</button></div>
        ${proposalsFor({ ...p, proposals: p.proposals.filter(y => y.partnerId === x.id) }, ['partnerContribution'])}
        ${field('Expertise, perspectives, resources this cohort contributes', `${P}.contributes`, x.contributes, { type: 'textarea', rows: 4 })}
      </section>
    </aside>
  </div>
  <datalist id="tz-list">${(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : []).map(t => `<option value="${t}">`).join('')}</datalist>`;
}

function compareView(p) {
  const rows = S.COURSE_FIELDS.filter(([k]) => !['code'].includes(k));
  return `<section class="card flush"><div class="table-wrap"><table class="tbl compare">
    <thead><tr><th scope="col">Field</th>${p.partners.map(x => `<th scope="col">${chip(x, { small: true })}</th>`).join('')}</tr></thead>
    <tbody>
      <tr><th scope="row">Time zone</th>${p.partners.map(x => `<td>${esc(x.timezone)}</td>`).join('')}</tr>
      <tr><th scope="row">Working language</th>${p.partners.map(x => `<td>${esc(x.language)}</td>`).join('')}</tr>
      ${rows.map(([k, l]) => `<tr><th scope="row">${esc(l)}</th>${p.partners.map(x => { const v = x.course[k]; const st = x.fieldStates?.[k]; return `<td>${v ? esc(v) : '<span class="muted">Not set</span>'}${v && st && st !== 'confirmed' ? ` <span class="state s-${st}">${S.FIELD_STATES[st]}</span>` : ''}</td>`; }).join('')}</tr>`).join('')}
      <tr><th scope="row">Local outcomes</th>${p.partners.map(x => `<td>${x.course.localOutcomes.length ? `<ol class="small">${x.course.localOutcomes.map(o => `<li>${esc(o.text)}</li>`).join('')}</ol>` : '<span class="muted">Not set</span>'}</td>`).join('')}</tr>
      <tr><th scope="row">What we bring</th>${p.partners.map(x => `<td>${esc(x.contributes) || '<span class="muted">Not set</span>'}</td>`).join('')}</tr>
    </tbody></table></div></section>
    <p class="hint">Next: classify the differences you see in the <a href="#/p/${p.id}/frame">design brief</a>: hard incompatibilities, negotiable preferences, productive differences, and unknowns.</p>`;
}

app.register({
  async 'add-partner'() {
    const r = await modal({ title: 'Invite an international partner', body: `${partnerFormFields({ role: 'representative', timezone: 'UTC' })}<p class="hint">After adding, Crosscourse downloads the project file and opens an email draft. Attach the file. Your partner opens it in Crosscourse and sends their update back.</p>`, actions: [{ label: 'Cancel', value: null }, { label: 'Add & prepare invitation', value: 'ok', kind: 'primary', validate: f => f.reportValidity() }] });
    if (!r?.value) return;
    const x = S.blankPartner({ ...r.data, status: 'invited' }, app.p.partners.length);
    app.mutate(pp => { app.touch(x); pp.partners.push(x); }, `Invited ${x.name} (${x.institution})`);
    app.actions['send-update']({ to: x.email, invite: '1' });
    app.go(`#/p/${app.p.id}/partners/${x.id}`);
  },
  async 'remove-partner'(d) {
    const x = pn(app.p, d.pid);
    if (!(await confirmBox('Remove partner?', `Remove ${x.name || x.institution} from this project? Consider setting their status to “Withdrawn” instead, which preserves the record.`, 'Remove'))) return;
    app.mutate(pp => { pp.partners = pp.partners.filter(y => y.id !== x.id); pp.tombstones.push(x.id); }, `Removed partner ${x.name}`);
    app.go(`#/p/${app.p.id}/partners`);
  },
  'confirm-field'(d) {
    const x = pn(app.p, d.pid);
    app.mutate(() => { x.fieldStates[d.key] = 'confirmed'; app.touch(x); }, `Confirmed “${S.COURSE_FIELDS.find(f => f[0] === d.key)?.[1]}” on own context card`);
  },
  'add-local-outcome'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.localOutcomes.push({ id: S.uid('lo_'), text: '' }); app.touch(x); }); },
  'del-local-outcome'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.localOutcomes = x.course.localOutcomes.filter(o => o.id !== d.id); app.touch(x); }); },
  'add-break'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.breaks.push({ id: S.uid('brk_'), label: '', start: '', end: '' }); app.touch(x); }); },
  'del-break'(d) { const x = pn(app.p, d.pid); app.mutate(() => { x.course.breaks = x.course.breaks.filter(o => o.id !== d.id); app.touch(x); }); },
  async 'extract-syllabus'(d, btn) {
    const x = pn(app.p, d.pid);
    const r = await modal({ title: 'Import from a syllabus', wide: true, body: `<p class="muted">Paste syllabus text, or load a .txt, .md, .pdf or .docx file. ${aiEnabled() ? 'The assistant will propose values; nothing is saved until you accept, and accepted values stay marked “Extracted” until ' + esc(x.name || 'the partner') + ' confirms them.' : 'Without an AI provider, only file text loading is available. Add a key in Settings to extract fields automatically.'}</p>
      <div class="row gap"><button type="button" class="btn sm" id="syl-file">${icon.upload} Load file</button><span class="muted small" id="syl-name"></span></div>
      <div class="field"><label for="syl-text">Syllabus text</label><textarea id="syl-text" name="text" rows="12"></textarea></div>`,
      actions: [{ label: 'Cancel', value: null }, { label: aiEnabled() ? 'Extract with assistant' : 'Close', value: aiEnabled() ? 'ok' : null, kind: 'primary' }],
      onOpen: dlg => dlg.querySelector('#syl-file').addEventListener('click', async () => {
        const f = await pickFile('.txt,.md,.pdf,.docx');
        if (!f) return;
        dlg.querySelector('#syl-name').textContent = 'Reading ' + f.name + '…';
        try { dlg.querySelector('#syl-text').value = await readDocText(f); dlg.querySelector('#syl-name').textContent = f.name; }
        catch (e) { dlg.querySelector('#syl-name').textContent = 'Could not read file: ' + e.message; }
      })
    });
    if (!r?.value || !r.data.text?.trim()) return;
    await propose('extract', { text: r.data.text, partnerName: x.institution || x.name }, { partnerId: x.id }, btn);
  }
});

async function readDocText(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) {
    const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let out = '';
    for (let i = 1; i <= Math.min(doc.numPages, 40); i++) { const pg = await doc.getPage(i); const t = await pg.getTextContent(); out += t.items.map(it => it.str).join(' ') + '\n\n'; }
    return out;
  }
  if (name.endsWith('.docx')) {
    const mod = await import('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/+esm');
    const m = mod.default || mod;
    const res = await m.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return res.value;
  }
  return await file.text();
}

// ================= Frame: design brief & differences =================
app.view('frame', {
  render({ p }) {
    const b = p.brief;
    const kinds = Object.entries(S.DIFF_KINDS);
    return `<div class="page">${head('Design brief', 'Frame a learning challenge that becomes possible only because your cohorts work together.', `<button class="btn primary" data-action="ai-refine-driving-question">${icon.sparkle} 1-Click AI Refine Vision</button><button class="btn" data-action="ai-brief">${icon.sparkle} Draft as Proposal</button><button class="btn" data-action="ai-common-ground">${icon.sparkle} Surface common ground & differences</button>`)}
      ${renderCoach({
        stage: 'Stage 2: Design Brief',
        title: 'Framing & Driving Question Coach',
        goal: 'Define a shared challenge that becomes possible only because your diverse cohorts work together. Preserve productive cultural and disciplinary differences rather than smoothing them away.',
        actions: [
          { action: 'ai-brief', label: 'Draft Shared Brief & Driving Question', icon: 'sparkle' },
          { action: 'ai-common-ground', label: 'Surface Common Ground & Differences', icon: 'sparkle' }
        ],
        tips: [
          'Counterfactual test: if one cohort disappeared, what learning would become impossible?',
          'Are differences categorized into productive contrasts vs hard operational blockers?',
          'Does the driving question invite authentic inquiry from both student cohorts?'
        ]
      })}
      ${proposalsFor(p, ['brief', 'commonGround', 'coach'])}
      <div class="cols">
        <section class="card col-main">
          <div class="section-head"><h2>Joint brief ${statusBadge(b.status)}</h2>${approvalBtn('brief', 'brief', 'Design brief', b.status)}</div>
          ${field('Shared learning challenge', 'brief.challenge', b.challenge, { placeholder: 'e.g. Evaluating flood-risk interventions across two coasts' })}
          ${field('Driving question students investigate together', 'brief.question', b.question, { type: 'textarea', rows: 2 })}
          ${field('Why this needs international collaboration', 'brief.whyInternational', b.whyInternational, { type: 'textarea', rows: 3, hint: 'What becomes possible only because these cohorts work together?' })}
          ${field('Counterfactual test: if one cohort disappeared, what learning would become impossible?', 'brief.counterfactual', b.counterfactual, { type: 'textarea', rows: 3, hint: 'If the honest answer is “nothing except an international audience”, the design needs attention.' })}
        </section>
        <aside class="col-side card">
          <div class="section-head"><h2>Common ground</h2><button class="icon-btn" data-action="add-cg" aria-label="Add common ground">${icon.plus}</button></div>
          ${p.commonGround.length ? `<ul class="plain stack-sm">${p.commonGround.map(c => `<li class="cg"><input data-model="commonGround[${c.id}].theme" value="${esc(c.theme)}" aria-label="Theme"><span class="muted small">${esc(c.evidence || '')}</span><button class="icon-btn" data-action="del-item" data-col="commonGround" data-id="${c.id}" aria-label="Remove">${icon.trash}</button></li>`).join('')}</ul>` : '<p class="muted small">Shared interests and overlapping aims appear here.</p>'}
        </aside>
      </div>
      <section class="section">
        <div class="section-head"><h2>Differences: preserved, not resolved</h2><button class="btn sm" data-action="add-diff">${icon.plus} Add a difference</button></div>
        <div class="board">${kinds.map(([k, v]) => `<div class="lane"><header><h3>${v.label}</h3><p class="muted small">${v.hint}</p></header>
          ${p.differences.filter(d => d.kind === k).map(d => `<article class="diff ${d.status}">
            <input class="diff-topic" data-model="differences[${d.id}].topic" value="${esc(d.topic)}" aria-label="Topic">
            <textarea data-model="differences[${d.id}].detail" rows="2" aria-label="Detail">${esc(d.detail)}</textarea>
            <div class="row gap between"><select data-model="differences[${d.id}].kind" data-rerender aria-label="Kind">${kinds.map(([kk, vv]) => `<option value="${kk}" ${kk === d.kind ? 'selected' : ''}>${vv.label}</option>`).join('')}</select>
            <label class="check small"><input type="checkbox" ${d.status === 'addressed' ? 'checked' : ''} data-action="toggle-diff" data-id="${d.id}"><span>Addressed</span></label>
            <button class="icon-btn" data-action="del-item" data-col="differences" data-id="${d.id}" aria-label="Remove">${icon.trash}</button></div>
          </article>`).join('') || '<p class="muted small lane-empty">None</p>'}</div>`).join('')}</div>
      </section>
    </div>`;
  }
});

app.register({
  'ai-coach'(d, btn) { return propose('coach', { stage: d.stage || 'overview' }, {}, btn); },
  'ai-partner-contribution'(d, btn) { return propose('partnerContribution', { partnerId: d.pid }, { partnerId: d.pid }, btn); },
  'ai-brief'(d, btn) { return propose('brief', {}, {}, btn); },
  'ai-charter'(d, btn) { return propose('charter', {}, {}, btn); },
  'ai-common-ground'(d, btn) { return propose('commonGround', {}, {}, btn); },
  'add-cg'() { app.mutate(pp => pp.commonGround.push({ id: S.uid('cg_'), theme: '', evidence: 'Added by ' + (app.me?.name || 'a partner'), updatedAt: S.now(), updatedBy: app.me?.id })); },
  'add-diff'() { app.mutate(pp => pp.differences.push({ id: S.uid('dif_'), topic: 'New difference', detail: '', kind: 'unknown', status: 'open', updatedAt: S.now(), updatedBy: app.me?.id }), 'Added a difference'); },
  'toggle-diff'(d, el) { const x = app.p.differences.find(y => y.id === d.id); app.mutate(() => { x.status = x.status === 'addressed' ? 'open' : 'addressed'; app.touch(x); }, `Marked difference “${x.topic}” ${x.status === 'addressed' ? 'open' : 'addressed'}`); },
  async 'del-item'(d) {
    if (!(await confirmBox('Delete this item?', 'It will also be removed from partners’ copies when they open your next update.', 'Delete'))) return;
    app.mutate(pp => { const it = pp[d.col].find(x => x.id === d.id); pp[d.col] = pp[d.col].filter(x => x.id !== d.id); pp.tombstones.push(d.id); return it; }, `Deleted ${d.col.replace(/s$/, '')}`);
  }
});

// ================= Charter =================
const CHARTER = [
  ['purpose', 'Shared purpose', 'Why are we doing this together? What does each partner want students to gain?'],
  ['decisionRights', 'Decision rights', 'Which decisions are shared, which are local, who represents each institution?'],
  ['languages', 'Languages of collaboration', 'Which languages for partner discussion, student work, and materials?'],
  ['division', 'Division of design & facilitation work', 'Who drafts, who facilitates which sessions, how is invisible labour shared?'],
  ['studentComms', 'Student communication responsibilities', 'Who communicates what to which students, through which channels?'],
  ['attribution', 'Attribution & reuse', 'Who may reuse the co-designed materials, and how are partners credited?'],
  ['disagreements', 'How disagreements are handled', 'e.g. articulate options asynchronously, then meet live if unresolved within a week'],
  ['withdrawal', 'Pausing or withdrawing', 'How a partner can pause or leave, and what notice is expected'],
  ['cohortLoss', 'If a cohort cannot participate', 'Strikes, closures, connectivity loss: what is the fallback for students?']
];
app.view('charter', {
  render({ p }) {
    const c = p.charter;
    const actions = `<button class="btn primary" data-action="ai-refine-charter">${icon.sparkle} 1-Click AI Auto-Fill Terms</button><button class="btn" data-action="ai-charter">${icon.sparkle} Propose charter draft</button>${approvalBtn('charter', 'charter', 'Partnership charter', c.status)}`;
    return `<div class="page narrow-ish">${head('Partnership charter', 'Agree how you will work together before designing what students will do.', actions)}
      <div class="row gap"><span>Status: ${statusBadge(c.status)}</span></div>
      ${renderCoach({
        stage: 'Stage 3: Partnership Charter',
        title: 'Partnership Charter Coach',
        goal: 'Agree on mutual expectations, response rhythms, attribution, and contingency plans before students are introduced to the collaboration.',
        actions: [{ action: 'ai-charter', label: 'Propose Complete Charter Draft', icon: 'sparkle' }],
        tips: [
          'What is the agreed response time for asynchronous reviews (e.g. 2 to 3 working days)?',
          'How will grading disagreements or cohort delays be handled?',
          'Who retains attribution and reuse rights to jointly developed materials?'
        ]
      })}
      ${proposalsFor(p, ['charter', 'coach'])}
      <section class="card stack">
        ${field('Expected response time for asynchronous requests (working days)', 'charter.responseDays', c.responseDays, { type: 'number', min: 1 })}
        ${CHARTER.map(([k, l, h]) => field(l, 'charter.' + k, c[k], { type: 'textarea', rows: 3, placeholder: h })).join('')}
        <div class="banner info">${icon.shield}<span>Built-in decision rules: consequential shared decisions need explicit approval from each affected institution’s representative. Silence is never treated as approval, and the most active editor never becomes owner by default.</span></div>
      </section>
    </div>`;
  }
});

app.register({
  'dl-pack-lms-imscc'() {
    const p = app.p;
    if (!p) return;
    downloadLmsCartridge(p, false);
    toast('Downloaded LMS Common Cartridge (.imscc) for Canvas, Blackboard, Moodle, and Brightspace!', 'ok');
  },
  'dl-pack-lms-zip'() {
    const p = app.p;
    if (!p) return;
    downloadLmsCartridge(p, true);
    toast('Downloaded LMS Web Package (.zip)!', 'ok');
  },
  'switch-blueprint-pillar'(d, el) {
    app._activePillar = parseInt(el?.dataset?.pillar, 10) || 1;
    app.render();
  },
  'open-syllabus-print'() {
    const p = app.p;
    if (!p) return;
    const html = packageHTML(p, null, false);
    const w = window.open('', '_blank');
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      setTimeout(() => { try { w.print(); } catch (err) {} }, 500);
    } else {
      download(`${(p.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-syllabus.html`, html, 'text/html');
    }
  },
  'dl-pack-student-guide'() {
    const p = app.p;
    if (!p) return;
    const content = packageMD(p);
    download(`${(p.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-student-guide.md`, content, 'text/markdown');
  },
  'dl-pack-charter-html'() {
    const p = app.p;
    if (!p) return;
    const c = p.charter || {};
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.title)}: Consortium Charter</title><style>body{font:16px/1.6 system-ui,-apple-system,sans-serif;max-width:850px;margin:40px auto;padding:0 24px;color:#222;}h1{border-bottom:2px solid #333;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}th{background:#f9f9f9;width:30%;}.signatures{margin-top:40px;display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:24px;}.sig-box{border-top:1px solid #666;padding-top:8px;margin-top:30px;}</style></head><body><h1>Multilateral Consortium Partnership Charter</h1><p><strong>Course:</strong> ${esc(p.title)}</p><p><strong>Participating Institutions (${p.partners.length} Campuses):</strong> ${p.partners.map(x => esc(`${x.institution} (${x.country})`)).join(', ')}</p><table><tr><th>Shared Purpose</th><td>${esc(c.purpose || 'Not set')}</td></tr><tr><th>Decision Rights & Quorum</th><td>${esc(c.decisionRights || 'Multilateral consensus')}</td></tr><tr><th>Languages</th><td>${esc(c.languages || 'Not set')}</td></tr><tr><th>Division of Responsibilities</th><td>${esc(c.division || 'Not set')}</td></tr><tr><th>Student Communications</th><td>${esc(c.studentComms || 'Not set')}</td></tr><tr><th>Attribution & IP</th><td>${esc(c.attribution || 'CC BY-NC')}</td></tr><tr><th>Dispute Resolution</th><td>${esc(c.disagreements || 'Asynchronous dialogue with escalating live review')}</td></tr><tr><th>Withdrawal & Parity</th><td>${esc(c.withdrawal || 'Two weeks notice')}</td></tr><tr><th>Contingency for Cohort Delays</th><td>${esc(c.cohortLoss || 'Archived briefings protect student credit')}</td></tr><tr><th>Mobility & Format</th><td>${esc(c.mobility || 'Collaborative format')}</td></tr></table><div class="signatures">${p.developerName ? `<div class="sig-box"><strong>${esc(p.developerName)}</strong><br><span style="color:#666;font-size:0.85rem;">Course Developer / Instructional Designer</span><br><span style="color:#777;font-size:0.85rem;">Curriculum Architect Signature</span></div>` : `<div class="sig-box"><div style="border-bottom:1px dashed #aaa;height:22px;margin-bottom:6px;"></div><span style="color:#666;font-size:0.85rem;">Course Developer / Instructional Designer</span><br><span style="color:#777;font-size:0.85rem;">Curriculum Architect Signature (Fillable)</span></div>`}${p.partners.map(x => `<div class="sig-box"><strong>${esc(x.name || 'Designated Instructor')}</strong><br>${esc(x.institution)} (${esc(x.country || 'International')})<br><span style="color:#777;font-size:0.85rem;">Representative Faculty Signature</span></div>`).join('')}</div></body></html>`;
    download(`${(p.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-charter.html`, html, 'text/html');
  },
  'dl-pack-calendar-ics'() {
    const p = app.p;
    if (!p) return;
    const evs = [
      ...p.activities.filter(a => a.start).map(a => ({ uid: a.id, title: `[Crosscourse] ${a.title}`, allDay: true, startYmd: a.start, endYmd: a.end || a.start, description: a.summary })),
      ...p.meetings.map(m => ({ uid: m.id, title: m.title, start: new Date(m.start), end: new Date(Date.parse(m.start) + m.duration * 60000), description: m.agenda, location: m.link }))
    ];
    download(`${(p.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-calendar.ics`, buildICS(evs), 'text/calendar');
  },
  'dl-pack-project-json'() {
    const p = app.p;
    if (!p) return;
    download(`${(p.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-consortium-course.json`, JSON.stringify(p, null, 2), 'application/json');
  },
  'update-course-developer'(d, el) {
    if (!app.p) return;
    app.p.developerName = (el.value || '').trim();
    S.saveProject(app.p);
  },
  'update-deliverable-faculty'(d, el) {
    if (!app.p) return;
    const ptn = app.p.partners.find(x => x.id === el.dataset.id);
    if (ptn) {
      ptn.name = (el.value || '').trim();
      S.saveProject(app.p);
    }
  },
  'update-deliverable-course'(d, el) {
    if (!app.p) return;
    const ptn = app.p.partners.find(x => x.id === el.dataset.id);
    if (ptn) {
      if (!ptn.course) ptn.course = {};
      ptn.course.title = (el.value || '').trim();
      S.saveProject(app.p);
    }
  },
  async 'ai-quick-refine-all'(d, el) {
    const p = app.p;
    if (!p) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Polishing...'; }
    try {
      const bRes = await runTask('brief', p);
      if (bRes?.result) {
        p.brief.challenge = bRes.result.challenge || p.brief.challenge;
        p.brief.question = bRes.result.question || p.brief.question;
        p.brief.whyInternational = bRes.result.whyInternational || p.brief.whyInternational;
        p.brief.counterfactual = bRes.result.counterfactual || p.brief.counterfactual;
      }
      const cRes = await runTask('charter', p);
      if (cRes?.result?.charter) {
        Object.assign(p.charter, cRes.result.charter);
      }
      realignProjectArc(p, { durationWeeks: p.durationWeeks, visitFormat: p.visitFormat });
      p.activities.forEach((act, idx) => {
        if (!act.contributions) act.contributions = {};
        p.partners.forEach((ptn, pIdx) => {
          if (!act.contributions[ptn.id]) {
            act.contributions[ptn.id] = pIdx === 0
              ? 'Lead coordination, contextual case briefing, and synthesis workshop'
              : `Share situated local data and collaborative peer critique from ${ptn.institution}`;
          }
        });
        if (!act.instructions) {
          act.instructions = `### Weekly Milestone Directions\n\n1. Review your international team's shared workspace and briefing notes.\n2. Complete your cohort's situated contribution for this week.\n3. Participate in asynchronous peer review with partner campus teammates.`;
        }
      });
      p.updatedAt = S.now();
      S.saveProject(p);
      app.render();
      toast(`AI Co-Design Assistant successfully polished all 3 pillars across ${p.partners.length} partner campuses!`, 'ok');
    } catch (err) {
      toast('Could not complete AI polish: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  },
  async 'ai-refine-driving-question'(d, el) {
    const p = app.p;
    if (!p) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Refining...'; }
    try {
      const bRes = await runTask('brief', p);
      if (bRes?.result) {
        p.brief.challenge = bRes.result.challenge || p.brief.challenge;
        p.brief.question = bRes.result.question || p.brief.question;
        p.brief.whyInternational = bRes.result.whyInternational || p.brief.whyInternational;
        p.brief.counterfactual = bRes.result.counterfactual || p.brief.counterfactual;
        p.brief.updatedAt = S.now();
        p.brief.updatedBy = app.me?.id || null;
        S.saveProject(p);
        app.render();
        toast('Driving inquiry vision refined with AI assistance!', 'ok');
      }
    } catch (err) {
      toast('Could not refine driving vision: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  },
  async 'ai-refine-charter'(d, el) {
    const p = app.p;
    if (!p) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Drafting...'; }
    try {
      const cRes = await runTask('charter', p);
      if (cRes?.result?.charter) {
        Object.assign(p.charter, cRes.result.charter);
        p.charter.updatedAt = S.now();
        p.charter.updatedBy = app.me?.id || null;
        S.saveProject(p);
        app.render();
        toast('Consortium charter terms updated with AI assistance!', 'ok');
      }
    } catch (err) {
      toast('Could not update charter: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  },
  async 'ai-draft-outcomes'(d, el) {
    const p = app.p;
    if (!p) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Drafting...'; }
    try {
      const oRes = await runTask('outcomes', p);
      if (oRes?.result?.outcomes?.length) {
        const oIds = ['out_1', 'out_2', 'out_3', 'out_4'];
        p.outcomes = oRes.result.outcomes.slice(0, 4).map((o, idx) => ({
          id: oIds[idx] || `out_${idx + 1}`,
          text: o.text,
          type: o.type || (idx % 2 === 1 ? 'intercultural' : 'disciplinary'),
          evidence: o.evidence || 'Collaborative comparative dossier',
          mappings: Object.fromEntries(p.partners.map((ptn, pIdx) => [
            ptn.id,
            pIdx === 0 ? ['lo_h1', 'lo_h2'] : [`lo_${ptn.id}_0`, `lo_${ptn.id}_1`]
          ])),
          status: 'approved',
          updatedAt: S.now(),
          updatedBy: app.me?.id || null
        }));
        S.saveProject(p);
        app.render();
        toast('Shared learning outcomes drafted with AI assistance!', 'ok');
      }
    } catch (err) {
      toast('Could not draft outcomes: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  },
  async 'ai-generate-arc'(d, el) {
    const p = app.p;
    if (!p) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Balancing...'; }
    try {
      realignProjectArc(p, { durationWeeks: p.durationWeeks, visitFormat: p.visitFormat });
      p.activities.forEach((act) => {
        if (!act.contributions) act.contributions = {};
        p.partners.forEach((ptn, pIdx) => {
          if (!act.contributions[ptn.id]) {
            act.contributions[ptn.id] = pIdx === 0 
              ? 'Lead coordination and comparative analysis'
              : `Situated regional evidence and peer review from ${ptn.institution}`;
          }
        });
      });
      S.saveProject(p);
      app.render();
      toast('Weekly learning arc auto-balanced across all consortium campuses!', 'ok');
    } catch (err) {
      toast('Could not auto-balance arc: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  },
  async 'ai-draft-week'(d, el) {
    const p = app.p;
    if (!p) return;
    const act = p.activities.find(a => a.id === d.id);
    if (!act) return;
    const oldHtml = el ? el.innerHTML : '';
    if (el) { el.disabled = true; el.innerHTML = '<span class="spinner"></span> Drafting...'; }
    try {
      const res = await runTask('instructions', p, { id: act.id });
      if (res?.result?.instructions) {
        act.instructions = res.result.instructions;
        if (!act.summary) act.summary = `Collaborative milestone for ${act.title}.`;
        if (!act.contributions) act.contributions = {};
        p.partners.forEach((ptn, idx) => {
          if (!act.contributions[ptn.id]) {
            act.contributions[ptn.id] = idx === 0 
              ? 'Lead coordination and context dossier' 
              : `Participate in joint inquiry and share situated data from ${ptn.institution}`;
          }
        });
        act.updatedAt = S.now();
        act.updatedBy = app.me?.id || null;
        S.saveProject(p);
        app.render();
        toast(`Drafted student instructions and roles for Week ${p.activities.indexOf(act) + 1}!`, 'ok');
      }
    } catch (err) {
      toast('Could not draft week directions: ' + err.message, 'warn');
    } finally {
      if (el) { el.disabled = false; el.innerHTML = oldHtml; }
    }
  }
});
