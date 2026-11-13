import type { TFile } from "obsidian";
import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import { kindNoteLines } from "./kind-note-lines";
import { kindNotePathOf } from "./kind-note-path";
import { kindNoteFolders } from "./sources/kind-note-sources";
import type { WantedNote } from "./wanted-note";

export interface WantedSession {
  path: string;
  file: TFile | null;
  note: SessionNote | null;
}

function linesOf(campaign: Campaign, session: WantedSession, folder: string): string[] {
  if (session.note === null) return [];
  return kindNoteLines(campaign, session.note, folder);
}

export function wantedNotesFor(campaignFolder: string, campaign: Campaign, session: WantedSession): WantedNote[] {
  return kindNoteFolders().map((folder) => ({
    path: kindNotePathOf(campaignFolder, folder, session.path),
    folder,
    sessionPath: session.path,
    sessionFile: session.file,
    lines: linesOf(campaign, session, folder),
  }));
}
