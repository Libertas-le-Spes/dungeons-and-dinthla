import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class IgnoredTypes implements ModifierHandler {
  constructor(private readonly types: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    return this.types.includes(modifier.type);
  }

  applyTo(): void {}
}
