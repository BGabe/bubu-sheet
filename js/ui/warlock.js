// Plain-language Warlock help: the guide screen and the little "?" next to the pact slot.
import { h, modal } from '../dom.js';
import { WARLOCK_GUIDE, CHAR } from '../data.js';
import { abilityMod, profBonus } from '../rules.js';

const open = new Set([0]); // first answer starts open

export function warlockGuide(ctx) {
  const s = ctx.store.get();
  const pact = s.slots.pact;
  const dc = 8 + profBonus(CHAR.level) + abilityMod(CHAR.abilities.cha);
  const cell = (k, v, sub) => h('div', null,
    h('div', { class: 'k' }, k),
    h('div', { class: 'v', style: 'font-size:1.15rem' }, v),
    sub ? h('div', { class: 'muted small' }, sub) : null);

  const glance = h('section', { class: 'card' },
    h('h2', null, 'Your Warlock at a glance'),
    h('div', { class: 'kv', style: 'grid-template-columns:repeat(auto-fit,minmax(130px,1fr))' },
      cell('Patron', 'The Fiend'),
      cell('Warlock level', '1', 'of 6 total'),
      cell('Pact slots', `${pact.cur}/${pact.max}`, `level ${pact.level}, short rest`),
      cell('Cantrips', '2', 'Eldritch Blast, Poison Spray'),
      cell('Spells known', '2', 'normally, at Warlock 1'),
      cell('Invocations', '0', 'start at Warlock 2'),
      cell('Pact Boon', 'not yet', 'Warlock 3'),
      cell('Spell save DC', String(dc))));

  const items = WARLOCK_GUIDE.map((e, i) => {
    const isOpen = open.has(i);
    return h('div', { class: 'spell' },
      h('button', {
        class: 'spell-head', 'aria-expanded': isOpen ? 'true' : 'false',
        onClick: () => { if (isOpen) open.delete(i); else open.add(i); ctx.rerender(); },
      }, h('strong', null, e.q), h('span', { class: 'muted' }, isOpen ? '▲' : '▼')),
      isOpen ? h('div', { class: 'spell-body' }, h('p', null, e.a)) : null);
  });

  return h('div', { class: 'stack' },
    h('p', { class: 'muted center small' }, 'Warlock for people who have never played one. Tap a question to open it.'),
    glance, ...items);
}

/** Tiny "?" button for next to any pact-slot label. */
export function pactInfoButton(ctx) {
  return h('button', {
    class: 'btn small', style: 'min-width:44px;padding:0 10px;margin-left:6px', 'aria-label': 'What is a pact slot?',
    onClick: (e) => { e.stopPropagation(); pactHelp(ctx); },
  }, '?');
}

export function pactHelp(ctx) {
  modal('Pact slots in 20 seconds', (close) => h('div', { class: 'stack' },
    h('p', null, 'A ', h('strong', null, 'pact slot'), ' is your Warlock spell fuel. You have 1, and it is 1st level.'),
    h('ul', { style: 'margin:0;padding-left:1.1em' },
      h('li', null, 'It comes back after a ', h('strong', null, 'short rest'), ' (about an hour). Your Bard slots need a long rest.'),
      h('li', null, 'It can cast any spell you know, Bard or Warlock, as long as the spell is 1st level.'),
      h('li', null, 'Spend it first: it is the one that refills the soonest.'),
      h('li', null, 'Cantrips (Eldritch Blast, Poison Spray) never use a slot.')),
    h('div', { class: 'row gap wrap' },
      h('button', { class: 'btn primary grow', onClick: () => { close(); ctx.go('spells', { filter: 'warlock' }); } }, 'Open Warlock 101'),
      h('button', { class: 'btn grow', onClick: close }, 'Got it'))));
}
