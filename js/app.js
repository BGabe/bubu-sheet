import { createStore } from './store.js';
import { CHAR } from './data.js';
import { h, toast } from './dom.js';
import * as sheet from './ui/sheet.js';
import * as roll from './ui/roll.js';
import * as spells from './ui/spells.js';
import * as inventory from './ui/inventory.js';
import * as notes from './ui/notes.js';

const TABS = [
  { id: 'sheet', label: 'Sheet', icon: '🛡', view: sheet },
  { id: 'roll', label: 'Roll', icon: '🎲', view: roll },
  { id: 'spells', label: 'Spells', icon: '✨', view: spells },
  { id: 'items', label: 'Items', icon: '🎒', view: inventory },
  { id: 'notes', label: 'Notes', icon: '📜', view: notes },
];

const TAB_KEY = 'bubu-sheet-tab';
const readTab = () => { try { return localStorage.getItem(TAB_KEY); } catch { return null; } };
const writeTab = (t) => { try { localStorage.setItem(TAB_KEY, t); } catch { /* private mode */ } };

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

let storage;
try { storage = window.localStorage; storage.getItem('x'); } catch { storage = memoryStorage(); }

const store = createStore(storage);
const view = document.getElementById('view');
const tabsEl = document.getElementById('tabs');
const topEl = document.getElementById('top');

let current = TABS.find((t) => t.id === readTab()) || TABS[0];
let params = {};

const ctx = {
  store,
  char: CHAR,
  go(id, p = {}) {
    current = TABS.find((t) => t.id === id) || TABS[0];
    params = p;
    writeTab(current.id);
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    renderAll();
  },
  rerender: () => renderAll(),
  toast,
};

function renderTop() {
  const s = store.get();
  const pct = Math.max(0, Math.min(100, (s.hp.cur / s.hp.max) * 100));
  const ac = CHAR.ac[s.ac];
  const slotBits = [1, 2, 3].map((l) => `${l}:${s.slots.bard[l].cur}`).join(' ');
  topEl.replaceChildren(
    h('button', { class: 'top-main', onClick: () => ctx.go('sheet'), 'aria-label': 'Open sheet' },
      h('div', { class: 'top-name' }, CHAR.name),
      h('div', { class: 'hpbar', role: 'img', 'aria-label': `HP ${s.hp.cur} of ${s.hp.max}` },
        h('div', { class: 'hpfill' + (pct <= 25 ? ' low' : ''), style: `width:${pct}%` }),
        h('div', { class: 'hptext' }, `${s.hp.cur}/${s.hp.max}${s.hp.temp ? ` +${s.hp.temp}` : ''} HP`))),
    h('div', { class: 'top-chips' },
      h('span', { class: 'chip' }, `AC ${ac}`),
      h('span', { class: 'chip' }, `Slots ${slotBits} · P:${s.slots.pact.cur}`),
      s.concentration ? h('span', { class: 'chip warn' }, '◎ Concentrating') : null));
}

function renderTabs() {
  tabsEl.replaceChildren(...TABS.map((t) =>
    h('button', {
      class: 'tab' + (t.id === current.id ? ' on' : ''),
      'aria-current': t.id === current.id ? 'page' : 'false',
      onClick: () => ctx.go(t.id),
    }, h('span', { class: 'tab-icon', 'aria-hidden': 'true' }, t.icon), h('span', null, t.label))));
}

function renderAll() {
  renderTop();
  renderTabs();
  const keepScroll = view.scrollTop;
  view.replaceChildren();
  const p = params;
  params = {}; // params are consumed once so later re-renders keep the view's own state
  current.view.render(view, ctx, p);
  view.scrollTop = keepScroll;
}

store.subscribe(renderAll);
renderAll();

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
}
