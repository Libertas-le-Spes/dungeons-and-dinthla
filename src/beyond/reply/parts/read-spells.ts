import { CLASS_COUNT, SPELL_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import type { JsonReader } from "../json/json-reader";
import { definitionNameOf } from "./definition-name";

const SPELL_SOURCES = ["race", "class", "background", "item", "feat"];

function namesOf(entries: readonly JsonReader[]): readonly string[] {
  return entries.map(definitionNameOf);
}

function namesFromSources(data: JsonReader): string[] {
  const sources = data.readerAt("spells");
  const found: string[] = [];
  for (const source of SPELL_SOURCES) {
    if (sources.isNullAt(source)) continue;
    found.push(...namesOf(sources.listAt(source, SPELL_COUNT)));
  }
  return found;
}

function namesFromClasses(data: JsonReader): string[] {
  const found: string[] = [];
  for (const classEntry of data.listAt("classSpells", CLASS_COUNT)) {
    found.push(...namesOf(classEntry.listAt("spells", SPELL_COUNT)));
  }
  return found;
}

export function spellsOf(data: JsonReader): readonly string[] {
  return limitedList([...namesFromSources(data), ...namesFromClasses(data)], SPELL_COUNT);
}
