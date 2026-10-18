// Deterministic calendar and time-zone engine. No LLM is used for any of this.

const dtfCache = new Map();
function dtf(tz) {
  if (!dtfCache.has(tz)) {
    dtfCache.set(tz, new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }));
  }
  return dtfCache.get(tz);
}
export function validTz(tz) { try { dtf(tz); return true; } catch { return false; } }

export function parts(date, tz) {
  const p = Object.fromEntries(dtf(tz).formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, H: (+p.hour) % 24, M: +p.minute, s: +p.second, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}

/** Offset (minutes) of tz from UTC at the given instant. */
export function tzOffset(tz, date) {
  const p = parts(date, tz);
  return Math.round((Date.UTC(p.y, p.m - 1, p.d, p.H, p.M, p.s) - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Convert a wall-clock date + time in tz into a UTC Date (DST-aware). */
export function zonedToUtc(ymd, hm, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  const [H, M] = (hm || '00:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, H, M);
  const off1 = tzOffset(tz, new Date(guess));
  let t = guess - off1 * 60000;
  const off2 = tzOffset(tz, new Date(t));
  if (off2 !== off1) t = guess - off2 * 60000;
  return new Date(t);
}

export const pad = n => String(n).padStart(2, '0');
export function ymdOf(date, tz) { const p = parts(date, tz); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; }
export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
export function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
export function weekdayOf(ymd) { return new Date(ymd + 'T12:00:00Z').getUTCDay(); }

export function fmtTime(date, tz, opts = {}) {
  return new Intl.DateTimeFormat(undefined, Object.assign({ timeZone: tz, hour: '2-digit', minute: '2-digit' }, opts)).format(date);
}
export function fmtDateTime(date, tz) {
  return new Intl.DateTimeFormat(undefined, { timeZone: tz, weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}
export function fmtDate(ymd) {
  if (!ymd) return '';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(ymd + 'T12:00:00Z'));
}
export function tzAbbrev(tz, date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).find(x => x.type === 'timeZoneName')?.value || tz;
  } catch { return tz; }
}
export function allTimezones() {
  try { return Intl.supportedValuesOf('timeZone'); } catch { return ['UTC', 'America/Chicago', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Berlin', 'Africa/Lagos', 'Africa/Nairobi', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney']; }
}

// ---------- Academic calendar overlap ----------
export function termOverlap(partners) {
  const withTerms = partners.filter(p => p.course?.termStart && p.course?.termEnd);
  if (withTerms.length < 2) return { ok: false, reason: withTerms.length === partners.length ? 'Add at least two partners' : 'Some partners have not entered term dates', missing: partners.filter(p => !withTerms.includes(p)) };
  const start = withTerms.map(p => p.course.termStart).sort().at(-1);
  const end = withTerms.map(p => p.course.termEnd).sort()[0];
  if (start > end) return { ok: false, reason: 'Academic terms do not overlap', start, end, days: 0, weeks: 0, missing: partners.filter(p => !withTerms.includes(p)) };
  const breaks = [];
  for (const p of withTerms) for (const b of p.course.breaks || []) {
    if (b.start && b.end && b.end >= start && b.start <= end) breaks.push({ ...b, partner: p.id });
  }
  // Count shared teaching days not inside any partner's break.
  let free = 0;
  const total = daysBetween(start, end) + 1;
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    if (!breaks.some(b => d >= b.start && d <= b.end)) free++;
  }
  return { ok: true, start, end, days: total, freeDays: free, weeks: Math.round(free / 7 * 10) / 10, breaks, missing: partners.filter(p => !withTerms.includes(p)) };
}
export function inBreak(ymd, partners) {
  for (const p of partners) for (const b of p.course?.breaks || []) if (b.start && b.end && ymd >= b.start && ymd <= b.end) return { partner: p, brk: b };
  return null;
}

// ---------- Working-hours overlap finder ----------
function partnerIntervals(p, fromYmd, days, flex) {
  const out = [];
  const s = flex ? p.flexStart : p.workStart, e = flex ? p.flexEnd : p.workEnd;
  for (let i = -1; i <= days + 1; i++) {
    const d = addDays(fromYmd, i);
    if (!(p.workDays || [1, 2, 3, 4, 5]).includes(weekdayOf(d))) continue;
    const a = zonedToUtc(d, s, p.timezone).getTime();
    let b = zonedToUtc(d, e, p.timezone).getTime();
    if (b <= a) b += 86400000;
    out.push([a, b]);
  }
  return out;
}
function intersect(A, B) {
  const out = [];
  for (const [a1, a2] of A) for (const [b1, b2] of B) {
    const s = Math.max(a1, b1), e = Math.min(a2, b2);
    if (e > s) out.push([s, e]);
  }
  return out.sort((x, y) => x[0] - y[0]);
}
/** Windows when every listed partner is inside their (core or flexible) hours. */
export function findOverlaps(partners, fromYmd, days = 14, { flex = false, minMinutes = 30 } = {}) {
  if (!partners.length) return [];
  let acc = partnerIntervals(partners[0], fromYmd, days, flex);
  for (const p of partners.slice(1)) acc = intersect(acc, partnerIntervals(p, fromYmd, days, flex));
  const lo = zonedToUtc(fromYmd, '00:00', 'UTC').getTime(), hi = lo + days * 86400000;
  return acc.filter(([s, e]) => e - s >= minMinutes * 60000 && s >= lo && s < hi).map(([s, e]) => ({ start: new Date(s), end: new Date(e), minutes: Math.round((e - s) / 60000) }));
}
/** Classify an instant for a partner: work | flex | off. */
export function hourClass(p, date) {
  const pt = parts(date, p.timezone);
  if (!(p.workDays || [1, 2, 3, 4, 5]).includes(pt.wd)) return 'off';
  const hm = pad(pt.H) + ':' + pad(pt.M);
  if (hm >= p.workStart && hm < p.workEnd) return 'work';
  if (hm >= p.flexStart && hm < p.flexEnd) return 'flex';
  return 'off';
}

// ---------- Calendar exports ----------
const icsDate = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEsc = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
function fold(line) { const out = []; while (line.length > 74) { out.push(line.slice(0, 74)); line = ' ' + line.slice(74); } out.push(line); return out.join('\r\n'); }

export function buildICS(events) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Crosscourse//Co-design//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.uid}@crosscourse`, `DTSTAMP:${icsDate(new Date())}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${ev.startYmd.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(ev.endYmd || ev.startYmd, 1).replace(/-/g, '')}`);
    } else {
      lines.push(`DTSTART:${icsDate(ev.start)}`, `DTEND:${icsDate(ev.end)}`);
    }
    lines.push(fold(`SUMMARY:${icsEsc(ev.title)}`));
    if (ev.description) lines.push(fold(`DESCRIPTION:${icsEsc(ev.description)}`));
    if (ev.location) lines.push(fold(`LOCATION:${icsEsc(ev.location)}`));
    if (ev.url) lines.push(fold(`URL:${ev.url}`));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
export function googleCalUrl({ title, start, end, details, location }) {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: title, dates: `${icsDate(start)}/${icsDate(end)}`, details: details || '', location: location || '' });
  return 'https://calendar.google.com/calendar/render?' + q.toString();
}
export function outlookCalUrl({ title, start, end, details, location }) {
  const q = new URLSearchParams({ path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: start.toISOString(), enddt: end.toISOString(), body: details || '', location: location || '' });
  return 'https://outlook.office.com/calendar/0/deeplink/compose?' + q.toString();
}
