import type { KeptDrafts, NoteExists } from "./kept-drafts";

export function setAsideGoneNotes(keptDrafts: Pick<KeptDrafts, "notesGone">, campaignsFolder: string | null, exists: NoteExists): void {
  if (campaignsFolder === null) return;
  keptDrafts.notesGone(exists);
}
