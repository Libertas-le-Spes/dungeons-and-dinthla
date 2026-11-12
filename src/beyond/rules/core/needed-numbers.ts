import type { NotKnownValue } from "../../shape/not-known-value";
import type { Route } from "../../shape/route";
import { Refusal } from "../../shape/refusal";
import type { EarlierNumbers } from "./earlier-numbers";
import { notKnown } from "./worked";

export class NeededNumbers {
  private constructor(
    readonly missing: NotKnownValue<number> | null,
    private readonly earlier: EarlierNumbers,
    private readonly route: Route,
  ) {}

  static of(names: readonly string[], earlier: EarlierNumbers, route: Route): NeededNumbers {
    return new NeededNumbers(firstMissing(names, earlier, route), earlier, route);
  }

  numberOf(name: string): number {
    const value = this.earlier.valueOf(name, this.route);
    if (!value.isKnown) throw new Refusal(`${name} was used before it was known.`);
    return value.valueOr(0);
  }
}

function firstMissing(names: readonly string[], earlier: EarlierNumbers, route: Route): NotKnownValue<number> | null {
  for (const name of names) {
    const value = earlier.valueOf(name, route);
    if (!value.isKnown) return notKnown(`It needs ${name}, which is not known: ${value.explanation}`, route);
  }
  return null;
}
