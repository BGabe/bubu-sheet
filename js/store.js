// State persistence. Everything the player changes lives in one JSON blob in localStorage.
import { defaultState } from './data.js';

export const KEY = 'bubu-sheet-state';

const clone = (x) => JSON.parse(JSON.stringify(x));

// Fill in anything an older save is missing so new app versions never break old data.
function migrate(raw) {
  const base = defaultState();
  const out = { ...base, ...raw };
  out.features = { ...base.features, ...(raw.features || {}) };
  out.slots = {
    bard: { ...base.slots.bard, ...((raw.slots && raw.slots.bard) || {}) },
    pact: { ...base.slots.pact, ...((raw.slots && raw.slots.pact) || {}) },
  };
  out.skillMisc = { ...base.skillMisc, ...(raw.skillMisc || {}) };
  out.coin = { ...base.coin, ...(raw.coin || {}) };
  out.hp = { ...base.hp, ...(raw.hp || {}) };
  out.hitDice = { ...base.hitDice, ...(raw.hitDice || {}) };
  for (const k of ['inventory', 'notes', 'npcs']) if (!Array.isArray(out[k])) out[k] = base[k];
  out.v = 1;
  return out;
}

export function createStore(storage) {
  const listeners = new Set();
  let state;

  const persist = () => {
    try {
      storage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch {
      return false; // quota / private mode: keep working in memory
    }
  };

  try {
    const text = storage.getItem(KEY);
    const parsed = text ? JSON.parse(text) : null;
    state = parsed && typeof parsed === 'object' && parsed.v === 1 ? migrate(parsed) : defaultState();
  } catch {
    state = defaultState();
  }

  const notify = () => listeners.forEach((fn) => fn(state));

  return {
    get: () => state,
    update(fn, opts = {}) {
      const draft = clone(state);
      fn(draft); // if this throws, state is untouched
      state = draft;
      persist();
      if (!opts.silent) notify();
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    exportJSON: () => JSON.stringify(state, null, 2),
    importJSON(text) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('That is not valid JSON.');
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || parsed.v !== 1) {
        throw new Error('That does not look like a Bubu Sheet backup.');
      }
      state = migrate(parsed);
      persist();
      notify();
    },
    reset() {
      state = defaultState();
      persist();
      notify();
    },
    persisted: () => persist(),
  };
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
