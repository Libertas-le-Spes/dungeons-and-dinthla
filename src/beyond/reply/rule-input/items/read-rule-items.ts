import { INVENTORY_COUNT } from "../../../shape/import-limits";
import type { ArmourKind } from "../../../rules/input/armour/armour-kind";
import { NotArmour } from "../../../rules/input/armour/not-armour";
import type { RuleItem } from "../../../rules/input/rule-item";
import type { JsonReader } from "../../json/json-reader";
import { definitionNameOf } from "../../parts/definition-name";
import { armourKindOf } from "./armour-kind-of";
import { numericOf } from "../body/numeric-of";

function strengthRequiredOf(definition: JsonReader): number {
  if (definition.holdsNothingAt("strengthRequirement")) return 0;
  return numericOf(definition.numberAt("strengthRequirement"));
}

function armourOf(kind: ArmourKind | undefined): ArmourKind {
  if (kind === undefined) return new NotArmour();
  return kind;
}

function itemOf(entry: JsonReader): RuleItem {
  const definition = entry.readerAt("definition");
  const kind = armourKindOf(definition);
  return {
    name: definitionNameOf(entry),
    equipped: entry.booleanAt("equipped"),
    attuned: entry.booleanAt("isAttuned"),
    needsAttunement: definition.booleanAt("canAttune"),
    armour: armourOf(kind),
    armourClass: numericOf(definition.numberAt("armorClass")),
    strengthRequired: strengthRequiredOf(definition),
  };
}

export function ruleItemsOf(data: JsonReader): readonly RuleItem[] {
  return data.listAt("inventory", INVENTORY_COUNT).map(itemOf);
}
