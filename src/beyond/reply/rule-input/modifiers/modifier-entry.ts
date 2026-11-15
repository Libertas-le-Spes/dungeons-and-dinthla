import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import { ABILITY_IDS } from "../scores/ability-ids";
import type { JsonReader } from "../../json/json-reader";

export function namesASubType(entry: JsonReader): boolean {
  if (entry.holdsNothingAt("subType")) return false;
  return entry.textAt("subType").trim() !== "";
}

function restrictionOf(entry: JsonReader): string {
  if (entry.holdsNothingAt("restriction")) return "";
  return entry.textAt("restriction");
}

function abilityOf(entry: JsonReader): string {
  const id = entry.numberAt("statId");
  const found = ABILITY_IDS.find((candidate) => candidate.id === id);
  if (found === undefined) return "";
  return found.ability.short;
}

export function modifierEntryOf(entry: JsonReader, sourceName: CleanLine, inForce: boolean): RuleModifier {
  return {
    type: entry.textAt("type"),
    subType: CleanLine.of(entry.textAt("subType")),
    value: entry.numberAt("value"),
    restriction: restrictionOf(entry),
    ability: abilityOf(entry),
    sourceName,
    inForce,
  };
}
