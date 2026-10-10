// Tiny DOM helpers shared by all views.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const fmt = (n) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

let toastTimer;
export function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

let dismissActive = null; // closes the open dialog without touching history

/** Called by the router on Back: closes an open dialog. Returns true if one was open. */
export function closeModalFromBack() {
  if (!dismissActive) return false;
  dismissActive();
  return true;
}

/** Show a modal. build(close) returns the content node. */
export function modal(title, build) {
  const root = document.getElementById('modal-root');
  // One history entry per open dialog so Android Back closes it instead of leaving the app.
  if (!(history.state && history.state.modal)) history.pushState({ ...(history.state || {}), modal: true }, '');
  const dismiss = () => { root.replaceChildren(); document.body.classList.remove('modal-open'); dismissActive = null; };
  const close = () => {
    dismiss();
    // Next tick, so a dialog opened straight after this one can reuse the same entry.
    setTimeout(() => { if (!dismissActive && history.state && history.state.modal) history.back(); }, 0);
  };
  dismissActive = dismiss;
  const sheet = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal-head' },
      h('h2', null, title),
      h('button', { class: 'btn ghost', onClick: close, 'aria-label': 'Close' }, '✕')),
    h('div', { class: 'modal-body' }, build(close)));
  const backdrop = h('div', { class: 'backdrop', onClick: (e) => { if (e.target === backdrop) close(); } }, sheet);
  root.replaceChildren(backdrop);
  document.body.classList.add('modal-open');
  return close;
}

export function confirmDialog(title, message, okLabel, onOk) {
  modal(title, (close) => h('div', null,
    h('p', null, message),
    h('div', { class: 'row end gap' },
      h('button', { class: 'btn', onClick: close }, 'Cancel'),
      h('button', { class: 'btn danger', onClick: () => { close(); onOk(); } }, okLabel))));
}

/** Number stepper: - value + */
export function stepper({ value, min = -Infinity, max = Infinity, step = 1, onChange, label }) {
  return h('div', { class: 'stepper', role: 'group', 'aria-label': label || 'Adjust' },
    h('button', { class: 'btn', onClick: () => onChange(Math.max(min, value - step)), disabled: value <= min, 'aria-label': 'Decrease' }, '−'),
    h('span', { class: 'stepper-val' }, String(value)),
    h('button', { class: 'btn', onClick: () => onChange(Math.min(max, value + step)), disabled: value >= max, 'aria-label': 'Increase' }, '+'));
}

/** Row of pips that can be tapped to spend/restore uses. */
export function pips(cur, max, onSet) {
  return h('div', { class: 'pips' }, Array.from({ length: max }, (_, i) =>
    h('button', {
      class: 'pip' + (i < cur ? ' full' : ''),
      'aria-label': `${i + 1} of ${max}`,
      onClick: () => onSet(i + 1 === cur ? i : i + 1),
    })));
}

export function segmented(options, value, onPick) {
  return h('div', { class: 'seg', role: 'tablist' }, options.map(([val, label]) =>
    h('button', { class: 'seg-btn' + (val === value ? ' on' : ''), role: 'tab', 'aria-selected': val === value ? 'true' : 'false', onClick: () => onPick(val) }, label)));
}
