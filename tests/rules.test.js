import test from 'node:test';
import assert from 'node:assert/strict';
import {
  abilityMod, profBonus, skillBonus, saveBonus, applyMisc,
  resolveRoll, spendSlot, shortRest, longRest, adjustHp,
} from '../js/rules.js';

test('abilityMod follows floor((score-10)/2)', () => {
  assert.equal(abilityMod(8), -1);
  assert.equal(abilityMod(9), -1);
  assert.equal(abilityMod(10), 0);
  assert.equal(abilityMod(11), 0);
  assert.equal(abilityMod(16), 3);
  assert.equal(abilityMod(19), 4);
});

test('profBonus by total level', () => {
  assert.equal(profBonus(1), 2);
  assert.equal(profBonus(4), 2);
  assert.equal(profBonus(5), 3);
  assert.equal(profBonus(6), 3);
  assert.equal(profBonus(9), 4);
});

const char = {
  level: 6,
  abilities: { str: 10, dex: 16, con: 13, int: 11, wis: 9, cha: 19 },
  saveProf: ['dex', 'cha'],
  jackOfAllTrades: true,
  skills: {
    acrobatics: { ab: 'dex', prof: 1, misc: 2 },
    stealth: { ab: 'dex', prof: 0, misc: 0 },
    performance: { ab: 'cha', prof: 2, misc: 0 },
  },
};

test('skillBonus: proficient adds PB, non-proficient gets half PB (rounded down), misc added', () => {
  assert.equal(skillBonus(char, 'acrobatics'), 3 + 3 + 2);
  assert.equal(skillBonus(char, 'stealth'), 3 + 1);
  assert.equal(skillBonus(char, 'performance'), 4 + 6);
});

test('skillBonus: no Jack of All Trades means no bonus on non-proficient', () => {
  assert.equal(skillBonus({ ...char, jackOfAllTrades: false }, 'stealth'), 3);
});

test('saveBonus adds PB only for proficient saves', () => {
  assert.equal(saveBonus(char, 'dex'), 6);
  assert.equal(saveBonus(char, 'cha'), 7);
  assert.equal(saveBonus(char, 'wis'), -1);
});

test('applyMisc overrides misc without mutating the original', () => {
  const c2 = applyMisc(char, { stealth: 5 });
  assert.equal(skillBonus(c2, 'stealth'), 3 + 1 + 5);
  assert.equal(char.skills.stealth.misc, 0);
});

test('resolveRoll normal', () => {
  const r = resolveRoll({ base: 7, d20s: [12], mode: 'normal' });
  assert.equal(r.used, 12);
  assert.equal(r.effective, 12);
  assert.equal(r.total, 19);
  assert.equal(r.crit, false);
  assert.equal(r.fumble, false);
});

test('resolveRoll advantage picks higher, disadvantage picks lower', () => {
  assert.equal(resolveRoll({ base: 0, d20s: [5, 14], mode: 'adv' }).used, 14);
  assert.equal(resolveRoll({ base: 0, d20s: [5, 14], mode: 'dis' }).used, 5);
});

test('resolveRoll Silver Tongue turns 9 or lower into 10, leaves 10+ alone', () => {
  const low = resolveRoll({ base: 7, d20s: [3], mode: 'normal', silverTongue: true });
  assert.equal(low.effective, 10);
  assert.equal(low.silverApplied, true);
  assert.equal(low.total, 17);
  const edge = resolveRoll({ base: 7, d20s: [9], mode: 'normal', silverTongue: true });
  assert.equal(edge.total, 17);
  const ten = resolveRoll({ base: 7, d20s: [10], mode: 'normal', silverTongue: true });
  assert.equal(ten.silverApplied, false);
  assert.equal(ten.total, 17);
  const hi = resolveRoll({ base: 7, d20s: [15], mode: 'normal', silverTongue: true });
  assert.equal(hi.total, 22);
});

test('resolveRoll Silver Tongue applies per die with advantage', () => {
  const r = resolveRoll({ base: 7, d20s: [2, 6], mode: 'adv', silverTongue: true });
  assert.equal(r.effective, 10);
  assert.equal(r.total, 17);
});

test('resolveRoll keeps natural 20 / natural 1 flags on the raw die', () => {
  assert.equal(resolveRoll({ base: 0, d20s: [20], mode: 'normal' }).crit, true);
  const f = resolveRoll({ base: 7, d20s: [1], mode: 'normal', silverTongue: true });
  assert.equal(f.fumble, true);
  assert.equal(f.total, 17);
});

test('resolveRoll adds extra dice such as Bardic Inspiration', () => {
  const r = resolveRoll({ base: 4, d20s: [10], mode: 'normal', extras: [6] });
  assert.equal(r.total, 20);
  assert.ok(r.parts.some((p) => /extra/i.test(p.label)));
});

test('resolveRoll validates input', () => {
  assert.throws(() => resolveRoll({ base: 0, d20s: [0], mode: 'normal' }));
  assert.throws(() => resolveRoll({ base: 0, d20s: [21], mode: 'normal' }));
  assert.throws(() => resolveRoll({ base: 0, d20s: [4.5], mode: 'normal' }));
  assert.throws(() => resolveRoll({ base: 0, d20s: [5], mode: 'adv' }));
  assert.throws(() => resolveRoll({ base: 0, d20s: [5, 6], mode: 'normal' }));
});

const slotState = () => ({
  slots: {
    bard: { 1: { cur: 1, max: 4 }, 2: { cur: 0, max: 3 }, 3: { cur: 2, max: 2 } },
    pact: { level: 1, cur: 1, max: 1 },
  },
});

test('spendSlot decrements and refuses when empty', () => {
  const s = slotState();
  assert.equal(spendSlot(s.slots, 'bard', 1), true);
  assert.equal(s.slots.bard[1].cur, 0);
  assert.equal(spendSlot(s.slots, 'bard', 1), false);
  assert.equal(spendSlot(s.slots, 'bard', 2), false);
  assert.equal(spendSlot(s.slots, 'pact', 1), true);
  assert.equal(s.slots.pact.cur, 0);
  assert.equal(spendSlot(s.slots, 'pact', 1), false);
});

const restState = () => ({
  hp: { cur: 10, max: 36, temp: 2 },
  hitDice: { cur: 1, max: 6 },
  concentration: 'enemies-abound',
  slots: {
    bard: { 1: { cur: 0, max: 4 }, 2: { cur: 1, max: 3 }, 3: { cur: 0, max: 2 } },
    pact: { level: 1, cur: 0, max: 1 },
  },
  features: {
    inspiration: { cur: 0, max: 4, rest: 'short' },
    speech: { cur: 0, max: 1, rest: 'long' },
  },
});

test('shortRest restores pact slot and short-rest features only', () => {
  const s = restState();
  shortRest(s);
  assert.equal(s.slots.pact.cur, 1);
  assert.equal(s.features.inspiration.cur, 4);
  assert.equal(s.features.speech.cur, 0);
  assert.equal(s.slots.bard[1].cur, 0);
  assert.equal(s.hp.cur, 10);
});

test('longRest restores everything, hit dice by half (min 1), clears concentration', () => {
  const s = restState();
  longRest(s);
  assert.equal(s.hp.cur, 36);
  assert.equal(s.slots.bard[1].cur, 4);
  assert.equal(s.slots.bard[3].cur, 2);
  assert.equal(s.slots.pact.cur, 1);
  assert.equal(s.features.speech.cur, 1);
  assert.equal(s.hitDice.cur, 4); // 1 + floor(6/2)
  assert.equal(s.concentration, null);
});

test('longRest hit dice never exceed max', () => {
  const s = restState();
  s.hitDice.cur = 5;
  longRest(s);
  assert.equal(s.hitDice.cur, 6);
});

test('adjustHp: damage eats temp first, healing caps at max, never below 0', () => {
  const hp = { cur: 10, max: 36, temp: 2 };
  adjustHp(hp, -5);
  assert.deepEqual(hp, { cur: 7, max: 36, temp: 0 });
  adjustHp(hp, 100);
  assert.equal(hp.cur, 36);
  adjustHp(hp, -100);
  assert.equal(hp.cur, 0);
});

import { useFeature, regainFeature } from '../js/rules.js';

test('useFeature spends one use and refuses at zero', () => {
  const f = { bi: { cur: 1, max: 4 } };
  assert.equal(useFeature(f, 'bi'), true);
  assert.equal(f.bi.cur, 0);
  assert.equal(useFeature(f, 'bi'), false);
  assert.equal(f.bi.cur, 0);
  assert.equal(useFeature(f, 'missing'), false);
});

test('regainFeature adds one use up to max and refuses when full', () => {
  const f = { bi: { cur: 3, max: 4 } };
  assert.equal(regainFeature(f, 'bi'), true);
  assert.equal(f.bi.cur, 4);
  assert.equal(regainFeature(f, 'bi'), false);
  assert.equal(f.bi.cur, 4);
});
