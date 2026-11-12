import { kindNoteTitleOf } from "../wanting/kind-note-path";
import type { SessionWants } from "../wanting/session-wants";
import { wantedKeyOf, type WantedNote } from "../wanting/wanted-note";

export interface DifferingKeeper {
  isOutOfStep(note: WantedNote): boolean;
  keep(notes: WantedNote[]): void;
}

export type AskAboutDifference = (message: string, fix: () => void, keepAsItIs: () => void) => void;

export function differsMessage(note: WantedNote): string {
  return `${kindNoteTitleOf(note.folder, note.sessionPath)} differ from the session.`;
}

function leaveAsItIs(): void {}

interface Differing {
  sessionPath: string;
  note: WantedNote;
  key: string;
}

export function manyDifferMessage(count: number): string {
  return `${count} notes differ from their sessions.`;
}

export class DifferingNotes {
  private readonly asked = new Map<string, string>();

  constructor(
    private readonly keeper: DifferingKeeper,
    private readonly wants: Pick<SessionWants, "notesFor">,
    private readonly ask: AskAboutDifference,
  ) {}

  check(sessionPath: string): void {
    this.askAbout(this.differingIn(sessionPath));
  }

  checkAll(sessionPaths: string[]): void {
    const differing: Differing[] = [];
    for (const sessionPath of sessionPaths) differing.push(...this.differingIn(sessionPath));
    this.askAbout(differing);
  }

  forget(sessionPath: string): void {
    for (const note of this.wants.notesFor(sessionPath)) this.asked.delete(note.path);
  }

  private differingIn(sessionPath: string): Differing[] {
    const differing: Differing[] = [];
    for (const note of this.wants.notesFor(sessionPath)) {
      const key = wantedKeyOf(note);
      if (this.asked.get(note.path) !== key && this.keeper.isOutOfStep(note)) differing.push({ sessionPath, note, key });
    }
    return differing;
  }

  private askAbout(differing: Differing[]): void {
    const [first] = differing;
    if (first === undefined) return;
    for (const one of differing) this.asked.set(one.note.path, one.key);
    const message = this.messageFor(first, differing.length);
    this.ask(message, () => this.fixEach(differing), leaveAsItIs);
  }

  private messageFor(first: Differing, count: number): string {
    if (count === 1) return differsMessage(first.note);
    return manyDifferMessage(count);
  }

  private fixEach(differing: Differing[]): void {
    for (const one of differing) this.fixIfStillSo(one);
  }

  private fixIfStillSo({ sessionPath, note, key }: Differing): void {
    const current = this.wants.notesFor(sessionPath).find((candidate) => candidate.path === note.path);
    if (current === undefined || current.sessionFile === null || wantedKeyOf(current) !== key) return;
    this.keeper.keep([current]);
  }
}
