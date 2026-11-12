import { knownNumber } from "../core/worked";
import type { WorkedValue } from "../../shape/worked-value";
import type { RuleCharacter } from "../input/rule-character";
import type { PerLevelSource } from "./per-level-source";

export class FeaturePerLevel implements PerLevelSource {
  constructor(
    readonly sourceName: string,
    private readonly perLevel: number,
  ) {}

  addition(character: RuleCharacter, totalLevel: number): WorkedValue<number> | null {
    if (!character.features.includes(this.sourceName)) return null;
    return knownNumber(this.perLevel * totalLevel, `${this.sourceName} ${this.perLevel} x ${totalLevel}`, character.route);
  }
}
