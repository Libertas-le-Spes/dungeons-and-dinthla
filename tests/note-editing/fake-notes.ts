import { vi } from "vitest";
import type { TAbstractFile, TFile, Vault } from "obsidian";
import type { Gate } from "../../src/fence/gatekeeper";
import { noteTextsOf, type NoteTexts } from "../../src/campaign/reading/note-texts";

export type NotesVault = Pick<Vault, "getFileByPath" | "process" | "read">;

type ChangedListener = (file: TFile, text: string) => void;

type GoneListener = (file: TAbstractFile) => void;

export const BOM = "\uFEFF";

function readByObsidian(disk: string): string {
  if (!disk.startsWith(BOM)) return disk;
  return disk.substring(BOM.length);
}

export class FakeNotes {
  text: string | null;
  private file: TFile;
  readonly changedListeners = new Set<ChangedListener>();
  readonly goneListeners = new Set<GoneListener>();
  readonly writes: string[] = [];
  private readGate: Promise<void> = Promise.resolve();
  readonly process = vi.fn(async (_file: TFile, change: (now: string) => string) => {
    const now = String(this.text);
    const changed = change(now);
    if (changed !== now) this.writes.push(changed);
    this.text = changed;
    return changed;
  });
  readonly read = vi.fn(async () => {
    await this.readGate;
    return readByObsidian(String(this.text));
  });

  constructor(
    private readonly path: string,
    text: string | null,
  ) {
    this.text = text;
    this.file = { path } as TFile;
  }

  get texts(): NoteTexts {
    return noteTextsOf(this.gate);
  }

  get vault(): NotesVault {
    return { getFileByPath: (path: string) => this.fileAt(path), process: this.process, read: this.read } as unknown as NotesVault;
  }

  makeAgain(text: string): void {
    this.file = { path: this.path } as TFile;
    this.text = text;
  }

  holdRead(): () => void {
    let release = () => {};
    this.readGate = new Promise<void>((resolve) => {
      release = resolve;
    });
    return () => release();
  }

  changeElsewhere(text: string, path = this.path): void {
    this.text = text;
    for (const listener of this.changedListeners) listener({ path } as TFile, text);
  }

  deleteNote(path = this.path): void {
    this.text = null;
    for (const listener of this.goneListeners) listener({ path } as TAbstractFile);
  }

  private fileAt(path: string): TFile | null {
    if (this.text === null || path !== this.path) return null;
    return this.file;
  }

  private get gate(): Gate {
    const metadataCache = {
      on: (_name: string, listener: ChangedListener) => this.listen(this.changedListeners, listener),
      offref: (listener: ChangedListener) => this.changedListeners.delete(listener),
    };
    const vault = {
      getFileByPath: (path: string) => this.fileAt(path),
      read: this.read,
      on: (_name: string, listener: GoneListener) => this.listen(this.goneListeners, listener),
      offref: (listener: GoneListener) => this.goneListeners.delete(listener),
    };
    return { metadata: metadataCache, files: vault } as unknown as Gate;
  }

  private listen<T>(listeners: Set<T>, listener: T): T {
    listeners.add(listener);
    return listener;
  }
}
