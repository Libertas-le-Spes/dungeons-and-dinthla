import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";
import type { ModifierTally } from "../modifier-tally";

export class ConditionalSubTypes implements ModifierHandler {
  constructor(private readonly subTypes: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    return this.subTypes.includes(modifier.subType.text);
  }

  applyTo(tally: ModifierTally, modifier: RuleModifier): void {
    tally.noteConditional(modifier.sourceName.text);
  }
}
