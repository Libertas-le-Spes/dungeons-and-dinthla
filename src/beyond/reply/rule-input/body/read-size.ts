import { MODIFIER_COUNT } from "../../../shape/import-limits";
import type { JsonReader } from "../../json/json-reader";

const SIZE_OF_ID: ReadonlyMap<number, string> = new Map([
  [3, "small"],
  [4, "medium"],
]);

function isSize(entry: JsonReader): boolean {
  if (entry.holdsNothingAt("type")) return false;
  return entry.textAt("type") === "size";
}

function sizeFromId(data: JsonReader): string {
  const id = data.readerAt("race").numberAt("sizeId");
  if (id === null) return "";
  const found = SIZE_OF_ID.get(id);
  if (found === undefined) return "";
  return found;
}

function subTypeOf(entry: JsonReader): string {
  return entry.textAt("subType");
}

export function sizeOf(data: JsonReader): string {
  const names = data.readerAt("modifiers").listAt("race", MODIFIER_COUNT).filter(isSize).map(subTypeOf);
  if (names.length === 0) return sizeFromId(data);
  if (names.length > 1) return "";
  return names.join("");
}
