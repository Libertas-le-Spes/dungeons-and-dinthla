import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class NotInForce implements ModifierHandler {
  handles(modifier: RuleModifier): boolean {
    return !modifier.inForce;
  }

  applyTo(): void {}
}
