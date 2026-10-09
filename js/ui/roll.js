import { h, fmt, segmented } from '../dom.js';
import { SPELLS, CHAR } from '../data.js';
import { resolveRoll, adjustHp, abilityMod, spellEffect } from '../rules.js';
import { buildChecks } from '../checks.js';

// View state survives tab switches and re-renders (module scope).
const S = {
  tab: 'check', // 'check' | 'dmg'
  group: 'Skills',
  sel: null,
  picking: false, // true while the full check list is open
  mode: 'normal',
  d: [null, null],
  extra: null,
  spellKey: null,
  dmg: null, // { label, hint, flat, text, kind }
};
const GROUPS = ['Skills', 'Saves', 'Checks', 'Attacks', 'Other'];

function resetDice() { S.d = [null, null]; S.extra = null; }

function applyParams(params, state) {
  if (params.pick) {
    const c = buildChecks(state).find((x) => x.id === params.pick);
    if (c) {
      S.tab = 'check'; S.sel = c.id; S.group = c.group; S.picking = false; S.mode = 'normal'; resetDice();
      S.spellKey = params.spell || null;
    }
  }
  if (params.heal) {
    S.tab = 'dmg';
    S.dmg = { label: params.heal.label, hint: `Roll ${params.heal.dice}`, flat: params.heal.flat || 0, text: '', kind: 'heal' };
  }
  if (params.dmg) {
    S.tab = 'dmg';
    S.dmg = { label: params.dmg.label, hint: params.dmg.hint, flat: params.dmg.flat || 0, text: '', kind: params.dmg.kind || 'damage' };
  }
}

const sumText = (text) => (text.match(/-?\d+/g) || []).map(Number).reduce((a, b) => a + b, 0);

export function render(root, ctx, params) {
  const { store } = ctx;
  const state = store.get();
  applyParams(params || {}, state);

  const redraw = () => ctx.rerender();
  const page = h('div', { class: 'page' },
    h('div', { class: 'row center', style: 'justify-content:center' },
      segmented([['check', 'd20 roll'], ['dmg', 'Damage / healing']], S.tab, (v) => { S.tab = v; redraw(); })),
    S.tab === 'check' ? checkView(state, redraw, ctx) : dmgView(state, redraw, ctx));
  root.append(page);
}

function keypad(count, selected, onPick, extraClass = '') {
  return h('div', { class: 'keys' }, Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    return h('button', { class: `key ${extraClass}` + (selected === n ? ' on' : ''), onClick: () => onPick(selected === n ? null : n), 'aria-label': String(n) }, String(n));
  }));
}

function checkView(state, redraw, ctx) {
  const all = buildChecks(state);
  const sel = all.find((c) => c.id === S.sel) || null;
  const list = all.filter((c) => c.group === S.group);

  const chooser = h('section', { class: 'card' },
    h('div', { class: 'row wrap', style: 'margin-bottom:10px' },
      segmented(GROUPS.map((g) => [g, g]), S.group, (g) => { S.group = g; redraw(); })),
    h('div', { class: 'chips' }, list.map((c) =>
      h('button', { class: 'pick' + (sel && sel.id === c.id ? ' on' : ''), onClick: () => { S.sel = c.id; S.picking = false; S.mode = 'normal'; resetDice(); S.spellKey = null; redraw(); } },
        h('span', null, c.label), h('span', { class: 'bonus' }, fmt(c.base))))));

  if (!sel) {
    return h('div', { class: 'stack' }, chooser, h('div', { class: 'empty' }, 'Pick what you are rolling, roll your physical dice, then tap the numbers.'));
  }
  // Once something is picked the long list collapses so the result stays on screen.
  const picker = S.picking
    ? chooser
    : h('section', { class: 'card row between' },
      h('div', null, h('strong', { style: 'font-size:1.2rem' }, sel.label), S.spellKey ? h('div', { class: 'muted small' }, SPELLS.find((s) => s.key === S.spellKey)?.name) : null,
        sel.note ? h('div', { class: 'muted small' }, sel.note) : null),
      h('div', { class: 'row gap' },
        h('span', { class: 'big' }, fmt(sel.base)),
        h('button', { class: 'btn', onClick: () => { S.picking = true; S.group = sel.group; redraw(); } }, 'Change')));

  const need = S.mode === 'normal' ? 1 : 2;
  const dice = S.d.slice(0, need);
  const ready = dice.every((x) => x != null);
  let res = null;
  if (ready) {
    res = resolveRoll({
      base: sel.base, d20s: dice, mode: S.mode, silverTongue: !!sel.silver,
      extras: S.extra != null ? [S.extra] : [],
    });
  }

  const setDie = (i) => (v) => { S.d[i] = v; redraw(); };
  const outcome = res ? resultCard(sel, res, state, ctx, redraw)
    : h('section', { class: 'result' }, h('div', { class: 'muted small' }, 'TOTAL'), h('div', { class: 'total' }, '–'),
      h('div', { class: 'parts' }, `Tap the number${need > 1 ? 's' : ''} you rolled`));
  const panel = h('section', { class: 'card stack' },
    sel.kind !== 'death' ? segmented([['normal', 'Normal'], ['adv', 'Advantage'], ['dis', 'Disadvantage']], S.mode, (m) => { S.mode = m; redraw(); }) : null,
    outcome,
    h('div', null, h('div', { class: 'muted small' }, need === 1 ? 'Your d20' : 'First d20'), keypad(20, S.d[0], setDie(0))),
    need === 2 ? h('div', null, h('div', { class: 'muted small' }, 'Second d20'), keypad(20, S.d[1], setDie(1))) : null,
    sel.kind !== 'death' ? h('div', null,
      h('div', { class: 'muted small' }, 'Extra die to add (Bardic Inspiration d8, Guidance…) — optional'),
      keypad(12, S.extra, (v) => { S.extra = v; redraw(); }, 'dim')) : null,
    h('div', { class: 'row end' }, h('button', { class: 'btn small', onClick: () => { resetDice(); redraw(); } }, 'Clear dice')));

  return h('div', { class: 'stack' }, picker, S.picking ? null : panel);
}

function resultCard(sel, res, state, ctx, redraw) {
  const cls = sel.kind === 'attack' || sel.kind === 'death' ? (res.crit ? ' crit' : res.fumble ? ' fumble' : '') : '';
  const bits = [h('span', null, res.parts[0].label)];
  bits.push(h('span', null, ` ${fmt(res.parts[1].value)} modifier`));
  if (res.parts[2]) bits.push(h('span', null, ` ${fmt(res.parts[2].value)} extra die`));

  let verdict = null;
  if (sel.kind === 'death') {
    verdict = res.used === 20 ? h('span', { class: 'badge good' }, 'Natural 20 — regain 1 HP and wake up!')
      : res.used === 1 ? h('span', { class: 'badge bad' }, 'Natural 1 — two failures')
        : res.used >= 10 ? h('span', { class: 'badge good' }, 'Success') : h('span', { class: 'badge bad' }, 'Failure');
  } else if (sel.kind === 'attack') {
    verdict = res.crit ? h('span', { class: 'badge good' }, 'Natural 20 — critical hit! Double the damage dice')
      : res.fumble ? h('span', { class: 'badge bad' }, 'Natural 1 — automatic miss') : null;
  } else if (res.silverApplied) {
    verdict = h('span', { class: 'badge gold' }, 'Silver Tongue applied');
  }

  const follow = [];
  if (sel.kind === 'attack') {
    const crit = res.crit;
    follow.push(h('button', { class: 'btn primary', onClick: () => damageFor(sel, state, crit, S.spellKey, ctx, redraw) }, 'Roll damage →'));
  }
  if (state.heroicInspiration) {
    follow.push(h('button', { class: 'btn', onClick: () => {
      resetDice(); // before the update: the store update re-renders immediately
      ctx.store.update((st) => { st.heroicInspiration = false; });
      ctx.toast('DM Inspiration spent — roll again and keep the new result');
    } }, '★ Spend Inspiration to reroll'));
  }
  if (sel.id === 'death' && res.used === 20) {
    follow.push(h('button', { class: 'btn', onClick: () => { ctx.store.update((st) => { st.hp.cur = Math.max(st.hp.cur, 1); }); ctx.toast('Back up with 1 HP'); } }, 'Set HP to 1'));
  }

  return h('section', { class: 'result' + cls },
    h('div', { class: 'muted small' }, 'TOTAL'),
    h('div', { class: 'total' }, String(res.total)),
    h('div', { class: 'parts' }, bits),
    verdict ? h('div', { style: 'margin-top:8px' }, verdict) : null,
    follow.length ? h('div', { class: 'row gap', style: 'justify-content:center;margin-top:12px' }, follow) : null);
}

function damageFor(sel, state, crit, spellKey, ctx, redraw) {
  const mult = crit ? ' — critical hit: double the dice' : '';
  let label; let hint; let flat = 0;
  if (sel.weapon) {
    label = sel.weapon.name;
    hint = `Roll ${sel.weapon.dmg} ${sel.weapon.dtype}${sel.weapon.ammo ? ' (+1d6 fire if incendiary bolt)' : ''}${mult}`;
    flat = abilityMod(CHAR.abilities[sel.weapon.ab]);
  } else {
    const sp = SPELLS.find((s) => s.key === spellKey);
    const eff = sp ? spellEffect(sp, sp.level, CHAR.level) : null;
    label = sp ? sp.name : 'Spell';
    hint = eff ? `Roll ${eff.text}${mult}` : `Roll the spell's damage dice${mult}`;
  }
  S.tab = 'dmg';
  S.dmg = { label, hint, flat, text: '', kind: 'damage' };
  redraw();
}

function dmgView(state, redraw, ctx) {
  if (!S.dmg) S.dmg = { label: 'Damage or healing', hint: 'Roll your dice, then type the numbers (e.g. 4, 6, 3 or just the total).', flat: 0, text: '', kind: 'damage' };
  const d = S.dmg;
  const dice = sumText(d.text);
  const total = dice + d.flat;
  const has = d.text.trim() !== '';
  const input = h('input', { type: 'text', inputmode: 'decimal', value: d.text, placeholder: 'Dice results, e.g. 4, 6, 3', autocomplete: 'off', 'aria-label': 'Dice results' });
  input.addEventListener('input', () => {
    d.text = input.value;
    // update only the total so the keyboard stays open
    const t = sumText(d.text) + d.flat;
    const el = document.getElementById('dmg-total');
    if (el) el.textContent = d.text.trim() ? String(t) : '–';
  });

  return h('div', { class: 'stack' },
    h('section', { class: 'card stack' },
      h('div', { class: 'row between wrap' },
        h('h2', null, d.label),
        segmented([['damage', 'Damage'], ['heal', 'Healing']], d.kind, (k) => { d.kind = k; redraw(); })),
      h('div', { class: 'muted' }, d.hint),
      h('label', null, 'Dice you rolled (any separators; they are added up)', input),
      h('label', null, 'Flat bonus',
        h('div', { class: 'row gap' },
          h('button', { class: 'btn', onClick: () => { d.flat -= 1; redraw(); } }, '−'),
          h('div', { class: 'big grow center' }, fmt(d.flat)),
          h('button', { class: 'btn', onClick: () => { d.flat += 1; redraw(); } }, '+')))),
    h('section', { class: 'result' },
      h('div', { class: 'muted small' }, d.kind === 'heal' ? 'HEALING' : 'DAMAGE'),
      h('div', { class: 'total', id: 'dmg-total' }, has ? String(total) : '–'),
      h('div', { class: 'row gap wrap', style: 'justify-content:center;margin-top:12px' },
        d.kind === 'heal'
          ? h('button', { class: 'btn primary', onClick: () => { ctx.store.update((st) => adjustHp(st.hp, Math.max(0, sumText(d.text) + d.flat))); ctx.toast(`Healed ${Math.max(0, sumText(d.text) + d.flat)}`); } }, 'Heal Bubu with this')
          : h('button', { class: 'btn danger', onClick: () => { const t = Math.max(0, sumText(d.text) + d.flat); ctx.store.update((st) => adjustHp(st.hp, -t)); ctx.toast(`Took ${t}`); } }, 'Bubu takes this'),
        h('button', { class: 'btn', onClick: () => { d.text = ''; redraw(); } }, 'Clear'))));
}
