import type { NoteStore } from "../../host/notes/note-store";

export type FolderLookup = Pick<NoteStore, "hasFolder">;

export function campaignsFolderThere(saved: string | null, files: FolderLookup): string | null {
  if (saved === null) return null;
  if (!files.hasFolder(saved)) return null;
  return saved;
}
