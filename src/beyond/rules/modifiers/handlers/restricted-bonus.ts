import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";
import type { ModifierTally } from "../modifier-tally";

export class RestrictedBonus implements ModifierHandler {
  handles(modifier: RuleModifier): boolean {
    if (modifier.type !== "bonus") return false;
    return modifier.restriction.trim() !== "";
  }

  applyTo(tally: ModifierTally, modifier: RuleModifier): void {
    tally.noteConditional(modifier.sourceName.text);
  }
}
