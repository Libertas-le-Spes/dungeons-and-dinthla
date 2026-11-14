import type { UndecidedName } from "../making/reference-note-plan";

export interface NewNames {
  sessionName: string;
  names: UndecidedName[];
}

export interface NewNamesInput {
  undecided: UndecidedName[];
  savedPath: string;
  sessionName: string;
}

export function newNamesFor({ undecided, savedPath, sessionName }: NewNamesInput): NewNames | null {
  const names = undecided.filter(({ namedIn }) => namedIn.includes(savedPath));
  if (names.length === 0) return null;
  return { sessionName, names };
}
