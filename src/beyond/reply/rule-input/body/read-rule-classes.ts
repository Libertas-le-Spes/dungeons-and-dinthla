import { CLASS_COUNT } from "../../../shape/import-limits";
import type { RuleClass } from "../../../rules/input/rule-class";
import type { JsonReader } from "../../json/json-reader";
import { definitionNameOf } from "../../parts/definition-name";
import { numericOf } from "./numeric-of";

function subclassOf(entry: JsonReader): string {
  if (entry.holdsNothingAt("subclassDefinition")) return "";
  return entry.readerAt("subclassDefinition").textAt("name");
}

function ruleClassOf(entry: JsonReader): RuleClass {
  return {
    name: definitionNameOf(entry),
    subclass: subclassOf(entry),
    level: numericOf(entry.numberAt("level")),
    hitDie: numericOf(entry.readerAt("definition").numberAt("hitDice")),
  };
}

export function ruleClassesOf(data: JsonReader): readonly RuleClass[] {
  return data.listAt("classes", CLASS_COUNT).map(ruleClassOf);
}
