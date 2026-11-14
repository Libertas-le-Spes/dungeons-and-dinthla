import { LINES_FOR_A_NOTE } from "../kinds/lines-for-a-note";
import { hasKind, type NamedOnLines, type NamedWithKind } from "./named-on-lines";

export interface OftenNamed {
  known: NamedWithKind[];
  undecided: NamedOnLines[];
}

export function oftenNamed(names: NamedOnLines[]): OftenNamed {
  const often = names.filter(({ lineCount }) => lineCount >= LINES_FOR_A_NOTE);
  return {
    known: often.filter(hasKind),
    undecided: often.filter((named) => !hasKind(named)),
  };
}
