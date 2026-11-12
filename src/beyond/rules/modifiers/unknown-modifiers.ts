import { NotKnownValue } from "../../shape/not-known-value";
import type { Route } from "../../shape/route";
import type { ModifierTally } from "./modifier-tally";

function quoted(name: string): string {
  return `"${name}"`;
}

export function unknownModifiers(tally: ModifierTally, route: Route): NotKnownValue<number> | null {
  if (tally.unknown.length === 0) return null;
  return new NotKnownValue(`D&D Beyond names a rule I can't work out here: ${tally.unknown.map(quoted).join(", ")}. Type it on your note to set it.`, route);
}
