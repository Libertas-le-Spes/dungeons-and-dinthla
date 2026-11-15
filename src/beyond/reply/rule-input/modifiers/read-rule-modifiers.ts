import { MODIFIER_COUNT } from "../../../shape/import-limits";
import type { RuleModifier } from "../../../rules/input/rule-modifier";
import type { JsonReader } from "../../json/json-reader";
import { classOwnersOf } from "./class-owners";
import { ClassSource } from "./class-source";
import { ItemSource } from "./item-source";
import { ListedSource } from "./listed-source";
import { namesASubType } from "./modifier-entry";
import { backgroundNamesOf, classNamesOf, featNamesOf, raceNamesOf } from "./modifier-names";
import type { ModifierSource } from "./modifier-source";
import { unreadableArmourOf } from "../items/unreadable-armour";

function sourcesOf(data: JsonReader): readonly ModifierSource[] {
  return [
    new ListedSource("race", raceNamesOf(data)),
    new ClassSource(classNamesOf(data), classOwnersOf(data)),
    new ListedSource("background", backgroundNamesOf(data)),
    ItemSource.of(data),
    new ListedSource("feat", featNamesOf(data)),
    new ListedSource("condition", new Map()),
  ];
}

function modifiersFrom(lists: JsonReader, source: ModifierSource): readonly RuleModifier[] {
  return lists
    .listAt(source.key, MODIFIER_COUNT)
    .filter(namesASubType)
    .filter((entry) => source.keeps(entry))
    .map((entry) => source.modifierOf(entry));
}

export function ruleModifiersOf(data: JsonReader): readonly RuleModifier[] {
  const lists = data.readerAt("modifiers");
  const found: RuleModifier[] = [];
  for (const source of sourcesOf(data)) found.push(...modifiersFrom(lists, source));
  return [...found, ...unreadableArmourOf(data)];
}
