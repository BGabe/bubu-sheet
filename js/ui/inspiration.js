// Bardic Inspiration helper shared by the Sheet and Spells tabs.
import { h, modal } from '../dom.js';
import { spendSlot, regainFeature } from '../rules.js';

const KEY = 'bardicInspiration';

/** Font of Inspiration: spend a spell slot (no action) to regain one use. */
export function regainInspiration(ctx) {
  const s = ctx.store.get();
  const bi = s.features[KEY];
  if (bi.cur >= bi.max) { ctx.toast('Bardic Inspiration is already full'); return; }
  const options = [1, 2, 3].filter((l) => s.slots.bard[l].cur > 0).map((l) => ({ pool: 'bard', level: l, left: s.slots.bard[l].cur }));
  if (s.slots.pact.cur > 0) options.push({ pool: 'pact', level: s.slots.pact.level, left: s.slots.pact.cur });
  modal('Regain Bardic Inspiration', (close) => options.length
    ? h('div', { class: 'stack' },
      h('p', { class: 'muted' }, 'Font of Inspiration: spend one spell slot to regain one use. No action needed. Which slot?'),
      options.map((o) => h('button', { class: 'btn block', onClick: () => {
        close();
        ctx.store.update((st) => { if (spendSlot(st.slots, o.pool, o.level)) regainFeature(st.features, KEY); });
        ctx.toast('Regained 1 Bardic Inspiration');
      } }, `${o.pool === 'pact' ? 'Pact slot' : 'Bard slot'} — level ${o.level}  ·  ${o.left} left`)),
      h('button', { class: 'btn ghost', onClick: close }, 'Cancel'))
    : h('div', { class: 'stack' }, h('p', null, 'No spell slots left to spend.'), h('button', { class: 'btn', onClick: close }, 'Close')));
}

export function inspirationButtons(ctx) {
  const bi = ctx.store.get().features[KEY];
  return h('button', { class: 'btn block', disabled: bi.cur >= bi.max, onClick: () => regainInspiration(ctx) }, 'Regain 1 use (spend a spell slot)');
}
