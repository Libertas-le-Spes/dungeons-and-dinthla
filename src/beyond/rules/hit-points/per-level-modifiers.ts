import type { NotKnownValue } from "../../shape/not-known-value";
import type { RuleCharacter } from "../input/rule-character";
import { IgnoredSources } from "../modifiers/handlers/ignored-sources";
import { NotInForce } from "../modifiers/handlers/not-in-force";
import { SubTypeFamily } from "../modifiers/sub-type-family";
import { tallyModifiers } from "../modifiers/tally-modifiers";
import { unknownModifiers } from "../modifiers/unknown-modifiers";
import { PER_LEVEL_SOURCES } from "./per-level-sources";
import type { PerLevelSource } from "./per-level-source";

const FAMILY = new SubTypeFamily(["hit-points-per-level"], ["hit-points"]);

function sourceNameOf(source: PerLevelSource): string {
  return source.sourceName;
}

export function unfamiliarPerLevelModifier(character: RuleCharacter): NotKnownValue<number> | null {
  const handlers = [new NotInForce(), new IgnoredSources(PER_LEVEL_SOURCES.map(sourceNameOf))];
  return unknownModifiers(tallyModifiers(character.modifiers, FAMILY, handlers), character.route);
}
