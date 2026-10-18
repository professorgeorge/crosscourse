// Crosscourse: local-first store.
// Projects live on each professor's device. Partners exchange "update packets"
// (project files) and the merge logic below reconciles them entity by entity.

const mem = new Map();
let ls = null;
try {
  window.localStorage.setItem('__xc_t', '1');
  window.localStorage.removeItem('__xc_t');
  ls = window.localStorage;
} catch { ls = null; }

export const persistent = !!ls;

export const kv = {
  get(k, fallback = null) {
    try {
      const raw = ls ? ls.getItem(k) : mem.get(k);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(k, v) {
    const s = JSON.stringify(v);
    if (ls) {
      try { ls.setItem(k, s); return true; } catch { mem.set(k, s); return false; }
    }
    mem.set(k, s);
    return true;
  },
  del(k) { if (ls) ls.removeItem(k); mem.delete(k); },
  keys() { return ls ? Object.keys(ls) : [...mem.keys()]; }
};

export const uid = (p = '') => p + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 8);
export const now = () => new Date().toISOString();

export const PARTNER_COLORS = ['#b4532a', '#2c6a8a', '#8a6a12', '#6d4a8e', '#2e7656', '#a03a66'];

export const STAGES = [
  { key: 'trust', label: 'Establish trust', hint: 'Introductions, team agreements, communication norms' },
  { key: 'local', label: 'Investigate locally', hint: 'Each cohort develops a situated contribution' },
  { key: 'compare', label: 'Compare', hint: 'Surface similarities, differences and hidden assumptions' },
  { key: 'critique', label: 'Critique', hint: 'Each group tests the other’s interpretation' },
  { key: 'cocreate', label: 'Co-create', hint: 'Produce a genuinely shared artifact' },
  { key: 'reflect', label: 'Reflect', hint: 'Make learning and what remains contested visible' }
];

export const FIELD_STATES = {
  reported: 'Reported',
  extracted: 'Extracted',
  inferred: 'AI-inferred',
  confirmed: 'Confirmed'
};

export const DIFF_KINDS = {
  hard: { label: 'Hard incompatibility', hint: 'Must be solved or the collaboration cannot run' },
  negotiable: { label: 'Negotiable', hint: 'Preferences partners can trade off' },
  productive: { label: 'Productive difference', hint: 'Educationally valuable; design around it' },
  unknown: { label: 'Unknown', hint: 'Unconfirmed rule or missing information' }
};

export const COURSE_FIELDS = [
  ['title', 'Course title'], ['code', 'Course code'], ['level', 'Level (e.g. 2nd-year undergraduate)'],
  ['discipline', 'Discipline'], ['studentsCount', 'Expected number of students'],
  ['purpose', 'Course purpose'], ['priorities', 'Disciplinary priorities'],
  ['interculturalAims', 'Intercultural learning I hope for'], ['languages', 'Languages students use / support needs'],
  ['termStart', 'Term start'], ['termEnd', 'Term end'], ['studentAvailability', 'Realistic student participation windows'],
  ['workloadHoursPerWeek', 'Collaboration workload students can absorb (hours / week)'],
  ['tech', 'Technology available'], ['techRestrictions', 'Technology restrictions'],
  ['assessmentObligations', 'Assessment obligations'], ['accessibility', 'Accessibility requirements'],
  ['careTopics', 'Topics requiring particular care'], ['constraints', 'Non-negotiable institutional constraints'],
  ['hopes', 'What I hope to learn from this partnership']
];

const CHARTER_FIELDS = ['purpose', 'decisionRights', 'responseTime', 'languages', 'division', 'attribution', 'studentComms', 'disagreements', 'withdrawal', 'cohortLoss'];

export function blankProject(title = 'Untitled partnership') {
  return {
    id: uid('prj_'), schema: 1, title, mode: 'module',
    createdAt: now(), updatedAt: now(),
    partners: [],
    brief: { id: 'brief', challenge: '', question: '', whyInternational: '', counterfactual: '', status: 'draft', updatedAt: now() },
    charter: Object.assign({ id: 'charter', status: 'draft', responseDays: 3, updatedAt: now() }, Object.fromEntries(CHARTER_FIELDS.map(f => [f, '']))),
    differences: [], commonGround: [], outcomes: [], activities: [], assessments: [],
    decisions: [], proposals: [], comments: [], meetings: [], glossary: [], risks: [],
    findings: [], releases: [], events: [], conflicts: [], tombstones: []
  };
}

export function blankPartner(data = {}, index = 0) {
  return Object.assign({
    id: uid('ptn_'), name: '', email: '', institution: '', country: '', city: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    language: 'English', role: 'representative', status: 'active',
    color: PARTNER_COLORS[index % PARTNER_COLORS.length],
    workStart: '09:00', workEnd: '17:00', flexStart: '07:00', flexEnd: '21:00', workDays: [1, 2, 3, 4, 5],
    course: Object.assign(Object.fromEntries(COURSE_FIELDS.map(([k]) => [k, ''])), { breaks: [], localOutcomes: [] }),
    fieldStates: {}, contributes: '',
    updatedAt: now()
  }, data);
}

// ---------- Device-level settings (never exported) ----------
export const settings = {
  get() {
    return Object.assign({ ai: { provider: 'none', apiKey: '', model: '', baseUrl: '' }, theme: 'auto', identities: {}, lastSeen: {}, lastExport: {} }, kv.get('xc:settings', {}));
  },
  save(s) { kv.set('xc:settings', s); }
};

// ---------- Project persistence ----------
export function listProjects() {
  const idx = kv.get('xc:index', []);
  return idx.map(id => kv.get('xc:p:' + id)).filter(Boolean).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function loadProject(id) { return kv.get('xc:p:' + id); }
export function saveProject(p) {
  p.updatedAt = now();
  const ok = kv.set('xc:p:' + p.id, p);
  const idx = kv.get('xc:index', []);
  if (!idx.includes(p.id)) { idx.push(p.id); kv.set('xc:index', idx); }
  return ok;
}
export function deleteProject(id) {
  kv.del('xc:p:' + id);
  kv.set('xc:index', kv.get('xc:index', []).filter(x => x !== id));
}

// ---------- Path helpers: "activities[act_1].contributions.ptn_2" ----------
export function resolvePath(obj, path) {
  const segs = path.split('.');
  let cur = obj, entity = null, collection = null;
  for (let i = 0; i < segs.length - 1; i++) {
    const m = segs[i].match(/^(\w+)\[(.+)\]$/);
    if (m) {
      const arr = cur[m[1]];
      cur = Array.isArray(arr) ? arr.find(x => x.id === m[2]) : null;
      if (!entity) { entity = cur; collection = m[1]; }
    } else {
      if (cur[segs[i]] == null) cur[segs[i]] = {};
      cur = cur[segs[i]];
      if (!entity && i === 0 && cur && typeof cur === 'object' && cur.id) { entity = cur; collection = segs[0]; }
    }
    if (cur == null) return null;
  }
  return { parent: cur, key: segs[segs.length - 1], entity, collection };
}
export function getPath(obj, path) {
  const r = resolvePath(obj, path);
  return r ? r.parent[r.key] : undefined;
}

// ---------- Event log ----------
export function logEvent(p, by, type, summary, target = null) {
  const last = p.events[p.events.length - 1];
  // Coalesce rapid edits to the same target by the same person.
  if (last && type === 'edit' && last.type === 'edit' && last.by === by && JSON.stringify(last.target) === JSON.stringify(target) && (Date.now() - Date.parse(last.at)) < 120000) {
    last.at = now();
    return;
  }
  p.events.push({ id: uid('evt_'), at: now(), by, type, summary, target });
  if (p.events.length > 1500) p.events.splice(0, p.events.length - 1500);
}

// ---------- Merge: reconcile a partner's update packet ----------
const COLLECTIONS = ['partners', 'differences', 'commonGround', 'outcomes', 'activities', 'assessments', 'decisions', 'proposals', 'meetings', 'glossary', 'risks', 'findings', 'releases'];
const APPEND_ONLY = ['comments', 'events'];

function mergeApprovals(a = {}, b = {}) {
  const out = { ...a };
  for (const [pid, v] of Object.entries(b)) {
    if (!out[pid] || (v.at || '') > (out[pid].at || '')) out[pid] = v;
  }
  return out;
}

export function mergeProjects(local, incoming) {
  const report = { added: 0, updated: 0, kept: 0, conflicts: 0, removed: 0, details: [] };
  const merged = structuredClone(local);
  const tombs = new Set([...(local.tombstones || []), ...(incoming.tombstones || [])]);
  merged.tombstones = [...tombs];

  for (const c of COLLECTIONS) {
    const map = new Map((merged[c] || []).map(x => [x.id, x]));
    for (const inc of incoming[c] || []) {
      const loc = map.get(inc.id);
      if (!loc) { map.set(inc.id, inc); report.added++; report.details.push(`Added ${c.replace(/s$/, '')}: ${inc.title || inc.name || inc.text || inc.term || inc.topic || inc.label || inc.id}`); continue; }
      let winner;
      if (JSON.stringify(loc) === JSON.stringify(inc)) { report.kept++; continue; }
      const fastForward = inc.baseAt && inc.baseAt === loc.updatedAt; // partner edited the version we have
      const localAhead = loc.baseAt && loc.baseAt === inc.updatedAt;   // we edited the version they have
      const newer = fastForward ? true : localAhead ? false : (inc.updatedAt || '') > (loc.updatedAt || '');
      if (newer) { winner = structuredClone(inc); report.updated++; report.details.push(`Updated ${c.replace(/s$/, '')}: ${inc.title || inc.name || inc.text?.slice(0, 50) || inc.term || inc.topic || inc.label || inc.id}`); } else { winner = loc; report.kept++; }
      // Approvals and release sign-offs are per-partner: never let one partner's copy erase another's vote.
      if (loc.approvals || inc.approvals) winner.approvals = mergeApprovals(loc.approvals, inc.approvals);
      if (loc.revisedAt || inc.revisedAt) winner.revisedAt = [loc.revisedAt || '', inc.revisedAt || ''].sort().at(-1);
      // Concurrent edits by different people: keep the newer version, preserve the other for review.
      if (!fastForward && !localAhead && loc.updatedBy && inc.updatedBy && loc.updatedBy !== inc.updatedBy && loc.updatedAt && inc.updatedAt && !loc.approvals) {
        const loser = newer ? loc : inc;
        merged.conflicts.push({ id: uid('cfl_'), collection: c, entityId: inc.id, at: now(), kept: newer ? 'incoming' : 'local', overwritten: loser, resolved: false });
        report.conflicts++;
      }
      map.set(inc.id, winner);
    }
    merged[c] = [...map.values()].filter(x => !tombs.has(x.id));
  }
  for (const k of ['brief', 'charter']) {
    if ((incoming[k]?.updatedAt || '') > (merged[k]?.updatedAt || '')) { merged[k] = structuredClone(incoming[k]); report.updated++; }
    if (local[k]?.approvals || incoming[k]?.approvals) merged[k].approvals = mergeApprovals(local[k]?.approvals, incoming[k]?.approvals);
  }
  for (const c of APPEND_ONLY) {
    const seen = new Set((merged[c] || []).map(x => x.id));
    for (const x of incoming[c] || []) if (!seen.has(x.id)) { merged[c].push(x); if (c === 'comments') report.added++; }
    merged[c].sort((a, b) => a.at.localeCompare(b.at));
  }
  if ((incoming.updatedAt || '') > (local.updatedAt || '')) { merged.title = incoming.title; merged.mode = incoming.mode; }
  merged.conflicts = merged.conflicts || [];
  merged._dirty = {};
  return { merged, report };
}

export function exportPacket(p, byPartnerId) {
  const { _dirty, ...project } = p;
  return { format: 'crosscourse-packet', version: 1, exportedAt: now(), exportedBy: byPartnerId || null, project };
}
