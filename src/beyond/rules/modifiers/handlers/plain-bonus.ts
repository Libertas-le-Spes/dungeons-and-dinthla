import type { NumberRange } from "../../../shape/number-range";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";
import type { ModifierTally } from "../modifier-tally";

export class PlainBonus implements ModifierHandler {
  constructor(
    private readonly subTypes: readonly string[],
    private readonly allowed: NumberRange,
  ) {}

  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "bonus") return false;
    if (modifier.value === null) return false;
    if (!Number.isSafeInteger(modifier.value)) return false;
    if (modifier.value < this.allowed.lowest) return false;
    if (modifier.value > this.allowed.highest) return false;
    return this.subTypes.includes(modifier.subType.text);
  }

  applyTo(tally: ModifierTally, modifier: RuleModifier): void {
    if (modifier.value === null) return;
    tally.add(modifier.value, modifier.sourceName.text);
  }
}
