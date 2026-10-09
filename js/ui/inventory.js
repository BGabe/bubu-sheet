import { h, stepper, modal, confirmDialog, segmented } from '../dom.js';
import { uid } from '../store.js';

const SECTIONS = [['worn', 'Worn & wielded'], ['pockets', 'Pockets'], ['stashed', 'Stashed']];
const open = new Set();
let filter = 'all';
const q = { value: '' }; // search text survives re-renders

export function render(root, ctx) {
  const { store } = ctx;
  const s = store.get();

  const coinNames = [['pp', 'Platinum'], ['gp', 'Gold'], ['sp', 'Silver'], ['cp', 'Copper']];
  const coins = h('section', { class: 'card' },
    h('h2', null, 'Money'),
    h('div', { class: 'coins' }, coinNames.map(([k, label]) =>
      h('div', { class: 'center' }, h('div', { class: 'muted small' }, label),
        stepper({ value: s.coin[k], min: 0, step: k === 'gp' ? 5 : 1, label, onChange: (v) => store.update((st) => { st.coin[k] = v; }) })))),
    h('p', { class: 'muted small' }, 'Gold moves in steps of 5. Use "Exact…" for anything else.'),
    h('div', { class: 'row end' }, h('button', { class: 'btn small', onClick: () => coinModal(ctx) }, 'Exact…')));

  const listWrap = h('div', { class: 'stack' });
  const draw = () => {
    const term = q.value.trim().toLowerCase();
    listWrap.replaceChildren(...SECTIONS
      .filter(([id]) => filter === 'all' || filter === id)
      .map(([id, label]) => {
        const items = store.get().inventory.filter((i) => i.section === id && (!term || i.name.toLowerCase().includes(term) || (i.desc || '').toLowerCase().includes(term)));
        return h('section', { class: 'card' },
          h('h2', null, label, h('span', { class: 'muted small' }, `  ${items.length}`)),
          items.length ? items.map((i) => itemRow(i, ctx)) : h('div', { class: 'empty' }, term ? 'No matches' : 'Nothing here'));
      }));
  };
  const search = h('input', { type: 'search', placeholder: 'Search items…', 'aria-label': 'Search items', value: q.value });
  search.addEventListener('input', () => { q.value = search.value; draw(); });
  draw();

  root.append(h('div', { class: 'page' },
    coins,
    h('div', { class: 'row gap wrap' },
      h('div', { class: 'grow' }, search),
      h('button', { class: 'btn primary', onClick: () => itemModal(null, ctx) }, '+ Add item')),
    h('div', { class: 'row', style: 'justify-content:center' },
      segmented([['all', 'All'], ...SECTIONS.map(([id, l]) => [id, l.split(' ')[0]])], filter, (v) => { filter = v; ctx.rerender(); })),
    listWrap));
}

function itemRow(i, ctx) {
  const { store } = ctx;
  const isOpen = open.has(i.id);
  return h('div', { class: 'item' },
    h('div', { class: 'row between' },
      h('button', { class: 'list-btn grow', onClick: () => { isOpen ? open.delete(i.id) : open.add(i.id); ctx.rerender(); }, 'aria-expanded': isOpen ? 'true' : 'false' },
        h('span', null, h('strong', null, i.name)), h('span', { class: 'muted' }, isOpen ? '▲' : '▼')),
      stepper({ value: i.qty, min: 0, label: `${i.name} quantity`, onChange: (v) => store.update((st) => { st.inventory.find((x) => x.id === i.id).qty = v; }) })),
    isOpen ? h('div', null,
      i.desc ? h('p', { class: 'muted' }, i.desc) : h('p', { class: 'muted small' }, 'No description.'),
      h('div', { class: 'row gap wrap' },
        i.use ? h('button', { class: 'btn primary', disabled: i.qty <= 0, onClick: () => {
          store.update((st) => { st.inventory.find((x) => x.id === i.id).qty -= 1; });
          ctx.go('roll', { heal: { label: i.name, dice: i.use.dice, flat: i.use.flat } });
        } }, 'Drink it…') : null,
        h('button', { class: 'btn', onClick: () => moveModal(i, ctx) }, 'Move…'),
        h('button', { class: 'btn', onClick: () => itemModal(i, ctx) }, 'Edit'),
        h('button', { class: 'btn danger', onClick: () => confirmDialog('Delete item', `Delete "${i.name}"?`, 'Delete', () => store.update((st) => { st.inventory = st.inventory.filter((x) => x.id !== i.id); })) }, 'Delete'))) : null);
}

function moveModal(i, ctx) {
  modal(`Move ${i.name}`, (close) => h('div', { class: 'stack' }, SECTIONS.map(([id, label]) =>
    h('button', { class: 'btn block' + (i.section === id ? ' primary' : ''), onClick: () => { ctx.store.update((st) => { st.inventory.find((x) => x.id === i.id).section = id; }); close(); } }, label))));
}

function itemModal(item, ctx) {
  const isNew = !item;
  modal(isNew ? 'Add item' : 'Edit item', (close) => {
    const name = h('input', { type: 'text', value: item ? item.name : '', placeholder: 'Item name', autocomplete: 'off' });
    const qty = h('input', { type: 'number', inputmode: 'numeric', pattern: '[0-9]*', value: String(item ? item.qty : 1), min: '0' });
    const sel = h('select', null, SECTIONS.map(([id, l]) => h('option', { value: id, selected: (item ? item.section : 'pockets') === id }, l)));
    const desc = h('textarea', { placeholder: 'Description, effects, notes…' }, item ? item.desc || '' : '');
    return h('div', { class: 'stack' },
      h('label', null, 'Name', name), h('label', null, 'Quantity', qty), h('label', null, 'Where is it?', sel), h('label', null, 'Description', desc),
      h('button', { class: 'btn primary', onClick: () => {
        const n = name.value.trim();
        if (!n) { ctx.toast('Give it a name'); return; }
        const q = Math.max(0, parseInt(qty.value, 10) || 0);
        ctx.store.update((st) => {
          if (isNew) st.inventory.push({ id: uid(), name: n, qty: q, section: sel.value, desc: desc.value });
          else Object.assign(st.inventory.find((x) => x.id === item.id), { name: n, qty: q, section: sel.value, desc: desc.value });
        });
        close();
      } }, 'Save'));
  });
}

function coinModal(ctx) {
  const c = ctx.store.get().coin;
  modal('Exact coins', (close) => {
    const inputs = Object.fromEntries(['pp', 'gp', 'sp', 'cp'].map((k) => [k, h('input', { type: 'number', inputmode: 'numeric', pattern: '[0-9]*', value: String(c[k]), min: '0' })]));
    return h('div', { class: 'stack' },
      ['pp', 'gp', 'sp', 'cp'].map((k) => h('label', null, { pp: 'Platinum', gp: 'Gold', sp: 'Silver', cp: 'Copper' }[k], inputs[k])),
      h('button', { class: 'btn primary', onClick: () => {
        ctx.store.update((st) => { for (const k of Object.keys(inputs)) st.coin[k] = Math.max(0, parseInt(inputs[k].value, 10) || 0); });
        close();
      } }, 'Save'));
  });
}
