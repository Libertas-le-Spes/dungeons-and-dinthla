import { CLASS_COUNT, SPELL_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import type { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";
import { definitionNameOf } from "./definition-name";
import { uniqueLines } from "./unique-lines";

const SPELL_SOURCES = ["race", "class", "background", "item", "feat"];

function namesOf(entries: readonly JsonReader[]): readonly CleanLine[] {
  return entries.map(definitionNameOf);
}

function namesFromSources(data: JsonReader): CleanLine[] {
  const sources = data.readerAt("spells");
  const found: CleanLine[] = [];
  for (const source of SPELL_SOURCES) {
    if (sources.isNullAt(source)) continue;
    found.push(...namesOf(sources.listAt(source, SPELL_COUNT)));
  }
  return found;
}

function namesFromClasses(data: JsonReader): CleanLine[] {
  const found: CleanLine[] = [];
  for (const classEntry of data.listAt("classSpells", CLASS_COUNT)) {
    found.push(...namesOf(classEntry.listAt("spells", SPELL_COUNT)));
  }
  return found;
}

export function spellsOf(data: JsonReader): readonly CleanLine[] {
  return uniqueLines(limitedList([...namesFromSources(data), ...namesFromClasses(data)], SPELL_COUNT));
}
