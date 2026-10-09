# Bubu Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (inline, this session). Steps use checkbox syntax.

**Goal:** Offline iPad PWA that tracks Bubu's sheet, resolves entered dice rolls, lists spells/features, manages inventory, and stores notes/NPCs.

**Architecture:** Static site, ES modules, no build. Pure `rules.js` (tested) → `data.js` seed → `store.js` (localStorage) → per-tab view modules rendering into `#view`. Service worker precaches all files.

**Tech Stack:** HTML/CSS/vanilla JS, Node 24 `node:test` for unit tests, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-10-bubu-sheet-design.md`

## Global Constraints
- English UI. No network requests at runtime (no CDN fonts/scripts). System font stack only.
- Public repo: NO session notes, NPCs, or log content in seed data.
- Touch targets ≥ 44px; viewport meta `viewport-fit=cover`; no hover-only affordances.
- iOS PWA: `apple-mobile-web-app-capable`, apple-touch-icon 180px, manifest `display: standalone`.
- All state mutations go through `store.update(fn)`, which saves immediately.
- SW cache name versioned (`bubu-v<N>`); bump on each deploy.

## File Structure
- `index.html`, `manifest.webmanifest`, `sw.js`, `css/app.css`, `icons/`
- `js/rules.js` — pure functions (no DOM, no storage)
- `js/data.js` — seed character, spells, features, items
- `js/store.js` — state load/save/migrate/export/import
- `js/app.js` — tab router, toast, modal helper
- `js/ui/{sheet,roll,spells,inventory,notes}.js`
- `tests/rules.test.js`, `tests/data.test.js`, `tests/store.test.js`

---

### Task 1: Rules engine
**Files:** Create `js/rules.js`, `tests/rules.test.js`
**Produces:**
- `abilityMod(score:number):number`
- `profBonus(totalLevel:number):number`
- `skillBonus(char, skillKey):number`, `saveBonus(char, abilityKey):number` — `char` is the static seed object from data.js plus `misc` map
- `resolveRoll({base:number, d20s:number[], mode:'normal'|'adv'|'dis', silverTongue:boolean, extras:number[]}):{used:number, effective:number, silverApplied:boolean, total:number, parts:string[]}`
- `sumDice(dice:number[], flat:number):number`
- `spendSlot(slots, pool:'bard'|'pact', level:number):boolean` (mutates, returns false if empty)
- `shortRest(state)`, `longRest(state)` (mutate)
- [ ] Write tests: mods (8→-1, 9→-1, 10→0, 19→+4), prof 6→+3, adv picks higher, dis lower, silver tongue turns 9→10 but leaves 10/11 alone, extras (Bardic die) added, d20 validation rejects 0/21, spendSlot decrements/refuses at 0, shortRest restores pact + bardic inspiration + features flagged short, longRest restores all + HP + hit dice (half, min 1)
- [ ] Run `node --test tests/` → FAIL
- [ ] Implement `rules.js`
- [ ] Run → PASS; commit

### Task 2: Seed data + store
**Files:** Create `js/data.js`, `js/store.js`, `tests/data.test.js`, `tests/store.test.js`
**Consumes:** rules.js
**Produces:** `CHAR` (static), `SPELLS`, `FEATURES`, `ITEMS` seed, `defaultState()`, `store.get()`, `store.update(fn)`, `store.exportJSON()`, `store.importJSON(text)`, `store.reset()`; storage injectable for tests (`createStore(storage)`).
- [ ] Test (data): every skill/save total from rules.js equals the Obsidian sheet number (Acro +8, Perf +9, Pers +7, Decep +7, Intim +6, Hist +2, Stealth +4 … saves DEX +6 CHA +7), passive perception 10, spell DC 15, spell attack +7, AC street 13 / breastplate 16, 4/3/2 + 1 pact slots
- [ ] Test (store): defaultState round-trips, update persists, import rejects non-JSON and wrong `v`, import merges valid state, corrupted storage falls back to default
- [ ] Implement, run, commit

### Task 3: App shell + offline
**Files:** Create `index.html`, `css/app.css`, `manifest.webmanifest`, `sw.js`, `js/app.js`, `icons/*`
- [ ] Tab bar (Sheet, Roll, Spells, Items, Notes), `modal()`/`toast()` helpers, last tab remembered
- [ ] sw.js: precache list of every shipped file, cache-first, cleanup old caches
- [ ] Generate 180/192/512 PNG icons via a Node script (no deps)
- [ ] Add test that every file in sw precache list exists and every shipped file is in the list
- [ ] Commit

### Task 4: Sheet tab — `js/ui/sheet.js`
- [ ] HP card (+/-1, +/-5, set), temp HP, AC toggle, abilities grid, saves, skills (tap skill → jump to Roll with it preselected), rests, hit dice, per-skill misc edit
- [ ] Commit

### Task 5: Roll tab — `js/ui/roll.js`
- [ ] Check picker (search/filter), mode buttons, d20 inputs (1 or 2), Bardic Inspiration die field, result card with breakdown; damage/heal mode
- [ ] Commit

### Task 6: Spells & Features — `js/ui/spells.js`
- [ ] Slot trackers, cast flow (pick slot pool/level, upcast), concentration marker, expandable spell cards, feature use trackers
- [ ] Commit

### Task 7: Inventory — `js/ui/inventory.js`
- [ ] Sections, qty steppers, coin, add/edit/delete, descriptions
- [ ] Commit

### Task 8: Notes & NPCs — `js/ui/notes.js`
- [ ] Notes list/editor, NPC cards + search, export/import/reset menu
- [ ] Commit

### Task 9: Verify + deploy
- [ ] `node --test tests/` all green
- [ ] Serve locally, headless-browser load: no console errors, every tab renders, SW registers, works with network blocked after first load
- [ ] Create public repo `BGabe/bubu-sheet`, push, enable Pages, confirm URL serves 200 + SW
- [ ] README with iPad install steps
