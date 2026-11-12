export type NoteChange = "changed" | "made" | "trashed";

export interface WrittenNote {
  change: NoteChange;
  path: string;
  text: string | null;
}

export type WrittenListener = (written: WrittenNote) => void;

export class WrittenNotes {
  constructor(private readonly listeners: Set<WrittenListener>) {}

  listen(listener: WrittenListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export class NoteReporter {
  private readonly listeners = new Set<WrittenListener>();
  readonly notes = new WrittenNotes(this.listeners);

  changed(path: string, text: string | null): void {
    this.tell({ change: "changed", path, text });
  }

  made(path: string): void {
    this.tell({ change: "made", path, text: null });
  }

  trashed(path: string): void {
    this.tell({ change: "trashed", path, text: null });
  }

  private tell(written: WrittenNote): void {
    for (const listener of this.listeners) this.tellOne(listener, written);
  }

  private tellOne(listener: WrittenListener, written: WrittenNote): void {
    try {
      listener(written);
    } catch {
      return;
    }
  }
}
