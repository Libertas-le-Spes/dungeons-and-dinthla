import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import { sessionNumberOf } from "../../campaign/paths/session-file";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { WantedNote } from "./wanted-note";
import { wantedNotesFor } from "./wanted-notes";

export interface WantedStore {
  readonly current: Campaign;
  readonly sessionNotes: SessionNote[];
  readonly campaignFolder: string | null;
  readonly opening: boolean;
}

function heldNote(note: SessionNote | undefined): SessionNote | null {
  if (note === undefined) return null;
  return note;
}

export class SessionWants {
  constructor(
    private readonly store: WantedStore,
    private readonly files: Pick<FencedFiles, "getFileByPath">,
  ) {}

  get campaignFolder(): string | null {
    return this.store.campaignFolder;
  }

  get opening(): boolean {
    return this.store.opening;
  }

  isSession(path: string): boolean {
    const folder = this.store.campaignFolder;
    if (folder === null) return false;
    return sessionNumberOf(path, folder) !== null;
  }

  sessionPaths(): string[] {
    return this.store.sessionNotes.map((session) => session.path);
  }

  notesFor(path: string): WantedNote[] {
    const folder = this.store.campaignFolder;
    if (folder === null || this.store.opening) return [];
    const note = this.store.sessionNotes.find((session) => session.path === path);
    return wantedNotesFor(folder, this.store.current, { path, file: this.files.getFileByPath(path), note: heldNote(note) });
  }

  notesOfGoneSession(path: string): WantedNote[] {
    const folder = this.store.campaignFolder;
    if (folder === null) return [];
    return wantedNotesFor(folder, this.store.current, { path, file: null, note: null });
  }
}
