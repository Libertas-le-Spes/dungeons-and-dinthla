import { sameName } from "../../core/same-name";
import type { RuleModifier } from "../../input/rule-modifier";
import type { ModifierHandler } from "../modifier-handler";

export class IgnoredSources implements ModifierHandler {
  constructor(private readonly sources: readonly string[]) {}

  handles(modifier: RuleModifier): boolean {
    for (const source of this.sources) {
      if (sameName(source, modifier.sourceName.text)) return true;
    }
    return false;
  }

  applyTo(): void {}
}
