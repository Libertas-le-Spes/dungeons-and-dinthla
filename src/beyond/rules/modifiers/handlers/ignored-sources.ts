import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class IgnoredSources implements ModifierHandler {
  constructor(private readonly sources: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    return this.sources.includes(modifier.sourceName.text);
  }

  applyTo(): void {}
}
