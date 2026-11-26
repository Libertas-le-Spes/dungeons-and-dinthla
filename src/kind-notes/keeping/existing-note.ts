import type { NoteFacts } from "../../host/notes/note-facts";
import type { NoteRef } from "../../host/notes/note-ref";
import { linesIn, sameLines, sessionPropertyIn } from "../../note-keeping/note-properties";
import type { WantedNote } from "../wanting/wanted-note";
import { linksToSession, type LinkMetadata } from "./session-link";

export interface ExistingMetadata {
  readonly links: LinkMetadata;
  readonly facts: Pick<NoteFacts, "propertiesOf">;
}

export type ExistingNote = { read: false } | { read: true; linked: boolean; alreadyThere: boolean };

export function readExistingNote(metadata: ExistingMetadata, file: NoteRef, note: WantedNote): ExistingNote {
  const properties = metadata.facts.propertiesOf(file);
  if (properties === null) return { read: false };
  const session = { path: note.sessionPath, file: note.sessionFile };
  return {
    read: true,
    linked: linksToSession(metadata.links, sessionPropertyIn(properties), note.path, session),
    alreadyThere: sameLines(linesIn(properties), note.lines),
  };
}

export function isOutOfStep(existing: ExistingNote): boolean {
  return existing.read && existing.linked && !existing.alreadyThere;
}
