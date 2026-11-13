import type { TFile } from "obsidian";
import type { OwnPurseNotes } from "../../../../src/characters/imported/purse/own-purses";

export function madeUpFile(path: string): TFile {
  const name = path.substring(path.lastIndexOf("/") + 1);
  return { path, basename: name.substring(0, name.length - ".md".length) } as TFile;
}

export class FakePurseNotes implements OwnPurseNotes {
  readonly reads: string[] = [];
  private readonly listeners: ((path: string) => void)[] = [];
  private failure: Error | null = null;

  constructor(
    private readonly texts: ReadonlyMap<string, string>,
    private readonly own: readonly string[],
  ) {}

  filesIn(campaignFolder: string): TFile[] {
    const files: TFile[] = [];
    for (const path of this.texts.keys()) {
      if (path.startsWith(`${campaignFolder}/`)) files.push(madeUpFile(path));
    }
    return files;
  }

  isOwnCharacter(file: TFile): boolean {
    return this.own.includes(file.path);
  }

  async textOf(file: TFile): Promise<string> {
    this.reads.push(file.path);
    if (this.failure !== null) throw this.failure;
    const text = this.texts.get(file.path);
    if (text === undefined) throw new Error(`No made-up note at ${file.path}`);
    return text;
  }

  onNoteChanged(changed: (path: string) => void): () => void {
    this.listeners.push(changed);
    return this.stopListening.bind(this);
  }

  failWith(error: Error): void {
    this.failure = error;
  }

  change(path: string): void {
    for (const listener of this.listeners) listener(path);
  }

  listenerCount(): number {
    return this.listeners.length;
  }

  private stopListening(): void {
    this.listeners.length = 0;
  }
}
