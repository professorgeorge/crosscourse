// Small UI toolkit: escaping, icons, form fields, modals, toasts.
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const attr = esc;

const I = (d, extra = '') => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
export const icon = {
  home: I('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  users: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6 6 0 0 1 3.5 6"/>'),
  frame: I('<path d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6"/><circle cx="12" cy="12" r="2.5"/>'),
  scroll: I('<path d="M8 3h11v15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2h11v2a3 3 0 0 0 3 3"/><path d="M8 3a3 3 0 0 0-3 3v10"/><path d="M11 8h5M11 12h5"/>'),
  target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  route: I('<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H17a3.5 3.5 0 0 0 0-7H7a3.5 3.5 0 0 1 0-7h8.5"/>'),
  check: I('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  checks: I('<path d="M3 12.5 7 16.5 15 8.5"/><path d="m13 16.5 1.5 1.5L22 10.5"/>'),
  calendar: I('<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
  vote: I('<path d="M9 11.5 11.5 14 16 9.5"/><path d="M4 4h16v16H4z"/>'),
  shield: I('<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
  package: I('<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>'),
  sync: I('<path d="M20 11a8 8 0 0 0-14.6-4.5L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L21 15"/><path d="M21 20v-5h-5"/>'),
  list: I('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  sparkle: I('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  download: I('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: I('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  message: I('<path d="M4 5h16v11H9l-5 4z"/>'),
  menu: I('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  alert: I('<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01"/>'),
  link: I('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  moon: I('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  translate: I('<path d="M4 5h8M8 3v2M5.5 5c.8 3 3 5.5 6 6.5M10.5 5c-.8 3-3 5.5-6 6.5"/><path d="m13 21 4-9 4 9M14.5 18h5"/>'),
  arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  back: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  edit: I('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>')
};

export function fmtAgo(iso) {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + ' min ago';
  if (s < 86400) return Math.round(s / 3600) + ' h ago';
  if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago';
  return new Date(iso).toLocaleDateString();
}

let fieldSeq = 0;
/** Bound form field. `path` is resolved against the current project. */
export function field(label, path, value, o = {}) {
  const id = 'f' + (++fieldSeq);
  const common = `id="${id}" data-model="${attr(path)}" ${o.rerender ? 'data-rerender' : ''} ${o.disabled ? 'disabled' : ''} ${o.placeholder ? `placeholder="${attr(o.placeholder)}"` : ''}`;
  let control;
  if (o.type === 'textarea') control = `<textarea ${common} rows="${o.rows || 3}">${esc(value)}</textarea>`;
  else if (o.type === 'select') control = `<select ${common}>${o.options.map(([v, l]) => `<option value="${attr(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (o.type === 'checkbox') return `<label class="check"><input type="checkbox" ${common} ${value ? 'checked' : ''}><span>${esc(label)}</span></label>`;
  else control = `<input type="${o.type || 'text'}" ${common} value="${attr(value)}" ${o.list ? `list="${o.list}"` : ''} ${o.min != null ? `min="${o.min}"` : ''} ${o.step ? `step="${o.step}"` : ''}>`;
  const labelHtml = o.action ? `<div class="row items-center justify-between" style="width:100%;margin-bottom:4px;"><label for="${id}">${esc(label)}${o.badge || ''}</label>${o.action}</div>` : `<label for="${id}">${esc(label)}${o.badge || ''}</label>`;
  return `<div class="field ${o.cls || ''}">${labelHtml}${control}${o.hint ? `<p class="hint">${esc(o.hint)}</p>` : ''}</div>`;
}

export function chip(p, { small = false, me = false } = {}) {
  if (!p) return '<span class="chip">Unknown</span>';
  return `<span class="chip ${small ? 'chip-sm' : ''}" title="${attr(p.name)} · ${attr(p.institution)}"><span class="dot" style="--c:${p.color}"></span>${esc(p.institution || p.name || 'Partner')}${me ? ' <em class="you">you</em>' : ''}</span>`;
}
export const badge = (text, kind = '') => `<span class="badge ${kind}">${esc(text)}</span>`;
export const empty = (title, body, action = '') => `<div class="empty"><p class="empty-title">${esc(title)}</p><p>${esc(body)}</p>${action}</div>`;

export function toast(msg, kind = '') {
  const host = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  host.appendChild(el);
  while (host.children.length > 3) host.firstElementChild.remove();
  setTimeout(() => el.classList.add('out'), 3600);
  setTimeout(() => el.remove(), 4000);
}

/** Promise-based modal. actions: [{label, value, kind}] */
export function modal({ title, body, actions = [{ label: 'Close', value: null }], wide = false, onOpen }) {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog');
    dlg.className = 'modal' + (wide ? ' wide' : '');
    dlg.innerHTML = `<form method="dialog"><header class="modal-head"><h2>${esc(title)}</h2><button type="button" class="icon-btn modal-close-btn" aria-label="Close">${icon.x}</button></header><div class="modal-body">${body}</div><footer class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.kind || ''}" value="${i}" ${a.value == null ? 'formnovalidate' : ''}>${esc(a.label)}</button>`).join('')}</footer></form>`;
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    const closeBtn = dlg.querySelector('.modal-close-btn');
    let result = null;

    if (closeBtn) {
      closeBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        result = null;
        dlg.close();
      });
    }

    dlg.addEventListener('click', e => {
      if (e.target === dlg) {
        result = null;
        dlg.close();
      }
    });

    form.addEventListener('submit', e => {
      const v = e.submitter?.value;
      if (v === '__close' || v == null) { result = null; return; }
      const a = actions[+v];
      if (!a || a.value == null) { result = null; return; }
      if (a.validate && !a.validate(form)) { e.preventDefault(); return; }
      result = { value: a.value, form, data: Object.fromEntries(new FormData(form).entries()) };
    });
    dlg.addEventListener('close', () => { resolve(result); dlg.remove(); });
    dlg.showModal();
    onOpen?.(dlg);
  });
}
export async function confirmBox(title, text, okLabel = 'Confirm', kind = 'danger') {
  const r = await modal({ title, body: `<p>${esc(text)}</p>`, actions: [{ label: 'Cancel', value: false }, { label: okLabel, value: true, kind }] });
  return !!r?.value;
}

export function download(name, content, mime = 'application/json') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function pickFile(accept = '.json') {
  return new Promise(resolve => {
    const i = document.createElement('input');
    i.type = 'file'; i.accept = accept;
    i.onchange = () => resolve(i.files[0] || null);
    i.click();
  });
}

/** Tiny, safe markdown renderer for instructions and exports. */
export function md(src = '') {
  const lines = esc(src).split('\n');
  let html = '', list = null;
  const inline = s => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const l of lines) {
    let m;
    if ((m = l.match(/^#{1,3}\s+(.*)/))) { close(); html += `<h4>${inline(m[1])}</h4>`; }
    else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== 'ul') { close(); html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+\.\s+(.*)/))) { if (list !== 'ol') { close(); html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; }
    else if (!l.trim()) close();
    else { close(); html += `<p>${inline(l)}</p>`; }
  }
  close();
  return html;
}

export function renderCoach({ stage = '', title = '', goal = '', actions = [], tips = [] }) {
  return `<section class="coach-box" aria-label="AI Co-Design Coach">
    <div class="coach-head">
      <div class="coach-title">${icon.sparkle} <span>${stage ? `<small class="badge ai">${esc(stage)}</small> ` : ''}${esc(title || 'AI Co-Design Coach')}</span></div>
    </div>
    <div class="coach-goal">${goal}</div>
    ${actions?.length ? `<div class="coach-actions">${actions.map(a => `<button type="button" class="btn sm" data-action="${esc(a.action)}" ${a.data ? Object.entries(a.data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ') : ''}>${a.icon ? (icon[a.icon] || icon.sparkle) : icon.sparkle} ${esc(a.label)}</button>`).join('')}</div>` : ''}
    ${tips?.length ? `<details class="coach-tips"><summary>Guiding pedagogical questions for you and your partner</summary><ul>${tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>` : ''}
  </section>`;
}

