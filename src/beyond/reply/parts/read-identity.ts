import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";

export function nameOf(data: JsonReader): CleanLine {
  return CleanLine.of(data.textAt("name"));
}

export function speciesOf(data: JsonReader): CleanLine {
  return CleanLine.of(data.readerAt("race").textAt("fullName"));
}
