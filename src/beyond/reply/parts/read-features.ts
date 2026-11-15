import { FEATURE_COUNT } from "../../shape/import-limits";
import { limitedList } from "../../shape/limited-list";
import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";
import { ruleFeaturesOf } from "../rule-input/features/read-rule-features";
import { uniqueLines } from "./unique-lines";

function lineOf(name: string): CleanLine {
  return CleanLine.of(name);
}

export function featuresOf(data: JsonReader): readonly CleanLine[] {
  return uniqueLines(limitedList(ruleFeaturesOf(data).map(lineOf), FEATURE_COUNT));
}
