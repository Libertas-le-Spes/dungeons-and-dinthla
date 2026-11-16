import type { SessionNote } from "../../campaign/record/campaign";
import type { FencedFiles, GoneFile } from "../../fence/gate/fenced-files";
import type { SessionWants, WantedStore } from "../wanting/session-wants";
import type { SavesHere } from "./saves-here";

export type EditorTexts = (path: string) => string[];

export interface EditorSavesNeeds {
  files: Pick<FencedFiles, "on" | "offref">;
  store: Pick<WantedStore, "sessionNotes">;
  wants: Pick<SessionWants, "isSession">;
  saves: Pick<SavesHere, "saved">;
  editorTexts: EditorTexts;
}

function textReadAt(notes: SessionNote[], path: string): string | null {
  for (const note of notes) {
    if (note.path === path) return note.text;
  }
  return null;
}

export class EditorSaves {
  constructor(private readonly needs: EditorSavesNeeds) {}

  start(): () => void {
    const files = this.needs.files;
    const event = files.on("modify", this.modified.bind(this));
    function stop(): void {
      files.offref(event);
    }
    return stop;
  }

  private modified(file: GoneFile): void {
    const path = file.path;
    if (!this.needs.wants.isSession(path)) return;
    const read = textReadAt(this.needs.store.sessionNotes, path);
    for (const text of this.needs.editorTexts(path)) this.keepIfChanged(path, text, read);
  }

  private keepIfChanged(path: string, text: string, read: string | null): void {
    if (text === read) return;
    this.needs.saves.saved(path, text);
  }
}
