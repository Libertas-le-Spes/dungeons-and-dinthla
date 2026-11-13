import { wantedKeyOf, type WantedNote } from "../wanting/wanted-note";

export class NoteMemos {
  private readonly wanted = new Map<string, WantedNote>();
  private readonly settled = new Map<string, string>();
  private readonly failed = new Map<string, string>();
  private readonly waiting = new Set<string>();

  want(note: WantedNote): void {
    this.wanted.set(note.path, note);
    this.settled.delete(note.path);
    if (this.failed.get(note.path) !== wantedKeyOf(note)) this.failed.delete(note.path);
  }

  wantedAt(path: string): WantedNote | undefined {
    return this.wanted.get(path);
  }

  isDone(path: string, key: string): boolean {
    return this.failed.get(path) === key || this.settled.get(path) === key;
  }

  isSettled(note: WantedNote): boolean {
    return this.settled.get(note.path) === wantedKeyOf(note);
  }

  settle(path: string, key: string): void {
    this.settled.set(path, key);
  }

  fail(path: string, key: string): void {
    this.failed.set(path, key);
  }

  waitForRead(path: string): void {
    this.waiting.add(path);
  }

  stopWaiting(path: string): boolean {
    return this.waiting.delete(path);
  }
}
