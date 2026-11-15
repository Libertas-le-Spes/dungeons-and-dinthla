import type { NamedOnLines } from "./named-on-lines";

export const LINES_FOR_A_NOTE = 3;

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
