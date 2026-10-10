import { h, fmt, stepper, pips, segmented, modal, confirmDialog } from '../dom.js';
import { CHAR, FEATURES, ABILITY_NAMES } from '../data.js';
import { ABILITIES, abilityMod, profBonus, adjustHp, shortRest, longRest, applyMisc, skillBonus } from '../rules.js';
import { buildChecks } from '../checks.js';
import { inspirationButtons } from './inspiration.js';
import { pactInfoButton } from './warlock.js';

let editSkills = false;

export function render(root, ctx) {
  const { store } = ctx;
  const s = store.get();
  const char = applyMisc(CHAR, s.skillMisc);
  const pb = profBonus(char.level);
  const chaMod = abilityMod(char.abilities.cha);
  const checks = buildChecks(s);
  const roll = (id) => ctx.go('roll', { pick: id });

  // ---- HP -------------------------------------------------------------
  const hp = (delta) => store.update((st) => adjustHp(st.hp, delta));
  const hpCard = h('section', { class: 'card' },
    h('div', { class: 'row between wrap' },
      h('div', null,
        h('div', { class: 'muted small' }, 'HIT POINTS'),
        h('div', { class: 'big' }, `${s.hp.cur}`, h('span', { class: 'muted', style: 'font-size:1.2rem' }, ` / ${s.hp.max}`))),
      h('div', null,
        h('div', { class: 'muted small' }, 'TEMP HP'),
        stepper({ value: s.hp.temp, min: 0, label: 'Temp HP', onChange: (v) => store.update((st) => { st.hp.temp = v; }) }))),
    s.hp.cur === 0 ? h('p', { class: 'badge bad' }, 'Down — roll death saves on the Roll tab') : null,
    h('div', { class: 'hp-row' },
      [-10, -5, -1, 1, 5, 10].map((d) =>
        h('button', { class: 'btn' + (d < 0 ? ' danger' : ''), onClick: () => hp(d) }, d > 0 ? `+${d}` : `−${-d}`))),
    h('div', { class: 'row end gap', style: 'margin-top:8px' },
      h('button', { class: 'btn small', onClick: () => hpModal(ctx) }, 'Exact amount…'),
      h('button', { class: 'btn small', onClick: () => maxHpModal(ctx) }, 'Max HP…')));

  // ---- Combat numbers -------------------------------------------------
  const passive = 10 + skillBonus(char, 'perception');
  const initiative = checks.find((c) => c.id === 'init').base;
  const stat = (k, v, onTap, sub) => h(onTap ? 'button' : 'div', onTap ? { class: 'btn', style: 'flex-direction:column;min-height:72px', onClick: onTap } : null,
    h('div', { class: 'k' }, k), h('div', { class: 'v' }, v), sub ? h('div', { class: 'muted small' }, sub) : null);
  const combatCard = h('section', { class: 'card' },
    h('div', { class: 'row between wrap', style: 'margin-bottom:10px' },
      h('h2', null, 'Combat'),
      segmented([['street', `Clothes ${CHAR.ac.street}`], ['breastplate', `Breastplate ${CHAR.ac.breastplate}`]], s.ac,
        (v) => store.update((st) => { st.ac = v; }))),
    h('div', { class: 'kv' },
      h('div', null, h('div', { class: 'k' }, 'Armor Class'), h('div', { class: 'v' }, String(CHAR.ac[s.ac]))),
      stat('Initiative', fmt(initiative), () => roll('init'), 'tap to roll'),
      h('div', null, h('div', { class: 'k' }, 'Speed'), h('div', { class: 'v' }, `${CHAR.speed} ft`)),
      h('div', null, h('div', { class: 'k' }, 'Proficiency'), h('div', { class: 'v' }, fmt(pb))),
      h('div', null, h('div', { class: 'k' }, 'Passive Perc.'), h('div', { class: 'v' }, String(passive))),
      h('div', null, h('div', { class: 'k' }, 'Spell Save DC'), h('div', { class: 'v' }, String(8 + pb + chaMod))),
      stat('Spell Attack', fmt(pb + chaMod), () => roll('spellatk'), 'tap to roll'),
      h('div', null, h('div', { class: 'k' }, 'Vision'), h('div', { class: 'v', style: 'font-size:1rem' }, CHAR.vision))));

  // ---- Resources ------------------------------------------------------
  const bi = s.features.bardicInspiration;
  const resources = h('section', { class: 'card' },
    h('h2', null, 'Resources'),
    h('div', { class: 'stack' },
      resRow('Bardic Inspiration (d8)', pips(bi.cur, bi.max, (v) => store.update((st) => { st.features.bardicInspiration.cur = v; })), `${bi.cur}/${bi.max} · short rest`),
      inspirationButtons(ctx),
      h('button', {
        class: 'btn block' + (s.heroicInspiration ? ' primary' : ''), 'aria-pressed': s.heroicInspiration ? 'true' : 'false',
        onClick: () => store.update((st) => { st.heroicInspiration = !st.heroicInspiration; }),
      }, s.heroicInspiration ? '★ DM Inspiration ready — reroll any roll. Tap to spend' : '☆ DM Inspiration: none. Tap when the DM grants it'),
      [1, 2, 3].map((l) => resRow(`Bard slot — level ${l}`,
        pips(s.slots.bard[l].cur, s.slots.bard[l].max, (v) => store.update((st) => { st.slots.bard[l].cur = v; })), `${s.slots.bard[l].cur}/${s.slots.bard[l].max}`)),
      resRow(h('span', null, 'Pact slot — level 1', pactInfoButton(ctx)), pips(s.slots.pact.cur, s.slots.pact.max, (v) => store.update((st) => { st.slots.pact.cur = v; })), `${s.slots.pact.cur}/${s.slots.pact.max} · short rest`),
      resRow('Hit Dice (d8)', pips(s.hitDice.cur, s.hitDice.max, (v) => store.update((st) => { st.hitDice.cur = v; })), `${s.hitDice.cur}/${s.hitDice.max}`),
      h('button', {
        class: 'btn', disabled: s.hitDice.cur <= 0,
        onClick: () => {
          store.update((st) => { st.hitDice.cur -= 1; });
          ctx.go('roll', { heal: { label: 'Hit Die (d8 + CON)', dice: '1d8', flat: abilityMod(CHAR.abilities.con) } });
        },
      }, 'Spend a Hit Die to heal…')),
    h('div', { class: 'row gap', style: 'margin-top:12px' },
      h('button', { class: 'btn grow', onClick: () => confirmDialog('Short rest', 'Restores the pact slot and Bardic Inspiration. Spend Hit Dice separately above.', 'Take short rest', () => { store.update((st) => shortRest(st)); ctx.toast('Short rest done'); }) }, '☕ Short rest'),
      h('button', { class: 'btn grow primary', onClick: () => confirmDialog('Long rest', 'Restores HP, all spell slots, features, and half your Hit Dice.', 'Take long rest', () => { store.update((st) => longRest(st)); ctx.toast('Long rest done'); }) }, '🌙 Long rest')));

  // ---- Abilities, saves, skills ---------------------------------------
  const abilities = h('section', { class: 'card' },
    h('h2', null, 'Abilities'),
    h('div', { class: 'abilities' }, ABILITIES.map((ab) =>
      h('button', { class: 'ability btn', style: 'flex-direction:column;min-height:92px', onClick: () => roll(`ab:${ab}`), 'aria-label': `${ABILITY_NAMES[ab]} check` },
        h('div', { class: 'ab' }, ab.toUpperCase()),
        h('div', { class: 'mod' }, fmt(abilityMod(char.abilities[ab]))),
        h('div', { class: 'score' }, String(char.abilities[ab]))))));

  const saves = h('section', { class: 'card' },
    h('h2', null, 'Saving throws'),
    checks.filter((c) => c.group === 'Saves').map((c) =>
      h('button', { class: 'list-btn', onClick: () => roll(c.id) },
        h('span', null, h('span', { class: 'dot' + (c.prof ? ' on' : '') }), c.label, c.note ? h('span', { class: 'muted small' }, ' · adv vs poison') : null),
        h('span', { class: 'bonus' }, fmt(c.base)))));

  const skills = h('section', { class: 'card' },
    h('div', { class: 'row between' },
      h('h2', null, 'Skills'),
      h('button', { class: 'btn small', onClick: () => { editSkills = !editSkills; ctx.rerender(); } }, editSkills ? 'Done' : 'Edit')),
    editSkills ? h('p', { class: 'muted small' }, 'Misc is any extra bonus on top of ability + proficiency. Your Obsidian sheet has a few totals the standard maths does not explain; they are kept as Misc.') : null,
    h('div', { class: 'twocol' }, checks.filter((c) => c.group === 'Skills').map((c) => {
      const key = c.id.split(':')[1];
      const dot = c.prof >= 1 ? 'on' : '';
      return editSkills
        ? h('div', { class: 'list-btn' },
          h('span', null, c.label, h('span', { class: 'muted small' }, ` ${c.base >= 0 ? '+' : '−'}${Math.abs(c.base)}`)),
          stepper({ value: s.skillMisc[key], min: -10, max: 20, label: `${c.label} misc`, onChange: (v) => store.update((st) => { st.skillMisc[key] = v; }) }))
        : h('button', { class: 'list-btn', onClick: () => roll(c.id) },
          h('span', null, h('span', { class: 'dot ' + dot + (!dot && char.jackOfAllTrades ? ' half' : '') }), c.label, h('span', { class: 'muted small' }, ` ${c.short}`)),
          h('span', { class: 'bonus' }, fmt(c.base)));
    })),
    h('p', { class: 'muted small' }, '● proficient  ◐ Jack of All Trades'));

  root.append(h('div', { class: 'page' },
    h('div', { class: 'muted center small' }, CHAR.summary),
    h('div', { class: 'cols' },
      h('div', { class: 'stack' }, hpCard, combatCard, resources),
      h('div', { class: 'stack' }, abilities, saves, skills)),
    featureStrip(ctx)));
}

function resRow(label, control, right) {
  return h('div', { class: 'row between wrap' },
    h('div', { class: 'grow' }, h('div', null, label), h('div', { class: 'muted small' }, right)),
    control);
}

function featureStrip(ctx) {
  const group = (title, items) => [
    h('h3', { style: 'margin-top:8px' }, title),
    h('ul', { style: 'margin:0;padding-left:1.1em' }, items.map((t) => h('li', null, t))),
  ];
  return h('section', { class: 'card' },
    h('h2', null, 'Quick reminders'),
    ...group('Mountain Dwarf', [
      'Darkvision 60 ft: dim light counts as bright, darkness as dim (no colour in darkness).',
      'Dwarven Resilience: advantage on saves against poison, resistance to poison damage.',
      'Stonecunning: History checks about stonework count as proficient with double proficiency bonus.',
      'Dwarven Combat Training: proficient with battleaxe, handaxe, light hammer and warhammer.',
      'Dwarven Armor Training: proficient with light and medium armor.',
      'Dwarven Toughness: +1 hit point per level.',
      'Speed 25 ft, and heavy armor never slows you.',
      "Tool proficiency: Brewer's Supplies. Languages: Common and Dwarvish.",
    ]),
    ...group('Bard', [
      'Bardic Inspiration (d8): bonus action, 60 ft, they keep it for 10 minutes. Back on a short rest.',
      'Jack of All Trades: +1 to checks you are not proficient in, initiative included.',
      'Silver Tongue: Persuasion / Deception d20 of 9 or less counts as 10 (the Roll tab applies it).',
      'Song of Rest: allies who spend Hit Dice on a short rest heal an extra 1d6.',
    ]),
    ...group('Warlock and general', [
      "Dark One's Blessing: drop an enemy to 0 HP and gain 5 temp HP.",
      'Pact slot: your Warlock spell fuel (1 slot, 1st level). It refills on a short rest, so spend it first.',
      'Concentration: if you take damage, make a CON save, DC 10 or half the damage (higher).',
    ]),
    h('button', { class: 'btn block', style: 'margin-top:12px', onClick: () => ctx.go('spells', { filter: 'warlock' }) }, 'Warlock 101: pact slots explained →'));
}

function hpModal(ctx) {
  const { store } = ctx;
  modal('Exact amount', (close) => {
    const input = h('input', { type: 'number', inputmode: 'numeric', pattern: '[0-9]*', min: '0', placeholder: 'Amount', autofocus: true });
    const val = () => Math.max(0, parseInt(input.value, 10) || 0);
    return h('div', { class: 'stack' }, input,
      h('div', { class: 'row gap wrap' },
        h('button', { class: 'btn danger grow', onClick: () => { const n = val(); if (n) { store.update((st) => adjustHp(st.hp, -n)); } close(); } }, 'Take damage'),
        h('button', { class: 'btn grow', onClick: () => { const n = val(); if (n) { store.update((st) => adjustHp(st.hp, n)); } close(); } }, 'Heal'),
        h('button', { class: 'btn grow', onClick: () => { const n = val(); store.update((st) => { st.hp.temp = n; }); close(); } }, 'Set temp HP')),
      h('p', { class: 'muted small' }, 'Damage uses up temporary HP first.'));
  });
}

function maxHpModal(ctx) {
  const { store } = ctx;
  modal('Max HP', (close) => {
    const input = h('input', { type: 'number', inputmode: 'numeric', pattern: '[0-9]*', value: String(store.get().hp.max) });
    return h('div', { class: 'stack' }, input,
      h('button', { class: 'btn primary', onClick: () => {
        const n = parseInt(input.value, 10);
        if (n > 0) store.update((st) => { st.hp.max = n; st.hp.cur = Math.min(st.hp.cur, n); });
        close();
      } }, 'Save'),
      h('p', { class: 'muted small' }, 'Use this after a level-up. Current HP is capped to the new maximum.'));
  });
}
