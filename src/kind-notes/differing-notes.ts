import { kindNoteTitleOf } from "./kind-note-path";
import type { SessionWants } from "./session-wants";
import { wantedKeyOf, type WantedNote } from "./wanted-note";

export interface DifferingKeeper {
  isOutOfStep(note: WantedNote): boolean;
  keep(notes: WantedNote[]): void;
}

export type AskAboutDifference = (message: string, fix: () => void, keepAsItIs: () => void) => void;

export function differsMessage(note: WantedNote): string {
  return `${kindNoteTitleOf(note.folder, note.sessionPath)} differ from the session.`;
}

function leaveAsItIs(): void {}

export class DifferingNotes {
  private readonly asked = new Map<string, string>();

  constructor(
    private readonly keeper: DifferingKeeper,
    private readonly wants: Pick<SessionWants, "notesFor">,
    private readonly ask: AskAboutDifference,
  ) {}

  check(sessionPath: string): void {
    for (const note of this.wants.notesFor(sessionPath)) this.checkOne(sessionPath, note);
  }

  forget(sessionPath: string): void {
    for (const note of this.wants.notesFor(sessionPath)) this.asked.delete(note.path);
  }

  private checkOne(sessionPath: string, note: WantedNote): void {
    const key = wantedKeyOf(note);
    if (this.asked.get(note.path) === key || !this.keeper.isOutOfStep(note)) return;
    this.asked.set(note.path, key);
    this.ask(differsMessage(note), () => this.fixIfStillSo(sessionPath, note.path, key), leaveAsItIs);
  }

  private fixIfStillSo(sessionPath: string, notePath: string, key: string): void {
    const current = this.wants.notesFor(sessionPath).find((note) => note.path === notePath);
    if (current === undefined || current.sessionFile === null || wantedKeyOf(current) !== key) return;
    this.keeper.keep([current]);
  }
}
