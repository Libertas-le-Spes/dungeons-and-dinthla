import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";

export function namesASubType(entry: JsonReader): boolean {
  if (entry.holdsNothingAt("subType")) return false;
  return entry.textAt("subType").trim() !== "";
}

function restrictionOf(entry: JsonReader): string {
  if (entry.holdsNothingAt("restriction")) return "";
  return entry.textAt("restriction");
}

export function modifierEntryOf(entry: JsonReader, sourceName: CleanLine, inForce: boolean): RuleModifier {
  return {
    type: entry.textAt("type"),
    subType: CleanLine.of(entry.textAt("subType")),
    value: entry.numberAt("value"),
    restriction: restrictionOf(entry),
    sourceName,
    inForce,
  };
}
