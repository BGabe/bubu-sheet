import { h, pips, modal, segmented } from '../dom.js';
import { CHAR, SPELLS, FEATURES } from '../data.js';
import { abilityMod, profBonus, spellEffect, spendSlot } from '../rules.js';
import { inspirationButtons } from './inspiration.js';

const open = new Set(); // expanded spell / feature keys survive re-renders
let filter = 'all';

const LEVEL_NAMES = ['Cantrips', '1st level', '2nd level', '3rd level'];
const SAVE_NAMES = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

export function render(root, ctx) {
  const { store } = ctx;
  const s = store.get();
  const pb = profBonus(CHAR.level);
  const cha = abilityMod(CHAR.abilities.cha);
  const dc = 8 + pb + cha;
  const conc = s.concentration ? SPELLS.find((x) => x.key === s.concentration) : null;

  const header = h('section', { class: 'card' },
    h('div', { class: 'kv' },
      h('div', null, h('div', { class: 'k' }, 'Spell save DC'), h('div', { class: 'v' }, String(dc))),
      h('div', null, h('div', { class: 'k' }, 'Spell attack'), h('div', { class: 'v' }, `+${pb + cha}`)),
      h('div', null, h('div', { class: 'k' }, 'Ability'), h('div', { class: 'v' }, 'CHA'))),
    conc ? h('div', { class: 'row between wrap', style: 'margin-top:10px' },
      h('span', { class: 'badge' }, `◎ Concentrating on ${conc.name}`),
      h('button', { class: 'btn small', onClick: () => store.update((st) => { st.concentration = null; }) }, 'End concentration')) : null,
    h('div', { class: 'stack', style: 'margin-top:12px' },
      [1, 2, 3].map((l) => slotRow(`Level ${l} slots`, s.slots.bard[l], (v) => store.update((st) => { st.slots.bard[l].cur = v; }))),
      slotRow('Pact slot (level 1)', s.slots.pact, (v) => store.update((st) => { st.slots.pact.cur = v; }))));

  const filters = segmented([['all', 'All'], ['0', 'Cantrips'], ['1', '1st'], ['2', '2nd'], ['3', '3rd'], ['features', 'Features']], filter, (v) => { filter = v; ctx.rerender(); });

  const body = [];
  if (filter === 'features') {
    body.push(...FEATURES.map((f) => featureCard(f, ctx)));
  } else {
    const levels = filter === 'all' ? [0, 1, 2, 3] : [Number(filter)];
    for (const lvl of levels) {
      const list = SPELLS.filter((sp) => sp.level === lvl);
      if (!list.length) continue;
      body.push(h('h3', { style: 'margin-top:6px' }, LEVEL_NAMES[lvl]), ...list.map((sp) => spellCard(sp, ctx)));
    }
    if (filter === 'all') body.push(h('div', { class: 'muted small center' }, 'Class features and feats are under the Features filter.'));
  }

  root.append(h('div', { class: 'page' }, header, h('div', { class: 'row', style: 'justify-content:center' }, filters), h('div', { class: 'stack' }, body)));
}

function slotRow(label, slot, onSet) {
  return h('div', { class: 'row between wrap' },
    h('div', null, label, h('span', { class: 'muted small' }, `  ${slot.cur}/${slot.max}`)),
    pips(slot.cur, slot.max, onSet));
}

function spellCard(sp, ctx) {
  const { store } = ctx;
  const isOpen = open.has(sp.key);
  const eff = spellEffect(sp, sp.level, CHAR.level);
  const tags = [
    sp.conc ? h('span', { class: 'badge gold' }, 'Concentration') : null,
    sp.ritual ? h('span', { class: 'badge' }, 'Ritual') : null,
    sp.attack ? h('span', { class: 'badge' }, 'Spell attack') : null,
    sp.save ? h('span', { class: 'badge' }, `${SAVE_NAMES[sp.save]} save`) : null,
    h('span', { class: 'badge' }, sp.source),
  ];
  return h('div', { class: 'spell' },
    h('div', { class: 'row' },
      h('button', { class: 'spell-head grow', 'aria-expanded': isOpen ? 'true' : 'false', onClick: () => { isOpen ? open.delete(sp.key) : open.add(sp.key); ctx.rerender(); } },
        h('span', null, h('strong', null, sp.name), h('span', { class: 'muted small' }, `  ${sp.level === 0 ? 'cantrip' : `level ${sp.level}`} · ${sp.school}`)),
        h('span', { class: 'muted' }, isOpen ? '▲' : '▼')),
      h('button', { class: 'btn primary', style: 'margin-right:8px', onClick: () => castFlow(sp, ctx) }, 'Cast')),
    isOpen ? h('div', { class: 'spell-body' },
      h('div', { class: 'meta' }, tags),
      h('div', { class: 'kv', style: 'grid-template-columns:repeat(auto-fit,minmax(120px,1fr))' },
        [['Casting time', sp.time], ['Range', sp.range], ['Components', sp.comps], ['Duration', sp.duration]].map(([k, v]) =>
          h('div', null, h('div', { class: 'k' }, k), h('div', { style: 'font-weight:600' }, v)))),
      eff ? h('p', null, h('strong', null, eff.kind === 'heal' ? 'Healing: ' : 'Damage: '), eff.text + (eff.addMod ? ` + ${eff.addMod.toUpperCase()} modifier` : '')) : null,
      h('p', null, sp.text),
      sp.higher ? h('p', { class: 'muted' }, h('strong', null, 'Higher levels: '), sp.higher) : null,
      h('div', { class: 'row gap wrap' },
        sp.attack ? h('button', { class: 'btn', onClick: () => ctx.go('roll', { pick: 'spellatk', spell: sp.key }) }, 'Roll attack') : null,
        eff ? h('button', { class: 'btn', onClick: () => rollEffect(sp, sp.level, ctx) }, eff.kind === 'heal' ? 'Roll healing' : 'Roll damage') : null)) : null);
}

function rollEffect(sp, castLevel, ctx) {
  const eff = spellEffect(sp, castLevel, CHAR.level);
  const flat = eff.addMod ? abilityMod(CHAR.abilities[eff.addMod]) : 0;
  ctx.go('roll', { dmg: { label: sp.name, hint: `Roll ${eff.text}${castLevel > sp.level ? ` (cast at level ${castLevel})` : ''}`, flat, kind: eff.kind === 'heal' ? 'heal' : 'damage' } });
}

function castFlow(sp, ctx) {
  const { store } = ctx;
  const s = store.get();
  if (sp.level === 0) return afterCast(sp, 0, ctx, 'Cantrip — no slot used');

  const options = [];
  for (let l = sp.level; l <= 3; l++) {
    if (s.slots.bard[l].cur > 0) options.push({ pool: 'bard', level: l, left: s.slots.bard[l].cur });
  }
  if (s.slots.pact.cur > 0 && s.slots.pact.level >= sp.level) options.push({ pool: 'pact', level: s.slots.pact.level, left: s.slots.pact.cur });

  modal(`Cast ${sp.name}`, (close) => {
    if (!options.length) return h('div', { class: 'stack' }, h('p', null, 'No spell slots left that can cast this.'), h('button', { class: 'btn', onClick: close }, 'Close'));
    return h('div', { class: 'stack' },
      s.concentration && sp.conc ? h('p', { class: 'badge bad' }, 'You are already concentrating — casting this ends the other spell.') : null,
      h('p', { class: 'muted' }, 'Which slot do you spend?'),
      options.map((o) => h('button', {
        class: 'btn block', onClick: () => {
          close();
          let ok = false;
          store.update((st) => {
            ok = spendSlot(st.slots, o.pool, o.level);
            if (ok && sp.conc) st.concentration = sp.key;
          });
          if (ok) afterCast(sp, o.level, ctx, `${o.pool === 'pact' ? 'Pact slot' : `Level ${o.level} slot`} spent`);
        },
      }, `${o.pool === 'pact' ? 'Pact slot' : 'Bard slot'} — level ${o.level}${o.level > sp.level ? ' (upcast)' : ''}  ·  ${o.left} left`)),
      h('button', { class: 'btn ghost', onClick: close }, 'Cancel'));
  });
}

function afterCast(sp, level, ctx, note) {
  const eff = spellEffect(sp, level || sp.level, CHAR.level);
  const dc = 8 + profBonus(CHAR.level) + abilityMod(CHAR.abilities.cha);
  modal(`${sp.name} cast`, (close) => h('div', { class: 'stack' },
    h('p', { class: 'badge gold' }, note),
    sp.save ? h('p', null, `Targets make a ${SAVE_NAMES[sp.save]} save against DC ${dc}.`) : null,
    sp.attack ? h('p', null, 'Make a spell attack roll.') : null,
    sp.conc ? h('p', { class: 'muted' }, 'Concentration is now tracked in the header.') : null,
    h('div', { class: 'row gap wrap' },
      sp.attack ? h('button', { class: 'btn primary grow', onClick: () => { close(); ctx.go('roll', { pick: 'spellatk', spell: sp.key }); } }, 'Roll attack') : null,
      eff ? h('button', { class: 'btn grow', onClick: () => { close(); rollEffect(sp, level || sp.level, ctx); } }, eff.kind === 'heal' ? 'Roll healing' : 'Roll damage') : null,
      h('button', { class: 'btn grow', onClick: close }, 'Done'))));
}

function featureCard(f, ctx) {
  const { store } = ctx;
  const s = store.get();
  const isOpen = open.has(f.key);
  const tr = s.features[f.key];
  return h('div', { class: 'spell' },
    h('div', { class: 'row' },
      h('button', { class: 'spell-head grow', 'aria-expanded': isOpen ? 'true' : 'false', onClick: () => { isOpen ? open.delete(f.key) : open.add(f.key); ctx.rerender(); } },
        h('span', null, h('strong', null, f.name), h('span', { class: 'muted small' }, '  ' + f.source)),
        tr ? null : h('span', { class: 'muted' }, isOpen ? '▲' : '▼')),
      tr ? h('div', { style: 'padding-right:10px' }, pips(tr.cur, tr.max, (v) => store.update((st) => { st.features[f.key].cur = v; }))) : null),
    isOpen ? h('div', { class: 'spell-body' },
      tr ? h('div', { class: 'meta' }, h('span', { class: 'badge' }, `${tr.cur}/${tr.max}`), h('span', { class: 'badge' }, tr.rest === 'short' ? 'Short or long rest' : 'Long rest')) : null,
      h('p', null, f.text),
      f.key === 'bardicInspiration' ? inspirationButtons(ctx) : null,
      h('div', { class: 'row gap wrap' },
        f.spends ? h('button', { class: 'btn', onClick: () => {
          if (s.features[f.spends].cur <= 0) return ctx.toast('No Bardic Inspiration left');
          store.update((st) => { st.features[f.spends].cur -= 1; });
          ctx.toast('Spent 1 Bardic Inspiration');
        } }, 'Spend 1 Bardic Inspiration') : null,
        f.tempHp ? h('button', { class: 'btn', onClick: () => {
          store.update((st) => { st.hp.temp = Math.max(st.hp.temp, f.tempHp); });
          ctx.toast(`Temp HP is now at least ${f.tempHp}`);
        } }, `Gain ${f.tempHp} temp HP`) : null,
        tr && f.key !== 'bardicInspiration' ? h('button', { class: 'btn', disabled: tr.cur <= 0, onClick: () => store.update((st) => { st.features[f.key].cur -= 1; }) }, 'Use once') : null)) : null);
}
