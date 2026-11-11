import { RunningSaves } from "./running-saves";

export type WriteDraft = (path: string, draft: string) => Promise<string>;

export type DraftListener = (path: string) => void;

export type DraftsChanged = () => void;

export class Drafts {
  private readonly texts: Map<string, string>;
  private readonly saves = new RunningSaves();
  private readonly listeners = new Set<DraftListener>();

  constructor(
    kept: Record<string, string>,
    private readonly changed: DraftsChanged,
  ) {
    this.texts = new Map(Object.entries(kept));
  }

  textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) return "";
    return text;
  }

  all(): Record<string, string> {
    return Object.fromEntries(this.texts);
  }

  keys(): string[] {
    return Array.from(this.texts.keys());
  }

  keep(path: string, text: string): void {
    if (this.textOf(path) === text) return;
    if (text === "") this.texts.delete(path);
    else this.texts.set(path, text);
    this.changed();
    this.tell(path);
  }

  moved(oldPath: string, path: string): void {
    this.saves.moved(oldPath, path);
    const text = this.texts.get(oldPath);
    if (text === undefined) return;
    this.texts.delete(oldPath);
    this.texts.set(path, text);
    this.changed();
  }

  setAside(path: string, key: string): void {
    if (!this.texts.has(path)) return;
    this.moved(path, key);
    this.tell(path);
    this.tell(key);
  }

  isSaving(path: string): boolean {
    return this.saves.isRunning(path);
  }

  subscribe(listener: DraftListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async save(path: string, write: WriteDraft): Promise<boolean> {
    const run = this.saves.start(path);
    if (run === null) return false;
    this.tell(path);
    try {
      const left = await write(path, this.textOf(path));
      this.keep(run.path, left);
      return true;
    } finally {
      this.saves.finish(run);
      this.tell(run.path);
    }
  }

  private tell(path: string): void {
    for (const listener of this.listeners) listener(path);
  }
}
