import { INVENTORY_COUNT } from "../../../shape/import-limits";
import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { definitionNameOf } from "../../parts/definition-name";
import { armourKindOf } from "./armour-kind-of";
import { unreadableModifierOf } from "../modifiers/unreadable-modifier";

const ARMOUR_CLASS_SUB_TYPE = CleanLine.of("armor-class");

function isWornUnreadably(entry: JsonReader): boolean {
  if (!entry.booleanAt("equipped")) return false;
  return armourKindOf(entry.readerAt("definition")) === undefined;
}

function modifierOf(entry: JsonReader): RuleModifier {
  return unreadableModifierOf(ARMOUR_CLASS_SUB_TYPE, definitionNameOf(entry));
}

export function unreadableArmourOf(data: JsonReader): readonly RuleModifier[] {
  return data.listAt("inventory", INVENTORY_COUNT).filter(isWornUnreadably).map(modifierOf);
}
