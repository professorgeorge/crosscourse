# Crosscourse

A shared workspace where professors in different countries co-design a collaborative international course or module, mostly asynchronously, with optional live sessions.

> Don't use AI to design an international course for professors. Use AI to help professors design it with one another.

Crosscourse is a static Progressive Web App (PWA). There is no server and no account system: every professor keeps the project on their own device and partners exchange small update files. It can be hosted free on GitHub Pages and installed on desktop or mobile.

## What it does

The workflow follows six design-thinking stages: **Understand → Frame → Explore → Prototype → Test → Commit**.

| Area | What professors do |
|---|---|
| Partners | Each partner fills in their own context card (course, students, calendar, working hours, constraints, accessibility). Fields carry provenance: reported, extracted, AI-inferred, confirmed. Optional syllabus import (PDF/DOCX/TXT). Side-by-side comparison: differences are shown, not averaged. |
| Design brief | Shared learning challenge, driving question, why it needs international collaboration, and a counterfactual test. A differences board sorts issues into hard / negotiable / productive / unknown. |
| Charter | Decision rights, response times, languages, attribution, disagreement and withdrawal procedures. |
| Shared outcomes | Disciplinary and intercultural outcomes mapped to each partner's local course outcomes. |
| Experience | Activities sequenced across trust → local → compare → critique → co-create → reflect, with per-cohort contributions, dependencies, contingency plans and evidence agreements. Includes a dependency map and a counterfactual table ("if one cohort disappeared…"). |
| Assessment | Collaborative product, process and individual layers; shared rubric criteria; local grade weighting per institution. |
| Alignment review | Deterministic checks across eight collaboration dimensions (reciprocity, interaction, knowledge construction, intercultural reflection, alignment, feasibility, accessibility, readiness). No single "integrity score" by design. Optional AI semantic review. |
| Calendar & time | Academic-calendar overlap, DST-aware working-hour grid, fair live-session windows. Computed with `Intl`, never by AI. |
| Decisions | Shared decisions need explicit approval from every affected partner. Silence is not consent. Votes on an earlier version are flagged for re-review when the item is edited. |
| Meetings | Schedule live sessions inside fair windows, generate a Jitsi link, download `.ics`, add to Google/Outlook, draft an agenda from open items, record outcomes for partners who could not attend. |
| Language | Shared glossary of terms that mean different things locally; translation of comments (with AI). |
| Release & export | Versioned release candidates approved by every partner; exports to HTML (printable to PDF), Markdown, student instructions, `.ics` and JSON. |

## How asynchronous collaboration works

1. One professor creates a project and adds partners.
2. **Share & sync → Send update** downloads a `.crosscourse.json` update file and opens an email draft. Attach the file (or share it through Drive, OneDrive, Teams, etc.).
3. The partner opens the app, chooses **Open a partner's project file**, and picks which partner they are.
4. Each later exchange merges automatically per item: edits built on the version you have are applied cleanly; genuinely concurrent edits keep the newer one and store the other under **Concurrent edits** so nothing is lost. Approvals, comments and the activity log are combined, never overwritten.
5. **Since your last visit** on the overview shows what partners changed.

Because files are exchanged explicitly, the app works across institutions with different IT systems and needs no shared accounts.

## AI (optional, bring your own key)

Open **Settings → AI assistant** and pick OpenAI, Anthropic, Google Gemini, or any OpenAI-compatible endpoint (OpenRouter, Ollama, an institutional gateway). Calls go straight from the browser to the provider. The key is stored only on that device and is never written into project files.

Every AI output is a **proposal**: it shows its assumptions, who requested it and which model produced it, and nothing enters the design until a professor accepts it. Without a key, the assistants offer clearly labelled templates and everything else works fully.

Check your institution's policy before sending syllabi or student-related material to an AI provider.

## Deploy on GitHub Pages

1. Create a new public repository on GitHub (for example `crosscourse`).
2. Upload the contents of this folder to the repository root (drag and drop in the GitHub web UI, or `git push`).
3. In the repository, go to **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute the app is live at `https://<your-username>.github.io/crosscourse/`.

All paths are relative, so it works from a sub-path. The `.nojekyll` file stops GitHub from processing the files. To publish a new version, push changes and bump `VERSION` in `sw.js` so installed copies refresh.

To run locally: `python3 -m http.server 8000` in this folder, then open `http://localhost:8000`. (Service workers and file APIs need `http://`, not `file://`.)

## Data and privacy

- Projects live in the browser's local storage on each device. Clearing site data deletes them. Export a backup from Settings.
- Update files contain the project (including partner names and emails) but never AI keys.
- No analytics, no tracking, no backend.

## Co-Develop with AI (Natural Language Prompt to Course)

Crosscourse provides a complete, first-class methodology to co-develop an international course or module using natural language prompting with zero intermediate human intervention:
- **Prompt-to-Course Generation:** Describe any course, discipline, or collaboration vision in natural language. AI autonomously infers partner institutional constraints, calendars, and cohort strengths, co-developing the complete course across all eight design stages.
- **Zero Intermediate Intervention:** Generates final approved deliverables automatically:
  1. Complete Course Syllabus & Implementation Guide (HTML & print to PDF)
  2. Student-Facing Onboarding & Assignment Handout (Markdown / LMS-ready)
  3. Institutional Partnership Charter & Agreement
  4. Shared Calendar Schedule (.ics for Google Calendar, Outlook, Apple Calendar)
  5. Full Structured Project Archive (.crosscourse.json)
- **Authentic Global Partners:** Features eight institutional partner profiles across Senegal, Brazil, Japan, Italy, UAE, India, Colombia, and Sweden, reflecting genuine academic schedules, grading scales, language environments, and technical access realities.

## Architecture

```
index.html            app shell
manifest.webmanifest  PWA metadata
sw.js                 offline cache (app shell; AI calls always go to network)
css/style.css         design system (light + dark)
js/store.js           data model, persistence, merge of update files
js/time.js            time zones, calendar overlap, ICS
js/checks.js          deterministic alignment engine, release gate
js/ai.js              provider adapters, task prompts, templates
js/ui.js              rendering helpers, dialogs, toasts
js/app.js             router, shell, data binding
js/autopilot.js       AI autopilot engine, progress orchestrator & download center
js/views/*.js         screens
js/demo.js            interactive AI Partner co-design simulation engine
```

Plain ES modules, no build step, no framework.

## Roadmap ideas

- Optional real-time sync backend (e.g. Supabase or a CRDT relay) for teams that want it.
- LMS export (Common Cartridge) and institutional SSO.
- Student team formation and delivery-phase tools.
- Evaluation of partnership quality after delivery.

## Credits

Conceptualized and developed by [Professor Babu George](https://www.linkedin.com/in/beingbabu/).

## Licence

MIT. See `LICENSE`.

