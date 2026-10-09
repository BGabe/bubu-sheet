import { h, modal, confirmDialog, segmented } from '../dom.js';
import { uid } from '../store.js';

const V = { sub: 'notes', editing: null, query: '' };
const ATTITUDES = [['unknown', 'Unknown'], ['friendly', 'Friendly'], ['neutral', 'Neutral'], ['wary', 'Wary'], ['hostile', 'Hostile']];
const CARD_BTN = 'all:unset;display:block;box-sizing:border-box;cursor:pointer;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:14px;';
const CLAMP = 'overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;';
const badgeClass = { friendly: 'good', hostile: 'bad', wary: 'bad', neutral: '', unknown: '' };

export function render(root, ctx) {
  const tabs = h('div', { class: 'row', style: 'justify-content:center' },
    segmented([['notes', 'Session notes'], ['npcs', 'NPCs'], ['backup', 'Backup']], V.sub, (v) => { V.sub = v; V.editing = null; ctx.rerender(); }));
  const body = V.sub === 'notes' ? notesView(ctx) : V.sub === 'npcs' ? npcsView(ctx) : backupView(ctx);
  root.append(h('div', { class: 'page' }, tabs, body));
}

const today = () => new Date().toISOString().slice(0, 10);
const matches = (text, q) => !q || text.toLowerCase().includes(q.toLowerCase());

function searchBox(placeholder, onChange) {
  const input = h('input', { type: 'search', placeholder, value: V.query, 'aria-label': placeholder });
  input.addEventListener('input', () => { V.query = input.value; onChange(); });
  return input;
}

// ---------------------------------------------------------------- notes
function notesView(ctx) {
  const { store } = ctx;
  const s = store.get();
  if (V.editing) {
    const note = s.notes.find((n) => n.id === V.editing);
    if (!note) { V.editing = null; return notesView(ctx); }
    const save = (patch) => store.update((st) => { Object.assign(st.notes.find((n) => n.id === note.id), patch, { updated: Date.now() }); }, { silent: true });
    const title = h('input', { type: 'text', value: note.title, placeholder: 'Title (e.g. Session 12)', 'aria-label': 'Note title' });
    title.addEventListener('input', () => save({ title: title.value }));
    const body = h('textarea', { placeholder: 'What happened? Names, places, clues, loose threads…', style: 'min-height:50vh', 'aria-label': 'Note text' }, note.body);
    body.addEventListener('input', () => save({ body: body.value }));
    return h('section', { class: 'card stack' },
      h('div', { class: 'row between' },
        h('button', { class: 'btn', onClick: () => { V.editing = null; ctx.rerender(); } }, '← Notes'),
        h('span', { class: 'muted small' }, 'Saved automatically'),
        h('button', { class: 'btn danger small', onClick: () => confirmDialog('Delete note', 'Delete this note?', 'Delete', () => { store.update((st) => { st.notes = st.notes.filter((n) => n.id !== note.id); }); V.editing = null; ctx.rerender(); }) }, 'Delete')),
      title, body);
  }
  const listBox = h('div', { class: 'stack' });
  const draw = () => {
    const list = [...store.get().notes].sort((a, b) => (b.updated || 0) - (a.updated || 0)).filter((n) => matches(`${n.title} ${n.body}`, V.query));
    listBox.replaceChildren(...(list.length ? list.map((n) =>
      h('button', { style: CARD_BTN, onClick: () => { V.editing = n.id; ctx.rerender(); } },
        h('div', { class: 'row between' }, h('strong', null, n.title || 'Untitled'), h('span', { class: 'muted small' }, new Date(n.updated || n.created || Date.now()).toLocaleDateString())),
        h('div', { class: 'muted', style: CLAMP }, n.body || 'Empty note')))
      : [h('div', { class: 'empty' }, store.get().notes.length ? 'No matching notes.' : 'No notes yet. Tap “+ New note” to start one.')]));
  };
  draw();
  return h('div', { class: 'stack' },
    h('div', { class: 'row gap' },
      h('div', { class: 'grow' }, searchBox('Search notes…', draw)),
      h('button', { class: 'btn primary', onClick: () => {
        const id = uid();
        store.update((st) => { st.notes.push({ id, title: `Session ${today()}`, body: '', created: Date.now(), updated: Date.now() }); }, { silent: true });
        V.editing = id; V.query = ''; ctx.rerender();
      } }, '+ New note')),
    listBox);
}

// ----------------------------------------------------------------- npcs
function npcsView(ctx) {
  const { store } = ctx;
  const s = store.get();
  if (V.editing) {
    const npc = s.npcs.find((n) => n.id === V.editing);
    if (!npc) { V.editing = null; return npcsView(ctx); }
    const save = (patch) => store.update((st) => { Object.assign(st.npcs.find((n) => n.id === npc.id), patch, { updated: Date.now() }); }, { silent: true });
    const field = (label, key, opts = {}) => {
      const el = opts.area ? h('textarea', { style: 'min-height:' + (opts.min || '110px') }, npc[key] || '') : h('input', { type: 'text', value: npc[key] || '', autocomplete: 'off' });
      el.addEventListener('input', () => save({ [key]: el.value }));
      return h('label', null, label, el);
    };
    return h('section', { class: 'card stack' },
      h('div', { class: 'row between' },
        h('button', { class: 'btn', onClick: () => { V.editing = null; ctx.rerender(); } }, '← NPCs'),
        h('span', { class: 'muted small' }, 'Saved automatically'),
        h('button', { class: 'btn danger small', onClick: () => confirmDialog('Delete NPC', `Delete ${npc.name || 'this NPC'}?`, 'Delete', () => { store.update((st) => { st.npcs = st.npcs.filter((n) => n.id !== npc.id); }); V.editing = null; ctx.rerender(); }) }, 'Delete')),
      field('Name', 'name'),
      field('Role / who are they?', 'role'),
      field('Where did we meet / where to find them?', 'where'),
      h('div', null, h('div', { class: 'muted small' }, 'Attitude toward us'),
        segmented(ATTITUDES, npc.attitude || 'unknown', (v) => { save({ attitude: v }); ctx.rerender(); })),
      field('What do they want? What do they know?', 'notes', { area: true }));
  }
  const listBox = h('div', { class: 'stack' });
  const draw = () => {
    const list = store.get().npcs.filter((n) => matches(`${n.name} ${n.role} ${n.where} ${n.notes}`, V.query)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    listBox.replaceChildren(...(list.length ? list.map((n) =>
      h('button', { style: CARD_BTN, onClick: () => { V.editing = n.id; ctx.rerender(); } },
        h('div', { class: 'row between wrap' },
          h('strong', null, n.name || 'Unnamed'),
          h('span', { class: 'badge ' + (badgeClass[n.attitude] || '') }, (ATTITUDES.find((a) => a[0] === n.attitude) || ATTITUDES[0])[1])),
        n.role ? h('div', null, n.role) : null,
        n.where ? h('div', { class: 'muted small' }, n.where) : null,
        n.notes ? h('div', { class: 'muted', style: CLAMP }, n.notes) : null))
      : [h('div', { class: 'empty' }, store.get().npcs.length ? 'No matching NPCs.' : 'No contacts yet. Tap “+ New NPC” when you meet someone.')]));
  };
  draw();
  return h('div', { class: 'stack' },
    h('div', { class: 'row gap' },
      h('div', { class: 'grow' }, searchBox('Search NPCs…', draw)),
      h('button', { class: 'btn primary', onClick: () => {
        const id = uid();
        store.update((st) => { st.npcs.push({ id, name: '', role: '', where: '', attitude: 'unknown', notes: '', updated: Date.now() }); }, { silent: true });
        V.editing = id; V.query = ''; ctx.rerender();
      } }, '+ New NPC')),
    listBox);
}

// --------------------------------------------------------------- backup
function backupView(ctx) {
  const { store } = ctx;
  const exportBox = h('textarea', { readonly: true, style: 'min-height:120px;font-family:ui-monospace,Menlo,monospace;font-size:13px', 'aria-label': 'Backup text' });
  const importBox = h('textarea', { placeholder: 'Paste a backup here to restore it', style: 'min-height:120px;font-family:ui-monospace,Menlo,monospace;font-size:13px', 'aria-label': 'Paste backup' });
  const text = () => store.exportJSON();

  return h('div', { class: 'stack' },
    h('section', { class: 'card stack' },
      h('h2', null, 'Back up'),
      h('p', { class: 'muted' }, 'Everything lives only on this iPad. Make a backup before big changes, and paste it into a Note to Self or send it to yourself.'),
      h('div', { class: 'row gap wrap' },
        navigator.share ? h('button', { class: 'btn primary', onClick: () => navigator.share({ title: 'Bubu Sheet backup', text: text() }).catch(() => {}) }, 'Share / save…') : null,
        h('button', { class: 'btn', onClick: async () => {
          try { await navigator.clipboard.writeText(text()); ctx.toast('Copied to clipboard'); }
          catch { exportBox.value = text(); exportBox.select(); ctx.toast('Select the text and copy it'); }
        } }, 'Copy to clipboard'),
        h('button', { class: 'btn', onClick: () => {
          const blob = new Blob([text()], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `bubu-backup-${today()}.json` });
          document.body.append(a); a.click(); a.remove();
        } }, 'Download file')),
      exportBox),
    h('section', { class: 'card stack' },
      h('h2', null, 'Restore'),
      importBox,
      h('button', { class: 'btn danger', onClick: () => {
        const t = importBox.value.trim();
        if (!t) { ctx.toast('Paste a backup first'); return; }
        confirmDialog('Restore backup', 'This replaces everything on this iPad with the backup.', 'Restore', () => {
          try { store.importJSON(t); ctx.toast('Backup restored'); } catch (e) { ctx.toast(e.message); }
        });
      } }, 'Restore from pasted text')),
    h('section', { class: 'card stack' },
      h('h2', null, 'Reset'),
      h('p', { class: 'muted' }, 'Puts Bubu back to the starting sheet. Notes, NPCs and inventory changes are erased.'),
      h('button', { class: 'btn danger', onClick: () => confirmDialog('Reset everything', 'Erase all notes, NPCs and changes on this iPad?', 'Erase everything', () => { store.reset(); ctx.toast('Reset'); }) }, 'Reset everything')),
    h('section', { class: 'card' }, h('p', { class: 'muted small' }, 'Bubu Sheet · works offline once installed. Rules text is paraphrased from the 5e SRD/PHB — check your books if it matters.')));
}
