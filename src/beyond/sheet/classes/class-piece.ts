import { CLASS_LEVEL } from "../../shape/import-limits";
import type { ImportedClass } from "../../shape/imported-class";
import { NotKnownValue } from "../../shape/not-known-value";
import { numberInRange } from "../../shape/number-in-range";
import type { WorkedValue } from "../../shape/worked-value";
import { hasLetterOrDigit } from "../lines/letter-or-digit";
import { lineOrNothing } from "../lines/line-or-nothing";
import { PRINTED } from "../printed-route";

const LEVEL_AT_END = /\s+(?<level>\d+)$/;
const NO_LEVEL = "The sheet gives no level after this class.";

function levelOf(piece: string): WorkedValue<number> {
  const level = LEVEL_AT_END.exec(piece)?.groups?.level;
  if (level === undefined) return new NotKnownValue<number>(NO_LEVEL, PRINTED);
  return numberInRange(Number(level), CLASS_LEVEL, "", PRINTED);
}

export function classOfPiece(piece: string): ImportedClass | null {
  const trimmed = piece.trim();
  const name = lineOrNothing(trimmed.replace(LEVEL_AT_END, ""));
  if (name === null) return null;
  if (!hasLetterOrDigit(name.text)) return null;
  return { name, level: levelOf(trimmed) };
}
