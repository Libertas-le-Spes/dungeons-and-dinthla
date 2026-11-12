import { nameTextOf } from "../../text/name-text";
import type { JsonReader } from "../json/json-reader";

export function definitionNameOf(entry: JsonReader): string {
  return nameTextOf(entry.readerAt("definition").textAt("name"));
}
