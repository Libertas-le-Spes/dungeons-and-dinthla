import { FEATURE_COUNT } from "../../shape/import-limits";
import type { JsonReader } from "../json/json-reader";
import { definitionNameOf } from "./definition-name";

export function featuresOf(data: JsonReader): readonly string[] {
  return data.listAt("feats", FEATURE_COUNT).map(definitionNameOf);
}
