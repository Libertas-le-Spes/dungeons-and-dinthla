import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class NotApplyingNow implements ModifierHandler {
  handles(modifier: RuleModifier): boolean {
    return !modifier.appliesNow;
  }

  applyTo(): void {}
}
