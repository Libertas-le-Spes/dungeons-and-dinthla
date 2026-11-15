import type { TFile } from "obsidian";
import type { OwnCharacterNotes } from "../../../src/funds/purses/own-characters";
import { madeUpFile } from "../../characters/imported/builders/made-up-file";
import { HeldCalls } from "../../stubs/held-calls";

export class FakeOwnCharacterNotes implements OwnCharacterNotes {
  readonly reads: string[] = [];
  readonly foldersAsked: string[] = [];
  private readonly listeners: ((path: string) => void)[] = [];
  private failure: Error | null = null;
  private held: HeldCalls<string> | null = null;

  constructor(
    private readonly texts: ReadonlyMap<string, string>,
    private readonly own: readonly string[],
  ) {}

  filesIn(campaignFolder: string): TFile[] {
    this.foldersAsked.push(campaignFolder);
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
    if (this.held !== null) return this.held.hold();
    if (this.failure !== null) throw this.failure;
    const text = this.texts.get(file.path);
    if (text === undefined) throw new Error(`No made-up note at ${file.path}`);
    return text;
  }

  onNoteChanged(changed: (path: string) => void): () => void {
    this.listeners.push(changed);
    return this.stopListening.bind(this);
  }

  holdReads(): HeldCalls<string> {
    const held = new HeldCalls<string>();
    this.held = held;
    return held;
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
