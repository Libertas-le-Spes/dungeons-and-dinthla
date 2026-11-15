import { CleanLine } from "../../text/clean-line";
import type { JsonReader } from "../json/json-reader";

const ALIGNMENTS = new Map<number, string>([
  [1, "Lawful good"],
  [2, "Neutral good"],
  [3, "Chaotic good"],
  [4, "Lawful neutral"],
  [5, "Neutral"],
  [6, "Chaotic neutral"],
  [7, "Lawful evil"],
  [8, "Neutral evil"],
  [9, "Chaotic evil"],
]);

export function alignmentOf(data: JsonReader): CleanLine | null {
  const id = data.numberAt("alignmentId");
  if (id === null) return null;
  const name = ALIGNMENTS.get(id);
  if (name === undefined) return null;
  return CleanLine.of(name);
}
