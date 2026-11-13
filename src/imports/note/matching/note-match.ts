import { nameKeyOf } from "../../../names/name-key";

export interface NoteName {
  readonly path: string;
  readonly basename: string;
}

interface Ranked<T extends NoteName> {
  readonly note: T;
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
  const others = second.values();
  let shared = 0;
  for (const word of first) {
    const other = others.next();
    if (other.done === true || other.value !== word) break;
    shared += 1;
  }
  return shared;
}

function rankOf<T extends NoteName>(wanted: readonly string[], note: T): Ranked<T> | null {
  const noteWords = wordsOf(note.basename);
  const shared = leadingWordsShared(wanted, noteWords);
  if (shared === 0 || shared < Math.min(wanted.length, noteWords.length)) return null;
  return { note, shared, difference: Math.abs(wanted.length - noteWords.length) };
}

function bestFirst<T extends NoteName>(first: Ranked<T>, second: Ranked<T>): number {
  if (first.shared !== second.shared) return second.shared - first.shared;
  if (first.difference !== second.difference) return first.difference - second.difference;
  return first.note.path.localeCompare(second.note.path);
}

export function notesLikeName<T extends NoteName>(name: string, notes: readonly T[]): T[] {
  const wanted = wordsOf(name);
  const ranked: Ranked<T>[] = [];
  for (const note of notes) {
    const rank = rankOf(wanted, note);
    if (rank !== null) ranked.push(rank);
  }
  const found: T[] = [];
  for (const best of ranked.sort(bestFirst)) found.push(best.note);
  return found;
}
