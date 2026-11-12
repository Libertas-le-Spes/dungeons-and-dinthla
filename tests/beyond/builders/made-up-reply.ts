import { JsonReader } from "../../../src/beyond/reply/json/json-reader";

export type Step = string | number;

type Node = Record<string, unknown>;

export const BACKSTORY_MARKER = "Mira grew up beneath the Pale Moon";
export const TRAIT_MARKER = "Primary is always calm";

const SIX = [1, 2, 3, 4, 5, 6];

function scoreList(value: number | null): Node[] {
  return SIX.map((id) => ({ id, value }));
}

function madeUpData(): Node {
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
    inventory: [
      { quantity: 1, definition: { name: "Quarterstaff" } },
      { quantity: 50, definition: { name: "Rope" } },
      { quantity: 3, definition: { name: "Torch" } },
    ],
    currencies: { cp: 5, sp: 4, ep: 0, gp: 15, pp: 1 },
    spells: { race: null, class: null, background: null, item: [{ definition: { name: "Light" } }], feat: null },
    classSpells: [{ spells: [{ definition: { name: "Mage Hand" } }] }],
    feats: [{ definition: { name: "Alert" } }],
    modifiers: { race: [], class: [], background: [], item: [], feat: [], condition: [] },
    notes: { backstory: BACKSTORY_MARKER, allies: "Secondary Monk", enemies: "", organizations: "", otherHoldings: "", otherNotes: "", personalPossessions: "" },
    traits: { personalityTraits: TRAIT_MARKER },
  };
}

interface Place {
  readonly parent: Node;
  readonly key: Step;
}

function placeAt(root: Node, path: readonly Step[]): Place {
  let parent = root;
  let key: Step = "";
  let remaining = path.length;
  for (const step of path) {
    remaining -= 1;
    if (remaining === 0) key = step;
    else parent = Reflect.get(parent, step) as Node;
  }
  return { parent, key };
}

export class MadeUpReply {
  private constructor(private readonly data: Node) {}

  static levelOneMonk(): MadeUpReply {
    return new MadeUpReply(madeUpData());
  }

  with(path: readonly Step[], value: unknown): this {
    const place = placeAt(this.data, path);
    Reflect.set(place.parent, place.key, value);
    return this;
  }

  without(path: readonly Step[]): this {
    const place = placeAt(this.data, path);
    Reflect.deleteProperty(place.parent, place.key);
    return this;
  }

  withHostileKey(path: readonly Step[], key: string): this {
    const place = placeAt(this.data, [...path, key]);
    Object.defineProperty(place.parent, key, { value: { polluted: true }, enumerable: true, configurable: true, writable: true });
    return this;
  }

  reader(): JsonReader {
    return JsonReader.of(this.data);
  }

  bareText(): string {
    return JSON.stringify(this.data);
  }

  wholeText(): string {
    return this.wrappedText(true);
  }

  wrappedText(success: unknown): string {
    return JSON.stringify({ id: 0, success, message: "Wrapped", data: this.data });
  }
}
