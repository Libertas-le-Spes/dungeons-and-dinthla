import type { EditorStep } from "../../src/interface/takeover/editor-step";

export class FakeEditorStep implements EditorStep {
  readonly asked: (string | null)[] = [];
  readonly opened: string[] = [];

  constructor(private readonly notes: string[]) {}

  noteOf(path: string | null): string | null {
    this.asked.push(path);
    if (path === null || !this.notes.includes(path)) return null;
    return path;
  }

  open(path: string): void {
    this.opened.push(path);
  }
}
