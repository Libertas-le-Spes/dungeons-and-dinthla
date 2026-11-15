import { LINES_FOR_A_NOTE } from "../kinds/lines-for-a-note";
import type { NamedOnLines } from "./named-on-lines";

export interface OftenNamed {
  known: NamedOnLines[];
  undecided: NamedOnLines[];
}

export function oftenNamed(names: NamedOnLines[]): OftenNamed {
  const often = names.filter(({ lineCount }) => lineCount >= LINES_FOR_A_NOTE);
  return {
    known: often.filter(({ kind }) => kind !== null),
    undecided: often.filter(({ kind }) => kind === null),
  };
}
