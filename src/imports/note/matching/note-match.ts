import { nameKeyOf } from "../../../names/name-key";

export interface NoteName {
  readonly path: string;
  readonly basename: string;
}

interface Ranked {
  readonly note: NoteName;
  readonly shared: number;
  readonly difference: number;
}

const WORD_BREAK = " ";

function wordsOf(name: string): string[] {
  const words: string[] = [];
  for (const word of nameKeyOf(name).split(WORD_BREAK)) {
    if (word !== "") words.push(word);
  }
  return words;
}

function leadingWordsShared(first: readonly string[], second: readonly string[]): number {
  let shared = 0;
  for (const [position, word] of first.entries()) {
    if (second[position] !== word) break;
    shared += 1;
  }
  return shared;
}

function rankOf(wanted: readonly string[], note: NoteName): Ranked | null {
  const noteWords = wordsOf(note.basename);
  const shared = leadingWordsShared(wanted, noteWords);
  if (shared === 0 || shared < Math.min(wanted.length, noteWords.length)) return null;
  return { note, shared, difference: Math.abs(wanted.length - noteWords.length) };
}

function bestFirst(first: Ranked, second: Ranked): number {
  if (first.shared !== second.shared) return second.shared - first.shared;
  if (first.difference !== second.difference) return first.difference - second.difference;
  return first.note.path.localeCompare(second.note.path);
}

export function notesLikeName(name: string, notes: readonly NoteName[]): NoteName[] {
  const wanted = wordsOf(name);
  const ranked: Ranked[] = [];
  for (const note of notes) {
    const rank = rankOf(wanted, note);
    if (rank !== null) ranked.push(rank);
  }
  return ranked.sort(bestFirst).map(noteOf);
}

function noteOf(ranked: Ranked): NoteName {
  return ranked.note;
}
