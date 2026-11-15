import type { NumberRange } from "../../../shape/number-range";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";
import type { ModifierTally } from "../modifier-tally";

export class SetFloor implements ModifierHandler {
  constructor(
    private readonly subType: string,
    private readonly allowed: NumberRange,
  ) {}

  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "set") return false;
    if (modifier.subType.text !== this.subType) return false;
    if (modifier.restriction.trim() !== "") return false;
    if (typeof modifier.value !== "number") return false;
    if (modifier.value < this.allowed.lowest) return false;
    return modifier.value <= this.allowed.highest;
  }

  applyTo(tally: ModifierTally, modifier: RuleModifier): void {
    tally.noteFloor(Number(modifier.value), modifier.sourceName.text);
  }
}
