import { nameTextOf } from "../../text/name-text";
import type { JsonReader } from "../json/json-reader";

export function nameOf(data: JsonReader): string {
  return nameTextOf(data.textAt("name"));
}

export function speciesOf(data: JsonReader): string {
  return nameTextOf(data.readerAt("race").textAt("fullName"));
}
