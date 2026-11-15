import { FEATURE_COUNT } from "../../../shape/import-limits";
import type { JsonReader } from "../../json/json-reader";

export function classFeaturesOf(classEntry: JsonReader): readonly JsonReader[] {
  return classEntry.listAtOrEmpty("classFeatures", FEATURE_COUNT);
}
