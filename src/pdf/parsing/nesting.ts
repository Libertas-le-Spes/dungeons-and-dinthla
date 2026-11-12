import { MAX_NESTING } from "../limits/pdf-limits";
import { PdfRefusal } from "../refusals/pdf-refusal";

export function levelInside(depth: number): number {
  const level = depth + 1;
  if (level > MAX_NESTING) throw new PdfRefusal("The file nests lists or groups too deeply, so it was not read.");
  return level;
}
