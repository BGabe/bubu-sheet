// Builds the list of everything Bubu can roll a d20 for, with its flat bonus.
import { CHAR, WEAPONS, ABILITY_NAMES } from './data.js';
import { ABILITIES, abilityMod, profBonus, skillBonus, saveBonus, applyMisc } from './rules.js';

export function buildChecks(state) {
  const char = applyMisc(CHAR, state.skillMisc);
  const pb = profBonus(char.level);
  const half = char.jackOfAllTrades ? Math.floor(pb / 2) : 0;
  const mod = (ab) => abilityMod(char.abilities[ab]);
  const out = [];

  out.push({ id: 'init', group: 'Other', label: 'Initiative', base: mod('dex') + half, kind: 'check', note: 'DEX + Jack of All Trades' });

  for (const [id, sk] of Object.entries(char.skills)) {
    out.push({
      id: `skill:${id}`, group: 'Skills', label: sk.name, short: sk.ab.toUpperCase(),
      base: skillBonus(char, id), kind: 'check', silver: !!sk.silver,
      prof: sk.prof, note: sk.silver ? 'Silver Tongue: d20 of 9 or less counts as 10' : '',
    });
  }
  for (const ab of ABILITIES) {
    out.push({
      id: `save:${ab}`, group: 'Saves', label: `${ab.toUpperCase()} save`, base: saveBonus(char, ab), kind: 'save',
      prof: char.saveProf.includes(ab) ? 1 : 0,
      note: ab === 'con' ? 'Advantage on saves against poison (Dwarven Resilience)' : '',
    });
    out.push({
      id: `ab:${ab}`, group: 'Checks', label: `${ABILITY_NAMES[ab]} check`, base: mod(ab) + half, kind: 'check',
      note: half ? 'Includes Jack of All Trades' : '',
    });
  }

  const cha = mod(char.castAb);
  out.push({ id: 'spellatk', group: 'Attacks', label: 'Spell attack', base: pb + cha, kind: 'attack', note: `Spell save DC ${8 + pb + cha}` });
  for (const w of WEAPONS) {
    out.push({ id: `weapon:${w.key}`, group: 'Attacks', label: w.name, base: mod(w.ab) + pb, kind: 'attack', weapon: w, note: w.note });
  }
  out.push({ id: 'death', group: 'Other', label: 'Death save', base: 0, kind: 'death', note: '10 or higher is a success. Natural 20 regains 1 HP. Natural 1 counts as two failures.' });
  return out;
}

export const findCheck = (state, id) => buildChecks(state).find((c) => c.id === id);
