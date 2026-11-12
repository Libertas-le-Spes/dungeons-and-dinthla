import { kindNoteTitleOf } from "./kind-note-path";
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
    private readonly ask: AskAboutDifference,
  ) {}

  check(notes: WantedNote[]): void {
    for (const note of notes) this.checkOne(note);
  }

  forget(notes: WantedNote[]): void {
    for (const note of notes) this.asked.delete(note.path);
  }

  private checkOne(note: WantedNote): void {
    const key = wantedKeyOf(note);
    if (this.asked.get(note.path) === key || !this.keeper.isOutOfStep(note)) return;
    this.asked.set(note.path, key);
    this.ask(differsMessage(note), () => this.keeper.keep([note]), leaveAsItIs);
  }
}
