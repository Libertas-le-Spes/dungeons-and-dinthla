import type { SessionNote } from "../../campaign/record/campaign";
import type { FencedFiles, GoneFile } from "../../fence/gate/fenced-files";
import type { SessionWants, WantedStore } from "../wanting/session-wants";
import { HeldTexts } from "./held-texts";
import type { SavesHere } from "./saves-here";
import type { TypingPauses } from "./typing-pauses";

export type EditorTexts = (path: string) => string[];

export interface SavedInEditor {
  sessionSavedInEditor(path: string): void;
}

export interface EditorSavesNeeds {
  files: Pick<FencedFiles, "on" | "offref">;
  store: Pick<WantedStore, "sessionNotes">;
  wants: Pick<SessionWants, "isSession">;
  saves: Pick<SavesHere, "savedInEditor" | "forget">;
  editorTexts: EditorTexts;
  pauses: Pick<TypingPauses, "onPause">;
}

function textReadAt(notes: SessionNote[], path: string): string | null {
  for (const note of notes) {
    if (note.path === path) return note.text;
  }
  return null;
}

export class EditorSaves {
  private readonly pausedTexts = new HeldTexts();
  private readonly typedSaves = new HeldTexts();
  private readonly typedReads = new HeldTexts();

  constructor(private readonly needs: EditorSavesNeeds) {}

  start(saved: SavedInEditor): () => void {
    const files = this.needs.files;
    const events = [files.on("modify", this.modified.bind(this)), files.on("delete", this.deleted.bind(this)), files.on("rename", this.renamed.bind(this))];
    const stopPauses = this.needs.pauses.onPause(this.paused.bind(this, saved));
    function stop(): void {
      for (const event of events) files.offref(event);
      stopPauses();
    }
    return stop;
  }

  readWhileTyping(path: string, text: string): boolean {
    const typed = this.typedSaves.takeIfHeld(path, text);
    if (typed) this.typedReads.hold(path, text);
    return typed;
  }

  forgetTyping(path: string): void {
    this.typedSaves.forget(path);
    this.typedReads.forget(path);
  }

  private paused(saved: SavedInEditor, path: string, text: string): void {
    if (!this.needs.wants.isSession(path)) return;
    this.pausedTexts.hold(path, text);
    if (this.typedReads.takeIfHeld(path, text)) {
      saved.sessionSavedInEditor(path);
      return;
    }
    if (!this.typedSaves.holds(path, text)) return;
    this.typedSaves.forget(path);
    this.needs.saves.savedInEditor(path, text);
  }

  private modified(file: GoneFile): void {
    const path = file.path;
    if (!this.needs.wants.isSession(path)) return;
    const read = textReadAt(this.needs.store.sessionNotes, path);
    for (const text of this.needs.editorTexts(path)) this.editorSaved(path, text, read);
  }

  private editorSaved(path: string, text: string, read: string | null): void {
    if (text === read) return;
    if (this.pausedTexts.holds(path, text)) {
      this.needs.saves.savedInEditor(path, text);
      return;
    }
    this.typedSaves.hold(path, text);
  }

  private deleted(file: GoneFile): void {
    this.forget(file.path);
  }

  private renamed(_file: GoneFile, oldPath: string): void {
    this.forget(oldPath);
  }

  private forget(path: string): void {
    this.pausedTexts.forget(path);
    this.forgetTyping(path);
    this.needs.saves.forget(path);
  }
}
