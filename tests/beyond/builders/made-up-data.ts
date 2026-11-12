export type Node = Record<string, unknown>;

export const BACKSTORY_MARKER = "Mira grew up beneath the Pale Moon";
export const TRAIT_MARKER = "Primary is always calm";

const SIX = [1, 2, 3, 4, 5, 6];

function scoreList(value: number | null): Node[] {
  return SIX.map((id) => ({ id, value }));
}

function named(name: string, quantity: number): Node {
  return { quantity, definition: { name } };
}

function definedAs(name: string): Node {
  return { definition: { name } };
}

export function madeUpData(): Node {
  return {
    id: 4242,
    name: "Primary Monk",
    race: { fullName: "Human" },
    classes: [{ level: 1, definition: { name: "Monk" } }],
    stats: scoreList(10),
    bonusStats: scoreList(null),
    overrideStats: scoreList(null),
    baseHitPoints: 12,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    inventory: [named("Quarterstaff", 1), named("Rope", 50), named("Torch", 3)],
    currencies: { cp: 5, sp: 4, ep: 0, gp: 15, pp: 1 },
    spells: { race: null, class: null, background: null, item: [definedAs("Light")], feat: null },
    classSpells: [{ spells: [definedAs("Mage Hand")] }],
    feats: [definedAs("Alert")],
    modifiers: { race: [], class: [], background: [], item: [], feat: [], condition: [] },
    notes: { backstory: BACKSTORY_MARKER, allies: "Secondary Monk", enemies: "", organizations: "", otherHoldings: "", otherNotes: "", personalPossessions: "" },
    traits: { personalityTraits: TRAIT_MARKER },
  };
}
