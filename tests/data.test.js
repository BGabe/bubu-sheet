import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAR, SPELLS, FEATURES, ITEMS, WEAPONS, defaultState } from '../js/data.js';
import { skillBonus, saveBonus, abilityMod, profBonus, spellEffect } from '../js/rules.js';

// Totals copied from the Obsidian stat sheet (Bubu Stat Sheet.md).
const SHEET_SKILLS = {
  acrobatics: 8, animalHandling: 0, arcana: 1, athletics: 1, deception: 7, history: 2,
  insight: 0, intimidation: 6, investigation: 1, medicine: 0, nature: 1, perception: 0,
  performance: 9, persuasion: 7, religion: 1, sleightOfHand: 4, stealth: 4, survival: 0,
};

test('every skill total matches the Obsidian stat sheet', () => {
  assert.deepEqual(Object.keys(CHAR.skills).sort(), Object.keys(SHEET_SKILLS).sort());
  for (const [k, want] of Object.entries(SHEET_SKILLS)) {
    assert.equal(skillBonus(CHAR, k), want, k);
  }
});

test('saves match the sheet', () => {
  const want = { str: 0, dex: 6, con: 1, int: 0, wis: -1, cha: 7 };
  for (const [k, v] of Object.entries(want)) assert.equal(saveBonus(CHAR, k), v, k);
});

test('derived combat numbers match the sheet', () => {
  const pb = profBonus(CHAR.level);
  const cha = abilityMod(CHAR.abilities.cha);
  assert.equal(CHAR.level, 6);
  assert.equal(pb, 3);
  assert.equal(8 + pb + cha, 15); // spell save DC
  assert.equal(pb + cha, 7); // spell attack
  assert.equal(10 + skillBonus(CHAR, 'perception'), 10); // passive perception
});

test('default state matches the sheet resources', () => {
  const s = defaultState();
  assert.deepEqual(s.hp, { cur: 36, max: 36, temp: 2 });
  assert.equal(s.slots.bard[1].max, 4);
  assert.equal(s.slots.bard[2].max, 3);
  assert.equal(s.slots.bard[3].max, 2);
  assert.deepEqual(s.slots.pact, { level: 1, cur: 1, max: 1 });
  assert.equal(s.features.bardicInspiration.max, 4);
  assert.equal(s.features.bardicInspiration.rest, 'short');
  assert.equal(s.hitDice.max, 6);
  assert.deepEqual(s.notes, []);
  assert.deepEqual(s.npcs, []);
});

test('spells are complete enough to render', () => {
  assert.ok(SPELLS.length >= 13);
  const keys = new Set();
  for (const sp of SPELLS) {
    assert.ok(sp.key && !keys.has(sp.key), `unique key ${sp.key}`);
    keys.add(sp.key);
    for (const f of ['name', 'school', 'time', 'range', 'comps', 'duration', 'text', 'source']) {
      assert.ok(sp[f] !== undefined && sp[f] !== '', `${sp.key}.${f}`);
    }
    assert.ok(Number.isInteger(sp.level) && sp.level >= 0 && sp.level <= 3);
  }
});

test('features, items and weapons have unique ids and text', () => {
  for (const list of [FEATURES, ITEMS]) {
    const ids = list.map((x) => x.key || x.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const x of list) assert.ok(x.name);
  }
  for (const f of FEATURES) assert.ok(f.text, f.key);
  assert.ok(WEAPONS.find((w) => w.key === 'rapier'));
});

test('spellEffect scales cantrips by character level and leveled spells by slot', () => {
  const by = Object.fromEntries(SPELLS.map((s) => [s.key, s]));
  assert.match(spellEffect(by['vicious-mockery'], 0, 6).text, /^2d4 psychic/);
  assert.match(spellEffect(by['vicious-mockery'], 0, 4).text, /^1d4 psychic/);
  assert.match(spellEffect(by['poison-spray'], 0, 6).text, /^2d12 poison/);
  assert.match(spellEffect(by['eldritch-blast'], 0, 6).text, /^2 beams × 1d10 force/);
  assert.match(spellEffect(by['burning-hands'], 1, 6).text, /^3d6 fire/);
  assert.match(spellEffect(by['burning-hands'], 3, 6).text, /^5d6 fire/);
  const cure = spellEffect(by['cure-wounds'], 2, 6);
  assert.match(cure.text, /^2d8/);
  assert.equal(cure.addMod, 'cha');
  assert.equal(spellEffect(by['detect-magic'], 1, 6), null);
});

test('no personal session content leaks into the public seed', () => {
  const blob = JSON.stringify({ SPELLS, FEATURES, ITEMS, CHAR });
  for (const word of ['Olivia', 'Moloch', 'Ghaelle', 'Freyot', 'Benton', 'Erin']) {
    assert.ok(!blob.includes(word), word);
  }
});
