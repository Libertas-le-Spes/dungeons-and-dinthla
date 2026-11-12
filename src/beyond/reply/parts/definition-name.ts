import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";

export function definitionNameOf(entry: JsonReader): CleanLine {
  return CleanLine.of(entry.readerAt("definition").textAt("name"));
}
