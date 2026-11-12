import type { TFile } from "obsidian";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import { linesIn, sameLines, sessionPropertyIn } from "../../note-keeping/note-properties";
import type { WantedNote } from "../wanting/wanted-note";
import { linksToSession, type LinkMetadata } from "./session-link";

export type ExistingMetadata = LinkMetadata & Pick<FencedMetadata, "getFileCache">;

export type ExistingNote = { read: false } | { read: true; linked: boolean; alreadyThere: boolean };

export function readExistingNote(metadata: ExistingMetadata, file: TFile, note: WantedNote): ExistingNote {
  const cache = metadata.getFileCache(file);
  if (cache === null) return { read: false };
  const session = { path: note.sessionPath, file: note.sessionFile };
  return {
    read: true,
    linked: linksToSession(metadata, sessionPropertyIn(cache), note.path, session),
    alreadyThere: sameLines(linesIn(cache), note.lines),
  };
}

export function isOutOfStep(existing: ExistingNote): boolean {
  return existing.read && existing.linked && !existing.alreadyThere;
}
