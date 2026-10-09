import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChecks, findCheck } from '../js/checks.js';
import { defaultState } from '../js/data.js';

const st = defaultState();

test('check list covers skills, saves, ability checks, attacks, initiative, death save', () => {
  const ids = buildChecks(st).map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['init', 'skill:persuasion', 'save:dex', 'ab:cha', 'spellatk', 'weapon:rapier', 'weapon:hand-crossbow', 'death']) {
    assert.ok(ids.includes(id), id);
  }
});

test('bonuses', () => {
  assert.equal(findCheck(st, 'init').base, 4); // DEX 3 + half prof 1
  assert.equal(findCheck(st, 'skill:persuasion').base, 7);
  assert.equal(findCheck(st, 'save:cha').base, 7);
  assert.equal(findCheck(st, 'ab:str').base, 1); // 0 + Jack of All Trades
  assert.equal(findCheck(st, 'spellatk').base, 7);
  assert.equal(findCheck(st, 'weapon:rapier').base, 6); // DEX 3 + prof 3
});

test('only Persuasion and Deception get Silver Tongue', () => {
  const silver = buildChecks(st).filter((c) => c.silver).map((c) => c.id).sort();
  assert.deepEqual(silver, ['skill:deception', 'skill:persuasion']);
});

test('editing a skill misc bonus changes the check', () => {
  const s2 = defaultState();
  s2.skillMisc.stealth = 3;
  assert.equal(findCheck(s2, 'skill:stealth').base, 3 + 1 + 3);
});
