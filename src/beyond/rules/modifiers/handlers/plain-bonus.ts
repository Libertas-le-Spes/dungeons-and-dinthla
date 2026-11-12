import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";
import type { ModifierTally } from "../modifier-tally";

export class PlainBonus implements ModifierHandler {
  constructor(private readonly subTypes: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "bonus") return false;
    if (modifier.value === null) return false;
    if (!Number.isInteger(modifier.value)) return false;
    return this.subTypes.includes(modifier.subType.text);
  }

  applyTo(tally: ModifierTally, modifier: RuleModifier): void {
    if (modifier.value === null) return;
    tally.add(modifier.value, modifier.sourceName.text);
  }
}
