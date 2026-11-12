import { NotKnownValue } from "../../shape/not-known-value";
import type { Route } from "../../shape/route";
import type { EarlierNumbers } from "./earlier-numbers";

export function unknownAmong(names: readonly string[], earlier: EarlierNumbers, route: Route): NotKnownValue<number> | null {
  for (const name of names) {
    const value = earlier.valueOf(name, route);
    if (!value.isKnown) return new NotKnownValue(`It needs ${name}, which is not known: ${value.explanation}`, route);
  }
  return null;
}
