# Bubu Sheet

Offline D&D character sheet PWA for Bubu (Mountain Dwarf Bard 5 / Warlock 1). English UI, built for an iPad Mini.

## Install on an Android phone (Pixel 8a, Chrome)

1. Open the site in **Chrome**.
2. Tap the **⋮** menu, then **Install app** (or **Add to Home screen**), then **Install**.
3. Open Bubu from the home screen once while online and let it finish loading.
4. Turn on airplane mode and open it again to check. It should load normally.

The Back button steps through tabs and closes dialogs; it only leaves the app from the first screen. Landscape moves the tabs to the right edge.

## Install on the iPad (do this once, with internet)

1. Open the site in **Safari** (it must be Safari, not Chrome).
2. Tap **Share → Add to Home Screen → Add**.
3. Open Bubu from the home screen once while online and let it finish loading.
4. Turn on airplane mode and open it again to check. It should load normally.

Everything you change (HP, slots, items, notes, NPCs) is stored on the iPad only. Use **Notes → Backup** to copy a backup out.

## Updating

When the app changes, open it once while online. Close it fully and open it again to get the new version.

## Develop

```
npm test        # unit tests (no dependencies)
node tools/make-icons.mjs   # regenerate icons
```

Serve the folder with any static server. Bump `CACHE` in `sw.js` whenever a shipped file changes; `tests/offline.test.js` checks the precache list matches the files.
