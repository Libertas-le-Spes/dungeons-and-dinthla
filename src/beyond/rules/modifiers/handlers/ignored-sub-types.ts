import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class IgnoredSubTypes implements ModifierHandler {
  constructor(private readonly subTypes: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    return this.subTypes.includes(modifier.subType.text);
  }

  applyTo(): void {}
}
