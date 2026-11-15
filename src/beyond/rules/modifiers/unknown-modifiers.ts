import { notKnown } from "../core/worked";
import { shortList } from "../core/working-text";
import type { NotKnownValue } from "../../shape/not-known-value";
import type { Route } from "../../shape/route";
import type { ModifierTally } from "./modifier-tally";

function quoted(name: string): string {
  return `"${name}"`;
}

export function unknownModifiers(tally: ModifierTally, route: Route): NotKnownValue<number> | null {
  if (tally.unknown.length === 0) return null;
  return notKnown(`Unread rule ${shortList(tally.unknown.map(quoted))}.`, route);
}
