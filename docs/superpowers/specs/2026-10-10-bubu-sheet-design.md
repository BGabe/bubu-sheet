# Bubu Sheet — offline D&D character PWA

Single-character, single-device, offline-first PWA for iPad Mini. Mimics the
parts of D&D Beyond Bubu's player needs at the table. English UI.

## Constraints
- Must work with zero connectivity after one online "Add to Home Screen" visit (iOS requires HTTPS for service workers → GitHub Pages).
- No backend, no build step. Plain HTML/CSS/ES modules. State in `localStorage`; request `navigator.storage.persist()`.
- Repo is public → personal session notes / NPCs are NOT shipped. Seed data = sheet, spells, features, items only.
- Touch-first: ≥44px targets, works portrait + landscape, no hover reliance, numeric keypad for dice entry.

## Modules
- `js/rules.js` (pure, unit-tested): ability mods, skill/save totals, roll resolution (adv/dis, Silver Tongue, Jack of All Trades, inspiration die, flat bonuses), damage totals, rest logic, slot spending/upcasting.
- `js/data.js`: seed character (Bard 5 / Warlock 1, Eloquence, Fiend), spells, features, items.
- `js/store.js`: load/save/migrate state, export/import JSON, reset.
- `js/ui/*.js`: one view per tab (sheet, roll, spells, inventory, notes). Hash-less tab switching.
- `sw.js`: cache-first precache of all assets, versioned cache name.

## Tabs
1. **Sheet** — HP (+/-), temp HP, AC toggle (street 13 / breastplate 16), abilities, saves, skills, initiative, passive perception, spell DC/attack, hit dice, short/long rest, editable skill misc bonus.
2. **Roll** — pick check (skill/save/ability/initiative/attack/spell attack), normal/adv/dis, enter physical d20(s), optional Bardic Inspiration die entered. Shows breakdown. Damage/heal mode: enter dice results + flat bonus.
3. **Spells & Features** — cantrips + leveled spells with full text, slot trackers (Bard 1-3, Pact), cast button (choose slot, upcast), concentration marker; features with use trackers.
4. **Inventory** — items with qty +/-, gold/platinum, section (Worn/Pockets/Stashed), add/edit/delete, item descriptions.
5. **Notes & NPCs** — session notes (list + editor), NPC cards with search. Empty by default. Export/Import JSON in a menu.

## Rules decisions
- Proficiency +3 (level 6). Skill totals seeded from the Obsidian sheet; deltas the sheet can't explain are stored as per-skill `misc` so the app matches the sheet exactly.
- Silver Tongue: d20 of 9 or less counts as 10 on Persuasion/Deception.
- Jack of All Trades: +1 on non-proficient checks incl. initiative.
- Advantage/disadvantage: user enters both d20s; app picks the one used (Silver Tongue applied per die).
- Multiclass: Bard slots 4/3/2 + 1 Pact slot (short-rest recharge); either pool can cast any known spell of fitting level.

## Out of scope
Obsidian sync, multiple characters, rules compendium, dice animation/rolling.

## Testing
Node unit tests for `rules.js` and `store.js` migration; serve locally and verify service-worker precache list matches files; manual iPad check after deploy.
