import type { ImportedNumber } from "../../shape/imported-number";
import { workedOut } from "../../rules/worked-out";
import type { JsonReader } from "../json/json-reader";
import { ruleInputsOf } from "./rule-inputs-of";
import { withDoubts } from "./with-doubts";

export function workedNumbersOf(data: JsonReader): readonly ImportedNumber[] {
  const inputs = ruleInputsOf(data);
  return withDoubts(workedOut(inputs.character), inputs);
}
