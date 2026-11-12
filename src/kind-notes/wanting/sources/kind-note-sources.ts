import type { KindNoteSource } from "./kind-note-source";
import { coinNoteSource } from "./coin-note-source";
import { itemNoteSource } from "./item-note-source";
import { questNoteSource } from "./quest-note-source";
import { questionNoteSource } from "./question-note-source";

export const KIND_NOTE_SOURCES: KindNoteSource[] = [questionNoteSource, questNoteSource, coinNoteSource, itemNoteSource];

export function kindNoteFolders(): string[] {
  const folders = new Set<string>();
  for (const source of KIND_NOTE_SOURCES) folders.add(source.kind.kindNoteFolder);
  return [...folders];
}
