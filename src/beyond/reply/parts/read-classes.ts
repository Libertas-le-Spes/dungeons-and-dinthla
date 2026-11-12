import type { ImportedClass } from "../../shape/imported-class";
import { CLASS_COUNT, CLASS_LEVEL, TOTAL_LEVEL } from "../../shape/import-limits";
import { NotKnownValue } from "../../shape/not-known-value";
import type { JsonReader } from "../json/json-reader";
import { ONLINE } from "../online-route";
import { noClass } from "../reply-refusals";
import { definitionNameOf } from "./definition-name";
import { numberValueOf } from "./number-value";

function classOf(entry: JsonReader): ImportedClass {
  return { name: definitionNameOf(entry), level: numberValueOf(entry.numberAt("level"), CLASS_LEVEL, "Level") };
}

function addedLevel(total: number, imported: ImportedClass): number {
  return total + imported.level.valueOr(0);
}

function withoutLevel(imported: ImportedClass): ImportedClass {
  return { name: imported.name, level: new NotKnownValue(`${TOTAL_LEVEL.what} has to be at most ${TOTAL_LEVEL.highest}.`, ONLINE) };
}

function withinTotalLevel(classes: readonly ImportedClass[]): readonly ImportedClass[] {
  if (classes.reduce(addedLevel, 0) <= TOTAL_LEVEL.highest) return classes;
  return classes.map(withoutLevel);
}

export function classesOf(data: JsonReader): readonly ImportedClass[] {
  const listed = data.listAt("classes", CLASS_COUNT);
  if (listed.length === 0) throw noClass();
  return withinTotalLevel(listed.map(classOf));
}
