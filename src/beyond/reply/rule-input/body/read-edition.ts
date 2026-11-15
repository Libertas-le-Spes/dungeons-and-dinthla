import { CLASS_COUNT, SOURCE_COUNT } from "../../../shape/import-limits";
import type { Edition } from "../../../rules/input/edition";
import type { JsonReader } from "../../json/json-reader";
import { numericOf } from "./numeric-of";
import { agreedEdition } from "./agreed-edition";

const EDITION_OF_SOURCE: ReadonlyMap<number, Edition> = new Map<number, Edition>([
  [1, "2014"],
  [145, "2024"],
]);

function editionOfSource(source: JsonReader): Edition {
  const found = EDITION_OF_SOURCE.get(numericOf(source.numberAt("sourceId")));
  if (found === undefined) return "not stated";
  return found;
}

function isStated(edition: Edition): boolean {
  return edition !== "not stated";
}

function editionOfClass(classEntry: JsonReader): Edition {
  const sources = classEntry.readerAt("definition").listAtOrEmpty("sources", SOURCE_COUNT);
  return agreedEdition(sources.map(editionOfSource).filter(isStated));
}

export function editionOf(data: JsonReader): Edition {
  return agreedEdition(data.listAt("classes", CLASS_COUNT).map(editionOfClass));
}
