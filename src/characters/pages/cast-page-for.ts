import type { NoteRef } from "../../host/notes/note-ref";
import { campaignOfReference } from "../../campaign/paths/campaign-folders";
import { isFallenNotePath } from "../../campaign/paths/character-note-path";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import type { SheetNotes } from "../reading/sheet-notes";

export interface CastPages<Page> {
  notes: Pick<SheetNotes, "fileAt" | "campaignFolders">;
  gallery(): Page;
  character(file: NoteRef): Page;
  fallen(file: NoteRef): Page;
}

function characterFileAt<Page>(path: string | null, notes: CastPages<Page>["notes"]): NoteRef | null {
  if (path === null) return null;
  if (campaignOfReference(characterReferenceKind, path, notes.campaignFolders()) === null) return null;
  return notes.fileAt(path);
}

function fallenFileAt<Page>(path: string | null, notes: CastPages<Page>["notes"]): NoteRef | null {
  if (path === null) return null;
  if (!isFallenNotePath(path, notes.campaignFolders())) return null;
  return notes.fileAt(path);
}

export function castPageFor<Page>(path: string | null, pages: CastPages<Page>): Page {
  const fallen = fallenFileAt(path, pages.notes);
  if (fallen !== null) return pages.fallen(fallen);
  const file = characterFileAt(path, pages.notes);
  if (file === null) return pages.gallery();
  return pages.character(file);
}
