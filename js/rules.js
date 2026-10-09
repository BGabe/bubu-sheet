// Pure 5e rules helpers. No DOM, no storage.

export const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const abilityMod = (score) => Math.floor((score - 10) / 2);

export const profBonus = (totalLevel) => 2 + Math.floor((totalLevel - 1) / 4);

export function skillBonus(char, key) {
  const sk = char.skills[key];
  const pb = profBonus(char.level);
  const mod = abilityMod(char.abilities[sk.ab]);
  let prof = 0;
  if (sk.prof > 0) prof = pb * sk.prof;
  else if (char.jackOfAllTrades) prof = Math.floor(pb / 2);
  return mod + prof + (sk.misc || 0);
}

export function saveBonus(char, ab) {
  const prof = char.saveProf.includes(ab) ? profBonus(char.level) : 0;
  return abilityMod(char.abilities[ab]) + prof;
}

export function applyMisc(char, miscMap = {}) {
  const skills = {};
  for (const [k, v] of Object.entries(char.skills)) {
    skills[k] = k in miscMap ? { ...v, misc: miscMap[k] } : { ...v };
  }
  return { ...char, skills };
}

const validD20 = (n) => Number.isInteger(n) && n >= 1 && n <= 20;

/**
 * Resolve a d20 roll the player made at the table.
 * base: flat modifier already computed for this check (ability + prof + ...).
 * d20s: one die (normal) or two dice (adv/dis).
 * silverTongue: treat a die of 9 or lower as 10 (applied per die).
 * extras: other dice added to the total (e.g. Bardic Inspiration).
 */
export function resolveRoll({ base, d20s, mode = 'normal', silverTongue = false, extras = [] }) {
  const need = mode === 'normal' ? 1 : 2;
  if (d20s.length !== need) throw new Error(`Expected ${need} d20 value(s)`);
  if (!d20s.every(validD20)) throw new Error('d20 must be a whole number from 1 to 20');

  const eff = d20s.map((d) => (silverTongue && d <= 9 ? 10 : d));
  let idx = 0;
  if (mode === 'adv') idx = eff[1] > eff[0] ? 1 : 0;
  if (mode === 'dis') idx = eff[1] < eff[0] ? 1 : 0;

  const used = d20s[idx];
  const effective = eff[idx];
  const silverApplied = effective !== used;
  const extraSum = extras.reduce((a, b) => a + b, 0);
  const total = effective + base + extraSum;

  const parts = [{ label: silverApplied ? `d20 ${used} → 10 (Silver Tongue)` : `d20 ${used}`, value: effective }];
  parts.push({ label: 'Modifier', value: base });
  if (extras.length) parts.push({ label: 'Extra dice', value: extraSum });

  return { used, effective, silverApplied, total, parts, crit: used === 20, fumble: used === 1 };
}

export function spendSlot(slots, pool, level) {
  const slot = pool === 'pact' ? (slots.pact.level === level ? slots.pact : null) : slots.bard[level];
  if (!slot || slot.cur <= 0) return false;
  slot.cur -= 1;
  return true;
}

export function adjustHp(hp, delta) {
  if (delta < 0) {
    let dmg = -delta;
    const soaked = Math.min(hp.temp, dmg);
    hp.temp -= soaked;
    dmg -= soaked;
    hp.cur = Math.max(0, hp.cur - dmg);
  } else {
    hp.cur = Math.min(hp.max, hp.cur + delta);
  }
}

export function shortRest(state) {
  state.slots.pact.cur = state.slots.pact.max;
  for (const f of Object.values(state.features)) {
    if (f.rest === 'short') f.cur = f.max;
  }
}

export function longRest(state) {
  state.hp.cur = state.hp.max;
  state.hitDice.cur = Math.min(state.hitDice.max, state.hitDice.cur + Math.max(1, Math.floor(state.hitDice.max / 2)));
  for (const s of Object.values(state.slots.bard)) s.cur = s.max;
  state.slots.pact.cur = state.slots.pact.max;
  for (const f of Object.values(state.features)) f.cur = f.max;
  state.concentration = null;
}

/**
 * Damage/healing description for a spell cast at castLevel by a character of charLevel.
 * Returns null for spells without a dice effect.
 * Result: { kind, type, text, addMod } — addMod is an ability key to add (e.g. 'cha') or null.
 */
export function spellEffect(spell, castLevel, charLevel) {
  const e = spell.effect;
  if (!e) return null;
  let text;
  if (e.scale === 'cantrip') {
    const n = 1 + (charLevel >= 5) + (charLevel >= 11) + (charLevel >= 17);
    text = `${n}${e.die}`;
  } else if (e.scale === 'beams') {
    const n = 1 + (charLevel >= 5) + (charLevel >= 11) + (charLevel >= 17);
    text = `${n} beam${n > 1 ? 's' : ''} × 1${e.die}`;
  } else {
    const n = e.count + Math.max(0, castLevel - spell.level) * (e.perLevel || 0);
    text = `${n}${e.die}`;
  }
  return { kind: e.kind, type: e.type || '', text: `${text} ${e.type || ''}`.trim(), addMod: e.addMod || null };
}

/** Spend one use of a tracked feature. Returns false if none left. */
export function useFeature(features, key) {
  const f = features[key];
  if (!f || f.cur <= 0) return false;
  f.cur -= 1;
  return true;
}

/** Regain one use of a tracked feature (e.g. Font of Inspiration). Returns false if already full. */
export function regainFeature(features, key) {
  const f = features[key];
  if (!f || f.cur >= f.max) return false;
  f.cur += 1;
  return true;
}
