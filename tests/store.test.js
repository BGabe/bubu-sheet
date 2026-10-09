import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, KEY } from '../js/store.js';
import { defaultState } from '../js/data.js';

const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    _m: m,
  };
};

test('fresh store returns default state', () => {
  const s = createStore(memory());
  assert.deepEqual(s.get(), defaultState());
});

test('update persists and a new store reads it back', () => {
  const mem = memory();
  const a = createStore(mem);
  a.update((st) => { st.hp.cur = 12; st.notes.push({ id: 'n1', title: 'T', body: 'B' }); });
  const b = createStore(mem);
  assert.equal(b.get().hp.cur, 12);
  assert.equal(b.get().notes[0].title, 'T');
});

test('corrupted storage falls back to default', () => {
  const mem = memory();
  mem.setItem(KEY, '{not json');
  assert.deepEqual(createStore(mem).get(), defaultState());
});

test('older saves gain newly added default fields', () => {
  const mem = memory();
  const old = defaultState();
  delete old.coin;
  delete old.features.inspiringLeader;
  mem.setItem(KEY, JSON.stringify(old));
  const st = createStore(mem).get();
  assert.deepEqual(st.coin, defaultState().coin);
  assert.ok(st.features.inspiringLeader);
});

test('export then import round-trips', () => {
  const a = createStore(memory());
  a.update((st) => { st.npcs.push({ id: 'x', name: 'Test NPC' }); });
  const text = a.exportJSON();
  const b = createStore(memory());
  b.importJSON(text);
  assert.equal(b.get().npcs[0].name, 'Test NPC');
});

test('import rejects bad input and leaves state alone', () => {
  const s = createStore(memory());
  s.update((st) => { st.hp.cur = 5; });
  assert.throws(() => s.importJSON('nope'));
  assert.throws(() => s.importJSON('{"v":99}'));
  assert.throws(() => s.importJSON('[]'));
  assert.equal(s.get().hp.cur, 5);
});

test('reset restores defaults', () => {
  const s = createStore(memory());
  s.update((st) => { st.hp.cur = 1; });
  s.reset();
  assert.equal(s.get().hp.cur, 36);
});

test('a throwing update does not corrupt saved state', () => {
  const mem = memory();
  const s = createStore(mem);
  s.update((st) => { st.hp.cur = 20; });
  assert.throws(() => s.update((st) => { st.hp.cur = 1; throw new Error('boom'); }));
  assert.equal(s.get().hp.cur, 20);
  assert.equal(createStore(mem).get().hp.cur, 20);
});

test('storage that throws on write keeps working in memory', () => {
  const bad = { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem() {} };
  const s = createStore(bad);
  s.update((st) => { st.hp.cur = 9; });
  assert.equal(s.get().hp.cur, 9);
});
