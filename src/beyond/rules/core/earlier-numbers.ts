import type { ImportedNumber } from "../../shape/imported-number";
import { NotKnownValue } from "../../shape/not-known-value";
import type { Route } from "../../shape/route";
import type { WorkedValue } from "../../shape/worked-value";

export class EarlierNumbers {
  private constructor(private readonly found: ReadonlyMap<string, WorkedValue<number>>) {}

  static none(): EarlierNumbers {
    return new EarlierNumbers(new Map());
  }

  withAll(numbers: readonly ImportedNumber[]): EarlierNumbers {
    const next = new Map(this.found);
    for (const number of numbers) next.set(number.name, number.value);
    return new EarlierNumbers(next);
  }

  valueOf(name: string, route: Route): WorkedValue<number> {
    const value = this.found.get(name);
    if (value === undefined) return new NotKnownValue(`${name} has not been worked out.`, route);
    return value;
  }
}
