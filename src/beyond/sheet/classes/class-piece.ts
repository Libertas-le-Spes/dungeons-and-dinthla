import { CLASS_LEVEL, LINE_LENGTH } from "../../shape/import-limits";
import type { ImportedClass } from "../../shape/imported-class";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import { limitedText } from "../../text/limited-text";
import { lineOrNothing } from "../lines/line-or-nothing";
import type { WorkedValue } from "../../shape/worked-value";
import { PRINTED } from "../printed-route";

const LEVEL_AT_END = /\s+\d+$/;
const BEFORE_LEVEL = /^[\s\S]*\s(?=\d+$)/;
const NO_LEVEL = "The sheet gives no level after this class.";

function levelOf(piece: string): WorkedValue<number> {
  if (!LEVEL_AT_END.test(piece)) return new NotKnownValue<number>(NO_LEVEL, PRINTED);
  return numberInRange(Number(piece.replace(BEFORE_LEVEL, "")), CLASS_LEVEL, "", PRINTED);
}

export function classOfPiece(piece: string): ImportedClass | null {
  const trimmed = limitedText(piece, LINE_LENGTH).trim();
  const name = lineOrNothing(trimmed.replace(LEVEL_AT_END, ""));
  if (name === null) return null;
  return { name, level: levelOf(trimmed) };
}
