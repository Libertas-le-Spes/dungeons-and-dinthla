export interface WrittenListener {
  textSaved(path: string, text: string): void;
  trashed(path: string): void;
  renamed(from: string, to: string): void;
}

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

  textSaved(path: string, text: string): void {
    this.tell((listener) => listener.textSaved(path, text));
  }

  trashed(path: string): void {
    this.tell((listener) => listener.trashed(path));
  }

  renamed(from: string, to: string): void {
    this.tell((listener) => listener.renamed(from, to));
  }

  private tell(tellOne: (listener: WrittenListener) => void): void {
    for (const listener of this.listeners) this.tryOne(listener, tellOne);
  }

  private tryOne(listener: WrittenListener, tellOne: (listener: WrittenListener) => void): void {
    try {
      tellOne(listener);
    } catch {
      return;
    }
  }
}
