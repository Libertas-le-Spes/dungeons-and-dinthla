import type { RuleCharacter } from "../input/rule-character";
import { notKnown } from "./worked";
import { shortList } from "./working-text";
import type { NotKnownValue } from "../../shape/not-known-value";

export class FeatureTouching {
  constructor(
    private readonly names: readonly string[],
    private readonly reason = "may change this value and is not worked out here",
  ) {}

  named(character: RuleCharacter): readonly string[] {
    const found: string[] = [];
    for (const name of this.names) {
      if (isPresentIn(character, name)) found.push(name);
    }
    return found;
  }

  unknownFor(character: RuleCharacter): NotKnownValue<number> | null {
    const found = this.named(character);
    if (found.length === 0) return null;
    return notKnown(`${shortList(found)} ${this.reason}.`, character.route);
  }
}

function isPresentIn(character: RuleCharacter, name: string): boolean {
  if (character.species === name) return true;
  if (character.features.includes(name)) return true;
  for (const ruleClass of character.classes) {
    if (ruleClass.name.text === name) return true;
  }
  return false;
}
