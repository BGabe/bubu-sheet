// Seed data for Bubu (Mountain Dwarf Bard 5 / Warlock 1). Static rules data lives here;
// everything the player changes lives in the store (see defaultState()).
// Rules text is paraphrased from the 5e SRD/PHB wording; check against your books if it matters.

export const CHAR = {
  name: 'Bubu',
  summary: 'Mountain Dwarf · Bard 5 (College of Eloquence) / Warlock 1 (The Fiend)',
  level: 6,
  speed: 25,
  vision: 'Darkvision 60 ft',
  jackOfAllTrades: true,
  abilities: { str: 10, dex: 16, con: 13, int: 11, wis: 9, cha: 19 },
  saveProf: ['dex', 'cha'],
  castAb: 'cha',
  ac: { street: 13, breastplate: 16 },
  // prof: 0 none, 1 proficient, 2 expertise. misc = bonus the Obsidian sheet has that the
  // standard maths does not explain (kept so totals match the sheet; editable in the app).
  skills: {
    acrobatics: { name: 'Acrobatics', ab: 'dex', prof: 1, misc: 2 },
    animalHandling: { name: 'Animal Handling', ab: 'wis', prof: 0, misc: 0 },
    arcana: { name: 'Arcana', ab: 'int', prof: 0, misc: 0 },
    athletics: { name: 'Athletics', ab: 'str', prof: 0, misc: 0 },
    deception: { name: 'Deception', ab: 'cha', prof: 1, misc: 0, silver: true },
    history: { name: 'History', ab: 'int', prof: 0, misc: 1 },
    insight: { name: 'Insight', ab: 'wis', prof: 0, misc: 0 },
    intimidation: { name: 'Intimidation', ab: 'cha', prof: 0, misc: 1 },
    investigation: { name: 'Investigation', ab: 'int', prof: 0, misc: 0 },
    medicine: { name: 'Medicine', ab: 'wis', prof: 0, misc: 0 },
    nature: { name: 'Nature', ab: 'int', prof: 0, misc: 0 },
    perception: { name: 'Perception', ab: 'wis', prof: 0, misc: 0 },
    performance: { name: 'Performance', ab: 'cha', prof: 1, misc: 2 },
    persuasion: { name: 'Persuasion', ab: 'cha', prof: 1, misc: 0, silver: true },
    religion: { name: 'Religion', ab: 'int', prof: 0, misc: 0 },
    sleightOfHand: { name: 'Sleight of Hand', ab: 'dex', prof: 0, misc: 0 },
    stealth: { name: 'Stealth', ab: 'dex', prof: 0, misc: 0 },
    survival: { name: 'Survival', ab: 'wis', prof: 0, misc: 0 },
  },
};

export const ABILITY_NAMES = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

export const WEAPONS = [
  { key: 'rapier', name: 'Silvered Rapier', ab: 'dex', dmg: '1d8', dtype: 'piercing', note: 'Finesse, silvered. Bard is proficient.' },
  { key: 'hand-crossbow', name: 'Hand Crossbow', ab: 'dex', dmg: '1d6', dtype: 'piercing', note: 'Range 30/120, light, loading. Incendiary bolts add 1d6 fire.', ammo: true },
];

// effect: dice info used by the Roll tab. scale 'cantrip'/'beams' scale with character level;
// otherwise count + perLevel for each slot level above the spell's level.
export const SPELLS = [
  {
    key: 'vicious-mockery', name: 'Vicious Mockery', level: 0, school: 'Enchantment', source: 'Bard',
    time: '1 action', range: '60 ft', comps: 'V', duration: 'Instant', save: 'wis',
    text: 'You hurl magically barbed insults at a creature you can see. If it can hear you (language does not matter) it makes a Wisdom save. On a failure it takes psychic damage and has disadvantage on its next attack roll before the end of its next turn.',
    higher: 'Damage grows to 2d4 at level 5, 3d4 at level 11 and 4d4 at level 17.',
    effect: { kind: 'damage', scale: 'cantrip', die: 'd4', type: 'psychic' },
  },
  {
    key: 'mage-hand', name: 'Mage Hand', level: 0, school: 'Conjuration', source: 'Bard',
    time: '1 action', range: '30 ft', comps: 'V, S', duration: '1 minute',
    text: 'A spectral floating hand appears at a point you choose in range. Use your action to control it: manipulate an object, open an unlocked door or container, stow or retrieve an item from an open container, or pour out a vial. It moves up to 30 ft each time you use it. It cannot attack, activate magic items, or carry more than 10 lb. It vanishes if it is more than 30 ft from you or if you cast the spell again.',
  },
  {
    key: 'eldritch-blast', name: 'Eldritch Blast', level: 0, school: 'Evocation', source: 'Warlock',
    time: '1 action', range: '120 ft', comps: 'V, S', duration: 'Instant', attack: true,
    text: 'A beam of crackling energy streaks at a creature in range. Make a ranged spell attack. On a hit it takes 1d10 force damage.',
    higher: 'Two beams at level 5, three at level 11, four at level 17. Each beam is a separate attack roll, and you can aim them at the same or different targets.',
    effect: { kind: 'damage', scale: 'beams', die: 'd10', type: 'force' },
  },
  {
    key: 'poison-spray', name: 'Poison Spray', level: 0, school: 'Conjuration', source: 'Warlock',
    time: '1 action', range: '10 ft', comps: 'V, S', duration: 'Instant', save: 'con',
    text: 'You project a puff of noxious gas from your palm at a creature you can see in range. It must succeed on a Constitution save or take poison damage. Poison resistance and immunity matter here.',
    higher: 'Damage grows to 2d12 at level 5, 3d12 at level 11 and 4d12 at level 17.',
    effect: { kind: 'damage', scale: 'cantrip', die: 'd12', type: 'poison' },
  },
  {
    key: 'burning-hands', name: 'Burning Hands', level: 1, school: 'Evocation', source: 'Warlock',
    time: '1 action', range: 'Self (15 ft cone)', comps: 'V, S', duration: 'Instant', save: 'dex',
    text: 'A thin sheet of flame shoots from your fingertips. Every creature in a 15-ft cone makes a Dexterity save, taking fire damage on a failure or half on a success. The fire ignites flammable objects in the area that nobody is wearing or carrying.',
    higher: '+1d6 damage for each slot level above 1st.',
    effect: { kind: 'damage', count: 3, die: 'd6', perLevel: 1, type: 'fire' },
  },
  {
    key: 'command', name: 'Command', level: 1, school: 'Enchantment', source: 'Warlock',
    time: '1 action', range: '60 ft', comps: 'V', duration: '1 round', save: 'wis',
    text: 'You speak a one-word command to a creature you can see. It makes a Wisdom save or follows the command on its next turn. No effect on undead, on creatures that do not understand your language, or if the command would directly harm it. Standard commands: Approach, Drop, Flee, Grovel, Halt. Anything else is up to the DM. If the target cannot carry out the command, the spell ends.',
    higher: 'One extra creature per slot level above 1st; targets must be within 30 ft of each other.',
  },
  {
    key: 'armor-of-agathys', name: 'Armor of Agathys', level: 1, school: 'Abjuration', source: 'Warlock',
    time: '1 action', range: 'Self', comps: 'V, S, M (a cup of water)', duration: '1 hour',
    text: 'Spectral frost covers you. You gain 5 temporary HP for the duration. While you still have those temp HP, any creature that hits you with a melee attack takes 5 cold damage.',
    higher: 'Both the temp HP and the cold damage increase by 5 for each slot level above 1st. As a Warlock spell, the pact slot works (and the slot level is 1st for you).',
  },
  {
    key: 'charm-person', name: 'Charm Person', level: 1, school: 'Enchantment', source: 'Bard',
    time: '1 action', range: '30 ft', comps: 'V, S', duration: '1 hour', save: 'wis',
    text: 'A humanoid you can see makes a Wisdom save, with advantage if you or your companions are fighting it. On a failure it is charmed by you (treats you as a friendly acquaintance) until the spell ends or until you or your allies harm it. When the spell ends the creature knows it was charmed by you.',
    higher: 'One extra humanoid per slot level above 1st; targets must be within 30 ft of each other.',
  },
  {
    key: 'cure-wounds', name: 'Cure Wounds', level: 1, school: 'Evocation', source: 'Bard',
    time: '1 action', range: 'Touch', comps: 'V, S', duration: 'Instant',
    text: 'A creature you touch regains hit points equal to 1d8 + your spellcasting modifier. No effect on undead or constructs.',
    higher: '+1d8 healing for each slot level above 1st.',
    effect: { kind: 'heal', count: 1, die: 'd8', perLevel: 1, type: 'healing', addMod: 'cha' },
  },
  {
    key: 'detect-magic', name: 'Detect Magic', level: 1, school: 'Divination', source: 'Bard', ritual: true, conc: true,
    time: '1 action (ritual)', range: 'Self', comps: 'V, S', duration: 'Conc., 10 min',
    text: 'For the duration you sense magic within 30 ft. Use your action to see a faint aura around any visible creature or object in that area that bears magic, and learn its school of magic if it has one. The spell is blocked by 1 ft of stone, 1 inch of common metal, a thin sheet of lead, or 3 ft of wood or dirt.',
  },
  {
    key: 'disguise-self', name: 'Disguise Self', level: 1, school: 'Illusion', source: 'Bard',
    time: '1 action', range: 'Self', comps: 'V, S', duration: '1 hour',
    text: 'You change how you look, including clothes, armor, weapons and belongings, until the spell ends or you dismiss it as an action. You can seem up to 1 ft shorter or taller and thin, heavy or in between, but not change your basic body type or limb arrangement. The illusion fails to touch: a hat can be passed through, and a creature that uses its action to inspect you can see through it with an Investigation check against your spell save DC.',
  },
  {
    key: 'enhance-ability', name: 'Enhance Ability', level: 2, school: 'Transmutation', source: 'Bard', conc: true,
    time: '1 action', range: 'Touch', comps: 'V, S, M (fur or feather of a beast)', duration: 'Conc., 1 hour',
    text: 'Touch a willing creature and pick one enhancement: Bear\'s Endurance (advantage on CON checks, 2d6 temp HP that vanish when the spell ends), Bull\'s Strength (advantage on STR checks, carrying capacity doubles), Cat\'s Grace (advantage on DEX checks, no fall damage from 20 ft or less unless incapacitated), Eagle\'s Splendor (advantage on CHA checks), Fox\'s Cunning (advantage on INT checks) or Owl\'s Wisdom (advantage on WIS checks).',
    higher: 'One extra creature per slot level above 2nd.',
  },
  {
    key: 'enemies-abound', name: 'Enemies Abound', level: 3, school: 'Enchantment', source: 'Bard', conc: true,
    time: '1 action', range: '120 ft', comps: 'V, S', duration: 'Conc., 1 minute', save: 'int',
    text: 'You reach into the mind of a creature you can see and force an Intelligence save (automatic success if it is immune to being frightened). On a failure it can no longer tell friend from foe and regards all creatures it can see as enemies. Each time it takes damage it repeats the save, ending the effect on a success. When it picks another creature as a target it must choose at random among the creatures it can see in range of that attack or spell, and if an enemy provokes an opportunity attack from it, it must make that attack if able.',
  },
];

// uses: { max, rest } creates a tracker. spends: key of another tracker this feature consumes.
// tempHp: button that grants temporary HP to Bubu.
export const FEATURES = [
  {
    key: 'bardicInspiration', name: 'Bardic Inspiration (d8)', source: 'Bard',
    uses: { max: 4, rest: 'short' },
    text: 'Bonus action: pick a creature other than you within 60 ft that can hear you. It gains a d8 Bardic Inspiration die for 10 minutes and can add it to one ability check, attack roll or saving throw (roll after seeing the d20, before the DM says the result). Uses = your CHA modifier. Font of Inspiration: uses come back on a short or long rest, and you can spend a spell slot to regain one use instantly (no action).',
  },
  {
    key: 'unsettlingWords', name: 'Unsettling Words', source: 'Eloquence', spends: 'bardicInspiration',
    text: 'Bonus action, spend one Bardic Inspiration use: a creature you can see within 60 ft rolls your Bardic Inspiration die and subtracts it from the next saving throw it makes before the start of your next turn.',
  },
  {
    key: 'silverTongue', name: 'Silver Tongue', source: 'Eloquence',
    text: 'On Charisma (Persuasion) and Charisma (Deception) checks, a d20 result of 9 or lower counts as 10. The Roll tab does this for you.',
  },
  {
    key: 'unfailingInspiration', name: 'Unfailing Inspiration', source: 'Eloquence',
    text: 'If a creature adds your Bardic Inspiration die to a check, attack or save and still fails, it keeps the die. (Normally a level 6 Bard feature: your sheet lists it, check with your DM.)',
  },
  {
    key: 'universalSpeech', name: 'Universal Speech', source: 'Eloquence', uses: { max: 1, rest: 'long' },
    text: 'Action: pick up to CHA-mod creatures (min 1) within 60 ft. For 1 hour they understand you in any language. Once per long rest, or again by spending a spell slot. (Normally a level 6 Bard feature: your sheet lists it, check with your DM.)',
  },
  {
    key: 'jackOfAllTrades', name: 'Jack of All Trades', source: 'Bard',
    text: 'Add half your proficiency bonus (rounded down, +1 now) to any ability check that does not already use your proficiency bonus, including initiative.',
  },
  {
    key: 'songOfRest', name: 'Song of Rest (d6)', source: 'Bard',
    text: 'During a short rest, allies who spend Hit Dice to heal (you too) regain an extra 1d6 HP each. Becomes d8 at Bard 9.',
  },
  {
    key: 'darkOnesBlessing', name: 'Dark One\'s Blessing', source: 'Warlock (Fiend)', tempHp: 5,
    text: 'When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA modifier + Warlock level (4 + 1 = 5).',
  },
  {
    key: 'pactMagic', name: 'Pact Magic', source: 'Warlock',
    text: 'One 1st-level pact slot, restored on a short or long rest. You can cast any spell you know using either pact slots or Bard slots. Spells you know from either class use Charisma.',
  },
  {
    key: 'inspiringLeader', name: 'Inspiring Leader (feat)', source: 'Feat', uses: { max: 1, rest: 'short' }, tempHp: 10,
    text: 'Spend 10 minutes inspiring up to 6 friendly creatures (you included) within 30 ft who can see or hear and understand you. Each gains temporary HP equal to your level + CHA modifier (6 + 4 = 10). A creature cannot gain these again until it finishes a short or long rest. The tracker counts your own use.',
  },
  {
    key: 'dwarvenResilience', name: 'Dwarven Resilience', source: 'Dwarf',
    text: 'Advantage on saving throws against poison and resistance to poison damage.',
  },
  {
    key: 'stonecunning', name: 'Stonecunning', source: 'Dwarf',
    text: 'On History checks about the origin of stonework you count as proficient and add double your proficiency bonus.',
  },
  {
    key: 'dwarvenToughness', name: 'Dwarven Toughness', source: 'Dwarf',
    text: 'Your hit point maximum increases by 1 per level.',
  },
  {
    key: 'proficiencies', name: 'Proficiencies & Languages', source: 'Misc',
    text: 'Armor: light, medium. Weapons: battleaxe, handaxe, light hammer, warhammer, simple weapons, hand crossbow, longsword, rapier, shortsword. Tools: Brewer\'s Supplies. Languages: Common, Dwarvish. Darkvision 60 ft.',
  },
];

// section: worn | pockets | stashed. use: potion shortcut for the Roll tab healing mode.
export const ITEMS = [
  { id: 'fine-clothes', name: '"Aura Maxing" Bespoke Fine Clothes', qty: 1, section: 'worn', desc: 'Tailored only for Bubu (170 gp). Sets AC to 10 + DEX modifier (13) while worn.' },
  { id: 'silvered-rapier', name: 'Silvered Rapier', qty: 1, section: 'worn', desc: '1d8 piercing, finesse. Silvered, so it hurts creatures that resist mundane weapons but not silver.' },
  { id: 'potion-healing', name: 'Potion of Healing', qty: 2, section: 'pockets', desc: 'Regain 2d4 + 2 HP. Drinking takes an action; giving one to someone else also takes an action.', use: { dice: '2d4', flat: 2 } },
  { id: 'sending-stone', name: 'Sending Stone', qty: 1, section: 'pockets', desc: 'One of a matched pair. As an action, cast Sending to whoever holds the other stone. After use it cannot be used again until the next dawn. Stones lose their magic if one is destroyed.' },
  { id: 'potion-healing-stash', name: 'Potion of Healing', qty: 1, section: 'stashed', desc: 'Regain 2d4 + 2 HP.', use: { dice: '2d4', flat: 2 } },
  { id: 'potion-greater', name: 'Potion of Greater Healing', qty: 3, section: 'stashed', desc: 'Regain 4d4 + 4 HP. The red liquid glimmers when agitated.', use: { dice: '4d4', flat: 4 } },
  { id: 'dragon-tear-drink', name: 'Dragon-tear fused drink', qty: 1, section: 'stashed', desc: 'Prepared drink with a dragon\'s tear. Effect not recorded.' },
  { id: 'breastplate', name: 'Breastplate', qty: 1, section: 'stashed', desc: 'Medium armor. AC 14 + DEX modifier (max +2) = 16 for Bubu.' },
  { id: 'hand-crossbow', name: 'Hand Crossbow', qty: 1, section: 'stashed', desc: '1d6 piercing. Range 30/120, ammunition, light, loading.' },
  { id: 'incendiary-bolt', name: 'Incendiary Bolt', qty: 9, section: 'stashed', desc: 'Crossbow bolt that deals an extra 1d6 fire damage.' },
  { id: 'silvered-bolt', name: 'Silvered Bolt', qty: 70, section: 'stashed', desc: 'Silvered crossbow bolt.' },
  { id: 'pact-guitar', name: 'Pact Guitar', qty: 1, section: 'stashed', desc: 'Bubu\'s instrument.' },
  { id: 'lyre-of-building', name: 'Lyre of Building', qty: 1, section: 'stashed', desc: 'Wondrous item, rare, needs a Bard to attune. Holding it: cast Mending. Reaction: when an object or structure you can see within 300 ft takes damage, it becomes immune to that damage type until the start of your next turn. Action: cast Fabricate, Move Earth, Passwall or Summon Construct (each once until dawn).' },
  { id: 'teleport-collar', name: 'Weasel-sized teleport collar', qty: 1, section: 'stashed', desc: 'Teleport collar small enough for a weasel.' },
  { id: 'zombie-beholder-eye', name: 'Zombie Beholder Eye', qty: 1, section: 'stashed', desc: 'A preserved, eerie eye from a zombie beholder. Latent magical and necrotic energy; valuable for alchemy, spellcraft or display.' },
  { id: 'platinum-nugget', name: 'Platinum nugget', qty: 1, section: 'stashed', desc: 'Roughly 5–15 gp.' },
  { id: 'brewers-supplies', name: 'Brewer\'s Supplies', qty: 1, section: 'stashed', desc: 'Tool proficiency.' },
  { id: 'instruments', name: 'Lute, pipes, percussion', qty: 1, section: 'stashed', desc: 'Musical instruments.' },
  { id: 'elegant-clothes', name: 'Elegant dresses', qty: 4, section: 'stashed', desc: '12 gp each.' },
  { id: 'wine', name: 'Demijohns of fine wine', qty: 2, section: 'stashed', desc: '25 gp each.' },
  { id: 'silk', name: 'Silk', qty: 1, section: 'stashed', desc: '' },
  { id: 'owlbear-plush', name: 'Owlbear plush', qty: 1, section: 'stashed', desc: '' },
  { id: 'owl-bits', name: 'Owl talon, beak and feathers', qty: 1, section: 'stashed', desc: 'Trophies.' },
  { id: 'meenlock-shears', name: 'Meenlock shears', qty: 4, section: 'stashed', desc: '' },
  { id: 'rotting-meat', name: 'Rotting meat', qty: 2, section: 'stashed', desc: '' },
  { id: 'dead-mouse', name: 'Dead mouse', qty: 1, section: 'stashed', desc: '' },
  { id: 'mining-books', name: 'Mining textbooks', qty: 1, section: 'stashed', desc: '' },
];

function trackers() {
  const out = {};
  for (const f of FEATURES) if (f.uses) out[f.key] = { cur: f.uses.max, max: f.uses.max, rest: f.uses.rest };
  return out;
}

export function defaultState() {
  return {
    v: 1,
    hp: { cur: 36, max: 36, temp: 2 },
    ac: 'street',
    hitDice: { cur: 6, max: 6 }, // d8s: 5 Bard + 1 Warlock
    slots: {
      bard: { 1: { cur: 4, max: 4 }, 2: { cur: 3, max: 3 }, 3: { cur: 2, max: 2 } },
      pact: { level: 1, cur: 1, max: 1 },
    },
    features: trackers(),
    concentration: null,
    skillMisc: Object.fromEntries(Object.entries(CHAR.skills).map(([k, v]) => [k, v.misc])),
    coin: { pp: 0, gp: 80, sp: 0, cp: 0 },
    inventory: ITEMS.map((i) => ({ ...i })),
    notes: [],
    npcs: [],
  };
}
