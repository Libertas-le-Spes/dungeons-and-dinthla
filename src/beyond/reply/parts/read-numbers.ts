import type { ImportedNumber } from "../../shape/imported-number";
import type { JsonReader } from "../json/json-reader";
import { armourClassNotStated } from "./armour-class-not-stated";
import { hitPointsOf } from "./read-hit-points";

export function numbersOf(data: JsonReader): readonly ImportedNumber[] {
  return [
    { name: "AC", value: armourClassNotStated() },
    { name: "HP", value: hitPointsOf(data) },
  ];
}
