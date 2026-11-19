import { Refusal } from "../../../beyond/shape/refusal";
import { characterCountOf } from "../../../beyond/shape/character-count";
import { neutralLineOf } from "./neutral-line";

export const MOST_DEPARTURE = 80;

export const NO_DEPARTURE = "Write what happened to them first, such as Stayed behind at the abbey.";

export function departureTooLong(): Refusal {
  return new Refusal(`What happened to them is over ${MOST_DEPARTURE} characters.`);
}

export function departureNotOneLine(): Refusal {
  return new Refusal("What happened to them has to be one line.");
}

export interface DepartureWords {
  readonly written: string;
  readonly snapshot: string;
}

export function departureWordsOf(typed: string): DepartureWords {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Refusal(NO_DEPARTURE);
  if (characterCountOf(trimmed) > MOST_DEPARTURE) throw departureTooLong();
  const line = neutralLineOf(trimmed);
  if (line === null) throw departureNotOneLine();
  return { written: trimmed, snapshot: line };
}
