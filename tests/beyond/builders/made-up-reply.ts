import { JsonReader } from "../../../src/beyond/reply/json/json-reader";
import { madeUpData } from "./made-up-data";
import { madeUpFighterData } from "./made-up-fighter-data";
import type { Node } from "./made-up-data";

export { BACKSTORY_MARKER, TRAIT_MARKER } from "./made-up-data";

export type Step = string | number;

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
    else parent = Reflect.get(parent, step);
  }
  return { parent, key };
}

export class MadeUpReply {
  private constructor(private readonly data: Node) {}

  static levelOneMonk(): MadeUpReply {
    return new MadeUpReply(madeUpData());
  }

  static levelThreeFighter(): MadeUpReply {
    return new MadeUpReply(madeUpFighterData());
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
